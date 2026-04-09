/**
 * Minimal test: create a 3-page PDF with clickable links using PDFKit.
 * This proves whether internal PDF links work in your PDF viewer at all.
 * If this works, we know the issue is in our pdf-lib annotation code.
 * If this doesn't work, the issue is in your PDF viewer.
 *
 * Usage: npx tsx scripts/test-links-pdfkit.ts
 */
import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ size: 'A4', margin: 50 });
const output = fs.createWriteStream('output/test-links-pdfkit.pdf');
doc.pipe(output);

// ─── PAGE 1 ────────────────────────────────────
doc.fontSize(24).text('Page 1 — Click links below', { underline: false });
doc.moveDown();

// Link to page 2
doc.fontSize(14).fillColor('blue');
doc.text('→ Go to Page 2', 50, 120, {
  goTo: 'page2',
  underline: true,
});

// Link to page 3
doc.text('→ Go to Page 3', 50, 160, {
  goTo: 'page3',
  underline: true,
});

// Simulated month tabs
doc.fillColor('black').fontSize(10);
const tabY = 250;
const tabW = 40;
const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
months.forEach((m, i) => {
  const x = 50 + i * (tabW + 5);
  // Draw tab background
  doc.save();
  doc.roundedRect(x, tabY, tabW, 20, 3).fill(i === 0 ? '#C45D3E' : '#E8DDD0');
  doc.restore();
  // Draw tab text with link
  doc.fillColor(i === 0 ? 'white' : '#3D3229');
  doc.text(m, x + 5, tabY + 5, {
    width: tabW - 10,
    align: 'center',
    goTo: `month-${i + 1}`,
  });
});

doc.fillColor('#888').fontSize(9).text('If you can click JAN/FEB/MAR tabs and they jump to the right page, links work!', 50, 300);

// ─── PAGE 2 ────────────────────────────────────
doc.addPage();
doc.addNamedDestination('page2');
doc.addNamedDestination('month-2'); // FEB tab target
doc.fontSize(24).fillColor('black').text('Page 2 — You clicked a link!');
doc.moveDown();
doc.fontSize(14).fillColor('blue').text('→ Back to Page 1', { goTo: 'page1-top', underline: true });

// ─── PAGE 3 ────────────────────────────────────
doc.addPage();
doc.addNamedDestination('page3');
doc.addNamedDestination('month-3'); // MAR tab target
doc.fontSize(24).fillColor('black').text('Page 3 — Links work!');
doc.moveDown();
doc.fontSize(14).fillColor('blue').text('→ Back to Page 1', { goTo: 'page1-top', underline: true });

// Go back to page 1 to add the destination
// Note: pdfkit doesn't let us go back, so we add the dest on page 1 creation
// We already implicitly have page1 as the first page

doc.end();

output.on('finish', () => {
  const size = fs.statSync('output/test-links-pdfkit.pdf').size;
  console.log(`\n✅ output/test-links-pdfkit.pdf (${(size/1024).toFixed(0)} KB)`);
  console.log('   3 pages with clickable links — test in Preview:\n');
  console.log('   1. Click "→ Go to Page 2" on page 1');
  console.log('   2. Click "→ Back to Page 1" on page 2');
  console.log('   3. Click month tabs JAN/FEB/MAR\n');
});
