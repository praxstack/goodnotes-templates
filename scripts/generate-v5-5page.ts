#!/usr/bin/env tsx
/**
 * Generate a 5-page Prax Journal v5 verification PDF.
 *
 * Page order (one day + the next morning):
 *   1. Day 1 · Today     (morning commit)
 *   2. Day 1 · Midday    (2 PM check-in)
 *   3. Day 1 · Reflect   (evening process)
 *   4. Day 1 · Brain Dump (free canvas)
 *   5. Day 2 · Today     (so you can eyeball day-boundary behaviour)
 *
 * Pipeline:
 *   1. Render each v5 HTML to its own 1-page PDF via Puppeteer
 *   2. Merge with pdf-lib (copyPages + addPage)
 *   3. Write bookmarks so every page shows in the GoodNotes sidebar
 *   4. Save to output/prax-journal-v5-5page.pdf
 *
 * Usage: npx tsx scripts/generate-v5-5page.ts
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { PDFDocument, PDFName, PDFArray, PDFDict, PDFNumber, PDFString } from 'pdf-lib';

import {
  renderHTMLToPDF,
  closeBrowser,
} from '../src/core/puppeteer-renderer.js';
import { PAGE_SIZES } from '../src/core/dimensions.js';

const HTML_DIR = path.resolve('src/templates/html');
const OUT_PATH = path.resolve('output/prax-journal-v5-5page.pdf');

/** One PDF page = one Prax Journal v5 HTML file + a label for the bookmark. */
interface PageSpec {
  file: string;
  label: string;
}

const PAGES: PageSpec[] = [
  { file: 'adhd-v5-today.html',      label: 'Day 1 · Today' },
  { file: 'adhd-v5-midday.html',     label: 'Day 1 · Midday' },
  { file: 'adhd-v5-reflect.html',    label: 'Day 1 · Reflect' },
  { file: 'adhd-v5-brain-dump.html', label: 'Day 1 · Brain Dump' },
  { file: 'adhd-v5-today.html',      label: 'Day 2 · Today' },
];

async function main(): Promise<void> {
  const started = Date.now();
  console.log('📔 Prax Journal v5 · 5-page verification PDF\n');

  // 1. Render every source HTML to a 1-page PDF buffer (A4 portrait).
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

  // 2. Merge.
  const merged = await PDFDocument.create();
  merged.setTitle('Prax Journal v5 — 5-page test spread');
  merged.setAuthor('Prax');
  merged.setSubject('Verification: Today · Midday · Reflect · Brain Dump · Today (Day 2)');
  merged.setKeywords(['prax-journal', 'v5', 'adhd', 'daily', 'verification']);
  merged.setCreator('goodnotes-templates/scripts/generate-v5-5page.ts');
  merged.setProducer('pdf-lib + puppeteer');
  merged.setCreationDate(new Date());
  merged.setModificationDate(new Date());

  for (const pageBuf of perPage) {
    const src = await PDFDocument.load(pageBuf);
    const [copied] = await merged.copyPages(src, [0]);
    merged.addPage(copied);
  }

  // 3. Bookmark outline (one entry per page).
  attachOutline(merged, PAGES.map((p) => p.label));

  // 4. Write.
  const out = await merged.save();
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, out);

  const totalKb = (out.byteLength / 1024).toFixed(0);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n✅ ${PAGES.length} pages · ${totalKb} KB · ${secs}s`);
  console.log(`   → ${path.relative(process.cwd(), OUT_PATH)}\n`);

  await closeBrowser();
}

/**
 * Write a flat (one-level) outline with one bookmark per page.
 * Mirrors the shape pdf-postprocess.ts would produce for the year planner,
 * inlined here so the verification script has no extra moving parts.
 */
function attachOutline(doc: PDFDocument, labels: string[]): void {
  const context = doc.context;
  const pages = doc.getPages();
  if (labels.length !== pages.length) {
    throw new Error(
      `outline mismatch: ${labels.length} labels vs ${pages.length} pages`,
    );
  }

  // Each outline item is a PDF dictionary.
  const itemRefs = labels.map((label, i) => {
    const page = pages[i];
    // Destination: [pageRef /XYZ null null null] — open at the top-left of the page.
    const dest = PDFArray.withContext(context);
    dest.push(page.ref);
    dest.push(PDFName.of('XYZ'));
    dest.push(context.obj(null));
    dest.push(context.obj(null));
    dest.push(context.obj(null));

    const dict = context.obj({
      Title: PDFString.of(label),
      Dest: dest,
    });
    return context.register(dict);
  });

  // Link siblings via /Prev and /Next, and point every child to its parent.
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

  // Attach outline to the catalog.
  const catalog = doc.catalog;
  catalog.set(PDFName.of('Outlines'), outlineRef);
  catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
}

main().catch((err) => {
  console.error('\n❌ generate-v5-5page failed:', err);
  process.exitCode = 1;
});
