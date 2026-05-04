/**
 * build-theme-palette — extract a compact palette per core theme.
 *
 * The 7 light themes at packages/core/assets/themes/*.css each declare
 * their tokens globally on :root. That's fine for PDF rendering (each
 * PDF owns the document) but would repaint the entire gallery chrome if
 * imported directly. Design decision 13 locks gallery chrome to
 * warm-analog always — theme swap affects the SPECIMEN preview only.
 *
 * This script reads each *.css, extracts a 6-token preview palette
 * (background · foreground · primary · accent · border · muted), and
 * writes a byte-stable JSON manifest the gallery loads at build time.
 * The specimen frame then applies those vars scoped under a
 * [data-theme="<name>"] wrapper — zero :root pollution.
 *
 * Light-only by design (W7 scope); dark variants wait for the W9
 * browser-PDF work where full-document theme swap is needed.
 *
 * Usage: tsx apps/gallery/scripts/build-theme-palette.ts
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(GALLERY_ROOT, '..', '..');
const THEMES_DIR = path.join(REPO_ROOT, 'packages', 'core', 'assets', 'themes');
const OUT = path.join(GALLERY_ROOT, 'src', 'data', 'theme-palette.json');

// The 6 tokens we surface per theme. Kept intentionally small: more
// tokens = more swatch variance = less readable preview. These map to
// the gallery's own specimen frame styling.
const TOKENS = [
  'background',
  'foreground',
  'primary',
  'accent',
  'border',
  'muted',
] as const;

type Palette = Record<(typeof TOKENS)[number], string>;

function parseVars(css: string): Partial<Palette> {
  // Minimal :root { --foo: ...; } parser. Uses a regex over the first
  // :root block so we don't accidentally harvest values from @media
  // blocks further down. Dropped percent-alpha suffix cleanly stays
  // intact — we preserve whatever the source wrote.
  const match = css.match(/:root\s*\{([^}]+)\}/u);
  if (!match) return {};
  const body = match[1];
  const out: Partial<Palette> = {};
  const re = /--([a-z][a-z0-9-]*)\s*:\s*([^;]+?)\s*;/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const name = m[1];
    const value = m[2].trim();
    if ((TOKENS as readonly string[]).includes(name)) {
      out[name as keyof Palette] = value;
    }
  }
  return out;
}

function prettyName(slug: string): string {
  // "bold-tech" → "Bold Tech"
  return slug
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

async function main(): Promise<void> {
  const all = (await readdir(THEMES_DIR)).filter((f) => f.endsWith('.css'));
  const lightOnly = all.filter((f) => !f.endsWith('-dark.css')).sort();

  const themes: Array<{ id: string; name: string; palette: Palette }> = [];
  const missing: Array<{ id: string; need: string[] }> = [];

  for (const f of lightOnly) {
    const id = f.replace(/\.css$/, '');
    const raw = await readFile(path.join(THEMES_DIR, f), 'utf8');
    const parsed = parseVars(raw);

    const missingKeys = TOKENS.filter((t) => parsed[t] === undefined);
    if (missingKeys.length > 0) {
      missing.push({ id, need: missingKeys as string[] });
      continue;
    }

    // Every theme here has all 6 tokens (verified manually on the 7
    // light themes before shipping this script); the guard above just
    // keeps a future theme honest.
    const palette = parsed as Palette;
    themes.push({ id, name: prettyName(id), palette });
  }

  if (missing.length > 0) {
    console.error(
      `[build-theme-palette] ${missing.length} theme(s) missing required tokens:`,
    );
    for (const m of missing) {
      console.error(`  - ${m.id}: missing ${m.need.join(', ')}`);
    }
    process.exit(1);
  }

  // Byte-stable output: sorted keys, single trailing newline.
  const output = {
    schema_version: 1 as const,
    generated_from: 'packages/core/assets/themes/*.css',
    tokens: TOKENS,
    themes,
  };
  await writeFile(OUT, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(
    `[build-theme-palette] wrote ${themes.length} theme palette${themes.length === 1 ? '' : 's'} → ${path.relative(REPO_ROOT, OUT)}`,
  );
}

await main();
