/**
 * build-v5-restyled.ts — re-skin the 7 v5 pages in the v6 design language.
 *
 * The original v5 pages (today/midday/reflect/brain-dump/weekly/monthly/quarterly)
 * used a dense "newspaper / Rx" aesthetic that clashes with v6's calm editorial
 * look. This generator rebuilds the SAME content/fields in v6's design system:
 *   - A4 portrait, tier-coded warm paper, 6mm clay bind-bleed
 *   - Fraunces italic display · Instrument Sans body · JetBrains Mono labels
 *   - sage/clay accents, ruled rows, 1–10 dot scales, soft section rules
 *
 * Writes self-contained HTML to pages-v5restyled/. No template tokens, no inlined
 * base64 fonts (uses Google Fonts <link> like the rest of v6) → opens clean raw.
 *
 * Run: pnpm tsx build-v5-restyled.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'pages-v5restyled');

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Instrument+Sans:wght@400;500&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">`;

// Tier paper tones (match v6 DESIGN.md).
const PAPER = { spine: '#F6EFE2', shelf: '#F2F0EC', weekly: '#E8EEE6', monthly: '#F1EFED', reference: '#F0F0EF', kawaii: '#FBF4EC' };

function shell(opts: { title: string; paper: string; kicker: string; display: string; sub: string; body: string; chip: string }): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${opts.title}</title>${FONTS}<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#E4DFD2}
:root{--paper:${opts.paper};--ink:#1f2126;--quiet:#6E6658;--whisper:#B5AD9F;--sage:#4E6249;--sage-soft:#7e9b85;--clay:#c08866;--amber:#d6a45e;
  --serif:'Fraunces','Iowan Old Style','Charter','Georgia',serif;
  --sans:'Instrument Sans',-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',sans-serif;
  --mono:'JetBrains Mono','SF Mono','Menlo','Consolas',monospace;--bleed:rgba(192,136,102,.22)}
body{font-family:var(--serif);color:var(--ink);-webkit-font-smoothing:antialiased}
.page{width:210mm;height:297mm;background:var(--paper);margin:10mm auto;padding:20mm 18mm 16mm;position:relative;overflow:hidden;
  box-shadow:0 1px 2px rgba(42,40,36,.04),0 8px 32px rgba(42,40,36,.08);page-break-after:always}
.bind{position:absolute;left:0;top:0;height:100%;width:6mm;background:var(--bleed);pointer-events:none;z-index:0}
.kicker{font-family:var(--mono);font-size:7.5pt;letter-spacing:.22em;text-transform:uppercase;color:var(--whisper)}
h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:33pt;line-height:1.02;letter-spacing:-.012em;margin-top:3mm}
.sub{font-family:var(--sans);font-size:10.5pt;line-height:1.45;color:var(--quiet);margin-top:3mm;max-width:150mm}
header{margin-bottom:8mm}
.row-meta{display:flex;gap:8mm;flex-wrap:wrap;margin-top:5mm;font-family:var(--mono);font-size:7.5pt;letter-spacing:.06em;color:var(--quiet)}
.row-meta b{color:var(--ink);font-weight:500}
.sec{margin-top:7mm}
.sec-label{font-family:var(--mono);font-size:7.5pt;letter-spacing:.18em;text-transform:uppercase;color:var(--sage);margin-bottom:3mm;
  border-bottom:.5pt solid rgba(78,98,73,.28);padding-bottom:1.6mm;display:flex;justify-content:space-between;align-items:baseline}
.sec-label span{font-family:var(--sans);font-size:8pt;letter-spacing:0;text-transform:none;color:var(--whisper);font-style:italic}
.line{height:8.5mm;border-bottom:.5pt solid rgba(31,33,38,.16)}
.line.tall{height:11mm}
.write{min-height:30mm;border:.6pt solid rgba(31,33,38,.14);border-radius:2mm;background:rgba(255,255,255,.18)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm}
.card{border:.6pt solid rgba(31,33,38,.14);border-radius:2mm;padding:4mm;background:rgba(255,255,255,.16)}
.card h3{font-family:var(--mono);font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:var(--quiet);font-weight:500;margin-bottom:2.5mm}
.scale{display:flex;gap:2.4mm;align-items:center}
.dot{width:4.2mm;height:4.2mm;border-radius:50%;border:.7pt solid rgba(31,33,38,.32)}
.scale .cap{font-family:var(--mono);font-size:6.5pt;color:var(--whisper);letter-spacing:.08em}
.numrow{display:flex;gap:1.6mm}.num{width:5mm;height:5mm;border:.6pt solid rgba(31,33,38,.22);border-radius:1mm;font-family:var(--mono);font-size:6.5pt;color:var(--quiet);display:flex;align-items:center;justify-content:center}
.chips{display:flex;gap:2mm;flex-wrap:wrap}
.chip{font-family:var(--mono);font-size:6.8pt;letter-spacing:.1em;text-transform:uppercase;color:var(--quiet);border:.6pt solid rgba(31,33,38,.2);border-radius:6mm;padding:1.2mm 3mm}
.note{font-family:var(--sans);font-size:9pt;font-style:italic;color:var(--whisper);margin-top:2mm}
.tbl{width:100%;border-collapse:collapse}
.tbl th{font-family:var(--mono);font-size:6.6pt;letter-spacing:.1em;text-transform:uppercase;color:var(--quiet);font-weight:500;text-align:left;padding:0 0 2mm}
.tbl td{border-bottom:.5pt solid rgba(31,33,38,.14);height:8mm}
.footer{position:absolute;bottom:9mm;left:18mm;right:18mm;display:flex;justify-content:space-between;font-family:var(--mono);font-size:6.5pt;letter-spacing:.16em;text-transform:uppercase;color:var(--whisper)}
.footer .pill{color:var(--sage)}
@media print{body{background:#fff}.page{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 portrait;margin:0}}
</style></head><body><main class="page"><div class="bind" aria-hidden="true"></div>
<header><div class="kicker">${opts.kicker}</div><h1>${opts.display}</h1><p class="sub">${opts.sub}</p></header>
${opts.body}
<div class="footer"><span class="pill">prax journal · v6</span><span>${opts.chip}</span></div>
</main></body></html>`;
}

const dateMeta = `<div class="row-meta"><span>date <b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;&nbsp;</b></span><span>day <b>&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;</b></span><span class="chips" style="margin-top:0"><span class="chip">mon</span><span class="chip">tue</span><span class="chip">wed</span><span class="chip">thu</span><span class="chip">fri</span><span class="chip">sat</span><span class="chip">sun</span></span></div>`;

function scale(label: string, n = 10): string {
  const dots = Array.from({ length: n }, () => '<div class="dot"></div>').join('');
  return `<div class="card"><h3>${label}</h3><div class="scale"><span class="cap">low</span>${dots}<span class="cap">high</span></div></div>`;
}
function ruled(rows: number, tall = false): string { return Array.from({ length: rows }, () => `<div class="line${tall ? ' tall' : ''}"></div>`).join(''); }

// ── 1 · TODAY ────────────────────────────────────────────────────────────────
const today = shell({
  title: 'Prax Journal v6 · Today (morning)', paper: PAPER.spine, chip: 'morning · daily',
  kicker: 'the daily · morning edition', display: 'Today.', sub: 'Commit small. Start with the frog. It\u2019s okay to leave parts blank \u2014 showing up is the win.',
  body: `${dateMeta}
  <div class="sec"><div class="sec-label">the frog <span>concrete · \u226425 min · one only</span></div>
    <div class="write" style="min-height:20mm"></div>
    <p class="note">Do this first. Everything else is bonus.</p></div>
  <div class="sec"><div class="sec-label">today\u2019s priorities <span>rule of 3 \u2014 no more</span></div>
    <table class="tbl"><thead><tr><th style="width:8mm">#</th><th>what</th><th style="width:30mm">when</th><th style="width:18mm">est</th></tr></thead>
    <tbody><tr><td>1</td><td></td><td></td><td></td></tr><tr><td>2</td><td></td><td></td><td></td></tr><tr><td>3</td><td></td><td></td><td></td></tr></tbody></table></div>
  <div class="sec grid3">
    ${scale('sleep · quality', 5)}
    <div class="card"><h3>water · goal 10</h3><div class="numrow">${Array.from({ length: 10 }, (_, i) => `<div class="num">${i + 1}</div>`).join('')}</div></div>
    ${scale('meditation · min', 5)}</div>
  <div class="sec"><div class="sec-label">first thought today <span>before you opened your eyes</span></div><div class="line tall"></div></div>
  <div class="sec"><div class="sec-label">one stupidly small thing i\u2019ll do <span>just one</span></div><div class="line tall"></div></div>
  <div class="sec grid2">
    <div class="card"><h3>movement</h3><div class="chips"><span class="chip">gym</span><span class="chip">walk</span><span class="chip">swim</span><span class="chip">outside</span></div><div class="line" style="margin-top:3mm"></div></div>
    <div class="card"><h3>free write · or leave blank</h3><div class="line" style="border:0;height:6mm"></div><div class="line" style="border:0;height:6mm;border-bottom:.5pt solid rgba(31,33,38,.14)"></div></div></div>`,
});

// ── 2 · MIDDAY ───────────────────────────────────────────────────────────────
const midday = shell({
  title: 'Prax Journal v6 · Midday', paper: PAPER.spine, chip: 'midday · 2pm',
  kicker: 'the daily · 2 pm alarm', display: 'Midday.', sub: 'Pause. Check the jar. Weigh the chest. Notice, don\u2019t judge \u2014 leaving parts blank is still showing up.',
  body: `${dateMeta}
  <div class="sec"><div class="sec-label">processing jar + body <span>log 3\u00d7 or more \u2014 jar and body together</span></div>
    <table class="tbl"><thead><tr><th style="width:8mm">#</th><th style="width:18mm">time</th><th>jar level (overflow\u2192empty)</th><th style="width:22mm">chest · kg</th></tr></thead>
    <tbody><tr><td>1</td><td></td><td></td><td></td></tr><tr><td>2</td><td></td><td></td><td></td></tr><tr><td>3</td><td></td><td></td><td></td></tr></tbody></table>
    <p class="note">Fillers: youtube · reddit · news · phone · worry · actual study \u2713</p></div>
  <div class="sec"><div class="sec-label">pseudo-doing check <span>prep \u2260 doing</span></div>
    <div class="grid2"><div class="card"><h3>real task</h3><div class="line"></div></div><div class="card"><h3>what i\u2019m actually doing</h3><div class="line"></div></div></div>
    <p class="note">Am I doing the real task, or a prerequisite that feels productive? Catch it while I can still switch.</p></div>
  <div class="sec"><div class="sec-label">thought flip · midday <span>only if a harsh thought is running</span></div>
    <div class="card"><h3>1 · brain\u2019s telling me</h3><div class="line"></div><h3 style="margin-top:3mm">2 · is that actually true?</h3><div class="line"></div><h3 style="margin-top:3mm">3 · a kinder way to see it</h3><div class="line"></div></div></div>`,
});

// ── 3 · REFLECT ──────────────────────────────────────────────────────────────
const reflect = shell({
  title: 'Prax Journal v6 · Reflect (evening)', paper: PAPER.spine, chip: 'evening · daily',
  kicker: 'the daily · evening edition', display: 'Reflect.', sub: 'Notice. Learn. Be kind to yourself. No shame, no red X \u2014 leaving parts blank is still showing up.',
  body: `${dateMeta}
  <div class="sec grid2">
    <div class="card"><h3>done today</h3>${ruled(4)}</div>
    <div class="card"><h3>moved to tomorrow \u2014 no shame</h3>${ruled(4)}</div></div>
  <div class="sec grid3">${scale('evening · mood')}${scale('evening · anxiety')}${scale('evening · energy')}</div>
  <div class="sec grid3">
    ${scale('chest · kg (am)', 5)}${scale('chest · kg (mid)', 5)}${scale('chest · kg (eve)', 5)}</div>
  <div class="sec"><div class="sec-label">one thing i learned <span>about myself, today</span></div><div class="line tall"></div></div>
  <div class="sec"><div class="sec-label">free write · say anything <span>or leave it blank</span></div><div class="write"></div></div>`,
});

// ── 4 · BRAIN DUMP ───────────────────────────────────────────────────────────
const brain = shell({
  title: 'Prax Journal v6 · Brain Dump', paper: PAPER.kawaii, chip: 'free page · daily',
  kicker: 'the daily · free page', display: 'Brain dump.', sub: 'Plug stickers · freewrite · doodle · whatever lands. No rules here. Say anything, or leave it all blank.',
  body: `${dateMeta}
  <div class="sec"><div class="sec-label">stickers you could use <span>or anything else</span></div>
    <div class="chips"><span class="chip">three good things</span><span class="chip">grateful for</span><span class="chip">win today</span><span class="chip">thought flip</span><span class="chip">tell a friend</span><span class="chip">if\u2013then plan</span><span class="chip">craving surf</span><span class="chip">wins jar</span><span class="chip">mood dot</span></div></div>
  <div class="sec"><div class="write" style="min-height:150mm;background-image:radial-gradient(rgba(31,33,38,.16) .5pt,transparent .6pt);background-size:6mm 6mm;background-position:4mm 4mm"></div>
    <p class="note">Say anything. Or nothing. It\u2019s just paper.</p></div>`,
});

// ── 5 · WEEKLY ───────────────────────────────────────────────────────────────
const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const weekly = shell({
  title: 'Prax Journal v6 · Weekly Review', paper: PAPER.weekly, chip: 'weekly · sunday',
  kicker: 'sunday review · week ending', display: 'This week.', sub: 'Seven days, one aperture. You showed up. That counts.',
  body: `<div class="row-meta"><span>week of <b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b></span><span>week <b>&nbsp;&nbsp;/&nbsp;&nbsp;</b></span></div>
  <div class="sec"><div class="sec-label">what i want next week to feel like <span>one sentence · say it plain</span></div><div class="line tall"></div></div>
  <div class="sec"><div class="sec-label">the week at a glance <span>mood · chest-kg · one word</span></div>
    <table class="tbl"><thead><tr><th style="width:24mm"></th>${days.map(d => `<th style="text-align:center">${d}</th>`).join('')}</tr></thead>
    <tbody>${['mood', 'chest · kg', 'one word'].map(r => `<tr><td style="font-family:var(--mono);font-size:7pt;color:var(--quiet)">${r}</td>${days.map(() => '<td></td>').join('')}</tr>`).join('')}</tbody></table></div>
  <div class="sec grid2">
    <div class="card"><h3>wins jar \u2014 especially tiny</h3>${ruled(5)}</div>
    <div class="card"><h3>named patterns \u2014 one tick each time</h3><div class="chips"><span class="chip">doom scroll</span><span class="chip">catastrophize</span><span class="chip">prereq trap</span><span class="chip">rejection scanner</span></div><div style="margin-top:3mm">${ruled(2)}</div></div></div>
  <div class="sec grid2">
    <div class="card"><h3>worked \u2014 keep doing</h3>${ruled(3)}</div>
    <div class="card"><h3>didn\u2019t \u2014 try different</h3>${ruled(3)}</div></div>
  <div class="sec"><div class="sec-label">next week · the frog <span>eat it early · finish by tuesday</span></div><div class="line tall"></div></div>`,
});

// ── 6 · MONTHLY ──────────────────────────────────────────────────────────────
const monthly = shell({
  title: 'Prax Journal v6 · Monthly Review', paper: PAPER.monthly, chip: 'monthly · close',
  kicker: 'monthly review · month ending', display: 'This month.', sub: 'Thirty days, one reflection. Say it plain \u2014 the mood, not the metrics.',
  body: `<div class="row-meta"><span>month <b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b></span><span>year <b>&nbsp;&nbsp;&nbsp;&nbsp;</b></span></div>
  <div class="sec"><div class="sec-label">felt like <span>1\u20132 sentences · before you look at the data</span></div><div class="line tall"></div><div class="line tall"></div></div>
  <div class="sec grid2">
    <div class="card"><h3>wins \u2014 from memory, not the jar</h3>${ruled(5)}</div>
    <div class="card"><h3>patterns \u2014 what kept happening</h3>${ruled(5)}</div></div>
  <div class="sec grid2">
    <div class="card"><h3>best day \u2014 when it clicked &nbsp; day #</h3><div class="line"></div><p class="note">why · what made it work</p></div>
    <div class="card"><h3>hardest day \u2014 when it didn\u2019t &nbsp; day #</h3><div class="line"></div><p class="note">why · what pulled you under</p></div></div>
  <div class="sec"><div class="sec-label">next month <span>what i want it to feel like \u2014 one sentence</span></div><div class="line tall"></div></div>
  <p class="note">Reminder: AirDrop this notebook to AI for the data version \u2014 cigs total · mood mean · chest-kg delta · pattern tally · best/worst day computed.</p>`,
});

// ── 7 · QUARTERLY ────────────────────────────────────────────────────────────
const quarterly = shell({
  title: 'Prax Journal v6 · Season Review', paper: PAPER.reference, chip: 'season · quarter',
  kicker: 'season review · quarter ending', display: 'This season.', sub: 'Ninety days \u2014 who did I become. Prose, not bullets. Tell the story you\u2019d tell a friend.',
  body: `<div class="row-meta"><span>range <b>Q&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b></span></div>
  <div class="sec"><div class="sec-label">narrative <span>in three sentences, what happened \u2014 no metrics, plain voice</span></div><div class="write" style="min-height:42mm"></div></div>
  <div class="sec grid2">
    <div class="card"><h3>worked \u2014 prove-it moments</h3>${ruled(3)}</div>
    <div class="card"><h3>didn\u2019t \u2014 honest, not cruel</h3>${ruled(3)}</div></div>
  <div class="sec"><div class="sec-label">changed \u2014 who i am now <span>the identity shifts</span></div>${ruled(3)}</div>
  <div class="sec"><div class="sec-label">next season <span>what i want it to feel like \u2014 say it like you mean it</span></div><div class="line tall"></div></div>
  <p class="note">Reminder: AirDrop for the narrative version \u2014 90-day cig trend · mood trajectory · chest-kg delta · pattern tally across months · named identity shifts.</p>`,
});

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const pages: [string, string][] = [
    ['today.html', today], ['midday.html', midday], ['reflect.html', reflect],
    ['brain-dump.html', brain], ['weekly.html', weekly], ['monthly.html', monthly], ['quarterly.html', quarterly],
  ];
  for (const [name, html] of pages) await fs.writeFile(path.join(OUT, name), html, 'utf-8');
  console.log(`[v5-restyled] wrote ${pages.length} pages → ${path.relative(process.cwd(), OUT)}`);
  for (const [name] of pages) console.log('  · ' + name);
}
main().catch(e => { console.error('[v5-restyled] failed:', e instanceof Error ? e.stack : e); process.exit(1); });
