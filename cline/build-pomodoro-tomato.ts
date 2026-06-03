/**
 * build-pomodoro-tomato.ts — Prax Journal · Tomato Pomodoro Pad (Cline)
 *
 * The cute, distinctive tomato-themed Pomodoro pad: warm tomato-red palette,
 * hand-drawn tomato SVG glyphs, a big faint tomato WATERMARK behind each page,
 * and the skeuomorphic paper feel (grain + vignette) from pomodoro-stamp.svg.
 *
 * Three A4 pages, render-verified (A4 / overflow=0 / minFont>=7px), bundled into
 * cline/output/pomodoro-tomato/pomodoro-tomato.pdf (+ individual pages).
 *
 *   01 · session      — target + definition-of-done + 4×25-min tomato blocks + focus 1–5
 *   02 · capture      — park stray thoughts mid-sprint, get back to the one thing
 *   03 · catch-decide — two piles: catch it now (left), decide after (right)
 *
 * Tone rubric still applies (no gamification-as-pressure, no shame). The tomatoes
 * are warmth, not a streak you owe.
 *
 * Run: ./node_modules/.bin/tsx cline/build-pomodoro-tomato.ts
 */

import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'output', 'pomodoro-tomato');

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">';

// ── A cute tomato glyph (red body, green calyx + leaf), reusable ────────────
// size = px width/height; opacity for watermark vs solid.
function tomato(size: number, opacity = 1): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${opacity}">
    <ellipse cx="50" cy="58" rx="38" ry="34" fill="#D6492F"/>
    <ellipse cx="50" cy="58" rx="38" ry="34" fill="url(#tomShine)"/>
    <path d="M50 26 q-4 -10 -14 -12 q6 8 4 14 q-10 -6 -18 -2 q9 3 12 10 q-9 0 -13 7 q9 -3 16 1 q3 -8 13 -10 q10 2 13 10 q7 -4 16 -1 q-4 -7 -13 -7 q3 -7 12 -10 q-8 -4 -18 2 q2 -6 4 -14 q-10 2 -14 12z" fill="#5C8A4A"/>
    <ellipse cx="38" cy="46" rx="9" ry="6" fill="#FFFFFF" fill-opacity="0.28"/>
  </svg>`;
}
const TOM_DEFS = `<svg width="0" height="0" style="position:absolute"><defs>
  <radialGradient id="tomShine" cx="36%" cy="30%" r="72%">
    <stop offset="0%" stop-color="#F08A6E" stop-opacity="0.85"/>
    <stop offset="55%" stop-color="#D6492F" stop-opacity="0"/>
    <stop offset="100%" stop-color="#8A2A1C" stop-opacity="0.35"/>
  </radialGradient></defs></svg>`;

const CSS = `
:root{
  --pad:20mm; --paper:#FBF3EC;
  --ink:#2A2824; --soft:#4a3f39; --quiet:#8a6f63; --whisper:#cbb6ab;
  --tomato:#C14B3A; --tomato-deep:#8A3E2E; --tomato-tint:rgba(193,75,58,.08); --tomato-edge:rgba(193,75,58,.30);
  --leaf:#5C8A4A; --bleed:rgba(193,75,58,.22); --hair:rgba(42,40,36,.13); --dot:rgba(42,40,36,.18);
  --serif:'Fraunces','Iowan Old Style','Charter','Georgia',serif;
  --sans:'Instrument Sans',-apple-system,'Helvetica Neue',sans-serif;
  --mono:'JetBrains Mono','SF Mono','Menlo',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#E9DDD3}
body{font-family:var(--sans);font-size:8.5pt;color:var(--soft);line-height:1.5;-webkit-font-smoothing:antialiased}
.page{width:210mm;height:297mm;background:var(--paper);margin:10mm auto;padding:var(--pad);
  position:relative;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(42,40,36,.12)}
@media print{html,body{background:#fff}.page{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 portrait;margin:0}}
/* warm gradient + paper grain + vignette (skeuo feel from pomodoro-stamp.svg) */
.page::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 36%, #FFF8F0 0%, transparent 58%),
             radial-gradient(120% 100% at 50% 120%, rgba(193,75,58,.07), transparent 60%)}
.page::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.5;
  background-image:radial-gradient(rgba(42,40,36,.02) .5px,transparent .5px);background-size:3px 3px}
.bind{position:absolute;left:0;top:0;height:100%;width:6mm;background:var(--bleed);z-index:1}
/* clip layer: contains the bleeding watermark so it can't inflate page scrollHeight */
.bleed-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
/* big faint tomato watermark, bottom-right */
.wm{position:absolute;right:-26mm;bottom:-30mm;pointer-events:none;transform:rotate(-12deg)}
.spine{position:absolute;right:3mm;top:50%;transform:translate(50%,-50%) rotate(90deg);font-family:var(--mono);font-size:6pt;letter-spacing:.3em;text-transform:uppercase;color:var(--whisper);white-space:nowrap;z-index:2}
.crisis{position:absolute;bottom:7mm;right:9mm;font-family:var(--mono);font-size:6pt;letter-spacing:.06em;color:var(--tomato);text-decoration:none;opacity:.6;z-index:3}
.head{border-bottom:.5px solid var(--tomato-edge);padding-bottom:4mm;margin-bottom:6mm;position:relative;z-index:2;display:flex;align-items:flex-end;gap:5mm}
.head .tom{flex:none;margin-bottom:1mm}
.kicker{font-family:var(--mono);font-size:6pt;font-weight:500;text-transform:uppercase;letter-spacing:.24em;color:var(--tomato-deep);margin-bottom:3mm}
h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:31pt;line-height:.9;letter-spacing:-.018em;color:var(--ink);font-variation-settings:"opsz" 144}
.sub{font-family:var(--sans);font-size:8.5pt;color:var(--quiet);margin-top:3mm;line-height:1.5}
.b{margin-bottom:5mm;position:relative;z-index:2}
.lab{font-family:var(--mono);font-size:6pt;font-weight:500;text-transform:uppercase;letter-spacing:.18em;color:var(--tomato-deep);margin-bottom:2mm}
.lab .n{color:var(--quiet);text-transform:none;letter-spacing:.01em;font-size:6.5pt;font-family:var(--sans)}
.prompt{font-family:var(--serif);font-style:italic;font-size:12pt;color:var(--ink);font-variation-settings:"opsz" 60;line-height:1.3}
.hint{font-size:7pt;color:var(--quiet);margin-top:.8mm;line-height:1.4}
.line{border-bottom:.5px solid var(--whisper);height:6mm}
.dots{background-image:radial-gradient(circle,var(--dot) .28mm,transparent .28mm);background-size:2.5mm 7mm;background-position:0 6mm}
.two{display:flex;gap:5mm}.two>div{flex:1;min-width:0}
/* tomato block tracker — 4 big tomatoes you colour/tick per 25-min sprint */
.blocks{display:flex;gap:6mm;margin-top:2mm;align-items:center}
.block{display:flex;flex-direction:column;align-items:center;gap:1.5mm}
.block .cap{font-family:var(--mono);font-size:6pt;color:var(--whisper);letter-spacing:.1em}
.tomout{filter:grayscale(1) opacity(.32)}
/* focus 1-5 pips */
.scale{display:flex;gap:2mm;margin-top:1mm}
.pip{width:7mm;height:7mm;border:.6px solid var(--tomato-edge);border-radius:50%;font-family:var(--mono);font-size:6pt;color:var(--tomato-deep);display:flex;align-items:center;justify-content:center;background:var(--tomato-tint)}
/* table */
.tbl{width:100%;border-collapse:collapse;margin-top:1mm}
.tbl th{font-family:var(--mono);font-size:6pt;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--quiet);text-align:left;padding:1.4mm 2mm;border-bottom:.5px solid var(--tomato-edge)}
.tbl td{height:9mm;border-bottom:.5px solid var(--hair);padding:0 2mm}
.tbl td.num{font-family:var(--mono);font-size:7pt;color:var(--tomato-deep);width:8mm;opacity:.7}
.perm{margin-top:auto;background:var(--tomato-tint);border-left:1.5px solid var(--tomato);border-radius:0 2px 2px 0;padding:2.6mm 4mm;font-family:var(--serif);font-style:italic;font-size:7.5pt;color:var(--tomato-deep);font-variation-settings:"opsz" 14;line-height:1.45;position:relative;z-index:2}
`;

function shell(spine: string, kicker: string, title: string, sub: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">${FONTS}<style>${CSS}</style></head>
<body><main class="page">
  ${TOM_DEFS}
  <div class="bind"></div>
  <div class="bleed-layer"><div class="wm">${tomato(120, 0.05)}</div></div>
  <div class="spine">${spine}</div>
  <header class="head"><div class="tom">${tomato(16)}</div><div><div class="kicker">${kicker}</div><h1>${title}</h1></div></header>
  ${sub ? `<div class="b" style="margin-top:-3mm"><div class="sub">${sub}</div></div>` : ''}
  ${body}
  <a href="#" class="crisis">[crisis]</a>
</main></body></html>`;
}
function scale(): string {
  let s = '';
  for (let i = 1; i <= 5; i++) s += `<span class="pip">${i}</span>`;
  return `<div class="scale">${s}</div>`;
}
function blocks(n = 4): string {
  let s = '';
  for (let i = 1; i <= n; i++) s += `<div class="block"><div class="tomout">${tomato(18)}</div><div class="cap">25m · ${String(i).padStart(2, '0')}</div></div>`;
  return `<div class="blocks">${s}</div>`;
}

// ── Page 01 · session ───────────────────────────────────────────────────────
function session(): string {
  const body = `
  <section class="b"><div class="lab">target <span class="n">— the one thing this session is for</span></div><div class="line"></div></section>
  <section class="b"><div class="lab">definition of done <span class="n">— how I'll know to stop</span></div><div class="line"></div></section>
  <section class="b"><div class="lab">first physical action <span class="n">— open the file · write one line</span></div><div class="line"></div></section>
  <section class="b">
    <div class="lab">the tomatoes <span class="n">— one per 25 minutes; colour it in when the block is done</span></div>
    ${blocks(4)}
  </section>
  <section class="b">
    <div class="lab">parking lot <span class="n">— anything that pulled at you; it'll keep</span></div>
    <div class="dots" style="height:22mm"></div>
  </section>
  <section class="b two" style="align-items:flex-end">
    <div><div class="lab">focus 1–5 <span class="n">— honest, not harsh</span></div>${scale()}</div>
    <div><div class="lab">clean stop sentence</div><div class="line"></div></div>
  </section>
  <aside class="perm">momentum is built in blocks. an unfinished tomato is not a failure — it's where you start next time.</aside>`;
  return shell('pomodoro · session', '§ focus · the tomato session', 'One block at a time.',
    'Cirillo\u2019s technique, your pace. 25 minutes of the one thing, then a real break. Stopping early still counts as a block begun.', body);
}

// ── Page 02 · capture ───────────────────────────────────────────────────────
function capture(): string {
  const rows = Array.from({ length: 9 }, (_, i) => `<tr><td class="num">${String(i + 1).padStart(2, '0')}</td><td></td></tr>`).join('');
  const body = `
  <section class="b"><div class="prompt">a thought arrived mid-sprint. park it here — then back to the one thing.</div></section>
  <section class="b">
    <table class="tbl"><thead><tr><th>#</th><th>the thought (it's safe here — it'll keep)</th></tr></thead><tbody>${rows}</tbody></table>
  </section>
  <aside class="perm">the idea won't escape. it lives on this page now. eyes back to the tomato.</aside>`;
  return shell('pomodoro · capture', '§ focus · capture', 'Park it.',
    'The stray-thought catcher. Write it, drop it, return. The sprint keeps going.', body);
}

// ── Page 03 · catch & decide ────────────────────────────────────────────────
function catchDecide(): string {
  const rows = Array.from({ length: 8 }, () => `<tr><td></td><td></td></tr>`).join('');
  const body = `
  <section class="b"><div class="prompt">two piles. catch it now on the left; decide what to do after the sprint, on the right.</div></section>
  <section class="b">
    <table class="tbl"><thead><tr><th>during the sprint \u2192 (catch)</th><th>for later \u2192 (decide after)</th></tr></thead><tbody>${rows}</tbody></table>
  </section>
  <aside class="perm">catching is free. deciding can wait. the sprint keeps going.</aside>`;
  return shell('pomodoro · catch', '§ focus · catch & decide', 'Two piles.',
    'For the busy-brain sprint. Catch left, decide right — never mid-block.', body);
}

interface Job { name: string; html: string }
const JOBS: Job[] = [
  { name: '01-session', html: session() },
  { name: '02-capture', html: capture() },
  { name: '03-catch-decide', html: catchDecide() },
];

interface QA { name: string; overflowPx: number; minFontPx: number; verdict: 'pass' | 'fail' }

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
      if (e.childElementCount === 0 && (e.textContent || '').trim()) { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs && fs < min) min = fs; }
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
  const bundle = await PDFDocument.create();
  try {
    for (const job of JOBS) {
      const { pdf, overflow, min } = await renderPage(browser, job.html);
      report.push({ name: job.name, overflowPx: overflow, minFontPx: Math.round(min * 10) / 10, verdict: overflow <= 1 && min >= 7 ? 'pass' : 'fail' });
      const src = await PDFDocument.load(pdf);
      const one = await PDFDocument.create();
      const [op] = await one.copyPages(src, [0]); one.addPage(op);
      await fs.writeFile(path.join(OUT, `${job.name}.pdf`), await one.save({ useObjectStreams: false }));
      const [bp] = await bundle.copyPages(src, [0]); bundle.addPage(bp);
    }
    bundle.setTitle('Prax Journal — Tomato Pomodoro Pad');
    await fs.writeFile(path.join(OUT, 'pomodoro-tomato.pdf'), await bundle.save({ useObjectStreams: false }));
  } finally {
    await browser.close();
  }
  console.log('\n[tomato] render-QA:');
  let allPass = true;
  for (const q of report) { const ok = q.verdict === 'pass'; allPass = allPass && ok; console.log(`  ${ok ? '\u2713' : '\u2717'} ${q.name.padEnd(16)} overflow=${q.overflowPx}px  minFont=${q.minFontPx}px \u2192 ${q.verdict}`); }
  console.log(`\n[tomato] ${JOBS.length} pages \u2192 cline/output/pomodoro-tomato/pomodoro-tomato.pdf (+ individual pages)`);
  if (!allPass) { console.error('[tomato] FAIL — fix overflow/font before shipping.'); process.exit(2); }
  console.log('[tomato] all pages pass A4 / overflow / legibility.');
}

main().catch(err => { console.error('[tomato] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
