/**
 * build-tools.ts — Prax Journal v7 · Notebook B (Tools & Reference) + Notebook C (Pomodoro)
 *
 * Completes the system: rebuilds the v5/v6 tool pages from scratch in the locked
 * v6 design language, render-verified to A4. Each page is emitted both as an
 * individual single-page PDF (insert into GoodNotes on demand) AND concatenated
 * into bundle PDFs (tools-reference.pdf, pomodoro-pad.pdf). Render-QA gate
 * (A4 / overflow=0 / minFont>=7px) fails loudly — "built" never means "claimed".
 *
 * Privacy (spec §5): no real names, no medication doses. Crisis numbers are public
 * helplines (re-verify before relying).
 *
 * Run: ./node_modules/.bin/tsx cline/build-tools.ts
 */

import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'output', 'tools');

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">';

const CSS = `
:root{
  --pad:20mm; --paper:#F6EFE2; --shelf:#F2F0EC; --ref:#F0F0EF; --kawaii:#FBF4EC;
  --ink:#1f2126; --soft:#3f4046; --quiet:#6E6658; --whisper:#B5AD9F;
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
.page{width:210mm;height:297mm;background:var(--bg,var(--paper));margin:10mm auto;padding:var(--pad);
  position:relative;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(31,33,38,.11)}
@media print{html,body{background:#fff}.page{margin:0;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:A4 portrait;margin:0}}
.bind{position:absolute;left:0;top:0;height:100%;width:6mm;background:var(--bleed);z-index:0}
.page::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.55;background-image:radial-gradient(rgba(31,33,38,.02) .5px,transparent .5px);background-size:3px 3px}
.spine{position:absolute;right:3mm;top:50%;transform:translate(50%,-50%) rotate(90deg);font-family:var(--mono);font-size:6pt;letter-spacing:.3em;text-transform:uppercase;color:var(--whisper);white-space:nowrap;z-index:1}
.crisis{position:absolute;bottom:7mm;right:9mm;font-family:var(--mono);font-size:6pt;letter-spacing:.06em;color:var(--clay);text-decoration:none;opacity:.6;z-index:2}
.head{border-bottom:.5px solid var(--whisper);padding-bottom:4mm;margin-bottom:6mm;position:relative;z-index:1}
.kicker{font-family:var(--mono);font-size:6pt;font-weight:500;text-transform:uppercase;letter-spacing:.24em;color:var(--quiet);margin-bottom:3.5mm}
h1{font-family:var(--serif);font-style:italic;font-weight:400;font-size:31pt;line-height:.9;letter-spacing:-.018em;color:var(--ink);font-variation-settings:"opsz" 144}
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
.scale{display:flex;gap:1.5mm;margin-top:1mm}
.pip{width:4.4mm;height:4.4mm;border:.5px solid var(--whisper);border-radius:50%;font-family:var(--mono);font-size:6pt;color:var(--whisper);display:flex;align-items:center;justify-content:center}
.two{display:flex;gap:5mm}.two>div{flex:1;min-width:0}
.tbl{width:100%;border-collapse:collapse;margin-top:1mm}
.tbl th{font-family:var(--mono);font-size:6pt;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--quiet);text-align:left;padding:1.4mm 2mm;border-bottom:.5px solid var(--whisper)}
.tbl td{height:8mm;border-bottom:.5px solid var(--hair);padding:0 2mm}
.tbl td.num{font-family:var(--mono);font-size:7pt;color:var(--whisper);width:8mm}
.perm{margin-top:auto;background:var(--clay-tint);border-left:1.5px solid var(--clay);border-radius:0 2px 2px 0;padding:2.6mm 4mm;font-family:var(--serif);font-style:italic;font-size:7.5pt;color:#8a5e44;font-variation-settings:"opsz" 14;line-height:1.45;position:relative;z-index:1}
.toc{display:grid;grid-template-columns:30mm 1fr auto;gap:5mm;align-items:baseline;padding:4mm 0;border-bottom:.4px solid var(--hair)}
.toc .k{font-family:var(--mono);font-size:8pt;letter-spacing:.14em;text-transform:uppercase;color:var(--sage)}
.toc .t{font-family:var(--serif);font-style:italic;font-size:14pt;color:var(--ink);line-height:1.1}
.toc .s{font-family:var(--sans);font-size:8pt;color:var(--quiet);margin-top:1mm}
.toc .pp{font-family:var(--mono);font-size:7pt;color:var(--whisper)}
.big-quote{font-family:var(--serif);font-style:italic;font-size:22pt;color:var(--ink);font-variation-settings:"opsz" 100;line-height:1.28;flex:1;display:flex;align-items:center}
.tel{display:grid;grid-template-columns:1fr auto;gap:4mm;align-items:baseline;padding:3mm 0;border-bottom:.4px solid var(--hair)}
.tel .who{font-family:var(--sans);font-size:10pt;color:var(--ink)}
.tel .num{font-family:var(--mono);font-size:11pt;color:var(--sage)}
.ground{background:var(--sage-tint);border-left:1.5px solid var(--sage);border-radius:0 2px 2px 0;padding:3mm 4mm;margin-top:2mm}
.ground div{font-family:var(--serif);font-style:italic;font-size:9.5pt;color:var(--sage);line-height:1.5}
.frame{border:.7px dashed var(--sage-edge);border-radius:3px;flex:1;min-height:120mm;display:flex;align-items:flex-start;justify-content:flex-end;padding:3mm}
.frame span{font-family:var(--mono);font-size:7pt;color:var(--whisper)}
`;

function shell(spine: string, kicker: string, title: string, sub: string, body: string, opts: { bg?: string; crisis?: boolean } = {}): string {
  const bg = opts.bg ? ` style="--bg:${opts.bg}"` : '';
  const crisis = opts.crisis !== false;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">${FONTS}<style>${CSS}</style></head>
<body><main class="page"${bg}><div class="bind"></div><div class="spine">${spine}</div>
<header class="head"><div class="kicker">${kicker}</div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</header>
${body}${crisis ? '<a href="#" class="crisis">[crisis]</a>' : ''}</main></body></html>`;
}
const chips = (o: string[]) => `<div class="chips">${o.map(x => `<span class="chip">${x}</span>`).join('')}</div>`;
function scale(max = 10): string { let s = ''; for (let i = 0; i <= max; i++) s += `<span class="pip">${i}</span>`; return `<div class="scale">${s}</div>`; }
// sage 25-min clock dial (matches Notebook C palette)
function clock(size: number, opacity = 1): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${opacity}">
    <circle cx="50" cy="52" r="38" fill="#FBF4EC" stroke="#4E6249" stroke-width="3"/>
    <circle cx="50" cy="52" r="38" fill="none" stroke="#7e9b85" stroke-width="3" stroke-dasharray="62 200" stroke-linecap="round" transform="rotate(-90 50 52)"/>
    <line x1="50" y1="52" x2="50" y2="28" stroke="#4E6249" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="52" x2="66" y2="52" stroke="#7e9b85" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="50" cy="52" r="3.4" fill="#4E6249"/>
    <rect x="44" y="8" width="12" height="7" rx="2" fill="#c08866"/>
  </svg>`;
}

// ── NOTEBOOK B ──────────────────────────────────────────────────────────────
function quickStart(): string {
  const rows = [
    ['daily', 'the spine', 'morning + evening are owed. brain dump + midday when you need them.', 'A'],
    ['cards', 'the truth deck', 'truth · quote · pill — pick what you can handle; drop one sticker.', 'A'],
    ['tools', 'when a problem shows up', 'cbt · self-worth · tiny task · 30-min experiment.', 'B'],
    ['reference', 'always here', 'crisis card · permission · stock-up · scene capture.', 'B'],
    ['cycle', 'weekly · monthly', 'light review pages. no forms, no scoring.', 'B'],
    ['doorways', 'deep work', 'four identity doorways. pick one — the other can wait.', 'B'],
    ['pomodoro', 'focus sessions', 'capture stray thoughts; catch & decide.', 'C'],
  ].map(([k, t, s, nb]) => `<div class="toc"><div class="k">${k}</div><div><div class="t">${t}</div><div class="s">${s}</div></div><div class="pp">bk ${nb}</div></div>`).join('');
  return shell('quick start', '§ reference · how this works', 'What this is.',
    'A system you don\u2019t have to finish. Only two pages are owed each day. Pull what fits; skip what doesn\u2019t. Depth is allowed; debt is not.',
    `<section class="b">${rows}</section><aside class="perm">the kit doesn\u2019t ask for completion. flip past anything.</aside>`, { bg: 'var(--ref)' });
}
function permission(): string {
  return shell('permission', '§ reference · permission', 'Permission.', '',
    `<div class="big-quote">\u201CThe curious paradox is that when I accept myself just as I am, then I can change.\u201D</div>
     <div class="b" style="font-family:var(--mono);font-size:8pt;letter-spacing:.1em;color:var(--quiet)">\u2014 carl rogers</div>
     <aside class="perm">one copy. read it when the day asks you to earn your own worth. you don\u2019t.</aside>`, { bg: 'var(--ref)' });
}
function crisisCard(): string {
  const tel = [
    ['iCALL', '+91 9152987821'], ['Vandrevala', '1860 2662 345'],
    ['AASRA', '+91 22 2754 6669'], ['NIMHANS', '080 4611 0007'],
  ].map(([w, n]) => `<div class="tel"><div class="who">${w}</div><div class="num">${n}</div></div>`).join('');
  return shell('crisis', '§ crisis card · always available', 'If you\u2019re in crisis.',
    'India helplines. International: 988 / 116 123 / 13 11 14. Re-verify numbers periodically.',
    `<section class="b">${tel}</section>
     <section class="b"><div class="lab">if you can\u2019t dial yet \u2014 try this</div>
       <div class="ground"><div>5 things you can see.</div><div>4 things you can touch.</div><div>3 things you can hear.</div><div>2 things you can smell.</div><div>1 slow breath.</div></div>
     </section>
     <aside class="perm">you don\u2019t have to be sure to call. you don\u2019t have to know what to say. the person picking up has heard it before, and would rather hear from you.</aside>`,
    { bg: 'var(--ref)', crisis: false });
}
function cbt(): string {
  return shell('cbt record', '§ tool · cbt thought record', 'What did the thought say.',
    'When a thought is running you. Not daily \u2014 maybe a few times a week.',
    `<section class="b"><div class="lab">situation <span class="n">\u2014 what happened? one sentence, just facts</span></div><div class="line"></div></section>
     <section class="b"><div class="lab">emotion <span class="n">\u2014 what came up? how loud?</span></div><div class="two" style="align-items:flex-end"><div><div class="line"></div></div><div>${scale(10)}</div></div></section>
     <section class="b"><div class="lab">thought \u00b7 verbatim <span class="n">\u2014 no editing</span></div><div class="dots" style="height:16mm"></div></section>
     <section class="b"><div class="lab">pattern (optional \u2014 circle if it fits)</div>${chips(['catastrophizing', 'all-or-nothing', 'mind-reading', 'fortune-telling', 'filter', 'should', 'personalization'])}</section>
     <section class="b two">
       <div><div class="lab">evidence for</div><div class="dots" style="height:18mm"></div></div>
       <div><div class="lab">evidence against</div><div class="dots" style="height:18mm"></div></div>
     </section>
     <section class="b"><div class="lab">balanced <span class="n">\u2014 a sentence that holds both</span></div><div class="line"></div></section>
     <section class="b"><div class="lab">next action <span class="n">\u2014 one tiny step</span></div><div class="line"></div></section>
     <aside class="perm">if you only filled the thought, that\u2019s still data.</aside>`, { bg: 'var(--shelf)' });
}
function selfWorth(): string {
  return shell('self-worth', '§ tool · self-worth reframe', 'Talk it down.',
    'When the \u201CI\u2019m worthless\u201D thought hits specifically. Lighter than a full CBT record.',
    `<section class="b"><div class="prompt">what\u2019s the actual evidence for this thought?</div><div class="dots" style="height:20mm"></div></section>
     <section class="b"><div class="prompt">what would you say to a friend telling you the same thing?</div><div class="dots" style="height:20mm"></div></section>
     <section class="b"><div class="prompt">what\u2019s the kindest version of this that\u2019s still honest?</div><div class="dots" style="height:20mm"></div></section>
     <section class="b"><div class="prompt">one small thing that\u2019s true even if the rest is?</div><div class="line"></div></section>
     <aside class="perm">talking it down isn\u2019t winning. it\u2019s just talking.</aside>`, { bg: 'var(--shelf)' });
}
function tinyTask(): string {
  return shell('tiny task', '§ tool · the tiny task', 'The smallest first move.',
    'When you\u2019re stuck staring at a big task. Break \u2192 tiny \u2192 first physical action.',
    `<section class="b"><div class="lab">the tiny task <span class="n">\u2014 the smallest version of the important one</span></div><div class="line"></div></section>
     <section class="b"><div class="lab">first physical action <span class="n">\u2014 open laptop \u00b7 click email \u00b7 write \u201CDear ___\u201D</span></div><div class="line"></div></section>
     <section class="b"><div class="lab">what\u2019s pulling at you?</div><div class="dots" style="height:18mm"></div></section>
     <section class="b"><div class="lab">10% easier <span class="n">\u2014 what would make this 10% easier?</span></div><div class="dots" style="height:18mm"></div></section>
     <aside class="perm">the tiny task counts. the rest is bonus. (the frog lives on the morning page.)</aside>`, { bg: 'var(--shelf)' });
}
function experiment(): string {
  return shell('experiment', '§ tool · the 30-minute experiment', 'One timer. One observation.',
    'When you need to prove to yourself something isn\u2019t as bad as your brain says.',
    `<section class="b"><div class="lab">step 1 \u00b7 name it <span class="n">\u2014 the experiment</span></div><div class="line"></div></section>
     <section class="b"><div class="lab">step 2 \u00b7 shrink it <span class="n">\u2014 the smallest version</span></div><div class="two" style="align-items:flex-end"><div><div class="line"></div></div><div style="flex:0 0 40mm"><div class="hint">timer set for ___ min</div></div></div></section>
     <section class="b"><div class="lab">step 3 \u00b7 during <span class="n">\u2014 what I noticed</span></div><div class="dots" style="height:22mm"></div></section>
     <section class="b"><div class="lab">step 4 \u00b7 after <span class="n">\u2014 what happened</span></div><div class="dots" style="height:22mm"></div></section>
     <aside class="perm">one data point. not a streak. stopped early? write down where you stopped \u2014 that\u2019s the data.</aside>`, { bg: 'var(--shelf)' });
}
function sceneCapture(): string {
  return shell('scene', '§ reference · scene capture', 'The moment, framed.',
    'A low-writing page for foggy days. Sketch or paste a photo; one line of caption.',
    `<section class="b"><div class="frame"><span>frame \u2197</span></div></section>
     <section class="b"><div class="lab">caption</div><div class="line"></div></section>
     <aside class="perm">small frames count. one moment is enough.</aside>`, { bg: 'var(--kawaii)' });
}
function stockUp(): string {
  const cats = ['toiletries', 'medicines & medical basics', 'food / hydration basics', 'cleaning supplies', 'processing / storage jars', 'stationery / goodnotes supplies', 'personal care', 'small household things', 'follow-ups / buy later'];
  const rows = cats.map(c => `<tr><td>${c}</td><td style="text-align:center;width:18mm">lo</td><td style="text-align:center;width:18mm">ok</td><td></td></tr>`).join('');
  return shell('stock-up', '§ reference · stock-up', 'What needs restocking.', '',
    `<section class="b"><table class="tbl"><thead><tr><th></th><th style="text-align:center">running low?</th><th style="text-align:center">restocked?</th><th>notes</th></tr></thead><tbody>${rows}</tbody></table></section>
     <aside class="perm">this is just a list. no streaks. no scoring.</aside>`, { bg: 'var(--ref)' });
}
function doorway(letter: string, kicker: string, title: string, lede: string, qs: string[], ground?: string[]): string {
  const qsHtml = qs.map((q, i) => `<section class="b"><div class="lab">${i + 1}</div><div class="prompt">${q}</div><div class="dots" style="height:${ground ? 13 : 18}mm"></div></section>`).join('');
  const groundHtml = ground ? `<section class="b"><div class="lab">if this spirals \u2014 read this</div><div class="ground">${ground.map(g => `<div>${g}</div>`).join('')}</div></section>` : '';
  return shell(`doorway ${letter.toLowerCase()}`, kicker, title, lede, qsHtml + groundHtml +
    `<aside class="perm">one of these is enough. or none. blank is a complete entry.</aside>`, { bg: 'var(--shelf)' });
}

// ── NOTEBOOK C — POMODORO ───────────────────────────────────────────────────
function pomoCapture(): string {
  const rows = Array.from({ length: 9 }, (_, i) => `<tr><td class="num">${String(i + 1).padStart(2, '0')}</td><td></td></tr>`).join('');
  return shell('pomodoro · capture', '§ focus · capture', 'During the sprint.',
    'A stray thought arrives mid-focus. Park it here \u2014 it\u2019ll keep \u2014 and go back to the one thing.',
    `<section class="b"><div style="display:flex;align-items:center;gap:4mm;margin-bottom:2mm">${clock(28)}<div class="lab" style="margin:0">the thought \u2014 park it \u2014 back to focus</div></div>
       <table class="tbl"><thead><tr><th>#</th><th>the thought (it\u2019s safe here)</th></tr></thead><tbody>${rows}</tbody></table></section>
     <aside class="perm">the idea is safe here. it\u2019ll keep. back to the one thing.</aside>`, { bg: 'var(--kawaii)' });
}
function pomoCatchDecide(): string {
  const rows = Array.from({ length: 8 }, () => `<tr><td></td><td></td></tr>`).join('');
  return shell('pomodoro · catch', '§ focus · catch & decide', 'Two piles, mid-sprint.',
    'Catch it now on the left. Decide what to do with it after the sprint, on the right.',
    `<section class="b"><div style="display:flex;justify-content:flex-end;margin-bottom:1mm">${clock(26, 0.9)}</div><table class="tbl"><thead><tr><th>during the sprint \u2192 (catch)</th><th>for later \u2192 (decide after)</th></tr></thead><tbody>${rows}</tbody></table></section>
     <aside class="perm">catch it left. decide it later, right. the sprint keeps going.</aside>`, { bg: 'var(--kawaii)' });
}

export interface Job { name: string; bundle: 'tools' | 'pomodoro'; html: string }
export const JOBS: Job[] = [
  { name: '01-quick-start', bundle: 'tools', html: quickStart() },
  { name: '02-permission', bundle: 'tools', html: permission() },
  { name: '03-crisis-card', bundle: 'tools', html: crisisCard() },
  { name: '04-cbt-thought-record', bundle: 'tools', html: cbt() },
  { name: '05-self-worth-reframe', bundle: 'tools', html: selfWorth() },
  { name: '06-tiny-task', bundle: 'tools', html: tinyTask() },
  { name: '07-30-min-experiment', bundle: 'tools', html: experiment() },
  { name: '08-scene-capture', bundle: 'tools', html: sceneCapture() },
  { name: '09-stock-up', bundle: 'tools', html: stockUp() },
  { name: '10-doorway-A', bundle: 'tools', html: doorway('A', '§ doorway A · tuesday morning', 'Two years from now.', 'When you wake on a regular Tuesday two years from now and you\u2019re proud of yourself \u2014 what does that morning look like? (Not the achievement. The morning.)', ['What time is it, and what wakes you?', 'Who else is nearby?', 'What do you do in the first hour, slowly, in order?', 'What is your body actually feeling?']) },
  { name: '11-doorway-B', bundle: 'tools', html: doorway('B', '§ doorway B · the sentence', 'The sentence.', 'When someone you respect describes you to someone else \u2014 what one sentence do you want them to say?', ['Not your title or salary. The sentence about what you are like as a person.', 'Who is saying it, in your head?', 'If the sentence won\u2019t come, write the one you\u2019re afraid they\u2019d say.', 'What\u2019s the gap between those two, in plain language?']) },
  { name: '12-doorway-C', bundle: 'tools', html: doorway('C', '§ doorway C · before it got heavy', 'Before it got heavy.', 'What did the version of you at 18 or 20 \u2014 before all of this \u2014 actually love doing?', ['Not what you were good at. What you enjoyed. Without comparison.', 'Where were you? Who was around, or were you alone?', 'When did you stop, and what made you stop?', 'Is there one piece of that that could exist again \u2014 not as a project, just as a presence?']) },
  { name: '13-doorway-D', bundle: 'tools', html: doorway('D', '§ doorway D · fear projection', 'Five years, exactly like this.', 'What does that feel like in your body?', ['Where in the body does it land first?', 'Sharp, dull, hot, cold, heavy, hollow, tight, numb?', 'If the sensation had a sentence, in 6 words or fewer?'], ['feet on the floor. press them down for one breath.', 'name 5 things you can see, 4 you can hear, 3 you can touch.', 'close the journal. it will be here when you come back.', 'if it goes deeper than that \u2192 tap [crisis].']) },
  { name: '14-pomodoro-capture', bundle: 'pomodoro', html: pomoCapture() },
  { name: '15-pomodoro-catch-decide', bundle: 'pomodoro', html: pomoCatchDecide() },
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
  const bundles: Record<string, PDFDocument> = { tools: await PDFDocument.create(), pomodoro: await PDFDocument.create() };
  try {
    for (const job of JOBS) {
      const { pdf, overflow, min } = await renderPage(browser, job.html);
      report.push({ name: job.name, overflowPx: overflow, minFontPx: Math.round(min * 10) / 10, verdict: overflow <= 1 && min >= 7 ? 'pass' : 'fail' });
      const src = await PDFDocument.load(pdf);
      // individual single-page PDF
      const one = await PDFDocument.create();
      const [op] = await one.copyPages(src, [0]); one.addPage(op);
      await fs.writeFile(path.join(OUT, `${job.name}.pdf`), await one.save({ useObjectStreams: false }));
      await fs.writeFile(path.join(OUT, `${job.name}.html`), job.html, 'utf-8');
      // into bundle
      const [bp] = await bundles[job.bundle].copyPages(src, [0]); bundles[job.bundle].addPage(bp);
    }
    bundles.tools.setTitle('Prax Journal v7 — Tools & Reference (Notebook B)');
    bundles.pomodoro.setTitle('Prax Journal v7 — Pomodoro Pad (Notebook C)');
    await fs.writeFile(path.join(OUT, 'tools-reference.pdf'), await bundles.tools.save({ useObjectStreams: false }));
    await fs.writeFile(path.join(OUT, 'pomodoro-pad.pdf'), await bundles.pomodoro.save({ useObjectStreams: false }));
  } finally {
    await browser.close();
  }
  console.log('\n[tools] render-QA:');
  let allPass = true;
  for (const q of report) { const ok = q.verdict === 'pass'; allPass = allPass && ok; console.log(`  ${ok ? '\u2713' : '\u2717'} ${q.name.padEnd(24)} overflow=${q.overflowPx}px  minFont=${q.minFontPx}px \u2192 ${q.verdict}`); }
  console.log(`\n[tools] ${JOBS.length} pages \u2192 cline/output/tools/ (+ tools-reference.pdf, pomodoro-pad.pdf)`);
  if (!allPass) { console.error('[tools] FAIL \u2014 fix overflow/font before shipping.'); process.exit(2); }
  console.log('[tools] all pages pass A4 / overflow / legibility.');
}

main().catch(err => { console.error('[tools] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
