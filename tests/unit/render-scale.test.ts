/**
 * tests/unit/render-scale.test.ts
 *
 * Covers `resolveRenderScale()` in `packages/core/src/puppeteer-renderer.ts`
 * — the W3 T3 safety valve per eng-review Finding 4.2 + D7.
 *
 * The resolver is the ONLY thing puppeteer-renderer exposes that we can
 * unit-test without spawning Chromium (the actual scale → Chromium wiring
 * is exercised by the visual snapshot suite in `tests/visual/`).
 *
 * Contract:
 *   1. Explicit option beats env.
 *   2. Env beats default.
 *   3. Default is 1.0 (byte-identical to pre-W3).
 *   4. Invalid inputs (NaN, ±Infinity, out-of-range, garbage) fall back
 *      silently to 1.0 — a typo'd env var must NEVER brick a render run.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveRenderScale } from '../../packages/core/src/puppeteer-renderer.js';

// The resolver reads process.env.PRAX_RENDER_SCALE, so we snapshot +
// restore around every test to avoid order-dependency.
let originalEnv: string | undefined;

beforeEach(() => {
  originalEnv = process.env.PRAX_RENDER_SCALE;
  delete process.env.PRAX_RENDER_SCALE;
});

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.PRAX_RENDER_SCALE;
  } else {
    process.env.PRAX_RENDER_SCALE = originalEnv;
  }
});

describe('resolveRenderScale() — defaults', () => {
  it('returns 1.0 when nothing is set (byte-identical to pre-W3)', () => {
    expect(resolveRenderScale()).toBe(1.0);
  });

  it('returns 1.0 when env is empty string', () => {
    process.env.PRAX_RENDER_SCALE = '';
    expect(resolveRenderScale()).toBe(1.0);
  });
});

describe('resolveRenderScale() — explicit option wins', () => {
  it('explicit 0.5 beats env 1.5', () => {
    process.env.PRAX_RENDER_SCALE = '1.5';
    expect(resolveRenderScale(0.5)).toBe(0.5);
  });

  it('explicit 1.0 is accepted even though it equals default', () => {
    expect(resolveRenderScale(1.0)).toBe(1.0);
  });

  it('explicit at the min boundary (0.1) is accepted', () => {
    expect(resolveRenderScale(0.1)).toBe(0.1);
  });

  it('explicit at the max boundary (2.0) is accepted', () => {
    expect(resolveRenderScale(2.0)).toBe(2.0);
  });
});

describe('resolveRenderScale() — env fallback', () => {
  it('PRAX_RENDER_SCALE=0.5 picked up with no explicit option', () => {
    process.env.PRAX_RENDER_SCALE = '0.5';
    expect(resolveRenderScale()).toBe(0.5);
  });

  it('handles scientific notation', () => {
    process.env.PRAX_RENDER_SCALE = '5e-1';
    expect(resolveRenderScale()).toBe(0.5);
  });

  it('falls back to 1.0 on garbage env', () => {
    process.env.PRAX_RENDER_SCALE = 'half';
    expect(resolveRenderScale()).toBe(1.0);
  });
});

describe('resolveRenderScale() — invalid inputs fall back silently', () => {
  it('NaN explicit → 1.0', () => {
    expect(resolveRenderScale(Number.NaN)).toBe(1.0);
  });

  it('+Infinity explicit → 1.0', () => {
    expect(resolveRenderScale(Number.POSITIVE_INFINITY)).toBe(1.0);
  });

  it('-Infinity explicit → 1.0', () => {
    expect(resolveRenderScale(Number.NEGATIVE_INFINITY)).toBe(1.0);
  });

  it('below min (0.05) → 1.0', () => {
    expect(resolveRenderScale(0.05)).toBe(1.0);
  });

  it('above max (2.01) → 1.0', () => {
    expect(resolveRenderScale(2.01)).toBe(1.0);
  });

  it('negative → 1.0', () => {
    expect(resolveRenderScale(-0.5)).toBe(1.0);
  });

  it('env=NaN string → 1.0', () => {
    process.env.PRAX_RENDER_SCALE = 'NaN';
    expect(resolveRenderScale()).toBe(1.0);
  });

  it('env out-of-range → 1.0 (typo-proof)', () => {
    process.env.PRAX_RENDER_SCALE = '50'; // user thought "50%" but wrote bare 50
    expect(resolveRenderScale()).toBe(1.0);
  });
});
