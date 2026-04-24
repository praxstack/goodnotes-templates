/**
 * Puppeteer screenshot helper for visual-regression tests.
 *
 * One shared Chromium for the whole suite — launching fresh per test would
 * add ~2s each and defeat the point. The `vitest.visual.config.ts` forces
 * single-fork execution so only this module holds the browser handle.
 */

import puppeteer, { type Browser, type Page } from 'puppeteer';
import fs from 'node:fs/promises';

let browserPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      // CI-style flags ensure byte-identical rendering between a dev laptop
      // and the GitHub Actions runner. `--font-render-hinting=none` matches
      // the main renderer in src/core/puppeteer-renderer.ts.
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--force-device-scale-factor=1',
        '--hide-scrollbars',
      ],
    });
  }
  return browserPromise;
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const b = await browserPromise;
    await b.close();
    browserPromise = null;
  }
}

export interface RenderOptions {
  htmlPath: string;
  /** A4 @ CSS px. 794×1123 is the standard 96dpi A4 rendering. */
  width?: number;
  height?: number;
  /** Wait for any `font-display: swap` fonts to settle. Default true. */
  waitForFonts?: boolean;
}

/**
 * Render an HTML template to a PNG buffer at A4 dimensions.
 *
 * Determinism guard-rails:
 *  - single scale factor (no HiDPI)
 *  - block any network fetch (templates must be self-contained; this also
 *    prevents Google Fonts from subtly drifting the baseline)
 *  - disable animations via CSS injection
 *  - `fullPage: false` so the frame is exactly one A4
 */
export async function renderToPng(opts: RenderOptions): Promise<Buffer> {
  const { htmlPath, width = 794, height = 1123, waitForFonts = true } = opts;
  const browser = await getBrowser();
  const page: Page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Block all network I/O. Templates that want web fonts won't get them;
    // we rely on system + bundled fallbacks so the baseline is reproducible.
    // If a template depends on Google Fonts today, the rendered baseline
    // will be the fallback-font version — that's the honest contract.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.startsWith('data:') || url.startsWith('file:')) {
        void req.continue();
      } else {
        void req.abort('blockedbyclient');
      }
    });

    const html = await fs.readFile(htmlPath, 'utf-8');
    // `file://` base URL lets relative imports resolve if any template adds
    // them later, without being able to reach the network.
    await page.goto(`file://${htmlPath}`, { waitUntil: 'domcontentloaded' });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Kill animations & caret blinking so two runs are identical.
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          caret-color: transparent !important;
        }
      `,
    });

    if (waitForFonts) {
      try {
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              // @ts-expect-error FontFaceSet is a page realm type.
              document.fonts.ready.then(() => resolve());
              // Fail-open after 2s in case a font spec never resolves.
              setTimeout(() => resolve(), 2000);
            }),
        );
      } catch {
        // Page closed mid-eval; let screenshot still try.
      }
    }

    const png = (await page.screenshot({
      type: 'png',
      fullPage: false,
      omitBackground: false,
    })) as Uint8Array;
    return Buffer.from(png);
  } finally {
    await page.close();
  }
}
