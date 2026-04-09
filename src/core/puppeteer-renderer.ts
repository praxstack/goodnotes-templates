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
/**
 * Semantic color defaults — these provide the green/blue/amber/accent
 * colors that templates rely on for meaning (green=health, blue=info,
 * amber=warning/thought). Theme injection overrides structural colors
 * (bg, surface, ink, rule) but PRESERVES semantic colors unless the
 * theme explicitly provides them via `extra`.
 *
 * This is the critical fix: previously ALL semantic colors were mapped
 * to generic theme.colors.primary/secondary which collapsed 7 distinct
 * colors into 2-3, making everything look flat and monochrome.
 */
const SEMANTIC_DEFAULTS = {
  light: {
    green: '#5E8B6A', greenSoft: '#D4E4D8',
    blue: '#4A6FA5', blueSoft: '#D3DEF0',
    amber: '#C4933F', amberSoft: '#F0E4C8',
    accentSoft: '#F2D8CC',
  },
  dark: {
    green: '#6AAF7E', greenSoft: 'rgba(94, 139, 106, 0.2)',
    blue: '#6CA0D4', blueSoft: 'rgba(74, 111, 165, 0.2)',
    amber: '#D4A94F', amberSoft: 'rgba(196, 147, 63, 0.2)',
    accentSoft: 'rgba(196, 93, 62, 0.2)',
  },
};

function generateThemeCSS(theme: Theme): string {
  const sem = theme.isDark ? SEMANTIC_DEFAULTS.dark : SEMANTIC_DEFAULTS.light;
  const extra = theme.colors.extra || {};

  return `
    :root {
      /* Theme: ${theme.name} — structural overrides */
      --bg: ${theme.colors.background};
      --surface: ${theme.colors.surface || theme.colors.secondary};
      --surface-alt: ${theme.isDark ? (theme.colors.surface || theme.colors.secondary) : theme.colors.muted};
      --ink: ${theme.colors.text};
      --ink-2: ${theme.colors.text}CC;
      --ink-3: ${theme.colors.muted};
      --rule: ${theme.lineColor};
      --rule-light: ${theme.isDark ? theme.lineColor + '80' : theme.colors.secondary};
      --accent: ${theme.colors.accent};
      --dark: ${theme.colors.text};
      --cream: ${theme.colors.background};

      /* Semantic colors — preserved from template defaults, themed for dark mode */
      --green: ${extra.green || sem.green};
      --green-soft: ${extra.greenSoft || sem.greenSoft};
      --blue: ${extra.blue || sem.blue};
      --blue-soft: ${extra.blueSoft || sem.blueSoft};
      --amber: ${extra.amber || sem.amber};
      --amber-soft: ${extra.amberSoft || sem.amberSoft};
      --accent-soft: ${extra.accentSoft || sem.accentSoft};

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
