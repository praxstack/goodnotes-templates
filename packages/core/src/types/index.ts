/**
 * Core type definitions for GoodNotes Templates
 *
 * All dimensions are in PDF points (1 point = 1/72 inch)
 * unless explicitly noted as pixels.
 */

// ─── Page Dimensions ────────────────────────────────────────────

export type PaperSize = 'a4' | 'letter' | 'ipad-landscape' | 'ipad-pro-landscape' | 'ipad-wide' | 'custom';
export type Orientation = 'portrait' | 'landscape';

export interface PageDimensions {
  /** Width in PDF points */
  width: number;
  /** Height in PDF points */
  height: number;
  /** Name identifier */
  name: string;
  /** Description */
  description: string;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ─── Sticker Palette ────────────────────────────────────────────

/**
 * Self-contained color palette for stickers.
 * Each sticker type has a baked-in default; this allows optional overrides.
 */
export interface StickerPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  muted: string;
}

// ─── Template Types ─────────────────────────────────────────────

export type TemplateCategory =
  | 'planner'
  | 'journal'
  | 'tracker'
  | 'notes'
  | 'pages'
  | 'worksheet'
  | 'cover';

export type PlannerType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'undated-daily'
  | 'undated-weekly'
  | 'undated-monthly';

export type JournalType =
  | 'gratitude'
  | 'morning-pages'
  | 'reflection'
  | 'prompted'
  | 'diary-dated'
  | 'diary-undated'
  | 'dream'
  | 'travel';

export type TrackerType =
  | 'habit'
  | 'mood'
  | 'fitness'
  | 'meal'
  | 'budget'
  | 'reading'
  | 'sleep'
  | 'water'
  | 'goals';

export type NotesType =
  | 'lined'
  | 'grid'
  | 'dot-grid'
  | 'blank'
  | 'cornell'
  | 'meeting'
  | 'lecture';

export type PageType =
  | 'lined'
  | 'grid'
  | 'dot-grid'
  | 'blank'
  | 'isometric'
  | 'music'
  | 'calligraphy';

export type WorksheetType =
  | 'eisenhower-matrix'
  | 'goal-setting'
  | 'project-planning'
  | 'recipe-card'
  | 'swot-analysis'
  | 'priority-matrix'
  | 'brainstorm';

// ─── Template Configuration ─────────────────────────────────────

export interface TemplateConfig {
  /** Unique template identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Category */
  category: TemplateCategory;
  /** Specific type within category */
  type: string;
  /** Color mode (e.g., 'dark'). Omit for default. */
  colorMode?: string;
  /** Page dimensions */
  pageSize: PaperSize;
  /** Page orientation */
  orientation: Orientation;
  /** Custom margins override */
  margins?: Margins;
  /** Year for dated planners */
  year?: number;
  /** Month for dated planners (1-12) */
  month?: number;
  /** Number of pages to generate */
  pageCount?: number;
  /** Whether to include hyperlinked navigation tabs */
  hyperlinkedTabs?: boolean;
  /** Whether to include PDF bookmarks/outlines */
  bookmarks?: boolean;
  /** Grid density for grid/dot-grid pages (spacing in points) */
  gridSpacing?: number;
  /** Line spacing for lined pages (in points) */
  lineSpacing?: number;
  /** Custom data for template-specific features */
  data?: Record<string, unknown>;
}

// ─── Sticker Types ──────────────────────────────────────────────

export type StickerCategory =
  | 'functional'
  | 'decorative'
  | 'washi'
  | 'sticky-notes'
  | 'banners'
  | 'frames'
  | 'icons'
  | 'dividers';

export type FunctionalStickerType =
  | 'date-tab'
  | 'month-tab'
  | 'priority-marker'
  | 'flag'
  | 'checkbox'
  | 'progress-bar'
  | 'star-rating'
  | 'color-dot'
  | 'arrow'
  | 'number-circle';

export type DecorativeStickerType =
  | 'geometric'
  | 'weather'
  | 'seasonal'
  | 'floral-simple'
  | 'heart'
  | 'star'
  | 'badge';

export interface StickerConfig {
  /** Unique sticker identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category */
  category: StickerCategory;
  /** Specific type */
  type: string;
  /** Optional palette override */
  palette?: Partial<StickerPalette>;
  /** Width in pixels (at target DPI) */
  width: number;
  /** Height in pixels (at target DPI) */
  height: number;
  /** Output DPI (default: 300) */
  dpi?: number;
  /** Text content for labeled stickers */
  text?: string;
  /** Variant index for multi-variant stickers */
  variant?: number;
  /** Custom data */
  data?: Record<string, unknown>;
}

export interface StickerSetConfig {
  /** Set identifier */
  id: string;
  /** Set display name */
  name: string;
  /** Description */
  description: string;
  /** Category */
  category: StickerCategory;
  /** Optional palette override for the set */
  palette?: Partial<StickerPalette>;
  /** Individual sticker configurations */
  stickers: StickerConfig[];
}

// ─── Generation Pipeline ────────────────────────────────────────

export type RenderMethod = 'puppeteer' | 'pdf-lib' | 'svg';

export type OutputFormat = 'pdf' | 'png' | 'svg';

export interface RenderOptions {
  /** Rendering method */
  method: RenderMethod;
  /** Output format */
  format: OutputFormat;
  /** Output DPI for rasterization */
  dpi: number;
  /** Output directory */
  outputDir: string;
  /** Whether to generate preview thumbnails */
  generatePreview: boolean;
  /** Preview thumbnail width in pixels */
  previewWidth?: number;
  /** PDF compression level (0-9, default: 6) */
  compressionLevel?: number;
  /** Whether to embed fonts in PDF */
  embedFonts?: boolean;
  /** Color profile */
  colorProfile?: 'srgb' | 'display-p3';
}

export interface GenerationResult {
  /** Template/sticker ID */
  id: string;
  /** Output file path */
  outputPath: string;
  /** Preview image path (if generated) */
  previewPath?: string;
  /** File size in bytes */
  fileSize: number;
  /** Page count (for PDFs) */
  pageCount?: number;
  /** Generation time in milliseconds */
  generationTime: number;
  /** Whether generation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

// ─── CLI Types ──────────────────────────────────────────────────

export interface CLIOptions {
  /** Generate all assets */
  all?: boolean;
  /** Generate only templates */
  templates?: boolean;
  /** Generate only stickers */
  stickers?: boolean;
  /** Generate only basic pages */
  pages?: boolean;
  /** Color mode (e.g., 'dark'). Omit for default. */
  colorMode?: string;
  /** Category filter */
  category?: string;
  /** Paper size */
  paperSize?: PaperSize;
  /** Orientation */
  orientation?: Orientation;
  /** Year for dated planners */
  year?: number;
  /** Output directory override */
  output?: string;
  /** DPI override */
  dpi?: number;
  /** Verbose logging */
  verbose?: boolean;
  /** Dry run (list what would be generated) */
  dryRun?: boolean;
}

// ─── PDF Metadata ───────────────────────────────────────────────

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
}

export interface PDFBookmark {
  title: string;
  pageIndex: number;
  children?: PDFBookmark[];
}

export interface PDFHyperlink {
  /** Page index where the link is placed */
  sourcePageIndex: number;
  /** Bounding rectangle [x, y, width, height] in points */
  rect: [number, number, number, number];
  /** Destination page index */
  destinationPageIndex: number;
}
