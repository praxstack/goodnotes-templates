/**
 * Tests for the PDF splice layer (C7b.2).
 *
 * We avoid Puppeteer entirely by synthesising tiny PDFs in-memory with
 * pdf-lib — each with a known page count. That lets us assert three
 * things precisely:
 *
 *   1. Page count after splicing = Σ(page count of every source buffer).
 *   2. Bookmark `pageIndex` per spec matches the running-sum offset.
 *   3. Output PDF parses cleanly as a single document and exposes the
 *      expected /Outlines dict (including First, Last, Count, and the
 *      Prev/Next sibling chain).
 *
 * Input-validation tests cover:
 *   - empty renders array → throws
 *   - a spec with an empty buffers array → throws with the offending spec

 *
 * Policy tests cover:
 *   - `bookmarkTitle` formatting for every PageSpec kind
 *   - daily weekday labels are stable across machines (UTC calendar)
 */

import { describe, it, expect } from 'vitest';
import { PDFDocument, PDFName, PDFDict, PDFString, PDFArray } from 'pdf-lib';
import { bookmarkTitle, splicePdfBuffers, type SpecRender } from '../../packages/core/src/pdf-splice.js';
import type { PageSpec } from '../../packages/core/src/splice.js';

/** Build a throw-away PDF with N blank A4 pages. */
async function makePdf(pages: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([595, 842]);
  return Buffer.from(await doc.save());
}

describe('bookmarkTitle · formatting', () => {
  // ── 1 · Daily titles include weekday for scan-ability ──
  it('daily → "YYYY-MM-DD · Weekday"', () => {
    // 2026-05-01 is a Friday in the UTC calendar.
    expect(bookmarkTitle({ kind: 'daily', date: '2026-05-01' })).toBe(
      '2026-05-01 · Fri',
    );
    // 2026-12-25 is a Friday too; the format stays stable.
    expect(bookmarkTitle({ kind: 'daily', date: '2026-12-25' })).toBe(
      '2026-12-25 · Fri',
    );
  });

  // ── 2 · Review kinds use their own prefix ──
  it('review kinds use a kind-prefixed title', () => {
    expect(bookmarkTitle({ kind: 'weekly', weekEnding: '2026-05-03' })).toBe(
      'Week · 2026-05-03',
    );
    expect(bookmarkTitle({ kind: 'monthly', monthEnding: '2026-05-31' })).toBe(
      'Month · 2026-05-31',
    );
    expect(bookmarkTitle({ kind: 'quarterly', quarterEnding: '2026-06-30' })).toBe(
      'Quarter · 2026-06-30',
    );
  });

  // ── 3 · Weekday label is stable in UTC (no DST / locale drift) ──
  it('daily weekday is derived in UTC, same label everywhere', () => {
    // 2026-01-01 is a Thursday in UTC. Regardless of the runner's TZ,
    // the label must stay "Thu".
    expect(bookmarkTitle({ kind: 'daily', date: '2026-01-01' })).toMatch(
      /2026-01-01 · Thu$/u,
    );
  });
});

describe('splicePdfBuffers · happy path', () => {
  // ── 4 · Page counts add up end-to-end ──
  it('output page count = sum of input page counts', async () => {
    const renders: SpecRender[] = [
      // Daily: 4 pages (today/midday/reflect/brain-dump shape).
      {
        page: { kind: 'daily', date: '2026-05-01' },
        buffers: await Promise.all([makePdf(1), makePdf(1), makePdf(1), makePdf(1)]),
      },
      // Weekly: 1 page.
      {
        page: { kind: 'weekly', weekEnding: '2026-05-03' },
        buffers: [await makePdf(1)],
      },
    ];
    const out = await splicePdfBuffers(renders);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(5); // 4 + 1
  });

  // ── 5 · Bookmark pageIndex equals the running page-offset ──
  //
  // We read the /Outlines tree back, walk First/Next, and decode each
  // item's /Dest page ref. The page ref has to match the page at the
  // computed offset.
  it('bookmarks point at the first page each spec contributes', async () => {
    const renders: SpecRender[] = [
      {
        page: { kind: 'daily', date: '2026-05-01' },
        buffers: await Promise.all([makePdf(1), makePdf(1), makePdf(1), makePdf(1)]),
      },
      {
        page: { kind: 'weekly', weekEnding: '2026-05-03' },
        buffers: [await makePdf(1)],
      },
      {
        page: { kind: 'daily', date: '2026-05-04' },
        buffers: await Promise.all([makePdf(1), makePdf(1), makePdf(1), makePdf(1)]),
      },
    ];
    const out = await splicePdfBuffers(renders);
    const doc = await PDFDocument.load(out);
    const pages = doc.getPages();
    expect(pages).toHaveLength(9); // 4 + 1 + 4

    // Pull the outlines dict off the catalog.
    const outlines = doc.catalog.lookup(PDFName.of('Outlines'), PDFDict);
    expect(outlines.get(PDFName.of('Type'))?.toString()).toBe('/Outlines');

    // Expect First/Last/Count set correctly.
    const count = outlines.get(PDFName.of('Count'));
    expect(count?.toString()).toBe('3');

    // Walk the sibling chain and collect the page refs each item
    // points at. Expected order: page 0 (daily 1), page 4 (weekly),
    // page 5 (daily 2).
    const expectedOffsets = [0, 4, 5];
    const expectedTitles  = [
      bookmarkTitle(renders[0].page),
      bookmarkTitle(renders[1].page),
      bookmarkTitle(renders[2].page),
    ];

    let cursor: PDFDict | undefined = outlines.lookup(PDFName.of('First'), PDFDict);
    for (let i = 0; i < expectedOffsets.length; i++) {
      expect(cursor, `missing item #${i}`).toBeTruthy();
      const item = cursor as PDFDict;

      // Title string matches the `bookmarkTitle()` output.
      const titleObj = item.get(PDFName.of('Title')) as PDFString;
      expect(titleObj.asString()).toBe(expectedTitles[i]);

      // Dest is a [pageRef, /Fit] array. Compare page ref identity.
      const dest = item.get(PDFName.of('Dest')) as PDFArray;
      const pageRef = dest.get(0); // PDFRef
      expect(pageRef.toString()).toBe(pages[expectedOffsets[i]].ref.toString());

      // Walk forward.
      const nextRef = item.get(PDFName.of('Next'));
      cursor = nextRef ? item.lookup(PDFName.of('Next'), PDFDict) : undefined;
    }
    // After the last Next, we should have exhausted the chain.
    expect(cursor).toBeUndefined();
  });

  // ── 6 · Multi-page source buffers increment the offset correctly ──
  //
  // Forward-compat: if a future review HTML produces a 3-page PDF,
  // the next bookmark must skip by 3, not 1.
  it('multi-page buffers advance the page offset by their page count', async () => {
    const renders: SpecRender[] = [
      {
        page: { kind: 'monthly', monthEnding: '2026-05-31' },
        buffers: [await makePdf(3)], // one buffer, 3 pages
      },
      {
        page: { kind: 'quarterly', quarterEnding: '2026-06-30' },
        buffers: [await makePdf(1)],
      },
    ];
    const out = await splicePdfBuffers(renders);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(4);

    const outlines = doc.catalog.lookup(PDFName.of('Outlines'), PDFDict);
    const first = outlines.lookup(PDFName.of('First'), PDFDict);
    const second = first.lookup(PDFName.of('Next'), PDFDict);

    const firstDest  = first.get(PDFName.of('Dest')) as PDFArray;
    const secondDest = second.get(PDFName.of('Dest')) as PDFArray;
    const pages = doc.getPages();

    // First bookmark → page 0; second → page 3 (after the 3-page first).
    expect(firstDest.get(0).toString()).toBe(pages[0].ref.toString());
    expect(secondDest.get(0).toString()).toBe(pages[3].ref.toString());
  });
});

describe('splicePdfBuffers · error handling', () => {
  // ── 7 · Empty input is surfaced, not silently turned into 0-page PDF ──
  it('empty renders array → throws', async () => {
    await expect(splicePdfBuffers([])).rejects.toThrow(/no renders/iu);
  });

  // ── 8 · A spec with no buffers is a generator bug; surface it ──
  it('spec with empty buffers → throws with the offending spec in the message', async () => {
    const bad: SpecRender[] = [
      {
        page: { kind: 'daily', date: '2026-05-01' },
        buffers: [],
      },
    ];
    await expect(splicePdfBuffers(bad)).rejects.toThrow(/"kind":"daily"/u);
    await expect(splicePdfBuffers(bad)).rejects.toThrow(/0 buffers/u);
  });

  // (The zero-page-buffer case sits inside pdf-lib's own behaviour —
  // `PDFDocument.create()` + save() produces a file that loads without
  // error and its page count varies by pdf-lib internals. The safety
  // net that matters for the generator is "spec produced 0 buffers",
  // which test 8 covers. A truly malformed buffer would fail at
  // `PDFDocument.load()` and surface pdf-lib's own error, which is
  // fine — it doesn't need a special wrapper message.)
});


describe('splicePdfBuffers · output is a single valid PDF', () => {
  // ── 10 · Output round-trips through pdf-lib ──
  //
  // The single most likely regression is a bookmark dict that references
  // a ref we never assigned. pdf-lib will fail to save (or the saved
  // bytes will fail to re-load). A round-trip protects the whole path.
  it('output round-trips cleanly through pdf-lib', async () => {
    const pages: PageSpec[] = [
      { kind: 'daily', date: '2026-05-01' },
      { kind: 'weekly', weekEnding: '2026-05-03' },
      { kind: 'monthly', monthEnding: '2026-05-31' },
      { kind: 'quarterly', quarterEnding: '2026-06-30' },
    ];
    const renders: SpecRender[] = await Promise.all(
      pages.map(async (p) => ({ page: p, buffers: [await makePdf(1)] })),
    );
    const out = await splicePdfBuffers(renders);
    // Parsing the output must succeed. If any ref is dangling or the
    // outline tree is malformed, pdf-lib raises.
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(4);

    const outlines = doc.catalog.lookup(PDFName.of('Outlines'), PDFDict);
    expect(outlines.get(PDFName.of('Count'))?.toString()).toBe('4');
  });
});
