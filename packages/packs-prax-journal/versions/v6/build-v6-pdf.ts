/**
 * build-v6-pdf.ts — Prax Journal v6 build pipeline
 *
 * Reads every page in `pages/*.html` (sorted by NN- prefix), renders each
 * to A4 via headless Chromium (Playwright), then concatenates them into a
 * single master PDF at `output/v6-prax-journal.pdf` ready for AirDrop into
 * Goodnotes on iPad.
 *
 * Wave 14: seeded random content injection. At build time, pages with the
 * marker tokens `{{HEADER_CONTENT}}` and/or `{{FOOTER_CONTENT}}` get a randomly
 * selected item from `content-library/pool.json` rendered into them. Selection
 * is seeded by SOURCE_DATE_EPOCH (default 20260529) — same seed → same PDF
 * byte-for-byte. Different seed → different rotation.
 *
 * Run from anywhere:
 *   pnpm tsx packages/packs-prax-journal/versions/v6/build-v6-pdf.ts
 *   # or
 *   npx tsx build-v6-pdf.ts   (when cd'd into v6/)
 */

import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PAGES_DIR     = path.join(__dirname, 'pages');
const OUTPUT_DIR    = path.join(__dirname, 'output');
const OUTPUT_PDF    = path.join(OUTPUT_DIR, 'v6-prax-journal.pdf');
const POOL_PATH     = path.join(__dirname, 'content-library', 'pool.json');

const DEFAULT_SEED  = 20260529;

// ─────────────────────────────────────────────────────────────────────────────
// Wave 14 — content library + seeded PRNG
// ─────────────────────────────────────────────────────────────────────────────

interface PoolItem {
  id: string;
  category: string;
  text: string;
  attribution: string | null;
  max_chars?: number;
}

type Category = 'adhd-cope' | 'anxiety-ground' | 'cbt-microlesson' | 'therapeutic-quote';
const CATEGORIES: Category[] = ['adhd-cope', 'anxiety-ground', 'cbt-microlesson', 'therapeutic-quote'];

const ROTATING_CSS = `
.rotating-header {
  position: absolute;
  top: 12mm;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono, 'JetBrains Mono', 'SF Mono', monospace);
  font-size: 7.5pt;
  color: rgba(31, 33, 38, 0.30);
  letter-spacing: 0.02em;
  max-width: 140mm;
  text-align: center;
  z-index: 5;
}
.rotating-header .he-mark {
  font-family: var(--font-display, 'Fraunces', 'Iowan Old Style', serif);
  font-style: italic;
  margin: 0 6px;
  opacity: 0.7;
}
.rotating-footer {
  position: absolute;
  bottom: 18mm;
  right: 22mm;
  font-family: var(--font-display, 'Fraunces', 'Iowan Old Style', serif);
  font-style: italic;
  font-size: 8pt;
  color: rgba(31, 33, 38, 0.35);
  text-align: right;
  max-width: 110mm;
  z-index: 5;
}
.rotating-footer .ft-attribution {
  font-style: normal;
  opacity: 0.7;
}
`;

/**
 * mulberry32 — 32-bit deterministic PRNG.
 * https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick an integer in [0, n) from the rng. */
function pickInt(rng: () => number, n: number): number {
  return Math.floor(rng() * n);
}

/** Group pool items by category. */
function groupByCategory(items: PoolItem[]): Record<string, PoolItem[]> {
  const out: Record<string, PoolItem[]> = {};
  for (const it of items) {
    if (!out[it.category]) out[it.category] = [];
    out[it.category].push(it);
  }
  // Sort each bucket by id so ordering is stable across pool edits that don't
  // change membership — critical for byte-stable seeded output.
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => a.id.localeCompare(b.id, 'en'));
  }
  return out;
}

/** Escape text content destined for HTML. (No raw HTML in pool.json.) */
function htmlEscape(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHeaderHtml(item: PoolItem): string {
  return [
    `<div class="rotating-header" data-category="${htmlEscape(item.category)}" data-id="${htmlEscape(item.id)}">`,
    `  <span class="he-mark">·</span>`,
    `  <span class="he-text">${htmlEscape(item.text)}</span>`,
    `  <span class="he-mark">·</span>`,
    `</div>`,
  ].join('\n');
}

function renderFooterHtml(item: PoolItem): string {
  if (item.category === 'therapeutic-quote' && item.attribution) {
    return [
      `<div class="rotating-footer" data-category="therapeutic-quote" data-id="${htmlEscape(item.id)}">`,
      `  <span class="ft-text">${htmlEscape(item.text)}</span>`,
      `  <span class="ft-attribution"> — ${htmlEscape(item.attribution)}</span>`,
      `</div>`,
    ].join('\n');
  }
  return [
    `<div class="rotating-footer" data-category="${htmlEscape(item.category)}" data-id="${htmlEscape(item.id)}">`,
    `  <span class="ft-text">${htmlEscape(item.text)}</span>`,
    `</div>`,
  ].join('\n');
}

interface InjectionStats {
  headerByCategory: Record<string, number>;
  footerByCategory: Record<string, number>;
  usedHeaderIds: Set<string>;
  usedFooterIds: Set<string>;
  pagesWithInjection: number;
}

function newStats(): InjectionStats {
  return {
    headerByCategory: { 'adhd-cope': 0, 'anxiety-ground': 0, 'cbt-microlesson': 0, 'therapeutic-quote': 0 },
    footerByCategory: { 'adhd-cope': 0, 'anxiety-ground': 0, 'cbt-microlesson': 0, 'therapeutic-quote': 0 },
    usedHeaderIds: new Set<string>(),
    usedFooterIds: new Set<string>(),
    pagesWithInjection: 0,
  };
}

/**
 * Inject rotating header/footer into a page if it has marker tokens.
 * Mutates and returns the html string. Updates stats in-place.
 *
 * If `byCategory` is empty (pool failed to load), markers are left intact and
 * a warning is logged. The build still produces a valid PDF.
 */
function injectRotatingContent(
  html: string,
  rng: () => number,
  byCategory: Record<string, PoolItem[]>,
  stats: InjectionStats,
  fileName: string,
): string {
  const hasHeader = html.includes('{{HEADER_CONTENT}}');
  const hasFooter = html.includes('{{FOOTER_CONTENT}}');
  if (!hasHeader && !hasFooter) return html;

  // Inject the rotating CSS exactly once into the page's first </style>.
  // If no <style> tag exists, append a new one inside <head>.
  if (html.includes('</style>')) {
    html = html.replace('</style>', ROTATING_CSS + '</style>');
  } else if (html.includes('</head>')) {
    html = html.replace('</head>', `<style>${ROTATING_CSS}</style></head>`);
  }

  const poolReady = CATEGORIES.every(c => Array.isArray(byCategory[c]) && byCategory[c].length > 0);
  if (!poolReady) {
    console.warn(`[build-v6]   ⚠ pool.json missing or incomplete — leaving markers in ${fileName}`);
    return html;
  }

  // Per-page deterministic category pair: header_idx in [0,4), footer_idx
  // in (header_idx + 1 + [0,3)) mod 4 → guaranteed different from header.
  const headerIdx = pickInt(rng, 4);
  const footerIdx = (headerIdx + 1 + pickInt(rng, 3)) % 4;
  const headerCat = CATEGORIES[headerIdx];
  const footerCat = CATEGORIES[footerIdx];

  if (hasHeader) {
    const bucket = byCategory[headerCat];
    const item = bucket[pickInt(rng, bucket.length)];
    html = html.replaceAll('{{HEADER_CONTENT}}', renderHeaderHtml(item));
    stats.headerByCategory[headerCat] = (stats.headerByCategory[headerCat] ?? 0) + 1;
    stats.usedHeaderIds.add(item.id);
  }

  if (hasFooter) {
    const bucket = byCategory[footerCat];
    const item = bucket[pickInt(rng, bucket.length)];
    html = html.replaceAll('{{FOOTER_CONTENT}}', renderFooterHtml(item));
    stats.footerByCategory[footerCat] = (stats.footerByCategory[footerCat] ?? 0) + 1;
    stats.usedFooterIds.add(item.id);
  }

  if (hasHeader || hasFooter) stats.pagesWithInjection += 1;
  return html;
}

async function loadPool(): Promise<{ items: PoolItem[]; byCategory: Record<string, PoolItem[]> }> {
  try {
    const raw = await fs.readFile(POOL_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    // Pool may be:
    //   - a top-level array: [{...}, {...}]
    //   - `{ items: [...] }`
    //   - `{ categories: { 'adhd-cope': [...], ... } }` (contract schema)
    let items: PoolItem[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (Array.isArray(parsed.items)) {
      items = parsed.items;
    } else if (parsed.categories && typeof parsed.categories === 'object') {
      // Stamp the category key onto each item so downstream byCategory works.
      for (const [cat, list] of Object.entries(parsed.categories)) {
        if (!Array.isArray(list)) continue;
        for (const it of list as any[]) {
          items.push({ ...it, category: it.category ?? cat });
        }
      }
    }
    if (!Array.isArray(items) || items.length === 0) {
      console.warn(`[build-v6] pool.json present but empty — rotation disabled`);
      return { items: [], byCategory: {} };
    }
    return { items, byCategory: groupByCategory(items) };
  } catch (err: any) {
    if (err && err.code === 'ENOENT') {
      console.warn(`[build-v6] content-library/pool.json not found — rotation disabled (markers left intact)`);
    } else {
      console.warn(`[build-v6] failed to load pool.json (${err?.message ?? err}) — rotation disabled`);
    }
    return { items: [], byCategory: {} };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing pipeline (modified to thread injection through render)
// ─────────────────────────────────────────────────────────────────────────────

interface PageRender {
  file: string;
  bytes: Uint8Array;
}

async function listHtmlPages(): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(PAGES_DIR);
  } catch (err) {
    throw new Error(`pages/ directory not found at ${PAGES_DIR}. Build aborted.`);
  }
  const html = entries.filter(f => f.endsWith('.html')).sort((a, b) => a.localeCompare(b, 'en'));
  if (html.length === 0) {
    throw new Error(`No .html files found in ${PAGES_DIR}. Nothing to build.`);
  }
  return html;
}

async function renderPage(
  browser: Browser,
  file: string,
  rng: () => number,
  byCategory: Record<string, PoolItem[]>,
  stats: InjectionStats,
): Promise<PageRender> {
  let html = await fs.readFile(path.join(PAGES_DIR, file), 'utf-8');

  // Wave 14: inject rotating content (no-op if no markers / pool missing).
  html = injectRotatingContent(html, rng, byCategory, stats, file);

  const page = await browser.newPage();

  // setContent with a file:// base URL so relative assets (fonts, css) resolve.
  const baseUrl = `file://${PAGES_DIR}/`;
  await page.goto(baseUrl); // anchor the URL
  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for web fonts (Fraunces / Instrument Sans / JetBrains Mono).
  // Goodnotes import preserves typography, so we let the fonts load fully.
  await page.evaluate(async () => {
    if (typeof (document as any).fonts !== 'undefined') {
      await (document as any).fonts.ready;
    }
  });

  const bytes = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });

  await page.close();
  return { file, bytes };
}

async function concatPdfs(renders: PageRender[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const r of renders) {
    const src = await PDFDocument.load(r.bytes);
    const copied = await merged.copyPages(src, src.getPageIndices());
    for (const p of copied) merged.addPage(p);
  }
  // Strip non-deterministic metadata for reproducible builds.
  merged.setTitle('Prax Journal v6');
  merged.setAuthor('Prax');
  merged.setProducer('build-v6-pdf.ts (pdf-lib)');
  merged.setCreator('Prax Journal');
  if (process.env.SOURCE_DATE_EPOCH) {
    const epoch = Number(process.env.SOURCE_DATE_EPOCH);
    if (Number.isFinite(epoch)) {
      const fixed = new Date(epoch * 1000);
      merged.setCreationDate(fixed);
      merged.setModificationDate(fixed);
    }
  }
  return merged.save({ useObjectStreams: false });
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Seed: SOURCE_DATE_EPOCH if set + finite, else DEFAULT_SEED.
  const envEpoch = process.env.SOURCE_DATE_EPOCH ? Number(process.env.SOURCE_DATE_EPOCH) : NaN;
  const seed = Number.isFinite(envEpoch) ? Math.floor(envEpoch) : DEFAULT_SEED;
  const rng = mulberry32(seed);
  console.log(`[build-v6] seed: ${seed}${Number.isFinite(envEpoch) ? ' (from SOURCE_DATE_EPOCH)' : ' (default)'}`);

  const { items: poolItems, byCategory } = await loadPool();
  if (poolItems.length > 0) {
    const counts = CATEGORIES.map(c => `${c}=${(byCategory[c] ?? []).length}`).join(' ');
    console.log(`[build-v6] content library: loaded ${poolItems.length} items (${counts})`);
  }

  const stats = newStats();
  const files = await listHtmlPages();
  console.log(`[build-v6] rendering ${files.length} page(s) from ${path.relative(process.cwd(), PAGES_DIR)}`);

  const browser = await chromium.launch();
  const renders: PageRender[] = [];
  try {
    for (const file of files) {
      const t0 = Date.now();
      const r = await renderPage(browser, file, rng, byCategory, stats);
      const ms = Date.now() - t0;
      console.log(`  · ${file}  ${(r.bytes.byteLength / 1024).toFixed(1)} KB  (${ms}ms)`);
      renders.push(r);
    }
  } finally {
    await browser.close();
  }

  const merged = await concatPdfs(renders);
  await fs.writeFile(OUTPUT_PDF, merged);

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n[build-v6] ✓ ${path.relative(process.cwd(), OUTPUT_PDF)}`);
  console.log(`           ${(merged.byteLength / 1024).toFixed(1)} KB · ${renders.length} pages · ${elapsed}s`);

  if (poolItems.length > 0) {
    console.log(
      `[build-v6] content library: loaded ${poolItems.length} items, used ` +
      `${stats.usedHeaderIds.size} headers / ${stats.usedFooterIds.size} footers ` +
      `across ${stats.pagesWithInjection} pages`
    );
    console.log(`[build-v6] header categories used: ${JSON.stringify(stats.headerByCategory)}`);
    console.log(`[build-v6] footer categories used: ${JSON.stringify(stats.footerByCategory)}`);
  } else {
    console.log(`[build-v6] content library: not loaded — markers (if any) left intact`);
  }
}

main().catch((err) => {
  console.error('[build-v6] failed:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
