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
  substituteProfile,
  deriveDateFields,
  isLeapYear,
  PROFILE_PLACEHOLDERS,
  RX_SLOT_COUNT,
  V5_PACK_DIR,
  DAILY_HTML_FILES,
  REVIEW_HTML_FILE,
} from '../../src/core/prax-journal-renderer.js';

import type { PageSpec } from '../../src/core/splice.js';
import type { Profile } from '../../src/types/profile.js';

/**
 * Tiny helper — build a minimal-valid Profile for tests. Keeps the
 * substitution cases focused on what they're testing (token replacement)
 * rather than Zod shape plumbing.
 */
function makeProfile(therapists: Profile['therapists']): Profile {
  return {
    schema_version: 1,
    user: { name: 'Test User', tz: 'Asia/Kolkata', locale: 'en-IN' },
    therapists,
    medications: [],
    named_patterns: [],
    baselines: {},
  };
}


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

describe('substituteProfile · narrow PII injection', () => {
  // A small fixture covering all four placeholders in one line — keeps
  // every assertion focused on the substitution, not the layout.
  const sample =
    'Dr. {{DR_NAME}} · {{DR_CREDENTIALS}} · Reg № {{DR_REG}} · F/U {{DR_FOLLOWUP}} days';

  // ── 5 · No profile → every token falls back to its printed blank ──

  it('no profile → tokens replaced with printed-blank fallbacks', () => {
    const out = substituteProfile(sample, undefined);
    expect(out).toBe(
      `Dr. ${PROFILE_PLACEHOLDERS.DR_NAME} · ${PROFILE_PLACEHOLDERS.DR_CREDENTIALS} ` +
        `· Reg № ${PROFILE_PLACEHOLDERS.DR_REG} · F/U ${PROFILE_PLACEHOLDERS.DR_FOLLOWUP} days`,
    );
    // No leftover `{{…}}` tokens — important, a leak into the PDF
    // would look like user-visible templating debris.
    expect(out).not.toMatch(/\{\{/u);
  });

  // ── 6 · Fully-populated psychiatry entry → every field substituted ──

  it('psychiatry entry → all four placeholders pulled from profile', () => {
    const profile = makeProfile([
      {
        role: 'psychiatry',
        name: 'Jane Roe',
        credentials: 'MBBS, MD Psych',
        registration_number: 'MCI-12345',
        follow_up_days: 21,
      },
    ]);
    expect(substituteProfile(sample, profile)).toBe(
      'Dr. Jane Roe · MBBS, MD Psych · Reg № MCI-12345 · F/U 21 days',
    );
  });

  // ── 7 · Partial psychiatry entry → present fields fill, absent fall back ──

  it('partial psychiatry entry → missing fields keep printed-blank fallback', () => {
    const profile = makeProfile([
      { role: 'psychiatry', name: 'Jane Roe' }, // only `name` supplied
    ]);
    const out = substituteProfile(sample, profile);
    expect(out).toContain('Dr. Jane Roe');
    expect(out).toContain(`· ${PROFILE_PLACEHOLDERS.DR_CREDENTIALS} ·`);
    expect(out).toContain(`Reg № ${PROFILE_PLACEHOLDERS.DR_REG}`);
    expect(out).toContain(`F/U ${PROFILE_PLACEHOLDERS.DR_FOLLOWUP} days`);
  });

  // ── 8 · Psychiatry role missing → whole card falls back cleanly ──

  it('profile with no psychiatry role → every token falls back', () => {
    const profile = makeProfile([
      { role: 'psychology', name: 'Jane Roe' },
      { role: 'coach',      name: 'Coach Smith' },
    ]);
    expect(substituteProfile(sample, profile)).toBe(
      substituteProfile(sample, undefined),
    );
  });

  // ── 9 · Multiple psychiatrists → first one wins (stable, deterministic) ──

  it('multiple psychiatrists → first entry wins', () => {
    const profile = makeProfile([
      { role: 'psychiatry', name: 'First Chosen' },
      { role: 'psychiatry', name: 'Second Ignored' },
    ]);
    const out = substituteProfile(sample, profile);
    expect(out).toContain('Dr. First Chosen');
    expect(out).not.toContain('Second Ignored');
  });

  // ── 10 · Unknown {{TOKENS}} left alone — scoped-replace safety ──
  //
  // The renderer's replace is whitelist-scoped so templates can use
  // `{{foo}}` freely in comments / CSS strings without accidental
  // clobbering. This guards that promise.

  it('unknown tokens are left untouched (no wildcard replace)', () => {
    const input =
      'keep {{UNKNOWN}} and /* css {{braces}} */ untouched · swap {{DR_NAME}}';
    const out = substituteProfile(input, undefined);
    expect(out).toContain('{{UNKNOWN}}');
    expect(out).toContain('{{braces}}');
    expect(out).toContain(PROFILE_PLACEHOLDERS.DR_NAME);
    expect(out).not.toContain('{{DR_NAME}}');
  });
});

describe('substituteProfile · medication rows (RX_N_*)', () => {
  // Tiny helper — single med, used to make intent obvious row-by-row.
  const med = (name: string, dose: string) => ({ name, dose, cadence: 'daily' });

  // Build a string with slot N's two tokens side by side. Keeping the
  // test fixture tight makes the expected output easy to eyeball.
  const rowFixture = (n: number) => `{{RX_${n}_NAME}}|{{RX_${n}_DOSE}}`;

  // ── 11 · RX_SLOT_COUNT matches today.html's row count ──
  //
  // If today.html ever grows/shrinks its `.rx-item` row count, this
  // test nudges you to update RX_SLOT_COUNT in lock-step. It's a cheap
  // coupling guard rather than an assertion about render output.

  it('RX_SLOT_COUNT stays in sync with today.html .rx-item rows', () => {
    const todayHtml = fs.readFileSync(
      path.join(V5_PACK_DIR, 'today.html'),
      'utf-8',
    );
    const rowMatches = todayHtml.match(/class="rx-item"/gu) ?? [];
    expect(rowMatches.length).toBe(RX_SLOT_COUNT);
  });

  // ── 12 · No meds → every RX slot falls back to printed blank ──

  it('profile with no meds → every RX_N_* token falls back', () => {
    const profile = makeProfile([]);
    const input = Array.from({ length: RX_SLOT_COUNT }, (_, i) =>
      rowFixture(i + 1),
    ).join(' · ');
    const out = substituteProfile(input, profile);
    expect(out).not.toMatch(/\{\{RX_/u);
    // Every slot should show the blank name glyph.
    const nameBlankCount = out.split(PROFILE_PLACEHOLDERS.RX_1_NAME).length - 1;
    expect(nameBlankCount).toBe(RX_SLOT_COUNT);
  });

  // ── 13 · Meds fill slots in declaration order ──

  it('medications populate slots in declaration order', () => {
    const profile: Profile = {
      ...makeProfile([]),
      medications: [
        med('Alpha',   '1 tab'),
        med('Bravo',   '2 caps'),
        med('Charlie', '5 mg'),
      ],
    };
    expect(substituteProfile(rowFixture(1), profile)).toBe('Alpha|1 tab');
    expect(substituteProfile(rowFixture(2), profile)).toBe('Bravo|2 caps');
    expect(substituteProfile(rowFixture(3), profile)).toBe('Charlie|5 mg');
    // Slot 4 has no med → fallback glyphs.
    expect(substituteProfile(rowFixture(4), profile)).toBe(
      `${PROFILE_PLACEHOLDERS.RX_4_NAME}|${PROFILE_PLACEHOLDERS.RX_4_DOSE}`,
    );
  });

  // ── 14 · More meds than slots → extras drop, slots 1..N fill ──
  //
  // Documents the "reorder profile.json to pick which 8 meds print"
  // behaviour. The drop is silent-by-design, so this test pins it.

  it('meds beyond RX_SLOT_COUNT are dropped, first N fill slots', () => {
    const profile: Profile = {
      ...makeProfile([]),
      medications: Array.from({ length: RX_SLOT_COUNT + 3 }, (_, i) =>
        med(`Drug${i + 1}`, `dose${i + 1}`),
      ),
    };
    // Slot 1 and slot RX_SLOT_COUNT both filled from profile.
    expect(substituteProfile(rowFixture(1), profile)).toBe('Drug1|dose1');
    expect(substituteProfile(rowFixture(RX_SLOT_COUNT), profile)).toBe(
      `Drug${RX_SLOT_COUNT}|dose${RX_SLOT_COUNT}`,
    );
    // And there should be no RX_9_* etc. tokens in the whitelist —
    // asking the renderer to fill beyond the slot count would leave
    // the token untouched (safety: no silent overflow).
    expect(substituteProfile('{{RX_9_NAME}}', profile)).toBe('{{RX_9_NAME}}');
  });
});

/**
 * Date-token tests (C7b.1+++ · pre-fill dated dailies).
 *
 * Pin the `DAY_*` substitution contract so the daily header can't
 * silently drift:
 *  - Calendar math is UTC-only (matches splice.ts + bookmarkTitle)
 *  - Only daily PageSpecs fill the tokens; reviews keep fallbacks
 *  - Leap-year arithmetic is correct (affects DAYS_IN_YEAR + DAY_OF_YEAR
 *    on Dec 31)
 *  - Missing page arg → everything falls back to printed-blank glyphs
 */
describe('isLeapYear · Gregorian rules', () => {
  it('divisible-by-4 is leap', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);
  });
  it('century-but-not-400 is NOT leap', () => {
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2100)).toBe(false);
  });
  it('divisible-by-400 IS leap', () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2400)).toBe(true);
  });
  it('non-leap common years', () => {
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(2027)).toBe(false);
  });
});

describe('deriveDateFields · UTC calendar math', () => {
  // ── Jan 1 of any year is day 1 ──
  it('Jan 1 2026 → day 1 of 365', () => {
    const f = deriveDateFields('2026-01-01');
    expect(f.DAY_OF_YEAR).toBe('1');
    expect(f.DAYS_IN_YEAR).toBe('365');
    expect(f.DAY_DATE).toBe('January 1');
    expect(f.DAY_WEEKDAY).toBe('Thu'); // UTC-stable
  });

  // ── User's exact ask — Apr 30 2026 = day 120 ──
  it('Apr 30 2026 → April 30 · Thu · day 120/365', () => {
    const f = deriveDateFields('2026-04-30');
    expect(f.DAY_DATE).toBe('April 30');
    expect(f.DAY_WEEKDAY).toBe('Thu');
    expect(f.DAY_OF_YEAR).toBe('120');
    expect(f.DAYS_IN_YEAR).toBe('365');
  });

  // ── Dec 31 of non-leap → 365 ──
  it('Dec 31 2026 (non-leap) → day 365 of 365', () => {
    const f = deriveDateFields('2026-12-31');
    expect(f.DAY_OF_YEAR).toBe('365');
    expect(f.DAYS_IN_YEAR).toBe('365');
  });

  // ── Dec 31 of leap → 366 ──
  it('Dec 31 2024 (leap) → day 366 of 366', () => {
    const f = deriveDateFields('2024-12-31');
    expect(f.DAY_OF_YEAR).toBe('366');
    expect(f.DAYS_IN_YEAR).toBe('366');
  });

  // ── Feb 29 on a leap year ──
  it('Feb 29 2024 exists and is day 60', () => {
    const f = deriveDateFields('2024-02-29');
    expect(f.DAY_OF_YEAR).toBe('60');
    expect(f.DAY_DATE).toBe('February 29');
  });

  // ── Weekday labels stable across week ──
  it('weekday labels in UTC stay stable regardless of runner TZ', () => {
    // 2026-05-01 = Fri, 05-02 = Sat, 05-03 = Sun
    expect(deriveDateFields('2026-05-01').DAY_WEEKDAY).toBe('Fri');
    expect(deriveDateFields('2026-05-02').DAY_WEEKDAY).toBe('Sat');
    expect(deriveDateFields('2026-05-03').DAY_WEEKDAY).toBe('Sun');
  });
});

describe('substituteProfile · daily date tokens', () => {
  const dailyTpl =
    '{{DAY_DATE}} · {{DAY_WEEKDAY}} · day {{DAY_OF_YEAR}}/{{DAYS_IN_YEAR}}';

  // ── Daily page → all 4 tokens fill ──
  it('daily PageSpec populates all DAY_* tokens', () => {
    const out = substituteProfile(dailyTpl, undefined, {
      kind: 'daily',
      date: '2026-04-30',
    });
    expect(out).toBe('April 30 · Thu · day 120/365');
  });

  // ── Review kinds do NOT fill DAY_* — they fall back ──
  // The invariant: DAY_* tokens don't appear in review HTML anyway,
  // so the whitelist regex has nothing to match. But if someone ever
  // pastes a DAY_* into a review template, it should stay as the
  // printed-blank glyph, not leak a weekly's date into a monthly spread.
  it('weekly PageSpec leaves DAY_* tokens as printed blanks', () => {
    const out = substituteProfile(dailyTpl, undefined, {
      kind: 'weekly',
      weekEnding: '2026-05-03',
    });
    // Every DAY_* resolves to its PROFILE_PLACEHOLDERS fallback.
    expect(out).toBe(
      [
        PROFILE_PLACEHOLDERS.DAY_DATE,
        ' · ',
        PROFILE_PLACEHOLDERS.DAY_WEEKDAY,
        ' · day ',
        PROFILE_PLACEHOLDERS.DAY_OF_YEAR,
        '/',
        PROFILE_PLACEHOLDERS.DAYS_IN_YEAR,
      ].join(''),
    );
  });

  // ── No PageSpec at all → everything falls back (legacy callers) ──
  it('omitting the page argument → every DAY_* falls back', () => {
    const out = substituteProfile(dailyTpl, undefined);
    expect(out).toBe(
      [
        PROFILE_PLACEHOLDERS.DAY_DATE,
        ' · ',
        PROFILE_PLACEHOLDERS.DAY_WEEKDAY,
        ' · day ',
        PROFILE_PLACEHOLDERS.DAY_OF_YEAR,
        '/',
        PROFILE_PLACEHOLDERS.DAYS_IN_YEAR,
      ].join(''),
    );
  });

  // ── Profile + page coexist without interference ──
  it('profile DR_* and page DAY_* substitute on the same pass', () => {
    const input =
      '{{DR_NAME}} on {{DAY_DATE}} · day {{DAY_OF_YEAR}}';
    const profile = makeProfile([
      {
        role: 'psychiatry',
        name: 'Dr. X',
        credentials: 'MD',
        registration_number: '42',
        follow_up_days: 30,
      },
    ]);
    const out = substituteProfile(input, profile, {
      kind: 'daily',
      date: '2026-04-30',
    });
    expect(out).toBe('Dr. X on April 30 · day 120');
  });
});

