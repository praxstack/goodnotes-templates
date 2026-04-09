import path from 'node:path';
import fs from 'node:fs/promises';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';
import { renderHTMLToPDF, closeBrowser } from '../src/core/puppeteer-renderer.js';

async function main() {
  const dims = getPageDimensions('a4', 'portrait');
  const pages = ['adhd-v2-today', 'adhd-v2-reflect', 'adhd-v2-weekly', 'adhd-v2-monthly'];

  for (const themeName of ['warm-neutral', 'midnight']) {
    const theme = getTheme(themeName);
    console.log(`\n🎨 Theme: ${themeName}`);
    try {
      for (const id of pages) {
        const buf = await renderHTMLToPDF({
          htmlPath: path.resolve('src/templates/html', id + '.html'),
          theme, dimensions: dims,
        });
        await fs.writeFile(path.resolve('output/templates', `${id}-${themeName}.pdf`), buf);
        console.log(`  ✓ ${id} — ${(buf.length / 1024).toFixed(0)} KB`);
      }
    } catch (e: any) { console.error('  ✗', e.message); }
  }
  await closeBrowser();
  console.log('\nDone!');
}
main();
