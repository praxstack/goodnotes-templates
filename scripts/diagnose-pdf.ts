/**
 * Diagnose PDF issues — check structure, links, bookmarks, and visual rendering.
 * Usage: npx tsx scripts/diagnose-pdf.ts
 */
import { PDFDocument, PDFName, PDFArray, PDFDict } from 'pdf-lib';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import path from 'path';

async function inspectPDF(filePath: string) {
  console.log(`\n📋 Inspecting: ${filePath}`);
  const buffer = await fs.readFile(filePath);
  const doc = await PDFDocument.load(buffer);
  const pages = doc.getPages();
  
  console.log(`  Pages: ${pages.length}`);
  console.log(`  Size: ${(buffer.length / 1024).toFixed(0)} KB`);
  console.log(`  Title: ${doc.getTitle() || '(none)'}`);
  console.log(`  Author: ${doc.getAuthor() || '(none)'}`);
  
  // Check page dimensions
  if (pages.length > 0) {
    const p0 = pages[0];
    console.log(`  Page 0 dimensions: ${p0.getWidth().toFixed(1)} × ${p0.getHeight().toFixed(1)} pt`);
    console.log(`  Expected A4: 595.3 × 841.9 pt`);
  }
  
  // Check for annotations (links)
  let totalAnnots = 0;
  let linkAnnots = 0;
  for (let i = 0; i < Math.min(pages.length, 5); i++) {
    const page = pages[i];
    const annots = page.node.get(PDFName.of('Annots'));
    if (annots instanceof PDFArray) {
      const count = annots.size();
      totalAnnots += count;
      // Check types
      for (let j = 0; j < count; j++) {
        const ref = annots.get(j);
        const resolved = doc.context.lookup(ref);
        if (resolved instanceof PDFDict) {
          const subtype = resolved.get(PDFName.of('Subtype'));
          if (subtype?.toString() === '/Link') linkAnnots++;
        }
      }
    }
  }
  console.log(`  Annotations on first 5 pages: ${totalAnnots} total, ${linkAnnots} links`);
  
  // Check for outlines (bookmarks)
  const catalog = doc.catalog;
  const outlines = catalog.get(PDFName.of('Outlines'));
  if (outlines) {
    console.log(`  Bookmarks: ✅ Found (outline ref exists)`);
    const resolved = doc.context.lookup(outlines);
    if (resolved instanceof PDFDict) {
      const count = resolved.get(PDFName.of('Count'));
      console.log(`    Count: ${count?.toString() || '(unknown)'}`);
    }
  } else {
    console.log(`  Bookmarks: ❌ None`);
  }
  
  return { pages: pages.length, hasLinks: linkAnnots > 0, hasBookmarks: !!outlines };
}

async function compareHTMLvsPDF(htmlPath: string, pdfPath: string) {
  console.log(`\n🔍 Comparing HTML vs PDF rendering...`);
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  PDF:  ${pdfPath}`);
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  
  try {
    // Screenshot the HTML
    const htmlPage = await browser.newPage();
    await htmlPage.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 }); // A4 at 96dpi
    const html = await fs.readFile(htmlPath, 'utf-8');
    await htmlPage.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await htmlPage.evaluate(() => document.fonts.ready);
    
    const htmlScreenshot = 'output/screenshots/compare-html.png';
    await htmlPage.screenshot({ path: htmlScreenshot, fullPage: false });
    await htmlPage.close();
    console.log(`  ✓ HTML screenshot: ${htmlScreenshot}`);
    
    // Generate a FRESH PDF (no post-processing) and check it
    const pdfPage = await browser.newPage();
    await pdfPage.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await pdfPage.evaluate(() => document.fonts.ready);
    
    // Method 1: with preferCSSPageSize
    const pdf1 = await pdfPage.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await fs.writeFile('output/screenshots/compare-pdf-cssPageSize.pdf', pdf1);
    console.log(`  ✓ PDF (preferCSSPageSize): ${(pdf1.length / 1024).toFixed(0)} KB`);
    
    // Method 2: with explicit A4 dimensions
    const widthIn = 595.28 / 72;
    const heightIn = 841.89 / 72;
    const pdf2 = await pdfPage.pdf({
      width: `${widthIn}in`,
      height: `${heightIn}in`,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await fs.writeFile('output/screenshots/compare-pdf-explicit.pdf', pdf2);
    console.log(`  ✓ PDF (explicit A4):       ${(pdf2.length / 1024).toFixed(0)} KB`);
    
    // Method 3: with margins
    const pdf3 = await pdfPage.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await fs.writeFile('output/screenshots/compare-pdf-formatA4.pdf', pdf3);
    console.log(`  ✓ PDF (format: A4):        ${(pdf3.length / 1024).toFixed(0)} KB`);
    
    await pdfPage.close();
    
    // Check if @media print is stripping styles
    const checkPage = await browser.newPage();
    await checkPage.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    
    const mediaCheck = await checkPage.evaluate(() => {
      // Check computed styles in print media
      const page = document.querySelector('.page');
      if (!page) return { error: 'No .page element found' };
      
      const computed = getComputedStyle(page);
      return {
        background: computed.background,
        backgroundColor: computed.backgroundColor,
        width: computed.width,
        height: computed.height,
        boxShadow: computed.boxShadow,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
      };
    });
    console.log(`\n  📐 Computed styles on .page:`, JSON.stringify(mediaCheck, null, 4));
    
    // Emulate print media and check
    await checkPage.emulateMediaType('print');
    const printCheck = await checkPage.evaluate(() => {
      const page = document.querySelector('.page');
      if (!page) return { error: 'No .page element found' };
      const computed = getComputedStyle(page);
      return {
        background: computed.background,
        backgroundColor: computed.backgroundColor,
        width: computed.width,
        height: computed.height,
        boxShadow: computed.boxShadow,
      };
    });
    console.log(`  🖨  Print media styles on .page:`, JSON.stringify(printCheck, null, 4));
    
    await checkPage.close();
    
  } finally {
    await browser.close();
  }
}

async function main() {
  await fs.mkdir('output/screenshots', { recursive: true });
  
  // 1. Inspect existing PDFs
  const pdfs = [
    'output/templates/adhd-v2-today-warm-neutral.pdf',
    'output/templates/adhd-v2-jan-2026-warm-neutral.pdf',
  ];
  
  for (const pdf of pdfs) {
    try {
      await inspectPDF(pdf);
    } catch (err) {
      console.log(`  ❌ Error: ${err}`);
    }
  }
  
  // 2. Compare HTML vs PDF rendering
  await compareHTMLvsPDF(
    'src/templates/html/adhd-v2-today.html',
    'output/templates/adhd-v2-today-warm-neutral.pdf'
  );
  
  console.log('\n\n📂 Comparison PDFs written to output/screenshots/');
  console.log('   Open them side-by-side with the HTML to spot differences.\n');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
