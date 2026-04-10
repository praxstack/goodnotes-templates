/**
 * Puppeteer renderer — converts HTML/CSS templates to PDF.
 *
 * TRANSPARENT PASS-THROUGH: The renderer does NOT modify template CSS.
 * Templates are self-contained — they own their colors, fonts, and layout.
 * The only optional modification is injecting a color-mode CSS snippet
 * (e.g., .dark.css) that the template author placed alongside their HTML.
 *
 * Pipeline:
 * 1. Read HTML template file (or use inline htmlContent)
 * 2. Optionally inject color-mode CSS snippet (.dark.css, etc.)
 * 3. Launch Puppeteer, load page, wait for fonts
 * 4. Render to PDF buffer
 * 5. Pass to pdf-postprocess.ts for hyperlinks/bookmarks
 */

import puppeteer, { type Browser } from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { PageDimensions } from '../types/index.js';

let browserInstance: Browser | null = null;

/**
 * Get or create a shared Puppeteer browser instance.
 * Reusing the browser saves ~2s per render vs launching fresh.
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
      ],
    });
  }
  return browserInstance;
}

/**
 * Close the shared browser instance. Call when done generating.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.connected) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export interface PuppeteerRenderOptions {
  /** Path to HTML template file (also used for color-mode CSS discovery) */
  htmlPath: string;
  /** Page dimensions */
  dimensions: PageDimensions;
  /** Optional: inline HTML string instead of file path */
  htmlContent?: string;
  /**
   * Color mode name (e.g., 'dark'). If set, renderer looks for
   * {htmlPath}.replace('.html', `.${colorMode}.css`) and injects it.
   * Omit for the template's default (light) mode.
   */
  colorMode?: string;
  /**
   * Multi-page mode: let CSS @page rules and page-break-after control
   * page size and breaks. Don't pass explicit width/height to page.pdf().
   * Required for documents with multiple CSS pages (e.g., full year planner).
   */
  multiPage?: boolean;
}

/**
 * Render an HTML template to a PDF buffer using Puppeteer.
 * TRANSPARENT: does not inject theme CSS or fonts. Template CSS is preserved.
 */
export async function renderHTMLToPDF(options: PuppeteerRenderOptions): Promise<Buffer> {
  const { htmlPath, dimensions, htmlContent, colorMode } = options;

  let html: string;
  if (htmlContent) {
    html = htmlContent;
  } else {
    html = await fs.readFile(htmlPath, 'utf-8');
  }

  // Optional: inject color-mode CSS snippet (e.g., .dark.css)
  // This is a ~20-line :root override written by the template author.
  if (colorMode && htmlPath) {
    const cssPath = htmlPath.replace('.html', `.${colorMode}.css`);
    try {
      const modeCSS = await fs.readFile(cssPath, 'utf-8');
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style id="color-mode">\n${modeCSS}\n</style>\n</head>`);
      }
    } catch {
      console.warn(`  ⚠ Color mode "${colorMode}" not found: ${cssPath}`);
    }
  }

  // NO theme injection. NO font override. Template CSS is the source of truth.

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Load the HTML content
    // Increase timeout for large multi-page documents (100+ pages)
    const timeout = options.multiPage ? 120000 : 30000;
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout,
    });

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);

    // Generate PDF
    let pdfBuffer: Uint8Array;

    if (options.multiPage) {
      // Multi-page mode: let CSS @page { size } and page-break-after
      // control page breaks. The HTML template must have @page rules.
      pdfBuffer = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } else {
      // Single-page mode: explicit dimensions (Puppeteer needs inches: 1pt = 1/72 inch)
      const widthInches = dimensions.width / 72;
      const heightInches = dimensions.height / 72;
      pdfBuffer = await page.pdf({
        width: `${widthInches}in`,
        height: `${heightInches}in`,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    }

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

/**
 * Render an HTML template file to a PDF file on disk.
 */
export async function renderHTMLToPDFFile(
  options: PuppeteerRenderOptions,
  outputPath: string
): Promise<{ path: string; size: number; pages: number }> {
  const buffer = await renderHTMLToPDF(options);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);

  // Estimate page count from file (rough heuristic)
  const pages = Math.max(1, Math.round(buffer.length / 50000));

  return { path: outputPath, size: buffer.length, pages };
}

/**
 * Batch render multiple HTML templates.
 * Reuses the browser instance for efficiency.
 */
export async function batchRenderHTML(
  templates: Array<{ htmlPath: string; outputPath: string; name: string }>,
  dimensions: PageDimensions,
  colorMode?: string,
  onProgress?: (name: string, index: number, total: number) => void
): Promise<Array<{ path: string; size: number; name: string }>> {
  const results: Array<{ path: string; size: number; name: string }> = [];

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    if (onProgress) onProgress(t.name, i + 1, templates.length);

    try {
      const result = await renderHTMLToPDFFile(
        { htmlPath: t.htmlPath, dimensions, colorMode },
        t.outputPath
      );
      results.push({ ...result, name: t.name });
    } catch (err) {
      console.error(`  ✗ ${t.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return results;
}
