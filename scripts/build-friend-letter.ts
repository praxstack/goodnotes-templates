/**
 * Build Friend Letter — expanded-size Neff self-compassion sticker (sage accent).
 *
 * Invites the user to write to themselves as they would write to a
 * friend — 6 dotted prose lines + "Dear __" + signoff.
 *
 * Canvas: 800×600 expanded · rx=32
 * Accent: sage (gentle growth · DESIGN.md §3.2)
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
  'packs/journals/prax-journal/stickers/friend-letter',
);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const { width: W, height: H, rx: RX } = SIZE_CLASSES.expanded;
const accent = PALETTE.sage;

const inlineFontCss = fontsDefs()
  .replace(/^\s*<defs>\s*<style><!\[CDATA\[/m, '')
  .replace(/\]\]><\/style>\s*<\/defs>\s*$/m, '');

// ─── Prose lines geometry ─────────────────────────────────
const lineX0 = 60;
const lineX1 = W - 60; // 740
const lineY0 = 220;
const lineGap = 44;

const proseLines = Array.from({ length: 6 }, (_, i) => {
  const y = lineY0 + i * lineGap;
  return `  <line x1="${lineX0}" y1="${y}" x2="${lineX1}" y2="${y}"
        stroke="${PALETTE.ink}" stroke-width="0.9"
        stroke-dasharray="1,3" stroke-opacity="0.75"/>`;
}).join('\n');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     role="img" aria-labelledby="friend-letter-title friend-letter-desc">
  <title id="friend-letter-title">Friend Letter</title>
  <desc id="friend-letter-desc">A warm-analog self-compassion sticker with a sage rail.
  Invites the user to write a letter to themselves about the thing they're ashamed
  of, the way they would write to a friend in the same situation. Neff self-compassion
  pattern. One 'Dear __' line, six dotted prose lines, a signoff line.</desc>

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
        fill="${accent.ink}">§ FRIEND LETTER</text>

  <!-- Hero (2-line, softer break so it reads as prose not headline) -->
  <text x="${W / 2}" y="105"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="30" font-weight="400"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 72, 'SOFT' 80;">write to yourself</text>
  <text x="${W / 2}" y="140"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="30" font-weight="400"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 72, 'SOFT' 80;">as you'd write to a friend</text>

  <!-- Subtitle -->
  <text x="${W / 2}" y="172"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="13" font-style="italic"
        fill="${accent.ink}" fill-opacity="0.8"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">about the thing you're ashamed of</text>

  <!-- "Dear ___" line (primary, solid) -->
  <text x="${lineX0}" y="200"
        font-family="'Fraunces', Georgia, serif"
        font-size="16"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 18, 'SOFT' 60;">Dear</text>
  <line x1="${lineX0 + 44}" y1="204" x2="${lineX1 - 40}" y2="204"
        stroke="${PALETTE.ink}" stroke-width="1.3"/>
  <text x="${lineX1}" y="200" text-anchor="end"
        font-family="'Fraunces', Georgia, serif"
        font-size="16"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 18, 'SOFT' 60;">,</text>

  <!-- 6 dotted prose lines -->
${proseLines}

  <!-- Signoff -->
  <text x="${lineX0}" y="500"
        font-family="'Fraunces', Georgia, serif"
        font-size="14" font-style="italic"
        fill="${PALETTE.ink}" fill-opacity="0.75"
        style="font-variation-settings: 'opsz' 18, 'SOFT' 100;">— love,</text>
  <line x1="${lineX0 + 75}" y1="504" x2="${lineX0 + 310}" y2="504"
        stroke="${PALETTE.ink}" stroke-width="1"/>

  <!-- Whisper -->
  <text x="${W / 2}" y="545"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="12" font-style="italic"
        fill="${accent.ink}" fill-opacity="0.55"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 100;">be the friend you wish had shown up · Neff</text>

  <!-- Footer -->
  <text x="${W / 2}" y="${H - 18}"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="9" font-weight="400"
        letter-spacing="${9 * 0.2}"
        fill="${accent.ink}" fill-opacity="0.45">PRAX JOURNAL · STICKER</text>

</svg>
`;

writeFileSync(path.join(OUT_DIR, 'friend-letter.svg'), svg);
const raster = await rasterize(svg, path.join(OUT_DIR, 'friend-letter.png'), 4);
console.log(`  ✓ friend-letter.svg  (${Math.round(svg.length / 1024)} KB)`);
console.log(`  ✓ friend-letter.png  ${raster.width}×${raster.height}  (${Math.round(raster.bytes / 1024)} KB)`);
