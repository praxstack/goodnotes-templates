/**
 * Splice edge-case tests (G4).
 *
 * Seven canonical cases pinning down `buildPageSequence`'s behaviour,
 * plus one bonus (inverted range). Authored as RED/TDD in C6b against
 * a stub; flipped to real GREEN assertions in C7a alongside the
 * implementation.
 *
 *   1. Mid-month start       — range doesn't begin on day 1 of a month
 *   2. Year boundary         — 12/31 triggers BOTH monthly AND quarterly
 *   3. Leap year             — Feb 29 2028 exists and is month-end
 *   4. Partial quarter       — Q1 end inside a non-aligned range
 *   5. Single-day weekday    — one daily, zero splices
 *   6. Single-day Sunday     — one daily + one weekly
 *   7. Sunday as `--from`    — range starts and ends on Sundays
 *   + bonus · inverted range — `to < from` returns empty, not a throw
 *
 * All calendar claims (days-of-week, month-ends, leap day) were verified
 * against `Date.UTC(y, m-1, d).getUTCDay()` during authoring.
 *
 * No fixtures on disk, no fonts, no Puppeteer. Pure calendar math —
 * the whole suite runs in a handful of milliseconds.
 */

import { describe, it, expect } from 'vitest';
import { buildPageSequence, type PageSpec } from '../../src/core/splice.js';

describe('buildPageSequence · splice edge cases (G4)', () => {
  // ── 1 · Mid-month start ─────────────────────────────────────
  // Range: 2026-05-15 (Fri) through 2026-05-22 (Fri). 8 days. One
  // Sunday (5/17) inside the range → one weekly. No monthly (5/31
  // outside range). No quarterly.

  it('case 1 · mid-month start · 2026-05-15 → 2026-05-22 · 8 dailies + 1 weekly', () => {
    const out: PageSpec[] = buildPageSequence({ from: '2026-05-15', to: '2026-05-22' });

    expect(out.filter((p) => p.kind === 'daily')).toHaveLength(8);
    expect(out.filter((p) => p.kind === 'weekly')).toEqual([
      { kind: 'weekly', weekEnding: '2026-05-17' },
    ]);
    expect(out.filter((p) => p.kind === 'monthly')).toHaveLength(0);
    expect(out.filter((p) => p.kind === 'quarterly')).toHaveLength(0);

    // Ordering invariant: weekly comes immediately AFTER its Sunday daily.
    const sundayIdx = out.findIndex((p) => p.kind === 'daily' && p.date === '2026-05-17');
    expect(out[sundayIdx + 1]).toEqual({
      kind: 'weekly',
      weekEnding: '2026-05-17',
    });
  });

  // ── 2 · Year boundary ───────────────────────────────────────
  // Range: 2026-12-28 (Mon) through 2027-01-03 (Sun). 7 days.
  // - 12/31 (Thu) is month-end AND quarter-end → monthly + quarterly
  // - 1/3 is a Sunday → weekly
  // - 1/3 is NOT month-end; Jan has 31 days.
  //
  // Compound-day ordering on 12/31 (Thu, not Sunday):
  //   daily · monthly · quarterly

  it('case 2 · year boundary · 2026-12-28 → 2027-01-03 · compound day 12/31 + Sunday 1/3', () => {
    const out = buildPageSequence({ from: '2026-12-28', to: '2027-01-03' });

    expect(out.filter((p) => p.kind === 'daily')).toHaveLength(7);
    expect(out.filter((p) => p.kind === 'weekly')).toEqual([
      { kind: 'weekly', weekEnding: '2027-01-03' },
    ]);
    expect(out.filter((p) => p.kind === 'monthly')).toEqual([
      { kind: 'monthly', monthEnding: '2026-12-31' },
    ]);
    expect(out.filter((p) => p.kind === 'quarterly')).toEqual([
      { kind: 'quarterly', quarterEnding: '2026-12-31' },
    ]);

    const dec31Idx = out.findIndex((p) => p.kind === 'daily' && p.date === '2026-12-31');
    expect(out[dec31Idx + 1]).toEqual({ kind: 'monthly',   monthEnding:    '2026-12-31' });
    expect(out[dec31Idx + 2]).toEqual({ kind: 'quarterly', quarterEnding:  '2026-12-31' });
  });

  // ── 3 · Leap year ───────────────────────────────────────────
  // Range: 2028-02-27 (Sun) through 2028-03-01 (Wed). 4 days.
  // 2028 is a leap year → Feb 29 exists AND is month-end.
  // 2028-02-27 is a Sunday → one weekly.
  //
  // Expected:
  //   daily 2028-02-27 · weekly 2028-02-27 ·
  //   daily 2028-02-28 ·
  //   daily 2028-02-29 · monthly 2028-02-29 ·
  //   daily 2028-03-01

  it('case 3 · leap year · 2028-02-27 → 2028-03-01 · Feb 29 exists and is month-end', () => {
    const out = buildPageSequence({ from: '2028-02-27', to: '2028-03-01' });

    const dailies = out.filter((p) => p.kind === 'daily');
    expect(dailies).toHaveLength(4);
    expect(dailies.map((p) => (p as { date: string }).date)).toEqual([
      '2028-02-27',
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
    ]);
    expect(out.filter((p) => p.kind === 'weekly')).toEqual([
      { kind: 'weekly', weekEnding: '2028-02-27' },
    ]);
    expect(out.filter((p) => p.kind === 'monthly')).toEqual([
      { kind: 'monthly', monthEnding: '2028-02-29' },
    ]);
    expect(out.filter((p) => p.kind === 'quarterly')).toHaveLength(0);

    // Exact sequence — locks ordering too.
    expect(out).toEqual([
      { kind: 'daily',   date: '2028-02-27' },
      { kind: 'weekly',  weekEnding: '2028-02-27' },
      { kind: 'daily',   date: '2028-02-28' },
      { kind: 'daily',   date: '2028-02-29' },
      { kind: 'monthly', monthEnding: '2028-02-29' },
      { kind: 'daily',   date: '2028-03-01' },
    ]);
  });

  // ── 4 · Partial quarter ─────────────────────────────────────
  // Range: 2026-03-15 (Sun) through 2026-04-15 (Wed). 32 days.
  // - Sundays in range: 3/15, 3/22, 3/29, 4/5, 4/12 → 5 weeklies
  // - 3/31 (Tue) is month-end AND quarter-end → monthly + quarterly
  // - 4/30 is outside range → no April monthly.
  //
  // Compound-day ordering on 3/31: daily → monthly → quarterly.

  it('case 4 · partial quarter · 2026-03-15 → 2026-04-15 · Q1 end spliced inside range', () => {
    const out = buildPageSequence({ from: '2026-03-15', to: '2026-04-15' });

    expect(out.filter((p) => p.kind === 'daily')).toHaveLength(32);
    expect(
      out
        .filter((p) => p.kind === 'weekly')
        .map((p) => (p as { weekEnding: string }).weekEnding),
    ).toEqual(['2026-03-15', '2026-03-22', '2026-03-29', '2026-04-05', '2026-04-12']);
    expect(out.filter((p) => p.kind === 'monthly')).toEqual([
      { kind: 'monthly', monthEnding: '2026-03-31' },
    ]);
    expect(out.filter((p) => p.kind === 'quarterly')).toEqual([
      { kind: 'quarterly', quarterEnding: '2026-03-31' },
    ]);

    const mar31Idx = out.findIndex((p) => p.kind === 'daily' && p.date === '2026-03-31');
    expect(out[mar31Idx + 1]).toEqual({ kind: 'monthly',   monthEnding:   '2026-03-31' });
    expect(out[mar31Idx + 2]).toEqual({ kind: 'quarterly', quarterEnding: '2026-03-31' });
  });

  // ── 5 · Single-day weekday ──────────────────────────────────
  // Range: 2026-05-15 (Friday) → 2026-05-15. Just one daily, no splices.

  it('case 5 · single-day weekday · 2026-05-15 → 2026-05-15 · one daily, zero splices', () => {
    const out = buildPageSequence({ from: '2026-05-15', to: '2026-05-15' });
    expect(out).toEqual([{ kind: 'daily', date: '2026-05-15' }]);
  });

  // ── 6 · Single-day Sunday ───────────────────────────────────
  // Range: 2026-05-17 (Sunday) → 2026-05-17. Weekly STILL fires — the
  // rule "weekly on every Sunday in range" doesn't care that the range
  // is a single day.

  it('case 6 · single-day Sunday · 2026-05-17 → 2026-05-17 · daily + weekly', () => {
    const out = buildPageSequence({ from: '2026-05-17', to: '2026-05-17' });
    expect(out).toEqual([
      { kind: 'daily',  date: '2026-05-17' },
      { kind: 'weekly', weekEnding: '2026-05-17' },
    ]);
  });

  // ── 7 · Sunday as --from ────────────────────────────────────
  // Range: 2026-05-03 (Sun) → 2026-05-10 (Sun). 8 dailies bracketed by
  // two Sundays → two weeklies. Tests the Sunday-is-first-day edge.

  it('case 7 · Sunday as --from · 2026-05-03 → 2026-05-10 · two weeklies, bracketed', () => {
    const out = buildPageSequence({ from: '2026-05-03', to: '2026-05-10' });

    expect(out.filter((p) => p.kind === 'daily')).toHaveLength(8);
    expect(out.filter((p) => p.kind === 'weekly')).toEqual([
      { kind: 'weekly', weekEnding: '2026-05-03' },
      { kind: 'weekly', weekEnding: '2026-05-10' },
    ]);
    expect(out.filter((p) => p.kind === 'monthly')).toHaveLength(0);
    expect(out.filter((p) => p.kind === 'quarterly')).toHaveLength(0);

    expect(out[0]).toEqual({ kind: 'daily',  date: '2026-05-03' });
    expect(out[1]).toEqual({ kind: 'weekly', weekEnding: '2026-05-03' });
    expect(out[out.length - 2]).toEqual({ kind: 'daily',  date: '2026-05-10' });
    expect(out[out.length - 1]).toEqual({ kind: 'weekly', weekEnding: '2026-05-10' });
  });

  // ── Bonus · Inverted range ──────────────────────────────────
  // When `to < from`, return an empty array rather than throwing. The
  // generator CLI surfaces that as "nothing to render" without special-
  // casing.

  it('bonus · inverted range · to < from · empty array (not a throw)', () => {
    expect(buildPageSequence({ from: '2026-05-15', to: '2026-05-01' })).toEqual([]);
  });
});
