/**
 * build-extras.ts — Prax Journal v7 · Reminders card + as-needed PDFs (Cline)
 *
 * Builds, in the locked v6 design language, render-verified to A4:
 *   - Permanent Reminders card  (front + back, 2 pp) → cline/output/extras/reminders-card.pdf
 *   - Letter to No One          (1 pp)               → cline/output/extras/letter-to-no-one.pdf
 *   - Therapy Session Prep/Debrief (1 pp)            → cline/output/extras/therapy-prep-debrief.pdf
 *   - Urge / Phone-Reach Log    (1 pp)               → cline/output/extras/urge-reach-log.pdf
 *   - Monthly Letter            (1 pp)               → cline/output/extras/monthly-letter.pdf
 *   - Weekly Strip (lightweight)(1 pp)               → cline/output/extras/weekly-strip.pdf
 * Each is a standalone single-page PDF you insert into GoodNotes when needed
 * (spec §2). Privacy: no real names, no med doses (spec §5).
 *
 * Run: ./node_modules/.bin/tsx cline/build-extras.ts
 */

import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'output', 'extras');

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">';

// reuse the daily design tokens (subset)
const CSS = `
:root{
  --pad:20mm; --paper:#F6EFE2; --ink:#1f2126; --soft:#3f4046; --quiet:#6E6658; --whisper:#B5AD9F;
  --sage:#4E6249; --sage-tint:rgba(78,98,73,.08); --sage-edge:rgba(78,98,73,.28);
  --clay:#c08866; --clay-tint:rgba(192,136,102,.10); --bleed:rgba(192,136,102,.22);
  --hair:rgba(31,33,38,.13); --dot:rgba(31,33,38,.20);
  --serif:'Fraunces','Iowan Old Style','Charter','Georgia',serif;
  --sans:'Instrument Sans',-apple-system,'Helvetica Neue',sans-serif;
  --mono:'JetBrains Mono','SF Mono','Menlo',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#E4DFD2}
body{font-family:var(--sans);font-size:8.5pt;color:var(--soft);line-height:1.5;-webkit-font-smoothing:antialiased}
.page{width:210mm;height:297mm;background:var(--paper);margin:10mm auto;padding:var(--pad);
  position:relative;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(31,33,38,.11)}
@media print{html,body{background:#fff}.page{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 portrait;margin:0}}
.bind{position:absolute;left:0;top:0;height:100%;width:6mm;background:var(--bleed);z-index:0}
.page::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.55;background-image:radial-gradient(rgba(31,33,38,.02) .5px,transparent .5px);background-size:3px 3px}
.spine{position:absolute;right:3mm;top:50%;transform:translate(50%,-50%) rotate(90deg);font-family:var(--mono);font-size:6pt;letter-spacing:.3em;text-transform:uppercase;color:var(--whisper);white-space:nowrap;z-index:1}
.crisis{position:absolute;bottom:7mm;right:9mm;font-family:var(--mono);font-size:6pt;letter-spacing:.06em;color:var(--clay);text-decoration:none;opacity:.6;z-index:2}
.head{border-bottom:.5px solid var(--whisper);padding-bottom:4mm;margin-bottom:6mm;position:relative;z-index:1}
.kicker{font-family:var(--mono);font-size:6pt;font-weight:500;text-transform:uppercase;letter-spacing:.24em;color:var(--quiet);margin-bottom:3.5mm}
h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:33pt;line-height:.9;letter-spacing:-.018em;color:var(--ink);font-variation-settings:"opsz" 144}
.sub{font-family:var(--sans);font-size:8.5pt;color:var(--quiet);margin-top:3mm;max-width:150mm;line-height:1.5}
.b{margin-bottom:5mm;position:relative;z-index:1}
.lab{font-family:var(--mono);font-size:6pt;font-weight:500;text-transform:uppercase;letter-spacing:.18em;color:var(--sage);margin-bottom:2mm}
.lab .n{color:var(--quiet);text-transform:none;letter-spacing:.01em;font-size:6.5pt;font-family:var(--sans)}
.prompt{font-family:var(--serif);font-style:italic;font-size:12pt;color:var(--ink);font-variation-settings:"opsz" 60;line-height:1.3}
.hint{font-size:7pt;color:var(--quiet);margin-top:.8mm;line-height:1.4}
.line{border-bottom:.5px solid var(--whisper);height:6mm}
.dots{background-image:radial-gradient(circle,var(--dot) .28mm,transparent .28mm);background-size:2.5mm 7mm;background-position:0 6mm}
.chips{display:flex;flex-wrap:wrap;gap:2mm;margin-top:1mm}
.chip{font-size:8pt;color:var(--soft);border:.5px solid var(--sage-edge);border-radius:999px;padding:1.2mm 3.4mm;background:var(--sage-tint)}
.two{display:flex;gap:5mm}.two>div{flex:1;min-width:0}
.tbl{width:100%;border-collapse:collapse;margin-top:1mm}
.tbl th{font-family:var(--mono);font-size:6pt;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--quiet);text-align:left;padding:1.4mm 2mm;border-bottom:.5px solid var(--whisper)}
.tbl td{height:8mm;border-bottom:.5px solid var(--hair);padding:0 2mm}
.tbl td.num{font-family:var(--mono);font-size:7pt;color:var(--whisper);width:8mm}
.perm{margin-top:auto;background:var(--clay-tint);border-left:1.5px solid var(--clay);border-radius:0 2px 2px 0;padding:2.6mm 4mm;font-family:var(--serif);font-style:italic;font-size:7.5pt;color:#8a5e44;font-variation-settings:"opsz" 14;line-height:1.45;position:relative;z-index:1}
/* reminders card big list */
.rules{display:flex;flex-direction:column;gap:7mm;margin-top:8mm;flex:1;justify-content:center}
.rule{font-family:var(--serif);font-style:italic;font-size:21pt;color:var(--ink);font-variation-settings:"opsz" 72;line-height:1.1}
.rule .mk{font-family:var(--mono);font-style:normal;font-size:8pt;color:var(--sage);letter-spacing:.1em;margin-right:4mm;vertical-align:super}
`;

function shell(spine: string, kicker: string, title: string, sub: string, body: string, crisis = true): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">${FONTS}<style>${CSS}</style></head>
<body><main class="page" role="document"><div class="bind"></div><div class="spine">${spine}</div>
<header class="head"><div class="kicker">${kicker}</div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</header>
${body}${crisis ? '<a href="#" class="crisis">[crisis]</a>' : ''}</main></body></html>`;
}
const chips = (o: string[]) => `<div class="chips">${o.map(x => `<span class="chip">${x}</span>`).join('')}</div>`;

// ── Reminders card (front + back) ───────────────────────────────────────────
function remindersFront(): string {
  const rules = [
    'blank is complete', 'frog before tooling', 'body before brain',
    'depth is allowed, debt is not', 'worth is not output',
  ].map((r, i) => `<div class="rule"><span class="mk">0${i + 1}</span>${r}</div>`).join('');
  return shell('reminders · front', '§ reference · the operating rules', 'Remember.', '', `<div class="rules">${rules}</div>
  <aside class="perm">read one. then close the card and begin. you don't have to believe it yet.</aside>`, false);
}
function remindersBack(): string {
  const core = [
    'building it is not doing it', 'motivation follows action — not the reverse',
    'behind is a position, not a verdict', 'the hand moves first, so move the hand', 'you always came back',
  ].map((r, i) => `<div class="rule"><span class="mk">0${i + 1}</span>${r}</div>`).join('');
  return shell('reminders · back', '§ reference · the honest core', 'And.', '', `<div class="rules">${core}</div>
  <aside class="perm">these are not motivation. they're the things that are true on the days motivation isn't.</aside>`, false);
}

// ── Letter to No One ────────────────────────────────────────────────────────
function letter(): string {
  const body = `
  <section class="b"><div class="prompt">Dear ____________ ,</div></section>
  <section class="b dots" style="flex:1;min-height:150mm"></section>
  <aside class="perm">you don't have to send it. you don't have to read it again. getting it out of the body is the whole point.</aside>`;
  return shell('letter', '§ as-needed · letter to no one', 'Say it here.',
    'A pressure-release page. Anyone, anything, no edits. Insert a copy whenever the chest is full.', body);
}

// ── Therapy Session Prep / Debrief ──────────────────────────────────────────
function therapy(): string {
  const body = `
  <section class="b"><div class="lab">before — prep</div>
    <div class="b"><div class="hint">what I need to say this session</div><div class="dots" style="height:22mm"></div></div>
    <div class="b"><div class="hint">what I'm avoiding saying (say it here first)</div><div class="dots" style="height:22mm"></div></div>
  </section>
  <section class="b"><div class="lab">after — debrief</div>
    <div class="two">
      <div><div class="hint">homework I understood</div><div class="dots" style="height:20mm"></div></div>
      <div><div class="hint">homework I'm confused about</div><div class="dots" style="height:20mm"></div></div>
    </div>
    <div class="b" style="margin-top:3mm"><div class="hint">one experiment to run before next time</div><div class="line"></div></div>
  </section>
  <aside class="perm">bring the confusion, not a polished version. the confusion is the useful part.</aside>`;
  return shell('therapy', '§ as-needed · session prep & debrief', 'The session.',
    'Carry this in and out of a session. No clinical detail it doesn\u2019t need.', body);
}

// ── Urge / Phone-Reach Log ──────────────────────────────────────────────────
function urgeLog(): string {
  const rows = Array.from({ length: 12 }, (_, i) => `<tr><td class="num">${i + 1}</td><td></td><td></td><td></td></tr>`).join('');
  const body = `
  <section class="b"><div class="prompt">noticed before, or after?</div>
    <div class="hint">the hand moves before the thought. this page only asks you to notice when you caught it. catching it late still counts.</div>
  </section>
  <section class="b">${chips(['noticed before action', 'noticed after', 'not today'])}</section>
  <section class="b">
    <table class="tbl"><thead><tr><th>#</th><th>time</th><th>the urge (scroll · phone · tab · snack)</th><th>before / after / —</th></tr></thead><tbody>${rows}</tbody></table>
  </section>
  <aside class="perm">no streaks. noticing the wave is the practice — not stopping every one.</aside>`;
  return shell('urge log', '§ as-needed · urge & phone-reach', 'The wave.',
    'Body-impulse tracking. A wave in the body, not a command.', body);
}

// ── Monthly Letter ──────────────────────────────────────────────────────────
function monthly(): string {
  const body = `
  <section class="b"><div class="prompt">Dear next-month me,</div></section>
  <section class="b dots" style="flex:1;min-height:120mm"></section>
  <section class="b"><div class="lab">one thing I want next month to feel like <span class="n">— one sentence, plain</span></div><div class="line"></div></section>
  <aside class="perm">no verdict on the month that's closing. no promise for the one that's opening. just a note across.</aside>`;
  return shell('monthly', '§ as-needed · monthly letter', 'Dear next month.',
    'One reusable page. Write it whenever a month turns — the calendar doesn\u2019t ask permission.', body);
}

// ── Weekly Strip (lightweight) ──────────────────────────────────────────────
function weekly(): string {
  const dayCols = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    .map(d => `<th style="text-align:center">${d}</th>`).join('');
  const rowMood = '<tr><td class="num" style="width:24mm">mood</td>' + '<td></td>'.repeat(7) + '</tr>';
  const rowChest = '<tr><td class="num" style="width:24mm">chest · kg</td>' + '<td></td>'.repeat(7) + '</tr>';
  const rowWord = '<tr><td class="num" style="width:24mm">one word</td>' + '<td></td>'.repeat(7) + '</tr>';
  const body = `
  <section class="b"><div class="lab">the week at a glance <span class="n">— mood · chest-kg · one word</span></div>
    <table class="tbl"><thead><tr><th style="width:24mm"></th>${dayCols}</tr></thead><tbody>${rowMood}${rowChest}${rowWord}</tbody></table>
  </section>
  <section class="b"><div class="lab">named patterns — one tick each time</div>${chips(['doom scroll', 'catastrophize', 'prereq trap', 'rejection scanner', 'keeda', 'night zone'])}</section>
  <section class="b two">
    <div><div class="lab">worked — keep doing</div><div class="dots" style="height:24mm"></div></div>
    <div><div class="lab">cost too much — try different</div><div class="dots" style="height:24mm"></div></div>
  </section>
  <section class="b"><div class="lab">what I want next week to feel like <span class="n">— one sentence</span></div><div class="line"></div></section>
  <section class="b"><div class="lab">next week's frog <span class="n">— eat it early; finish by tuesday</span></div><div class="line"></div></section>
  <aside class="perm">no graph required. patterns count without metrics. you showed up — that counts.</aside>`;
  return shell('weekly', '§ as-needed · weekly strip', 'This week.',
    'A light aperture on seven days. No heavy grid.', body);
}

interface Job { name: string; pages: string[] }
const JOBS: Job[] = [
  { name: 'reminders-card', pages: [remindersFront(), remindersBack()] },
  { name: 'letter-to-no-one', pages: [letter()] },
  { name: 'therapy-prep-debrief', pages: [therapy()] },
  { name: 'urge-reach-log', pages: [urgeLog()] },
  { name: 'monthly-letter', pages: [monthly()] },
  { name: 'weekly-strip', pages: [weekly()] },
];

interface QA { name: string; idx: number; overflowPx: number; minFontPx: number; verdict: 'pass' | 'fail' }

async function renderPage(browser: Browser, html: string): Promise<{ pdf: Uint8Array; overflow: number; min: number }> {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { if ((document as any).fonts) await (document as any).fonts.ready; });
  const m = await page.evaluate(() => {
    const el = document.querySelector('.page') as HTMLElement;
    let min = 99;
    document.querySelectorAll('*').forEach((n) => {
      const e = n as HTMLElement;
      if (e.childElementCount === 0 && (e.textContent || '').trim()) {
        const fs = parseFloat(getComputedStyle(e).fontSize); if (fs && fs < min) min = fs;
      }
    });
    return { overflow: el.scrollHeight - el.clientHeight, min };
  });
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true });
  await page.close();
  return { pdf, overflow: m.overflow, min: m.min };
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report: QA[] = [];
  try {
    for (const job of JOBS) {
      const doc = await PDFDocument.create();
      for (let i = 0; i < job.pages.length; i++) {
        const { pdf, overflow, min } = await renderPage(browser, job.pages[i]);
        report.push({ name: job.name, idx: i + 1, overflowPx: overflow, minFontPx: Math.round(min * 10) / 10, verdict: overflow <= 1 && min >= 7 ? 'pass' : 'fail' });
        const src = await PDFDocument.load(pdf);
        const [p] = await doc.copyPages(src, [0]);
        doc.addPage(p);
      }
      doc.setTitle(`Prax Journal v7 — ${job.name}`);
      await fs.writeFile(path.join(OUT, `${job.name}.pdf`), await doc.save({ useObjectStreams: false }));
    }
  } finally {
    await browser.close();
  }
  console.log('\n[extras] render-QA:');
  let allPass = true;
  for (const q of report) {
    const ok = q.verdict === 'pass'; allPass = allPass && ok;
    console.log(`  ${ok ? '✓' : '✗'} ${(q.name + ' p' + q.idx).padEnd(26)} overflow=${q.overflowPx}px  minFont=${q.minFontPx}px → ${q.verdict}`);
  }
  console.log(`\n[extras] ${JOBS.length} PDFs → cline/output/extras/`);
  if (!allPass) { console.error('[extras] FAIL — fix overflow/font before shipping.'); process.exit(2); }
  console.log('[extras] all pages pass A4 / overflow / legibility.');
}

main().catch(err => { console.error('[extras] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
