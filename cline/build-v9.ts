/**
 * build-v9.ts — Prax Journal v9 · Beautified 30-Day Bundle (Cline)
 *
 * v9 = v7 content, made warmer and scaled to a month. Three things, additive only
 * (no tone/content rewrite — Surgical Changes):
 *
 *  1. BEAUTIFICATION (ui-ux-pro-max lens): a faint, *page-content-aware* watermark
 *     behind every daily page (sunrise on morning, soft cloud on brain-dump, high
 *     sun on midday, crescent-moon + stars on evening), plus a small cute corner
 *     "sprig" that rotates per day so the month feels alive. Everything faint
 *     (opacity ~.05) and CLIPPED in a .bleed-layer so a bleeding decoration can
 *     never inflate page scrollHeight (the lesson from build-pomodoro-tomato.ts).
 *
 *  2. 30 DAYS: the 4-page daily spread (morning · brain-dump · midday · evening),
 *     emitted as day-01.pdf … day-30.pdf (4pp each) AND one daily-30-day-bundle.pdf
 *     (120pp). Render cache keyed by (pageType × dayMotif) keeps it to 24 renders.
 *
 *  3. PACKS: printable sticker-sheet PDFs built from the existing 65 sticker PNGs
 *     (truth/quote/pill), then a v9-master-bundle.pdf concatenating the beautified
 *     daily pack + sticker sheets + the existing v7 tools / pomodoro / extras PDFs
 *     (already in the locked design language).
 *
 * Render-QA gate (A4 / overflow<=1 / footer not collided / minFont>=7px) runs on
 * every freshly-rendered daily page and fails loudly. Concatenated v7 PDFs already
 * passed QA in their own generators.
 *
 * Run: ./node_modules/.bin/tsx cline/build-v9.ts
 * Open: open cline/output/v9/v9-master-bundle.pdf
 */

import { chromium, type Browser } from 'playwright';
import { PDFDocument, rgb, PDFName, PDFArray, type PDFPage } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOBS as TOOL_JOBS } from './build-tools.ts';
import { JOBS as EXTRA_JOBS } from './build-extras.ts';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'output');
const V9 = path.join(OUT, 'v9');
const DAILY_DIR = path.join(V9, 'daily');
const SHEETS_DIR = path.join(V9, 'sticker-sheets');

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">';

// ── Shared stylesheet — locked v6/v7 design language + v9 beautification ─────
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

/* v9 beautification — faint, page-content-aware watermark + corner sprig.
   CLIPPED so a bleeding decoration can never inflate scrollHeight (QA-safe). */
.bleed-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.wm{position:absolute;right:-14mm;bottom:6mm}
.sprig{position:absolute;left:9mm;top:8mm}

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
.meta .dn{color:var(--sage);opacity:.7}

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

// ── v9 beautification: faint page-content-aware watermarks ──────────────────
// Each daily page type gets a thematically-matched faint motif behind the
// content. Sage/clay tones, opacity ~.05 so it sits under the writing surface.
type PageType = 'morning' | 'brain' | 'midday' | 'evening';

function watermark(kind: PageType): string {
  const O = '0.055';
  if (kind === 'morning') {
    // sunrise: arc + rays low on the page
    return `<svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${O}">
      <circle cx="50" cy="66" r="20" fill="#d6a45e"/>
      <g stroke="#c08866" stroke-width="2.4" stroke-linecap="round">
        <line x1="50" y1="30" x2="50" y2="40"/><line x1="28" y1="38" x2="34" y2="45"/><line x1="72" y1="38" x2="66" y2="45"/>
        <line x1="16" y1="58" x2="25" y2="60"/><line x1="84" y1="58" x2="75" y2="60"/>
      </g>
      <line x1="10" y1="86" x2="90" y2="86" stroke="#4E6249" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }
  if (kind === 'brain') {
    // soft cloud / swirl of thought
    return `<svg width="160" height="120" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${O}">
      <path d="M30 60 q-16 0 -16 -14 q0 -12 14 -13 q4 -16 22 -16 q16 0 21 14 q15 -2 17 13 q1 14 -14 14 z" fill="#4E6249"/>
      <circle cx="40" cy="78" r="4" fill="#c08866"/><circle cx="54" cy="84" r="2.6" fill="#c08866"/>
    </svg>`;
  }
  if (kind === 'midday') {
    // full sun high
    return `<svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${O}">
      <circle cx="50" cy="50" r="22" fill="#d6a45e"/>
      <g stroke="#c08866" stroke-width="2.4" stroke-linecap="round">
        <line x1="50" y1="14" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="86"/>
        <line x1="14" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="86" y2="50"/>
        <line x1="25" y1="25" x2="31" y2="31"/><line x1="69" y1="69" x2="75" y2="75"/>
        <line x1="69" y1="31" x2="75" y2="25"/><line x1="25" y1="75" x2="31" y2="69"/>
      </g>
    </svg>`;
  }
  // evening: crescent moon + stars
  return `<svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${O}">
    <path d="M64 22 a30 30 0 1 0 14 52 a24 24 0 1 1 -14 -52 z" fill="#4E6249"/>
    <g fill="#d6a45e"><path d="M24 30 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 l4 -1.6 z"/>
      <path d="M30 64 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 z"/></g>
  </svg>`;
}

// small cute corner sprig — rotates per day for gentle month-long variety
function sprig(motif: number): string {
  const O = '0.5';
  const c = '#7e9b85';
  const variants = [
    // 0 leaf
    `<path d="M4 24 q10 -22 22 -22 q0 14 -10 20 q-7 4 -12 2z" fill="${c}"/><line x1="4" y1="24" x2="22" y2="6" stroke="#4E6249" stroke-width="1"/>`,
    // 1 two-leaf sprig
    `<path d="M14 26 q-10 -6 -10 -16 q9 1 12 10z" fill="${c}"/><path d="M14 26 q10 -6 10 -16 q-9 1 -12 10z" fill="${c}"/><line x1="14" y1="26" x2="14" y2="4" stroke="#4E6249" stroke-width="1"/>`,
    // 2 berry cluster
    `<circle cx="9" cy="14" r="4" fill="#c08866"/><circle cx="18" cy="10" r="4" fill="#c08866"/><circle cx="15" cy="20" r="4" fill="#c08866"/><line x1="14" y1="22" x2="20" y2="2" stroke="#4E6249" stroke-width="1"/>`,
    // 3 fern frond
    `<line x1="14" y1="26" x2="14" y2="2" stroke="#4E6249" stroke-width="1"/><g stroke="${c}" stroke-width="1.6" stroke-linecap="round"><line x1="14" y1="8" x2="8" y2="5"/><line x1="14" y1="8" x2="20" y2="5"/><line x1="14" y1="15" x2="7" y2="13"/><line x1="14" y1="15" x2="21" y2="13"/><line x1="14" y1="21" x2="9" y2="20"/><line x1="14" y1="21" x2="19" y2="20"/></g>`,
    // 4 bud
    `<path d="M14 26 q-5 -10 0 -22 q5 12 0 22z" fill="${c}"/><circle cx="14" cy="4" r="3.4" fill="#d6a45e"/>`,
    // 5 little flower
    `<g fill="#d6a45e"><circle cx="14" cy="8" r="3.4"/><circle cx="8" cy="13" r="3.4"/><circle cx="20" cy="13" r="3.4"/><circle cx="11" cy="20" r="3.4"/><circle cx="17" cy="20" r="3.4"/></g><circle cx="14" cy="14" r="2.6" fill="#c08866"/>`,
  ];
  return `<svg width="26" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${O}">${variants[motif % variants.length]}</svg>`;
}

// ── v9: content-aware watermark set (covers tool/extra pages too) ───────────
type WmKind = PageType | 'permission' | 'crisis' | 'reflect' | 'leaf' | 'clock' | 'door' | 'letter' | 'calendar';
function wm(kind: WmKind): string {
  const O = '0.055';
  switch (kind) {
    case 'morning': case 'brain': case 'midday': case 'evening': return watermark(kind);
    case 'permission':
      return `<svg width="170" height="150" viewBox="0 0 120 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M60 26 q-20 -12 -46 -8 v54 q26 -4 46 8 q20 -12 46 -8 v-54 q-26 -4 -46 8z" fill="none" stroke="#4E6249" stroke-width="3"/><line x1="60" y1="26" x2="60" y2="80" stroke="#4E6249" stroke-width="3"/></svg>`;
    case 'crisis':
      return `<svg width="150" height="150" viewBox="0 0 100 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M50 80 C20 58 18 34 34 28 C44 24 50 32 50 36 C50 32 56 24 66 28 C82 34 80 58 50 80z" fill="#c08866"/></svg>`;
    case 'reflect':
      return `<svg width="160" height="140" viewBox="0 0 110 96" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M18 16 h74 a8 8 0 0 1 8 8 v36 a8 8 0 0 1 -8 8 h-46 l-18 16 v-16 h-10 a8 8 0 0 1 -8 -8 v-36 a8 8 0 0 1 8 -8z" fill="none" stroke="#4E6249" stroke-width="3"/></svg>`;
    case 'door':
      return `<svg width="150" height="160" viewBox="0 0 90 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M20 92 V40 a25 25 0 0 1 50 0 V92" fill="none" stroke="#4E6249" stroke-width="3"/><circle cx="60" cy="64" r="3" fill="#c08866"/></svg>`;
    case 'letter':
      return `<svg width="160" height="120" viewBox="0 0 120 84" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="16" width="92" height="60" rx="5" fill="none" stroke="#4E6249" stroke-width="3"/><path d="M14 20 l46 34 l46 -34" fill="none" stroke="#4E6249" stroke-width="3"/></svg>`;
    case 'calendar':
      return `<svg width="150" height="150" viewBox="0 0 100 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="22" width="64" height="58" rx="5" fill="none" stroke="#4E6249" stroke-width="3"/><line x1="18" y1="38" x2="82" y2="38" stroke="#4E6249" stroke-width="3"/><line x1="34" y1="18" x2="34" y2="26" stroke="#c08866" stroke-width="3"/><line x1="66" y1="18" x2="66" y2="26" stroke="#c08866" stroke-width="3"/></svg>`;
    case 'clock':
      return `<svg width="150" height="150" viewBox="0 0 100 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="52" r="34" fill="none" stroke="#4E6249" stroke-width="3"/><line x1="50" y1="52" x2="50" y2="30" stroke="#4E6249" stroke-width="3"/><line x1="50" y1="52" x2="64" y2="52" stroke="#c08866" stroke-width="3"/></svg>`;
    case 'leaf': default:
      return `<svg width="150" height="150" viewBox="0 0 100 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M30 80 q0 -44 44 -56 q4 40 -20 52 q-14 8 -24 4z" fill="#4E6249"/></svg>`;
  }
}

// wrap a FULL v7 page (<main class="page">…</main>) with the v9 bleed-layer.
// also force the page background to the v9 paper so motifs read consistently.
function v9Wrap(innerHtml: string, wmKind: WmKind, motif: number): string {
  const layer = `<div class="bleed-layer" aria-hidden="true"><div class="wm">${wm(wmKind)}</div><div class="sprig">${sprig(motif)}</div></div>`;
  return innerHtml.replace(/(<main class="page"[^>]*>)/, `$1${layer}`);
}

// human titles for the appendix index
const TITLES: Record<string, string> = {
  '01-quick-start': 'What this is — quick start',
  '03-crisis-card': 'If you\u2019re in crisis',
  '04-cbt-thought-record': 'What did the thought say (CBT)',
  '05-self-worth-reframe': 'Talk it down (self-worth)',
  '06-tiny-task': 'The smallest first move',
  '07-30-min-experiment': 'One timer, one observation',
  '08-scene-capture': 'The moment, framed',
  '09-stock-up': 'What needs restocking',
  '10-doorway-A': 'Two years from now',
  '11-doorway-B': 'The sentence',
  '12-doorway-C': 'Before it got heavy',
  '13-doorway-D': 'Five years, exactly like this',
  '14-pomodoro-capture': 'Pomodoro — park the thought',
  '15-pomodoro-catch-decide': 'Pomodoro — catch & decide',
  'reminders-card': 'Remember (the operating rules)',
  'letter-to-no-one': 'Say it here (letter to no one)',
  'monthly-letter': 'Dear next month',
  'weekly-strip': 'This week (weekly strip)',
  'therapy-prep-debrief': 'The session (prep & debrief)',
  'urge-reach-log': 'The wave (urge & phone-reach)',
};

// index page (plain shell — no daily badge/meta); rows carry a back-arrow target
function shellPlain(spine: string, kicker: string, title: string, body: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">${FONTS}<style>${CSS}
  .toc-row{display:flex;gap:4mm;align-items:baseline;padding:1.5mm 0;border-bottom:.4px solid var(--hair)}
  .toc-n{font-family:var(--mono);font-size:7pt;color:var(--sage);width:7mm}
  .toc-t{flex:1;font-family:var(--serif);font-style:italic;font-size:11pt;color:var(--ink);line-height:1.15}
  .toc-p{font-family:var(--mono);font-size:8pt;color:var(--whisper)}
  .backlink{font-family:var(--mono);font-size:6.5pt;letter-spacing:.12em;color:var(--sage);text-decoration:none;position:absolute;bottom:7mm;left:9mm;z-index:3}
  </style></head>
<body><main class="page" role="document">
  <div class="bind" aria-hidden="true"></div>
  <div class="spine" aria-hidden="true">${spine}</div>
  <header class="head"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div></header>
  ${body}
</main></body></html>`;
}
function indexPage(items: { name: string; pp: number }[]): string {
  const rows = items.map((it, i) =>
    `<div class="toc-row"><span class="toc-n">${String(i + 1).padStart(2, '0')}</span><span class="toc-t">${TITLES[it.name] ?? it.name}</span><span class="toc-p">p.${it.pp}</span></div>`
  ).join('');
  const body = `<section class="b" style="margin-bottom:3mm"><div class="hint">one copy of every tool &amp; extra. tap a row to jump; tap “↑ index” on any page to come back.</div></section>
    <section class="b" style="margin-bottom:2mm">${rows}</section>
    <aside class="perm">pull what fits. skip what doesn’t. nothing here is owed.</aside>`;
  return shellPlain('appendix · index', '§ appendix · index', 'Appendix.', body);
}

// extract page 0 of a rendered PDF as a standalone 1-page PDF
async function onePage(srcBytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(srcBytes);
  const doc = await PDFDocument.create();
  const [p] = await doc.copyPages(src, [0]); doc.addPage(p);
  return doc.save({ useObjectStreams: false });
}

// attach a GoTo link annotation (rect in PDF points) to a page, pointing at destRef
function addGoToLink(doc: PDFDocument, page: PDFPage, rect: [number, number, number, number], destRef: any): void {
  const annot = doc.context.obj({
    Type: 'Annot', Subtype: 'Link', Rect: rect, Border: [0, 0, 0],
    Dest: [destRef, PDFName.of('XYZ'), null, null, null],
  });
  const ref = doc.context.register(annot);
  const existing = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (existing) existing.push(ref);
  else page.node.set(PDFName.of('Annots'), doc.context.obj([ref]));
}

// ── small content helpers (verbatim from v7 build-daily.ts) ─────────────────
function meta(dayN?: number): string {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => `<span>${d}</span>`).join('');
  const dn = dayN ? `<div class="dn">day ${String(dayN).padStart(2, '0')} / 30</div>` : '';
  return `<div class="meta">${dn}<div>date · <span class="dl"></span></div><div class="days">day /${days}</div></div>`;
}
function chips(opts: string[]): string { return `<div class="chips">${opts.map(o => `<span class="chip">${o}</span>`).join('')}</div>`; }
function scale(max = 10): string { let s = ''; for (let i = 0; i <= max; i++) s += `<span class="pip">${i}</span>`; return `<div class="scale">${s}</div>`; }

function shell(spine: string, kicker: string, title: string, owed: boolean, body: string, kind: PageType, motif: number, dayN?: number): string {
  const badge = owed ? '<span class="owed">owed</span>' : '<span class="owed" style="color:var(--whisper);border-color:var(--hair)">optional</span>';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${FONTS}<style>${CSS}</style></head>
<body><main class="page" role="document">
  <div class="bind" aria-hidden="true"></div>
  <div class="bleed-layer" aria-hidden="true"><div class="wm">${watermark(kind)}</div><div class="sprig">${sprig(motif)}</div></div>
  <div class="spine" aria-hidden="true">${spine}</div>
  <header class="head"><div><div class="kicker">${kicker}</div><h1>${title}${badge}</h1></div>${meta(dayN)}</header>
  ${body}
  <a href="#" class="crisis">[crisis]</a>
</main></body></html>`;
}

// ── daily bodies (verbatim v7 content) ──────────────────────────────────────
function morning(motif: number, dayN?: number): string {
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
  return shell('morning', '§ daily · morning', 'Today.', true, body, 'morning', motif, dayN);
}
function brainDump(motif: number, dayN?: number): string {
  const body = `
  <section class="b"><div class="prompt">everything in your head — any order, no rules.</div></section>
  <section class="open" aria-label="open paper"></section>
  <div class="sz"><span>sticker zone — drop anything here</span></div>
  <aside class="perm">messy is the point. and — only if they come easily — 3 small things I don't want to erase.</aside>`;
  return shell('brain dump', '§ daily · brain dump', 'Dump it.', false, body, 'brain', motif, dayN);
}
function midday(motif: number, dayN?: number): string {
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
  return shell('midday', '§ daily · midday — a reset, not a restart', 'Midday.', false, body, 'midday', motif, dayN);
}
function evening(motif: number, dayN?: number): string {
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
  return shell('evening', '§ daily · evening close', 'Today is closed.', true, body, 'evening', motif, dayN);
}

const DAYS = 30;
const MOTIFS = 6; // corner-sprig rotation
const PAGE_TYPES: PageType[] = ['morning', 'brain', 'midday', 'evening'];

// ── Render + verify ─────────────────────────────────────────────────────────
interface QA { key: string; overflowPx: number; footerCollision: boolean; minFontPx: number; verdict: 'pass' | 'fail' }

async function renderAndVerify(browser: Browser, key: string, html: string): Promise<{ pdf: Uint8Array; qa: QA }> {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 794, height: 1123 });
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
    let min = 99;
    document.querySelectorAll('*').forEach((n) => {
      const e = n as HTMLElement;
      if (e.childElementCount === 0 && (e.textContent || '').trim()) { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs && fs < min) min = fs; }
    });
    return { overflow, collision, min };
  });
  const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' }, preferCSSPageSize: true });
  await page.close();
  const qa: QA = { key, overflowPx: m.overflow, footerCollision: m.collision, minFontPx: Math.round(m.min * 10) / 10, verdict: m.overflow <= 1 && !m.collision && m.min >= 7 ? 'pass' : 'fail' };
  return { pdf, qa };
}

function bodyFor(kind: PageType, motif: number, dayN: number): string {
  if (kind === 'morning') return morning(motif, dayN);
  if (kind === 'brain') return brainDump(motif, dayN);
  if (kind === 'midday') return midday(motif, dayN);
  return evening(motif, dayN);
}

// embed a folder of sticker PNGs into printable A4 sheets (3 cols × 4 rows)
async function buildStickerSheet(srcDir: string, title: string): Promise<Uint8Array | null> {
  let files: string[];
  try { files = (await fs.readdir(srcDir)).filter(f => f.endsWith('.png')).sort(); } catch { return null; }
  if (files.length === 0) return null;
  const doc = await PDFDocument.create();
  const A4 = { w: 595.28, h: 841.89 }; // pts
  const cols = 3, rows = 4, per = cols * rows;
  const margin = 40, gx = 18, gy = 22;
  const cellW = (A4.w - margin * 2 - gx * (cols - 1)) / cols;
  const cellH = (A4.h - margin * 2 - gy * (rows - 1) - 28) / rows; // 28 reserved for title
  for (let i = 0; i < files.length; i += per) {
    const page = doc.addPage([A4.w, A4.h]);
    const font = await doc.embedFont('Helvetica');
    page.drawText(title, { x: margin, y: A4.h - margin + 6, size: 9, font, color: rgb(0.43, 0.4, 0.35) });
    const slice = files.slice(i, i + per);
    for (let j = 0; j < slice.length; j++) {
      const col = j % cols, row = Math.floor(j / cols);
      const png = await doc.embedPng(await fs.readFile(path.join(srcDir, slice[j])));
      const scale = Math.min(cellW / png.width, cellH / png.height);
      const w = png.width * scale, h = png.height * scale;
      const x = margin + col * (cellW + gx) + (cellW - w) / 2;
      const y = A4.h - margin - 28 - row * (cellH + gy) - h - (cellH - h) / 2 + cellH;
      page.drawImage(png, { x, y: y - cellH, width: w, height: h });
    }
  }
  return doc.save({ useObjectStreams: false });
}

async function mergeInto(target: PDFDocument, srcBytes: Uint8Array | Buffer): Promise<number> {
  const src = await PDFDocument.load(srcBytes);
  const idxs = src.getPageIndices();
  const pages = await target.copyPages(src, idxs);
  pages.forEach(p => target.addPage(p));
  return idxs.length;
}

async function tryRead(p: string): Promise<Buffer | null> { try { return await fs.readFile(p); } catch { return null; } }

// appendix order: tools 01,03–15 then 6 extras (permission 02 is the daily repeat, not here)
const APPENDIX: { name: string; wm: WmKind }[] = [
  { name: '01-quick-start', wm: 'leaf' }, { name: '03-crisis-card', wm: 'crisis' },
  { name: '04-cbt-thought-record', wm: 'reflect' }, { name: '05-self-worth-reframe', wm: 'reflect' },
  { name: '06-tiny-task', wm: 'leaf' }, { name: '07-30-min-experiment', wm: 'clock' },
  { name: '08-scene-capture', wm: 'leaf' }, { name: '09-stock-up', wm: 'calendar' },
  { name: '10-doorway-A', wm: 'door' }, { name: '11-doorway-B', wm: 'door' },
  { name: '12-doorway-C', wm: 'door' }, { name: '13-doorway-D', wm: 'door' },
  { name: '14-pomodoro-capture', wm: 'clock' }, { name: '15-pomodoro-catch-decide', wm: 'clock' },
  { name: 'reminders-card', wm: 'leaf' }, { name: 'letter-to-no-one', wm: 'letter' },
  { name: 'monthly-letter', wm: 'calendar' }, { name: 'weekly-strip', wm: 'calendar' },
  { name: 'therapy-prep-debrief', wm: 'reflect' }, { name: 'urge-reach-log', wm: 'clock' },
];

async function main() {
  await fs.mkdir(DAILY_DIR, { recursive: true });
  await fs.mkdir(SHEETS_DIR, { recursive: true });
  const HTML_DIR = path.join(V9, 'html');
  const SINGLES_DIR = path.join(V9, 'singles');
  await fs.mkdir(HTML_DIR, { recursive: true });
  await fs.mkdir(SINGLES_DIR, { recursive: true });

  // name→full-page HTML for v7 tool/extra builders (extras = first page of each job)
  const jobHtml = new Map<string, string>();
  for (const j of TOOL_JOBS) jobHtml.set(j.name, j.html);
  for (const j of EXTRA_JOBS) jobHtml.set(j.name, j.pages[0]);
  const permissionHtml = jobHtml.get('02-permission')!;

  const browser = await chromium.launch();
  const report: QA[] = [];
  const cache = new Map<string, Uint8Array>();             // base daily pages
  let permPdf!: Uint8Array;
  const apxPdf = new Map<string, Uint8Array>();            // appendix pages
  let indexPdf!: Uint8Array;

  try {
    // 1) render the 4 page-types × 6 motifs = 24 base pages (QA gated) + emit HTML
    for (const kind of PAGE_TYPES) {
      for (let motif = 0; motif < MOTIFS; motif++) {
        const key = `${kind}__m${motif}`;
        const html = bodyFor(kind, motif, 0);
        const { pdf, qa } = await renderAndVerify(browser, key, html);
        report.push(qa);
        cache.set(key, pdf);
        await fs.writeFile(path.join(HTML_DIR, `${key}.html`), html, 'utf-8');
      }
    }

    // 2) permission (the daily repeat) — render once, wrapped; HTML + single PDF
    {
      const html = v9Wrap(permissionHtml, 'permission', 1);
      const { pdf, qa } = await renderAndVerify(browser, 'permission', html);
      report.push(qa);
      permPdf = pdf;
      await fs.writeFile(path.join(SINGLES_DIR, 'permission.html'), html, 'utf-8');
      await fs.writeFile(path.join(SINGLES_DIR, 'permission.pdf'), await onePage(pdf));
    }

    // 3) appendix pages — render each once, wrapped; HTML + single PDF
    for (let i = 0; i < APPENDIX.length; i++) {
      const a = APPENDIX[i];
      const raw = jobHtml.get(a.name);
      if (!raw) { console.warn(`[v9] appendix page not found: ${a.name}`); continue; }
      const html = v9Wrap(raw, a.wm, i % MOTIFS);
      const { pdf, qa } = await renderAndVerify(browser, a.name, html);
      report.push(qa);
      apxPdf.set(a.name, pdf);
      await fs.writeFile(path.join(SINGLES_DIR, `${a.name}.html`), html, 'utf-8');
      await fs.writeFile(path.join(SINGLES_DIR, `${a.name}.pdf`), await onePage(pdf));
    }

    // 4) index page — pages computed below; daily layout is
    //    30×(4 daily + permission)=150, then index at 151, appendix from 152
    const indexItems = APPENDIX.filter(a => apxPdf.has(a.name)).map((a, i) => ({ name: a.name, pp: 152 + i }));
    const indexHtml = v9Wrap(indexPage(indexItems), 'leaf', 0);
    const { pdf: ipdf, qa: iqa } = await renderAndVerify(browser, 'appendix-index', indexHtml);
    report.push(iqa);
    indexPdf = ipdf;
    await fs.writeFile(path.join(SINGLES_DIR, 'appendix-index.html'), indexHtml, 'utf-8');
  } finally {
    await browser.close();
  }

  // QA gate (base 24 + permission + appendix 20 + index)
  console.log('\n[v9] render-QA (daily base + permission + appendix + index):');
  let allPass = true;
  for (const q of report) { const ok = q.verdict === 'pass'; allPass = allPass && ok; if (!ok) console.log(`  ✗ ${q.key.padEnd(20)} overflow=${q.overflowPx}px footer=${q.footerCollision} minFont=${q.minFontPx}px → FAIL`); }
  console.log(`  ${allPass ? `✓ all ${report.length} pages pass` : '✗ some pages failed'} (A4 / overflow / footer / legibility)`);
  if (!allPass) { console.error('[v9] FAIL — fix overflow/collision/font before shipping.'); process.exit(2); }

  // 5) compose the daily bundle: [day×(4+permission)]×30 + index + appendix
  const daily = await PDFDocument.create();
  const apxNames = APPENDIX.filter(a => apxPdf.has(a.name));
  for (let day = 1; day <= DAYS; day++) {
    const motif = (day - 1) % MOTIFS;
    const dayDoc = await PDFDocument.create();
    for (const kind of PAGE_TYPES) {
      const src = await PDFDocument.load(cache.get(`${kind}__m${motif}`)!);
      const [dp] = await dayDoc.copyPages(src, [0]); dayDoc.addPage(dp);
      const [bp] = await daily.copyPages(src, [0]); daily.addPage(bp);
    }
    const ps = await PDFDocument.load(permPdf);
    const [dpp] = await dayDoc.copyPages(ps, [0]); dayDoc.addPage(dpp);
    const [bpp] = await daily.copyPages(ps, [0]); daily.addPage(bpp);
    dayDoc.setTitle(`Prax Journal v9 — Day ${String(day).padStart(2, '0')}`);
    await fs.writeFile(path.join(DAILY_DIR, `day-${String(day).padStart(2, '0')}.pdf`), await dayDoc.save({ useObjectStreams: false }));
  }
  const indexPageIndex = daily.getPageCount();
  { const s = await PDFDocument.load(indexPdf); const [p] = await daily.copyPages(s, [0]); daily.addPage(p); }
  const apxStart = daily.getPageCount();
  for (const a of apxNames) { const s = await PDFDocument.load(apxPdf.get(a.name)!); const [p] = await daily.copyPages(s, [0]); daily.addPage(p); }

  // 6) two-way GoTo links — mode A with auto-fallback to B (page-number index)
  let linkMode: 'A' | 'B' = 'A';
  try {
    const pages = daily.getPages();
    const idxPage = pages[indexPageIndex];
    const { height } = idxPage.getSize();
    const rowTop = height - 150, rowH = 16; // index row band (approx, generous rects)
    for (let i = 0; i < apxNames.length; i++) {
      const destRef = pages[apxStart + i].ref;
      const y = rowTop - i * rowH;
      addGoToLink(daily, idxPage, [40, y - rowH, 555, y], destRef);
    }
    const idxRef = pages[indexPageIndex].ref;
    for (let i = 0; i < apxNames.length; i++) {
      addGoToLink(daily, pages[apxStart + i], [28, 18, 150, 40], idxRef);
    }
    // verify: destinations in range
    if (apxStart + apxNames.length > daily.getPageCount() || indexPageIndex >= daily.getPageCount()) {
      linkMode = 'B';
    }
  } catch (e) {
    linkMode = 'B';
    console.warn('[v9] link mode A failed → B:', e instanceof Error ? e.message : e);
  }
  console.log(`[v9] appendix link mode: ${linkMode} (index p.${indexPageIndex + 1}, appendix p.${apxStart + 1}–${apxStart + apxNames.length})`);

  daily.setTitle('Prax Journal v9 — Daily (beautified, 30-day, linked appendix)');
  await fs.writeFile(path.join(V9, 'prax-journal-v9-daily.pdf'), await daily.save({ useObjectStreams: false }));

  // 7) printable sticker sheets from the existing 65 PNGs
  const sheetParts: { name: string; bytes: Uint8Array }[] = [];
  for (const [dir, title] of [['truth', 'Truth Deck — Truth (20)'], ['quote', 'Truth Deck — Quote (20)'], ['pill', 'Truth Deck — Pill (25)']] as const) {
    const bytes = await buildStickerSheet(path.join(OUT, 'stickers', dir), title);
    if (bytes) { await fs.writeFile(path.join(SHEETS_DIR, `${dir}-sheet.pdf`), bytes); sheetParts.push({ name: dir, bytes }); }
  }
  console.log(`[v9] sticker sheets: ${sheetParts.map(s => s.name).join(', ') || 'none found'}`);

  // 8) v9 master bundle = linked daily + sticker sheets + existing v7 tools/pomodoro/extras
  const master = await PDFDocument.create();
  let total = 0;
  total += await mergeInto(master, await fs.readFile(path.join(V9, 'prax-journal-v9-daily.pdf')));
  for (const s of sheetParts) total += await mergeInto(master, s.bytes);
  const carryovers: [string, string][] = [
    [path.join(OUT, 'tools', 'tools-reference.pdf'), 'tools'],
    [path.join(OUT, 'pomodoro-tomato', 'pomodoro-tomato.pdf'), 'pomodoro-tomato'],
    [path.join(OUT, 'tools', 'pomodoro-pad.pdf'), 'pomodoro-pad'],
    [path.join(OUT, 'extras', 'weekly-strip.pdf'), 'weekly'],
    [path.join(OUT, 'extras', 'monthly-letter.pdf'), 'monthly-letter'],
    [path.join(OUT, 'extras', 'reminders-card.pdf'), 'reminders'],
    [path.join(OUT, 'extras', 'therapy-prep-debrief.pdf'), 'therapy-prep'],
    [path.join(OUT, 'extras', 'urge-reach-log.pdf'), 'urge-reach'],
    [path.join(OUT, 'extras', 'letter-to-no-one.pdf'), 'letter'],
    [path.join(OUT, 'truth-deck-flip.pdf'), 'truth-deck-flip'],
  ];
  const merged: string[] = [], missing: string[] = [];
  for (const [p, label] of carryovers) {
    const bytes = await tryRead(p);
    if (bytes) { total += await mergeInto(master, bytes); merged.push(label); } else { missing.push(label); }
  }
  master.setTitle('Prax Journal v9 — Master Bundle');
  await fs.writeFile(path.join(V9, 'v9-master-bundle.pdf'), await master.save({ useObjectStreams: false }));

  console.log(`\n[v9] master bundle: ${total} pages → cline/output/v9/v9-master-bundle.pdf`);
  console.log(`[v9]   daily: 30 day PDFs + prax-journal-v9-daily.pdf (beautified, permission daily, linked appendix)`);
  console.log(`[v9]   singles + html: cline/output/v9/{singles,html}/`);
  console.log(`[v9]   carried over (v7, locked design): ${merged.join(', ')}`);
  if (missing.length) console.log(`[v9]   not found (run their generators first): ${missing.join(', ')}`);
  console.log('[v9] done — all freshly-rendered daily pages pass A4 / overflow / footer / legibility.');
}

main().catch(err => { console.error('[v9] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
