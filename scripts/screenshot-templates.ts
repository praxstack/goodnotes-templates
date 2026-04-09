/**
 * Screenshot all ADHD v2 templates as PNGs for visual inspection.
 * Usage: npx tsx scripts/screenshot-templates.ts
 */
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const templates = [
  'adhd-v2-today',
  'adhd-v2-reflect', 
  'adhd-v2-weekly',
  'adhd-v2-monthly',
  'eat-the-frog',
  'habit-tracker',
  'budget-tracker',
  'gratitude-journal',
];

async function main() {
  console.log('\n📸 Screenshotting HTML templates\n');
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const outDir = 'output/screenshots';
  await fs.mkdir(outDir, { recursive: true });

  for (const name of templates) {
    const htmlPath = path.resolve(`src/templates/html/${name}.html`);
    try {
      await fs.access(htmlPath);
    } catch {
      console.log(`  ⚠ ${name}.html not found — skipping`);
      continue;
    }
    
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1131, deviceScaleFactor: 2 }); // A4 ratio @2x
    
    const html = await fs.readFile(htmlPath, 'utf-8');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    
    const outPath = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    const stat = await fs.stat(outPath);
    console.log(`  ✓ ${name} — ${(stat.size / 1024).toFixed(0)} KB`);
    await page.close();
  }

  await browser.close();
  console.log(`\n  ✅ Screenshots in ${outDir}/\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
