/**
 * Locale-aware date formatting for planners and templates.
 * Supports 6 languages at launch: en, es, fr, de, ja, ko.
 *
 * Uses Intl.DateTimeFormat for reliable locale handling including
 * leap years, week start conventions, and month spillover.
 */

export type SupportedLocale = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'es', 'fr', 'de', 'ja', 'ko'];

const LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

/**
 * Get localized month names (January, February, ...).
 */
export function getMonthNames(locale: SupportedLocale = 'en', format: 'long' | 'short' = 'long'): string[] {
  const intlLocale = LOCALE_MAP[locale];
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2026, i, 1);
    return new Intl.DateTimeFormat(intlLocale, { month: format }).format(date);
  });
}

/**
 * Get localized day names (Monday, Tuesday, ...).
 * weekStart: 0 = Sunday, 1 = Monday (ISO)
 */
export function getDayNames(
  locale: SupportedLocale = 'en',
  format: 'long' | 'short' | 'narrow' = 'short',
  weekStart: 0 | 1 = 1
): string[] {
  const intlLocale = LOCALE_MAP[locale];
  // Jan 5, 2026 is a Monday
  const mondayBase = new Date(2026, 0, 5);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(mondayBase);
    date.setDate(mondayBase.getDate() + i);
    return new Intl.DateTimeFormat(intlLocale, { weekday: format }).format(date);
  });

  if (weekStart === 0) {
    // Rotate so Sunday is first
    const sunday = days.pop()!;
    days.unshift(sunday);
  }

  return days;
}

/**
 * Format a date for display in planners.
 */
export function formatDate(
  date: Date,
  locale: SupportedLocale = 'en',
  format: 'full' | 'long' | 'medium' | 'short' = 'medium'
): string {
  const intlLocale = LOCALE_MAP[locale];
  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case 'full':
      options.weekday = 'long';
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'long':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'medium':
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'short':
      options.year = '2-digit';
      options.month = 'numeric';
      options.day = 'numeric';
      break;
  }

  return new Intl.DateTimeFormat(intlLocale, options).format(date);
}

/**
 * Get the number of days in a month.
 * Handles leap years correctly.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get the day of the week for the first day of a month.
 * Returns 0 (Sunday) to 6 (Saturday).
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get ISO week number for a date.
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Generate a calendar grid for a month.
 * Returns a 2D array of day numbers (0 = empty cell).
 * weekStart: 0 = Sunday, 1 = Monday (ISO)
 */
export function getMonthGrid(
  year: number,
  month: number,
  weekStart: 0 | 1 = 1
): number[][] {
  const daysInMonth = getDaysInMonth(year, month);
  let firstDay = getFirstDayOfMonth(year, month);

  // Adjust for week start
  if (weekStart === 1) {
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
  }

  const grid: number[][] = [];
  let week: number[] = new Array(firstDay).fill(0);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }

  // Pad last week
  if (week.length > 0) {
    while (week.length < 7) week.push(0);
    grid.push(week);
  }

  return grid;
}

/**
 * Get all weeks in a year with their start/end dates.
 */
export function getWeeksInYear(year: number, weekStart: 0 | 1 = 1): Array<{ weekNum: number; start: Date; end: Date }> {
  const weeks: Array<{ weekNum: number; start: Date; end: Date }> = [];
  const jan1 = new Date(year, 0, 1);
  let dayOfWeek = jan1.getDay();

  if (weekStart === 1) {
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }

  // First day of week 1
  const firstWeekStart = new Date(jan1);
  firstWeekStart.setDate(jan1.getDate() - dayOfWeek);

  let current = new Date(firstWeekStart);
  let weekNum = 1;

  while (current.getFullYear() <= year) {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 6);

    weeks.push({ weekNum, start, end });

    current.setDate(current.getDate() + 7);
    weekNum++;

    if (current.getFullYear() > year && current.getMonth() > 0) break;
    if (weekNum > 53) break;
  }

  return weeks;
}

/**
 * Validate a year is in the supported range.
 */
export function validateYear(year: number): void {
  if (!Number.isInteger(year) || year < 1970 || year > 2100) {
    throw new Error(`Year must be between 1970 and 2100. Got: ${year}`);
  }
}
