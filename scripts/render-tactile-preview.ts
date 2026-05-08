#!/usr/bin/env -S npx tsx
/**
 * Render the 4 tactile packs to PDFs under `output/` and print per-PDF
 * page-size verification (must be ~595 × 842 pt = A4 portrait).
 *
 * One-shot verification script — not part of CI. Used to confirm the
 * claymorphic / skeuomorphic port from the Stitch references prints at
 * exact A4 dimensions with Google-Fonts-loaded typography.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'output', 'tactile-previews');

const PACKS = [
  { id: 'tactile-daily-planner', html: 'tactile-daily-planner.html' },
  { id: 'tactile-reflections',   html: 'tactile-reflections.html' },
  { id: 'tactile-habits',        html: 'tactile-habits.html' },
  { id: 'tactile-tasks',         html: 'tactile-tasks.html' },
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });

  for (const p of PACKS) {
    const htmlPath = path.join(REPO_ROOT, 'packages', `packs-${p.id}`, p.html);
    const pdfPath = path.join(OUT_DIR, `${p.id}.pdf`);
    const page = await browser.newPage();
    const url = 'file://' + htmlPath;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });
    await page.close();

    const bytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(bytes);
    const first = pdf.getPages()[0];
    const w = first.getWidth().toFixed(1);
    const h = first.getHeight().toFixed(1);
    const pageCount = pdf.getPageCount();
    const sizeKb = (bytes.byteLength / 1024).toFixed(1);
    console.log(`${p.id.padEnd(30)}  ${pageCount}p  ${w}×${h}pt  ${sizeKb} KB`);
  }

  await browser.close();
  console.log(`\nA4 portrait expected: 595.3 × 841.9 pt`);
  console.log(`PDFs: ${path.relative(REPO_ROOT, OUT_DIR)}/*.pdf`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
