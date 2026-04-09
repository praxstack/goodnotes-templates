/**
 * 3-month test (Jan-Mar) to verify cross-month tab links work.
 * Expected: ~200 pages with links jumping between Jan/Feb/Mar sections.
 * Usage: npx tsx scripts/test-3month.ts
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';
import { renderHTMLToPDF, closeBrowser } from '../src/core/puppeteer-renderer.js';
import { postProcessPDF } from '../src/core/pdf-postprocess.js';
import { getMonthNames } from '../src/utils/locale.js';
import type { PDFHyperlink, PDFBookmark } from '../src/types/index.js';

async function main() {
  console.log('\n🧪 3-month test (Jan-Mar) — verifying cross-month links\n');
  const startTime = Date.now();
  const theme = getTheme('warm-neutral');
  const dims = getPageDimensions('a4', 'portrait');
  const monthNames = getMonthNames('en', 'short');
  const monthNamesLong = getMonthNames('en', 'long');
  const year = 2026;

  // Read templates
  const todayHTML = await fs.readFile('src/templates/html/adhd-v2-today.html', 'utf-8');
  const reflectHTML = await fs.readFile('src/templates/html/adhd-v2-reflect.html', 'utf-8');
  const weeklyHTML = await fs.readFile('src/templates/html/adhd-v2-weekly.html', 'utf-8');
  const monthlyHTML = await fs.readFile('src/templates/html/adhd-v2-monthly.html', 'utf-8');

  function extractStyleBlocks(html: string): string {
    const styles: string[] = [];
    const re = /<style[^>]*>([\s\S]*?)<\/style>/g;
    let m;
    while ((m = re.exec(html)) !== null) styles.push(m[1]);
    return styles.join('\n\n');
  }

  function extractBodyContent(html: string): string {
    const bodyIdx = html.indexOf('<body');
    const bodyEnd = html.indexOf('>', bodyIdx) + 1;
    const closeBodyIdx = html.indexOf('</body>');
    return html.substring(bodyEnd, closeBodyIdx).trim();
  }

  const tabBarCSS = `
    .month-tab-bar { display: flex; gap: 0; margin-bottom: 2mm; flex-shrink: 0; border-radius: 2mm; overflow: hidden; border: 0.4px solid var(--rule); }
    .month-tab { flex: 1; text-align: center; padding: 1.5mm 0; font-family: var(--font-body); font-size: 5.5pt; font-weight: 600; color: var(--ink-3); background: var(--surface); border-right: 0.3px solid var(--rule-light); cursor: pointer; text-transform: uppercase; letter-spacing: 0.03em; display: flex; align-items: center; justify-content: center; }
    .month-tab:last-child { border-right: none; }
    .month-tab.active { background: var(--accent); color: white; }
  `;

  const todayBody = extractBodyContent(todayHTML);
  const reflectBody = extractBodyContent(reflectHTML);
  const weeklyBody = extractBodyContent(weeklyHTML);
  const monthlyBody = extractBodyContent(monthlyHTML);

  const pages: string[] = [];
  const monthStartPages: number[] = [];
  let pageCount = 0;
  const daysInMonths = [31, 28, 31]; // Jan, Feb, Mar 2026

  for (let monthIdx = 0; monthIdx < 3; monthIdx++) {
    monthStartPages.push(pageCount);
    const monthNum = monthIdx + 1;
    const daysInMonth = daysInMonths[monthIdx];

    // Tab bar with active month highlighted
    const tabBarHTML = `<div class="month-tab-bar">${monthNames.map((m, i) =>
      `<div class="month-tab${i === monthIdx ? ' active' : ''}" data-month="${i+1}">${m}</div>`
    ).join('')}</div>`;

    function injectTabBar(html: string): string {
      return html.replace(/<div class="page"([^>]*)>/, `<div class="page"$1>${tabBarHTML}`);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIdx, d);
      const dayOfWeek = date.getDay();
      const dateLabel = `${d} ${monthNames[monthIdx]}`;
      const isSunday = dayOfWeek === 0;
      const isLastDay = d === daysInMonth;
      const pagesInDay = 2 + (isSunday ? 1 : 0) + (isLastDay ? 1 : 0);

      // Month anchor on first day
      const monthAnchor = d === 1 ? `<span id="month-${monthNum}"></span>` : '';

      // Today page
      let today = todayBody;
      today = today.replace(/data-inject="date">[^<]*/g, `data-inject="date">${dateLabel} ${year}`);
      today = today.replace(/data-inject="page-num">[^<]*/g, `data-inject="page-num">${dateLabel} · 1/${pagesInDay}`);
      let todayFinal = injectTabBar(today);
      if (monthAnchor) todayFinal = todayFinal.replace(/<div class="page"([^>]*)>/, `<div class="page"$1>${monthAnchor}`);
      pages.push(todayFinal);
      pageCount++;

      // Reflect page
      let reflect = reflectBody;
      reflect = reflect.replace(/data-inject="date">[^<]*/g, `data-inject="date">${dateLabel} ${year}`);
      reflect = reflect.replace(/data-inject="page-num">[^<]*/g, `data-inject="page-num">${dateLabel} · 2/${pagesInDay}`);
      pages.push(injectTabBar(reflect));
      pageCount++;

      // Weekly on Sunday
      if (isSunday) {
        let weekly = weeklyBody;
        const weekStartDate = new Date(date);
        weekStartDate.setDate(weekStartDate.getDate() - 6);
        const weekStart = `${weekStartDate.getDate()} ${monthNames[weekStartDate.getMonth()]}`;
        weekly = weekly.replace(/data-inject="week-date">[^<]*/g, `data-inject="week-date">${weekStart} – ${dateLabel}`);
        pages.push(injectTabBar(weekly));
        pageCount++;
      }

      // Monthly on last day
      if (isLastDay) {
        let monthly = monthlyBody;
        monthly = monthly.replace(/data-inject="month-name">[^<]*/g, `data-inject="month-name">${monthNamesLong[monthIdx]} ${year}`);
        pages.push(injectTabBar(monthly));
        pageCount++;
      }
    }
  }

  console.log(`  📋 ${pageCount} pages (${monthStartPages.map((p,i) => `${monthNames[i]}:p${p}`).join(', ')})`);

  // Build HTML
  const fullHTML = `<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>${extractStyleBlocks(todayHTML)}</style>
    <style>${extractStyleBlocks(reflectHTML)}</style>
    <style>${extractStyleBlocks(weeklyHTML)}</style>
    <style>${extractStyleBlocks(monthlyHTML)}</style>
    <style>${tabBarCSS}</style>
    <style>@page{size:A4 portrait;margin:0}body{background:white;margin:0;padding:0}.page{margin:0;box-shadow:none;page-break-after:always;page-break-inside:avoid}.page:last-child{page-break-after:auto}</style>
  </head><body>${pages.join('\n')}</body></html>`;

  // Render
  console.log('  🖨  Rendering...');
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderHTMLToPDF({ htmlPath: '', theme, dimensions: dims, htmlContent: fullHTML, multiPage: true });
    console.log(`     Raw: ${(pdfBuffer.length/1024/1024).toFixed(1)} MB`);
  } finally { await closeBrowser(); }

  // Post-process with CROSS-MONTH links
  console.log('  🔗 Adding cross-month hyperlinks...');
  const margin = 39.7, tabH = 18;
  const contentW = dims.width - 2 * margin;
  const tabW = contentW / 12;

  const hyperlinks: PDFHyperlink[] = [];
  for (let pageIdx = 0; pageIdx < pageCount; pageIdx++) {
    for (let month = 1; month <= 12; month++) {
      // Link to actual month start page (or page 0 if month doesn't exist)
      const destPage = month <= 3 ? monthStartPages[month - 1] : 0;
      const x = margin + (month - 1) * tabW;
      hyperlinks.push({ sourcePageIndex: pageIdx, rect: [x, margin, tabW, tabH], destinationPageIndex: destPage });
    }
  }
  console.log(`     ${hyperlinks.length} hyperlinks`);
  console.log(`     JAN→p${monthStartPages[0]}, FEB→p${monthStartPages[1]}, MAR→p${monthStartPages[2]}`);

  // Bookmarks
  const bookmarks: PDFBookmark[] = [{
    title: '📅 Jan-Mar 2026', pageIndex: 0,
    children: [
      { title: 'January', pageIndex: monthStartPages[0] },
      { title: 'February', pageIndex: monthStartPages[1] },
      { title: 'March', pageIndex: monthStartPages[2] },
    ],
  }];

  pdfBuffer = await postProcessPDF(pdfBuffer, {
    metadata: { title: 'ADHD v2 — Jan-Mar 2026', author: 'goodnotes-templates', subject: '3-month link test', keywords: ['test'], creator: 'goodnotes-templates', producer: 'pdf-lib + Puppeteer' },
    hyperlinks,
    bookmarks,
  });

  const outputPath = 'output/templates/adhd-v2-3month-2026.pdf';
  await fs.mkdir('output/templates', { recursive: true });
  await fs.writeFile(outputPath, pdfBuffer);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  ✅ ${outputPath}`);
  console.log(`     ${pageCount} pages, ${(pdfBuffer.length/1024/1024).toFixed(1)} MB, ${elapsed}s`);
  console.log(`\n  🧪 TEST: Scroll to any page, click FEB tab → should jump to page ${monthStartPages[1]}`);
  console.log(`  🧪 TEST: Click MAR tab → should jump to page ${monthStartPages[2]}\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
