/**
 * Render all 4 ADHD v3 templates as single-page PDFs.
 * Usage: npx tsx scripts/render-v3.ts
 */
import fs from 'fs/promises';
import path from 'path';
import { renderHTMLToPDF, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';

const templates = ['adhd-v3-today', 'adhd-v3-reflect', 'adhd-v3-weekly', 'adhd-v3-monthly'];

async function main() {
  console.log('\n🎨 Rendering ADHD v3 templates\n');
  const theme = getTheme('warm-neutral');
  const dims = getPageDimensions('a4', 'portrait');
  await fs.mkdir('output/templates', { recursive: true });
  try {
    for (const t of templates) {
      const buf = await renderHTMLToPDF({ htmlPath: `src/templates/html/${t}.html`, theme, dimensions: dims });
      const out = `output/templates/${t}.pdf`;
      await fs.writeFile(out, buf);
      console.log(`  ✓ ${t} — ${(buf.length / 1024).toFixed(0)} KB`);
    }
  } finally { await closeBrowser(); }
  console.log('\n  ✅ Done\n');
}

main().catch(e => { console.error('❌', e); process.exit(1); });
