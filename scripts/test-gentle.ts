import path from 'node:path';
import fs from 'node:fs/promises';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';
import { renderHTMLToPDF, closeBrowser } from '../src/core/puppeteer-renderer.js';

async function main() {
  const theme = getTheme('warm-neutral');
  const dims = getPageDimensions('a4', 'portrait');
  const pages = ['adhd-gentle-daily', 'adhd-gentle-weekly', 'adhd-gentle-monthly'];

  try {
    for (const id of pages) {
      const htmlPath = path.resolve('src/templates/html', id + '.html');
      const outPath = path.resolve('output/templates', id + '-warm-neutral.pdf');
      const buf = await renderHTMLToPDF({ htmlPath, theme, dimensions: dims });
      await fs.writeFile(outPath, buf);
      console.log(`✓ ${id} — ${(buf.length / 1024).toFixed(1)} KB`);
    }
  } finally {
    await closeBrowser();
  }
  console.log('Done!');
}
main();
