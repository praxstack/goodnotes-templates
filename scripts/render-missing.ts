/**
 * Render any HTML templates that don't have PDFs yet.
 * Usage: npx tsx scripts/render-missing.ts [colorMode]
 */
import fs from 'fs/promises';
import path from 'path';
import { batchRenderHTML, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { getPageDimensions } from '../src/core/dimensions.js';

const colorMode = process.argv[2]; // optional: 'dark'

async function main() {
  console.log(`\n📄 Rendering missing templates${colorMode ? ` (${colorMode})` : ''}...\n`);
  const dims = getPageDimensions('a4', 'portrait');
  const htmlDir = 'src/templates/html';
  const outDir = 'output/templates';
  const modeSuffix = colorMode ? `-${colorMode}` : '';

  const files = await fs.readdir(htmlDir);
  const htmlFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('_'));

  const templates = htmlFiles.map(f => ({
    htmlPath: path.join(htmlDir, f),
    outputPath: path.join(outDir, f.replace('.html', `${modeSuffix}.pdf`)),
    name: f.replace('.html', ''),
  }));

  // Filter to only missing ones
  const missing = [];
  for (const t of templates) {
    try {
      await fs.access(t.outputPath);
    } catch {
      missing.push(t);
    }
  }

  if (missing.length === 0) {
    console.log('  All templates already rendered!\n');
    return;
  }

  console.log(`  Found ${missing.length} missing PDFs\n`);

  try {
    const results = await batchRenderHTML(
      missing,
      dims,
      colorMode,
      (name, i, total) => console.log(`  [${i}/${total}] ${name}...`)
    );
    console.log(`\n  ✅ Rendered ${results.length} templates\n`);
  } finally {
    await closeBrowser();
  }
}

main().catch(err => { console.error('❌', err); process.exit(1); });
