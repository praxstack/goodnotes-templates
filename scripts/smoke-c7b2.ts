/**
 * C7b.2 smoke test — renders 3 PageSpecs and splices them into one PDF
 * with a flat bookmark outline, to verify the round-trip at the real
 * renderer+splicer boundary.
 *
 * Writes `output/c7b2-smoke/year.pdf` and logs page count + bookmark
 * count. Not a committed test — just proof the two layers talk to each
 * other cleanly.
 *
 *   npx tsx scripts/smoke-c7b2.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

import { renderPageSpec } from '../src/core/prax-journal-renderer.js';
import { splicePdfBuffers, type SpecRender } from '../src/core/pdf-splice.js';
import { closeBrowser } from '../src/core/puppeteer-renderer.js';
import { parseProfile, type Profile } from '../src/types/profile.js';
import type { PageSpec } from '../src/core/splice.js';

/** Optional: same loader the C7b.1 smoke uses, so the Rx card fills. */
async function loadLocalProfile(): Promise<Profile | undefined> {
  const p = path.resolve('packs/journals/prax-journal/profile.local.json');
  try {
    const raw = await fs.readFile(p, 'utf-8');
    return parseProfile(JSON.parse(raw) as unknown);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
}

/** Count entries in the /Outlines tree of a merged PDF. */
async function countBookmarks(buf: Buffer): Promise<number> {
  const doc = await PDFDocument.load(buf);
  const outlines = doc.catalog.lookup(PDFName.of('Outlines'), PDFDict);
  // /Count may be a negative number for closed branches; we only care
  // about absolute value of top-level count here.
  const count = outlines.get(PDFName.of('Count'));
  return count ? Math.abs(Number(count.toString())) : 0;
}

async function main(): Promise<void> {
  const outDir = path.resolve('output/c7b2-smoke');
  await fs.mkdir(outDir, { recursive: true });

  const profile = await loadLocalProfile();
  console.log(
    profile
      ? 'profile.local.json loaded → Rx card will be populated'
      : 'no profile.local.json → Rx card falls back to printed blanks',
  );

  const specs: PageSpec[] = [
    { kind: 'daily',     date: '2026-05-01' },       // 4 pages
    { kind: 'weekly',    weekEnding: '2026-05-03' }, // 1 page
    { kind: 'daily',     date: '2026-05-04' },       // 4 pages
  ];

  const t0 = Date.now();
  const renders: SpecRender[] = [];
  for (const page of specs) {
    const buffers = await renderPageSpec(page, { profile });
    renders.push({ page, buffers });
  }
  const renderMs = Date.now() - t0;

  const t1 = Date.now();
  const splicedBuffer = await splicePdfBuffers(renders);
  const spliceMs = Date.now() - t1;

  const outPath = path.join(outDir, 'year.pdf');
  await fs.writeFile(outPath, splicedBuffer);

  const doc = await PDFDocument.load(splicedBuffer);
  const bookmarkCount = await countBookmarks(splicedBuffer);

  const expectedPages = 4 + 1 + 4;
  const expectedBookmarks = 3;

  console.log(`\n${specs.length} specs rendered in ${renderMs} ms`);
  console.log(`Spliced into ${outPath} in ${spliceMs} ms`);
  console.log(`  pages     = ${doc.getPageCount()} (expected ${expectedPages})`);
  console.log(`  bookmarks = ${bookmarkCount} (expected ${expectedBookmarks})`);
  console.log(`  size      = ${(splicedBuffer.byteLength / 1024).toFixed(1)} KB`);

  if (doc.getPageCount() !== expectedPages) {
    throw new Error(`page-count mismatch: got ${doc.getPageCount()}, expected ${expectedPages}`);
  }
  if (bookmarkCount !== expectedBookmarks) {
    throw new Error(`bookmark-count mismatch: got ${bookmarkCount}, expected ${expectedBookmarks}`);
  }

  await closeBrowser();
  console.log(`\nDone. Open with: open ${outDir}/year.pdf`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
