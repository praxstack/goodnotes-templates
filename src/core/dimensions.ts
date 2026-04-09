/**
 * Page dimension definitions for all supported paper sizes.
 *
 * All values are in PDF points (1pt = 1/72 inch).
 * GoodNotes renders PDFs at native resolution; the point-based
 * dimensions determine how the page maps to the iPad display.
 *
 * @see RESEARCH.md §3 — iPad Display Specifications
 */

import type { PageDimensions, PaperSize, Orientation, Margins } from '../types/index.js';

// ─── Standard Paper Sizes ───────────────────────────────────────

export const PAGE_SIZES: Record<PaperSize, PageDimensions> = {
  a4: {
    width: 595.28,
    height: 841.89,
    name: 'A4',
    description: 'ISO A4 (210×297mm) — Most compatible, GoodNotes default',
  },
  letter: {
    width: 612,
    height: 792,
    name: 'US Letter',
    description: 'US Letter (8.5×11in) — Popular in North America',
  },
  'ipad-landscape': {
    width: 1024,
    height: 768,
    name: 'iPad Landscape',
    description: 'iPad standard landscape (4:3) — Fills screen on iPad 9th/Air 13"',
  },
  'ipad-pro-landscape': {
    width: 1366,
    height: 1024,
    name: 'iPad Pro Landscape',
    description: 'iPad Pro 12.9"/Air 13" landscape (4:3) — Maximum screen real estate',
  },
  'ipad-wide': {
    width: 1194,
    height: 834,
    name: 'iPad Wide',
    description: 'iPad Pro 11"/Air 11" landscape (~3:2) — Matches newer iPad aspect ratios',
  },
  custom: {
    width: 595.28,
    height: 841.89,
    name: 'Custom',
    description: 'User-defined dimensions',
  },
};

// ─── Default Margins ────────────────────────────────────────────

export const DEFAULT_MARGINS: Record<string, Margins> = {
  standard: { top: 54, right: 54, bottom: 54, left: 54 },
  narrow: { top: 36, right: 36, bottom: 36, left: 36 },
  wide: { top: 72, right: 72, bottom: 72, left: 72 },
  planner: { top: 60, right: 40, bottom: 40, left: 40 },
  /** Extra left margin for planner tab navigation */
  'planner-tabs': { top: 60, right: 40, bottom: 40, left: 72 },
};

// ─── iPad Display Reference ─────────────────────────────────────

export const IPAD_DISPLAYS = {
  'ipad-10th': { name: 'iPad (10th gen)', width: 2360, height: 1640, ppi: 264, ratio: '3:2' },
  'ipad-9th': { name: 'iPad (9th gen)', width: 2160, height: 1620, ppi: 264, ratio: '4:3' },
  'ipad-air-11': { name: 'iPad Air 11"', width: 2360, height: 1640, ppi: 264, ratio: '3:2' },
  'ipad-air-13': { name: 'iPad Air 13"', width: 2732, height: 2048, ppi: 264, ratio: '4:3' },
  'ipad-pro-11': { name: 'iPad Pro 11"', width: 2420, height: 1668, ppi: 264, ratio: '3:2' },
  'ipad-pro-13': { name: 'iPad Pro 13"', width: 2752, height: 2064, ppi: 264, ratio: '4:3' },
  'ipad-mini': { name: 'iPad mini', width: 2266, height: 1488, ppi: 326, ratio: '3:2' },
} as const;

// ─── DPI Presets ────────────────────────────────────────────────

export const DPI_PRESETS = {
  screen: 72,
  standard: 150,
  retina: 300,
  print: 300,
} as const;

// ─── Helper Functions ───────────────────────────────────────────

/**
 * Get page dimensions for a given paper size and orientation.
 */
export function getPageDimensions(
  size: PaperSize,
  orientation: Orientation = 'portrait'
): PageDimensions {
  const dims = PAGE_SIZES[size];
  if (orientation === 'landscape') {
    return {
      ...dims,
      width: dims.height,
      height: dims.width,
    };
  }
  return { ...dims };
}

/**
 * Convert PDF points to pixels at a given DPI.
 */
export function pointsToPixels(points: number, dpi: number = 150): number {
  return Math.round((points / 72) * dpi);
}

/**
 * Convert pixels to PDF points at a given DPI.
 */
export function pixelsToPoints(pixels: number, dpi: number = 150): number {
  return (pixels / dpi) * 72;
}

/**
 * Get the content area (page size minus margins).
 */
export function getContentArea(
  dims: PageDimensions,
  margins: Margins = DEFAULT_MARGINS.standard
): { width: number; height: number; x: number; y: number } {
  return {
    x: margins.left,
    y: margins.top,
    width: dims.width - margins.left - margins.right,
    height: dims.height - margins.top - margins.bottom,
  };
}

/**
 * Calculate grid line positions for a given content area and spacing.
 */
export function calculateGridPositions(
  contentWidth: number,
  contentHeight: number,
  spacing: number,
  offsetX: number = 0,
  offsetY: number = 0
): { horizontalLines: number[]; verticalLines: number[] } {
  const horizontalLines: number[] = [];
  const verticalLines: number[] = [];

  for (let y = offsetY; y <= contentHeight + offsetY; y += spacing) {
    horizontalLines.push(y);
  }
  for (let x = offsetX; x <= contentWidth + offsetX; x += spacing) {
    verticalLines.push(x);
  }

  return { horizontalLines, verticalLines };
}
