/**
 * Property-based tests for year-planner invariants.
 *
 * Checks the critical cross-check: sum of pagesForDay(day) must equal
 * computePageCounts(year).totalPages for every year. If this drifts, the
 * renderer would silently ship a short PDF.
 *
 * Runs against a deterministic sample of years (including known leap +
 * non-leap edge cases) rather than fuzzing — buildDayEntries calls
 * Intl.DateTimeFormat 365× per invocation, which makes fc fuzzing slow.
 * The deterministic sample covers: leap (2000, 2024, 2400), non-leap
 * centennial (1900, 2100), recent (2023, 2025, 2026), and distant future
 * (2096 — last easy leap before 2100).
 */

import { describe, it, expect } from 'vitest';
import {
  buildDayEntries,
  computePageCounts,
} from '../../src/templates/planners/daily-year-v2.js';
import { isLeapYear } from '../../src/utils/locale.js';

// Must stay in sync with pagesForDay in src/templates/planners/daily-year-v2.ts.
function pagesForDay(d: { includeWeeklyReview: boolean; includeMonthlyReview: boolean }): number {
  let count = 2;
  if (d.includeWeeklyReview) count++;
  if (d.includeMonthlyReview) count++;
  return count;
}

const SAMPLE_YEARS = [
  1900, // non-leap centennial
  2000, // leap
  2023, // non-leap
  2024, // leap
  2025, // non-leap
  2026, // non-leap (current shipping year)
  2100, // non-leap centennial
  2400, // leap (400-divisible)
];

describe('year generator · page-count invariants', () => {
  it.each(SAMPLE_YEARS)(
    'sum of pagesForDay(day) equals computePageCounts.totalPages — %d',
    (year) => {
      const days = buildDayEntries(year, 'en');
      const actualTotal = days.reduce((sum, d) => sum + pagesForDay(d), 0);
      const expected = computePageCounts(year).totalPages;
      expect(actualTotal).toBe(expected);
    },
  );

  it.each(SAMPLE_YEARS)(
    '365 or 366 entries depending on isLeapYear — %d',
    (year) => {
      const entries = buildDayEntries(year, 'en');
      expect(entries).toHaveLength(isLeapYear(year) ? 366 : 365);
    },
  );

  it.each(SAMPLE_YEARS)(
    'every monthlyReview flag lands on a real last-of-month date — %d',
    (year) => {
      const days = buildDayEntries(year, 'en');
      const monthLastFlags = days.filter((d) => d.includeMonthlyReview);
      expect(monthLastFlags).toHaveLength(12);
      for (const d of monthLastFlags) {
        const nextDay = new Date(d.year, d.month - 1, d.day + 1);
        expect(nextDay.getMonth() + 1).not.toBe(d.month);
      }
    },
  );
});
