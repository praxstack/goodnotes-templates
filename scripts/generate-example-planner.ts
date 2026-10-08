#!/usr/bin/env -S npx tsx
/**
 * Regenerates examples/prax-journal/prax_adhd_planner{,_v2}.pdf with clearly
 * FAKE placeholder data (GNT-019). Never put real medication names, doses or
 * clinician names in this file: the example PDFs are public.
 *
 *   npx tsx scripts/generate-example-planner.ts
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'examples', 'prax-journal');

const W = 595.28;
const H = 841.89;
const M = 40;

interface Section { title: string; lines: string[] }
interface Page { title: string; subtitle: string; sections: Section[] }

const DAILY: Page[] = [
  {
    title: 'MORNING LAUNCH PAD',
    subtitle: 'Wake > Meds > Check-in > Plan > Go   (EXAMPLE DATA ONLY)',
    sections: [
      { title: 'WAKE-UP SEQUENCE', lines: ['[ ] Took morning meds', '[ ] Drank water (1 glass)', '[ ] Opened curtains / sunlight', '[ ] Brushed teeth', '[ ] Got dressed'] },
      { title: 'MORNING CHECK-IN (1-10)', lines: ['Mood: 1 2 3 4 5 6 7 8 9 10', 'Energy: 1 2 3 4 5 6 7 8 9 10', 'Anxiety: 1 2 3 4 5 6 7 8 9 10', 'Sleep quality: 1 2 3 4 5 6 7 8 9 10'] },
      { title: 'MEDICATION LOG (placeholder names, no doses)', lines: ['Example Medication A: [ ] AM  [ ] PM', 'Example Medication B: [ ] AM  [ ] PM', 'Example Medication C: [ ] Taken', 'Example Medication D: [ ] Taken'] },
      { title: "TODAY'S BIG 3", lines: ['1. ______________________  predicted ___ actual ___', '2. ______________________  predicted ___ actual ___', '3. ______________________  predicted ___ actual ___'] },
      { title: 'IMPLEMENTATION INTENTION', lines: ['I will __________________ at __:__ in __________________'] },
      { title: 'TIME BLOCKS', lines: ['Block 1: __:__ to __:__  Task: ____________  Done? Y / Partial / N', 'Block 2: __:__ to __:__  Task: ____________  Done? Y / Partial / N', 'Block 3: __:__ to __:__  Task: ____________  Done? Y / Partial / N'] },
    ],
  },
  {
    title: 'DAILY BATTLE LOG',
    subtitle: 'Track what actually happens. No judgment. Just data.',
    sections: [
      { title: 'DISTRACTION LOG', lines: ['Time | What pulled me away | What I was supposed to do | Returned? | How long?', '______________________________________________________________', '______________________________________________________________'] },
      { title: 'ANTI-PROCRASTINATION: PREDICTED VS ACTUAL', lines: ['Task | Predicted difficulty % | Actual difficulty %', '______________________________________________________________'] },
      { title: 'MIDDAY BODY CHECK', lines: ['Time: __:__   What am I feeling right now? ______________'] },
      { title: 'WINS (no matter how small)', lines: ['1. __________   2. __________   3. __________'] },
      { title: '2-SECOND PAUSE LOG', lines: ['Time | Reached for what? | Did you pause? | Body feeling'] },
    ],
  },
  {
    title: 'EVENING WIND-DOWN',
    subtitle: 'Review > Reflect > Reset > Rest',
    sections: [
      { title: 'EVENING CHECK-IN (1-10)', lines: ['Mood now: 1 2 3 4 5 6 7 8 9 10', 'Energy now: 1 2 3 4 5 6 7 8 9 10', 'Productivity: 1 2 3 4 5 6 7 8 9 10', 'Self-kindness: 1 2 3 4 5 6 7 8 9 10'] },
      { title: 'DID I DO MY BIG 3?', lines: ['#1 Done / Partial / Skipped', '#2 Done / Partial / Skipped', '#3 Done / Partial / Skipped'] },
      { title: 'DAILY HABIT TRACKER', lines: ['[ ] Meds taken (all doses)', '[ ] Walk 200 steps/hour (clinician advice placeholder: Dr. Example)', '[ ] Water (4+ glasses)', '[ ] In bed by target time', '[ ] Read 1 page', '[ ] Filled this journal'] },
      { title: 'THOUGHT CHECK', lines: ['The thought | Distortion | Reframe'] },
      { title: 'SLEEP PROTOCOL', lines: ['Target bedtime: __:__   [ ] Screen off 30 min before bed', '[ ] Optional as-needed medication per prescriber: Example Medication E'] },
    ],
  },
  {
    title: 'WEEKLY REVIEW',
    subtitle: 'Every Sunday: look back, adjust, keep going.',
    sections: [
      { title: 'WEEK AT A GLANCE', lines: ['Plot daily mood (1-10): Mon Tue Wed Thu Fri Sat Sun'] },
      { title: 'HABIT SCORECARD', lines: ['How many days this week? ______'] },
      { title: 'NEXT WEEK', lines: ['One thing to keep: __________   One thing to change: __________'] },
    ],
  },
];

const V2_EXTRA: Page = {
  title: 'THERAPY HOMEWORK NOTES',
  subtitle: "Notes for your next session with your therapist (placeholder page)",
  sections: [
    { title: 'WHAT WENT WELL', lines: ['______________________________________________________________'] },
    { title: 'WHAT WAS HARD', lines: ['______________________________________________________________'] },
    { title: 'QUESTIONS TO ASK', lines: ['______________________________________________________________'] },
  ],
};

function drawPage(page: PDFPage, p: Page, n: number, total: number, bold: PDFFont, font: PDFFont): void {
  let y = H - M;
  page.drawText(p.title, { x: M, y, size: 20, font: bold, color: rgb(0.1, 0.1, 0.3) });
  page.drawText(`PAGE ${n} of ${total}`, { x: W - M - 70, y, size: 9, font });
  y -= 18;
  page.drawText(p.subtitle, { x: M, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
  y -= 14;
  page.drawText('Date: ____ / ____ / ____', { x: M, y, size: 10, font });
  y -= 28;
  for (const s of p.sections) {
    page.drawRectangle({ x: M, y: y - 4, width: W - 2 * M, height: 16, color: rgb(0.9, 0.92, 0.97) });
    page.drawText(s.title, { x: M + 6, y, size: 10, font: bold });
    y -= 20;
    for (const l of s.lines) {
      page.drawText(l, { x: M + 6, y, size: 9, font });
      y -= 15;
    }
    y -= 14;
  }
  page.drawText('Example planner with placeholder data only. Not medical advice.', { x: M, y: 24, size: 7, font, color: rgb(0.5, 0.5, 0.5) });
}

async function build(pages: Page[], title: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setCreator('goodnotes-templates scripts/generate-example-planner.ts');
  doc.setProducer('pdf-lib');
  doc.setCreationDate(new Date('2026-01-01T00:00:00Z'));
  doc.setModificationDate(new Date('2026-01-01T00:00:00Z'));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  pages.forEach((p, i) => drawPage(doc.addPage([W, H]), p, i + 1, pages.length, bold, font));
  return doc.save({ useObjectStreams: false });
}

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(path.join(OUT, 'prax_adhd_planner.pdf'), await build(DAILY, 'Example ADHD Daily Planner'));
  writeFileSync(
    path.join(OUT, 'prax_adhd_planner_v2.pdf'),
    await build([...DAILY.slice(0, 3), V2_EXTRA, DAILY[3]], 'Example ADHD Daily Planner v2'),
  );
  console.log('wrote 2 example PDFs to', path.relative(REPO, OUT));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
