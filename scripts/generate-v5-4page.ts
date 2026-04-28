#!/usr/bin/env tsx
/**
 * Generate a 4-page Prax Journal v5 verification PDF.
 *
 * One full day, no repeats:
 *   1. Today     (morning commit)
 *   2. Midday    (2 PM check-in)
 *   3. Reflect   (evening process)
 *   4. Brain Dump (free canvas)
 *
 * Same pipeline as generate-v5-5page.ts (Puppeteer → pdf-lib merge →
 * flat bookmark outline). Used to verify a single-day spread after
 * design changes land.
 *
 * Usage: npx tsx scripts/generate-v5-4page.ts
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { PDFDocument, PDFName, PDFArray, PDFDict, PDFNumber, PDFString } from 'pdf-lib';

import { renderHTMLToPDF, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { PAGE_SIZES } from '../src/core/dimensions.js';

const HTML_DIR = path.resolve('src/templates/html');
const OUT_PATH = path.resolve('output/prax-journal-v5-4page.pdf');

interface PageSpec {
  file: string;
  label: string;
}

const PAGES: PageSpec[] = [
  { file: 'adhd-v5-today.html',      label: 'Today · 1 / 4' },
  { file: 'adhd-v5-midday.html',     label: 'Midday · 2 / 4' },
  { file: 'adhd-v5-reflect.html',    label: 'Reflect · 3 / 4' },
  { file: 'adhd-v5-brain-dump.html', label: 'Brain Dump · 4 / 4' },
];

async function main(): Promise<void> {
  const started = Date.now();
  console.log('📔 Prax Journal v5 · 4-page verification PDF\n');

  const perPage: Buffer[] = [];
  for (let i = 0; i < PAGES.length; i++) {
    const spec = PAGES[i];
    const htmlPath = path.join(HTML_DIR, spec.file);
    process.stdout.write(
      `  [${i + 1}/${PAGES.length}] rendering ${spec.label.padEnd(22)} … `,
    );
    const buf = await renderHTMLToPDF({
      htmlPath,
      dimensions: PAGE_SIZES.a4,
    });
    perPage.push(buf);
    console.log(`${(buf.length / 1024).toFixed(0)} KB ✓`);
  }

  const merged = await PDFDocument.create();
  merged.setTitle('Prax Journal v5 — 4-page daily spread');
  merged.setAuthor('Prax');
  merged.setSubject('One day: Today · Midday · Reflect · Brain Dump');
  merged.setKeywords(['prax-journal', 'v5', 'adhd', 'daily']);
  merged.setCreator('goodnotes-templates/scripts/generate-v5-4page.ts');
  merged.setProducer('pdf-lib + puppeteer');
  merged.setCreationDate(new Date());
  merged.setModificationDate(new Date());

  for (const pageBuf of perPage) {
    const src = await PDFDocument.load(pageBuf);
    const [copied] = await merged.copyPages(src, [0]);
    merged.addPage(copied);
  }

  attachOutline(merged, PAGES.map((p) => p.label));

  const out = await merged.save();
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, out);

  const totalKb = (out.byteLength / 1024).toFixed(0);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n✅ ${PAGES.length} pages · ${totalKb} KB · ${secs}s`);
  console.log(`   → ${path.relative(process.cwd(), OUT_PATH)}\n`);

  await closeBrowser();
}

function attachOutline(doc: PDFDocument, labels: string[]): void {
  const context = doc.context;
  const pages = doc.getPages();
  if (labels.length !== pages.length) {
    throw new Error(`outline mismatch: ${labels.length} vs ${pages.length}`);
  }

  const itemRefs = labels.map((label, i) => {
    const page = pages[i];
    const dest = PDFArray.withContext(context);
    dest.push(page.ref);
    dest.push(PDFName.of('XYZ'));
    dest.push(context.obj(null));
    dest.push(context.obj(null));
    dest.push(context.obj(null));
    return context.register(context.obj({ Title: PDFString.of(label), Dest: dest }));
  });

  const outlineRef = context.nextRef();
  itemRefs.forEach((ref, i) => {
    const item = context.lookup(ref) as PDFDict;
    item.set(PDFName.of('Parent'), outlineRef);
    if (i > 0) item.set(PDFName.of('Prev'), itemRefs[i - 1]);
    if (i < itemRefs.length - 1) item.set(PDFName.of('Next'), itemRefs[i + 1]);
  });

  const outline = context.obj({
    Type: 'Outlines',
    First: itemRefs[0],
    Last: itemRefs[itemRefs.length - 1],
    Count: PDFNumber.of(itemRefs.length),
  });
  context.assign(outlineRef, outline);

  const catalog = doc.catalog;
  catalog.set(PDFName.of('Outlines'), outlineRef);
  catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
}

main().catch((err) => {
  console.error('\n❌ generate-v5-4page failed:', err);
  process.exitCode = 1;
});
