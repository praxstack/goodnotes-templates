/**
 * Render each ADHD v2 template as a single-page PDF for visual verification.
 * 
 * Usage: npx tsx scripts/test-adhd-v2-render.ts [theme]
 * Example: npx tsx scripts/test-adhd-v2-render.ts warm-neutral
 * Example: npx tsx scripts/test-adhd-v2-render.ts midnight
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { renderHTMLToPDF, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';

const themeName = process.argv[2] || 'warm-neutral';

const templates = [
  { id: 'adhd-v2-today', path: 'src/templates/html/adhd-v2-today.html' },
  { id: 'adhd-v2-reflect', path: 'src/templates/html/adhd-v2-reflect.html' },
  { id: 'adhd-v2-weekly', path: 'src/templates/html/adhd-v2-weekly.html' },
  { id: 'adhd-v2-monthly', path: 'src/templates/html/adhd-v2-monthly.html' },
];

async function main() {
  console.log(`\n🎨 Rendering ADHD v2 templates (${themeName} theme)\n`);
  
  const theme = getTheme(themeName);
  const dims = getPageDimensions('a4', 'portrait');
  const outputDir = 'output/templates';
  await fs.mkdir(outputDir, { recursive: true });
  
  try {
    for (const t of templates) {
      const buffer = await renderHTMLToPDF({
        htmlPath: t.path,
        theme,
        dimensions: dims,
      });
      
      const outputPath = path.join(outputDir, `${t.id}-${themeName}.pdf`);
      await fs.writeFile(outputPath, buffer);
      console.log(`  ✓ ${t.id} — ${(buffer.length / 1024).toFixed(0)} KB`);
    }
  } finally {
    await closeBrowser();
  }
  
  console.log(`\n  ✅ All 4 templates rendered to ${outputDir}/\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
