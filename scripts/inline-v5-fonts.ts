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
 *   1. Reads the 5 WOFF2 files under shared/fonts/.
 *   2. Builds a <style data-fonts="v5-inlined-woff2">…</style> block with
 *      5 @font-face rules, each carrying a base64 data:font/woff2 URI.
 *   3. In every packs/journals/prax-journal/versions/v5/*.html, replaces the
 *      3-line block (preconnect × 2 + stylesheet <link>) with that <style>.
 *   4. Idempotent — a marker attribute lets re-runs skip already-inlined files.
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
 *   1 — a page's Google Fonts block didn't match (human edit drifted)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONTS_DIR = path.join(ROOT, 'shared', 'fonts');
const V5_DIR = path.join(ROOT, 'packs', 'journals', 'prax-journal', 'versions', 'v5');

// Same 5 files the sticker renderer inlines. Keep this list in sync with
// src/core/sticker-renderer.ts FONT_FILES.
const FONT_FILES: ReadonlyArray<{
  family: string;
  weight: string;
  woff2: string;
}> = [
  { family: 'Fraunces',        weight: '400 700', woff2: 'fraunces/fraunces-normal-w400-700.woff2' },
  { family: 'Instrument Sans', weight: '400 700', woff2: 'instrument-sans/instrument-sans-normal-w400-700.woff2' },
  { family: 'JetBrains Mono',  weight: '400',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w400.woff2' },
  { family: 'JetBrains Mono',  weight: '500',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w500.woff2' },
  { family: 'JetBrains Mono',  weight: '600',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w600.woff2' },
];

const MARKER_ATTR = 'data-fonts="v5-inlined-woff2"';

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
      `      font-display: swap;`,
      `    }`,
    ].join('\n');
  }).join('\n');

  return [
    `<style ${MARKER_ATTR}>`,
    `  /* Auto-inlined by scripts/inline-v5-fonts.ts · ${FONT_FILES.length} @font-face rules`,
    `   * Keeps FIND-0010 self-contained guarantee: open the HTML → fonts just work.`,
    `   * Regenerate: npx tsx scripts/inline-v5-fonts.ts */`,
    rules,
    `</style>`,
  ].join('\n');
}

// Matches the exact 3-line block every v5 page currently carries. Deliberately
// strict — if this stops matching, a human edited the page and we should stop
// and have a look rather than blindly guess.
const GOOGLE_FONTS_RE =
  /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*\n\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\s*\n\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">/;

interface Result {
  file: string;
  status: 'rewrote' | 'skipped' | 'no-match';
  bytesBefore: number;
  bytesAfter: number;
}

function processFile(filePath: string, styleBlock: string): Result {
  const raw = fs.readFileSync(filePath, 'utf8');
  const bytesBefore = raw.length;

  if (raw.includes(MARKER_ATTR)) {
    return { file: filePath, status: 'skipped', bytesBefore, bytesAfter: bytesBefore };
  }

  if (!GOOGLE_FONTS_RE.test(raw)) {
    return { file: filePath, status: 'no-match', bytesBefore, bytesAfter: bytesBefore };
  }

  const next = raw.replace(GOOGLE_FONTS_RE, styleBlock);
  fs.writeFileSync(filePath, next);
  return { file: filePath, status: 'rewrote', bytesBefore, bytesAfter: next.length };
}

function main(): void {
  const styleBlock = buildFontStyleBlock();
  const blockKb = (styleBlock.length / 1024).toFixed(1);
  console.log(`→ built <style> block · ${blockKb} KB · ${FONT_FILES.length} @font-face rules`);

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
      console.log(`  ✓ ${rel} · ${beforeKb} KB → ${afterKb} KB`);
    } else if (r.status === 'skipped') {
      console.log(`  · ${rel} · already inlined`);
    } else {
      hadNoMatch = true;
      console.error(`  ✗ ${rel} · Google Fonts block did not match (human edit drifted?)`);
    }
  }

  if (hadNoMatch) {
    console.error('');
    console.error('Aborting. The 3-line <link> block must match the regex exactly.');
    console.error('Inspect the offending file(s), restore the canonical block, rerun.');
    process.exit(1);
  }

  console.log('');
  console.log('Done. All v5 pages are now self-contained (no network at render time).');
}

main();
