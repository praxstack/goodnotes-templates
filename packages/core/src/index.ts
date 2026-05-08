/**
 * @praxlannister/pretext-core — barrel export.
 *
 * Re-exports the stable public surface of the rendering pipeline so
 * downstream packages (CLI, apps/gallery, future registry tools) import
 * from `@praxlannister/pretext-core` instead of reaching into subpaths.
 *
 * Subpath imports (e.g. `@praxlannister/pretext-core/dimensions`) remain
 * supported via the `exports["./*"]` map in package.json — used today
 * by tests and scripts that predate this barrel.
 */

// ── Splice + renderer pipeline ────────────────────────────────────
export {
  buildPageSequence,
  type PageSpec,
} from './splice.js';

export {
  splicePdfBuffers,
  bookmarkTitle,
  type SpecRender,
} from './pdf-splice.js';

export {
  addBookmarks,
  addHyperlinks,
} from './pdf-postprocess.js';

export {
  renderHTMLToPDF,
  closeBrowser,
} from './puppeteer-renderer.js';

export {
  renderPageSpec,
  resolvePageSpecFiles,
  substituteProfile,
  deriveDateFields,
  isLeapYear,
  V5_PACK_DIR,
  DAILY_HTML_FILES,
  REVIEW_HTML_FILE,
  RX_SLOT_COUNT,
  PROFILE_PLACEHOLDERS,
  type ProfilePlaceholder,
  type RenderPageSpecOptions,
} from './prax-journal-renderer.js';

// ── Dimensions + geometry ─────────────────────────────────────────
export {
  getPageDimensions,
  pointsToPixels,
  pixelsToPoints,
  getContentArea,
  PAGE_SIZES,
} from './dimensions.js';

// ── Stickers (SVG + PNG rasterisation) ────────────────────────────
export {
  generateStickerSVG,
  STICKER_SIZES,
  type StickerType,
} from './svg-renderer.js';

// ── Profile schema ────────────────────────────────────────────────
export {
  parseProfile,
  type Profile,
} from './types/profile.js';

// ── Locale (UTC-only date math) ───────────────────────────────────
// `isLeapYear` is re-exported from prax-journal-renderer.ts above; the
// canonical implementation lives in `./utils/locale.ts` since the
// prax-journal-renderer dedupe (code-review P2-4 follow-up).
export {
  getMonthNames,
  getDayNames,
  getDaysInMonth,
  getMonthGrid,
  getISOWeekNumber,
  validateYear,
  SUPPORTED_LOCALES,
} from './utils/locale.js';

// ── Shared types ──────────────────────────────────────────────────
export type {
  PageDimensions,
  PaperSize,
  Orientation,
  Margins,
  PDFMetadata,
  PDFBookmark,
  PDFHyperlink,
  StickerPalette,
} from './types/index.js';
