/**
 * Probe: does sharp/librsvg respect @font-face with base64 data: WOFF2?
 *
 * Design review §3 flagged this as the #1 risk for C5: if librsvg falls back
 * to system Times we need a different render path (Puppeteer-based rasterizer
 * instead of sharp SVG->PNG). This script authors one tiny SVG with Fraunces
 * heroed in the title, renders it at 600×600 via sharp, writes it to
 * `output/probe-sharp-fraunces.png`, and prints the base64-fingerprint of the
 * first 40 pixels. Wide-glyph Fraunces (with its distinctive serifs) vs Times
 * is diff-able by eye at a glance.
 *
 * Usage: npx tsx scripts/probe-sharp-fraunces.ts
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.resolve(__dirname, '..');

// ─── Helpers ────────────────────────────────────────────────────
function b64(file: string): string {
  return readFileSync(file).toString('base64');
}

const FRAUNCES = path.join(REPO, 'shared/fonts/fraunces/fraunces-normal-w400-700.woff2');
const frauncesB64 = b64(FRAUNCES);

// ─── The probe SVG (with @font-face + data URI) ───────────────
// If librsvg honors @font-face+data:woff2 → the glyph is distinctively
// Fraunces (slab serifs, tall x-height). If it falls back, we get
// DejaVu/Bitstream/Times-like sans.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <style><![CDATA[
      @font-face {
        font-family: 'Fraunces';
        src: url(data:font/woff2;base64,${frauncesB64}) format('woff2');
        font-weight: 400;
        font-style: normal;
      }
      .hero {
        font-family: 'Fraunces', 'Times New Roman', serif;
        font-weight: 400;
        font-size: 180px;
        fill: #2A2824;
      }
      .label {
        font-family: 'Fraunces', 'Times New Roman', serif;
        font-weight: 400;
        font-size: 28px;
        fill: #6E6658;
        font-style: italic;
      }
    ]]></style>
  </defs>
  <rect width="600" height="600" fill="#F9F5EC"/>
  <rect x="0" y="0" width="600" height="5" fill="#B6A9CB"/>
  <text x="300" y="340" text-anchor="middle" class="hero">Ag</text>
  <text x="300" y="460" text-anchor="middle" class="label">Fraunces reference glyphs</text>
</svg>
`;

// ─── Render + write PNG ──────────────────────────────────────
const OUT = path.join(REPO, 'output/probe-sharp-fraunces.png');
const SVG_OUT = path.join(REPO, 'output/probe-sharp-fraunces.svg');
if (!existsSync(path.dirname(OUT))) mkdirSync(path.dirname(OUT), { recursive: true });

writeFileSync(SVG_OUT, svg);
console.log(`  ✓ svg written  ${path.relative(REPO, SVG_OUT)}  (${svg.length.toLocaleString()}B incl. ${frauncesB64.length.toLocaleString()}B base64 font)`);

await sharp(Buffer.from(svg))
  .png()
  .toFile(OUT);

console.log(`  ✓ png rendered ${path.relative(REPO, OUT)}`);
console.log('');
console.log('Next: open the PNG. If "Ag" shows tall serifs with a gently curved');
console.log('stem (Fraunces) → base64 @font-face works, ship C5 with this pipeline.');
console.log('If "Ag" looks Times/DejaVu (boxy, narrow) → pipeline needs Puppeteer,');
console.log('not sharp. Switch C5 author path.');
