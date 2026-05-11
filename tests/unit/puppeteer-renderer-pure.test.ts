/**
 * Pure-function branch coverage for puppeteer-renderer.ts.
 *
 * These tests target the exported pure helpers that don't require
 * launching Chromium: `resolveRenderScale`, `resolveColorModeCSS`,
 * and `batchRenderHTML` with an empty input.
 *
 * Why here vs `puppeteer-renderer-restart.test.ts`:
 *   - restart.test.ts is scoped to `maybeRestartBrowser` threshold logic.
 *   - This file rounds out the per-file branch coverage that TICKET-I4-004
 *     restored as a CI gate.
 *
 * What we don't test here:
 *   - `renderHTMLToPDF` / `renderHTMLToPDFFile` — require a live Chromium,
 *     covered by `tests/e2e/*` and visual regression.
 *   - `getChromiumLaunchArgs` — not exported.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

import {
  resolveRenderScale,
  resolveColorModeCSS,
  batchRenderHTML,
} from '../../packages/core/src/puppeteer-renderer.js';

// ─── resolveRenderScale ─────────────────────────────────────────────

describe('resolveRenderScale — W3 T3 scale resolver', () => {
  const ORIGINAL = process.env.PRAX_RENDER_SCALE;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.PRAX_RENDER_SCALE;
    } else {
      process.env.PRAX_RENDER_SCALE = ORIGINAL;
    }
  });

  it('returns 1.0 when nothing is specified (byte-identical default)', () => {
    delete process.env.PRAX_RENDER_SCALE;
    expect(resolveRenderScale()).toBe(1.0);
  });

  it('accepts an explicit valid scale', () => {
    expect(resolveRenderScale(0.5)).toBe(0.5);
    expect(resolveRenderScale(1.5)).toBe(1.5);
  });

  it('accepts the min boundary (0.1) and max boundary (2.0)', () => {
    expect(resolveRenderScale(0.1)).toBe(0.1);
    expect(resolveRenderScale(2.0)).toBe(2.0);
  });

  it('falls back to 1.0 on explicit below-min', () => {
    expect(resolveRenderScale(0.05)).toBe(1.0);
  });

  it('falls back to 1.0 on explicit above-max', () => {
    expect(resolveRenderScale(2.5)).toBe(1.0);
  });

  it('falls back to 1.0 on explicit NaN / Infinity', () => {
    expect(resolveRenderScale(Number.NaN)).toBe(1.0);
    expect(resolveRenderScale(Number.POSITIVE_INFINITY)).toBe(1.0);
  });

  it('reads PRAX_RENDER_SCALE when no explicit value is given', () => {
    process.env.PRAX_RENDER_SCALE = '0.5';
    expect(resolveRenderScale()).toBe(0.5);
  });

  it('env-var fallback ignores typo values and returns 1.0', () => {
    process.env.PRAX_RENDER_SCALE = 'not-a-number';
    expect(resolveRenderScale()).toBe(1.0);
  });

  it('env-var below min falls back to 1.0 (does not brick a year-long run)', () => {
    process.env.PRAX_RENDER_SCALE = '0.01';
    expect(resolveRenderScale()).toBe(1.0);
  });

  it('explicit wins over env-var', () => {
    process.env.PRAX_RENDER_SCALE = '0.5';
    expect(resolveRenderScale(1.5)).toBe(1.5);
  });
});

// ─── resolveColorModeCSS ────────────────────────────────────────────

describe('resolveColorModeCSS — FIND-0015 shared resolver', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prax-color-mode-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns null when no variant exists (404 fallthrough)', async () => {
    const htmlPath = path.join(tmpDir, 'template.html');
    await fs.writeFile(htmlPath, '<html></html>');
    const result = await resolveColorModeCSS(htmlPath, 'dark');
    expect(result).toBeNull();
  });

  it('reads sibling {mode}.css when themes/ dir is absent', async () => {
    const htmlPath = path.join(tmpDir, 'template.html');
    await fs.writeFile(htmlPath, '<html></html>');
    const siblingCss = path.join(tmpDir, 'template.dark.css');
    await fs.writeFile(siblingCss, 'body { background: black; }');

    const result = await resolveColorModeCSS(htmlPath, 'dark');
    expect(result).toContain('background: black');
  });

  it('preset theme (../themes/{mode}.css) takes precedence over sibling', async () => {
    // Put template in tmpDir/packs/foo, theme in tmpDir/themes/dark.css
    const packDir = path.join(tmpDir, 'packs', 'foo');
    await fs.mkdir(packDir, { recursive: true });
    const htmlPath = path.join(packDir, 'template.html');
    await fs.writeFile(htmlPath, '<html></html>');

    const themeDir = path.join(tmpDir, 'packs', 'themes');
    await fs.mkdir(themeDir, { recursive: true });
    await fs.writeFile(path.join(themeDir, 'dark.css'), '/* from themes */');

    // Also write a sibling to prove precedence
    await fs.writeFile(path.join(packDir, 'template.dark.css'), '/* from sibling */');

    const result = await resolveColorModeCSS(htmlPath, 'dark');
    expect(result).toContain('from themes');
  });
});

// ─── batchRenderHTML ────────────────────────────────────────────────

describe('batchRenderHTML — empty + failure-reporting contract', () => {
  it('returns empty results + empty failures for zero templates (no browser launch)', async () => {
    const { results, failures } = await batchRenderHTML(
      [],
      { width: 612, height: 792 },
    );
    expect(results).toEqual([]);
    expect(failures).toEqual([]);
  });
});
