/**
 * Full Year Daily Planner Generator — v2
 *
 * Takes 4 separate ADHD v2 HTML templates (Today, Reflect, Weekly, Monthly)
 * and generates a complete year-long journal with:
 * - 2 daily pages per day (Today + Reflect)
 * - 1 weekly review page every Sunday
 * - 1 monthly review page on the last day of each month
 * - Date injection via data-inject attributes on every page
 * - Month navigation tab bar on every page (hyperlinked in final PDF)
 * - PDF bookmarks for each month and each day
 *
 * Generation strategy:
 * 1. Read 4 HTML template files → extract <head> CSS + <div class="page"> body
 * 2. Loop through each day of the year
 * 3. Render month-by-month via Puppeteer (avoid OOM on 800+ page docs)
 * 4. Merge 12 monthly PDFs with pdf-lib
 * 5. Add hyperlinks for month tab navigation
 * 6. Add bookmarks for GoodNotes sidebar
 *
 * Output: ~794 pages per theme (365×2 + 52 weekly + 12 monthly)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { PageDimensions, PDFBookmark, PDFHyperlink } from '../../types/index.js';
import { renderHTMLToPDF, closeBrowser } from '../../core/puppeteer-renderer.js';
import { mergePDFs, postProcessPDF } from '../../core/pdf-postprocess.js';
import {
  getMonthNames,
  getDayNames,
  isLeapYear,
  type SupportedLocale,
} from '../../utils/locale.js';

// ─── Types ──────────────────────────────────────────────────────

export interface DayEntry {
  /** Date object for this day */
  date: Date;
  /** Day of month (1-31) */
  day: number;
  /** Month (1-12) */
  month: number;
  /** Year */
  year: number;
  /** Day of week (0=Sun, 6=Sat) */
  dayOfWeek: number;
  /** Whether to include a weekly review page after daily pages */
  includeWeeklyReview: boolean;
  /** Whether to include a monthly review page after daily (and weekly) pages */
  includeMonthlyReview: boolean;
  /** Formatted date string (e.g., "1 Jan") */
  dateLabel: string;
  /** Day name (e.g., "Mon") */
  dayName: string;
}

interface MonthPages {
  /** Month number (1-12) */
  month: number;
  /** Month name */
  monthName: string;
  /** Total pages in this month's PDF */
  pageCount: number;
  /** PDF buffer for this month */
  buffer: Buffer;
}

export interface YearGenerationResult {
  /** Output file path */
  outputPath: string;
  /** Total page count */
  totalPages: number;
  /** File size in bytes */
  fileSize: number;
  /** Generation time in milliseconds */
  generationTime: number;
  /** Pages per month breakdown */
  monthBreakdown: Array<{ month: string; pages: number }>;
}

export interface DailyYearV2Options {
  /** Path to the Today HTML template */
  todayTemplatePath: string;
  /** Path to the Reflect HTML template */
  reflectTemplatePath: string;
  /** Path to the Weekly Review HTML template */
  weeklyTemplatePath: string;
  /** Path to the Monthly Review HTML template */
  monthlyTemplatePath: string;
  /** Page dimensions */
  dimensions: PageDimensions;
  /** Year to generate */
  year: number;
  /** Locale for date formatting */
  locale: SupportedLocale;
  /** Color mode (e.g., 'dark'). Omit for default. */
  colorMode?: string;
  /** Output file path */
  outputPath: string;
  /** Progress callback */
  onProgress?: (phase: string, detail: string) => void;
}

// ─── Parsed Template (single HTML file → head + page body) ──────

interface ParsedPage {
  /** Everything before <body> (doctype, head, styles) */
  headHTML: string;
  /** Inner content of <div class="page"> */
  pageBody: string;
}

/**
 * Parse a single-page HTML template into head + page body.
 * Each v2 template contains exactly one <div class="page">.
 */
function parseSinglePageTemplate(html: string): ParsedPage {
  // Extract everything up to and including <body...>
  const bodyMatch = html.match(/<body[^>]*>/);
  if (!bodyMatch || bodyMatch.index === undefined) {
    throw new Error('Template has no <body> tag');
  }
  const headHTML = html.substring(0, bodyMatch.index + bodyMatch[0].length);

  // Extract inner content of <div class="page"...>
  const pageOpenMatch = html.match(/<div\s+class="page"[^>]*>/);
  if (!pageOpenMatch || pageOpenMatch.index === undefined) {
    throw new Error('Template has no <div class="page">');
  }
  const contentStart = pageOpenMatch.index + pageOpenMatch[0].length;

  // Walk from contentStart counting div nesting to find the matching </div>
  let depth = 1;
  let i = contentStart;
  while (i < html.length && depth > 0) {
    if (html.startsWith('<div', i)) {
      depth++;
      i += 4;
    } else if (html.startsWith('</div>', i)) {
      depth--;
      if (depth === 0) break;
      i += 6;
    } else {
      i++;
    }
  }

  const pageBody = html.substring(contentStart, i);
  return { headHTML, pageBody };
}

// ─── Date Formatting ────────────────────────────────────────────

/**
 * Format a date as "1 Jan", "15 Feb", etc.
 */
function formatDateLabel(date: Date, locale: SupportedLocale): string {
  const monthNames = getMonthNames(locale, 'short');
  return `${date.getDate()} ${monthNames[date.getMonth()]}`;
}

/**
 * Get short day name for a date.
 */
function getDayLabel(date: Date, locale: SupportedLocale): string {
  const dayNames = getDayNames(locale, 'short', 1);
  const dow = date.getDay();
  // getDayNames with weekStart=1 gives Mon-Sun (indices 0-6)
  // JS getDay gives 0=Sun, 1=Mon...6=Sat
  const idx = dow === 0 ? 6 : dow - 1;
  return dayNames[idx];
}

// ─── Date Injection ─────────────────────────────────────────────

/**
 * Inject date and page-num into the Today template body.
 *
 * data-inject="date" pattern in today:
 *   <span class="date-field" data-inject="date"></span>
 *   → replace inner content of the span
 *
 * data-inject="page-num" pattern in today:
 *   <span data-inject="page-num">1 / 2</span>
 */
function injectTodayData(
  pageBody: string,
  entry: DayEntry,
  pageInDay: number,
  pagesInDay: number,
): string {
  let html = pageBody;

  // Inject date: replace content after data-inject="date">
  html = html.replace(
    /data-inject="date">([^<]*)<\/span>/g,
    `data-inject="date">${entry.dateLabel} ${entry.year}</span>`,
  );

  // Inject page-num: replace content after data-inject="page-num">
  html = html.replace(
    /data-inject="page-num">[^<]*/g,
    `data-inject="page-num">${entry.dateLabel} · ${pageInDay}/${pagesInDay}`,
  );

  return html;
}

/**
 * Inject date and page-num into the Reflect template body.
 *
 * data-inject="date" pattern in reflect:
 *   <span data-inject="date"><span class="date-field"></span></span>
 *   → replace inner content (the nested span) with date text
 *
 * data-inject="page-num" pattern in reflect:
 *   <span class="page-num" data-inject="page-num">2 / 2</span>
 */
function injectReflectData(
  pageBody: string,
  entry: DayEntry,
  pageInDay: number,
  pagesInDay: number,
): string {
  let html = pageBody;

  // Inject date: the reflect template nests a child span inside data-inject="date"
  html = html.replace(
    /data-inject="date"><[^<]*<\/span>/g,
    `data-inject="date">${entry.dateLabel} ${entry.year}</span>`,
  );

  // Inject page-num
  html = html.replace(
    /data-inject="page-num">[^<]*/g,
    `data-inject="page-num">${entry.dateLabel} · ${pageInDay}/${pagesInDay}`,
  );

  return html;
}

/**
 * Inject week date range into the Weekly Review template body.
 *
 * data-inject="week-date" pattern:
 *   <span class="date-field" data-inject="week-date"></span>
 *   → replace content with "29 Dec – 4 Jan"
 */
function injectWeeklyData(
  pageBody: string,
  weekEndDate: Date,
  locale: SupportedLocale,
  year: number,
): string {
  let html = pageBody;

  const weekEndLabel = formatDateLabel(weekEndDate, locale);
  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekStartLabel = formatDateLabel(weekStartDate, locale);

  // Inject week-date
  html = html.replace(
    /data-inject="week-date">([^<]*)<\/span>/g,
    `data-inject="week-date">${weekStartLabel} – ${weekEndLabel}</span>`,
  );

  return html;
}

/**
 * Inject month name into the Monthly Review template body.
 *
 * data-inject="month-name" pattern:
 *   <span class="date-field" data-inject="month-name"></span>
 *   → replace content with "January 2026"
 */
function injectMonthlyData(
  pageBody: string,
  monthName: string,
  year: number,
): string {
  let html = pageBody;

  html = html.replace(
    /data-inject="month-name">([^<]*)<\/span>/g,
    `data-inject="month-name">${monthName} ${year}</span>`,
  );

  return html;
}

// ─── Month Navigation Tab Bar ───────────────────────────────────

/**
 * Generate the month tab bar CSS.
 */
function getTabBarCSS(): string {
  return `
    .month-tab-bar {
      display: flex;
      gap: 0;
      margin-bottom: 2mm;
      flex-shrink: 0;
      border-radius: 2mm;
      overflow: hidden;
      border: 0.4px solid var(--border);
    }
    .month-tab {
      flex: 1;
      text-align: center;
      padding: 1.5mm 0;
      font-family: var(--font-sans);
      font-size: 5.5pt;
      font-weight: 600;
      color: var(--muted-foreground);
      background: var(--card);
      border-right: 0.3px solid var(--rule-light);
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .month-tab:last-child { border-right: none; }
    .month-tab.active {
      background: var(--accent);
      color: white;
    }
  `;
}

/**
 * Generate the month tab bar HTML for a given active month.
 */
function generateTabBar(activeMonth: number, locale: SupportedLocale): string {
  const monthNames = getMonthNames(locale, 'short');
  const tabs = monthNames.map((name, i) => {
    const activeClass = (i + 1) === activeMonth ? ' active' : '';
    return `<div class="month-tab${activeClass}" data-month="${i + 1}">${name}</div>`;
  }).join('');

  return `<div class="month-tab-bar">${tabs}</div>`;
}

// ─── Page Count Computation ─────────────────────────────────────

/**
 * Compute expected page counts for a year.
 * Pure calculation — no I/O or side effects.
 */
export function computePageCounts(year: number): {
  dailyPages: number;
  weeklyPages: number;
  monthlyPages: number;
  totalPages: number;
} {
  const totalDays = isLeapYear(year) ? 366 : 365;
  const dailyPages = totalDays * 2; // Today + Reflect per day

  // Count Sundays in the year
  let weeklyPages = 0;
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(year, 0, 1 + d);
    if (date.getDay() === 0) weeklyPages++;
  }

  const monthlyPages = 12; // One per month

  return {
    dailyPages,
    weeklyPages,
    monthlyPages,
    totalPages: dailyPages + weeklyPages + monthlyPages,
  };
}

// ─── Year Day List Builder ──────────────────────────────────────

/**
 * Generate the list of all days in a year with metadata.
 *
 * Each entry includes flags for whether it's a Sunday (weekly review)
 * and/or the last day of its month (monthly review).
 */
export function buildDayEntries(year: number, locale: SupportedLocale): DayEntry[] {
  const totalDays = isLeapYear(year) ? 366 : 365;
  const entries: DayEntry[] = [];

  for (let d = 0; d < totalDays; d++) {
    const date = new Date(year, 0, 1 + d);
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;
    const dayOfMonth = date.getDate();

    // Check if this is the last day of the month
    const nextDay = new Date(year, 0, 2 + d);
    const isLastDayOfMonth = nextDay.getMonth() + 1 !== month;

    entries.push({
      date,
      day: dayOfMonth,
      month,
      year,
      dayOfWeek,
      includeWeeklyReview: dayOfWeek === 0, // Sunday
      includeMonthlyReview: isLastDayOfMonth,
      dateLabel: formatDateLabel(date, locale),
      dayName: getDayLabel(date, locale),
    });
  }

  return entries;
}

/**
 * Group day entries by month.
 */
function groupByMonth(entries: DayEntry[]): Map<number, DayEntry[]> {
  const groups = new Map<number, DayEntry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.month) || [];
    existing.push(entry);
    groups.set(entry.month, existing);
  }
  return groups;
}

/**
 * Calculate the number of pages for a single day.
 *
 * - Regular day: 2 (Today + Reflect)
 * - Sunday: 3 (Today + Reflect + Weekly)
 * - Last day of month (not Sunday): 3 (Today + Reflect + Monthly)
 * - Last day of month on Sunday: 4 (Today + Reflect + Weekly + Monthly)
 */
function pagesForDay(entry: DayEntry): number {
  let count = 2; // Today + Reflect
  if (entry.includeWeeklyReview) count++;
  if (entry.includeMonthlyReview) count++;
  return count;
}

// ─── Month HTML Document Builder ────────────────────────────────

interface TemplateSet {
  today: ParsedPage;
  reflect: ParsedPage;
  weekly: ParsedPage;
  monthly: ParsedPage;
}

/**
 * Build a complete HTML document for one month's pages.
 * Combines all daily, weekly, and monthly pages for a single month
 * into one HTML document that Puppeteer renders as a multi-page PDF.
 */
function buildMonthHTML(
  templates: TemplateSet,
  days: DayEntry[],
  activeMonth: number,
  locale: SupportedLocale,
  year: number,
): { html: string; pageCount: number } {
  const monthNames = getMonthNames(locale, 'long');
  let pageCount = 0;
  const allPages: string[] = [];

  for (const day of days) {
    const totalPagesInDay = pagesForDay(day);
    let pageInDay = 0;

    // ── Page 1: Today ───────────────────────────────────
    pageInDay++;
    const todayBody = injectTodayData(
      templates.today.pageBody,
      day,
      pageInDay,
      totalPagesInDay,
    );
    const todayTabBar = generateTabBar(activeMonth, locale);
    allPages.push(`<div class="page">${todayTabBar}${todayBody}</div>`);
    pageCount++;

    // ── Page 2: Reflect ─────────────────────────────────
    pageInDay++;
    const reflectBody = injectReflectData(
      templates.reflect.pageBody,
      day,
      pageInDay,
      totalPagesInDay,
    );
    const reflectTabBar = generateTabBar(activeMonth, locale);
    allPages.push(`<div class="page">${reflectTabBar}${reflectBody}</div>`);
    pageCount++;

    // ── Page 3 (optional): Weekly Review ────────────────
    if (day.includeWeeklyReview) {
      pageInDay++;
      const weeklyBody = injectWeeklyData(
        templates.weekly.pageBody,
        day.date,
        locale,
        year,
      );
      const weeklyTabBar = generateTabBar(activeMonth, locale);
      allPages.push(`<div class="page">${weeklyTabBar}${weeklyBody}</div>`);
      pageCount++;
    }

    // ── Page 3 or 4 (optional): Monthly Review ──────────
    if (day.includeMonthlyReview) {
      pageInDay++;
      const monthlyBody = injectMonthlyData(
        templates.monthly.pageBody,
        monthNames[activeMonth - 1],
        year,
      );
      const monthlyTabBar = generateTabBar(activeMonth, locale);
      allPages.push(`<div class="page">${monthlyTabBar}${monthlyBody}</div>`);
      pageCount++;
    }
  }

  // Build complete HTML document
  // CRITICAL: merge CSS from ALL 4 templates — each has unique CSS classes.
  // Only using Today's head strips styling from Reflect/Weekly/Monthly pages,
  // causing them to render as plain text without cards, circles, etc.
  function extractStyleBlocks(headHTML: string): string {
    const styles: string[] = [];
    const re = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let m;
    while ((m = re.exec(headHTML)) !== null) {
      styles.push(m[1]);
    }
    return styles.join('\n\n');
  }

  const todayCSS = extractStyleBlocks(templates.today.headHTML);
  const reflectCSS = extractStyleBlocks(templates.reflect.headHTML);
  const weeklyCSS = extractStyleBlocks(templates.weekly.headHTML);
  const monthlyCSS = extractStyleBlocks(templates.monthly.headHTML);

  const tabCSS = getTabBarCSS();
  const printCSS = `
    @page { size: A4 portrait; margin: 0; }
    body { background: white; margin: 0; padding: 0; }
    .page { margin: 0; box-shadow: none; page-break-after: always; page-break-inside: avoid; }
    .page:last-child { page-break-after: auto; }
  `;

  // Extract the Google Fonts link from today's head
  const fontLinkMatch = templates.today.headHTML.match(/<link[^>]*fonts\.googleapis\.com[^>]*>/);
  const fontLink = fontLinkMatch ? fontLinkMatch[0] : '';
  const preconnect = '<link rel="preconnect" href="https://fonts.googleapis.com">';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADHD v2 — ${getMonthNames(locale, 'long')[activeMonth - 1]} ${year}</title>
  ${preconnect}
  ${fontLink}
  <style id="today-css">${todayCSS}</style>
  <style id="reflect-css">${reflectCSS}</style>
  <style id="weekly-css">${weeklyCSS}</style>
  <style id="monthly-css">${monthlyCSS}</style>
  <style id="month-tabs">${tabCSS}</style>
  <style id="multipage-print">${printCSS}</style>
</head>
<body>
${allPages.join('\n\n')}
</body>
</html>`;

  return { html, pageCount };
}

// ─── Hyperlink & Bookmark Builder ───────────────────────────────

/**
 * Compute the page index where each month starts in the merged PDF.
 */
function computeMonthStartPages(monthPages: MonthPages[]): Map<number, number> {
  const starts = new Map<number, number>();
  let cumulative = 0;
  for (const mp of monthPages) {
    starts.set(mp.month, cumulative);
    cumulative += mp.pageCount;
  }
  return starts;
}

/**
 * Build hyperlinks for the month tab bar on every page.
 *
 * Tab bar is 12 equally-spaced buttons at the top of each page.
 * Dimensions are computed from the page padding and bar height.
 *
 * Tab bar position in CSS coordinates (from page top-left):
 * - Margin: 14mm = ~39.7pt from each edge
 * - Tab bar height: ~6mm = ~18pt (generous tap target for GoodNotes)
 * - Each tab: (pageWidth - 2*margin) / 12 wide
 */
function buildMonthTabHyperlinks(
  totalPages: number,
  monthStartPages: Map<number, number>,
  dimensions: PageDimensions,
): PDFHyperlink[] {
  const links: PDFHyperlink[] = [];

  const margin = 39.7; // 14mm in points
  const tabBarY = margin;
  const tabBarHeight = 18; // ~6mm in points
  const contentWidth = dimensions.width - 2 * margin;
  const tabWidth = contentWidth / 12;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    for (let month = 1; month <= 12; month++) {
      const destPage = monthStartPages.get(month);
      if (destPage === undefined) continue;

      const x = margin + (month - 1) * tabWidth;
      links.push({
        sourcePageIndex: pageIdx,
        rect: [x, tabBarY, tabWidth, tabBarHeight],
        destinationPageIndex: destPage,
      });
    }
  }

  return links;
}

/**
 * Build bookmark outline for GoodNotes sidebar.
 *
 * Structure:
 *   📅 2026 ADHD v2 Planner
 *     ├── January
 *     │   ├── 1 Jan (Thu) — Today
 *     │   ├── 1 Jan (Thu) — Reflect
 *     │   ├── 2 Jan (Fri) — Today
 *     │   ├── 2 Jan (Fri) — Reflect
 *     │   ├── ...
 *     │   ├── Weekly Review (4 Jan)
 *     │   └── Monthly Review
 *     ├── February
 *     └── ...
 */
function buildBookmarks(
  year: number,
  allDays: DayEntry[],
  monthStartPages: Map<number, number>,
  locale: SupportedLocale,
): PDFBookmark[] {
  const monthNames = getMonthNames(locale, 'long');
  const grouped = groupByMonth(allDays);

  const monthBookmarks: PDFBookmark[] = [];

  for (let m = 1; m <= 12; m++) {
    const days = grouped.get(m) || [];
    const monthStart = monthStartPages.get(m) || 0;

    const children: PDFBookmark[] = [];
    let dayPageOffset = 0;

    for (const day of days) {
      const dayPageBase = monthStart + dayPageOffset;

      // Today page bookmark
      children.push({
        title: `${day.dateLabel} (${day.dayName}) — Today`,
        pageIndex: dayPageBase,
      });

      // Reflect page bookmark
      children.push({
        title: `${day.dateLabel} (${day.dayName}) — Reflect`,
        pageIndex: dayPageBase + 1,
      });

      let extraOffset = 2; // Today + Reflect

      // Weekly review bookmark
      if (day.includeWeeklyReview) {
        children.push({
          title: `Weekly Review (${day.dateLabel})`,
          pageIndex: dayPageBase + extraOffset,
        });
        extraOffset++;
      }

      // Monthly review bookmark
      if (day.includeMonthlyReview) {
        children.push({
          title: `Monthly Review`,
          pageIndex: dayPageBase + extraOffset,
        });
        extraOffset++;
      }

      dayPageOffset += pagesForDay(day);
    }

    monthBookmarks.push({
      title: monthNames[m - 1],
      pageIndex: monthStart,
      children,
    });
  }

  return [{
    title: `📅 ${year} ADHD v2 Planner`,
    pageIndex: 0,
    children: monthBookmarks,
  }];
}

// ─── Main Generator ─────────────────────────────────────────────

/**
 * Generate a full year ADHD v2 planner PDF.
 *
 * Pipeline:
 * 1. Read + parse 4 HTML templates
 * 2. Build day entries for the year
 * 3. Render each month via Puppeteer (batch to avoid OOM)
 * 4. Merge 12 monthly PDFs
 * 5. Add hyperlinked month tabs
 * 6. Add bookmarks for GoodNotes sidebar
 * 7. Add metadata
 * 8. Write to disk
 */
export async function generateDailyYearPlannerV2(
  options: DailyYearV2Options,
): Promise<YearGenerationResult> {
  const startTime = Date.now();
  const {
    todayTemplatePath,
    reflectTemplatePath,
    weeklyTemplatePath,
    monthlyTemplatePath,
    dimensions,
    year,
    locale,
    outputPath,
    colorMode,
    onProgress,
  } = options;

  const log = (phase: string, detail: string) => {
    if (onProgress) onProgress(phase, detail);
    else console.log(`  [${phase}] ${detail}`);
  };

  // ── Step 1: Read & Parse Templates ──────────────────────────
  log('parse', 'Reading 4 HTML templates...');

  const [todayRaw, reflectRaw, weeklyRaw, monthlyRaw] = await Promise.all([
    fs.readFile(todayTemplatePath, 'utf-8'),
    fs.readFile(reflectTemplatePath, 'utf-8'),
    fs.readFile(weeklyTemplatePath, 'utf-8'),
    fs.readFile(monthlyTemplatePath, 'utf-8'),
  ]);

  const templates: TemplateSet = {
    today: parseSinglePageTemplate(todayRaw),
    reflect: parseSinglePageTemplate(reflectRaw),
    weekly: parseSinglePageTemplate(weeklyRaw),
    monthly: parseSinglePageTemplate(monthlyRaw),
  };

  log('parse', 'Parsed: Today, Reflect, Weekly, Monthly templates');

  // ── Step 2: Build Day Entries ───────────────────────────────
  log('plan', `Building day entries for ${year}...`);
  const allDays = buildDayEntries(year, locale);
  const grouped = groupByMonth(allDays);

  const counts = computePageCounts(year);
  const totalSundays = allDays.filter(d => d.includeWeeklyReview).length;
  log('plan', `${allDays.length} days, ${totalSundays} weekly reviews, 12 monthly reviews`);
  log('plan', `Expected: ${counts.dailyPages} daily + ${counts.weeklyPages} weekly + ${counts.monthlyPages} monthly = ${counts.totalPages} pages`);

  // ── Step 3: Render Month by Month ──────────────────────────
  const monthResults: MonthPages[] = [];
  const monthNamesList = getMonthNames(locale, 'long');

  try {
    for (let m = 1; m <= 12; m++) {
      const days = grouped.get(m) || [];
      const monthName = monthNamesList[m - 1];
      log('render', `${monthName} (${days.length} days)...`);

      const { html, pageCount } = buildMonthHTML(templates, days, m, locale, year);

      // Render to PDF via Puppeteer with theme injection
      // multiPage: true → CSS @page rules handle page breaks, each .page div → separate PDF page
      const buffer = await renderHTMLToPDF({
        htmlPath: todayTemplatePath, // fallback path; used for color-mode CSS discovery
        dimensions,
        htmlContent: html,
        colorMode,
        multiPage: true,
      });

      monthResults.push({
        month: m,
        monthName,
        pageCount,
        buffer,
      });

      log('render', `  ✓ ${monthName}: ${pageCount} pages (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);
    }
  } finally {
    // Always close browser, even if a month render throws
    await closeBrowser();
  }

  // ── Step 4: Merge Monthly PDFs ─────────────────────────────
  log('merge', 'Merging 12 monthly PDFs...');
  const monthBuffers = monthResults.map(m => m.buffer);
  let mergedBuffer = await mergePDFs(monthBuffers);
  log('merge', `Merged: ${(mergedBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  // ── Step 5: Compute Page Offsets ───────────────────────────
  const monthStartPages = computeMonthStartPages(monthResults);
  const totalPages = monthResults.reduce((sum, m) => sum + m.pageCount, 0);

  // Sanity check: actual page count should match expected
  if (totalPages !== counts.totalPages) {
    log('warn', `Page count mismatch: expected ${counts.totalPages}, got ${totalPages}`);
  }

  // ── Step 6: Add Hyperlinks + Bookmarks + Metadata ──────────
  log('postprocess', 'Adding month tab hyperlinks...');
  const hyperlinks = buildMonthTabHyperlinks(totalPages, monthStartPages, dimensions);
  log('postprocess', `  ${hyperlinks.length} hyperlinks across ${totalPages} pages`);

  log('postprocess', 'Adding bookmarks...');
  const bookmarks = buildBookmarks(year, allDays, monthStartPages, locale);

  mergedBuffer = await postProcessPDF(mergedBuffer, {
    metadata: {
      title: `ADHD v2 Planner ${year}`,
      author: 'goodnotes-templates',
      subject: `Full year ADHD v2 planner for ${year}${colorMode ? ` — ${colorMode} mode` : ''}`,
      keywords: ['planner', 'adhd', 'adhd-v2', 'daily', 'goodnotes', String(year), ...(colorMode ? [colorMode] : [])],
      creator: 'goodnotes-templates v2.0.0',
      producer: 'pdf-lib + Puppeteer',
    },
    hyperlinks,
    bookmarks,
  });

  // ── Step 7: Write to Disk ──────────────────────────────────
  log('write', `Writing to ${outputPath}...`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, mergedBuffer);

  const generationTime = Date.now() - startTime;
  const fileSize = mergedBuffer.length;

  log('done', `✅ ${totalPages} pages, ${(fileSize / 1024 / 1024).toFixed(1)} MB in ${(generationTime / 1000).toFixed(1)}s`);

  return {
    outputPath,
    totalPages,
    fileSize,
    generationTime,
    monthBreakdown: monthResults.map(m => ({
      month: m.monthName,
      pages: m.pageCount,
    })),
  };
}
