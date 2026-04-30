/**
 * Build Friend Letter — expanded Neff self-compassion sticker (sage).
 *
 * 2-line hero + "Dear __" salutation + 6 dotted prose lines + "— love," signoff.
 *
 * Post-refactor: shell handles frame; this file authors the 2nd hero
 * line, the salutation, the prose grid, and the signoff.
 *
 * Since Friend Letter has a 2-line hero (unique in the library), we
 * override `heroFontSize` + `heroY` and emit the 2nd hero line ourselves
 * as part of bodySvg. The shell still handles the subtitle underneath.
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
  'packages/packs-prax-journal/stickers/friend-letter',
);
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const { width: W } = SIZE_CLASSES.expanded;

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

const bodySvg = `
  <!-- Second hero line — the shell painted "write to yourself";
       we complete the thought with "as you'd write to a friend". -->
  <text x="${W / 2}" y="140"
        text-anchor="middle"
        font-family="'Fraunces', Georgia, serif"
        font-size="30" font-weight="400"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 72, 'SOFT' 80;">as you'd write to a friend</text>

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
`;

const svg = stickerShell({
  id: 'friend-letter',
  title: 'Friend Letter',
  desc: 'A warm-analog self-compassion sticker with a sage rail. Invites the user to write a letter to themselves about the thing they\'re ashamed of, the way they would write to a friend in the same situation. Neff self-compassion pattern.',
  size: 'expanded',
  accent: 'sage',
  kicker: '§ FRIEND LETTER',
  hero: 'write to yourself',
  subtitle: "about the thing you're ashamed of",
  whisper: 'be the friend you wish had shown up · Neff',
  // 2-line hero requires smaller font + earlier positions so the 2nd line fits
  heroFontSize: 30,
  heroY: 105,
  subtitleY: 172,
  bodySvg,
  skeuo: archetype('clinic', 'expanded', 'sage', { stampLabel: 'PRIVATE', dateText: 'SESSION · 2026' }),
});

writeFileSync(path.join(OUT_DIR, 'friend-letter.svg'), svg);
const fontsSize = fontsCssInnerSize();
console.log(`  ✓ friend-letter.svg  (${Math.round(svg.length / 1024)} KB · geometry ≈ ${Math.round((svg.length - fontsSize) / 1024)} KB)`);

const raster = await rasterize(svg, path.join(OUT_DIR, 'friend-letter.png'), 4);
console.log(`  ✓ friend-letter.png  ${raster.width}×${raster.height}  (${Math.round(raster.bytes / 1024)} KB)`);
