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

/**
 * The 5 WOFF2 files every v5 surface (stickers + journal pages) ships with.
 * Single source of truth — imported by `scripts/inline-v5-fonts.ts` so the
 * two pipelines can't drift. Add a font here → both surfaces pick it up.
 */
export const FONT_FILES = [
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

// ─── Skeuomorphic accent layer (hybrid field-journal aesthetic) ──
//
// Optional overlays inspired by analog field journals: washi tape,
// pushpin at a corner, a small rubber-stamp label, a folded-corner
// dog-ear, a stitched inset border, a faded pressed-leaf watermark.
// Each element is opt-in via `StickerShellOptions.skeuo` so an
// individual sticker picks the 1-2 accents it wants. Kept tasteful
// by default: most stickers will use { tape: 'top-right' } alone or
// `{ tape, pushpin }` together. Avoid piling on everything at once —
// the sticker still needs to read as a clean analog card, not a
// scrapbook page.

export type TapeCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type PushpinColor = 'red' | 'brass' | 'navy' | 'moss';

export interface SkeuoAccents {
  /** Washi tape strip at a corner. `color` defaults to a warm kraft. */
  tape?: {
    corner: TapeCorner;
    /** Optional hex fill. Defaults to warm kraft `#D9C8A3` at 0.78 alpha. */
    color?: string;
    /** Tape width in SVG units. Default 110. */
    width?: number;
    /** Tape height in SVG units. Default 28. */
    height?: number;
    /** Rotation in degrees. Default ±8 by corner. */
    rotate?: number;
  };
  /** Small pushpin head, usually paired with a tape corner. */
  pushpin?: {
    cx: number;
    cy: number;
    color?: PushpinColor;
  };
  /** A rotated rubber-stamp label (e.g. "FIELD TEST", "CONFIDENTIAL"). */
  stamp?: {
    label: string;
    cx: number;
    cy: number;
    /** Rotation in degrees. Default -12. */
    rotate?: number;
    color?: 'clay' | 'sage' | 'amber' | 'lavender';
  };
  /** Top-right folded-corner dog-ear. `size` default 44. */
  cornerFold?: { size?: number };
  /** Inset stitched border (2.5px dashed line ~14px inside the edge). */
  stitched?: boolean;
  /** A faded pressed-leaf watermark (small SVG path) at (cx, cy, scale, rotate). */
  pressedLeaf?: {
    cx: number;
    cy: number;
    /** Scale factor. Default 0.9. */
    scale?: number;
    /** Rotation in degrees. Default 18. */
    rotate?: number;
  };
}

const PUSHPIN_COLORS: Record<PushpinColor, { head: string; shadow: string; glint: string }> = {
  red:   { head: '#C14B3A', shadow: '#7A2A1E', glint: '#F2B8AC' },
  brass: { head: '#B8923B', shadow: '#6B4F1B', glint: '#EED39A' },
  navy:  { head: '#3E5878', shadow: '#1E2B3F', glint: '#B9C7DD' },
  moss:  { head: '#6B8359', shadow: '#354228', glint: '#BBD0A6' },
};

// ─── Skeuomorphic render filters (shared <defs>) ───────────────
// Real depth requires filters — drop shadows with direction, inner
// shadows for recesses, feTurbulence+feDisplacement for distress
// (torn tape, cracked stamp), and radial gradients for specular
// highlights. Each primitive references these by ID.
//
// Filters are injected into the sticker's <defs> via `skeuoDefs()`.

/** Full <defs> block of skeuo filters + gradients. Inject once per sticker. */
export function skeuoDefs(): string {
  return `
    <!-- Soft directional drop shadow (for tape, pin, seal — raised objects) -->
    <filter id="skeuoDrop" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.6"/>
      <feOffset dx="1.2" dy="2.4"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.55"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Heavy shadow for wax seals and bigger raised pieces -->
    <filter id="skeuoDropLarge" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3.2"/>
      <feOffset dx="2" dy="4"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.6"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Grunge / distressed edge (for rubber stamps and worn marks).
         feTurbulence generates noise → feDisplacementMap pushes the
         source image around those noise coordinates, creating
         irregular broken edges. scale=3 keeps it subtle. -->
    <filter id="skeuoGrunge" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
    </filter>

    <!-- Paper fiber (stronger than the card-level grain). Used on
         overlays like tape to give them texture. -->
    <filter id="skeuoFiber" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="2.3" numOctaves="3" seed="5"/>
      <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0.18 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>

    <!-- Tape translucency / crease highlight gradient -->
    <linearGradient id="tapeShine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="rgba(255,255,255,0.38)"/>
      <stop offset="45%" stop-color="rgba(255,255,255,0.04)"/>
      <stop offset="55%" stop-color="rgba(60,42,20,0.02)"/>
      <stop offset="100%" stop-color="rgba(60,42,20,0.22)"/>
    </linearGradient>

    <!-- Pushpin head radial gradient — glint at top-left, dark rim -->
    <radialGradient id="pinHead" cx="30%" cy="30%" r="75%">
      <stop offset="0%" stop-color="var(--pin-glint, #F2B8AC)"/>
      <stop offset="45%" stop-color="var(--pin-head, #C14B3A)"/>
      <stop offset="100%" stop-color="var(--pin-shadow, #7A2A1E)"/>
    </radialGradient>

    <!-- Wax seal radial gradient — specular highlight + dark edge -->
    <radialGradient id="waxShine" cx="35%" cy="30%" r="75%">
      <stop offset="0%"  stop-color="rgba(255,255,255,0.5)"/>
      <stop offset="30%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
    </radialGradient>
  `;
}

/** Render a washi-tape strip at a corner with translucency, fiber,
 *  soft shadow, and deckle edges. */
export function washiTape(
  W: number,
  H: number,
  opts: NonNullable<SkeuoAccents['tape']>,
): string {
  const color = opts.color ?? '#D9C8A3';
  const tw = opts.width ?? 110;
  const th = opts.height ?? 28;
  const padX = 22;
  const padY = 22;
  let tx = padX;
  let ty = padY;
  let defaultRot = -8;
  if (opts.corner === 'top-right')    { tx = W - padX - tw; defaultRot = 8; }
  if (opts.corner === 'bottom-left')  { ty = H - padY - th; defaultRot = 8; }
  if (opts.corner === 'bottom-right') { tx = W - padX - tw; ty = H - padY - th; defaultRot = -8; }
  const rot = opts.rotate ?? defaultRot;
  const cx = tx + tw / 2;
  const cy = ty + th / 2;
  // Deckle (torn) edges: irregular polygon endpoints instead of clean rect.
  const deckle = 4;
  const leftEdge = `M ${tx},${ty + th * 0.1}
                    L ${tx + deckle * 0.8},${ty}
                    L ${tx - deckle * 0.4},${ty + th * 0.4}
                    L ${tx + deckle * 0.6},${ty + th * 0.7}
                    L ${tx - deckle * 0.3},${ty + th}`;
  const rightEdge = `L ${tx + tw + deckle * 0.3},${ty + th * 0.9}
                     L ${tx + tw - deckle * 0.5},${ty + th * 0.6}
                     L ${tx + tw + deckle * 0.4},${ty + th * 0.3}
                     L ${tx + tw - deckle * 0.2},${ty}
                     Z`;
  return `
  <g transform="rotate(${rot} ${cx} ${cy})" filter="url(#skeuoDrop)">
    <!-- Tape body with deckled (torn) short edges -->
    <path d="${leftEdge} L ${tx + tw},${ty} ${rightEdge}"
          fill="${color}" fill-opacity="0.88"/>
    <!-- translucent shine band — sells the plastic film -->
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}"
          fill="url(#tapeShine)" opacity="0.85"/>
    <!-- paper fibers inside the tape -->
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}"
          fill="${color}" filter="url(#skeuoFiber)" opacity="0.7"/>
    <!-- faint edge ink -->
    <path d="${leftEdge} L ${tx + tw},${ty} ${rightEdge}"
          fill="none" stroke="rgba(60,42,20,0.22)" stroke-width="0.8"/>
  </g>`;
}

/** Render a 3D-lit pushpin head with radial gradient + cast shadow. */
export function pushpin(
  cx: number,
  cy: number,
  color: PushpinColor = 'red',
): string {
  const c = PUSHPIN_COLORS[color];
  const r = 9;
  return `
  <g style="--pin-head:${c.head}; --pin-glint:${c.glint}; --pin-shadow:${c.shadow};">
    <!-- Cast soft shadow (ground) -->
    <ellipse cx="${cx + 2}" cy="${cy + 4}" rx="${r + 2}" ry="${r * 0.5}"
             fill="rgba(42,40,36,0.28)" filter="url(#skeuoDrop)"/>
    <!-- Pin dome — radial gradient does the lighting -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.head}"/>
    <!-- Specular gradient overlay: paint the highlight explicitly
         so we stay compatible with sharp / librsvg. -->
    <circle cx="${cx}" cy="${cy}" r="${r}"
            fill="url(#waxShine)" opacity="0.65"/>
    <!-- Rim / dark edge accent -->
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${c.shadow}" stroke-width="1.2" stroke-opacity="0.75"/>
    <!-- Bright specular point -->
    <ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.4}"
             rx="${r * 0.35}" ry="${r * 0.22}"
             fill="#FFFFFF" fill-opacity="0.75"/>
    <!-- Secondary highlight -->
    <circle cx="${cx - r * 0.1}" cy="${cy - r * 0.15}" r="${r * 0.15}"
            fill="${c.glint}" fill-opacity="0.9"/>
  </g>`;
}

/** Render a rotated rubber-stamp label with distressed grunge edges. */
export function rubberStamp(
  opts: NonNullable<SkeuoAccents['stamp']>,
): string {
  const accent = opts.color ?? 'clay';
  const color = PALETTE[accent].ink;
  const rot = opts.rotate ?? -12;
  const w = Math.max(opts.label.length * 10 + 28, 90);
  const h = 32;
  const cx = opts.cx;
  const cy = opts.cy;
  return `
  <g transform="rotate(${rot} ${cx} ${cy})" opacity="0.85" filter="url(#skeuoGrunge)">
    <!-- Outer ink border -->
    <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}"
          fill="none" stroke="${color}" stroke-width="2.5" rx="3" ry="3"
          stroke-opacity="0.85"/>
    <!-- Inner ink border -->
    <rect x="${cx - w / 2 + 4}" y="${cy - h / 2 + 4}" width="${w - 8}" height="${h - 8}"
          fill="none" stroke="${color}" stroke-width="0.9" rx="2" ry="2"
          stroke-opacity="0.55"/>
    <!-- Pressed text -->
    <text x="${cx}" y="${cy + 4}" text-anchor="middle"
          font-family="'JetBrains Mono', Menlo, monospace"
          font-size="12" font-weight="700" letter-spacing="${12 * 0.22}"
          fill="${color}" fill-opacity="0.9">${opts.label}</text>
  </g>`;
}

/** Top-right folded-corner dog-ear. */
export function cornerFold(W: number, size = 44): string {
  // Triangle at the top-right corner + a slightly darker triangle
  // for the "underside" of the fold, plus a soft shadow line.
  return `
  <g>
    <!-- the folded flap -->
    <polygon points="${W - size},0 ${W},0 ${W},${size}"
             fill="#EFE7D3" stroke="rgba(60,42,20,0.18)" stroke-width="0.8"/>
    <!-- underside shading -->
    <polygon points="${W - size},0 ${W},${size} ${W - size * 0.3},${size * 0.3}"
             fill="rgba(0,0,0,0.08)"/>
    <!-- crease -->
    <line x1="${W - size}" y1="0" x2="${W}" y2="${size}"
          stroke="rgba(60,42,20,0.35)" stroke-width="0.8"/>
  </g>`;
}

/** Inset stitched border — dashed line 14px inside the card edge. */
export function stitchedBorder(
  W: number,
  H: number,
  RX: number,
  accent: Accent,
): string {
  const inset = 14;
  return `
  <rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}"
        rx="${Math.max(RX - 6, 8)}" ry="${Math.max(RX - 6, 8)}"
        fill="none" stroke="${PALETTE[accent].ink}" stroke-width="0.9"
        stroke-opacity="0.35" stroke-dasharray="4,3"/>`;
}

/** A faded pressed-leaf silhouette (botanical watermark). */
export function pressedLeaf(
  cx: number,
  cy: number,
  scale = 0.9,
  rotate = 18,
  accent: Accent = 'sage',
): string {
  const ink = PALETTE[accent].ink;
  // Simple leaf path — a rounded almond with a central vein and four side veins.
  // Sized ~80×40 at scale 1.0.
  return `
  <g transform="translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})" opacity="0.22">
    <path d="M -40 0 Q -20 -22 0 -16 Q 20 -10 40 0 Q 20 10 0 16 Q -20 22 -40 0 Z"
          fill="${ink}" fill-opacity="0.45"/>
    <line x1="-40" y1="0" x2="40" y2="0" stroke="${ink}" stroke-width="0.8" stroke-opacity="0.6"/>
    <line x1="-20" y1="-14" x2="-10" y2="0"  stroke="${ink}" stroke-width="0.5" stroke-opacity="0.5"/>
    <line x1="0"   y1="-16" x2="0"   y2="0"  stroke="${ink}" stroke-width="0.5" stroke-opacity="0.5"/>
    <line x1="20"  y1="-14" x2="10"  y2="0"  stroke="${ink}" stroke-width="0.5" stroke-opacity="0.5"/>
    <line x1="-20" y1="14"  x2="-10" y2="0"  stroke="${ink}" stroke-width="0.5" stroke-opacity="0.5"/>
    <line x1="20"  y1="14"  x2="10"  y2="0"  stroke="${ink}" stroke-width="0.5" stroke-opacity="0.5"/>
  </g>`;
}

// ─── Enriched skeuomorphic primitives (svg-principal-engineer toolkit) ──
//
// These pushed-further helpers draw from the filters-cookbook
// (feTurbulence/feDisplacementMap for torn edges, feConvolveMatrix
// for embossed metal, inner-shadow for paper-depth) and build the
// world-class analog feel: ribbons, wax seals, thread-stitching,
// ledger rules, rubber-stamp dates, thumbprints, botanical sprigs.
//
// All are pure SVG fragment builders — no runtime deps. Stickers
// mix-and-match via the DeluxeSkeuo interface (next).

/**
 * A satin ribbon bookmark that hangs from the top edge. Useful as a
 * "tab" for stickers that need categorical sorting (e.g. "morning"
 * vs "evening" variants).
 */
export function ribbonTab(
  x: number,
  y: number,
  length = 90,
  color: Accent = 'clay',
  label?: string,
): string {
  const c = PALETTE[color];
  const w = 48;
  return `
  <g>
    <!-- ribbon shadow -->
    <path d="M ${x + 1.5} ${y + 2} L ${x + w + 1.5} ${y + 2} L ${x + w + 1.5} ${y + length + 2} L ${x + w / 2 + 1.5} ${y + length - 10 + 2} L ${x + 1.5} ${y + length + 2} Z"
          fill="rgba(42,40,36,0.2)"/>
    <!-- ribbon body -->
    <path d="M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + length} L ${x + w / 2} ${y + length - 10} L ${x} ${y + length} Z"
          fill="${c.rail}" fill-opacity="0.85"/>
    <!-- ribbon inner highlight -->
    <line x1="${x + 6}" y1="${y + 2}" x2="${x + 6}" y2="${y + length - 14}"
          stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
    <!-- optional label (mono) -->
    ${label ? `<text x="${x + w / 2}" y="${y + 22}" text-anchor="middle"
          font-family="'JetBrains Mono', Menlo, monospace"
          font-size="9" font-weight="600" letter-spacing="${9 * 0.2}"
          fill="#FFFFFF" fill-opacity="0.92">${label}</text>` : ''}
  </g>`;
}

/**
 * Wax seal — small circular emblem with embossed monogram. Lives
 * at a corner, replacing or augmenting the rubber-stamp.
 */
export function waxSeal(
  cx: number,
  cy: number,
  monogram = '§',
  color: Accent = 'clay',
  radius = 28,
): string {
  const c = PALETTE[color];
  // Dripped-wax outline: a circle with 5 small irregular protrusions.
  const dripPath = [
    `M ${cx - radius * 0.95},${cy - radius * 0.35}`,
    `C ${cx - radius * 1.15},${cy - radius * 0.15} ${cx - radius * 1.1},${cy + radius * 0.15} ${cx - radius * 0.9},${cy + radius * 0.4}`,
    `C ${cx - radius * 0.7},${cy + radius * 0.95} ${cx - radius * 0.3},${cy + radius * 1.08} ${cx},${cy + radius * 1.0}`,
    `C ${cx + radius * 0.35},${cy + radius * 1.1} ${cx + radius * 0.85},${cy + radius * 0.9} ${cx + radius * 1.02},${cy + radius * 0.4}`,
    `C ${cx + radius * 1.18},${cy + radius * 0.05} ${cx + radius * 1.1},${cy - radius * 0.4} ${cx + radius * 0.85},${cy - radius * 0.6}`,
    `C ${cx + radius * 0.55},${cy - radius * 0.95} ${cx + radius * 0.1},${cy - radius * 1.1} ${cx - radius * 0.35},${cy - radius * 0.95}`,
    `C ${cx - radius * 0.75},${cy - radius * 0.85} ${cx - radius * 1.0},${cy - radius * 0.6} ${cx - radius * 0.95},${cy - radius * 0.35}`,
    'Z',
  ].join(' ');
  return `
  <g>
    <!-- wax drop shadow -->
    <ellipse cx="${cx + 2}" cy="${cy + 3}" rx="${radius + 2}" ry="${radius * 0.85}"
             fill="rgba(42,40,36,0.28)"/>
    <!-- wax body with irregular drip shape -->
    <path d="${dripPath}"
          fill="${c.rail}" fill-opacity="0.92"/>
    <!-- inner shadow ring (darker) -->
    <circle cx="${cx}" cy="${cy}" r="${radius * 0.82}" fill="none"
            stroke="${c.ink}" stroke-width="1.5" stroke-opacity="0.55"/>
    <!-- specular highlight -->
    <ellipse cx="${cx - radius * 0.3}" cy="${cy - radius * 0.4}"
             rx="${radius * 0.3}" ry="${radius * 0.2}"
             fill="rgba(255,255,255,0.35)"/>
    <!-- pressed monogram -->
    <text x="${cx}" y="${cy + radius * 0.22}" text-anchor="middle"
          font-family="'Fraunces', Georgia, serif"
          font-size="${radius * 0.95}" font-weight="700"
          fill="#FFFFFF" fill-opacity="0.85"
          style="font-variation-settings: 'opsz' 72;">${monogram}</text>
  </g>`;
}

/**
 * Hand-drawn ledger ruling — a pair of hairlines like an old
 * accountant's ledger book. Use at a y-offset to partition sections.
 */
export function ledgerRule(
  x1: number,
  x2: number,
  y: number,
  accent: Accent = 'clay',
): string {
  const c = PALETTE[accent];
  return `
  <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"
        stroke="${c.ink}" stroke-width="0.8" stroke-opacity="0.65"/>
  <line x1="${x1}" y1="${y + 3.5}" x2="${x2}" y2="${y + 3.5}"
        stroke="${c.ink}" stroke-width="0.5" stroke-opacity="0.35"/>`;
}

/**
 * Horizontal thread-stitch line (looks like book-binding thread
 * weaving through the sticker). Used near the top to suggest the
 * sticker is a stitched-in page.
 */
export function threadStitch(
  x1: number,
  x2: number,
  y: number,
  color = '#8A3E2E',
): string {
  const segs = 18;
  const w = (x2 - x1) / segs;
  const dashes: string[] = [];
  for (let i = 0; i < segs; i += 2) {
    const sx = x1 + i * w;
    const ex = sx + w;
    dashes.push(`<line x1="${sx}" y1="${y}" x2="${ex}" y2="${y}" stroke="${color}" stroke-width="1.2" stroke-opacity="0.72" stroke-linecap="round"/>`);
  }
  return `  <g>${dashes.join('')}</g>`;
}

/**
 * Field-book date stamp — a small mono-typewriter label with square
 * brackets. Cheap to drop in below the kicker for "FIELD NOTE · DATE".
 */
export function dateStamp(
  x: number,
  y: number,
  text: string,
  color: Accent = 'clay',
): string {
  const c = PALETTE[color].ink;
  return `
  <g opacity="0.78">
    <rect x="${x - 2}" y="${y - 10}" width="${text.length * 7.2 + 4}" height="14"
          fill="none" stroke="${c}" stroke-width="0.8" stroke-opacity="0.55" rx="1"/>
    <text x="${x + 2}" y="${y}" font-family="'JetBrains Mono', Menlo, monospace"
          font-size="9" font-weight="500" letter-spacing="${9 * 0.2}"
          fill="${c}" fill-opacity="0.88">${text}</text>
  </g>`;
}

/**
 * A tiny botanical sprig — more detailed than the pressedLeaf,
 * drawn as a stem with two pairs of leaves. For corner decoration.
 */
export function botanicalSprig(
  cx: number,
  cy: number,
  scale = 1,
  rotate = 0,
  accent: Accent = 'sage',
): string {
  const c = PALETTE[accent].ink;
  return `
  <g transform="translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})" opacity="0.45">
    <!-- stem -->
    <path d="M 0 -40 Q 2 -20 0 0 Q -2 20 0 40"
          fill="none" stroke="${c}" stroke-width="1.2" stroke-opacity="0.7" stroke-linecap="round"/>
    <!-- top-left leaf -->
    <path d="M 0 -30 Q -18 -32 -22 -22 Q -14 -16 0 -22 Z"
          fill="${c}" fill-opacity="0.45"/>
    <!-- top-right leaf -->
    <path d="M 0 -18 Q 18 -18 22 -8 Q 14 -4 0 -10 Z"
          fill="${c}" fill-opacity="0.45"/>
    <!-- bottom-left leaf -->
    <path d="M 0 -4 Q -16 -2 -20 10 Q -12 14 0 4 Z"
          fill="${c}" fill-opacity="0.45"/>
    <!-- bottom-right leaf -->
    <path d="M 0 12 Q 18 14 22 26 Q 12 28 0 20 Z"
          fill="${c}" fill-opacity="0.45"/>
  </g>`;
}

/**
 * A second washi tape layer (for double-banding). Slightly narrower,
 * different color, offset behind the first tape. Call this BEFORE
 * washiTape() in the render order so the main tape sits on top.
 */
export function washiTapeUnderlay(
  W: number,
  H: number,
  opts: NonNullable<SkeuoAccents['tape']>,
): string {
  const tw = (opts.width ?? 110) + 20;
  const th = (opts.height ?? 28) - 4;
  const color = opts.color ?? '#EFE2C0';
  const padX = 18;
  const padY = 34;
  let tx = padX;
  let ty = padY;
  let defaultRot = -4;
  if (opts.corner === 'top-right')    { tx = W - padX - tw; defaultRot = 4; }
  if (opts.corner === 'bottom-left')  { ty = H - padY - th; defaultRot = 4; }
  if (opts.corner === 'bottom-right') { tx = W - padX - tw; ty = H - padY - th; defaultRot = -4; }
  const rot = opts.rotate ?? defaultRot;
  const cx = tx + tw / 2;
  const cy = ty + th / 2;
  return `
  <g transform="rotate(${rot} ${cx} ${cy})" opacity="0.65">
    <rect x="${tx}" y="${ty}" width="${tw}" height="${th}"
          fill="${color}" fill-opacity="0.72"
          stroke="rgba(60,42,20,0.1)" stroke-width="0.5"/>
  </g>`;
}

/**
 * A fine stippled thumbprint in a corner — suggests this is a
 * worked-in page. Subtle; usually sub-0.25 opacity.
 */
export function thumbprint(
  cx: number,
  cy: number,
  scale = 1,
  accent: Accent = 'clay',
): string {
  const c = PALETTE[accent].ink;
  // Simplified thumbprint as concentric arcs.
  return `
  <g transform="translate(${cx} ${cy}) scale(${scale})" opacity="0.18">
    <path d="M -18 -5 Q -16 -14 -6 -18 Q 6 -20 14 -12 Q 18 -4 14 6 Q 8 14 -4 14 Q -14 12 -18 4"
          fill="none" stroke="${c}" stroke-width="0.8" stroke-opacity="0.7"/>
    <path d="M -14 -3 Q -12 -10 -4 -13 Q 4 -14 10 -8 Q 13 -2 10 4 Q 6 10 -2 10 Q -10 9 -14 3"
          fill="none" stroke="${c}" stroke-width="0.7" stroke-opacity="0.6"/>
    <path d="M -10 -1 Q -8 -6 -2 -8 Q 3 -9 7 -5 Q 9 -1 7 3 Q 4 7 -1 7 Q -7 6 -10 2"
          fill="none" stroke="${c}" stroke-width="0.6" stroke-opacity="0.5"/>
    <path d="M -6 0 Q -4 -3 0 -4 Q 3 -4 5 -1 Q 6 2 3 4 Q 0 5 -3 4 Q -6 3 -6 1"
          fill="none" stroke="${c}" stroke-width="0.5" stroke-opacity="0.4"/>
  </g>`;
}

// ─── Archetype presets (frontend-design discipline) ─────────────
//
// Problem with the deluxe primitive palette: stacking every element
// (tape + pin + seal + stamp + leaf + sprig + thumbprint + …) on one
// sticker looks like a scrapbook, not a field journal. The design
// review critique was "randomly placed, not tastefully paced".
//
// Fix: curated named archetypes. Each archetype picks 3-4 elements
// with deliberate spatial counter-balance (if the focal anchor is
// top-right, the atmosphere element sits bottom-left — diagonal
// rhythm, not corner-cluster).
//
// The 4 archetypes map to the 4 sticker families:
//
//   FIELD-NOTE  → ADHD / behavioural / time / habit
//                 tape top-right + pin + date-stamp + pressed-leaf BL
//   LEDGER      → tracking / screener / med / quant
//                 stitched + ledger-rules + wax-seal TL + thumbprint BR
//   HERBARIUM   → savouring / gratitude / positive-psych / somatic
//                 pressed-leaf TL + botanical-sprig BR + stitched
//   CLINIC      → CBT / DBT / OCD / ERP / medical screeners
//                 rubber-stamp + date-stamp + stitched + thread-stitch
//
// Each takes (size, accent) and returns a balanced DeluxeSkeuoAccents
// object. Callers may still override any field by spreading the result.

export type SkeuoArchetype = 'field-note' | 'ledger' | 'herbarium' | 'clinic';

/** Compute sensible corner coordinates for the given size class. */
function archCorners(size: StickerSize): {
  W: number; H: number;
  tl: { x: number; y: number };
  tr: { x: number; y: number };
  bl: { x: number; y: number };
  br: { x: number; y: number };
} {
  const { width: W, height: H } = SIZE_CLASSES[size];
  return {
    W, H,
    tl: { x: 32, y: 42 },
    tr: { x: W - 32, y: 42 },
    bl: { x: 60, y: H - 64 },
    br: { x: W - 60, y: H - 64 },
  };
}

/**
 * Build a curated archetype preset. Pass the result as `skeuo:` to
 * `stickerShell()`, or spread-override specific fields.
 *
 * @example
 *   stickerShell({ ..., skeuo: archetype('field-note', 'standard', 'sage') })
 *   stickerShell({ ...,
 *     skeuo: { ...archetype('ledger', 'compact', 'lavender'), dateStamp: { x: 40, y: 82, text: 'SOS' } }
 *   })
 */
export function archetype(
  kind: SkeuoArchetype,
  size: StickerSize,
  accent: Accent,
  opts: { dateText?: string; stampLabel?: string; monogram?: string } = {},
): DeluxeSkeuoAccents {
  const { W, H, bl, br } = archCorners(size);

  switch (kind) {
    case 'field-note':
      // FOCAL: tape+pin top-right (the "pinned to my book" signal).
      // QUIET: field-date stamp under the kicker (left).
      // ATMOSPHERE: stitched inset + pressed-leaf bottom-left.
      // No seal, no rubber-stamp, no thread — readability first.
      return {
        stitched: true,
        tape:         { corner: 'top-right', color: '#D9C8A3', width: Math.min(130, W * 0.3), height: 26 },
        pushpin:      { cx: W - 62, cy: 42, color: 'navy' },
        dateStamp:    { x: 36, y: 82, text: opts.dateText ?? 'FIELD · 2026', color: accent },
        pressedLeaf:  { cx: bl.x - 8, cy: bl.y, scale: 0.7, rotate: -18 },
      };

    case 'ledger':
      // FOCAL: wax-seal monogram top-left (single statement).
      // QUIET: thumbprint bottom-right, faint.
      // ATMOSPHERE: stitched inset.
      // Ledger-rules are part of the per-sticker body, not here — each
      // LEDGER sticker adds its own horizontal partitions.
      return {
        stitched: true,
        waxSeal:      { cx: 52, cy: 86, monogram: opts.monogram ?? '§', color: accent, radius: 22 },
        thumbprint:   { cx: br.x, cy: br.y + 20, scale: 0.7, accent },
      };

    case 'herbarium':
      // BOTANICAL COUNTERBALANCE: pressed-leaf top-right, sprig bottom-left.
      // ATMOSPHERE: stitched inset.
      // Soft — no hard statement elements. Savouring / gratitude mood.
      return {
        stitched: true,
        pressedLeaf:    { cx: W - 62, cy: 88, scale: 0.85, rotate: 24 },
        botanicalSprig: { cx: bl.x - 10, cy: bl.y - 10, scale: 0.7, rotate: -6, accent: 'sage' },
      };

    case 'clinic':
      // FOCAL: rubber-stamp label rotated, bottom-left third.
      // QUIET: field-date stamp under the kicker.
      // ATMOSPHERE: stitched inset + thread-stitch line at top.
      // Feels like a clinical reporting form that's been signed off.
      return {
        stitched: true,
        threadStitch: { x1: 40, x2: W - 40, y: 70, color: PALETTE[accent].ink },
        dateStamp:    { x: 36, y: 82, text: opts.dateText ?? 'SESSION · 2026', color: accent },
        stamp:        { label: opts.stampLabel ?? 'REVIEWED', cx: Math.min(180, W * 0.35), cy: H - 130, rotate: -14, color: accent },
      };
  }
}

/**
 * Extended skeuo accents — the "push further" layer. Supersedes
 * `SkeuoAccents` for stickers that want the full field-journal treatment.
 * All optional; layer what you want.
 */
export interface DeluxeSkeuoAccents extends SkeuoAccents {
  /** Double-banded tape (pairs with `tape` — drawn behind/offset). */
  tapeUnderlay?: NonNullable<SkeuoAccents['tape']>;
  /** A satin ribbon bookmark hanging off the top. */
  ribbon?: { x: number; y: number; length?: number; color?: Accent; label?: string };
  /** Wax seal — circular emblem with pressed monogram. */
  waxSeal?: { cx: number; cy: number; monogram?: string; color?: Accent; radius?: number };
  /** Ledger rule — a pair of thin hairlines to partition sections. */
  ledgerRules?: Array<{ x1: number; x2: number; y: number; accent?: Accent }>;
  /** Thread stitching horizontal line (book-binding thread). */
  threadStitch?: { x1: number; x2: number; y: number; color?: string };
  /** Date stamp label, typewriter-style in brackets. */
  dateStamp?: { x: number; y: number; text: string; color?: Accent };
  /** A detailed botanical sprig (stem + 4 leaves). */
  botanicalSprig?: { cx: number; cy: number; scale?: number; rotate?: number; accent?: Accent };
  /** Faint thumbprint in a corner. */
  thumbprint?: { cx: number; cy: number; scale?: number; accent?: Accent };
}

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
  /**
   * Optional skeuomorphic field-journal accents. Accepts either the
   * basic `SkeuoAccents` (tape, pin, stamp, fold, stitched, pressedLeaf)
   * or the `DeluxeSkeuoAccents` superset (adds ribbon, waxSeal,
   * ledgerRules, threadStitch, dateStamp, botanicalSprig, thumbprint,
   * double-banded tape). Layered between the paper/grain base and the
   * kicker/hero text stack so overlays sit *on* the card but *under*
   * the writing — readability always wins.
   */
  skeuo?: SkeuoAccents | DeluxeSkeuoAccents;
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

    <!-- Radial vignette — warms the center, shadows the edges.
         This is what makes the card look like it has thickness
         (a real sheet's center catches more light than its corners). -->
    <radialGradient id="paperVignette" cx="50%" cy="45%" r="70%">
      <stop offset="0%"   stop-color="#FFFAEE" stop-opacity="0.55"/>
      <stop offset="55%"  stop-color="#F9F5EC" stop-opacity="0.0"/>
      <stop offset="100%" stop-color="#8A6C3A" stop-opacity="0.22"/>
    </radialGradient>

    <!-- Visible paper fiber on the cream base. Stronger than the
         original grain — we want to SEE the fibers on a real render,
         not just feel them subconsciously. baseFrequency=0.55 makes
         broader strands; alpha=0.22 keeps the legibility. -->
    <filter id="paperGrain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="4" seed="7"/>
      <feColorMatrix values="0 0 0 0 0.22
                             0 0 0 0 0.18
                             0 0 0 0 0.12
                             0 0 0 0.22 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>

    <!-- Card-level drop shadow — the sticker sits on a surface.
         This is the single biggest "is this skeuomorphic" signal. -->
    <filter id="cardDrop" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
      <feOffset dx="0" dy="3"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.38"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Inset edge shadow — the paper's own thickness.
         Draws a soft dark ring just inside the edge so the border
         feels bevelled, not painted. Uses feMorphology + blur. -->
    <filter id="paperInset" x="-5%" y="-5%" width="110%" height="110%">
      <feMorphology in="SourceAlpha" operator="erode" radius="4"/>
      <feGaussianBlur stdDeviation="3"/>
      <feComposite in="SourceAlpha" in2="" operator="out"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.32"/>
      </feComponentTransfer>
      <feColorMatrix values="0 0 0 0 0
                             0 0 0 0 0
                             0 0 0 0 0
                             0 0 0 1 0"/>
    </filter>

    <!-- Top inner highlight (light catching the top edge of the page) -->
    <linearGradient id="paperTopHighlight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#FFFFFF" stop-opacity="0.48"/>
      <stop offset="10%" stop-color="#FFFFFF" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>

    <!-- Clip path = the squircle. Anything clipped to this will
         respect the rounded corners, which is how the rail gets
         its curved ends without being re-authored with its own rx. -->
    <clipPath id="cardClip">
      <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"/>
    </clipPath>

    ${skeuoDefs()}
  </defs>

  <!-- Card body · 8-layer tactile stack:
       (1) outer drop shadow (card sits on a surface)
       (2) warm cream gradient base
       (3) paper grain filter (fractalNoise fibers now visible)
       (4) radial vignette (edges darker than center — paper thickness)
       (5) top-edge inner highlight (light catching the top face)
       (6) inset dark ring (paper edge shadow, feMorphology+blur)
       (7) softened accent rail clipped to the squircle top
       (8) faint accent stroke border -->
  <!-- (1) outer cast shadow — the single biggest "skeuomorphic" signal -->
  <rect x="4" y="6" width="${W - 8}" height="${H - 4}" rx="${RX}" ry="${RX}"
        fill="rgba(42,40,36,0.28)" filter="url(#cardDrop)"/>

  <g clip-path="url(#cardClip)">
    <!-- (2) cream warmth gradient -->
    <rect x="0" y="0" width="${W}" height="${H}"
          fill="url(#paperWarmth)"/>
    <!-- (3) visible paper fiber -->
    <rect x="0" y="0" width="${W}" height="${H}"
          fill="${PALETTE.paper}" filter="url(#paperGrain)"/>
    <!-- (4) radial vignette — warms center, shadows corners -->
    <rect x="0" y="0" width="${W}" height="${H}"
          fill="url(#paperVignette)"/>
    <!-- (5) top-edge light highlight — only first 80px -->
    <rect x="0" y="0" width="${W}" height="80"
          fill="url(#paperTopHighlight)"/>
    <!-- (7) accent rail (kept for brand continuity) -->
    <rect x="0" y="0" width="${W}" height="8"
          fill="${a.rail}" fill-opacity="0.82"/>
  </g>

  <!-- (6) inset edge shadow — drawn OUTSIDE the clip so it can
       actually show an inner ring. Uses feMorphology+blur. -->
  <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"
        fill="none" stroke="rgba(42,40,36,0.55)" stroke-width="12"
        filter="url(#paperInset)"/>
  <!-- (8) faint accent stroke border on top -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}"
        rx="${RX}" ry="${RX}"
        fill="none" stroke="${a.edge}" stroke-width="1.1"/>

  <!-- Skeuomorphic accents (optional): stitched border, pressed leaf,
       tape, pushpin, stamp, folded corner. Layered between the
       paper/rail and the kicker/hero text stack so textual elements
       stay legible even with ornaments present. Fully opt-in per-sticker
       via StickerShellOptions.skeuo. -->
  ${opts.skeuo?.stitched ? stitchedBorder(W, H, RX, opts.accent) : ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.pressedLeaf ? pressedLeaf(
      (opts.skeuo as DeluxeSkeuoAccents).pressedLeaf!.cx,
      (opts.skeuo as DeluxeSkeuoAccents).pressedLeaf!.cy,
      (opts.skeuo as DeluxeSkeuoAccents).pressedLeaf!.scale ?? 0.9,
      (opts.skeuo as DeluxeSkeuoAccents).pressedLeaf!.rotate ?? 18,
      opts.accent,
    ) : ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.botanicalSprig ? botanicalSprig(
      (opts.skeuo as DeluxeSkeuoAccents).botanicalSprig!.cx,
      (opts.skeuo as DeluxeSkeuoAccents).botanicalSprig!.cy,
      (opts.skeuo as DeluxeSkeuoAccents).botanicalSprig!.scale ?? 1,
      (opts.skeuo as DeluxeSkeuoAccents).botanicalSprig!.rotate ?? 0,
      (opts.skeuo as DeluxeSkeuoAccents).botanicalSprig!.accent ?? 'sage',
    ) : ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.thumbprint ? thumbprint(
      (opts.skeuo as DeluxeSkeuoAccents).thumbprint!.cx,
      (opts.skeuo as DeluxeSkeuoAccents).thumbprint!.cy,
      (opts.skeuo as DeluxeSkeuoAccents).thumbprint!.scale ?? 1,
      (opts.skeuo as DeluxeSkeuoAccents).thumbprint!.accent ?? 'clay',
    ) : ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.ledgerRules?.map(r =>
      ledgerRule(r.x1, r.x2, r.y, r.accent ?? 'clay'),
    ).join('\n') ?? ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.tapeUnderlay ? washiTapeUnderlay(
      W, H, (opts.skeuo as DeluxeSkeuoAccents).tapeUnderlay!,
    ) : ''}
  ${opts.skeuo?.tape ? washiTape(W, H, opts.skeuo.tape) : ''}
  ${opts.skeuo?.pushpin ? pushpin(
      opts.skeuo.pushpin.cx,
      opts.skeuo.pushpin.cy,
      opts.skeuo.pushpin.color ?? 'red',
    ) : ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.threadStitch ? threadStitch(
      (opts.skeuo as DeluxeSkeuoAccents).threadStitch!.x1,
      (opts.skeuo as DeluxeSkeuoAccents).threadStitch!.x2,
      (opts.skeuo as DeluxeSkeuoAccents).threadStitch!.y,
      (opts.skeuo as DeluxeSkeuoAccents).threadStitch!.color ?? '#8A3E2E',
    ) : ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.ribbon ? ribbonTab(
      (opts.skeuo as DeluxeSkeuoAccents).ribbon!.x,
      (opts.skeuo as DeluxeSkeuoAccents).ribbon!.y,
      (opts.skeuo as DeluxeSkeuoAccents).ribbon!.length ?? 90,
      (opts.skeuo as DeluxeSkeuoAccents).ribbon!.color ?? 'clay',
      (opts.skeuo as DeluxeSkeuoAccents).ribbon!.label,
    ) : ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.waxSeal ? waxSeal(
      (opts.skeuo as DeluxeSkeuoAccents).waxSeal!.cx,
      (opts.skeuo as DeluxeSkeuoAccents).waxSeal!.cy,
      (opts.skeuo as DeluxeSkeuoAccents).waxSeal!.monogram ?? '§',
      (opts.skeuo as DeluxeSkeuoAccents).waxSeal!.color ?? 'clay',
      (opts.skeuo as DeluxeSkeuoAccents).waxSeal!.radius ?? 28,
    ) : ''}
  ${(opts.skeuo as DeluxeSkeuoAccents)?.dateStamp ? dateStamp(
      (opts.skeuo as DeluxeSkeuoAccents).dateStamp!.x,
      (opts.skeuo as DeluxeSkeuoAccents).dateStamp!.y,
      (opts.skeuo as DeluxeSkeuoAccents).dateStamp!.text,
      (opts.skeuo as DeluxeSkeuoAccents).dateStamp!.color ?? 'clay',
    ) : ''}
  ${opts.skeuo?.stamp ? rubberStamp(opts.skeuo.stamp) : ''}
  ${opts.skeuo?.cornerFold ? cornerFold(W, opts.skeuo.cornerFold.size ?? 44) : ''}

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
