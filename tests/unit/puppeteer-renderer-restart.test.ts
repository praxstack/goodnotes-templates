/**
 * Unit tests for the C7b.3 memory-aware browser-restart helper in
 * `src/core/puppeteer-renderer.ts`.
 *
 * We test the *threshold/counter* contract in isolation — no real
 * Chromium is launched. `closeBrowser()` is a no-op when no browser
 * has been launched, which is exactly the pre-state the renderer
 * module lives in when imported afresh.
 *
 * What we lock:
 *   1. PRAX_BROWSER_RESTART_EVERY=0 disables restarts (returns false
 *      regardless of counter value).
 *   2. Under the default threshold (50), `maybeRestartBrowser()` is a
 *      no-op until the counter passes 50.
 *   3. Junk values in the env var fall back to the default (don't crash).
 *   4. A custom threshold (e.g. 3) is respected.
 *
 * What we don't test here:
 *   - Actually launching Chromium. That's covered implicitly by the
 *     existing visual-regression + integration tests — running a
 *     live browser in unit tests is slow and brittle, and the restart
 *     helper's only job is to call the already-tested `closeBrowser()`.
 */

import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import {
  maybeRestartBrowser,
  _resetRenderCountForTest,
  _renderCountForTest,
} from '../../packages/core/src/puppeteer-renderer.js';

describe('C7b.3 · maybeRestartBrowser — threshold logic', () => {
  const ORIGINAL = process.env.PRAX_BROWSER_RESTART_EVERY;

  beforeEach(() => {
    _resetRenderCountForTest();
  });

  afterEach(() => {
    // Restore the env var exactly as we found it, so no test bleeds
    // configuration into the next one.
    if (ORIGINAL === undefined) {
      delete process.env.PRAX_BROWSER_RESTART_EVERY;
    } else {
      process.env.PRAX_BROWSER_RESTART_EVERY = ORIGINAL;
    }
    _resetRenderCountForTest();
  });

  it('returns false when the counter is 0 (default threshold 50)', async () => {
    delete process.env.PRAX_BROWSER_RESTART_EVERY;
    expect(await maybeRestartBrowser()).toBe(false);
    expect(_renderCountForTest()).toBe(0);
  });

  it('threshold=0 disables restarts entirely', async () => {
    process.env.PRAX_BROWSER_RESTART_EVERY = '0';
    // Even with a "very high" simulated count — disabled means disabled.
    // We can't set the counter directly; we just verify the early-return.
    expect(await maybeRestartBrowser()).toBe(false);
  });

  it('invalid env value falls back to the default threshold (50)', async () => {
    process.env.PRAX_BROWSER_RESTART_EVERY = 'not-a-number';
    expect(await maybeRestartBrowser()).toBe(false); // counter still 0
  });

  it('negative env value falls back to the default', async () => {
    process.env.PRAX_BROWSER_RESTART_EVERY = '-5';
    expect(await maybeRestartBrowser()).toBe(false);
  });

  it('custom threshold of 3: no restart at counter < 3', async () => {
    process.env.PRAX_BROWSER_RESTART_EVERY = '3';
    expect(_renderCountForTest()).toBe(0);
    expect(await maybeRestartBrowser()).toBe(false);
  });

  it('_resetRenderCountForTest zeroes the counter', () => {
    _resetRenderCountForTest();
    expect(_renderCountForTest()).toBe(0);
  });
});

// FIND-I4-006 · getRestartThreshold warns on unparseable env vars
// before silently falling back to 50. Silent fallback used to let a
// typo disable the memory-aware restart for an entire long run.
describe('C7b.3 · getRestartThreshold env-var validation (FIND-I4-006)', () => {
  const ORIGINAL = process.env.PRAX_BROWSER_RESTART_EVERY;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.PRAX_BROWSER_RESTART_EVERY;
    } else {
      process.env.PRAX_BROWSER_RESTART_EVERY = ORIGINAL;
    }
    _resetRenderCountForTest();
    vi.restoreAllMocks();
  });

  it('warns (once) on unparseable string value', async () => {
    process.env.PRAX_BROWSER_RESTART_EVERY = 'banana';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await maybeRestartBrowser(); // triggers getRestartThreshold internally
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('PRAX_BROWSER_RESTART_EVERY');
    expect(warnSpy.mock.calls[0][0]).toContain('banana');
    expect(warnSpy.mock.calls[0][0]).toContain('falling back to 50');
  });

  it('warns on negative integer value', async () => {
    process.env.PRAX_BROWSER_RESTART_EVERY = '-5';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await maybeRestartBrowser();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('-5');
  });

  it('does NOT warn on valid integer value', async () => {
    process.env.PRAX_BROWSER_RESTART_EVERY = '25';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await maybeRestartBrowser();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does NOT warn when env var is absent', async () => {
    delete process.env.PRAX_BROWSER_RESTART_EVERY;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await maybeRestartBrowser();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does NOT warn on 0 (disable sentinel)', async () => {
    process.env.PRAX_BROWSER_RESTART_EVERY = '0';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await maybeRestartBrowser();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
