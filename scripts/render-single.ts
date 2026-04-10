/**
 * Render a single template to PDF with optional color mode.
 * Usage: npx tsx scripts/render-single.ts <html-path> [colorMode]
 * Example: npx tsx scripts/render-single.ts src/templates/html/habit-tracker.html bubblegum
 */
import { renderHTMLToPDFFile, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { getPageDimensions } from '../src/core/dimensions.js';
import path from 'path';

const htmlPath = process.argv[2];
const colorMode = process.argv[3];

if (!htmlPath) {
  console.error('Usage: npx tsx scripts/render-single.ts <html-path> [colorMode]');
  process.exit(1);
}

async function main() {
  const dims = getPageDimensions('a4', 'portrait');
  const baseName = path.basename(htmlPath, '.html');
  const suffix = colorMode ? `-${colorMode}` : '';
  const outPath = `output/templates/${baseName}${suffix}.pdf`;

  console.log(`\n🎨 Rendering ${baseName}${colorMode ? ` (${colorMode})` : ''}...\n`);

  const result = await renderHTMLToPDFFile(
    { htmlPath, dimensions: dims, colorMode },
    outPath
  );

  console.log(`  ✅ ${baseName}: ${(result.size / 1024).toFixed(0)} KB → ${outPath}`);
  await closeBrowser();
  console.log('\nDone!\n');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
