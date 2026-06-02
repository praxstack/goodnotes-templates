/**
 * build-master.ts — Prax Journal v7 · assemble the full journal (Cline)
 *
 * Concatenates the already-built section PDFs into one master:
 *   daily-pilot.pdf (4) + tools/tools-reference.pdf (13) + tools/pomodoro-pad.pdf (2)
 *   → cline/output/master-journal.pdf (19 pp)
 *
 * Run AFTER build-daily.ts + build-tools.ts:
 *   ./node_modules/.bin/tsx cline/build-master.ts
 */
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const O = path.join(__dirname, 'output');

const PARTS = [
  'daily-pilot.pdf',
  path.join('tools', 'tools-reference.pdf'),
  path.join('tools', 'pomodoro-pad.pdf'),
];

async function main() {
  const master = await PDFDocument.create();
  let total = 0;
  for (const rel of PARTS) {
    const p = path.join(O, rel);
    try { await fs.access(p); } catch { console.error(`[master] missing: ${rel} — run build-daily.ts / build-tools.ts first`); process.exit(2); }
    const doc = await PDFDocument.load(await fs.readFile(p));
    const pages = await master.copyPages(doc, doc.getPageIndices());
    pages.forEach(pg => master.addPage(pg));
    total += doc.getPageCount();
    console.log(`  + ${rel.padEnd(28)} ${doc.getPageCount()} pp`);
  }
  master.setTitle('Prax Journal v7 — Master (Cline)');
  master.setAuthor('Prax');
  await fs.writeFile(path.join(O, 'master-journal.pdf'), await master.save({ useObjectStreams: false }));
  console.log(`\n[master] ${total} pages → cline/output/master-journal.pdf`);
}

main().catch(err => { console.error('[master] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
