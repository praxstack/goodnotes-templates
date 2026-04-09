/**
 * Debug PDF links — dump actual annotation rects and GoTo destinations.
 * Usage: npx tsx scripts/debug-links.ts
 */
import { PDFDocument, PDFName, PDFArray, PDFDict, PDFNumber, PDFRef } from 'pdf-lib';
import fs from 'fs/promises';

async function main() {
  const buffer = await fs.readFile('output/templates/adhd-v2-jan-2026-warm-neutral.pdf');
  const doc = await PDFDocument.load(buffer);
  const pages = doc.getPages();
  
  console.log(`\n📋 PDF: ${pages.length} pages, ${(buffer.length/1024).toFixed(0)} KB\n`);
  
  // Check page 0 annotations in detail
  const page0 = pages[0];
  const pageW = page0.getWidth();
  const pageH = page0.getHeight();
  console.log(`Page 0: ${pageW.toFixed(1)} × ${pageH.toFixed(1)} pt`);
  
  const annots = page0.node.get(PDFName.of('Annots'));
  if (!(annots instanceof PDFArray)) {
    console.log('  ❌ No Annots array on page 0');
    return;
  }
  
  console.log(`  Annotations: ${annots.size()}\n`);
  
  // Inspect first 3 annotations
  for (let i = 0; i < Math.min(annots.size(), 3); i++) {
    const ref = annots.get(i);
    const resolved = doc.context.lookup(ref);
    if (!(resolved instanceof PDFDict)) {
      console.log(`  Annot ${i}: not a dict`);
      continue;
    }
    
    console.log(`  --- Annotation ${i} ---`);
    
    // Subtype
    const subtype = resolved.get(PDFName.of('Subtype'));
    console.log(`  Subtype: ${subtype?.toString()}`);
    
    // Rect
    const rect = resolved.get(PDFName.of('Rect'));
    if (rect instanceof PDFArray) {
      const vals = [];
      for (let j = 0; j < rect.size(); j++) {
        const v = rect.get(j);
        vals.push(v instanceof PDFNumber ? v.value() : v?.toString());
      }
      console.log(`  Rect: [${vals.join(', ')}]`);
      console.log(`    → x1=${vals[0]}, y1=${vals[1]}, x2=${vals[2]}, y2=${vals[3]}`);
      console.log(`    → width=${(vals[2] as number) - (vals[0] as number)}, height=${(vals[3] as number) - (vals[1] as number)}`);
      
      // Sanity check: are coords within page bounds?
      const x1 = vals[0] as number, y1 = vals[1] as number, x2 = vals[2] as number, y2 = vals[3] as number;
      if (x1 < 0 || y1 < 0 || x2 > pageW || y2 > pageH) {
        console.log(`    ⚠️  OUTSIDE PAGE BOUNDS!`);
      }
      if (y2 < y1) {
        console.log(`    ⚠️  Y2 < Y1 — inverted rect!`);
      }
    }
    
    // Border
    const border = resolved.get(PDFName.of('Border'));
    console.log(`  Border: ${border?.toString()}`);
    
    // Action
    const action = resolved.get(PDFName.of('A'));
    if (action) {
      const actionDict = doc.context.lookup(action);
      if (actionDict instanceof PDFDict) {
        const s = actionDict.get(PDFName.of('S'));
        console.log(`  Action S: ${s?.toString()}`);
        const d = actionDict.get(PDFName.of('D'));
        if (d instanceof PDFArray) {
          const destVals = [];
          for (let j = 0; j < d.size(); j++) {
            const v = d.get(j);
            if (v instanceof PDFRef) {
              destVals.push(`ref(${v.objectNumber})`);
            } else {
              destVals.push(v?.toString());
            }
          }
          console.log(`  Dest: [${destVals.join(', ')}]`);
        }
      }
    }
    
    console.log('');
  }
  
  // Also check: what are the expected tab bar positions?
  console.log(`\n📐 Expected tab bar position:`);
  const margin = 39.7; // 14mm in pts
  const tabH = 18;
  const contentW = pageW - 2 * margin;
  const tabW = contentW / 12;
  
  // CSS-space rect (top-left origin)
  console.log(`  CSS rect: x=${margin.toFixed(1)}, y=${margin.toFixed(1)}, w=${tabW.toFixed(1)}, h=${tabH}`);
  
  // PDF-space rect (bottom-left origin, Y flipped)
  const pdfY1 = pageH - margin - tabH; // bottom of tab bar
  const pdfY2 = pageH - margin;        // top of tab bar
  console.log(`  Expected PDF rect: [${margin.toFixed(1)}, ${pdfY1.toFixed(1)}, ${(margin + tabW).toFixed(1)}, ${pdfY2.toFixed(1)}]`);
  console.log(`  Tab bar should be in TOP ~2cm of page (y ≈ ${pdfY1.toFixed(0)}-${pdfY2.toFixed(0)} in PDF coords)`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
