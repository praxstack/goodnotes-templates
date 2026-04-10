/**
 * Render individual v3 template pages to PDF for visual testing.
 * Usage: npx tsx scripts/render-v3.ts [colorMode]
 */
import { renderHTMLToPDFFile, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { getPageDimensions } from '../src/core/dimensions.js';

const colorMode = process.argv[2]; // optional: 'dark'

async function main() {
  console.log(`\n🎨 Rendering v3 templates${colorMode ? ` (${colorMode})` : ''}...\n`);
  const dims = getPageDimensions('a4', 'portrait');
  const modeSuffix = colorMode ? `-${colorMode}` : '';

  const templates = [
    { name: 'today', path: 'src/templates/html/adhd-v3-today.html' },
    { name: 'reflect', path: 'src/templates/html/adhd-v3-reflect.html' },
    { name: 'weekly', path: 'src/templates/html/adhd-v3-weekly.html' },
    { name: 'monthly', path: 'src/templates/html/adhd-v3-monthly.html' },
  ];

  try {
    for (const t of templates) {
      const output = `output/templates/adhd-v3-${t.name}${modeSuffix}.pdf`;
      const result = await renderHTMLToPDFFile(
        { htmlPath: t.path, dimensions: dims, colorMode },
        output
      );
      console.log(`  ✅ ${t.name}: ${(result.size / 1024).toFixed(0)} KB → ${output}`);
    }
  } finally {
    await closeBrowser();
  }

  console.log('\nDone!\n');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
