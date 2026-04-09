/**
 * Quick integration test — generate January 2026 only for ADHD v2 planner.
 * Expected: ~67 pages (31×2 daily + ~4 weekly + 1 monthly = 67)
 *
 * Usage: npx tsx scripts/test-adhd-v2-jan.ts [theme]
 * Example: npx tsx scripts/test-adhd-v2-jan.ts warm-neutral
 * Example: npx tsx scripts/test-adhd-v2-jan.ts midnight
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';
import { renderHTMLToPDF, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { mergePDFs, postProcessPDF } from '../src/core/pdf-postprocess.js';
import { getMonthNames, isLeapYear } from '../src/utils/locale.js';
import type { SupportedLocale } from '../src/utils/locale.js';

const themeName = process.argv[2] || 'warm-neutral';
const year = 2026;
const locale: SupportedLocale = 'en';

async function main() {
  console.log(`\n🧪 ADHD v2 — January ${year} test (${themeName} theme)\n`);
  const startTime = Date.now();
  
  const theme = getTheme(themeName);
  const dims = getPageDimensions('a4', 'portrait');
  
  // Read all 4 templates
  const todayHTML = await fs.readFile('src/templates/html/adhd-v2-today.html', 'utf-8');
  const reflectHTML = await fs.readFile('src/templates/html/adhd-v2-reflect.html', 'utf-8');
  const weeklyHTML = await fs.readFile('src/templates/html/adhd-v2-weekly.html', 'utf-8');
  const monthlyHTML = await fs.readFile('src/templates/html/adhd-v2-monthly.html', 'utf-8');

  const monthNames = getMonthNames(locale, 'short');
  const monthNamesLong = getMonthNames(locale, 'long');
  
  // Build January days
  const janDays: Array<{date: Date; day: number; dayOfWeek: number; dateLabel: string; isSunday: boolean; isLastDay: boolean}> = [];
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, 0, d);
    janDays.push({
      date,
      day: d,
      dayOfWeek: date.getDay(),
      dateLabel: `${d} ${monthNames[0]}`,
      isSunday: date.getDay() === 0,
      isLastDay: d === 31,
    });
  }
  
  // Build pages HTML
  const pages: string[] = [];
  const tabBarCSS = `
    .month-tab-bar { display: flex; gap: 0; margin-bottom: 2mm; flex-shrink: 0; border-radius: 2mm; overflow: hidden; border: 0.4px solid var(--rule); }
    .month-tab { flex: 1; text-align: center; padding: 1.5mm 0; font-family: var(--font-body); font-size: 5.5pt; font-weight: 600; color: var(--ink-3); background: var(--surface); border-right: 0.3px solid var(--rule-light); cursor: pointer; text-transform: uppercase; letter-spacing: 0.03em; }
    .month-tab:last-child { border-right: none; }
    .month-tab.active { background: var(--accent); color: white; }
  `;
  
  // Use <a> tags for tabs — Puppeteer converts these to native PDF links automatically.
  // This is MORE RELIABLE than adding /GoTo annotations post-hoc with pdf-lib.
  // Each tab links to an anchor (#month-N) that we place at the start of each month section.
  const tabBarHTML = `<div class="month-tab-bar">${monthNames.map((m, i) => 
    `<a href="#month-${i+1}" class="month-tab${i === 0 ? ' active' : ''}" style="text-decoration:none;color:inherit;">${m}</a>`
  ).join('')}</div>`;
  
  // Extract the FULL body content from each template (everything between <body> and </body>)
  function extractBodyContent(html: string): string {
    const bodyIdx = html.indexOf('<body');
    const bodyEnd = html.indexOf('>', bodyIdx) + 1;
    const closeBodyIdx = html.indexOf('</body>');
    return html.substring(bodyEnd, closeBodyIdx).trim();
  }
  
  // Pre-extract the body HTML for each template type (includes <div class="page">...</div>)
  const todayBody = extractBodyContent(todayHTML);
  const reflectBody = extractBodyContent(reflectHTML);
  const weeklyBody = extractBodyContent(weeklyHTML);
  const monthlyBody = extractBodyContent(monthlyHTML);
  
  // For each page, we inject the tab bar INSIDE the existing .page div (after opening tag)
  function injectTabBar(pageHTML: string, tabBar: string): string {
    // Insert tab bar right after <div class="page"...>
    return pageHTML.replace(/<div class="page"([^>]*)>/, `<div class="page"$1>${tabBar}`);
  }
  
  let pageCount = 0;
  
  for (const day of janDays) {
    const pagesInDay = 2 + (day.isSunday ? 1 : 0) + (day.isLastDay ? 1 : 0);
    
    // Today page — use the FULL page div from today template
    let todayPage = todayBody;
    todayPage = todayPage.replace(/data-inject="date">[^<]*/g, `data-inject="date">${day.dateLabel} ${year}`);
    todayPage = todayPage.replace(/data-inject="page-num">[^<]*/g, `data-inject="page-num">${day.dateLabel} · 1/${pagesInDay}`);
    // Add month anchor on first day of each month (for tab bar navigation)
    const monthAnchor = day.day === 1 ? `<span id="month-1" style="position:absolute;top:0;"></span>` : '';
    // Add day anchor for bookmarks
    const dayAnchor = `<span id="day-${day.day}" style="position:absolute;top:0;"></span>`;
    let todayWithAnchors = injectTabBar(todayPage, tabBarHTML);
    todayWithAnchors = todayWithAnchors.replace(/<div class="page"([^>]*)>/, `<div class="page"$1>${monthAnchor}${dayAnchor}`);
    pages.push(todayWithAnchors);
    pageCount++;
    
    // Reflect page — use the FULL page div from reflect template  
    let reflectPage = reflectBody;
    reflectPage = reflectPage.replace(/data-inject="date">[^<]*/g, `data-inject="date">${day.dateLabel} ${year}`);
    reflectPage = reflectPage.replace(/data-inject="page-num">[^<]*/g, `data-inject="page-num">${day.dateLabel} · 2/${pagesInDay}`);
    pages.push(injectTabBar(reflectPage, tabBarHTML));
    pageCount++;
    
    // Weekly review on Sunday
    if (day.isSunday) {
      const weekEnd = day.dateLabel;
      const weekStartDate = new Date(day.date);
      weekStartDate.setDate(weekStartDate.getDate() - 6);
      const weekStart = `${weekStartDate.getDate()} ${monthNames[weekStartDate.getMonth()]}`;
      
      let weeklyPage = weeklyBody;
      weeklyPage = weeklyPage.replace(/data-inject="week-date">[^<]*/g, `data-inject="week-date">${weekStart} – ${weekEnd}`);
      pages.push(injectTabBar(weeklyPage, tabBarHTML));
      pageCount++;
    }
    
    // Monthly review on last day
    if (day.isLastDay) {
      let monthlyPage = monthlyBody;
      monthlyPage = monthlyPage.replace(/data-inject="month-name">[^<]*/g, `data-inject="month-name">${monthNamesLong[0]} ${year}`);
      pages.push(injectTabBar(monthlyPage, tabBarHTML));
      pageCount++;
    }
  }
  
  console.log(`  📋 ${pageCount} pages built for January`);
  
  // Build complete HTML document
  // CRITICAL: merge CSS from ALL 4 templates — each has its own unique classes.
  // Only using Today's <head> strips styling from Reflect/Weekly/Monthly pages.
  function extractStyleBlocks(html: string): string {
    const styles: string[] = [];
    const re = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      styles.push(m[1]);
    }
    return styles.join('\n\n');
  }
  
  const todayCSS = extractStyleBlocks(todayHTML);
  const reflectCSS = extractStyleBlocks(reflectHTML);
  const weeklyCSS = extractStyleBlocks(weeklyHTML);
  const monthlyCSS = extractStyleBlocks(monthlyHTML);
  
  const fullHTML = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ADHD v2 — January ${year}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style id="today-css">${todayCSS}</style>
    <style id="reflect-css">${reflectCSS}</style>
    <style id="weekly-css">${weeklyCSS}</style>
    <style id="monthly-css">${monthlyCSS}</style>
    <style id="month-tabs">${tabBarCSS}</style>
    <style id="multipage-print">
      @page { size: A4 portrait; margin: 0; }
      body { background: white; margin: 0; padding: 0; }
      .page { margin: 0; box-shadow: none; page-break-after: always; page-break-inside: avoid; }
      .page:last-child { page-break-after: auto; }
    </style>
  </head>
  <body>
    ${pages.join('\n\n')}
  </body>
  </html>`;
  
  // Render
  console.log('  🖨  Rendering PDF...');
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderHTMLToPDF({
      htmlPath: 'src/templates/html/adhd-v2-today.html',
      theme,
      dimensions: dims,
      htmlContent: fullHTML,
      multiPage: true,
    });
    console.log(`     Raw PDF: ${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB`);
  } finally {
    await closeBrowser();
  }

  // ─── Post-process: add hyperlinks + bookmarks + metadata ────
  console.log('  🔗 Adding hyperlinks + bookmarks...');
  
  // Build month tab hyperlinks for every page
  // Tab bar: 12 equally-spaced tabs at top of page
  // For January-only test, all tabs link to page 0 (only January exists)
  const margin = 39.7; // 14mm in points
  const tabBarHeight = 18;
  const contentWidth = dims.width - 2 * margin;
  const tabWidth = contentWidth / 12;
  
  const hyperlinks: Array<{sourcePageIndex: number; rect: [number, number, number, number]; destinationPageIndex: number}> = [];
  for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
    for (let month = 1; month <= 12; month++) {
      // For January-only: all tabs link to page 0
      const destPage = 0;
      const x = margin + (month - 1) * tabWidth;
      hyperlinks.push({
        sourcePageIndex: pageIdx,
        rect: [x, margin, tabWidth, tabBarHeight],
        destinationPageIndex: destPage,
      });
    }
  }
  console.log(`     ${hyperlinks.length} hyperlinks (${pageCount} pages × 12 tabs)`);
  
  // Build bookmarks for GoodNotes sidebar
  const dayBookmarks: Array<{title: string; pageIndex: number}> = [];
  let bkPageIdx = 0;
  for (const day of janDays) {
    dayBookmarks.push({ title: `${day.dateLabel} — Today`, pageIndex: bkPageIdx });
    bkPageIdx++;
    dayBookmarks.push({ title: `${day.dateLabel} — Reflect`, pageIndex: bkPageIdx });
    bkPageIdx++;
    if (day.isSunday) {
      dayBookmarks.push({ title: `Weekly Review (${day.dateLabel})`, pageIndex: bkPageIdx });
      bkPageIdx++;
    }
    if (day.isLastDay) {
      dayBookmarks.push({ title: `Monthly Review — January`, pageIndex: bkPageIdx });
      bkPageIdx++;
    }
  }
  
  const bookmarks = [{
    title: `📅 January ${year} ADHD v2 Planner`,
    pageIndex: 0,
    children: dayBookmarks,
  }];
  console.log(`     ${dayBookmarks.length} bookmarks`);
  
  // Apply post-processing
  pdfBuffer = await postProcessPDF(pdfBuffer, {
    metadata: {
      title: `ADHD v2 Planner — January ${year}`,
      author: 'goodnotes-templates',
      subject: `January ${year} daily planner — ${theme.name} theme`,
      keywords: ['planner', 'adhd', 'daily', 'goodnotes', theme.id, String(year)],
      creator: 'goodnotes-templates v1.0.0',
      producer: 'pdf-lib + Puppeteer',
    },
    hyperlinks,
    bookmarks,
  });
  
  const outputDir = 'output/templates';
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `adhd-v2-jan-${year}-${themeName}.pdf`);
  await fs.writeFile(outputPath, pdfBuffer);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  ✅ ${outputPath}`);
  console.log(`     ${pageCount} pages, ${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB, ${elapsed}s`);
  console.log(`     ✓ ${hyperlinks.length} hyperlinks, ${dayBookmarks.length} bookmarks, metadata added\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
