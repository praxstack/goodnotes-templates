import { describe, it, expect } from 'vitest';
import { getMonthNames, getDayNames, getDaysInMonth, isLeapYear, getMonthGrid, getISOWeekNumber, validateYear } from '../../src/utils/locale.js';

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
