import { describe, it, expect } from 'vitest';
import {
  getMonthNames,
  getDayNames,
  getDaysInMonth,
  isLeapYear,
  getMonthGrid,
  getISOWeekNumber,
  validateYear,
  formatDate,
  getWeeksInYear,
} from '../../packages/core/src/utils/locale.js';

describe('Locale', () => {
  it('returns 12 month names in English', () => {
    const months = getMonthNames('en');
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('January');
    expect(months[11]).toBe('December');
  });

  it('returns month names in Spanish', () => {
    const months = getMonthNames('es');
    expect(months[0].toLowerCase()).toBe('enero');
  });

  it('returns month names in Japanese', () => {
    const months = getMonthNames('ja');
    expect(months[0]).toContain('1');
  });

  it('returns 7 day names', () => {
    const days = getDayNames('en', 'short', 1);
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('Mon');
  });

  it('Sunday-start week puts Sun first', () => {
    const days = getDayNames('en', 'short', 0);
    expect(days[0]).toBe('Sun');
  });

  it('gets days in month correctly', () => {
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2024, 2)).toBe(29); // leap year
    expect(getDaysInMonth(2026, 1)).toBe(31);
    expect(getDaysInMonth(2026, 4)).toBe(30);
  });

  it('detects leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
  });

  it('generates a month grid', () => {
    const grid = getMonthGrid(2026, 1); // January 2026
    expect(grid.length).toBeGreaterThanOrEqual(4);
    expect(grid[0]).toHaveLength(7);
    // January 2026 starts on Thursday (ISO: index 3)
    expect(grid[0][3]).toBe(1);
  });

  it('validates year range', () => {
    expect(() => validateYear(2026)).not.toThrow();
    expect(() => validateYear(0)).toThrow();
    expect(() => validateYear(9999)).toThrow();
    expect(() => validateYear(1.5)).toThrow();
  });

  it('computes ISO week number', () => {
    const jan1 = new Date(2026, 0, 1);
    const week = getISOWeekNumber(jan1);
    expect(week).toBeGreaterThanOrEqual(1);
    expect(week).toBeLessThanOrEqual(53);
  });
});

// ─── formatDate — all 4 format branches ─────────────────────────────

describe('formatDate — planner display formatting', () => {
  const sample = new Date(2026, 2, 15); // March 15, 2026 (Sunday)

  it('format=full includes weekday + long month + year', () => {
    const out = formatDate(sample, 'en', 'full');
    // Exact string depends on ICU version; assert shape instead.
    expect(out).toMatch(/(Sunday|Sun)/);
    expect(out).toMatch(/(March|Mar)/);
    expect(out).toContain('2026');
  });

  it('format=long uses long month but omits weekday', () => {
    const out = formatDate(sample, 'en', 'long');
    expect(out).toContain('2026');
    expect(out).toMatch(/March/);
    expect(out).not.toMatch(/Sunday/);
  });

  it('format=medium (default) uses short month', () => {
    const out = formatDate(sample, 'en');
    expect(out).toContain('2026');
    // "Mar" or "March" depending on ICU; medium is short.
    expect(out).toMatch(/Mar/);
  });

  it('format=short uses 2-digit year + numeric month/day', () => {
    const out = formatDate(sample, 'en', 'short');
    // '3/15/26' or similar; just assert no full year + no month name.
    expect(out).not.toContain('2026');
    expect(out).not.toMatch(/March/);
    expect(out).toMatch(/26/);
  });

  it('respects non-English locales', () => {
    const out = formatDate(sample, 'ja', 'long');
    // Japanese uses 年/月/日; just assert numeric year is present.
    expect(out).toContain('2026');
  });
});

// ─── getWeeksInYear — ISO and Sunday-start modes ────────────────────

describe('getWeeksInYear — full-year week iteration', () => {
  it('returns ~52-53 weeks for a normal year (ISO / Monday start)', () => {
    const weeks = getWeeksInYear(2026, 1);
    expect(weeks.length).toBeGreaterThanOrEqual(52);
    expect(weeks.length).toBeLessThanOrEqual(53);
    expect(weeks[0].weekNum).toBe(1);
  });

  it('Sunday-start (weekStart=0) also yields 52-53 weeks', () => {
    const weeks = getWeeksInYear(2026, 0);
    expect(weeks.length).toBeGreaterThanOrEqual(52);
    expect(weeks.length).toBeLessThanOrEqual(53);
  });

  it('every entry has start before end (7-day spans)', () => {
    const weeks = getWeeksInYear(2026, 1);
    for (const w of weeks) {
      expect(w.start.getTime()).toBeLessThan(w.end.getTime());
      const spanDays = (w.end.getTime() - w.start.getTime()) / (86_400_000);
      expect(spanDays).toBeCloseTo(6, 0);
    }
  });

  it('handles leap-year boundaries (2024)', () => {
    const weeks = getWeeksInYear(2024, 1);
    expect(weeks.length).toBeGreaterThanOrEqual(52);
  });
});
