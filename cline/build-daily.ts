/**
 * build-daily.ts — Prax Journal v7 · Daily Pilot (Cline build)
 *
 * Builds the 4 daily pages — Morning · Brain Dump · Midday · Evening — as A4 HTML
 * in the locked v6 design language (see docs/superpowers/specs/2026-06-02-...-design.md),
 * renders each to PDF (Playwright/Chromium), concatenates to
 * cline/output/daily-pilot.pdf, and RENDER-VERIFIES every page in the browser:
 * exact A4 box, zero vertical overflow, footer (permission strip) not collided,
 * minimum legible font sizes. Fails loudly — "built" never means "claimed" (spec §7/§8).
 *
 * Design intent (frontend-design / ui-ux-pro-max lens):
 *  - calm editorial rhythm; one clear focal moment per page (the title, the frog)
 *  - generous whitespace over density; taps over typing; fillable in fog
 *  - only 2 of 4 pages are "owed" — the page chrome states it, never nags
 *
 * Run:  ./node_modules/.bin/tsx cline/build-daily.ts
 * Open: open cline/output/daily-pilot.pdf
 */

import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, 'pages');
const OUT_DIR = path.join(__dirname, 'output');

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">';

// ── Shared stylesheet — locked v6 design language ───────────────────────────
const CSS = `
:root{
  --page-w:210mm; --page-h:297mm; --pad:20mm;
  --desk:#E4DFD2; --paper:#F6EFE2;
  --ink:#1f2126; --soft:#3f4046; --quiet:#6E6658; --whisper:#B5AD9F;
  --sage:#4E6249; --sage-soft:#7e9b85; --sage-tint:rgba(78,98,73,.08); --sage-edge:rgba(78,98,73,.28);
  --clay:#c08866; --clay-tint:rgba(192,136,102,.10); --amber:#d6a45e;
  --bleed:rgba(192,136,102,.22); --hair:rgba(31,33,38,.13); --dot:rgba(31,33,38,.20);
  --serif:'Fraunces','Iowan Old Style','Charter','Georgia',serif;
  --sans:'Instrument Sans',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;
  --mono:'JetBrains Mono','SF Mono','Menlo','Consolas',monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--desk)}
body{font-family:var(--sans);font-size:8.5pt;color:var(--soft);line-height:1.5;-webkit-font-smoothing:antialiased}
.page{width:var(--page-w);height:var(--page-h);background:var(--paper);margin:10mm auto;padding:var(--pad);
  position:relative;display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 1px 2px rgba(31,33,38,.05),0 18px 50px rgba(31,33,38,.11)}
@media print{html,body{background:#fff}.page{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 portrait;margin:0}}

/* clay bind-bleed + paper grain */
.bind{position:absolute;left:0;top:0;height:100%;width:6mm;background:var(--bleed);pointer-events:none;z-index:0}
.page::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.55;
  background-image:radial-gradient(rgba(31,33,38,.02) .5px,transparent .5px);background-size:3px 3px}

/* vertical spine label */
.spine{position:absolute;right:3mm;top:50%;transform:translate(50%,-50%) rotate(90deg);transform-origin:center;
  font-family:var(--mono);font-size:6pt;letter-spacing:.3em;text-transform:uppercase;color:var(--whisper);white-space:nowrap;z-index:1}

/* nav */
.crisis{position:absolute;bottom:7mm;right:9mm;font-family:var(--mono);font-size:6pt;letter-spacing:.06em;
  color:var(--clay);text-decoration:none;opacity:.6;z-index:2}

/* header */
.head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:.5px solid var(--whisper);padding-bottom:4mm;margin-bottom:6mm;position:relative;z-index:1}
.kicker{font-family:var(--mono);font-size:6pt;font-weight:500;text-transform:uppercase;letter-spacing:.24em;color:var(--quiet);margin-bottom:3.5mm}
h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:33pt;line-height:.9;letter-spacing:-.018em;color:var(--ink);font-variation-settings:"opsz" 144}
.owed{display:inline-block;font-family:var(--mono);font-size:6pt;letter-spacing:.16em;text-transform:uppercase;color:var(--sage);border:.5px solid var(--sage-edge);border-radius:999px;padding:.6mm 2mm;margin-left:3mm;vertical-align:middle;opacity:.8}
.meta{font-family:var(--mono);font-size:6pt;letter-spacing:.08em;color:var(--whisper);text-align:right;line-height:1.9}
.meta .dl{display:inline-block;width:22mm;border-bottom:.6px solid var(--whisper);height:3.5mm}
.meta .days span{margin-left:1.3mm;opacity:.85}

/* blocks */
.b{margin-bottom:5mm;position:relative;z-index:1}
.lab{font-family:var(--mono);font-size:6pt;font-weight:500;text-transform:uppercase;letter-spacing:.18em;color:var(--sage);margin-bottom:2mm}
.lab .n{color:var(--quiet);text-transform:none;letter-spacing:.01em;font-size:6.5pt;font-family:var(--sans)}
.prompt{font-family:var(--serif);font-style:italic;font-size:12pt;color:var(--ink);font-variation-settings:"opsz" 60;line-height:1.3}
.hint{font-size:7pt;color:var(--quiet);margin-top:.8mm;line-height:1.4}

/* writing surfaces */
.line{border-bottom:.5px solid var(--whisper);height:6mm}
.line.s{width:58mm}.line.m{width:92mm}
.dots{background-image:radial-gradient(circle,var(--dot) .28mm,transparent .28mm);background-size:2.5mm 7mm;background-position:0 6mm}
.dots.d2{height:16mm}.dots.d3{height:23mm}

/* chips */
.chips{display:flex;flex-wrap:wrap;gap:2mm;margin-top:1mm}
.chip{font-size:8pt;color:var(--soft);border:.5px solid var(--sage-edge);border-radius:999px;padding:1.2mm 3.4mm;background:var(--sage-tint)}

/* pip scale */
.scale{display:flex;gap:1.5mm;margin-top:1mm}
.pip{width:4.4mm;height:4.4mm;border:.5px solid var(--whisper);border-radius:50%;font-family:var(--mono);font-size:6pt;color:var(--whisper);display:flex;align-items:center;justify-content:center}

/* truth anchor + card drop */
.anchor{background:var(--sage-tint);border-left:1.5px solid var(--sage);border-radius:0 2px 2px 0;padding:2.8mm 4mm}
.anchor .al{font-family:var(--mono);font-size:6pt;letter-spacing:.2em;text-transform:uppercase;color:var(--sage);opacity:.85;margin-bottom:1.2mm}
.anchor .at{font-family:var(--serif);font-style:italic;font-size:11pt;color:var(--sage);font-variation-settings:"opsz" 40;line-height:1.32}
.drop{margin-top:3mm;border:.7px dashed var(--sage-edge);border-radius:3px;height:19mm;display:flex;align-items:center;padding:0 4mm}
.drop span{font-family:var(--mono);font-size:6pt;letter-spacing:.13em;text-transform:uppercase;color:var(--whisper)}

/* frog — the focal block */
.frog{border:.6px solid var(--sage-edge);border-radius:4px;background:rgba(255,255,255,.28);padding:4mm 4.5mm}
.fr{margin-bottom:2.8mm}.fr:last-child{margin-bottom:0}
.fk{font-family:var(--mono);font-size:6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:1mm}
.fk .t{color:var(--quiet);text-transform:none;letter-spacing:0;font-size:6pt}

/* keeda guard */
.guard{margin-top:3mm;font-family:var(--serif);font-style:italic;font-size:9pt;color:var(--clay);font-variation-settings:"opsz" 40;line-height:1.35}
.guard::before{content:'⌖ ';opacity:.65}

/* open paper / sticker zone */
.open{flex:1;min-height:38mm;background-image:radial-gradient(circle,var(--dot) .28mm,transparent .28mm);background-size:2.5mm 7mm;background-position:0 6mm}
.sz{border:.6px dashed var(--whisper);border-radius:3px;min-height:22mm;margin-top:4mm;display:flex;align-items:center;padding:0 4mm;opacity:.7}
.sz span{font-family:var(--mono);font-size:6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--whisper)}

/* table */
.tbl{width:100%;border-collapse:collapse;margin-top:1mm}
.tbl th{font-family:var(--mono);font-size:6pt;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--quiet);text-align:left;padding:1.4mm 2mm;border-bottom:.5px solid var(--whisper)}
.tbl td{height:8mm;border-bottom:.5px solid var(--hair);padding:0 2mm}
.tbl td.num{font-family:var(--mono);font-size:7pt;color:var(--whisper);width:8mm}

/* two-col */
.two{display:flex;gap:5mm}.two>div{flex:1;min-width:0}

/* permission footer */
.perm{margin-top:auto;background:var(--clay-tint);border-left:1.5px solid var(--clay);border-radius:0 2px 2px 0;padding:2.6mm 4mm;
  font-family:var(--serif);font-style:italic;font-size:7.5pt;color:#8a5e44;font-variation-settings:"opsz" 14;line-height:1.45;position:relative;z-index:1}
`;

function meta(): string {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => `<span>${d}</span>`).join('');
  return `<div class="meta"><div>date · <span class="dl"></span></div><div class="days">day /${days}</div></div>`;
}
function chips(opts: string[]): string {
  return `<div class="chips">${opts.map(o => `<span class="chip">${o}</span>`).join('')}</div>`;
}
function scale(max = 10): string {
  let s = '';
  for (let i = 0; i <= max; i++) s += `<span class="pip">${i}</span>`;
  return `<div class="scale">${s}</div>`;
}
function shell(spine: string, kicker: string, title: string, owed: boolean, body: string): string {
  const badge = owed ? '<span class="owed">owed</span>' : '<span class="owed" style="color:var(--whisper);border-color:var(--hair)">optional</span>';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${FONTS}<style>${CSS}</style></head>
<body><main class="page" role="document">
  <div class="bind" aria-hidden="true"></div><div class="spine" aria-hidden="true">${spine}</div>
  <header class="head"><div><div class="kicker">${kicker}</div><h1>${title}${badge}</h1></div>${meta()}</header>
  ${body}
  <a href="#" class="crisis">[crisis]</a>
</main></body></html>`;
}

// ── MORNING (owed) ──────────────────────────────────────────────────────────
function morning(): string {
  const body = `
  <section class="b">
    <div class="two">
      <div><div class="lab">body <span class="n">— one word</span></div><div class="line s"></div></div>
      <div><div class="lab">chest · kg <span class="n">— am</span></div>${scale(10)}</div>
    </div>
    <div class="hint" style="margin-top:2mm">one slow breath ◯ first — then the page.</div>
  </section>
  <section class="b two">
    <div><div class="lab">sleep</div>${chips(['slept', 'broken', 'late', 'heavy', 'okay'])}</div>
    <div><div class="lab">focus weather</div>${chips(['fog', 'scattered', 'here', 'sharp'])}</div>
  </section>
  <section class="b">
    <div class="anchor"><div class="al">today's truth</div><div class="at">blank is complete. worth is not output. the first movement is the plan.</div></div>
    <div class="drop"><span>today's card — drop a truth · quote · pill sticker</span></div>
  </section>
  <section class="b">
    <div class="frog">
      <div class="fr"><div class="fk">the frog <span class="t">— one concrete thing, ≤25 min</span></div><div class="line m"></div></div>
      <div class="fr"><div class="fk">shrink it <span class="t">— the smallest version</span></div><div class="line m"></div></div>
      <div class="fr"><div class="fk">first physical action <span class="t">— open the file · write "Dear ___"</span></div><div class="line m"></div></div>
      <div class="fr"><div class="fk">if–then <span class="t">— at [time], in [place]</span></div><div class="line m"></div></div>
      <div class="fr"><div class="fk">predicted difficulty <span class="t">— scored against actual tonight</span></div>${scale(10)}</div>
    </div>
  </section>
  <section class="b">
    <div class="lab">one stupidly small thing <span class="n">— smaller than the frog; doable even now</span></div>
    <div class="line m"></div>
  </section>
  <div class="guard">real thing — or a prerequisite dressed as progress? if it's the keeda, name it and start the frog ugly.</div>
  <aside class="perm">showing up is the win. one chip is enough today. so is none.</aside>`;
  return shell('morning', '§ daily · morning', 'Today.', true, body);
}

// ── BRAIN DUMP (optional) ───────────────────────────────────────────────────
function brainDump(): string {
  const body = `
  <section class="b"><div class="prompt">everything in your head — any order, no rules.</div></section>
  <section class="open" aria-label="open paper"></section>
  <div class="sz"><span>sticker zone — drop anything here</span></div>
  <aside class="perm">messy is the point. and — only if they come easily — 3 small things I don't want to erase.</aside>`;
  return shell('brain dump', '§ daily · brain dump', 'Dump it.', false, body);
}

// ── MIDDAY (optional) ───────────────────────────────────────────────────────
function midday(): string {
  const rows = [1, 2, 3, 4].map(n => `<tr><td class="num">${n}</td><td></td><td></td><td></td></tr>`).join('');
  const body = `
  <section class="b">
    <div class="lab">jar + body log <span class="n">— check in 3× or more</span></div>
    <table class="tbl"><thead><tr><th>#</th><th>time</th><th>jar level (overflow → empty)</th><th>chest · kg</th></tr></thead><tbody>${rows}</tbody></table>
  </section>
  <section class="b">
    <div class="lab">pseudo-doing check <span class="n">— prep ≠ doing</span></div>
    <div class="two">
      <div><div class="hint">the real task</div><div class="dots d2"></div></div>
      <div><div class="hint">what I drifted into</div><div class="dots d2"></div></div>
    </div>
    <div class="hint" style="margin-top:1.5mm">real task, or a prerequisite that feels productive? catch it while you can still switch.</div>
  </section>
  <section class="b">
    <div class="prompt">one small thing the next hour is for.</div>
    <div class="hint">smaller than you think. it doesn't have to fix the morning.</div>
    <div class="dots d2"></div>
  </section>
  <section class="b" style="display:flex;flex-direction:column;flex:1;min-height:0">
    <div class="lab">anything else — or nothing</div><div class="open" style="min-height:0"></div>
  </section>
  <aside class="perm">the afternoon doesn't owe the morning anything. blank is a complete entry.</aside>`;
  return shell('midday', '§ daily · midday — a reset, not a restart', 'Midday.', false, body);
}

// ── EVENING (owed) ──────────────────────────────────────────────────────────
function evening(): string {
  const body = `
  <section class="b two">
    <div><div class="lab">done today</div><div class="dots d2"></div></div>
    <div><div class="lab">moved to tomorrow — no shame</div><div class="dots d2"></div></div>
  </section>
  <section class="b">
    <div class="lab">frog check</div>
    <div class="two" style="align-items:flex-end">
      <div>${chips(['done', 'partial', 'not today'])}</div>
      <div><div class="hint">actual difficulty (vs predicted)</div>${scale(10)}</div>
    </div>
  </section>
  <section class="b">
    <div class="lab">practices</div>
    <div class="two">
      <div><div class="hint">meditation · min</div><div class="line s"></div></div>
      <div><div class="hint">water · /10</div><div class="line s"></div></div>
    </div>
    <div style="margin-top:2mm"><div class="hint">movement</div>${chips(['gym', 'walk', 'stretch', 'outside', 'none'])}</div>
    <div style="margin-top:2mm"><div class="hint">last night's sleep</div>${chips(['slept', 'broken', 'late', 'heavy', 'okay'])}</div>
  </section>
  <section class="b">
    <div class="lab">pattern spotter — tick what showed up</div>
    ${chips(['keeda', 'ye-karke-padhunga', 'productive procrastination', 'night zone', 'overcorrection', 'clean day'])}
  </section>
  <section class="b two">
    <div><div class="lab">evidence I showed up</div><div class="hint">one thing the depression didn't want me to</div><div class="line"></div></div>
    <div><div class="lab">one thing that was not all bad</div><div class="hint">person / food / body / place / moment</div><div class="line"></div></div>
  </section>
  <section class="b">
    <div class="lab">one human thread</div>${chips(['messaged', 'replied', 'asked for help', 'saw someone', 'no energy — allowed'])}
  </section>
  <section class="b">
    <div class="lab">tomorrow's runway</div>
    <div class="two">
      <div><div class="hint">tomorrow's frog</div><div class="line"></div></div>
      <div><div class="hint">main focus</div><div class="line"></div></div>
    </div>
    <div style="margin-top:2mm"><div class="hint">set it up tonight</div>${chips(['close tabs', 'open the file', 'phone away', 'desk ready'])}</div>
  </section>
  <section class="b"><div class="prompt" style="font-size:10.5pt">one kind sentence to myself —</div><div class="line m"></div></section>
  <aside class="perm">today is closed. tomorrow gets to be different.</aside>`;
  return shell('evening', '§ daily · evening close', 'Today is closed.', true, body);
}

const PAGES: { slug: string; html: string }[] = [
  { slug: '01-morning', html: morning() },
  { slug: '02-brain-dump', html: brainDump() },
  { slug: '03-midday', html: midday() },
  { slug: '04-evening', html: evening() },
];

// ── Render + verify ─────────────────────────────────────────────────────────
interface QA { slug: string; overflowPx: number; footerCollision: boolean; minFontPx: number; verdict: 'pass' | 'fail' }

async function renderAndVerify(browser: Browser, slug: string, html: string): Promise<{ pdf: Uint8Array; qa: QA }> {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 794, height: 1123 }); // A4 @ 96dpi
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { if ((document as any).fonts) await (document as any).fonts.ready; });

  const m = await page.evaluate(() => {
    const el = document.querySelector('.page') as HTMLElement;
    const overflow = el.scrollHeight - el.clientHeight;
    const perm = document.querySelector('.perm') as HTMLElement | null;
    let collision = false;
    if (perm) {
      const prev = perm.previousElementSibling as HTMLElement | null;
      if (prev) collision = prev.getBoundingClientRect().bottom > perm.getBoundingClientRect().top + 1;
    }
    // smallest rendered font size among text nodes with content
    let min = 99;
    document.querySelectorAll('*').forEach((n) => {
      const e = n as HTMLElement;
      if (e.childElementCount === 0 && (e.textContent || '').trim()) {
        const fs = parseFloat(getComputedStyle(e).fontSize);
        if (fs && fs < min) min = fs;
      }
    });
    return { overflow, collision, min };
  });

  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true });
  await page.close();

  const qa: QA = {
    slug, overflowPx: m.overflow, footerCollision: m.collision, minFontPx: Math.round(m.min * 10) / 10,
    verdict: m.overflow <= 1 && !m.collision && m.min >= 7 ? 'pass' : 'fail',
  };
  return { pdf, qa };
}

async function main() {
  await fs.mkdir(PAGES_DIR, { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const { slug, html } of PAGES) await fs.writeFile(path.join(PAGES_DIR, `${slug}.html`), html, 'utf-8');

  const browser = await chromium.launch();
  const merged = await PDFDocument.create();
  const report: QA[] = [];
  try {
    for (const { slug, html } of PAGES) {
      const { pdf, qa } = await renderAndVerify(browser, slug, html);
      report.push(qa);
      const doc = await PDFDocument.load(pdf);
      const [p] = await merged.copyPages(doc, [0]);
      merged.addPage(p);
    }
  } finally {
    await browser.close();
  }
  merged.setTitle('Prax Journal v7 — Daily Pilot (Cline)');
  await fs.writeFile(path.join(OUT_DIR, 'daily-pilot.pdf'), await merged.save({ useObjectStreams: false }));

  console.log('\n[daily] render-QA:');
  let allPass = true;
  for (const q of report) {
    const ok = q.verdict === 'pass';
    allPass = allPass && ok;
    console.log(`  ${ok ? '✓' : '✗'} ${q.slug.padEnd(14)} overflow=${q.overflowPx}px  footer=${q.footerCollision}  minFont=${q.minFontPx}px  → ${q.verdict}`);
  }
  console.log(`\n[daily] ${PAGES.length} pages → cline/output/daily-pilot.pdf`);
  if (!allPass) { console.error('[daily] FAIL — fix overflow/collision/font before shipping.'); process.exit(2); }
  console.log('[daily] all pages pass A4 / overflow / footer / legibility checks.');
}

main().catch(err => { console.error('[daily] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
