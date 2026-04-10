/**
 * Generate a 4-week ADHD planner (compact version).
 * 28 days × 2 pages + 3 weekly reviews + 1 monthly review = 60 pages
 * NO month tab navbar — clean, focused pages.
 *
 * Usage: npx tsx scripts/generate-4week.ts [version] [theme]
 * Example: npx tsx scripts/generate-4week.ts v3 warm-neutral
 */
import fs from 'fs/promises';
import path from 'path';
import { renderHTMLToPDF, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { postProcessPDF } from '../src/core/pdf-postprocess.js';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';
import { getMonthNames } from '../src/utils/locale.js';
import type { PDFBookmark } from '../src/types/index.js';

const version = process.argv[2] || 'v3';
const themeName = process.argv[3] || 'warm-neutral';

async function main() {
  console.log(`\n📓 Generating 4-Week ADHD Planner (${version}, ${themeName})\n`);
  const startTime = Date.now();
  const theme = getTheme(themeName);
  const dims = getPageDimensions('a4', 'portrait');
  const monthNames = getMonthNames('en', 'short');
  const monthNamesLong = getMonthNames('en', 'long');

  // Read templates based on version
  const prefix = `src/templates/html/adhd-${version}`;
  const todayHTML = await fs.readFile(`${prefix}-today.html`, 'utf-8');
  const reflectHTML = await fs.readFile(`${prefix}-reflect.html`, 'utf-8');
  const weeklyHTML = await fs.readFile(`${prefix}-weekly.html`, 'utf-8');
  const monthlyHTML = await fs.readFile(`${prefix}-monthly.html`, 'utf-8');

  // Extract CSS + body from all 4 templates
  function extractStyles(html: string): string {
    const styles: string[] = [];
    const re = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let m;
    while ((m = re.exec(html)) !== null) styles.push(m[1]);
    return styles.join('\n');
  }

  function extractBody(html: string): string {
    const bodyIdx = html.indexOf('<body');
    const bodyEnd = html.indexOf('>', bodyIdx) + 1;
    const closeIdx = html.indexOf('</body>');
    return html.substring(bodyEnd, closeIdx).trim();
  }

  // Build 28 days starting from today (or a fixed start)
  const startDate = new Date(2026, 0, 5); // Monday Jan 5, 2026
  const days: Array<{date: Date; day: number; dateLabel: string; weekNum: number; isWeekEnd: boolean; isMonthEnd: boolean}> = [];
  
  for (let d = 0; d < 28; d++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    const weekNum = Math.floor(d / 7) + 1; // 1-4
    const isWeekEnd = (d + 1) % 7 === 0; // Every 7th day
    const isMonthEnd = d === 27; // Last day of 4 weeks
    
    days.push({
      date,
      day: date.getDate(),
      dateLabel: `${date.getDate()} ${monthNames[date.getMonth()]}`,
      weekNum,
      isWeekEnd,
      isMonthEnd,
    });
  }

  // Get font link from today template
  const fontMatch = todayHTML.match(/<link[^>]*fonts\.googleapis[^>]*>/);
  const fontLink = fontMatch ? fontMatch[0] : '';
  const preconnects = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;

  const todayBody = extractBody(todayHTML);
  const reflectBody = extractBody(reflectHTML);
  const weeklyBody = extractBody(weeklyHTML);
  const monthlyBody = extractBody(monthlyHTML);

  // Build all pages
  const pages: string[] = [];
  let pageCount = 0;

  for (const day of days) {
    const pagesInDay = 2 + (day.isWeekEnd && !day.isMonthEnd ? 1 : 0) + (day.isMonthEnd ? 1 : 0);

    // Today page
    let today = todayBody;
    today = today.replace(/data-inject="date">[^<]*/g, `data-inject="date">${day.dateLabel} 2026`);
    today = today.replace(/data-inject="page-num">[^<]*/g, `data-inject="page-num">${day.dateLabel} · 1/${pagesInDay}`);
    pages.push(today);
    pageCount++;

    // Reflect page
    let reflect = reflectBody;
    reflect = reflect.replace(/data-inject="date">[^<]*/g, `data-inject="date">${day.dateLabel} 2026`);
    reflect = reflect.replace(/data-inject="page-num">[^<]*/g, `data-inject="page-num">${day.dateLabel} · 2/${pagesInDay}`);
    pages.push(reflect);
    pageCount++;

    // Weekly review at end of weeks 1-3 (NOT week 4 — that gets monthly)
    if (day.isWeekEnd && !day.isMonthEnd) {
      let weekly = weeklyBody;
      const weekEndLabel = day.dateLabel;
      const weekStartDate = new Date(day.date);
      weekStartDate.setDate(weekStartDate.getDate() - 6);
      const weekStartLabel = `${weekStartDate.getDate()} ${monthNames[weekStartDate.getMonth()]}`;
      weekly = weekly.replace(/data-inject="week-date">[^<]*/g, `data-inject="week-date">${weekStartLabel} – ${weekEndLabel}`);
      pages.push(weekly);
      pageCount++;
    }

    // Monthly review at the very end (replaces week 4's weekly review)
    if (day.isMonthEnd) {
      let monthly = monthlyBody;
      monthly = monthly.replace(/data-inject="month-name">[^<]*/g, `data-inject="month-name">4-Week Review`);
      pages.push(monthly);
      pageCount++;
    }
  }

  console.log(`  📋 ${pageCount} pages (28 days × 2 + 3 weekly + 1 monthly)`);

  // Build full HTML
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ADHD 4-Week Planner</title>
  ${preconnects}
  ${fontLink}
  <style id="today-css">${extractStyles(todayHTML)}</style>
  <style id="reflect-css">${extractStyles(reflectHTML)}</style>
  <style id="weekly-css">${extractStyles(weeklyHTML)}</style>
  <style id="monthly-css">${extractStyles(monthlyHTML)}</style>
  <style id="print">
    @page { size: A4 portrait; margin: 0; }
    body { background: white; margin: 0; padding: 0; }
    .page { margin: 0; box-shadow: none; page-break-after: always; page-break-inside: avoid; }
    .page:last-child { page-break-after: auto; }
  </style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`;

  // Render PDF
  console.log('  🖨  Rendering...');
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderHTMLToPDF({
      htmlPath: `${prefix}-today.html`,
      theme,
      dimensions: dims,
      htmlContent: fullHTML,
      multiPage: true,
    });
    console.log(`     Raw: ${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB`);
  } finally {
    await closeBrowser();
  }

  // Bookmarks (no hyperlinks since no tab bar)
  console.log('  🔗 Adding bookmarks...');
  const weekBookmarks: PDFBookmark[] = [];
  let bkIdx = 0;
  for (const day of days) {
    const dayBk: PDFBookmark = { title: `${day.dateLabel} — Today`, pageIndex: bkIdx };
    weekBookmarks.push(dayBk);
    bkIdx += 2; // Today + Reflect
    if (day.isWeekEnd && !day.isMonthEnd) bkIdx++; // Weekly
    if (day.isMonthEnd) bkIdx++; // Monthly
  }

  const bookmarks: PDFBookmark[] = [{
    title: '📓 4-Week ADHD Planner',
    pageIndex: 0,
    children: [
      { title: 'Week 1', pageIndex: 0, children: weekBookmarks.slice(0, 7) },
      { title: 'Week 2', pageIndex: 15, children: weekBookmarks.slice(7, 14) },
      { title: 'Week 3', pageIndex: 30, children: weekBookmarks.slice(14, 21) },
      { title: 'Week 4', pageIndex: 45, children: weekBookmarks.slice(21, 28) },
    ],
  }];

  pdfBuffer = await postProcessPDF(pdfBuffer, {
    metadata: {
      title: 'ADHD 4-Week Planner',
      author: 'goodnotes-templates',
      subject: `4-week ADHD planner — ${theme.name} theme`,
      keywords: ['planner', 'adhd', '4-week', 'goodnotes', theme.id],
      creator: 'goodnotes-templates',
      producer: 'pdf-lib + Puppeteer',
    },
    bookmarks,
  });

  const outputPath = `output/templates/adhd-${version}-4week-${themeName}.pdf`;
  await fs.mkdir('output/templates', { recursive: true });
  await fs.writeFile(outputPath, pdfBuffer);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  ✅ ${outputPath}`);
  console.log(`     ${pageCount} pages, ${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB, ${elapsed}s\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
