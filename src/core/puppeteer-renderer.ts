/**
 * Puppeteer renderer — converts HTML/CSS templates to PDF.
 *
 * Used for complex layouts (planners, journals, trackers, worksheets)
 * where CSS Grid/Flexbox, Google Fonts, and pixel-perfect typography
 * are essential.
 *
 * Pipeline:
 * 1. Read HTML template file
 * 2. Inject theme CSS variables (colors, fonts)
 * 3. Launch Puppeteer, load page
 * 4. Render to PDF buffer
 * 5. Pass to pdf-postprocess.ts for hyperlinks/bookmarks
 */

import puppeteer, { type Browser } from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { Theme, PageDimensions } from '../types/index.js';

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

/**
 * Generate CSS variable overrides to theme an HTML template.
 * Injects the theme's colors and fonts as CSS custom properties.
 */
function generateThemeCSS(theme: Theme): string {
  return `
    :root {
      /* Theme: ${theme.name} */
      --bg: ${theme.colors.background};
      --surface: ${theme.colors.secondary};
      --surface-alt: ${theme.colors.muted};
      --ink: ${theme.colors.text};
      --ink-2: ${theme.colors.text}CC;
      --ink-3: ${theme.colors.muted};
      --rule: ${theme.lineColor};
      --rule-light: ${theme.colors.secondary};
      --accent: ${theme.colors.accent};
      --accent-soft: ${theme.colors.secondary};
      --green: ${theme.colors.primary};
      --green-soft: ${theme.colors.secondary};
      --blue: ${theme.colors.accent};
      --blue-soft: ${theme.colors.secondary};
      --amber: ${theme.colors.primary};
      --amber-soft: ${theme.colors.secondary};
      --dark: ${theme.colors.text};
      --cream: ${theme.colors.background};

      /* Theme colors (direct) */
      --theme-primary: ${theme.colors.primary};
      --theme-secondary: ${theme.colors.secondary};
      --theme-accent: ${theme.colors.accent};
      --theme-background: ${theme.colors.background};
      --theme-text: ${theme.colors.text};
      --theme-muted: ${theme.colors.muted};
      ${theme.colors.surface ? `--theme-surface: ${theme.colors.surface};` : ''}

      /* Theme fonts */
      --font-display: '${theme.fonts.header.family}', Georgia, serif;
      --font-body: '${theme.fonts.body.family}', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
  `;
}

export interface PuppeteerRenderOptions {
  /** Path to HTML template file */
  htmlPath: string;
  /** Theme to apply */
  theme: Theme;
  /** Page dimensions */
  dimensions: PageDimensions;
  /** Optional: inline HTML string instead of file path */
  htmlContent?: string;
  /**
   * Multi-page mode: let CSS @page rules and page-break-after control
   * page size and breaks. Don't pass explicit width/height to page.pdf().
   * Required for documents with multiple CSS pages (e.g., full year planner).
   */
  multiPage?: boolean;
}

/**
 * Render an HTML template to a PDF buffer using Puppeteer.
 * Injects theme CSS variables before rendering.
 */
export async function renderHTMLToPDF(options: PuppeteerRenderOptions): Promise<Buffer> {
  const { htmlPath, theme, dimensions, htmlContent } = options;

  let html: string;
  if (htmlContent) {
    html = htmlContent;
  } else {
    html = await fs.readFile(htmlPath, 'utf-8');
  }

  // Inject theme CSS after <head> or at the start
  const themeCSS = `<style id="theme-override">${generateThemeCSS(theme)}</style>`;
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${themeCSS}\n</head>`);
  } else {
    html = themeCSS + html;
  }

  // Add Google Fonts link for theme fonts
  const fontFamilies = [
    theme.fonts.header.family,
    theme.fonts.body.family,
    theme.fonts.accent.family,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const fontLink = `<link href="https://fonts.googleapis.com/css2?${fontFamilies.map(f => `family=${f.replace(/ /g, '+')}`).join('&')}&display=swap" rel="stylesheet">`;

  if (html.includes('</head>')) {
    html = html.replace('</head>', `${fontLink}\n</head>`);
  }

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
      // This is required for documents with many CSS .page divs.
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
 * Batch render multiple HTML templates with the same theme.
 * Reuses the browser instance for efficiency.
 */
export async function batchRenderHTML(
  templates: Array<{ htmlPath: string; outputPath: string; name: string }>,
  theme: Theme,
  dimensions: PageDimensions,
  onProgress?: (name: string, index: number, total: number) => void
): Promise<Array<{ path: string; size: number; name: string }>> {
  const results: Array<{ path: string; size: number; name: string }> = [];

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    if (onProgress) onProgress(t.name, i + 1, templates.length);

    try {
      const result = await renderHTMLToPDFFile(
        { htmlPath: t.htmlPath, theme, dimensions },
        t.outputPath
      );
      results.push({ ...result, name: t.name });
    } catch (err) {
      console.error(`  ✗ ${t.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return results;
}
