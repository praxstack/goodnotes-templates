/**
 * Prax Journal renderer — maps a `PageSpec` to its hardcoded v5 HTML
 * file(s) and renders them to PDF buffers.
 *
 * This is the thin adapter between the pure splice layer
 * (`src/core/splice.ts`, C7a) and Puppeteer
 * (`src/core/puppeteer-renderer.ts`). It owns ONE piece of knowledge:
 * which HTML files make up each kind of journal page.
 *
 * ## Why hardcoded filenames?
 *
 * The self-contained-templates invariant (FIND-0010, `src/types/profile.ts`)
 * says: templates stay hardcoded HTML files. Profile data is NOT substituted
 * into the pages at render time — it is consumed downstream by the monthly
 * and quarterly AI review generators, which read the profile separately.
 *
 * So this module never rewrites HTML. It picks a file off disk and hands
 * it to Puppeteer. That's it.
 *
 * ## Daily = 4 pages
 *
 * A "daily" `PageSpec` expands into four A4 HTML files rendered in order:
 *   today.html  →  midday.html  →  reflect.html  →  brain-dump.html
 *
 * This 4-page rhythm (morning commit → midday re-anchor → evening
 * process → unstructured canvas) is the behavioural system the journal
 * encodes. It's locked in `docs/plan-ceo-review-v2-10x-expansion.md` and
 * `docs/plan-eng-review-weekly-monthly-stickers.md`.
 *
 * Weekly / monthly / quarterly each expand to a single HTML file.
 *
 * ## Scope (C7b.1)
 *
 * This commit ships:
 *   - `resolvePageSpecFiles`: pure `PageSpec → string[]` file mapping
 *   - `renderPageSpec`: async wrapper that renders each file via
 *     `renderHTMLToPDF({ multiPage: true })` and returns `Buffer[]`
 *
 * Later commits add:
 *   - C7b.2 · pdf-splice — concatenate the buffers into one PDF with
 *            flat bookmarks derived from the `PageSpec` stream
 *   - C7b.3 · memory-aware loop — restart the shared browser every
 *            ~100 pages for long runs (G2 from eng-review)
 *   - C7b.4 · CLI wiring — `scripts/generate-journal.ts --from ... --to ...`
 */

import path from 'node:path';
import { renderHTMLToPDF } from './puppeteer-renderer.js';
import { getPageDimensions } from './dimensions.js';
import type { PageSpec } from './splice.js';

/**
 * Root of the v5 HTML pack (the only version wired today). Exposed so
 * tests and CLI flags can override it without string-munging paths.
 */
export const V5_PACK_DIR = path.resolve('packs/journals/prax-journal/versions/v5');

/**
 * Filenames that make up one daily spread, in render order. Exported so
 * tests can pin the order without re-deriving it.
 */
export const DAILY_HTML_FILES = [
  'today.html',
  'midday.html',
  'reflect.html',
  'brain-dump.html',
] as const;

/**
 * Filenames for the review kinds. One file each — kept as a typed lookup
 * so an exhaustiveness check in `resolvePageSpecFiles` catches any new
 * `PageSpec` variants at compile time.
 */
export const REVIEW_HTML_FILE: Record<
  Exclude<PageSpec['kind'], 'daily'>,
  string
> = {
  weekly:    'weekly.html',
  monthly:   'monthly.html',
  quarterly: 'quarterly.html',
};

/**
 * Map a `PageSpec` to the absolute HTML file paths that make it up.
 * Pure — no IO. The default `versionDir` points at the v5 pack; tests
 * and future `--pack` flags can pass any directory that holds the
 * expected filenames.
 *
 * Ordering matters: `daily` returns the 4 files in the render order
 * that defines the behavioural rhythm (see module docstring).
 */
export function resolvePageSpecFiles(
  page: PageSpec,
  versionDir: string = V5_PACK_DIR,
): string[] {
  switch (page.kind) {
    case 'daily':
      return DAILY_HTML_FILES.map((f) => path.join(versionDir, f));
    case 'weekly':
    case 'monthly':
    case 'quarterly':
      return [path.join(versionDir, REVIEW_HTML_FILE[page.kind])];
  }
}

export interface RenderPageSpecOptions {
  /** Override the HTML pack directory. Defaults to `V5_PACK_DIR`. */
  versionDir?: string;
}

/**
 * Render a `PageSpec` to one PDF buffer per constituent HTML file.
 *
 * - Daily returns 4 buffers (today / midday / reflect / brain-dump)
 * - Weekly / monthly / quarterly return 1 buffer each
 *
 * Every v5 HTML uses `@page { size: A4 portrait; margin: 0 }`, so we
 * pass `multiPage: true` to `renderHTMLToPDF` and let CSS drive the
 * page size. The caller is responsible for concatenating the buffers
 * into a final PDF — that's C7b.2's job.
 */
export async function renderPageSpec(
  page: PageSpec,
  opts: RenderPageSpecOptions = {},
): Promise<Buffer[]> {
  const files = resolvePageSpecFiles(page, opts.versionDir);
  // Dimensions are required by `PuppeteerRenderOptions` but ignored in
  // `multiPage` mode — CSS `@page` rules take over. We still pass A4
  // portrait for debuggability / non-multiPage fallback.
  const dims = getPageDimensions('a4', 'portrait');

  const buffers: Buffer[] = [];
  for (const htmlPath of files) {
    buffers.push(
      await renderHTMLToPDF({
        htmlPath,
        dimensions: dims,
        multiPage: true,
      }),
    );
  }
  return buffers;
}
