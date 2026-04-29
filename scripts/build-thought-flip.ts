/**
 * Build Thought Flip — expanded-size CBT sticker (clay accent).
 *
 * 3-column CBT thought-record pattern: catch the thought, test it
 * against evidence, rewrite kinder and truer.
 *
 * Canvas: 800×600 expanded · rx=32
 * Accent: clay (confrontational without shouting · DESIGN.md §3.3)
 * Shared grammar from the C5a Mood Dot canary.
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
  'packs/journals/prax-journal/stickers/thought-flip',
);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const { width: W, height: H, rx: RX } = SIZE_CLASSES.expanded;
const accent = PALETTE.clay;

const inlineFontCss = fontsDefs()
  .replace(/^\s*<defs>\s*<style><!\[CDATA\[/m, '')
  .replace(/\]\]><\/style>\s*<\/defs>\s*$/m, '');

// ─── 3-column grid geometry ─────────────────────────────────
const colPadX = 40;
const colGap = 20;
const colW = (W - colPadX * 2 - colGap * 2) / 3; // ~227px per column
const colY = 240;
const colH = 260;

const columns: Array<{ kicker: string; micro: string }> = [
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
    <!-- 1 primary solid line + 3 secondary dotted -->
    <line x1="0" y1="60"  x2="${colW}" y2="60"  stroke="${PALETTE.ink}" stroke-width="1.3"/>
    <line x1="0" y1="110" x2="${colW}" y2="110" stroke="${PALETTE.ink}" stroke-width="0.8" stroke-dasharray="1,3"/>
    <line x1="0" y1="150" x2="${colW}" y2="150" stroke="${PALETTE.ink}" stroke-width="0.8" stroke-dasharray="1,3"/>
    <line x1="0" y1="190" x2="${colW}" y2="190" stroke="${PALETTE.ink}" stroke-width="0.8" stroke-dasharray="1,3"/>
    <line x1="0" y1="230" x2="${colW}" y2="230" stroke="${PALETTE.ink}" stroke-width="0.8" stroke-dasharray="1,3"/>
  </g>`;
}).join('\n');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     role="img" aria-labelledby="thought-flip-title thought-flip-desc">
  <title id="thought-flip-title">Thought Flip</title>
  <desc id="thought-flip-desc">A warm-analog CBT sticker with a clay accent rail.
  Three columns — thought, test it, reframe — with writing lines for each.
  The core Ramsay + Rostain thought-record pattern, compacted to a peel-in card.</desc>

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
        fill="${accent.ink}">§ THOUGHT FLIP</text>

  <!-- Hero -->
  <text x="${W / 2}" y="115"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="44" font-weight="400"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 72, 'SOFT' 60;">the flip</text>

  <!-- Subtitle -->
  <text x="${W / 2}" y="148"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="14" font-style="italic"
        fill="${accent.ink}" fill-opacity="0.8"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">CBT · catch it, test it, rewrite it</text>

  <!-- Dashed anchor under subtitle (same voice move as Mood Dot) -->
  <line x1="${W / 2 - 160}" y1="180" x2="${W / 2 + 160}" y2="180"
        stroke="${accent.ink}" stroke-opacity="0.15"
        stroke-width="0.7" stroke-dasharray="1,4"/>

  <!-- 3 columns -->
${colsSvg}

  <!-- Whisper -->
  <text x="${W / 2}" y="540"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="12" font-style="italic"
        fill="${accent.ink}" fill-opacity="0.55"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">a thought is not a fact · give it one test</text>

  <!-- Footer -->
  <text x="${W / 2}" y="${H - 18}"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="9" font-weight="400"
        letter-spacing="${9 * 0.2}"
        fill="${accent.ink}" fill-opacity="0.45">PRAX JOURNAL · STICKER</text>

</svg>
`;

writeFileSync(path.join(OUT_DIR, 'thought-flip.svg'), svg);
const raster = await rasterize(svg, path.join(OUT_DIR, 'thought-flip.png'), 4);
console.log(`  ✓ thought-flip.svg  (${Math.round(svg.length / 1024)} KB)`);
console.log(`  ✓ thought-flip.png  ${raster.width}×${raster.height}  (${Math.round(raster.bytes / 1024)} KB)`);
