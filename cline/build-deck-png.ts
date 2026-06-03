/**
 * build-deck-png.ts — Prax Journal v9 · Truth-deck → 300dpi PNGs + contact sheet
 *
 * Re-renders each Truth Deck card SVG (from build-cards.ts) to a high-quality PNG
 * at ~300 DPI via Chromium, plus a contact-sheet overview. Re-rendering from the
 * card SVG (not rasterising truth-deck-flip.pdf) avoids any external Poppler dep.
 *
 *   cline/output/v9/truth-deck-png/page-01-z1.png … page-66-p25.png  (300 DPI)
 *   cline/output/v9/truth-deck-png/contact-sheet.png
 *
 * Run: ./node_modules/.bin/tsx cline/build-deck-png.ts
 */

import { chromium, type Browser } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TRUTH, QUOTE, PILL, cardSVG, coverSVG } from './build-cards.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DST = path.join(__dirname, 'output', 'v9', 'truth-deck-png');
const CARDS = [...TRUTH, ...QUOTE, ...PILL];

const FONT_LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400;1,9..144,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">';

async function renderSvg(browser: Browser, svg: string, scale: number): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: scale });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8">${FONT_LINK}
    <style>*{margin:0;padding:0}</style></head><body>${svg}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { if ((document as any).fonts) await (document as any).fonts.ready; });
  const el = await page.$('svg');
  const buf = await el!.screenshot({ omitBackground: false });
  await page.close();
  return buf;
}

async function main() {
  await fs.mkdir(DST, { recursive: true });
  const browser = await chromium.launch();
  const scale = 300 / 72; // 512pt card @ 300dpi ≈ 2133px
  const order = [{ id: 'z1', svg: coverSVG() }, ...CARDS.map(c => ({ id: c.id, svg: cardSVG(c) }))];
  const thumbs: Buffer[] = [];
  try {
    for (let i = 0; i < order.length; i++) {
      const png = await renderSvg(browser, order[i].svg, scale);
      await fs.writeFile(path.join(DST, `page-${String(i + 1).padStart(2, '0')}-${order[i].id}.png`), png);
      thumbs.push(png);
    }
    // contact sheet — 8 cols, base64-embedded thumbnails
    const cols = 8, cell = 200, gap = 14, pad = 20;
    const rows = Math.ceil(order.length / cols);
    const cw = pad * 2 + cols * cell + (cols - 1) * gap;
    const ch = pad * 2 + rows * cell + (rows - 1) * gap;
    const imgs = order.map((_, i) => {
      const x = pad + (i % cols) * (cell + gap), y = pad + Math.floor(i / cols) * (cell + gap);
      return `<image x="${x}" y="${y}" width="${cell}" height="${cell}" href="data:image/png;base64,${thumbs[i].toString('base64')}"/>`;
    }).join('');
    const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}"><rect width="${cw}" height="${ch}" fill="#E4DFD2"/>${imgs}</svg>`;
    const sp = await browser.newPage({ viewport: { width: cw, height: ch }, deviceScaleFactor: 1 });
    await sp.setContent(`<style>*{margin:0}</style>${sheet}`, { waitUntil: 'load' });
    const sel = await sp.$('svg');
    await fs.writeFile(path.join(DST, 'contact-sheet.png'), await sel!.screenshot({ omitBackground: false }));
    await sp.close();
  } finally {
    await browser.close();
  }
  console.log(`[deck-png] ${order.length} PNGs @300dpi + contact-sheet → cline/output/v9/truth-deck-png/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => { console.error('[deck-png] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
}
