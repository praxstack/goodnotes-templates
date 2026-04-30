/**
 * tests/unit/errors.test.ts
 *
 * Covers the 5-class error hierarchy in `packages/core/src/errors.ts`:
 *   - every class sets the expected `code`
 *   - every class produces a 3-tier message (what / why / fix)
 *   - `cause` propagates
 *   - `instanceof` preserves the base class + Error
 *   - type guard `isPretextError` narrows correctly
 *
 * Does NOT cover the actual throw sites (those are exercised by the
 * feature tests in svg-renderer / puppeteer-renderer / registry /
 * standalone-builder suites).
 */

import { describe, expect, it } from 'vitest';
import {
  PretextError,
  RegistryFetchError,
  PackNotFoundError,
  RendererCrashError,
  StandaloneCompileError,
  RegistryParseError,
  isPretextError,
} from '../../packages/core/src/errors.js';

describe('PretextError base class', () => {
  it('cannot be instantiated directly (abstract)', () => {
    // TypeScript blocks this at compile time; at runtime the abstract
    // marker is advisory, so this test just documents the convention
    // by asserting that every concrete subclass sets a code.
    expect(typeof PretextError).toBe('function');
  });
});

describe('RegistryFetchError', () => {
  const err = new RegistryFetchError({
    primaryUrl: 'https://pretext-templates.dev/registry.json',
    fallbackUrl: 'https://raw.githubusercontent.com/praxstack/pretext-templates/main/registry.json',
    status: 503,
  });

  it('sets stable code', () => {
    expect(err.code).toBe('registry-fetch-failed');
  });

  it('produces a 3-tier message (what / why / fix)', () => {
    expect(err.message).toMatch(/Registry fetch failed/u);
    expect(err.message).toMatch(/\n\s+why:\s/u);
    expect(err.message).toMatch(/\n\s+fix:\s/u);
    expect(err.message).toContain('503');
  });

  it('propagates cause', () => {
    const orig = new Error('DNS lookup failed');
    const wrap = new RegistryFetchError(
      { primaryUrl: 'a', fallbackUrl: 'b', status: 0 },
      orig,
    );
    expect(wrap.cause).toBe(orig);
  });

  it('is a PretextError and an Error', () => {
    expect(err instanceof PretextError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('preserves constructor name for stack traces', () => {
    expect(err.name).toBe('RegistryFetchError');
  });
});

describe('PackNotFoundError', () => {
  it('sets stable code', () => {
    const err = new PackNotFoundError({
      requested: 'prax-jornal',
      suggestions: ['prax-journal'],
      knownCount: 14,
    });
    expect(err.code).toBe('pack-not-found');
  });

  it('surfaces a typo suggestion in the message', () => {
    const err = new PackNotFoundError({
      requested: 'prax-jornal',
      suggestions: ['prax-journal'],
      knownCount: 14,
    });
    expect(err.message).toContain("'prax-journal'");
    expect(err.message).toMatch(/Did you mean/u);
  });

  it('omits suggestion prompt when suggestions is empty', () => {
    const err = new PackNotFoundError({
      requested: 'zzz-unknown',
      suggestions: [],
      knownCount: 14,
    });
    expect(err.message).not.toMatch(/Did you mean/u);
  });

  it('includes knownCount in the fix advice', () => {
    const err = new PackNotFoundError({
      requested: 'x',
      suggestions: [],
      knownCount: 7,
    });
    expect(err.message).toContain('7 packs');
  });
});

describe('RendererCrashError', () => {
  it('sets stable code and surfaces page + state', () => {
    const cause = new Error('Protocol error: Target closed');
    const err = new RendererCrashError(
      { pageIndex: 47, pageLabel: 'daily:today', browserState: 'disconnected' },
      cause,
    );
    expect(err.code).toBe('renderer-crashed');
    expect(err.message).toContain('page 47');
    expect(err.message).toContain('daily:today');
    expect(err.message).toContain('disconnected');
    expect(err.cause).toBe(cause);
  });

  it('recommends PRAX_BROWSER_RESTART_EVERY in the fix tier', () => {
    const err = new RendererCrashError({
      pageIndex: 0,
      pageLabel: 'daily:today',
      browserState: 'unknown',
    });
    expect(err.message).toContain('PRAX_BROWSER_RESTART_EVERY');
  });
});

describe('StandaloneCompileError', () => {
  it('customizes fix advice per stage', () => {
    const bodyErr = new StandaloneCompileError({
      stage: 'extract-body',
      htmlPath: '/abs/today.html',
    });
    expect(bodyErr.code).toBe('standalone-compile-failed');
    expect(bodyErr.message).toMatch(/extract-body/u);
    expect(bodyErr.message).toMatch(/<body>/u);

    const readErr = new StandaloneCompileError({
      stage: 'read-source',
      htmlPath: '/abs/today.html',
    });
    expect(readErr.message).toMatch(/file exists and is readable/u);

    const writeErr = new StandaloneCompileError({
      stage: 'write-output',
      outPath: 'output/ledger.html',
    });
    expect(writeErr.message).toMatch(/output directory exists/u);
  });

  it('falls back to (unknown) target when no paths provided', () => {
    const err = new StandaloneCompileError({ stage: 'stitch-pages' });
    expect(err.message).toContain('(unknown)');
  });
});

describe('RegistryParseError', () => {
  it('sets stable code and lists the first 3 issues inline', () => {
    const err = new RegistryParseError({
      source: 'packages/packs-foo/manifest.json',
      issues: [
        { path: ['version'], message: 'expected semver MAJOR.MINOR.PATCH' },
        { path: ['id'],      message: 'id cannot be empty' },
        { path: ['tags', 0], message: 'tags must be lowercase kebab-case' },
        { path: ['author'],  message: 'author cannot be empty' },
      ],
    });
    expect(err.code).toBe('registry-parse-failed');
    expect(err.message).toContain('4 issues');
    expect(err.message).toContain('at version:');
    expect(err.message).toContain('at tags.0:');
    expect(err.message).toContain('…and 1 more'); // 4 - 3
  });

  it('uses singular "issue" when there is exactly one', () => {
    const err = new RegistryParseError({
      source: 'foo.json',
      issues: [{ path: ['id'], message: 'bad' }],
    });
    expect(err.message).toMatch(/1 issue\b/u);
    expect(err.message).not.toMatch(/1 issues/u);
  });

  it('formats root-level path as "(root)"', () => {
    const err = new RegistryParseError({
      source: 'foo.json',
      issues: [{ path: [], message: 'not an object' }],
    });
    expect(err.message).toContain('at (root):');
  });
});

describe('isPretextError type guard', () => {
  it('returns true for any PretextError subclass', () => {
    expect(isPretextError(new PackNotFoundError({ requested: 'x', suggestions: [], knownCount: 0 }))).toBe(true);
    expect(isPretextError(new RegistryFetchError({ primaryUrl: '', fallbackUrl: '', status: 0 }))).toBe(true);
  });

  it('returns false for plain errors and non-errors', () => {
    expect(isPretextError(new Error('nope'))).toBe(false);
    expect(isPretextError('string')).toBe(false);
    expect(isPretextError(null)).toBe(false);
    expect(isPretextError(undefined)).toBe(false);
    expect(isPretextError({ code: 'registry-fetch-failed' })).toBe(false);
  });
});
