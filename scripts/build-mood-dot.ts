/**
 * Build Mood Dot — the canary sticker (compact · lavender).
 *
 * Captures a 1–10 mood dot + "one word" + "why". Proves the base64
 * Fraunces pipeline for the entire 12-sticker library.
 *
 * Post-refactor: all boilerplate (paper, rail, kicker, hero, subtitle,
 * whisper, footer) lives in `stickerShell()` in sticker-renderer.ts.
 * This file only authors the unique bodySvg (the 1–10 scale +
 * writing-zone block).
 *
 * Design review §3 rubric · DESIGN.md §3–§5 grammar.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SIZE_CLASSES,
  PALETTE,
  stickerShell,
  kickerLine,
  solidLine,
  dottedLine,
  rasterize,
  fontsCssInnerSize,
  archetype,
} from '../packages/core/src/sticker-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const OUT_DIR = path.join(
  REPO,
  'packs/journals/prax-journal/stickers/mood-dot',
);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const { width: W } = SIZE_CLASSES.compact;
const accent = PALETTE.lavender;

// ─── Unique body: 10-dot scale + "one word" + "why" ─────────
// The scale sits at y=245 with "low ↔ high" anchors above it;
// a dotted hairline at y=320 separates data from prose.

const scaleY = 245;
const scaleX0 = 40;
const scaleX1 = W - 40;
const scaleGap = (scaleX1 - scaleX0) / 9;
const dotRadius = 13;

const dots = Array.from({ length: 10 }, (_, i) => {
  const cx = scaleX0 + i * scaleGap;
  return `  <g transform="translate(${cx}, ${scaleY})">
    <circle cx="0" cy="0" r="${dotRadius}"
            fill="rgba(249, 245, 236, 0.65)"
            stroke="${accent.edge}" stroke-width="1"/>
    <text x="0" y="30" text-anchor="middle"
          font-family="'JetBrains Mono', Menlo, monospace"
          font-size="10" font-weight="500"
          fill="${accent.ink}" fill-opacity="0.7">${i + 1}</text>
  </g>`;
}).join('\n');

const bodySvg = `
  <!-- "low ↔ high" anchors above the scale -->
  <g transform="translate(${W / 2}, 210)">
    <text x="-150" y="0" text-anchor="start"
          font-family="'Fraunces', Georgia, serif"
          font-size="10" font-style="italic"
          fill="${accent.ink}" fill-opacity="0.55">low</text>
    <text x="150" y="0" text-anchor="end"
          font-family="'Fraunces', Georgia, serif"
          font-size="10" font-style="italic"
          fill="${accent.ink}" fill-opacity="0.55">high</text>
    <line x1="-130" y1="-4" x2="130" y2="-4"
          stroke="${accent.ink}" stroke-opacity="0.15"
          stroke-width="0.7" stroke-dasharray="1,4"/>
  </g>

  <!-- 10-dot scale (no connecting spine — the anchor line above
       already carries "spectrum" meaning without competing with
       the rail) -->
${dots}

  <!-- Dotted separator: DATA above · PROSE below -->
  <line x1="40" y1="320" x2="${W - 40}" y2="320"
        stroke="rgba(42,40,36,0.18)" stroke-width="0.6"
        stroke-dasharray="1,3"/>

  <!-- "§ ONE WORD" — primary solid line -->
${kickerLine('§ ONE WORD', 40, 355, 'lavender')}
${solidLine(40, 388, W - 40, 1.4)}

  <!-- "§ WHY" — two dotted secondary lines -->
${kickerLine('§ WHY', 40, 435, 'lavender')}
${dottedLine(40, 468, W - 40)}
${dottedLine(40, 502, W - 40)}
`;

const svg = stickerShell({
  id: 'mood-dot',
  title: 'Mood Dot',
  desc: 'A warm-analog field-journal sticker in the Prax Journal pack. Textured cream paper with a softened lavender rail, washi-tape corner accent and stitched inset border signal a hand-kept field book rather than a clinical form. A Fraunces serif title "how I\'m feeling" anchors the hero, a 10-dot horizontal spectrum lets the user tap a mood on a 1-to-10 scale, and two writing zones capture "one word" and "why".',
  size: 'compact',
  accent: 'lavender',
  kicker: '§ MOOD DOT',
  hero: "how I'm feeling",
  subtitle: 'right now, plain',
  whisper: 'an observation · not a verdict',
  bodySvg,
  // HERBARIUM archetype: pressed-leaf top-right, botanical sprig
  // bottom-left, stitched inset. Soft, observational, no hard
  // statement elements — fits the "observation · not a verdict"
  // whisper. Curated 3 elements, diagonal counter-balance.
  skeuo: archetype('herbarium', 'compact', 'lavender'),
});

const SVG_PATH = path.join(OUT_DIR, 'mood-dot.svg');
const PNG_PATH = path.join(OUT_DIR, 'mood-dot.png');

writeFileSync(SVG_PATH, svg);
const fontsSize = fontsCssInnerSize();
console.log(`  ✓ ${path.relative(REPO, SVG_PATH)}  (${Math.round(svg.length / 1024)} KB · geometry ≈ ${Math.round((svg.length - fontsSize) / 1024)} KB)`);

const raster = await rasterize(svg, PNG_PATH, 4);
console.log(`  ✓ ${path.relative(REPO, raster.path)}  ${raster.width}×${raster.height}  (${Math.round(raster.bytes / 1024)} KB)`);
