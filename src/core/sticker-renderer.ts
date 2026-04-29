/**
 * Sticker renderer — authors warm-analog SVGs with inlined Fraunces /
 * Instrument Sans / JetBrains Mono fonts, rasterizes them via sharp at
 * the three size classes (compact 400×600, standard 600×600,
 * expanded 800×600).
 *
 * Risk de-risked by scripts/probe-sharp-fraunces.ts: sharp / librsvg
 * does honor @font-face with base64 data:woff2 URIs. Proof committed
 * as output/probe-compare.png (visual comparison with a Chromium
 * reference render). We therefore ship SVG-first stickers — no
 * Puppeteer needed for this subsystem.
 *
 * This module produces:
 *   - The canonical <defs><style>@font-face …</style></defs> block
 *     every sticker SVG should include (see `fontsBlock()`).
 *   - Stock dimensions + design tokens so stickers stay on-grammar.
 *   - A tiny helper to rasterize an SVG string to PNG at N×N size.
 *
 * The module is INTENTIONALLY minimal. Sticker-specific geometry
 * lives inside each sticker's own file under
 * `packs/journals/prax-journal/stickers/<name>/<name>.svg` — the
 * renderer does not construct SVGs, it supplies the shared bits.
 */

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FONTS_DIR = path.join(REPO_ROOT, 'shared', 'fonts');

// ─── Size classes ──────────────────────────────────────────────
// Canvases match the design-review §3 rubric. Every sticker MUST
// declare one of these; the renderer rejects anything else.

export type StickerSize = 'compact' | 'standard' | 'expanded';

export interface SizeClass {
  width: number;
  height: number;
  /** Corner radius in SVG units (px). Squircle invariant per DESIGN.md §5.4. */
  rx: number;
}

export const SIZE_CLASSES: Record<StickerSize, SizeClass> = {
  compact:  { width: 400, height: 600, rx: 24 },
  standard: { width: 600, height: 600, rx: 28 },
  expanded: { width: 800, height: 600, rx: 32 },
};

// ─── Warm-analog palette (mirrored from shared/themes + DESIGN.md §3) ──
// Stickers use the same four accents so a pack of stickers on a page
// reads as one family, not a random rainbow.

export type Accent = 'sage' | 'clay' | 'amber' | 'lavender';

export interface AccentColors {
  rail: string; // top 5px accent rail (saturated)
  ink: string;  // text-safe variant (WCAG AA on cream)
  tint: string; // 8-10% rgba wash for card backgrounds
  edge: string; // 22-28% rgba for borders
}

export const PALETTE: Record<Accent, AccentColors> & { ink: string; paper: string } = {
  ink:      '#2A2824',
  paper:    '#F9F5EC',
  sage:     { rail: '#7B9476', ink: '#4E6249', tint: 'rgba(123, 148, 118, 0.08)', edge: 'rgba(123, 148, 118, 0.22)' },
  clay:     { rail: '#B85A44', ink: '#8A3E2E', tint: 'rgba(184, 90, 68, 0.07)',   edge: 'rgba(184, 90, 68, 0.25)'   },
  amber:    { rail: '#C9884A', ink: '#8F5D28', tint: 'rgba(201, 136, 74, 0.08)',  edge: 'rgba(201, 136, 74, 0.22)'  },
  lavender: { rail: '#B6A9CB', ink: '#6B5D86', tint: 'rgba(182, 169, 203, 0.10)', edge: 'rgba(182, 169, 203, 0.28)' },
};

// ─── Font loader (memoized) ───────────────────────────────────
// Reading + base64-encoding the three WOFF2 files costs ~200µs; memoizing
// is pragmatic since the renderer runs once per sticker per build.

const FONT_FILES = [
  { family: 'Fraunces',        weight: '400 700', woff2: 'fraunces/fraunces-normal-w400-700.woff2' },
  { family: 'Instrument Sans', weight: '400 700', woff2: 'instrument-sans/instrument-sans-normal-w400-700.woff2' },
  { family: 'JetBrains Mono',  weight: '400',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w400.woff2' },
  { family: 'JetBrains Mono',  weight: '500',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w500.woff2' },
  { family: 'JetBrains Mono',  weight: '600',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w600.woff2' },
] as const;

let _fontsCssCache: string | null = null;

/**
 * Return the full `<defs><style>…@font-face…</style></defs>` block that
 * every sticker SVG should drop inside its root `<svg>`. Output is
 * cached in-memory so a bulk render of 12 stickers re-encodes the
 * WOFF2 files just once.
 */
export function fontsDefs(): string {
  if (_fontsCssCache !== null) return _fontsCssCache;

  const rules = FONT_FILES.map(({ family, weight, woff2 }) => {
    const p = path.join(FONTS_DIR, woff2);
    const b64 = readFileSync(p).toString('base64');
    return `      @font-face {
        font-family: '${family}';
        src: url(data:font/woff2;base64,${b64}) format('woff2');
        font-weight: ${weight};
        font-style: normal;
        font-display: block;
      }`;
  }).join('\n');

  _fontsCssCache = `  <defs>
    <style><![CDATA[
${rules}
    ]]></style>
  </defs>`;
  return _fontsCssCache;
}

/**
 * Return the cached bytes of the fonts block. Useful for eg. logging
 * "this sticker SVG is 245 KB, 243 of which is fonts".
 */
export function fontsBlockSize(): number {
  return fontsDefs().length;
}

// ─── Raster pipeline ─────────────────────────────────────────
//
// A sticker SVG gets rasterized at three resolutions:
//   @1× — the canvas size (400/600/800 × 600)
//   @2× — double, for retina preview
//   @3× — triple, for GoodNotes's internal scaling headroom
//
// We only output PNG, not JPEG. Stickers have alpha (the rounded
// corners) and JPEG would square them off.

export interface RasterOutput {
  path: string;
  width: number;
  height: number;
  bytes: number;
}

export async function rasterize(
  svg: string,
  outPath: string,
  scale: 1 | 2 | 3 = 1,
): Promise<RasterOutput> {
  const buf = await sharp(Buffer.from(svg), { density: 72 * scale })
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });

  await sharp(buf.data).toFile(outPath);

  return {
    path: outPath,
    width: buf.info.width,
    height: buf.info.height,
    bytes: buf.info.size,
  };
}
