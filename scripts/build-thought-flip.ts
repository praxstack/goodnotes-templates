/**
 * Build Thought Flip — expanded CBT thought-record (clay).
 *
 * Post-refactor: all shell boilerplate lives in `stickerShell()`.
 * This file authors only the unique 3-column CBT body.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SIZE_CLASSES,
  PALETTE,
  stickerShell,
  rasterize,
  fontsCssInnerSize,
  archetype,
} from '../packages/core/src/sticker-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const OUT_DIR = path.join(
  REPO,
  'packs/journals/prax-journal/stickers/thought-flip',
);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const { width: W } = SIZE_CLASSES.expanded;
const accent = PALETTE.clay;

// 3-column grid: thought · test it · reframe
const colPadX = 40;
const colGap = 20;
const colW = (W - colPadX * 2 - colGap * 2) / 3; // ~227px
const colY = 240;

const columns = [
  { kicker: '§ THOUGHT', micro: 'what the brain is saying' },
  { kicker: '§ TEST IT', micro: 'is that actually true?' },
  { kicker: '§ REFRAME', micro: 'kinder · and truer' },
];

const colsSvg = columns.map((c, i) => {
  const x0 = colPadX + i * (colW + colGap);
  return `  <g transform="translate(${x0}, ${colY})">
    <text x="0" y="0"
          font-family="'JetBrains Mono', Menlo, monospace"
          font-size="11" font-weight="600"
          letter-spacing="${11 * 0.16}"
          fill="${accent.ink}">${c.kicker}</text>
    <text x="0" y="22"
          font-family="'Fraunces', Georgia, serif"
          font-size="11" font-style="italic"
          fill="${accent.ink}" fill-opacity="0.65"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">${c.micro}</text>
    <!-- primary solid + 3 secondary dotted -->
    <line x1="0" y1="60"  x2="${colW}" y2="60"  stroke="${PALETTE.ink}" stroke-width="1.3"/>
    <line x1="0" y1="110" x2="${colW}" y2="110" stroke="${PALETTE.ink}" stroke-width="0.8" stroke-dasharray="1,3"/>
    <line x1="0" y1="150" x2="${colW}" y2="150" stroke="${PALETTE.ink}" stroke-width="0.8" stroke-dasharray="1,3"/>
    <line x1="0" y1="190" x2="${colW}" y2="190" stroke="${PALETTE.ink}" stroke-width="0.8" stroke-dasharray="1,3"/>
    <line x1="0" y1="230" x2="${colW}" y2="230" stroke="${PALETTE.ink}" stroke-width="0.8" stroke-dasharray="1,3"/>
  </g>`;
}).join('\n');

const bodySvg = `
  <!-- Dashed anchor under subtitle (matches Mood Dot's spectrum anchor) -->
  <line x1="${W / 2 - 160}" y1="180" x2="${W / 2 + 160}" y2="180"
        stroke="${accent.ink}" stroke-opacity="0.15"
        stroke-width="0.7" stroke-dasharray="1,4"/>

${colsSvg}
`;

const svg = stickerShell({
  id: 'thought-flip',
  title: 'Thought Flip',
  desc: 'A warm-analog CBT sticker with a clay accent rail. Three columns — thought, test it, reframe — with writing lines for each. The core Ramsay + Rostain thought-record pattern, compacted to a peel-in card.',
  size: 'expanded',
  accent: 'clay',
  kicker: '§ THOUGHT FLIP',
  hero: 'the flip',
  subtitle: 'CBT · catch it, test it, rewrite it',
  whisper: 'a thought is not a fact · give it one test',
  bodySvg,
  // CLINIC archetype — the "reviewed clinical form" feel. A top
  // thread-stitch, a FIELD · 2026 date stamp under the kicker, a
  // rotated "CBT · REVIEWED" rubber-stamp at the lower-left third,
  // and a stitched inset border. No pins, no tape — this sticker is
  // serious. Counter-balance: stamp sits left, date-stamp sits left,
  // so the right side stays quiet for the third writing column.
  skeuo: archetype('clinic', 'expanded', 'clay', { stampLabel: 'CBT · REVIEWED' }),
});

writeFileSync(path.join(OUT_DIR, 'thought-flip.svg'), svg);
const fontsSize = fontsCssInnerSize();
console.log(`  ✓ thought-flip.svg  (${Math.round(svg.length / 1024)} KB · geometry ≈ ${Math.round((svg.length - fontsSize) / 1024)} KB)`);

const raster = await rasterize(svg, path.join(OUT_DIR, 'thought-flip.png'), 4);
console.log(`  ✓ thought-flip.png  ${raster.width}×${raster.height}  (${Math.round(raster.bytes / 1024)} KB)`);
