/**
 * PDFKit renderer for simple page types: lined, grid, dot-grid, blank,
 * isometric, music staff, calligraphy guide.
 *
 * Direct PDF construction produces small files (<500KB) without Puppeteer overhead.
 * Used for pages where the content is purely geometric (lines, dots, grids).
 */

import PDFDocument from 'pdfkit';
import type { Theme, PageDimensions, Margins } from '../types/index.js';
import { DEFAULT_MARGINS } from './dimensions.js';

export type SimplePageType =
  | 'lined'
  | 'grid'
  | 'dot-grid'
  | 'blank'
  | 'isometric'
  | 'music'
  | 'calligraphy';

export interface SimplePageOptions {
  pageType: SimplePageType;
  dimensions: PageDimensions;
  theme: Theme;
  margins?: Margins;
  /** Line spacing in points (default: 24 for lined, 18 for grid/dot-grid) */
  spacing?: number;
  /** Number of pages to generate (default: 1) */
  pageCount?: number;
  /** Title to show at top of first page */
  title?: string;
}

/**
 * Generate a simple page PDF and return as a Buffer.
 */
export async function renderSimplePage(options: SimplePageOptions): Promise<Buffer> {
  const {
    pageType,
    dimensions,
    theme,
    margins = DEFAULT_MARGINS.standard,
    spacing = getDefaultSpacing(pageType),
    pageCount = 1,
    title,
  } = options;

  const doc = new PDFDocument({
    size: [dimensions.width, dimensions.height],
    margins: { top: margins.top, bottom: margins.bottom, left: margins.left, right: margins.right },
    info: {
      Title: title || `${pageType} page`,
      Author: 'goodnotes-templates',
      Creator: 'goodnotes-templates (https://github.com/yourusername/goodnotes-templates)',
      Producer: 'PDFKit',
    },
    autoFirstPage: false,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const contentLeft = margins.left;
  const contentTop = margins.top;
  const contentWidth = dimensions.width - margins.left - margins.right;
  const contentHeight = dimensions.height - margins.top - margins.bottom;

  for (let page = 0; page < pageCount; page++) {
    doc.addPage();

    // Background color
    doc.rect(0, 0, dimensions.width, dimensions.height)
      .fill(theme.colors.background);

    // Title on first page
    if (page === 0 && title) {
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(theme.colors.text)
        .text(title, contentLeft, contentTop, {
          width: contentWidth,
          align: 'center',
        });
    }

    const drawTop = page === 0 && title ? contentTop + 30 : contentTop;
    const drawHeight = contentHeight - (page === 0 && title ? 30 : 0);

    switch (pageType) {
      case 'lined':
        drawLinedPage(doc, contentLeft, drawTop, contentWidth, drawHeight, spacing, theme);
        break;
      case 'grid':
        drawGridPage(doc, contentLeft, drawTop, contentWidth, drawHeight, spacing, theme);
        break;
      case 'dot-grid':
        drawDotGridPage(doc, contentLeft, drawTop, contentWidth, drawHeight, spacing, theme);
        break;
      case 'blank':
        // Nothing to draw
        break;
      case 'isometric':
        drawIsometricPage(doc, contentLeft, drawTop, contentWidth, drawHeight, spacing, theme);
        break;
      case 'music':
        drawMusicStaffPage(doc, contentLeft, drawTop, contentWidth, drawHeight, theme);
        break;
      case 'calligraphy':
        drawCalligraphyPage(doc, contentLeft, drawTop, contentWidth, drawHeight, theme);
        break;
    }
  }

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

// ─── Drawing Functions ──────────────────────────────────────────

function drawLinedPage(
  doc: PDFKit.PDFDocument,
  x: number, y: number, width: number, height: number,
  spacing: number, theme: Theme
): void {
  doc.strokeColor(theme.lineColor).lineWidth(theme.lineWeight);

  for (let lineY = y + spacing; lineY <= y + height; lineY += spacing) {
    doc.moveTo(x, lineY).lineTo(x + width, lineY).stroke();
  }

  // Left margin line (red, classic ruled paper style)
  if (!theme.isDark) {
    doc.strokeColor('#E8A0A0').lineWidth(0.5);
    doc.moveTo(x + 36, y).lineTo(x + 36, y + height).stroke();
  }
}

function drawGridPage(
  doc: PDFKit.PDFDocument,
  x: number, y: number, width: number, height: number,
  spacing: number, theme: Theme
): void {
  doc.strokeColor(theme.lineColor).lineWidth(theme.lineWeight * 0.8);

  // Horizontal lines
  for (let lineY = y; lineY <= y + height; lineY += spacing) {
    doc.moveTo(x, lineY).lineTo(x + width, lineY).stroke();
  }

  // Vertical lines
  for (let lineX = x; lineX <= x + width; lineX += spacing) {
    doc.moveTo(lineX, y).lineTo(lineX, y + height).stroke();
  }
}

function drawDotGridPage(
  doc: PDFKit.PDFDocument,
  x: number, y: number, width: number, height: number,
  spacing: number, theme: Theme
): void {
  const dotRadius = 0.8;
  doc.fillColor(theme.lineColor);

  for (let dotY = y; dotY <= y + height; dotY += spacing) {
    for (let dotX = x; dotX <= x + width; dotX += spacing) {
      doc.circle(dotX, dotY, dotRadius).fill();
    }
  }
}

function drawIsometricPage(
  doc: PDFKit.PDFDocument,
  x: number, y: number, width: number, height: number,
  spacing: number, theme: Theme
): void {
  doc.strokeColor(theme.lineColor).lineWidth(theme.lineWeight * 0.6);
  const isoSpacing = spacing || 20;

  // Horizontal lines
  for (let lineY = y; lineY <= y + height; lineY += isoSpacing * Math.sin(Math.PI / 3)) {
    doc.moveTo(x, lineY).lineTo(x + width, lineY).stroke();
  }

  // Lines at 60 degrees (going right)
  for (let startX = x - height; startX <= x + width; startX += isoSpacing) {
    const x1 = Math.max(x, startX);
    const y1 = y + (x1 - startX) * Math.tan(Math.PI / 3);
    const x2 = Math.min(x + width, startX + height / Math.tan(Math.PI / 3));
    const y2 = y + (x2 - startX) * Math.tan(Math.PI / 3);
    if (y1 <= y + height && y2 >= y) {
      doc.moveTo(x1, Math.max(y, y1)).lineTo(x2, Math.min(y + height, y2)).stroke();
    }
  }

  // Lines at 120 degrees (going left)
  for (let startX = x; startX <= x + width + height; startX += isoSpacing) {
    const x1 = Math.min(x + width, startX);
    const y1 = y + (startX - x1) * Math.tan(Math.PI / 3);
    const x2 = Math.max(x, startX - height / Math.tan(Math.PI / 3));
    const y2 = y + (startX - x2) * Math.tan(Math.PI / 3);
    if (y1 <= y + height && y2 >= y) {
      doc.moveTo(x1, Math.max(y, y1)).lineTo(x2, Math.min(y + height, y2)).stroke();
    }
  }
}

function drawMusicStaffPage(
  doc: PDFKit.PDFDocument,
  x: number, y: number, width: number, height: number,
  theme: Theme
): void {
  const staffLineSpacing = 8;
  const staffGroupSpacing = 60;
  const linesPerStaff = 5;

  doc.strokeColor(theme.lineColor).lineWidth(0.5);

  for (let staffY = y + 20; staffY + (linesPerStaff - 1) * staffLineSpacing < y + height; staffY += staffGroupSpacing) {
    for (let line = 0; line < linesPerStaff; line++) {
      const lineY = staffY + line * staffLineSpacing;
      doc.moveTo(x, lineY).lineTo(x + width, lineY).stroke();
    }
  }
}

function drawCalligraphyPage(
  doc: PDFKit.PDFDocument,
  x: number, y: number, width: number, height: number,
  theme: Theme
): void {
  const baselineSpacing = 40;
  const xHeight = 14;
  const ascenderHeight = 10;
  const descenderHeight = 10;
  const slantAngle = 55; // degrees from horizontal
  const slantSpacing = 10;

  doc.strokeColor(theme.lineColor);

  for (let baseY = y + ascenderHeight + xHeight + 20; baseY + descenderHeight < y + height; baseY += baselineSpacing) {
    // Ascender line (lightest)
    doc.lineWidth(0.3);
    doc.moveTo(x, baseY - xHeight - ascenderHeight).lineTo(x + width, baseY - xHeight - ascenderHeight).stroke();

    // X-height line (medium)
    doc.lineWidth(0.4);
    doc.moveTo(x, baseY - xHeight).lineTo(x + width, baseY - xHeight).stroke();

    // Baseline (darkest)
    doc.lineWidth(0.6);
    doc.moveTo(x, baseY).lineTo(x + width, baseY).stroke();

    // Descender line (lightest)
    doc.lineWidth(0.3);
    doc.moveTo(x, baseY + descenderHeight).lineTo(x + width, baseY + descenderHeight).stroke();

    // Slant lines
    doc.lineWidth(0.2).strokeColor(theme.lineColor);
    const slantRadians = (slantAngle * Math.PI) / 180;
    const totalHeight = xHeight + ascenderHeight + descenderHeight;
    for (let slantX = x; slantX <= x + width; slantX += slantSpacing) {
      const dx = totalHeight / Math.tan(slantRadians);
      doc.moveTo(slantX, baseY + descenderHeight)
        .lineTo(slantX + dx, baseY - xHeight - ascenderHeight)
        .stroke();
    }
    doc.strokeColor(theme.lineColor);
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function getDefaultSpacing(pageType: SimplePageType): number {
  switch (pageType) {
    case 'lined': return 24;
    case 'grid': return 18;
    case 'dot-grid': return 18;
    case 'isometric': return 20;
    default: return 24;
  }
}
