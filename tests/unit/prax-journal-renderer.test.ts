/**
 * PageSpec → file mapping tests (C7b.1).
 *
 * Scope is deliberately narrow: we only test the pure
 * `resolvePageSpecFiles` function here. The async `renderPageSpec`
 * wrapper involves Puppeteer + real HTML files and is exercised end-
 * to-end by the CLI integration test that lands in C7b.4.
 *
 * What's pinned:
 *   1. Daily returns 4 files in the canonical order
 *      (today → midday → reflect → brain-dump)
 *   2. Weekly / monthly / quarterly each return 1 file with the
 *      expected basename
 *   3. Custom `versionDir` override threads through untouched
 *   4. The default `V5_PACK_DIR` resolves to absolute paths whose
 *      files actually exist on disk (catches a pack rename or move)
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolvePageSpecFiles,
  V5_PACK_DIR,
  DAILY_HTML_FILES,
  REVIEW_HTML_FILE,
} from '../../src/core/prax-journal-renderer.js';
import type { PageSpec } from '../../src/core/splice.js';

describe('resolvePageSpecFiles · PageSpec → HTML files', () => {
  // ── 1 · Daily expands to 4 files in render order ────────────

  it('daily → today / midday / reflect / brain-dump in order', () => {
    const page: PageSpec = { kind: 'daily', date: '2026-05-01' };
    const files = resolvePageSpecFiles(page).map((f) => path.basename(f));
    expect(files).toEqual([
      'today.html',
      'midday.html',
      'reflect.html',
      'brain-dump.html',
    ]);
    // And the exported constant is the single source of truth.
    expect(files).toEqual([...DAILY_HTML_FILES]);
  });

  // ── 2 · Review kinds each return one file ───────────────────

  it('weekly → weekly.html', () => {
    const page: PageSpec = { kind: 'weekly', weekEnding: '2026-05-03' };
    expect(resolvePageSpecFiles(page).map((f) => path.basename(f))).toEqual([
      'weekly.html',
    ]);
    expect(REVIEW_HTML_FILE.weekly).toBe('weekly.html');
  });

  it('monthly → monthly.html', () => {
    const page: PageSpec = { kind: 'monthly', monthEnding: '2026-05-31' };
    expect(resolvePageSpecFiles(page).map((f) => path.basename(f))).toEqual([
      'monthly.html',
    ]);
    expect(REVIEW_HTML_FILE.monthly).toBe('monthly.html');
  });

  it('quarterly → quarterly.html', () => {
    const page: PageSpec = { kind: 'quarterly', quarterEnding: '2026-06-30' };
    expect(resolvePageSpecFiles(page).map((f) => path.basename(f))).toEqual([
      'quarterly.html',
    ]);
    expect(REVIEW_HTML_FILE.quarterly).toBe('quarterly.html');
  });

  // ── 3 · Custom versionDir threads through ───────────────────

  it('custom versionDir is honoured for every kind', () => {
    const fakeDir = '/tmp/fake-pack/v99';
    const cases: PageSpec[] = [
      { kind: 'daily', date: '2026-01-01' },
      { kind: 'weekly', weekEnding: '2026-01-04' },
      { kind: 'monthly', monthEnding: '2026-01-31' },
      { kind: 'quarterly', quarterEnding: '2026-03-31' },
    ];
    for (const c of cases) {
      const files = resolvePageSpecFiles(c, fakeDir);
      for (const f of files) {
        expect(f.startsWith(fakeDir + path.sep)).toBe(true);
      }
    }
  });

  // ── 4 · Default dir actually points at real files ───────────
  //
  // This is the cheap "canary" that catches a pack rename/move. It's
  // not a rendering test — it's a wiring test. If someone relocates
  // `packs/journals/prax-journal/versions/v5/` without updating
  // `V5_PACK_DIR`, this goes red before the CLI would.

  it('default V5_PACK_DIR files all exist on disk', () => {
    const kinds: PageSpec[] = [
      { kind: 'daily', date: '2026-05-01' },
      { kind: 'weekly', weekEnding: '2026-05-03' },
      { kind: 'monthly', monthEnding: '2026-05-31' },
      { kind: 'quarterly', quarterEnding: '2026-06-30' },
    ];
    const allFiles = kinds.flatMap((k) => resolvePageSpecFiles(k));
    for (const f of allFiles) {
      expect(f.startsWith(V5_PACK_DIR + path.sep)).toBe(true);
      expect(fs.existsSync(f), `missing v5 HTML: ${f}`).toBe(true);
    }
  });
});
