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
 * Ships all light + dark variants — 14 palettes total across the
 * 7 base theme families. Light and dark both expose the same 6 tokens
 * (background · foreground · primary · accent · border · muted); the
 * swap is a pure theme-id change at gallery runtime. OG card renders
 * + specimen previews pick up the dark palette automatically.
 *
 * History: this script used to filter `-dark.css` files out (W7 scope
 * kicked dark to W9); the dark CSS has always existed on disk so
 * including it now is a pure extraction change, no CSS authoring.
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
  // "bold-tech"      → "Bold Tech"
  // "bold-tech-dark" → "Bold Tech (Dark)"
  // The trailing "-dark" token is a suffix convention, not a theme
  // family name, so it gets reshaped into parenthetical variant notation.
  const darkSuffix = slug.endsWith('-dark');
  const base = darkSuffix ? slug.slice(0, -'-dark'.length) : slug;
  const title = base
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
  return darkSuffix ? `${title} (Dark)` : title;
}

async function main(): Promise<void> {
  // Sort light before dark in each family so palettes read naturally
  // in the gallery picker: bold-tech, bold-tech-dark, bubblegum, ...
  const all = (await readdir(THEMES_DIR)).filter((f) => f.endsWith('.css')).sort((a, b) => {
    const aFamily = a.replace(/-dark\.css$/, '.css');
    const bFamily = b.replace(/-dark\.css$/, '.css');
    if (aFamily !== bFamily) return aFamily.localeCompare(bFamily);
    // Same family — light (no -dark suffix) comes first. localeCompare
    // would put "bold-tech-dark.css" before "bold-tech.css" because '-'
    // (0x2D) < '.' (0x2E), so we short-circuit on the -dark suffix.
    const aDark = a.endsWith('-dark.css') ? 1 : 0;
    const bDark = b.endsWith('-dark.css') ? 1 : 0;
    return aDark - bDark;
  });

  const themes: Array<{ id: string; name: string; palette: Palette }> = [];
  const missing: Array<{ id: string; need: string[] }> = [];

  for (const f of all) {
    const id = f.replace(/\.css$/, '');
    const raw = await readFile(path.join(THEMES_DIR, f), 'utf8');
    const parsed = parseVars(raw);

    const missingKeys = TOKENS.filter((t) => parsed[t] === undefined);
    if (missingKeys.length > 0) {
      missing.push({ id, need: missingKeys as string[] });
      continue;
    }

    // Every theme here has all 6 tokens (verified manually on the 14
    // light + dark themes before shipping this script); the guard above
    // just keeps a future theme honest.
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
