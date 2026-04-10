/**
 * Full Year Daily Planner Generator
 *
 * Takes the ADHD daily planner HTML template and generates a complete
 * year-long journal with:
 * - 4 daily pages per day (Morning Launch Pad, Daily Battle Log, Task Board, Evening Wind-Down)
 * - 1 weekly review page every Sunday
 * - Date injection on every page ("1 Jan", "2 Jan", page "1/4", "2/4", etc.)
 * - Month navigation tab bar on every page (hyperlinked in final PDF)
 * - PDF bookmarks for each month and each day
 *
 * Generation strategy:
 * 1. Parse HTML → extract <head> CSS + 5 page div blocks
 * 2. Loop through each day of the year
 * 3. Render month-by-month via Puppeteer (avoid OOM on 1500+ page docs)
 * 4. Merge 12 monthly PDFs with pdf-lib
 * 5. Add hyperlinks for month tab navigation
 * 6. Add bookmarks for GoodNotes sidebar
 *
 * Output: ~1,512 pages per theme (~150-200 MB)
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

interface DayEntry {
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
  /** Whether this is the last day before a weekly review */
  includeWeeklyReview: boolean;
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

interface YearGenerationResult {
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

// ─── HTML Template Parser ───────────────────────────────────────

interface ParsedTemplate {
  /** Everything before <body> (doctype, head, styles) */
  headHTML: string;
  /** Individual page blocks (the content inside each <div class="page">) */
  pageBlocks: string[];
  /** Page titles for reference */
  pageTitles: string[];
}

/**
 * Parse the ADHD planner HTML into reusable blocks.
 * Extracts the head/CSS and individual page divs.
 *
 * Strategy: use the <!-- ═══ PAGE N --> comment markers as boundaries
 * rather than regex on nested div structures.
 */
function parseTemplate(html: string): ParsedTemplate {
  // Extract everything up to <body>
  const bodyIdx = html.indexOf('<body>');
  const headHTML = html.substring(0, bodyIdx + 6); // includes <body>

  // Split body content by page comment markers
  // Pattern: <!-- ═══...PAGE N...═══ -->
  const bodyContent = html.substring(bodyIdx + 6);
  const pageSections = bodyContent.split(/<!--\s*═+[\s\S]*?═+\s*-->/);

  const pageBlocks: string[] = [];
  const pageTitles: string[] = [];

  for (const section of pageSections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed === '</body>' || trimmed === '</html>' || trimmed === '</body>\n</html>') continue;

    // Extract the inner content of <div class="page">...</div>
    // Find the opening tag and its matching closing tag using nesting depth
    const openTag = '<div class="page">';
    const openIdx = trimmed.indexOf(openTag);
    if (openIdx === -1) continue;

    const contentStart = openIdx + openTag.length;

    // Walk from contentStart counting div nesting to find the matching </div>
    let depth = 1;
    let i = contentStart;
    while (i < trimmed.length && depth > 0) {
      if (trimmed.startsWith('<div', i)) {
        depth++;
        i += 4;
      } else if (trimmed.startsWith('</div>', i)) {
        depth--;
        if (depth === 0) break;
        i += 6;
      } else {
        i++;
      }
    }

    const innerContent = trimmed.substring(contentStart, i);
    if (innerContent.trim()) {
      pageBlocks.push(innerContent);

      // Extract page title
      const titleMatch = innerContent.match(/class="page-title">(.*?)<\/div>/);
      pageTitles.push(titleMatch ? titleMatch[1] : `Page ${pageBlocks.length}`);
    }
  }

  return { headHTML, pageBlocks, pageTitles };
}

// ─── Date Injection ─────────────────────────────────────────────

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
  // So: Mon=index 0, Tue=1, ..., Sun=6
  const idx = dow === 0 ? 6 : dow - 1;
  return dayNames[idx];
}

/**
 * Inject date, page number, and day highlight into a daily page block.
 */
function injectDailyPageData(
  pageBlock: string,
  entry: DayEntry,
  pageInDay: number,
  totalPagesInDay: number,
): string {
  let html = pageBlock;

  // 1. Replace page number: "01 / 05" → "1 Jan · 1/4"
  html = html.replace(
    /class="page-num">.*?<\/div>/,
    `class="page-num">${entry.dateLabel} · ${pageInDay}/${totalPagesInDay}</div>`
  );

  // 2. Fill in the date field
  html = html.replace(
    /<label>Date<\/label><span class="field"><\/span>/,
    `<label>Date</label><span class="field" style="border-bottom-color: transparent; font-size: 7pt; font-weight: 500; color: var(--foreground-secondary)">${entry.dateLabel} ${entry.year}</span>`
  );

  // 3. Highlight the current day circle by position (not letter)
  // Day circles: M T W T F S S — letters duplicate (T for Tue/Thu, S for Sat/Sun)
  // so we use a positional counter to highlight the correct Nth circle
  const activeIdx = entry.dayOfWeek === 0 ? 6 : entry.dayOfWeek - 1;
  let circleCount = 0;
  html = html.replace(/<div class="day-circle">(.*?)<\/div>/g, (match, letter) => {
    const isActive = circleCount === activeIdx;
    circleCount++;
    if (isActive) {
      return `<div class="day-circle" style="background: var(--accent); color: white; border-color: var(--accent); font-weight: 700">${letter}</div>`;
    }
    return match;
  });

  return html;
}

/**
 * Inject data into the weekly review page.
 */
function injectWeeklyPageData(
  pageBlock: string,
  weekEndDate: Date,
  pageInDay: number,
  totalPagesInDay: number,
  locale: SupportedLocale,
  year: number,
): string {
  let html = pageBlock;

  const weekEndLabel = formatDateLabel(weekEndDate, locale);
  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekStartLabel = formatDateLabel(weekStartDate, locale);

  // Replace page number
  html = html.replace(
    /class="page-num">.*?<\/div>/,
    `class="page-num">${weekEndLabel} · ${pageInDay}/${totalPagesInDay}</div>`
  );

  // Fill in "Week of" field
  html = html.replace(
    /<label>Week of<\/label><span class="field"><\/span>/,
    `<label>Week of</label><span class="field" style="border-bottom-color: transparent; font-size: 7pt; font-weight: 500; color: var(--foreground-secondary)">${weekStartLabel} – ${weekEndLabel}</span>`
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

// ─── Month HTML Document Builder ────────────────────────────────

/**
 * Build a complete HTML document for one month's pages.
 * This is what gets sent to Puppeteer for rendering.
 */
function buildMonthHTML(
  parsed: ParsedTemplate,
  days: DayEntry[],
  activeMonth: number,
  locale: SupportedLocale,
  year: number,
): { html: string; pageCount: number } {
  const dailyPages = parsed.pageBlocks.slice(0, 4); // Pages 1-4: daily
  const weeklyPage = parsed.pageBlocks[4];           // Page 5: weekly review

  let pageCount = 0;
  const allPages: string[] = [];

  for (const day of days) {
    const pagesInDay = day.includeWeeklyReview ? 5 : 4;

    // Generate 4 daily pages
    for (let p = 0; p < 4; p++) {
      const injected = injectDailyPageData(
        dailyPages[p],
        day,
        p + 1,
        pagesInDay,
      );
      const tabBar = generateTabBar(activeMonth, locale);
      allPages.push(`<div class="page">${tabBar}${injected}</div>`);
      pageCount++;
    }

    // Generate weekly review if it's a Sunday
    if (day.includeWeeklyReview && weeklyPage) {
      const injected = injectWeeklyPageData(
        weeklyPage,
        day.date,
        5,
        5,
        locale,
        year,
      );
      const tabBar = generateTabBar(activeMonth, locale);
      allPages.push(`<div class="page">${tabBar}${injected}</div>`);
      pageCount++;
    }
  }

  // Build complete HTML document
  // Inject the tab bar CSS + print-specific @page rules
  const tabCSS = `<style id="month-tabs">${getTabBarCSS()}</style>`;
  const printCSS = `<style id="multipage-print">
    @page { size: A4 portrait; margin: 0; }
    body { background: white; }
    .page { margin: 0; box-shadow: none; page-break-after: always; page-break-inside: avoid; }
    .page:last-child { page-break-after: auto; }
  </style>`;
  const headWithTabs = parsed.headHTML
    .replace('</head>', `${tabCSS}\n${printCSS}\n</head>`);

  // Close body and html will come from the original structure
  const html = `${headWithTabs}\n${allPages.join('\n\n')}\n</body>\n</html>`;

  return { html, pageCount };
}

// ─── Year Day List Builder ──────────────────────────────────────

/**
 * Generate the list of all days in a year with metadata.
 */
function buildDayEntries(year: number, locale: SupportedLocale): DayEntry[] {
  const totalDays = isLeapYear(year) ? 366 : 365;
  const entries: DayEntry[] = [];

  for (let d = 0; d < totalDays; d++) {
    const date = new Date(year, 0, 1 + d); // Jan 1 + d days
    const dayOfWeek = date.getDay();

    entries.push({
      date,
      day: date.getDate(),
      month: date.getMonth() + 1,
      year,
      dayOfWeek,
      includeWeeklyReview: dayOfWeek === 0, // Sunday
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
 * The tab bar is 12 equally-spaced buttons at the top of each page.
 * We need to create a hyperlink from each tab to the first page of that month.
 *
 * Tab bar dimensions (CSS-space, from top-left of page):
 * - Tab bar is inside .page padding (14mm = ~39.7pt from each edge)
 * - Tab bar height: ~1.5mm padding top+bottom + font = ~12pt total
 * - Each tab: (pageWidth - 2*margin) / 12 wide
 */
function buildMonthTabHyperlinks(
  totalPages: number,
  monthStartPages: Map<number, number>,
  dimensions: PageDimensions,
): PDFHyperlink[] {
  const links: PDFHyperlink[] = [];

  // Tab bar position in CSS coordinates (from page top-left)
  const margin = 39.7; // 14mm in points
  const tabBarY = margin; // Top of content area
  const tabBarHeight = 18; // ~6mm in points (generous tap target)
  const contentWidth = dimensions.width - 2 * margin;
  const tabWidth = contentWidth / 12;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    for (let month = 1; month <= 12; month++) {
      const destPage = monthStartPages.get(month);
      if (destPage === undefined) continue;

      // Don't create self-link (but it's harmless, GoodNotes handles it)
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
 * Structure:
 *   📅 2026
 *     ├── January
 *     │   ├── 1 Jan (Mon)
 *     │   ├── 2 Jan (Tue)
 *     │   └── ...
 *     ├── February
 *     └── ...
 */
function buildBookmarks(
  year: number,
  allDays: DayEntry[],
  monthStartPages: Map<number, number>,
  monthPageCounts: Map<number, number>,
  locale: SupportedLocale,
): PDFBookmark[] {
  const monthNames = getMonthNames(locale, 'long');
  const grouped = groupByMonth(allDays);

  const monthBookmarks: PDFBookmark[] = [];
  let globalPageIdx = 0;

  for (let m = 1; m <= 12; m++) {
    const days = grouped.get(m) || [];
    const monthStart = monthStartPages.get(m) || 0;

    const dayBookmarks: PDFBookmark[] = [];
    let dayPageOffset = 0;

    for (const day of days) {
      dayBookmarks.push({
        title: `${day.dateLabel} (${day.dayName})`,
        pageIndex: monthStart + dayPageOffset,
      });
      // Each day has 4 pages + optionally 1 weekly = 4 or 5
      dayPageOffset += day.includeWeeklyReview ? 5 : 4;
    }

    monthBookmarks.push({
      title: monthNames[m - 1],
      pageIndex: monthStart,
      children: dayBookmarks,
    });
  }

  return [{
    title: `📅 ${year} ADHD Daily Planner`,
    pageIndex: 0,
    children: monthBookmarks,
  }];
}

// ─── Main Generator ─────────────────────────────────────────────

export interface DailyYearOptions {
  /** Path to the HTML template file */
  templatePath: string;
  /** Page dimensions */
  dimensions: PageDimensions;
  /** Year to generate */
  year: number;
  /** Locale for date formatting */
  locale: SupportedLocale;
  /** Output file path */
  outputPath: string;
  /** Color mode (e.g., 'dark'). Omit for default. */
  colorMode?: string;
  /** Progress callback */
  onProgress?: (phase: string, detail: string) => void;
}

/**
 * Generate a full year daily planner PDF.
 *
 * Pipeline:
 * 1. Parse HTML template
 * 2. Build day entries for the year
 * 3. Render each month via Puppeteer (batch to avoid OOM)
 * 4. Merge 12 monthly PDFs
 * 5. Add hyperlinked month tabs
 * 6. Add bookmarks for GoodNotes sidebar
 * 7. Add metadata
 * 8. Write to disk
 */
export async function generateDailyYearPlanner(
  options: DailyYearOptions,
): Promise<YearGenerationResult> {
  const startTime = Date.now();
  const { templatePath, dimensions, year, locale, outputPath, onProgress, colorMode } = options;

  const log = (phase: string, detail: string) => {
    if (onProgress) onProgress(phase, detail);
    else console.log(`  [${phase}] ${detail}`);
  };

  // ── Step 1: Parse Template ──────────────────────────────────
  log('parse', 'Reading HTML template...');
  const rawHTML = await fs.readFile(templatePath, 'utf-8');
  const parsed = parseTemplate(rawHTML);
  log('parse', `Found ${parsed.pageBlocks.length} page blocks: ${parsed.pageTitles.join(', ')}`);

  if (parsed.pageBlocks.length < 5) {
    throw new Error(
      `Template must have at least 5 page blocks (4 daily + 1 weekly). Found: ${parsed.pageBlocks.length}`
    );
  }

  // ── Step 2: Build Day Entries ───────────────────────────────
  log('plan', `Building day entries for ${year}...`);
  const allDays = buildDayEntries(year, locale);
  const grouped = groupByMonth(allDays);
  const totalDays = allDays.length;
  const totalSundays = allDays.filter(d => d.includeWeeklyReview).length;
  const estimatedPages = totalDays * 4 + totalSundays;
  log('plan', `${totalDays} days, ${totalSundays} weekly reviews, ~${estimatedPages} pages`);

  // ── Step 3: Render Month by Month ──────────────────────────
  const monthResults: MonthPages[] = [];
  const monthNames = getMonthNames(locale, 'long');

  try {
    for (let m = 1; m <= 12; m++) {
      const days = grouped.get(m) || [];
      const monthName = monthNames[m - 1];
      log('render', `${monthName} (${days.length} days)...`);

      const { html, pageCount } = buildMonthHTML(parsed, days, m, locale, year);

      // Render to PDF via Puppeteer with theme injection
      // multiPage: true → uses CSS @page rules for page breaks instead of
      // explicit width/height, so each .page div becomes a separate PDF page
      const buffer = await renderHTMLToPDF({
        htmlPath: templatePath, // not used since we pass htmlContent
        colorMode,
        dimensions,
        htmlContent: html,
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
  const monthPageCounts = new Map(monthResults.map(m => [m.month, m.pageCount]));

  // ── Step 6: Add Hyperlinks + Bookmarks + Metadata ──────────
  log('postprocess', 'Adding month tab hyperlinks...');
  const hyperlinks = buildMonthTabHyperlinks(totalPages, monthStartPages, dimensions);
  log('postprocess', `  ${hyperlinks.length} hyperlinks across ${totalPages} pages`);

  log('postprocess', 'Adding bookmarks...');
  const bookmarks = buildBookmarks(year, allDays, monthStartPages, monthPageCounts, locale);

  mergedBuffer = await postProcessPDF(mergedBuffer, {
    metadata: {
      title: `ADHD Daily Planner ${year}`,
      author: 'goodnotes-templates',
      subject: `Full year daily planner for ${year}${colorMode ? ` — ${colorMode} mode` : ''}`,
      keywords: ['planner', 'adhd', 'daily', 'goodnotes', String(year), ...(colorMode ? [colorMode] : [])],
      creator: 'goodnotes-templates v1.0.0',
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
