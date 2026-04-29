/**
 * Build Mood Dot — v3 · the canary sticker.
 *
 * Mood Dot is the C5 canary per design review §3: simplest sticker in
 * the library, shipped first to prove the base64-Fraunces pipeline.
 * svg-principal-engineer skill walked us through clarify → wireframe →
 * build. v3 adds paper-grain texture + reverts hero size + pulls the
 * scale up to rebalance the composition per user feedback.
 *
 * ## Layout (400×600 compact canvas)
 *
 *   0–5          5px lavender rail
 *   50           kicker "§ MOOD DOT"
 *   115          hero "how I'm feeling" (Fraunces 44px — reverted from 50)
 *   148          subtitle "right now, plain" (Fraunces italic)
 *   210          divider hairline (Fraunces-italic "low ↔ high" anchors)
 *   245          10-circle scale connected by a hairline spine
 *   275          numeric labels 1..10 under the circles
 *   320          dotted hairline separator (data → prose)
 *   355          kicker "§ ONE WORD"
 *   388          solid 1.4px primary writing line
 *   435          kicker "§ WHY"
 *   468, 502     two dotted secondary writing lines
 *   565          whisper "an observation · not a verdict"
 *   582          footer "PRAX JOURNAL · STICKER"
 *
 * ## Paper grain (NEW in v3)
 *
 *   `feTurbulence` fractalNoise at baseFrequency 0.85, 3 octaves →
 *   reshaped through `feColorMatrix` to alpha-only at 0.06 opacity,
 *   composited onto the paper rect. Gives the fibrous Tomoe-River
 *   paper feel the Warm Analog Editorial aesthetic calls for — the
 *   surface reads like cream stock, not flat CSS.
 *
 *   Source: svg-principal-engineer/filters-cookbook.md § "Paper grain"
 *
 * ## Palette discipline (DESIGN.md §3)
 *
 *   paper-base        #F9F5EC
 *   paper-warm        #F4EFE0   (second stop on the subtle gradient)
 *   ink               #2A2824
 *   lavender-ink      #6B5D86   (WCAG AA on cream, 4.7:1)
 *   lavender-rail     #B6A9CB
 *   lavender-edge     rgba(182,169,203,0.28)
 *
 *   5 hues; the two paper tones are within the same cream family so
 *   the sticker reads as ONE paper with subtle warmth, not two colors.
 *
 * ## Writing-zone rule (DESIGN.md §5.5)
 *
 *   "ONE WORD"  is primary → 1.4px SOLID
 *   "WHY"       is secondary → 0.9px DOTTED × 2 rows
 *
 * ## Self-validation (Phase 4 checklist)
 *   - [x] viewBox present
 *   - [x] <defs> used for fontsBlock + paper-grain filter + paper-gradient
 *   - [x] Filter region explicit (x=-10% y=-10% w=120% h=120%)
 *   - [x] All tags closed
 *   - [x] Content matches user spec
 *   - [x] No animations
 *   - [x] <title> + <desc> present
 *
 * Run: npx tsx scripts/build-mood-dot.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fontsDefs,
  rasterize,
  SIZE_CLASSES,
  PALETTE,
} from '../src/core/sticker-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const OUT_DIR = path.join(
  REPO,
  'packs/journals/prax-journal/stickers/mood-dot',
);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const { width: W, height: H, rx: RX } = SIZE_CLASSES.compact;
const accent = PALETTE.lavender;

// ─── Geometry for the 1-10 dot scale ────────────────────────
const scaleY = 245;
const scaleX0 = 40;
const scaleX1 = W - 40; // 360
const scaleGap = (scaleX1 - scaleX0) / 9; // 9 intervals → 10 dots
const dotRadius = 13;

const dots = Array.from({ length: 10 }, (_, i) => {
  const cx = scaleX0 + i * scaleGap;
  return `  <g transform="translate(${cx}, ${scaleY})">
    <circle cx="0" cy="0" r="${dotRadius}"
            fill="rgba(249, 245, 236, 0.65)"
            stroke="${accent.edge}"
            stroke-width="1"/>
    <text x="0" y="30"
          text-anchor="middle"
          font-family="'JetBrains Mono', Menlo, monospace"
          font-size="10" font-weight="500"
          fill="${accent.ink}"
          fill-opacity="0.7">${i + 1}</text>
  </g>`;
}).join('\n');

// ─── fontsDefs() returns the full <defs>; pull just the inner CSS so
//     we can fold it into a single <defs> alongside the paper filter +
//     the subtle paper gradient.
const inlineFontCss = fontsDefs()
  .replace(/^\s*<defs>\s*<style><!\[CDATA\[/m, '')
  .replace(/\]\]><\/style>\s*<\/defs>\s*$/m, '');

// ─── SVG composition ────────────────────────────────────────
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     role="img" aria-labelledby="mood-dot-title mood-dot-desc">
  <title id="mood-dot-title">Mood Dot</title>
  <desc id="mood-dot-desc">A warm-analog sticker in the Prax Journal pack.
  Textured cream paper with a lavender 5-pixel rail across the top
  signals neutral observation. A Fraunces serif title "how I'm feeling"
  anchors the hero, a 10-dot horizontal spectrum lets the user tap a
  mood on a 1 to 10 scale, and two writing zones capture "one word"
  and "why".</desc>

  <defs>
    <style><![CDATA[${inlineFontCss}]]></style>

    <!-- Subtle paper-warmth gradient — top slightly lighter, bottom
         slightly warmer. Keeps the eye traveling down the page. -->
    <linearGradient id="paperWarmth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FBF7EE"/>
      <stop offset="100%" stop-color="#F4EFE0"/>
    </linearGradient>

    <!-- Paper grain filter — fractalNoise reshaped to alpha-only.
         Source: svg-principal-engineer/filters-cookbook.md § Paper grain.
         baseFrequency tuned 0.95 for finer fibers (was 0.85 = too smooth).
         Alpha output 0.12 — visible middle-ground (0.08 was invisible, 0.18 read as noisy).
         Filter region generous so noise doesn't clip at rounded corners. -->
    <filter id="paperGrain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="3" seed="7"/>
      <feColorMatrix values="0 0 0 0 0.12
                             0 0 0 0 0.10
                             0 0 0 0 0.08
                             0 0 0 0.12 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>

    <!-- Clip path = the squircle. Anything clipped to this will respect
         the rounded corners at the top — this is how the lavender rail
         gets its curved edge without being re-authored with its own rx. -->
    <clipPath id="cardClip">
      <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"/>
    </clipPath>
  </defs>

  <!-- Card body · layered for tactility:
       (1) warm cream gradient base
       (2) same gradient shape overlaid with fractalNoise for grain
       (3) faint lavender border ring that reads as "deckle edge" -->
  <rect x="0" y="0" width="${W}" height="${H}"
        rx="${RX}" ry="${RX}"
        fill="url(#paperWarmth)"/>
  <rect x="0" y="0" width="${W}" height="${H}"
        rx="${RX}" ry="${RX}"
        fill="${PALETTE.paper}"
        filter="url(#paperGrain)"/>

  <!-- 8px softened lavender rail — clipped to the squircle so the top
       corners follow the card's radius. Hex stays lavender-rail;
       opacity 0.72 softens it to a warm wash instead of a saturated bar. -->
  <rect x="0" y="0" width="${W}" height="8"
        fill="${accent.rail}" fill-opacity="0.72"
        clip-path="url(#cardClip)"/>

  <!-- Faint border (squircle invariant per DESIGN.md §5.4) -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}"
        rx="${RX}" ry="${RX}"
        fill="none" stroke="${accent.edge}" stroke-width="1"/>

  <!-- Kicker -->
  <text x="${W / 2}" y="50"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="11" font-weight="600"
        letter-spacing="${11 * 0.18}"
        fill="${accent.ink}">§ MOOD DOT</text>

  <!-- Hero title: Fraunces 44px (reverted from 50), opsz 72 SOFT 60 -->
  <text x="${W / 2}" y="115"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="44" font-weight="400"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 72, 'SOFT' 60;">how I'm feeling</text>

  <!-- Subtitle -->
  <text x="${W / 2}" y="148"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="14" font-weight="400"
        font-style="italic"
        fill="${accent.ink}"
        fill-opacity="0.8"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">right now, plain</text>

  <!-- "low ↔ high" anchor labels (above the scale now; pushes scale up) -->
  <g transform="translate(${W / 2}, 210)">
    <text x="-150" y="0"
          text-anchor="start"
          font-family="'Fraunces', Georgia, serif"
          font-size="10" font-style="italic"
          fill="${accent.ink}" fill-opacity="0.55">low</text>
    <text x="150" y="0"
          text-anchor="end"
          font-family="'Fraunces', Georgia, serif"
          font-size="10" font-style="italic"
          fill="${accent.ink}" fill-opacity="0.55">high</text>
    <line x1="-130" y1="-4" x2="130" y2="-4"
          stroke="${accent.ink}" stroke-opacity="0.15"
          stroke-width="0.7" stroke-dasharray="1,4"/>
  </g>

  <!-- 10-dot scale — no connecting spine; the "low ↔ high" dashed anchor
       above carries the spectrum meaning without a flat purple line that
       visually competed with the rail. -->
${dots}

  <!-- Dotted hairline separator (DATA above · PROSE below) -->
  <line x1="40" y1="320" x2="${W - 40}" y2="320"
        stroke="rgba(42,40,36,0.18)" stroke-width="0.6"
        stroke-dasharray="1,3"/>

  <!-- "§ ONE WORD" kicker + primary writing line -->
  <text x="40" y="355"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="10" font-weight="600"
        letter-spacing="${10 * 0.14}"
        fill="${accent.ink}">§ ONE WORD</text>
  <line x1="40" y1="388" x2="${W - 40}" y2="388"
        stroke="${PALETTE.ink}" stroke-width="1.4"/>

  <!-- "§ WHY" kicker + two dotted secondary writing lines -->
  <text x="40" y="435"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="10" font-weight="600"
        letter-spacing="${10 * 0.14}"
        fill="${accent.ink}">§ WHY</text>
  <line x1="40" y1="468" x2="${W - 40}" y2="468"
        stroke="${PALETTE.ink}" stroke-width="0.9"
        stroke-dasharray="1,3"/>
  <line x1="40" y1="502" x2="${W - 40}" y2="502"
        stroke="${PALETTE.ink}" stroke-width="0.9"
        stroke-dasharray="1,3"/>

  <!-- Whisper — a quiet editorial line above the footer -->
  <text x="${W / 2}" y="555"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="12" font-style="italic"
        fill="${accent.ink}" fill-opacity="0.55"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">an observation · not a verdict</text>

  <!-- Footer -->
  <text x="${W / 2}" y="${H - 18}"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="9" font-weight="400"
        letter-spacing="${9 * 0.2}"
        fill="${accent.ink}"
        fill-opacity="0.45">PRAX JOURNAL · STICKER</text>

</svg>
`;

// ─── Write + rasterize ──────────────────────────────────────
const SVG_PATH = path.join(OUT_DIR, 'mood-dot.svg');
const PNG_PATH = path.join(OUT_DIR, 'mood-dot.png');

writeFileSync(SVG_PATH, svg);
console.log(`  ✓ ${path.relative(REPO, SVG_PATH)}  (${Math.round(svg.length / 1024)} KB · geometry ≈ ${Math.round((svg.length - inlineFontCss.length) / 1024)} KB)`);

const raster = await rasterize(svg, PNG_PATH, 1);
console.log(`  ✓ ${path.relative(REPO, raster.path)}  ${raster.width}×${raster.height}  (${Math.round(raster.bytes / 1024)} KB)`);

console.log('');
console.log('Mood Dot v3 built. Paper grain, warmth gradient, scale repositioned.');
console.log('Eye-check packs/journals/prax-journal/stickers/mood-dot/mood-dot.png in Preview.');
