/**
 * assemble-bundles.ts — Prax Journal v6 master + section bundles + per-page split
 *
 * Reuses the already-built clean v6 master (output/v6-prax-journal.pdf, 34 pages,
 * all markers injected, no token leaks) and assembles:
 *
 *   output/master/prax-master-journal.pdf
 *       = "What this is" TOC page  +  34 v6 pages  +  Dates page  +  7 v5 pages
 *         (v5 {{TOKENS}} blanked to writable underscores → no raw HTML shown)
 *
 *   output/bundles/{spine,shelf,weekly,monthly,homework,reference,bonus}.pdf
 *       = v6 pages sliced by NN- filename-prefix section map
 *
 *   output/per-page/page-NN-<slug>.pdf
 *       = every page of the master as its own single-page PDF
 *
 * Run:
 *   1. pnpm tsx build-v6-pdf.ts          (produce the clean v6 master first)
 *   2. pnpm tsx assemble-bundles.ts      (this script)
 */

import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const V6_DIR = __dirname;
const V6_PAGES = path.join(V6_DIR, 'pages');
// Use the v6-design-language restyled v5 pages (NOT the raw v5 HTML, which uses
// a clashing newspaper/Rx aesthetic + inlined base64 fonts). Generate them with
// `pnpm tsx build-v5-restyled.ts` before running this script.
const V5_DIR = path.join(V6_DIR, 'pages-v5restyled');

const OUT = path.join(V6_DIR, 'output');
const V6_MASTER_PDF = path.join(OUT, 'v6-prax-journal.pdf');
const MASTER_DIR = path.join(OUT, 'master');
const BUNDLE_DIR = path.join(OUT, 'bundles');
const PERPAGE_DIR = path.join(OUT, 'per-page');

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Instrument+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;

// v5 individual pages (NOT combined.html — that is the all-in-one duplicate).
const V5_PAGES = ['today.html', 'midday.html', 'reflect.html', 'brain-dump.html', 'weekly.html', 'monthly.html', 'quarterly.html'];

// Section map by NN- filename prefix (handles 12-...left, 21a, 21b → 12, 21).
function sectionOf(file: string): string | null {
  const m = file.match(/^(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n >= 1 && n <= 3) return 'spine';
  if (n >= 4 && n <= 11) return 'shelf';
  if (n === 12) return 'weekly';
  if (n === 13 || n === 14) return 'monthly';
  if (n >= 15 && n <= 20) return 'homework';
  if (n >= 21 && n <= 24) return 'reference';
  if (n >= 25 && n <= 28) return 'bonus';
  return null; // 00 cover → not in a section bundle
}

const SECTION_ORDER = ['spine', 'shelf', 'weekly', 'monthly', 'homework', 'reference', 'bonus'] as const;

// ── A4 page wrapper for generated pages (TOC + Dates) ───────────────────────
function a4Page(inner: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${FONTS_LINK}<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#E4DFD2}
:root{--ink:#1f2126;--quiet:#6E6658;--whisper:#B5AD9F;--sage:#4E6249;--clay:#c08866;
  --serif:'Fraunces','Iowan Old Style','Charter','Georgia',serif;
  --sans:'Instrument Sans',-apple-system,'Inter','Helvetica Neue',sans-serif;
  --mono:'JetBrains Mono','SF Mono','Menlo',monospace;}
.page{width:210mm;height:297mm;background:#F6EFE2;margin:10mm auto;padding:24mm 22mm;
  position:relative;overflow:hidden;box-shadow:0 1px 2px rgba(42,40,36,.04),0 8px 32px rgba(42,40,36,.08);
  page-break-after:always;font-family:var(--serif);color:var(--ink);-webkit-font-smoothing:antialiased}
.bind{position:absolute;left:0;top:0;height:100%;width:6mm;background:rgba(192,136,102,.22);pointer-events:none}
@media print{body{background:#fff}.page{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 portrait;margin:0}}
</style></head><body><main class="page"><div class="bind" aria-hidden="true"></div>${inner}</main></body></html>`;
}

function tocPage(): string {
  const rows = [
    ['spine', 'every-day spine', 'the morning anchor · brain dump · evening close', 'pp 1–3'],
    ['shelf', 'opt-in pages', 'pull what fits today; skip what doesn\u2019t', 'pp 4–11'],
    ['weekly', 'weekly review', 'a spread for the week — no forms', 'pp 12'],
    ['monthly', 'monthly close', 'a letter to yourself + a light identity check', 'pp 13–14'],
    ['homework', 'shreya\u2019s homework packet', 'pick one. the other can wait.', 'pp 15–20'],
    ['reference', 'reference', 'stickers · this page · crisis card · stock-up', 'pp 21–24'],
    ['bonus', 'pomodoro & resets', 'focus timers · midday reset · quarterly witness', 'pp 25–28'],
  ];
  const list = rows.map(([k, title, sub, pp]) => `
    <div style="display:grid;grid-template-columns:34mm 1fr auto;gap:6mm;align-items:baseline;padding:5mm 0;border-bottom:.4pt solid rgba(31,33,38,.12)">
      <div style="font-family:var(--mono);font-size:8pt;letter-spacing:.16em;text-transform:uppercase;color:var(--sage)">${k}</div>
      <div><div style="font-family:var(--serif);font-style:italic;font-size:15pt;line-height:1.15">${title}</div>
        <div style="font-family:var(--sans);font-size:9.5pt;color:var(--quiet);margin-top:1.5mm">${sub}</div></div>
      <div style="font-family:var(--mono);font-size:8pt;color:var(--whisper)">${pp}</div>
    </div>`).join('');
  return a4Page(`
    <header style="margin-bottom:10mm">
      <div style="font-family:var(--mono);font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:var(--whisper)">prax journal · v6</div>
      <h1 style="font-family:var(--serif);font-style:italic;font-weight:400;font-size:34pt;line-height:1.05;margin-top:4mm;letter-spacing:-.01em">what this is.</h1>
      <p style="font-family:var(--sans);font-size:11pt;line-height:1.5;color:var(--quiet);max-width:140mm;margin-top:5mm">
        A journal you don\u2019t have to finish. Start with the spine. Pull from the shelf only what fits the day.
        Skip whatever doesn\u2019t. Nothing here is owed.</p>
    </header>
    <section>${list}</section>
    <footer style="position:absolute;bottom:16mm;left:22mm;right:22mm;font-family:var(--sans);font-size:9pt;color:var(--whisper);font-style:italic">
      v5 daily / weekly / monthly / quarterly pages follow the dates index at the back.</footer>`);
}

function datesPage(): string {
  const line = (label: string) => `
    <div style="display:grid;grid-template-columns:48mm 1fr;gap:6mm;align-items:baseline;padding:4.5mm 0;border-bottom:.4pt solid rgba(31,33,38,.14)">
      <div style="font-family:var(--mono);font-size:8.5pt;letter-spacing:.06em;color:var(--quiet)">${label}</div>
      <div style="font-family:var(--serif);font-size:13pt;color:rgba(31,33,38,.3)">&nbsp;</div></div>`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rows = months.map(m => line(`${m}  ·  started`)).join('');
  return a4Page(`
    <header style="margin-bottom:9mm">
      <div style="font-family:var(--mono);font-size:8pt;letter-spacing:.2em;text-transform:uppercase;color:var(--whisper)">index</div>
      <h1 style="font-family:var(--serif);font-style:italic;font-weight:400;font-size:30pt;margin-top:4mm">dates.</h1>
      <p style="font-family:var(--sans);font-size:10.5pt;color:var(--quiet);margin-top:4mm;max-width:140mm">
        Write the date you opened each month. No streaks. No catching up. Just a quiet record that you showed up at all.</p>
    </header>
    <section>${rows}</section>`);
}

function blankV5Tokens(html: string): string {
  // Replace every {{TOKEN}} with inert writable underscores → no raw braces render.
  return html.replace(/\{\{[^}]+\}\}/g, '________');
}

async function renderHtmlToPdf(browser: Browser, html: string, baseDir: string): Promise<Uint8Array> {
  const page = await browser.newPage();
  await page.goto(`file://${baseDir}/`);
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    if (typeof (document as any).fonts !== 'undefined') await (document as any).fonts.ready;
  });
  const bytes = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true });
  await page.close();
  return bytes;
}

async function pdfFromBytes(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes);
}

async function singlePagePdf(src: PDFDocument, idx: number): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const [p] = await out.copyPages(src, [idx]);
  out.addPage(p);
  return out.save({ useObjectStreams: false });
}

async function main() {
  const t0 = Date.now();
  await fs.mkdir(MASTER_DIR, { recursive: true });
  await fs.mkdir(BUNDLE_DIR, { recursive: true });
  await fs.mkdir(PERPAGE_DIR, { recursive: true });

  // Sorted v6 source page filenames (1:1 with the v6 master pages).
  const v6Files = (await fs.readdir(V6_PAGES)).filter(f => f.endsWith('.html')).sort((a, b) => a.localeCompare(b, 'en'));

  // Load the already-built clean v6 master.
  const v6MasterBytes = await fs.readFile(V6_MASTER_PDF);
  const v6Master = await pdfFromBytes(v6MasterBytes);
  if (v6Master.getPageCount() !== v6Files.length) {
    throw new Error(`v6 master has ${v6Master.getPageCount()} pages but ${v6Files.length} source HTMLs — rebuild build-v6-pdf.ts first.`);
  }

  const browser = await chromium.launch();
  let tocDoc: PDFDocument, datesDoc: PDFDocument;
  const v5Docs: { name: string; doc: PDFDocument }[] = [];
  try {
    tocDoc = await pdfFromBytes(await renderHtmlToPdf(browser, tocPage(), V6_PAGES));
    datesDoc = await pdfFromBytes(await renderHtmlToPdf(browser, datesPage(), V6_PAGES));
    for (const f of V5_PAGES) {
      const raw = await fs.readFile(path.join(V5_DIR, f), 'utf-8');
      const bytes = await renderHtmlToPdf(browser, blankV5Tokens(raw), V5_DIR);
      v5Docs.push({ name: f.replace('.html', ''), doc: await pdfFromBytes(bytes) });
    }
  } finally {
    await browser.close();
  }

  // ── MASTER: TOC + v6(34) + Dates + v5(7) ──────────────────────────────────
  const master = await PDFDocument.create();
  const labels: string[] = [];
  {
    const [p] = await master.copyPages(tocDoc, [0]); master.addPage(p); labels.push('what-this-is');
    const v6Pages = await master.copyPages(v6Master, v6Master.getPageIndices());
    v6Pages.forEach((p, i) => { master.addPage(p); labels.push(v6Files[i].replace('.html', '')); });
    const [d] = await master.copyPages(datesDoc, [0]); master.addPage(d); labels.push('dates-index');
    for (const { name, doc } of v5Docs) {
      const [vp] = await master.copyPages(doc, [0]); master.addPage(vp); labels.push('v5-' + name);
    }
  }
  master.setTitle('Prax Journal v6 — Master');
  master.setAuthor('Prax');
  master.setProducer('assemble-bundles.ts (pdf-lib)');
  const masterBytes = await master.save({ useObjectStreams: false });
  await fs.writeFile(path.join(MASTER_DIR, 'prax-master-journal.pdf'), masterBytes);

  // ── BUNDLES: v6 pages sliced by section ───────────────────────────────────
  const buckets: Record<string, number[]> = {};
  v6Files.forEach((f, i) => { const s = sectionOf(f); if (s) (buckets[s] ??= []).push(i); });
  const bundleSummary: string[] = [];
  for (const s of SECTION_ORDER) {
    const idxs = buckets[s]; if (!idxs?.length) continue;
    const b = await PDFDocument.create();
    const pages = await b.copyPages(v6Master, idxs);
    pages.forEach(p => b.addPage(p));
    b.setTitle(`Prax Journal v6 — ${s}`);
    await fs.writeFile(path.join(BUNDLE_DIR, `${s}.pdf`), await b.save({ useObjectStreams: false }));
    bundleSummary.push(`${s}=${idxs.length}`);
  }

  // ── PER-PAGE: every page of the master as its own PDF ─────────────────────
  // Clear stale per-page files first.
  for (const f of await fs.readdir(PERPAGE_DIR)) {
    if (f.endsWith('.pdf')) await fs.unlink(path.join(PERPAGE_DIR, f));
  }
  const masterDoc = await pdfFromBytes(masterBytes);
  for (let i = 0; i < masterDoc.getPageCount(); i++) {
    const nn = String(i + 1).padStart(2, '0');
    const bytes = await singlePagePdf(masterDoc, i);
    await fs.writeFile(path.join(PERPAGE_DIR, `page-${nn}-${labels[i]}.pdf`), bytes);
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[assemble] master: ${masterDoc.getPageCount()} pages → output/master/prax-master-journal.pdf`);
  console.log(`[assemble] bundles: ${bundleSummary.join(' ')} → output/bundles/`);
  console.log(`[assemble] per-page: ${masterDoc.getPageCount()} files → output/per-page/`);
  console.log(`[assemble] done in ${secs}s`);
}

main().catch(err => { console.error('[assemble] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
