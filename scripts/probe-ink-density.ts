/**
 * Companion analyzer for probe-sharp-fraunces.ts.
 * Measures ink density in the central Ag region of the sharp-rendered PNG.
 *
 * Usage: npx tsx scripts/probe-ink-density.ts
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const png = readFileSync('output/probe-sharp-fraunces.png');
const img = sharp(png);
const meta = await img.metadata();
const { data } = await img.raw().toBuffer({ resolveWithObject: true });
const W = meta.width ?? 600;
const H = meta.height ?? 600;
const x0 = Math.floor(W * 0.25);
const x1 = Math.floor(W * 0.75);
const y0 = Math.floor(H * 0.40);
const y1 = Math.floor(H * 0.65);
const chans = meta.channels ?? 3;
let dark = 0;
let total = 0;
for (let y = y0; y < y1; y++) {
  for (let x = x0; x < x1; x++) {
    const i = (y * W + x) * chans;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    total++;
    if (r < 120 && g < 120 && b < 120) dark++;
  }
}
const density = ((dark / total) * 100).toFixed(2);
console.log(`  sharp PNG: ink density = ${density}% of cropped "Ag" region`);
console.log('  interpretation guide:');
console.log('    > 4%  → font rendered (Fraunces or fallback)');
console.log('    0-1% → NO font loaded, text silently skipped');
console.log('    Fraunces 180px "Ag" typically: 5-9%');
console.log('    Times-class fallback:            3-5%');
console.log('    Nothing:                         < 1%');
