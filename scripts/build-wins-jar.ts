/**
 * Build Wins Jar — expanded-size cumulative wins sticker (amber accent).
 *
 * 10 numbered slots on the LEFT, hand-drawn jar ornament on the RIGHT.
 * Fills over time as the user deposits small wins.
 *
 * Canvas: 800×600 expanded · rx=32
 * Accent: amber (warmth accumulation · DESIGN.md §3.4)
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
  'packs/journals/prax-journal/stickers/wins-jar',
);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const { width: W, height: H, rx: RX } = SIZE_CLASSES.expanded;
const accent = PALETTE.amber;

const inlineFontCss = fontsDefs()
  .replace(/^\s*<defs>\s*<style><!\[CDATA\[/m, '')
  .replace(/\]\]><\/style>\s*<\/defs>\s*$/m, '');

// ─── 10 numbered rows on the left ──────────────────────────
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

// ─── Jar ornament on the right (hand-drawn) ────────────────
// 110mm tall amber-stroked jar. Mirrors the Midday page jar mascot
// but scaled to fit the sticker, positioned where the eye lands.
const jarX = 605;
const jarY = 195;
const jarW = 150;
const jarH = 320;

const jar = `  <g transform="translate(${jarX}, ${jarY})" stroke="${accent.rail}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85">
    <!-- Lid -->
    <path d="M20 0 L${jarW - 20} 0 L${jarW - 26} 30 L26 30 Z"/>
    <!-- Lid groove hint -->
    <line x1="22" y1="22" x2="${jarW - 22}" y2="22" stroke-width="1" opacity="0.5"/>
    <!-- Jar body -->
    <path d="M10 30 L${jarW - 10} 30 L${jarW - 14} ${jarH - 8} a8 8 0 0 1 -8 8 L22 ${jarH} a8 8 0 0 1 -8 -8 Z"/>
    <!-- Label band (one horizontal hairline across the jar) -->
    <line x1="20" y1="${jarH * 0.5}" x2="${jarW - 20}" y2="${jarH * 0.5}" stroke-width="1" opacity="0.35"/>
    <!-- Warmth inside — contents filling ~half the jar, amber-tint -->
    <path d="M14 ${jarH * 0.55}
             C ${jarW * 0.3} ${jarH * 0.5}, ${jarW * 0.7} ${jarH * 0.6}, ${jarW - 14} ${jarH * 0.55}
             L ${jarW - 14} ${jarH - 8}
             a 8 8 0 0 1 -8 8
             L 22 ${jarH}
             a 8 8 0 0 1 -8 -8 Z"
          fill="${accent.rail}" fill-opacity="0.18" stroke="none"/>
    <!-- Two floaty specks of content -->
    <circle cx="${jarW * 0.35}" cy="${jarH * 0.72}" r="3" fill="${accent.rail}" fill-opacity="0.45" stroke="none"/>
    <circle cx="${jarW * 0.62}" cy="${jarH * 0.82}" r="2" fill="${accent.rail}" fill-opacity="0.4" stroke="none"/>
  </g>`;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     role="img" aria-labelledby="wins-jar-title wins-jar-desc">
  <title id="wins-jar-title">Wins Jar</title>
  <desc id="wins-jar-desc">A warm-analog wins-accumulation sticker with an amber rail.
  Ten numbered lines on the left capture small wins as they happen; a hand-drawn
  glass jar on the right fills with amber warmth as a visual accumulator.</desc>

  <defs>
    <style><![CDATA[${inlineFontCss}]]></style>
    <linearGradient id="paperWarmth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FBF7EE"/>
      <stop offset="100%" stop-color="#F4EFE0"/>
    </linearGradient>
    <filter id="paperGrain" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="3" seed="7"/>
      <feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.10  0 0 0 0 0.08  0 0 0 0.12 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"/>
    </clipPath>
  </defs>

  <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}" fill="url(#paperWarmth)"/>
  <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}" fill="${PALETTE.paper}" filter="url(#paperGrain)"/>

  <rect x="0" y="0" width="${W}" height="8"
        fill="${accent.rail}" fill-opacity="0.72"
        clip-path="url(#cardClip)"/>

  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${RX}" ry="${RX}"
        fill="none" stroke="${accent.edge}" stroke-width="1"/>

  <!-- Kicker -->
  <text x="${W / 2}" y="50"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="11" font-weight="600"
        letter-spacing="${11 * 0.18}"
        fill="${accent.ink}">§ WINS JAR</text>

  <!-- Hero -->
  <text x="${W / 2}" y="115"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="44" font-weight="400"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 72, 'SOFT' 60;">wins jar</text>

  <!-- Subtitle -->
  <text x="${W / 2}" y="150"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="14" font-style="italic"
        fill="${accent.ink}" fill-opacity="0.8"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">even the tiniest counts · drop it in</text>

  <!-- 10 numbered rows -->
${rows}

  <!-- Jar ornament -->
${jar}

  <!-- Whisper -->
  <text x="${W / 2}" y="540"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="12" font-style="italic"
        fill="${accent.ink}" fill-opacity="0.55"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">put a small one in the jar · especially on the hard days</text>

  <!-- Footer -->
  <text x="${W / 2}" y="${H - 18}"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="9" font-weight="400"
        letter-spacing="${9 * 0.2}"
        fill="${accent.ink}" fill-opacity="0.45">PRAX JOURNAL · STICKER</text>

</svg>
`;

writeFileSync(path.join(OUT_DIR, 'wins-jar.svg'), svg);
const raster = await rasterize(svg, path.join(OUT_DIR, 'wins-jar.png'), 4);
console.log(`  ✓ wins-jar.svg  (${Math.round(svg.length / 1024)} KB)`);
console.log(`  ✓ wins-jar.png  ${raster.width}×${raster.height}  (${Math.round(raster.bytes / 1024)} KB)`);
