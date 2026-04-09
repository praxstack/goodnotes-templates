import { describe, it, expect } from 'vitest';

describe('ADHD v2 year generator', () => {
  // 1. buildDayEntries basic
  describe('buildDayEntries', () => {
    it('builds correct day entries for 2026', async () => {
      const { buildDayEntries } = await import('../../src/templates/planners/daily-year-v2.js');
      const days = buildDayEntries(2026, 'en');
      expect(days).toHaveLength(365);
      expect(days[0].dateLabel).toBe('1 Jan');
      expect(days[0].dayOfWeek).toBe(4); // Thursday
      expect(days[0].month).toBe(1);
      expect(days[0].day).toBe(1);
      expect(days[364].dateLabel).toBe('31 Dec');
      expect(days[364].dayOfWeek).toBe(4); // Thursday
    });

    it('handles leap year (2024)', async () => {
      const { buildDayEntries } = await import('../../src/templates/planners/daily-year-v2.js');
      const days = buildDayEntries(2024, 'en');
      expect(days).toHaveLength(366);
      // Feb 29 should exist
      const feb29 = days.find(d => d.month === 2 && d.day === 29);
      expect(feb29).toBeDefined();
      expect(feb29!.dateLabel).toBe('29 Feb');
    });

    it('marks Sundays for weekly review', async () => {
      const { buildDayEntries } = await import('../../src/templates/planners/daily-year-v2.js');
      const days = buildDayEntries(2026, 'en');
      const sundays = days.filter(d => d.includeWeeklyReview);
      expect(sundays).toHaveLength(52);
      // All weekly review days should be Sundays
      for (const s of sundays) {
        expect(s.dayOfWeek).toBe(0);
      }
    });

    it('marks last day of each month for monthly review', async () => {
      const { buildDayEntries } = await import('../../src/templates/planners/daily-year-v2.js');
      const days = buildDayEntries(2026, 'en');
      const monthlyDays = days.filter(d => d.includeMonthlyReview);
      expect(monthlyDays).toHaveLength(12);

      // Verify specific last days
      expect(monthlyDays[0].dateLabel).toBe('31 Jan');
      expect(monthlyDays[1].dateLabel).toBe('28 Feb');
      expect(monthlyDays[2].dateLabel).toBe('31 Mar');
      expect(monthlyDays[3].dateLabel).toBe('30 Apr');
      expect(monthlyDays[4].dateLabel).toBe('31 May');
      expect(monthlyDays[5].dateLabel).toBe('30 Jun');
      expect(monthlyDays[6].dateLabel).toBe('31 Jul');
      expect(monthlyDays[7].dateLabel).toBe('31 Aug');
      expect(monthlyDays[8].dateLabel).toBe('30 Sep');
      expect(monthlyDays[9].dateLabel).toBe('31 Oct');
      expect(monthlyDays[10].dateLabel).toBe('30 Nov');
      expect(monthlyDays[11].dateLabel).toBe('31 Dec');
    });

    it('handles day that is both Sunday AND last day of month', async () => {
      const { buildDayEntries } = await import('../../src/templates/planners/daily-year-v2.js');
      const days = buildDayEntries(2026, 'en');
      // May 31 2026 is a Sunday — should have BOTH flags
      const may31 = days.find(d => d.month === 5 && d.day === 31);
      expect(may31).toBeDefined();
      expect(may31!.dayOfWeek).toBe(0); // Sunday
      expect(may31!.includeWeeklyReview).toBe(true);
      expect(may31!.includeMonthlyReview).toBe(true);
    });

    it('uses correct day names', async () => {
      const { buildDayEntries } = await import('../../src/templates/planners/daily-year-v2.js');
      const days = buildDayEntries(2026, 'en');
      // Jan 1 2026 is Thursday
      expect(days[0].dayName).toBe('Thu');
      // Jan 5 2026 is Monday
      expect(days[4].dayName).toBe('Mon');
      // Jan 4 2026 is Sunday
      expect(days[3].dayName).toBe('Sun');
    });
  });

  // 2. computePageCounts
  describe('computePageCounts', () => {
    it('computes correct page counts for 2026', async () => {
      const { computePageCounts } = await import('../../src/templates/planners/daily-year-v2.js');
      const counts = computePageCounts(2026);
      expect(counts.dailyPages).toBe(365 * 2); // 730
      expect(counts.weeklyPages).toBe(52);
      expect(counts.monthlyPages).toBe(12);
      expect(counts.totalPages).toBe(730 + 52 + 12); // 794
    });

    it('computes correct page counts for leap year 2024', async () => {
      const { computePageCounts } = await import('../../src/templates/planners/daily-year-v2.js');
      const counts = computePageCounts(2024);
      expect(counts.dailyPages).toBe(366 * 2); // 732
      expect(counts.weeklyPages).toBe(52); // 2024 has 52 Sundays
      expect(counts.monthlyPages).toBe(12);
      expect(counts.totalPages).toBe(732 + 52 + 12); // 796
    });

    it('totalPages equals sum of components', async () => {
      const { computePageCounts } = await import('../../src/templates/planners/daily-year-v2.js');
      const counts = computePageCounts(2026);
      expect(counts.totalPages).toBe(counts.dailyPages + counts.weeklyPages + counts.monthlyPages);
    });
  });
});
