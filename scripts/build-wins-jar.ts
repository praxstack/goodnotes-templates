/**
 * Build Wins Jar — expanded cumulative-wins sticker (amber).
 *
 * 10 numbered lines on the left; hand-drawn glass jar on the right,
 * half-filled with amber warmth.
 *
 * Post-refactor: shell lives in `stickerShell()`. This file only
 * authors the numbered rows + the jar ornament path.
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
  'packages/packs-prax-journal/stickers/wins-jar',
);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const accent = PALETTE.amber;

// 10 numbered rows on the left
const rowsX0 = 50;
const rowsWidth = 460;
const rowsY0 = 200;
const rowH = 32;

const rows = Array.from({ length: 10 }, (_, i) => {
  const y = rowsY0 + i * rowH;
  const n = String(i + 1).padStart(2, '0');
  return `  <g transform="translate(${rowsX0}, ${y})">
    <text x="0" y="6"
          font-family="'JetBrains Mono', Menlo, monospace"
          font-size="11" font-weight="600"
          fill="${accent.ink}" fill-opacity="0.7">${n}</text>
    <line x1="36" y1="12" x2="${rowsWidth}" y2="12"
          stroke="${PALETTE.ink}" stroke-width="1"/>
  </g>`;
}).join('\n');

// Hand-drawn glass jar on the right — amber-stroked, half-filled
const jarX = 605;
const jarY = 195;
const jarW = 150;
const jarH = 320;

const jar = `  <g transform="translate(${jarX}, ${jarY})"
        stroke="${accent.rail}" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        fill="none" opacity="0.85">
    <path d="M20 0 L${jarW - 20} 0 L${jarW - 26} 30 L26 30 Z"/>
    <line x1="22" y1="22" x2="${jarW - 22}" y2="22" stroke-width="1" opacity="0.5"/>
    <path d="M10 30 L${jarW - 10} 30 L${jarW - 14} ${jarH - 8}
             a8 8 0 0 1 -8 8 L22 ${jarH} a8 8 0 0 1 -8 -8 Z"/>
    <line x1="20" y1="${jarH * 0.5}" x2="${jarW - 20}" y2="${jarH * 0.5}" stroke-width="1" opacity="0.35"/>
    <!-- amber-tinted contents filling ~half -->
    <path d="M14 ${jarH * 0.55}
             C ${jarW * 0.3} ${jarH * 0.5}, ${jarW * 0.7} ${jarH * 0.6}, ${jarW - 14} ${jarH * 0.55}
             L ${jarW - 14} ${jarH - 8}
             a 8 8 0 0 1 -8 8
             L 22 ${jarH}
             a 8 8 0 0 1 -8 -8 Z"
          fill="${accent.rail}" fill-opacity="0.18" stroke="none"/>
    <circle cx="${jarW * 0.35}" cy="${jarH * 0.72}" r="3" fill="${accent.rail}" fill-opacity="0.45" stroke="none"/>
    <circle cx="${jarW * 0.62}" cy="${jarH * 0.82}" r="2" fill="${accent.rail}" fill-opacity="0.4" stroke="none"/>
  </g>`;

const bodySvg = `
${rows}

${jar}
`;

const svg = stickerShell({
  id: 'wins-jar',
  title: 'Wins Jar',
  desc: 'A warm-analog wins-accumulation sticker with an amber rail. Ten numbered lines on the left capture small wins as they happen; a hand-drawn glass jar on the right fills with amber warmth as a visual accumulator.',
  size: 'expanded',
  accent: 'amber',
  kicker: '§ WINS JAR',
  hero: 'wins jar',
  subtitle: 'even the tiniest counts · drop it in',
  whisper: 'put a small one in the jar · especially on the hard days',
  bodySvg,
  // FIELD-NOTE archetype — the "pinned to my book" feel. Kraft washi
  // tape + navy pushpin at top-right, FIELD · 2026 date stamp under
  // the kicker on the left, pressed-leaf atmosphere bottom-left.
  // Counter-balance: the tape/pin anchor is top-right, the leaf is
  // bottom-left — diagonal rhythm, no corner-cluster.
  skeuo: archetype('field-note', 'expanded', 'amber', { dateText: 'FIELD · 2026' }),
});

writeFileSync(path.join(OUT_DIR, 'wins-jar.svg'), svg);
const fontsSize = fontsCssInnerSize();
console.log(`  ✓ wins-jar.svg  (${Math.round(svg.length / 1024)} KB · geometry ≈ ${Math.round((svg.length - fontsSize) / 1024)} KB)`);

const raster = await rasterize(svg, path.join(OUT_DIR, 'wins-jar.png'), 4);
console.log(`  ✓ wins-jar.png  ${raster.width}×${raster.height}  (${Math.round(raster.bytes / 1024)} KB)`);
