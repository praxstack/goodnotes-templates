#!/usr/bin/env -S npx tsx
/**
 * Build a single standalone HTML of the whole month's journal.
 *
 * The Puppeteer pipeline writes directly to PDF. But users also asked for
 * an HTML they can open in a browser. This script replays the same page
 * sequence (`buildPageSequence` → `resolvePageSpecFiles` →
 * `substituteProfile`) but instead of piping each file through Puppeteer,
 * it extracts each `<body>` and stacks them into one combined HTML.
 *
 * Output
 * ──────
 *   output/The Praxis Ledger — <Month YYYY>.html     (single file, ~10-20 MB)
 *
 * Each page lives inside a page-break wrapper so browser print preview and
 * PDF export preserve the one-page-per-spec structure. Fonts are already
 * base64-inlined in the v5 source HTML (see scripts/inline-v5-fonts.ts),
 * so this file opens correctly on any machine without external assets.
 *
 * Usage
 * ─────
 *   npx tsx scripts/build-standalone-html.ts \
 *     --from 2026-04-30 --to 2026-05-31 \
 *     --out "output/The Praxis Ledger — May 2026.html"
 *
 * Optional `--profile <path>` to match scripts/generate-journal.ts.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { buildPageSequence } from '../src/core/splice.js';
import {
  resolvePageSpecFiles,
  substituteProfile,
  V5_PACK_DIR,
} from '../src/core/prax-journal-renderer.js';
import { parseProfile, type Profile } from '../src/types/profile.js';

// ─── Args ───────────────────────────────────────────────────────

interface Args {
  from: string;
  to: string;
  out: string;
  profilePath: string;
  versionDir: string;
}

function parseArgs(argv: readonly string[]): Args {
  const get = (flag: string, fallback?: string): string => {
    const idx = argv.indexOf(flag);
    if (idx === -1 || idx === argv.length - 1) {
      if (fallback !== undefined) return fallback;
      throw new Error(`missing required flag: ${flag}`);
    }
    return argv[idx + 1];
  };
  return {
    from: get('--from'),
    to:   get('--to'),
    out:  get('--out'),
    profilePath: get('--profile', 'packs/journals/prax-journal/profile.local.json'),
    versionDir:  get('--pack', V5_PACK_DIR),
  };
}

async function loadProfile(p: string): Promise<Profile | undefined> {
  try {
    const raw = await fs.readFile(path.resolve(p), 'utf-8');
    return parseProfile(JSON.parse(raw) as unknown);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
}

// ─── HTML extraction ────────────────────────────────────────────
//
// The v5 templates are stand-alone HTML documents: each has its own
// `<!doctype>`, `<head>`, `<style>` (with base64 font data URIs), and
// `<body>`. To concatenate them we:
//
//   1. Pull `<style>…</style>` blocks from the FIRST file only. Fonts and
//      shared CSS are identical across templates (same `@font-face` block
//      from `inline-v5-fonts.ts`), so grabbing once saves ~40 MB × 135 =
//      5 GB worth of duplication.
//   2. Pull the inner `<body>…</body>` of EVERY file and wrap each in a
//      `<section class="page">` with a forced page break.
//   3. Any per-file template-specific CSS that isn't in the first file's
//      `<head>` still needs to come along. To be safe, we also strip every
//      file's `<style>` block and append the *union* of unique style
//      strings into the merged `<head>`.

function extractStyles(html: string): string[] {
  const out: string[] = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

function extractBody(html: string): string {
  const m = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  return m ? m[1] : html;
}

function bodyClass(html: string): string {
  const m = /<body\b([^>]*)>/i.exec(html);
  if (!m) return '';
  const cm = /class\s*=\s*"([^"]*)"/i.exec(m[1]);
  return cm ? cm[1] : '';
}

// ─── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const outPath = path.resolve(args.out);
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const specs = buildPageSequence({ from: args.from, to: args.to });
  if (specs.length === 0) {
    throw new Error(`buildPageSequence(${args.from} → ${args.to}) returned 0 specs`);
  }

  const profile = await loadProfile(args.profilePath);
  console.log(`Profile: ${profile ? args.profilePath + ' (loaded)' : 'none — printed-blank fallback'}`);
  console.log(`Range:   ${args.from} → ${args.to}`);
  console.log(`Specs:   ${specs.length}`);
  console.log('');

  // ── Walk + collect unique styles + page bodies ──
  const uniqueStyles = new Set<string>();
  const pages: Array<{ klass: string; body: string; label: string }> = [];
  let totalFiles = 0;

  for (let i = 0; i < specs.length; i++) {
    const page = specs[i];
    const files = resolvePageSpecFiles(page, args.versionDir);
    for (const f of files) {
      const raw = await fs.readFile(f, 'utf-8');
      const html = substituteProfile(raw, profile, page);
      for (const s of extractStyles(html)) uniqueStyles.add(s);
      pages.push({
        klass: bodyClass(html),
        body: extractBody(html),
        label: `${page.kind}:${path.basename(f, '.html')}`,
      });
      totalFiles += 1;
    }
    if ((i + 1) % 25 === 0 || i === specs.length - 1) {
      console.log(`  walked ${String(i + 1).padStart(3)}/${specs.length} specs`);
    }
  }

  // ── Stitch into a single doc ──
  //
  // Wrapper class is `.ledger-page` (NOT `.page`) to avoid colliding with
  // every source v5 template's own `.page { width: var(--page-w); height:
  // var(--page-h); background: var(--paper); ... }` rule. Without this
  // rename, the outer wrapper would inherit A4 sizing and paper color from
  // the templates' own CSS, and each month rendered as two stacked A4
  // cards with ~300px of phantom whitespace in between.
  //
  // The source templates' own inner `<div class="page">` still renders as
  // the true A4 canvas inside our frame — so print stays pixel-identical
  // to the PDF pipeline.
  const combinedStyles = Array.from(uniqueStyles).join('\n\n/* ─── */\n\n');
  const stitched = pages
    .map(
      (p) =>
        `<section class="ledger-page" data-label="${p.label}">\n` +
        `${p.body}\n` +
        `</section>`,
    )
    .join('\n\n');

  const doc =
    `<!DOCTYPE html>\n` +
    `<html lang="en">\n` +
    `<head>\n` +
    `<meta charset="UTF-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
    `<title>${path.basename(outPath, '.html')}</title>\n` +
    `<style>\n${combinedStyles}\n</style>\n` +
    `<style>\n` +
    `  /* ╔══════════════════════════════════════════════════════════╗\n` +
    `     ║ Standalone combined view · build-standalone-html.ts     ║\n` +
    `     ║ Wrapper = .ledger-page (NOT .page) to avoid collision   ║\n` +
    `     ║ with every template's own \`.page { width/height/bg }\`.  ║\n` +
    `     ║ Screen: each month renders 135 framed A4 cards.         ║\n` +
    `     ║ Print : cards unframe, page breaks snap to A4.          ║\n` +
    `     ╚══════════════════════════════════════════════════════════╝ */\n` +
    `  html, body {\n` +
    `    margin: 0;\n` +
    `    padding: 0;\n` +
    `    background: #d7d6d2;\n` +
    `    font-family: -apple-system, BlinkMacSystemFont, sans-serif;\n` +
    `  }\n` +
    `  section.ledger-page {\n` +
    `    display: block;\n` +
    `    width: 210mm;\n` +
    `    min-height: 297mm;\n` +
    `    margin: 32px auto;\n` +
    `    background: #fff;\n` +
    `    box-shadow:\n` +
    `      0 1px 2px rgba(0, 0, 0, 0.12),\n` +
    `      0 8px 24px rgba(0, 0, 0, 0.10),\n` +
    `      0 18px 48px rgba(0, 0, 0, 0.06);\n` +
    `    border-radius: 2px;\n` +
    `    overflow: hidden;\n` +
    `    break-after: page;\n` +
    `    page-break-after: always;\n` +
    `    position: relative;\n` +
    `  }\n` +
    `  /* Page counter chip — bottom-right of each card (screen only) */\n` +
    `  section.ledger-page::after {\n` +
    `    content: attr(data-label);\n` +
    `    position: absolute;\n` +
    `    bottom: 8px;\n` +
    `    right: 12px;\n` +
    `    font: 10px/1 ui-monospace, Menlo, monospace;\n` +
    `    color: rgba(0, 0, 0, 0.28);\n` +
    `    letter-spacing: 0.04em;\n` +
    `    pointer-events: none;\n` +
    `    z-index: 10;\n` +
    `  }\n` +
    `  section.ledger-page:last-child { break-after: auto; page-break-after: auto; }\n` +
    `  /* The source template's inner \`.page\` div already sizes itself to\n` +
    `   * A4 via --page-w / --page-h. Null the extra auto margin it adds so\n` +
    `   * the card doesn't inherit 10mm of padding twice. */\n` +
    `  section.ledger-page > .page { margin: 0 auto; }\n` +
    `  @media print {\n` +
    `    html, body { background: #fff; }\n` +
    `    section.ledger-page {\n` +
    `      margin: 0;\n` +
    `      box-shadow: none;\n` +
    `      border-radius: 0;\n` +
    `      min-height: auto;\n` +
    `    }\n` +
    `    section.ledger-page::after { display: none; }\n` +
    `  }\n` +
    `  @page { size: A4 portrait; margin: 0; }\n` +
    `</style>\n` +
    `</head>\n` +
    `<body>\n${stitched}\n</body>\n` +
    `</html>\n`;


  await fs.writeFile(outPath, doc, 'utf-8');
  const sizeMB = (Buffer.byteLength(doc) / 1024 / 1024).toFixed(2);
  console.log(``);
  console.log(`Wrote:   ${outPath}`);
  console.log(`Size:    ${sizeMB} MB`);
  console.log(`Pages:   ${totalFiles} (from ${specs.length} specs)`);
  console.log(`Styles:  ${uniqueStyles.size} unique <style> blocks merged`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
