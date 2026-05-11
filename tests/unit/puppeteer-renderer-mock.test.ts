/**
 * tests/unit/puppeteer-renderer-mock.test.ts
 *
 * Error-path + happy-path branch coverage for `renderHTMLToPDF`,
 * `renderHTMLToPDFFile`, and `batchRenderHTML`. Closes FIND-I4-004
 * follow-up: "raise branch coverage 65 → 75 via 5-8 puppeteer-renderer
 * tests with Chromium/fs mocking" (iter-4 STATUS §Remaining debt #1).
 *
 * Strategy
 * --------
 * Mock the `puppeteer` module at import time with a hand-rolled fake
 * that mirrors only the surface the renderer uses:
 *
 *   puppeteer.launch()           → Browser
 *     browser.connected          → getter
 *     browser.newPage()          → Page
 *     browser.close()            → noop
 *   page.setRequestInterception()
 *   page.on('request', cb)
 *   page.setContent(html, opts)
 *   page.evaluate(fn)
 *   page.pdf(opts)               → Uint8Array
 *   page.close()
 *
 * The fake records which options reach `page.pdf()` and how many requests
 * were continued vs. aborted, so we can assert the request-interception
 * policy and the render-scale optimisation without a live Chromium.
 *
 * Also mocks `node:fs/promises` (readFile for htmlPath path, writeFile +
 * mkdir for renderHTMLToPDFFile + batch). That lets us exercise the
 * color-mode CSS lookup (found / not-found branches) and the "write to
 * disk" codepath without touching real fs. We only mock the functions
 * the renderer uses — anything else throws "not mocked" immediately so
 * we catch leaks.
 *
 * What this test deliberately does NOT cover
 * -------------------------------------------
 * - Real Chromium launch / sandbox / crash-recovery behavior → integration,
 *   not unit. `tests/e2e/` owns that path.
 * - Cross-process memory growth (the `PRAX_BROWSER_RESTART_EVERY` tripwire
 *   is already covered in `puppeteer-renderer-restart.test.ts`).
 *
 * Keep mocks SURGICAL — mirror the renderer's surface exactly. The moment
 * the renderer grows a new puppeteer call, add it here and let the test
 * fail to force thought.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';

// ── Fake puppeteer surface ────────────────────────────────────────────

type RequestStub = {
  url: () => string;
  continue: () => void;
  abort: (reason?: string) => void;
};

type PageStub = {
  setRequestInterception: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  setContent: ReturnType<typeof vi.fn>;
  evaluate: ReturnType<typeof vi.fn>;
  pdf: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

type BrowserStub = {
  connected: boolean;
  newPage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

type FakePuppeteerState = {
  currentBrowser: BrowserStub | null;
  launchCount: number;
  lastPdfOptions: Record<string, unknown> | null;
  lastRequestDecisions: Array<{ url: string; action: 'continue' | 'abort' }>;
  // Allow one-off overrides per test
  pdfBytesFactory: () => Uint8Array;
  pdfThrows: Error | null;
  setContentThrows: Error | null;
};

const state: FakePuppeteerState = {
  currentBrowser: null,
  launchCount: 0,
  lastPdfOptions: null,
  lastRequestDecisions: [],
  pdfBytesFactory: () => new Uint8Array([37, 80, 68, 70, 45]), // `%PDF-` magic
  pdfThrows: null,
  setContentThrows: null,
};

function makePage(): PageStub {
  const handlers = new Map<string, (req: RequestStub) => void>();
  return {
    setRequestInterception: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: string, cb: (req: RequestStub) => void) => {
      handlers.set(event, cb);
      // Immediately fire a synthetic allow-listed + deny-listed pair so the
      // interception branches both get counted. One allow (https://fonts.gstatic.com/…)
      // → continue, one block (https://evil.example/beacon) → abort.
      if (event === 'request') {
        const allow: RequestStub = {
          url: () => 'https://fonts.gstatic.com/s/Fraunces.woff2',
          continue: () => state.lastRequestDecisions.push({ url: 'https://fonts.gstatic.com/s/Fraunces.woff2', action: 'continue' }),
          abort: () => {
            throw new Error('should not abort allow-listed URL');
          },
        };
        const deny: RequestStub = {
          url: () => 'https://evil.example.com/beacon',
          continue: () => {
            throw new Error('should not continue non-allow-listed URL');
          },
          abort: () => state.lastRequestDecisions.push({ url: 'https://evil.example.com/beacon', action: 'abort' }),
        };
        cb(allow);
        cb(deny);
      }
    }),
    setContent: vi.fn(async (_html: string, _opts?: unknown) => {
      if (state.setContentThrows) throw state.setContentThrows;
    }),
    evaluate: vi.fn().mockResolvedValue(undefined),
    pdf: vi.fn(async (opts: Record<string, unknown>) => {
      state.lastPdfOptions = { ...opts };
      if (state.pdfThrows) throw state.pdfThrows;
      return state.pdfBytesFactory();
    }),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

function makeBrowser(): BrowserStub {
  return {
    connected: true,
    newPage: vi.fn(async () => makePage()),
    close: vi.fn(async function (this: BrowserStub) {
      this.connected = false;
    }),
  };
}

// vi.mock must be declared at top level; it's hoisted above imports.
vi.mock('puppeteer', () => {
  return {
    default: {
      launch: vi.fn(async () => {
        state.launchCount += 1;
        state.currentBrowser = makeBrowser();
        return state.currentBrowser;
      }),
    },
  };
});

// NOTE: we deliberately DO NOT mock `node:fs/promises`. The renderer uses
// readFile for htmlPath + resolveColorModeCSS, and writeFile+mkdir for
// renderHTMLToPDFFile. Mocking fs globally collides with the fixture
// setup (tests need to write real .html / .css files before calling
// the renderer). Instead we write everything to a per-test tempdir and
// let the renderer read real files through the real fs — the mock only
// needs to cover `puppeteer`, which is the expensive/platform-bound bit.

// Real fs for test fixtures — import un-mocked. We import via
// `vi.importActual` to guarantee this reference isn't a mock even if a
// future edit adds `vi.mock('node:fs/promises', …)`.
const fsReal = (await vi.importActual('node:fs/promises')) as typeof import('node:fs/promises');

// Import the renderer AFTER mocks are declared so it picks them up.
const renderer = await import('../../packages/core/src/puppeteer-renderer.js');
const {
  renderHTMLToPDF,
  renderHTMLToPDFFile,
  batchRenderHTML,
  closeBrowser,
  _resetRenderCountForTest,
  _renderCountForTest,
} = renderer;

// ── Test data ─────────────────────────────────────────────────────────

// Per-test-suite tempdir in the OS temp area (NOT in the repo). Each
// vitest worker gets its own, and nothing lands in git.
let FIXTURES = '';

async function ensureFixturesDir(): Promise<void> {
  if (FIXTURES) return;
  FIXTURES = await fsReal.mkdtemp(path.join(os.tmpdir(), 'pretext-renderer-test-'));
}

async function writeFixture(name: string, contents: string): Promise<string> {
  await ensureFixturesDir();
  const p = path.join(FIXTURES, name);
  await fsReal.writeFile(p, contents, 'utf-8');
  return p;
}

async function writeTheme(htmlPath: string, mode: string, css: string): Promise<void> {
  // Renderer looks in two places; use the sibling-file convention
  // (`<name>.<mode>.css`) since it's simpler to set up in a tmp dir.
  const sibling = htmlPath.replace('.html', `.${mode}.css`);
  await fsReal.writeFile(sibling, css, 'utf-8');
}

const A4 = { width: 595, height: 842 } as const;

// ── Tests ─────────────────────────────────────────────────────────────

describe('renderHTMLToPDF · mocked Chromium · branch coverage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    state.currentBrowser = null;
    state.launchCount = 0;
    state.lastPdfOptions = null;
    state.lastRequestDecisions = [];
    state.pdfBytesFactory = () => new Uint8Array([37, 80, 68, 70, 45]);
    state.pdfThrows = null;
    state.setContentThrows = null;
    _resetRenderCountForTest();
    await closeBrowser();
    await ensureFixturesDir();
  });

  afterEach(async () => {
    await closeBrowser();
  });

  it('renders from inline htmlContent without reading the file', async () => {
    // htmlPath is required by the interface (for color-mode discovery) but
    // when htmlContent is present, the file is NOT read.
    const dummy = path.join(FIXTURES, 'nonexistent.html');
    const buf = await renderHTMLToPDF({
      htmlPath: dummy,
      htmlContent: '<!DOCTYPE html><head></head><body>inline</body>',
      dimensions: A4,
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
    expect(state.launchCount).toBe(1);
  });

  it('renders from disk when only htmlPath is given', async () => {
    const p = await writeFixture('from-disk.html', '<!DOCTYPE html><head></head><body>disk</body>');
    const buf = await renderHTMLToPDF({
      htmlPath: p,
      dimensions: A4,
    });
    expect(buf.length).toBeGreaterThan(0);
  });

  it('injects color-mode CSS when a sibling theme file exists', async () => {
    const p = await writeFixture(
      'with-theme.html',
      '<!DOCTYPE html><head></head><body>themed</body>',
    );
    await writeTheme(p, 'dark', ':root { --paper: #000; }');

    // Capture setContent to verify the injection happened.
    let capturedHtml = '';
    state.pdfBytesFactory = () => new Uint8Array([1, 2, 3]);
    const origLaunch = renderer; // keep type-safe handle
    void origLaunch;
    // Patch the fake page's setContent after the fact by monkey-patching
    // newPage to record the html arg.
    const puppeteer = (await import('puppeteer')) as unknown as {
      default: { launch: ReturnType<typeof vi.fn> };
    };
    puppeteer.default.launch.mockImplementationOnce(async () => {
      state.launchCount += 1;
      const br = makeBrowser();
      br.newPage = vi.fn(async () => {
        const page = makePage();
        page.setContent = vi.fn(async (html: string) => {
          capturedHtml = html;
        });
        return page;
      });
      state.currentBrowser = br;
      return br;
    });

    await renderHTMLToPDF({
      htmlPath: p,
      dimensions: A4,
      colorMode: 'dark',
    });

    expect(capturedHtml).toContain('<style id="color-mode">');
    expect(capturedHtml).toContain(':root { --paper: #000; }');
  });

  it('warns but proceeds when a color mode is requested without a theme file', async () => {
    const p = await writeFixture(
      'no-theme.html',
      '<!DOCTYPE html><head></head><body>no theme</body>',
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await renderHTMLToPDF({
      htmlPath: p,
      dimensions: A4,
      colorMode: 'nonexistent-mode',
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Color mode "nonexistent-mode" not found'));
    warnSpy.mockRestore();
  });

  it('honors the request allow-list (continue vs abort)', async () => {
    await renderHTMLToPDF({
      htmlPath: 'irrelevant.html',
      htmlContent: '<!DOCTYPE html><head></head><body>x</body>',
      dimensions: A4,
    });
    // Our fake fires one allow + one deny request per render.
    expect(state.lastRequestDecisions).toEqual([
      { url: 'https://fonts.gstatic.com/s/Fraunces.woff2', action: 'continue' },
      { url: 'https://evil.example.com/beacon', action: 'abort' },
    ]);
  });

  it('omits `scale` in page.pdf options when render-scale == 1.0 (byte-identical happy path)', async () => {
    await renderHTMLToPDF({
      htmlPath: 'x.html',
      htmlContent: '<!DOCTYPE html><head></head><body></body>',
      dimensions: A4,
    });
    expect(state.lastPdfOptions).toBeDefined();
    expect(state.lastPdfOptions!).not.toHaveProperty('scale');
  });

  it('passes `scale` to page.pdf when render-scale != 1.0', async () => {
    await renderHTMLToPDF({
      htmlPath: 'x.html',
      htmlContent: '<!DOCTYPE html><head></head><body></body>',
      dimensions: A4,
      renderScale: 0.5,
    });
    expect(state.lastPdfOptions!.scale).toBe(0.5);
  });

  it('uses preferCSSPageSize in multiPage mode (no explicit width/height)', async () => {
    await renderHTMLToPDF({
      htmlPath: 'x.html',
      htmlContent: '<!DOCTYPE html><head></head><body></body>',
      dimensions: A4,
      multiPage: true,
    });
    expect(state.lastPdfOptions!.preferCSSPageSize).toBe(true);
    expect(state.lastPdfOptions).not.toHaveProperty('width');
    expect(state.lastPdfOptions).not.toHaveProperty('height');
  });

  it('uses explicit dimensions (inches) in single-page mode', async () => {
    await renderHTMLToPDF({
      htmlPath: 'x.html',
      htmlContent: '<!DOCTYPE html><head></head><body></body>',
      dimensions: A4,
    });
    // A4 595pt / 72 = 8.263… in
    expect(state.lastPdfOptions!.width).toMatch(/^[0-9.]+in$/);
    expect(state.lastPdfOptions!.height).toMatch(/^[0-9.]+in$/);
  });

  it('bumps the render counter on success', async () => {
    expect(_renderCountForTest()).toBe(0);
    await renderHTMLToPDF({
      htmlPath: 'x.html',
      htmlContent: '<!DOCTYPE html><head></head><body></body>',
      dimensions: A4,
    });
    expect(_renderCountForTest()).toBe(1);
  });

  it('does NOT bump the counter when page.pdf throws (failed renders leave counter alone)', async () => {
    state.pdfThrows = new Error('simulated pdf failure');
    _resetRenderCountForTest();
    await expect(
      renderHTMLToPDF({
        htmlPath: 'x.html',
        htmlContent: '<!DOCTYPE html><head></head><body></body>',
        dimensions: A4,
      }),
    ).rejects.toThrow('simulated pdf failure');
    expect(_renderCountForTest()).toBe(0);
  });

  it('closes the page even when rendering throws', async () => {
    state.setContentThrows = new Error('simulated setContent failure');
    let closeCalled = false;
    const puppeteer = (await import('puppeteer')) as unknown as {
      default: { launch: ReturnType<typeof vi.fn> };
    };
    puppeteer.default.launch.mockImplementationOnce(async () => {
      state.launchCount += 1;
      const br = makeBrowser();
      br.newPage = vi.fn(async () => {
        const page = makePage();
        page.close = vi.fn(async () => {
          closeCalled = true;
        });
        return page;
      });
      state.currentBrowser = br;
      return br;
    });
    await expect(
      renderHTMLToPDF({
        htmlPath: 'x.html',
        htmlContent: '<!DOCTYPE html><head></head><body></body>',
        dimensions: A4,
      }),
    ).rejects.toThrow('simulated setContent failure');
    expect(closeCalled).toBe(true);
  });
});

describe('renderHTMLToPDFFile · write + page-count heuristic', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    state.currentBrowser = null;
    state.launchCount = 0;
    state.pdfBytesFactory = () => new Uint8Array(120_000); // ~2 pages
    state.pdfThrows = null;
    state.setContentThrows = null;
    _resetRenderCountForTest();
    await closeBrowser();
    await ensureFixturesDir();
  });

  afterEach(async () => {
    await closeBrowser();
  });

  it('writes the buffer to disk and reports size + estimated pages', async () => {
    const out = path.join(FIXTURES, 'out.pdf');
    const result = await renderHTMLToPDFFile(
      {
        htmlPath: 'x.html',
        htmlContent: '<!DOCTYPE html><head></head><body>x</body>',
        dimensions: A4,
      },
      out,
    );
    expect(result.path).toBe(out);
    expect(result.size).toBe(120_000);
    // 120_000 / 50_000 ≈ 2.4 → rounds to 2
    expect(result.pages).toBe(2);
  });

  it('reports at least 1 page even for tiny outputs (the Math.max(1, …) guard)', async () => {
    state.pdfBytesFactory = () => new Uint8Array(100); // much less than 50k
    const out = path.join(FIXTURES, 'tiny.pdf');
    const result = await renderHTMLToPDFFile(
      {
        htmlPath: 'x.html',
        htmlContent: '<!DOCTYPE html><head></head><body></body>',
        dimensions: A4,
      },
      out,
    );
    expect(result.pages).toBe(1);
  });
});

describe('batchRenderHTML · success + failure partition + onProgress', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    state.currentBrowser = null;
    state.launchCount = 0;
    state.pdfBytesFactory = () => new Uint8Array(50_000);
    state.pdfThrows = null;
    state.setContentThrows = null;
    _resetRenderCountForTest();
    await closeBrowser();
    await ensureFixturesDir();
  });

  afterEach(async () => {
    await closeBrowser();
  });

  it('partitions successes and failures, never aborts early', async () => {
    // Test intent: run 3 renders in a batch; arrange for the 2nd to fail.
    // Result must show {results: 2 (a, c), failures: 1 (b)}.
    //
    // Complication: `getBrowser()` CACHES the launch promise, so
    // puppeteer.launch fires exactly ONCE across the whole batch. Every
    // subsequent render reuses the same browser and each calls `newPage()`
    // on it. So the renderIdx counter must live on the *newPage* callback
    // attached to the single browser — and we install that by overriding
    // launch BEFORE batchRenderHTML so the first (and only) launch
    // returns a browser whose newPage increments our counter.
    let renderIdx = 0;
    const puppeteer = (await import('puppeteer')) as unknown as {
      default: { launch: ReturnType<typeof vi.fn> };
    };
    puppeteer.default.launch.mockImplementation(async () => {
      state.launchCount += 1;
      const br = makeBrowser();
      br.newPage = vi.fn(async () => {
        const myIdx = renderIdx;
        renderIdx += 1;
        const page = makePage();
        page.pdf = vi.fn(async (opts: Record<string, unknown>) => {
          state.lastPdfOptions = { ...opts };
          if (myIdx === 1) throw new Error('simulated mid-batch failure');
          return state.pdfBytesFactory();
        });
        return page;
      });
      state.currentBrowser = br;
      return br;
    });

    // Mute console.error so the expected batch failure doesn't pollute the
    // test log.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Real fixture files on disk — batchRenderHTML → renderHTMLToPDFFile
    // → renderHTMLToPDF calls readFile(htmlPath) when no htmlContent is
    // supplied (and this code path doesn't support passing htmlContent
    // through batchRenderHTML). So we materialise them.
    const aPath = await writeFixture('batch-a.html', '<!DOCTYPE html><head></head><body>a</body>');
    const bPath = await writeFixture('batch-b.html', '<!DOCTYPE html><head></head><body>b</body>');
    const cPath = await writeFixture('batch-c.html', '<!DOCTYPE html><head></head><body>c</body>');

    const out = await batchRenderHTML(
      [
        { htmlPath: aPath, outputPath: path.join(FIXTURES, 'a.pdf'), name: 'a' },
        { htmlPath: bPath, outputPath: path.join(FIXTURES, 'b.pdf'), name: 'b' },
        { htmlPath: cPath, outputPath: path.join(FIXTURES, 'c.pdf'), name: 'c' },
      ],
      A4,
    );

    // Sanity: all three renders actually attempted (newPage was called 3x).
    expect(renderIdx).toBe(3);

    expect(out.results).toHaveLength(2);
    expect(out.failures).toHaveLength(1);
    expect(out.results.map((r) => r.name).sort()).toEqual(['a', 'c']);
    expect(out.failures[0].name).toBe('b');
    expect(out.failures[0].error).toMatch(/simulated mid-batch failure/);
    errSpy.mockRestore();
  });

  it('invokes the onProgress callback per template with (name, 1-indexed, total)', async () => {
    // Materialise real fixture files — the batch reads them off disk.
    const aPath = await writeFixture(
      'batch-prog-a.html',
      '<!DOCTYPE html><head></head><body>alpha</body>',
    );
    const bPath = await writeFixture(
      'batch-prog-b.html',
      '<!DOCTYPE html><head></head><body>beta</body>',
    );
    const progress = vi.fn();
    await batchRenderHTML(
      [
        { htmlPath: aPath, outputPath: path.join(FIXTURES, 'a.pdf'), name: 'alpha' },
        { htmlPath: bPath, outputPath: path.join(FIXTURES, 'b.pdf'), name: 'beta' },
      ],
      A4,
      undefined,
      progress,
    );
    expect(progress).toHaveBeenCalledTimes(2);
    expect(progress).toHaveBeenNthCalledWith(1, 'alpha', 1, 2);
    expect(progress).toHaveBeenNthCalledWith(2, 'beta', 2, 2);
  });

  it('returns empty arrays when called with zero templates (the established contract)', async () => {
    const out = await batchRenderHTML([], A4);
    expect(out.results).toEqual([]);
    expect(out.failures).toEqual([]);
  });
});
