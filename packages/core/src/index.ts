/**
 * @pretext-templates/core — barrel export.
 *
 * Re-exports the stable public surface of the rendering pipeline so
 * downstream packages (CLI, apps/gallery, future registry tools) import
 * from `@pretext-templates/core` instead of reaching into subpaths.
 *
 * Subpath imports (e.g. `@pretext-templates/core/dimensions`) remain
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
export {
  getMonthNames,
  getDayNames,
  getDaysInMonth,
  isLeapYear as isLeapYearLocale,
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
