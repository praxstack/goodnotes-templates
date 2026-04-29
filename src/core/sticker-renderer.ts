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
 * This module provides the canonical composition surface for the
 * entire 12-sticker library:
 *
 *   fontsDefs()       the full <defs><style>@font-face …</style></defs>
 *   fontsCssInner()   bare @font-face rules for callers composing their
 *                     own <defs> alongside filters / gradients / clips
 *   SIZE_CLASSES      compact / standard / expanded canvas + rx
 *   PALETTE           sage/clay/amber/lavender accent colors + ink/paper
 *   stickerShell()    the entire boilerplate: paper + rail + kicker + hero
 *                     + subtitle + whisper + footer, leaving only bodySvg
 *                     to each individual sticker
 *   kickerLine()      helper for in-body kickers
 *   solidLine()       helper for primary writing lines (writing-zone §5.5)
 *   dottedLine()      helper for secondary writing lines
 *   rasterize()       sharp SVG -> PNG, scales up to @4×
 *
 * Individual sticker authors (`scripts/build-*.ts`) import from here —
 * no file duplicates the shell grammar.
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
  rail: string; // top accent rail (saturated)
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
// Reading + base64-encoding the five WOFF2 files costs ~200µs; memoizing
// is pragmatic since the renderer runs once per sticker per build.

const FONT_FILES = [
  { family: 'Fraunces',        weight: '400 700', woff2: 'fraunces/fraunces-normal-w400-700.woff2' },
  { family: 'Instrument Sans', weight: '400 700', woff2: 'instrument-sans/instrument-sans-normal-w400-700.woff2' },
  { family: 'JetBrains Mono',  weight: '400',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w400.woff2' },
  { family: 'JetBrains Mono',  weight: '500',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w500.woff2' },
  { family: 'JetBrains Mono',  weight: '600',     woff2: 'jetbrains-mono/jetbrains-mono-normal-w600.woff2' },
] as const;

let _fontsCssInnerCache: string | null = null;

/**
 * Return just the `@font-face` rules (no `<defs>` / `<style>` wrapping).
 * Use this when your sticker needs to compose its own `<defs>` block
 * alongside filters / gradients / clipPaths.
 */
export function fontsCssInner(): string {
  if (_fontsCssInnerCache !== null) return _fontsCssInnerCache;
  _fontsCssInnerCache = FONT_FILES.map(({ family, weight, woff2 }) => {
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
  return _fontsCssInnerCache;
}

/**
 * Return the full `<defs><style>…@font-face…</style></defs>` block.
 * Use this for standalone SVGs that don't need any other `<defs>` content.
 * For stickers that DO need other defs (e.g. the paper filter), prefer
 * `fontsCssInner()` and compose your own `<defs>`.
 */
export function fontsDefs(): string {
  return `  <defs>
    <style><![CDATA[
${fontsCssInner()}
    ]]></style>
  </defs>`;
}

/**
 * Size of the cached fonts CSS (rules only, no wrapping).
 * Useful for build-script logging to separate geometry from font payload.
 */
export function fontsCssInnerSize(): number {
  return fontsCssInner().length;
}

// ─── Sticker shell composition ─────────────────────────────────
// The entire boilerplate — paper gradient, fractal grain, rail,
// border, kicker, hero, subtitle, whisper, footer — shared across
// all 12 stickers. Each individual sticker author just supplies
// the unique `bodySvg` for the middle region.

export interface StickerShellOptions {
  /** Used for <title id> and <desc id> pairs — kebab-case. */
  id: string;
  /** <title> content — human-readable sticker name. */
  title: string;
  /** <desc> content — screen-reader description of what it is + what it captures. */
  desc: string;
  size: StickerSize;
  accent: Accent;
  /** "§ NAME" — UPPERCASE, JetBrains Mono 11px, 0.18em tracking. */
  kicker: string;
  /** Fraunces hero — lowercase is conventional in this pack. */
  hero: string;
  /** Fraunces italic 14px — the hint under the hero. */
  subtitle: string;
  /** Fraunces italic 12px — quiet editorial note above the footer. */
  whisper: string;
  /**
   * The unique SVG for this sticker's body (scale / writing zones /
   * ornaments). Everything ABOVE this region (kicker/hero/subtitle)
   * and BELOW (whisper/footer) is rendered by the shell.
   */
  bodySvg: string;
  /** Override hero font-size; defaults to 38 for compact, 44 otherwise. */
  heroFontSize?: number;
  /** Override hero Y position; defaults to 108 for compact, 115 otherwise. */
  heroY?: number;
  /** Override subtitle Y position; defaults to heroY + 33. */
  subtitleY?: number;
}

/**
 * Compose a full sticker SVG string from a body fragment.
 *
 * The shell gives every sticker an identical frame: cream paper with
 * subtle warmth gradient + fractal grain, a softened accent rail
 * clipped to the squircle, a faint accent border, the standard
 * kicker/hero/subtitle stack, a whisper line above the footer, and
 * the "PRAX JOURNAL · STICKER" footer mark.
 *
 * All the per-sticker uniqueness lives in `bodySvg`.
 */
export function stickerShell(opts: StickerShellOptions): string {
  const { width: W, height: H, rx: RX } = SIZE_CLASSES[opts.size];
  const a = PALETTE[opts.accent];
  const heroFontSize = opts.heroFontSize ?? (opts.size === 'compact' ? 38 : 44);
  const heroY = opts.heroY ?? (opts.size === 'compact' ? 108 : 115);
  const subY = opts.subtitleY ?? (heroY + 33);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     role="img" aria-labelledby="${opts.id}-title ${opts.id}-desc">
  <title id="${opts.id}-title">${opts.title}</title>
  <desc id="${opts.id}-desc">${opts.desc}</desc>

  <defs>
    <style><![CDATA[${fontsCssInner()}]]></style>

    <!-- Subtle paper-warmth gradient (DESIGN.md §3.1) — top lighter,
         bottom warmer. Keeps the eye traveling down the card. -->
    <linearGradient id="paperWarmth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FBF7EE"/>
      <stop offset="100%" stop-color="#F4EFE0"/>
    </linearGradient>

    <!-- Paper grain filter — fractalNoise reshaped to alpha-only.
         Source: svg-principal-engineer/filters-cookbook.md § Paper grain.
         baseFrequency 0.95 for fine fibers, alpha 0.12 for visible
         middle-ground grain. -->
    <filter id="paperGrain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="3" seed="7"/>
      <feColorMatrix values="0 0 0 0 0.12
                             0 0 0 0 0.10
                             0 0 0 0 0.08
                             0 0 0 0.12 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>

    <!-- Clip path = the squircle. Anything clipped to this will
         respect the rounded corners, which is how the rail gets
         its curved ends without being re-authored with its own rx. -->
    <clipPath id="cardClip">
      <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"/>
    </clipPath>
  </defs>

  <!-- Card body · layered for tactility:
       (1) warm cream gradient base
       (2) same shape with fractalNoise grain composited on top
       (3) softened accent rail clipped to the squircle top
       (4) faint accent border (deckle edge) -->
  <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"
        fill="url(#paperWarmth)"/>
  <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"
        fill="${PALETTE.paper}" filter="url(#paperGrain)"/>
  <rect x="0" y="0" width="${W}" height="8"
        fill="${a.rail}" fill-opacity="0.72"
        clip-path="url(#cardClip)"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}"
        rx="${RX}" ry="${RX}"
        fill="none" stroke="${a.edge}" stroke-width="1"/>

  <!-- Kicker · JetBrains Mono 600, 11px, 0.18em -->
  <text x="${W / 2}" y="50"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="11" font-weight="600"
        letter-spacing="${11 * 0.18}"
        fill="${a.ink}">${opts.kicker}</text>

  <!-- Hero · Fraunces editorial -->
  <text x="${W / 2}" y="${heroY}"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="${heroFontSize}" font-weight="400"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 72, 'SOFT' 60;">${opts.hero}</text>

  <!-- Subtitle · Fraunces italic -->
  <text x="${W / 2}" y="${subY}"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="14" font-style="italic"
        fill="${a.ink}" fill-opacity="0.8"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">${opts.subtitle}</text>

${opts.bodySvg}

  <!-- Whisper · a quiet editorial line above the footer -->
  <text x="${W / 2}" y="${H - 50}"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="12" font-style="italic"
        fill="${a.ink}" fill-opacity="0.55"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">${opts.whisper}</text>

  <!-- Footer mark -->
  <text x="${W / 2}" y="${H - 18}"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="9" font-weight="400"
        letter-spacing="${9 * 0.2}"
        fill="${a.ink}" fill-opacity="0.45">PRAX JOURNAL · STICKER</text>

</svg>
`;
}

// ─── Per-section text helpers ──────────────────────────────────
// These let body composers stay small. Every helper respects the
// DESIGN.md §5.5 writing-zone contract.

/** In-body kicker · JetBrains Mono 600, UPPERCASE, 0.14em tracking. */
export function kickerLine(
  text: string,
  x: number,
  y: number,
  accent: Accent,
  size = 10,
): string {
  return `  <text x="${x}" y="${y}"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="${size}" font-weight="600"
        letter-spacing="${size * 0.14}"
        fill="${PALETTE[accent].ink}">${text}</text>`;
}

/** Primary writing line · 1.3-1.5px solid ink. */
export function solidLine(x1: number, y: number, x2: number, w = 1.3): string {
  return `  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${PALETTE.ink}" stroke-width="${w}"/>`;
}

/** Secondary writing line · 0.9px dotted ink. */
export function dottedLine(x1: number, y: number, x2: number, w = 0.9): string {
  return `  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${PALETTE.ink}" stroke-width="${w}" stroke-dasharray="1,3"/>`;
}

// ─── Raster pipeline ─────────────────────────────────────────
//
// A sticker SVG gets rasterized at configurable resolutions:
//   @1× — the canvas size (400/600/800 × 600)
//   @2× — double, for retina preview
//   @3× — triple, for GoodNotes's internal scaling headroom
//   @4× — maximum we ship; keeps zoom-in crisp in GoodNotes' pinch-zoom.
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
  scale: 1 | 2 | 3 | 4 = 1,
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
