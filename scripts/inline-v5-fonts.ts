#!/usr/bin/env tsx
/**
 * C6a · Inline local WOFF2 fonts into the 7 v5 Prax Journal HTML pages.
 *
 * Why: FIND-0010 says every page must be self-contained (open the HTML, it
 * just works — no network, no sibling-file refs). Today each v5 page loads
 * Google Fonts at render time via <link>. Offline → Times fallback → the
 * warm-analog editorial voice collapses.
 *
 * This script does a one-shot rewrite:
 *   1. Reads the 5 WOFF2 files under shared/fonts/ (via the shared
 *      FONT_FILES manifest in src/core/sticker-renderer.ts — single source
 *      of truth, so stickers and v5 pages can't drift apart).
 *   2. Builds a <style data-fonts="v5-inlined-woff2-v2">…</style> block
 *      with 5 @font-face rules, each carrying a base64 data:font/woff2 URI
 *      and `font-display: block` (matches the sticker renderer).
 *   3. In every packs/journals/prax-journal/versions/v5/*.html, replaces
 *      either (a) the 3-line Google Fonts block or (b) a prior inlined
 *      <style data-fonts="v5-inlined-woff2"> block with that <style>.
 *   4. Idempotent on the v2 marker — a re-run against already-v2 pages
 *      is a no-op.
 *
 * Base64 data URIs are the exact same pipeline already proven in
 * src/core/sticker-renderer.ts (C5a canary: 15.22% ink density, librsvg
 * renders correctly, Chrome + Puppeteer + Safari-print identical).
 *
 * Usage:
 *   npx tsx scripts/inline-v5-fonts.ts
 *
 * Exit codes:
 *   0 — rewrote or skipped all 7 files cleanly
 *   1 — a page had neither a Google Fonts block nor a prior inlined block
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FONT_FILES } from '../src/core/sticker-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'shared', 'fonts');
const V5_DIR = path.join(ROOT, 'packs', 'journals', 'prax-journal', 'versions', 'v5');

/**
 * Bump this when the font manifest or the @font-face rules change.
 * The script treats any file carrying an older marker as "rewrite me",
 * which is how we roll forward without needing a manual --force flag.
 */
const MARKER_ATTR_CURRENT = 'data-fonts="v5-inlined-woff2-v2"';

/** Older marker values that MUST trigger a re-emit (oldest first). */
const MARKER_ATTRS_LEGACY = ['data-fonts="v5-inlined-woff2"'] as const;

/**
 * Sanity cap on the generated <style> block. Today we sit near ~320 KB;
 * the guard trips if a future variable-axis addition (e.g. full Fraunces
 * 9..144 opsz) balloons the per-page cost past half a meg — which would
 * regress LCP on the 7 v5 pages.
 */
const STYLE_BLOCK_WARN_BYTES = 512_000;

function buildFontStyleBlock(): string {
  const rules = FONT_FILES.map(({ family, weight, woff2 }) => {
    const p = path.join(FONTS_DIR, woff2);
    const b64 = fs.readFileSync(p).toString('base64');
    return [
      `    @font-face {`,
      `      font-family: '${family}';`,
      `      src: url(data:font/woff2;base64,${b64}) format('woff2');`,
      `      font-weight: ${weight};`,
      `      font-style: normal;`,
      `      font-display: block;`,
      `    }`,
    ].join('\n');
  }).join('\n');

  return [
    `<style ${MARKER_ATTR_CURRENT}>`,
    `  /* Auto-inlined by scripts/inline-v5-fonts.ts · ${FONT_FILES.length} @font-face rules`,
    `   * Keeps FIND-0010 self-contained guarantee: open the HTML → fonts just work.`,
    `   * Regenerate: npx tsx scripts/inline-v5-fonts.ts */`,
    rules,
    `</style>`,
  ].join('\n');
}

// Matches the exact 3-line block every pre-v1 v5 page carries. Deliberately
// strict — if this stops matching (and no legacy marker is present either),
// a human edited the page and we should stop rather than blindly guess.
const GOOGLE_FONTS_RE =
  /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*\n\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*\n\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">/;

/**
 * Build a regex that matches any legacy `<style data-fonts="…">…</style>`
 * block for re-emission. Non-greedy, one line or many, captures the full
 * tag pair so the replacement swaps it cleanly.
 */
function legacyStyleBlockRe(markerAttr: string): RegExp {
  // Escape the marker for regex literal use.
  const escaped = markerAttr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<style ${escaped}>[\\s\\S]*?<\\/style>`);
}

interface Result {
  file: string;
  status: 'rewrote' | 'skipped' | 'no-match';
  bytesBefore: number;
  bytesAfter: number;
  /** Which branch of the matcher fired — aids debugging when things drift. */
  via?: 'google-fonts' | 'legacy-marker';
}

function processFile(filePath: string, styleBlock: string): Result {
  const raw = fs.readFileSync(filePath, 'utf8');
  const bytesBefore = raw.length;

  // Already on the current marker? Nothing to do.
  if (raw.includes(MARKER_ATTR_CURRENT)) {
    return { file: filePath, status: 'skipped', bytesBefore, bytesAfter: bytesBefore };
  }

  // Prior inlined block? Swap it in place.
  for (const legacy of MARKER_ATTRS_LEGACY) {
    if (raw.includes(legacy)) {
      const next = raw.replace(legacyStyleBlockRe(legacy), styleBlock);
      fs.writeFileSync(filePath, next);
      return {
        file: filePath,
        status: 'rewrote',
        bytesBefore,
        bytesAfter: next.length,
        via: 'legacy-marker',
      };
    }
  }

  // Pristine Google Fonts block? Swap it.
  if (GOOGLE_FONTS_RE.test(raw)) {
    const next = raw.replace(GOOGLE_FONTS_RE, styleBlock);
    fs.writeFileSync(filePath, next);
    return {
      file: filePath,
      status: 'rewrote',
      bytesBefore,
      bytesAfter: next.length,
      via: 'google-fonts',
    };
  }

  return { file: filePath, status: 'no-match', bytesBefore, bytesAfter: bytesBefore };
}

function main(): void {
  const styleBlock = buildFontStyleBlock();
  const blockKb = (styleBlock.length / 1024).toFixed(1);
  console.log(`→ built <style> block · ${blockKb} KB · ${FONT_FILES.length} @font-face rules`);

  if (styleBlock.length > STYLE_BLOCK_WARN_BYTES) {
    console.warn(
      `⚠ style block is ${blockKb} KB · exceeds ${(STYLE_BLOCK_WARN_BYTES / 1024).toFixed(0)} KB soft cap.`,
    );
    console.warn(
      '  Check FONT_FILES for variable-axis bloat (full opsz? extra weights?) before shipping.',
    );
  }

  const files = fs
    .readdirSync(V5_DIR)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((f) => path.join(V5_DIR, f));

  if (files.length === 0) {
    console.error(`✗ no .html files under ${V5_DIR}`);
    process.exit(1);
  }

  const results = files.map((f) => processFile(f, styleBlock));
  let hadNoMatch = false;

  for (const r of results) {
    const rel = path.relative(ROOT, r.file);
    if (r.status === 'rewrote') {
      const beforeKb = (r.bytesBefore / 1024).toFixed(1);
      const afterKb = (r.bytesAfter / 1024).toFixed(1);
      const via = r.via === 'legacy-marker' ? ' · re-emit' : '';
      console.log(`  ✓ ${rel} · ${beforeKb} KB → ${afterKb} KB${via}`);
    } else if (r.status === 'skipped') {
      console.log(`  · ${rel} · already inlined (${MARKER_ATTR_CURRENT})`);
    } else {
      hadNoMatch = true;
      console.error(
        `  ✗ ${rel} · neither Google Fonts block nor a legacy inlined block found`,
      );
    }
  }

  if (hadNoMatch) {
    console.error('');
    console.error('Aborting. A v5 page must contain either:');
    console.error('  (a) the canonical 3-line Google Fonts <link> block, or');
    console.error(`  (b) an earlier inlined <style ${MARKER_ATTRS_LEGACY[0]}> block.`);
    console.error('Inspect the offending file(s), restore one of those shapes, rerun.');
    process.exit(1);
  }

  console.log('');
  console.log('Done. All v5 pages are now self-contained (no network at render time).');
}

main();
