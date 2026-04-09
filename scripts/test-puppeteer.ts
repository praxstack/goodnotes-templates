import { renderHTMLToPDFFile, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';

async function main() {
  const theme = getTheme('warm-neutral');
  const dims = getPageDimensions('a4');

  console.log('Rendering ADHD planner with warm-neutral theme...');
  const result = await renderHTMLToPDFFile(
    { htmlPath: 'examples/prax-journal/prax_adhd_planner.html', theme, dimensions: dims },
    'output/templates/adhd-planner-warm-neutral.pdf'
  );
  console.log('Done:', result.path, (result.size / 1024).toFixed(1) + ' KB');

  const dark = getTheme('midnight');
  console.log('Rendering with midnight (dark) theme...');
  const result2 = await renderHTMLToPDFFile(
    { htmlPath: 'examples/prax-journal/prax_adhd_planner.html', theme: dark, dimensions: dims },
    'output/templates/adhd-planner-midnight.pdf'
  );
  console.log('Dark:', result2.path, (result2.size / 1024).toFixed(1) + ' KB');

  await closeBrowser();
  console.log('Done! Check output/templates/');
}
main().catch(e => { console.error(e); process.exit(1); });
