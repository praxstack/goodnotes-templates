/**
 * PDF post-processor using pdf-lib.
 *
 * Takes a Puppeteer-generated PDF buffer and adds:
 * - Internal hyperlinks (page-to-page navigation via /GoTo actions)
 * - Bookmark outlines for GoodNotes sidebar navigation
 * - PDF metadata (title, author, keywords)
 *
 * Coordinate system note:
 * - Puppeteer/CSS: origin at TOP-LEFT, Y increases downward
 * - PDF: origin at BOTTOM-LEFT, Y increases upward
 * - The cssToPageRect() helper handles the conversion
 */

import { PDFDocument, PDFName, PDFArray, PDFDict, PDFNumber, PDFString } from 'pdf-lib';
import type { PDFMetadata, PDFBookmark, PDFHyperlink } from '../types/index.js';

/**
 * Convert CSS-style rect (top-left origin) to PDF rect (bottom-left origin).
 * CSS: [x, y, width, height] where y is from top
 * PDF: [x1, y1, x2, y2] where y1 is from bottom
 */
function cssToPageRect(
  cssX: number, cssY: number, cssWidth: number, cssHeight: number,
  pageHeight: number
): [number, number, number, number] {
  const x1 = cssX;
  const y1 = pageHeight - cssY - cssHeight; // flip Y
  const x2 = cssX + cssWidth;
  const y2 = pageHeight - cssY;
  return [x1, y1, x2, y2];
}

/**
 * Add metadata to a PDF.
 */
export async function addMetadata(
  pdfBuffer: Buffer,
  metadata: PDFMetadata
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);

  doc.setTitle(metadata.title);
  doc.setAuthor(metadata.author);
  doc.setSubject(metadata.subject);
  doc.setKeywords(metadata.keywords);
  doc.setCreator(metadata.creator);
  doc.setProducer(metadata.producer);
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  return Buffer.from(await doc.save());
}

/**
 * Add internal hyperlinks to a PDF.
 * Each hyperlink creates a /Link annotation with a /GoTo action
 * pointing to a specific page. Minimum tap target: 44x44 points (Apple HIG).
 */
export async function addHyperlinks(
  pdfBuffer: Buffer,
  links: PDFHyperlink[]
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);
  const pages = doc.getPages();

  for (const link of links) {
    if (link.sourcePageIndex >= pages.length) {
      console.warn(`Hyperlink skipped: source page ${link.sourcePageIndex} out of range (${pages.length} pages)`);
      continue;
    }
    if (link.destinationPageIndex >= pages.length) {
      console.warn(`Hyperlink skipped: dest page ${link.destinationPageIndex} out of range (${pages.length} pages)`);
      continue;
    }

    const sourcePage = pages[link.sourcePageIndex];
    const destPage = pages[link.destinationPageIndex];
    const pageHeight = sourcePage.getHeight();

    // Convert CSS rect to PDF rect
    const [x1, y1, x2, y2] = cssToPageRect(
      link.rect[0], link.rect[1], link.rect[2], link.rect[3],
      pageHeight
    );

    // Enforce minimum tap target (44x44 points per Apple HIG)
    const minSize = 44;
    const actualW = x2 - x1;
    const actualH = y2 - y1;
    const adjX1 = actualW < minSize ? x1 - (minSize - actualW) / 2 : x1;
    const adjY1 = actualH < minSize ? y1 - (minSize - actualH) / 2 : y1;
    const adjX2 = actualW < minSize ? x2 + (minSize - actualW) / 2 : x2;
    const adjY2 = actualH < minSize ? y2 + (minSize - actualH) / 2 : y2;

    // Create the /GoTo action pointing to destination page
    const destRef = destPage.ref;
    const action = doc.context.obj({
      Type: 'Action',
      S: 'GoTo',
      D: PDFArray.withContext(doc.context),
    });

    // Destination: [pageRef /Fit]
    const destArray = action.get(PDFName.of('D')) as PDFArray;
    destArray.push(destRef);
    destArray.push(PDFName.of('Fit'));

    // Create link annotation
    const annotation = doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [adjX1, adjY1, adjX2, adjY2],
      Border: [0, 0, 0], // No visible border
      A: action,
    });

    // Add annotation to the source page
    const annots = sourcePage.node.get(PDFName.of('Annots'));
    if (annots instanceof PDFArray) {
      annots.push(doc.context.register(annotation));
    } else {
      const newAnnots = PDFArray.withContext(doc.context);
      newAnnots.push(doc.context.register(annotation));
      sourcePage.node.set(PDFName.of('Annots'), newAnnots);
    }
  }

  return Buffer.from(await doc.save());
}

/**
 * Add bookmark outlines to a PDF.
 * Creates a hierarchical bookmark tree for GoodNotes sidebar navigation.
 */
export async function addBookmarks(
  pdfBuffer: Buffer,
  bookmarks: PDFBookmark[]
): Promise<Buffer> {
  const doc = await PDFDocument.load(pdfBuffer);
  const pages = doc.getPages();

  if (bookmarks.length === 0) return pdfBuffer;

  // Build outline tree
  const outlineRef = doc.context.nextRef();
  const outlineItems: Array<{ ref: any; dict: PDFDict }> = [];

  function createOutlineItem(
    bookmark: PDFBookmark,
    parentRef: any
  ): { ref: any; dict: PDFDict } {
    const ref = doc.context.nextRef();
    const page = pages[Math.min(bookmark.pageIndex, pages.length - 1)];

    const dest = PDFArray.withContext(doc.context);
    dest.push(page.ref);
    dest.push(PDFName.of('Fit'));

    const dict = doc.context.obj({
      Title: PDFString.of(bookmark.title),
      Parent: parentRef,
      Dest: dest,
    });

    const item = { ref, dict };
    outlineItems.push(item);

    if (bookmark.children && bookmark.children.length > 0) {
      const children = bookmark.children.map(child =>
        createOutlineItem(child, ref)
      );

      dict.set(PDFName.of('First'), children[0].ref);
      dict.set(PDFName.of('Last'), children[children.length - 1].ref);
      dict.set(PDFName.of('Count'), PDFNumber.of(children.length));

      // Link siblings
      for (let i = 0; i < children.length; i++) {
        if (i > 0) children[i].dict.set(PDFName.of('Prev'), children[i - 1].ref);
        if (i < children.length - 1) children[i].dict.set(PDFName.of('Next'), children[i + 1].ref);
      }
    }

    return item;
  }

  const topLevel = bookmarks.map(b => createOutlineItem(b, outlineRef));

  // Link top-level siblings
  for (let i = 0; i < topLevel.length; i++) {
    if (i > 0) topLevel[i].dict.set(PDFName.of('Prev'), topLevel[i - 1].ref);
    if (i < topLevel.length - 1) topLevel[i].dict.set(PDFName.of('Next'), topLevel[i + 1].ref);
  }

  // Create outline root
  const outlineDict = doc.context.obj({
    Type: 'Outlines',
    First: topLevel[0].ref,
    Last: topLevel[topLevel.length - 1].ref,
    Count: PDFNumber.of(topLevel.length),
  });

  // Register all items
  doc.context.assign(outlineRef, outlineDict);
  for (const item of outlineItems) {
    doc.context.assign(item.ref, item.dict);
  }

  // Set outlines on the document catalog
  doc.catalog.set(PDFName.of('Outlines'), outlineRef);

  return Buffer.from(await doc.save());
}

/**
 * Full post-processing pipeline: metadata + hyperlinks + bookmarks.
 */
export async function postProcessPDF(
  pdfBuffer: Buffer,
  options: {
    metadata?: PDFMetadata;
    hyperlinks?: PDFHyperlink[];
    bookmarks?: PDFBookmark[];
  }
): Promise<Buffer> {
  let result = pdfBuffer;

  if (options.metadata) {
    result = await addMetadata(result, options.metadata);
  }
  if (options.hyperlinks && options.hyperlinks.length > 0) {
    result = await addHyperlinks(result, options.hyperlinks);
  }
  if (options.bookmarks && options.bookmarks.length > 0) {
    result = await addBookmarks(result, options.bookmarks);
  }

  return result;
}

/**
 * Merge multiple PDF buffers into one (for batch generation).
 * Used to combine monthly chunks of a planner into one file.
 */
export async function mergePDFs(buffers: Buffer[]): Promise<Buffer> {
  const mergedDoc = await PDFDocument.create();

  for (const buffer of buffers) {
    const sourceDoc = await PDFDocument.load(buffer);
    const pages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
    for (const page of pages) {
      mergedDoc.addPage(page);
    }
  }

  return Buffer.from(await mergedDoc.save());
}
