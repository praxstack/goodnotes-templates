/**
 * Test CBT sticker rendering — generates all 4 types in warm-neutral + midnight themes.
 * Usage: npx tsx scripts/test-cbt-stickers.ts
 */
import { generateStickerSVG, STICKER_SIZES, type StickerType } from '../src/core/svg-renderer.js';
import { getTheme } from '../src/core/themes.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const cbtTypes: StickerType[] = ['cbt-thought-check', 'cbt-reframe', 'self-compassion-card', 'permission-card'];
const themes = ['warm-neutral', 'midnight'];
const outputDir = 'output/stickers/cbt-test';

async function main() {
  console.log('\n🎨 Rendering CBT stickers\n');
  await fs.mkdir(outputDir, { recursive: true });

  for (const themeName of themes) {
    const theme = getTheme(themeName);
    for (const type of cbtTypes) {
      const svg = generateStickerSVG(type, theme);
      const size = STICKER_SIZES[type];
      const scale = 300 / 72;
      const w = Math.round(size.width * scale);
      const h = Math.round(size.height * scale);
      const png = await sharp(Buffer.from(svg)).resize(w, h).png({ compressionLevel: 6 }).toBuffer();
      const outPath = path.join(outputDir, `${type}-${themeName}.png`);
      await fs.writeFile(outPath, png);
      console.log(`  ✓ ${type} (${themeName}) — ${(png.length / 1024).toFixed(0)} KB (${w}×${h})`);
    }
  }

  console.log(`\n  ✅ All ${cbtTypes.length * themes.length} CBT stickers rendered to ${outputDir}/\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
