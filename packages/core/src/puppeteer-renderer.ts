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
import type { PageDimensions } from './types/index.js';

let browserInstance: Browser | null = null;
// Cache the launch *promise*, not the resolved browser, so concurrent callers
// share one launch instead of racing to spawn two Chromiums (FIND-0025).
let browserPromise: Promise<Browser> | null = null;

// ─── C7b.3: memory-aware browser-restart ────────────────────────────
//
// Rationale: Chromium RSS grows roughly linearly with the number of pages
// it renders in one lifetime. For the >100-spec runs that year-long or
// multi-pack bundles produce, the cumulative Chromium process can easily
// top 2 GB on a developer workstation. The symptom is progressive
// slowdown, then an OOM-kill that leaves a half-written PDF.
//
// The fix is the simplest thing that works: count how many pages we've
// rendered, and every N renders, close the browser and relaunch. Because
// `getBrowser()` already lazily re-creates the instance when needed, the
// only new primitive is a "mark this render done" counter plus a
// tripwire that flips `browserPromise` and `browserInstance` to null
// after the threshold.
//
// Threshold is read from PRAX_BROWSER_RESTART_EVERY (default 50). Set
// to 0 to disable the feature — useful when running short bundles
// where the restart overhead (~2s) is wasted.
//
// We intentionally do NOT probe Chromium's RSS directly: it runs in a
// separate process tree from Node, so `process.memoryUsage()` measures
// the wrong thing, and polling /proc or sysctl is not portable. Spec
// count is a cheap, deterministic proxy (AGENTS.md principle 2).
let renderCount = 0;

/**
 * Read the restart threshold; 0 disables.
 *
 * Unparseable or negative values fall back to 50 with a single warn
 * (FIND-I4-006). Silent fallback used to let a typo'd env var brick a
 * long run by disabling the memory-aware restart entirely.
 */
function getRestartThreshold(): number {
  const raw = process.env.PRAX_BROWSER_RESTART_EVERY;
  if (raw === undefined) return 50;
  const n = Number.parseInt(raw, 10);
  if (Number.isFinite(n) && n >= 0) return n;
  console.warn(
    `  ⚠ PRAX_BROWSER_RESTART_EVERY="${raw}" is not a valid non-negative integer; ` +
      `falling back to 50`,
  );
  return 50;
}

/**
 * Internal: trip the restart flag if we've rendered >= threshold pages
 * since the last browser launch. Exported as `maybeRestartBrowser` for
 * tests. Returns true if a restart actually happened.
 */
export async function maybeRestartBrowser(): Promise<boolean> {
  const threshold = getRestartThreshold();
  if (threshold === 0) return false;
  if (renderCount < threshold) return false;

  // Log once per restart so long runs show a trail, not silence.
  // Keep the prefix consistent with the existing progress log so
  // a grep on "Render:" or "puppeteer" still finds everything.
  console.log(
    `  · puppeteer: restarting Chromium after ${renderCount} renders ` +
      `(PRAX_BROWSER_RESTART_EVERY=${threshold})`,
  );
  await closeBrowser();
  renderCount = 0;
  return true;
}

/** Test-only: reset the internal counter without touching the browser. */
export function _resetRenderCountForTest(): void {
  renderCount = 0;
}

/** Test-only: read the current render counter. */
export function _renderCountForTest(): number {
  return renderCount;
}

/**
 * Build the Chromium launch args for the current environment.
 *
 * We only disable the Chromium sandbox when we're running inside another
 * sandbox (CI / Docker), because Chromium cannot create its own namespace
 * sandbox in those contexts. On a developer workstation, Chromium's native
 * sandbox should stay on — malicious templates are a real (though small)
 * threat in a future where this tool renders 3rd-party templates.
 * See audit finding FIND-0003 (CVSS 4.4).
 */
function getChromiumLaunchArgs(): string[] {
  const args: string[] = ['--disable-dev-shm-usage', '--font-render-hinting=none'];
  const inSandboxedRuntime = !!(
    process.env.CI ||
    process.env.DOCKER_CONTAINER ||
    process.env.GITHUB_ACTIONS
  );
  if (inSandboxedRuntime) {
    args.unshift('--no-sandbox', '--disable-setuid-sandbox');
  }
  return args;
}

/**
 * Get or create a shared Puppeteer browser instance.
 * Reusing the browser saves ~2s per render vs launching fresh.
 * Concurrent-safe: caches the launch promise, not the resolved browser.
 */
async function getBrowser(): Promise<Browser> {
  if (browserPromise) {
    const b = await browserPromise;
    if (b.connected) return b;
    // Stale handle; reset and re-launch below.
    browserPromise = null;
    browserInstance = null;
  }

  browserPromise = puppeteer
    .launch({ headless: true, args: getChromiumLaunchArgs() })
    .then((b) => {
      browserInstance = b;
      return b;
    });
  return browserPromise;
}

/**
 * Close the shared browser instance. Call when done generating.
 *
 * Safe to call even if no browser is live — the guard below handles the
 * post-crash or first-call case. After this returns the next
 * `getBrowser()` will cold-launch a fresh instance.
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.connected) {
    await browserInstance.close();
  }
  browserInstance = null;
  browserPromise = null;
}

/**
 * Resolve the color-mode CSS for a template.
 * Search order: preset theme dir → template-sibling .{mode}.css file.
 * Returns the CSS string, or null if no variant is defined.
 * Extracted from renderHTMLToPDF + generate-4week.ts to dedupe (FIND-0015).
 */
export async function resolveColorModeCSS(
  htmlPath: string,
  colorMode: string,
): Promise<string | null> {
  const candidates = [
    path.join(path.dirname(htmlPath), '..', 'themes', `${colorMode}.css`),
    htmlPath.replace('.html', `.${colorMode}.css`),
  ];
  for (const p of candidates) {
    try {
      return await fs.readFile(p, 'utf-8');
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * Default network allow-list for Puppeteer request interception.
 * Only fonts.googleapis.com + fonts.gstatic.com + data:/file: are permitted.
 * See FIND-0004. Once FIND-0014 lands (self-hosted fonts) the fonts
 * domains can move to a deny-by-default posture.
 */
const DEFAULT_REQUEST_ALLOWLIST = /^(data:|file:|https:\/\/fonts\.(googleapis|gstatic)\.com\/)/;

// ─── W3 T3 · Render scale / 150dpi fallback ─────────────────────────
//
// Rationale: eng-review Finding 4.2 + D7 accept the risk that mobile
// Safari's 200 MB WebKit heap ceiling may OOM on 130-page PDFs at the
// current default scale. A reduced-scale codepath shrinks every page's
// raster surface proportionally, buying us a predictable heap headroom
// knob without re-authoring the CSS.
//
// Puppeteer's `scale` option maps to Chromium's printing scale factor:
//   1.0 = default (same bytes as today — byte-identical baseline)
//   0.5 = every page rendered at half linear dimension (~¼ memory)
//
// Chromium enforces 0.1 ≤ scale ≤ 2.0 per Puppeteer docs:
//   https://pptr.dev/api/puppeteer.pdfoptions#scale
// Puppeteer itself will throw an Error with 'scale must be between 0.1
// and 2' outside that range, so our resolver rejects out-of-range
// inputs and falls back to 1.0 instead of letting a user surprise
// themselves with a thrown error mid-run.
// Default behaviour is unchanged from pre-W3: no scaling applied.
const MIN_RENDER_SCALE = 0.1;
const MAX_RENDER_SCALE = 2.0;
const DEFAULT_RENDER_SCALE = 1.0;

/**
 * Resolve the render scale from (in priority order):
 *   1. explicit `PuppeteerRenderOptions.renderScale`
 *   2. `PRAX_RENDER_SCALE` env var (e.g. '0.5' for the Safari fallback path)
 *   3. 1.0 default (byte-identical to pre-W3 behaviour)
 *
 * Returned value is always within [MIN_RENDER_SCALE, MAX_RENDER_SCALE].
 * Invalid inputs fall back silently to 1.0 so a typo'd env var can't
 * brick a year-long run.
 *
 * Exported so tests and the CLI can verify the knob from outside.
 */
export function resolveRenderScale(explicit?: number): number {
  const envRaw = process.env.PRAX_RENDER_SCALE;
  const candidates: Array<number | undefined> = [
    explicit,
    envRaw !== undefined ? Number(envRaw) : undefined,
  ];
  for (const c of candidates) {
    if (c === undefined) continue;
    if (!Number.isFinite(c)) continue;
    if (c < MIN_RENDER_SCALE || c > MAX_RENDER_SCALE) continue;
    return c;
  }
  return DEFAULT_RENDER_SCALE;
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
  /**
   * PDF render scale, 0.1-2.0 (Chromium limits). Defaults to 1.0.
   * Eng-review W3 T3 fallback: set to ~0.5 (the 150dpi equivalent) when
   * the target device — specifically mobile Safari / WebKit with a
   * 200 MB heap — OOMs on full-scale renders.
   *
   * The `PRAX_RENDER_SCALE` env var is a process-wide override when this
   * option is omitted; useful for bulk scripts that don't want to thread
   * a CLI flag through every renderPageSpec call.
   */
  renderScale?: number;
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

  // Optional: inject color-mode CSS snippet via the shared resolver.
  if (colorMode && htmlPath) {
    const modeCSS = await resolveColorModeCSS(htmlPath, colorMode);
    if (modeCSS && html.includes('</head>')) {
      html = html.replace('</head>', `<style id="color-mode">\n${modeCSS}\n</style>\n</head>`);
    } else if (!modeCSS) {
      console.warn(`  ⚠ Color mode "${colorMode}" not found in themes/ or as sibling`);
    }
  }

  // NO theme injection. NO font override. Template CSS is the source of truth.

  // C7b.3: restart Chromium before we claim our next page handle if we've
  // rendered past the configured threshold since the last launch. This
  // is the ONE wiring point — everything else is internal to the helper.
  await maybeRestartBrowser();

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // SECURITY: deny any outbound request that is not in the allow-list.
    // Templates may fetch Google Fonts; nothing else. A malicious template
    // that tries to beacon to an attacker host gets aborted silently.
    // See FIND-0004 (CWE-918). The deny-by-default posture tightens once
    // FIND-0014 self-hosts fonts and the allow-list becomes "data: | file:".
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (DEFAULT_REQUEST_ALLOWLIST.test(url)) {
        void req.continue();
      } else {
        void req.abort('blockedbyclient');
      }
    });

    // Load the HTML content
    // Increase timeout for large multi-page documents (100+ pages)
    const timeout = options.multiPage ? 120000 : 30000;
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout,
    });

    // Wait for fonts to load. Cast explicitly because this runs in the
    // Chromium page realm, where `document.fonts` is a FontFaceSet.
    await page.evaluate(() => (document as Document).fonts.ready);

    // Generate PDF
    let pdfBuffer: Uint8Array;

    // W3 T3: resolve the render scale once per call (explicit option
    // wins · env fallback · 1.0 default). Chromium's `scale` option is
    // omitted entirely when scale === 1.0 so the call is byte-identical
    // to pre-W3 output on the happy path.
    const scale = resolveRenderScale(options.renderScale);
    const scaleOpt = scale === DEFAULT_RENDER_SCALE ? {} : { scale };

    if (options.multiPage) {
      // Multi-page mode: let CSS @page { size } and page-break-after
      // control page breaks. The HTML template must have @page rules.
      pdfBuffer = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        ...scaleOpt,
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
        ...scaleOpt,
      });
    }

    // C7b.3: every successful render bumps the counter. The counter is
    // only read by `maybeRestartBrowser()` at the start of the next
    // render, so failed renders don't count (which matches the intent —
    // a failed render leaves the browser no more cumulatively stressed
    // than a skipped one).
    renderCount += 1;
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
 * Result of a batch render. Callers should fail loud when `failures.length > 0`
 * (see FIND-0017). Keeps the old `results` shape for backwards compat with
 * scripts that only care about the happy path.
 */
export interface BatchRenderResult {
  results: Array<{ path: string; size: number; name: string }>;
  failures: Array<{ name: string; error: string }>;
}

/**
 * Batch render multiple HTML templates.
 * Reuses the browser instance for efficiency.
 *
 * Returns both successes and failures (FIND-0017). Callers should check
 * `failures.length` and exit non-zero when non-empty, unless they explicitly
 * opt in to best-effort via `{ bestEffort: true }`.
 */
export async function batchRenderHTML(
  templates: Array<{ htmlPath: string; outputPath: string; name: string }>,
  dimensions: PageDimensions,
  colorMode?: string,
  onProgress?: (name: string, index: number, total: number) => void,
): Promise<BatchRenderResult> {
  const results: BatchRenderResult['results'] = [];
  const failures: BatchRenderResult['failures'] = [];

  for (let i = 0; i < templates.length; i++) {
    const t = templates[i];
    if (onProgress) onProgress(t.name, i + 1, templates.length);

    try {
      const result = await renderHTMLToPDFFile(
        { htmlPath: t.htmlPath, dimensions, colorMode },
        t.outputPath,
      );
      results.push({ ...result, name: t.name });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${t.name}: ${message}`);
      failures.push({ name: t.name, error: message });
    }
  }

  return { results, failures };
}
