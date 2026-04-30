/**
 * PDF splice layer (C7b.2).
 *
 * Takes the per-PageSpec render output from
 * `renderPageSpec` in `src/core/prax-journal-renderer.ts` and
 * concatenates it into one PDF — with a *flat* bookmark outline, one
 * entry per PageSpec pointing at the first page that spec contributes.
 *
 * ## Why this is its own module
 *
 * `src/core/pdf-postprocess.ts` already has a generic `mergePDFs()` and
 * `addBookmarks()`. Those are building blocks; the layer above needs to
 * know:
 *
 *   1. How to *title* a bookmark (depends on PageSpec kind + date).
 *   2. How to compute the *page offset* where each spec starts, because
 *      a daily yields 4 pages per spec and a review yields 1 — the
 *      running sum is the bookmark target.
 *
 * Keeping this policy in `pdf-postprocess` would pollute the generic
 * PDF-utility layer with journal-specific logic. A thin wrapper in its
 * own file keeps both layers honest.
 *
 * ## Why flat bookmarks, not nested
 *
 * A full-year render is 365 daily spread entries + ~52 weeklies + 12
 * monthlies + 4 quarterlies ≈ 433 bookmarks and ~1500 pages. GoodNotes
 * (and most PDF readers) display the outline as a scrollable list.
 * Nesting daily-under-weekly-under-monthly collapses every daily into
 * expandable accordions and makes "jump to May 17" require 3 clicks
 * instead of a type-ahead. Flat wins for the target device.
 *
 * Addresses decision Q5 in
 * `docs/plan-ceo-review-v4-five-decisions-locked.md` and wraps up the
 * "render the year as one bookmarked PDF" acceptance criterion for the
 * v5.3 generator.
 */

import {
  PDFDocument,
  PDFName,
  PDFArray,
  PDFNumber,
  PDFString,
  type PDFRef,
  type PDFDict,
} from 'pdf-lib';
import type { PageSpec } from './splice.js';

/**
 * One element of the splice input: the PageSpec that was rendered, plus
 * the ordered PDF buffers it produced. A daily has 4 buffers (today /
 * midday / reflect / brain-dump); each review kind has 1. This is
 * exactly the shape the caller already has after calling
 * `renderPageSpec` in a loop, so no reshaping is required.
 */
export interface SpecRender {
  page: PageSpec;
  buffers: Buffer[];
}

/**
 * Human-readable bookmark title for a PageSpec. Exposed so callers
 * (and tests) can format titles identically without duplicating the
 * switch. Shape is deliberately short + scannable because GoodNotes
 * shows this in its narrow sidebar.
 *
 * Examples:
 *   - daily      → "2026-05-01 · Monday"        (the date + weekday)
 *   - weekly     → "Week · 2026-05-03"          (week ending Sunday)
 *   - monthly    → "Month · 2026-05-31"         (last day of month)
 *   - quarterly  → "Quarter · 2026-06-30"       (last day of quarter)
 *
 * Using the ISO date everywhere keeps the sidebar sortable and
 * language-neutral. The weekday suffix on dailies is the one nicety:
 * when scrolling a year's worth of entries, "Tue" vs "Sat" is a useful
 * disambiguator without widening the column.
 */
export function bookmarkTitle(page: PageSpec): string {
  switch (page.kind) {
    case 'daily': {
      // Weekday derived from the ISO date in UTC so the same date
      // always produces the same label regardless of where the script
      // runs. Matches the UTC-only convention in splice.ts.
      const [y, m, d] = page.date.split('-').map((s) => Number(s));
      const weekday = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'UTC',
      });
      return `${page.date} · ${weekday}`;
    }
    case 'weekly':    return `Week · ${page.weekEnding}`;
    case 'monthly':   return `Month · ${page.monthEnding}`;
    case 'quarterly': return `Quarter · ${page.quarterEnding}`;
  }
}

/**
 * Concatenate the PDF buffers from `renders` into one document and
 * attach a flat bookmark outline — one entry per PageSpec, pointing at
 * the first page that spec contributes (even if a spec spans multiple
 * pages, which is forward-compatible with future multi-page dailies).
 *
 * Contract:
 *   - Input order is preserved end-to-end: `renders[i].buffers[j]`
 *     lands at page offset `Σ(pages in renders[0..i-1]) + pages in
 *     renders[i].buffers[0..j-1]`. That's exactly what the calendar-
 *     ordered splice produces, so bookmarks are naturally sorted.
 *   - `renders` MUST be non-empty. An empty argument is almost
 *     certainly a generator bug (the splice layer returns an empty
 *     array only for inverted date ranges, which the CLI should
 *     already have surfaced to the user). We throw to make that
 *     visible instead of producing a valid-but-empty PDF.
 *   - Each `buffers` array MUST be non-empty too — a spec that
 *     produced zero pages is a render bug and we surface it with the
 *     offending PageSpec for triage.
 *
 * The implementation mirrors `addBookmarks` in
 * `src/core/pdf-postprocess.ts` (flat outline, First/Last/Count on the
 * root, Prev/Next sibling links) so any reader that accepts one
 * accepts the other.
 */
export async function splicePdfBuffers(
  renders: readonly SpecRender[],
): Promise<Buffer> {
  if (renders.length === 0) {
    throw new Error('splicePdfBuffers: no renders to splice (empty input)');
  }

  const merged = await PDFDocument.create();

  // Collected as we walk so we can build the outline in one pass after
  // all pages are placed. Each entry's `pageIndex` is the 0-based page
  // number in the merged doc where that spec starts.
  const bookmarks: Array<{ title: string; pageIndex: number }> = [];
  let pageOffset = 0;

  for (const render of renders) {
    if (render.buffers.length === 0) {
      throw new Error(
        `splicePdfBuffers: PageSpec ${JSON.stringify(render.page)} produced 0 buffers ` +
          '(render bug — every spec must contribute at least one page)',
      );
    }

    bookmarks.push({
      title: bookmarkTitle(render.page),
      pageIndex: pageOffset,
    });

    for (const buf of render.buffers) {
      const src = await PDFDocument.load(buf);
      const count = src.getPageCount();
      if (count === 0) {
        throw new Error(
          `splicePdfBuffers: buffer in ${JSON.stringify(render.page)} had 0 pages`,
        );
      }
      const copied = await merged.copyPages(src, src.getPageIndices());
      for (const p of copied) merged.addPage(p);
      pageOffset += count;
    }
  }

  // ── Build the flat outline ──────────────────────────────────
  //
  // pdf-lib's mid-level API: we manually wire the /Outlines dict and
  // per-item PDFDicts because the high-level document API doesn't
  // expose bookmarks directly. Mirrors the shape in
  // `pdf-postprocess.ts::addBookmarks`.
  const pages = merged.getPages();
  const outlineRef = merged.context.nextRef();
  const items = bookmarks.map(({ title, pageIndex }) => {
    const ref: PDFRef = merged.context.nextRef();
    const page = pages[pageIndex]; // guaranteed present (we just added it)
    const dest = PDFArray.withContext(merged.context);
    dest.push(page.ref);
    dest.push(PDFName.of('Fit'));
    const dict: PDFDict = merged.context.obj({
      Title: PDFString.of(title),
      Parent: outlineRef,
      Dest: dest,
    });
    return { ref, dict };
  });

  // Sibling links: each item knows its previous + next peer, which is
  // how PDF readers navigate the outline with keyboard shortcuts.
  for (let i = 0; i < items.length; i++) {
    if (i > 0)                    items[i].dict.set(PDFName.of('Prev'), items[i - 1].ref);
    if (i < items.length - 1)     items[i].dict.set(PDFName.of('Next'), items[i + 1].ref);
  }

  const outlineDict = merged.context.obj({
    Type: 'Outlines',
    First: items[0].ref,
    Last:  items[items.length - 1].ref,
    Count: PDFNumber.of(items.length),
  });

  merged.context.assign(outlineRef, outlineDict);
  for (const it of items) merged.context.assign(it.ref, it.dict);
  merged.catalog.set(PDFName.of('Outlines'), outlineRef);

  return Buffer.from(await merged.save());
}
