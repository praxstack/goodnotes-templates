/**
 * build-master-index.ts — Prax Journal v6 master gallery (index.html)
 *
 * Emits ONE self-contained `index.html` at the v6 root that lets you browse
 * every page of the journal from a single shelf:
 *
 *   • live scaled <iframe> thumbnail of each real page (no screenshots needed)
 *   • click → full-page lightbox with prev/next + "open in new tab"
 *   • select pages → "combine → print" opens a print sheet (Save as PDF)
 *   • search/filter, and quick links to the pre-built bundle + master PDFs
 *
 * Data-driven: enumerates pages/ + pages-v5restyled/ so it never drifts from
 * the actual page list. Design language matches DESIGN.md (warm paper desk,
 * Fraunces italic display, Instrument Sans body, JetBrains Mono labels).
 *
 * Run:   pnpm tsx build-master-index.ts
 * Open:  open index.html
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const V6_DIR = __dirname;
const PAGES_DIR = path.join(V6_DIR, 'pages');
const V5_DIR = path.join(V6_DIR, 'pages-v5restyled');
const OUT_INDEX = path.join(V6_DIR, 'index.html');

const FONTS_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">';

// ── Sections (display order) ────────────────────────────────────────────────
interface Section { key: string; label: string; blurb: string; paper: string; }
const SECTIONS: Section[] = [
  { key: 'cover',     label: 'the cover',        blurb: 'the front door.',                                                  paper: '#F6EFE2' },
  { key: 'spine',     label: 'every-day spine',  blurb: 'morning anchor · brain dump · evening close — the three you can lean on.', paper: '#F6EFE2' },
  { key: 'shelf',     label: 'the shelf',        blurb: 'opt-in tools. pull what fits today; skip what doesn\u2019t.',      paper: '#F2F0EC' },
  { key: 'weekly',    label: 'weekly review',    blurb: 'a spread for the week. no forms, no scoring.',                     paper: '#E8EEE6' },
  { key: 'monthly',   label: 'monthly close',    blurb: 'a letter to yourself, and a light identity check.',               paper: '#F1EFED' },
  { key: 'homework',  label: 'homework packet',  blurb: 'two doorways and an experiment. pick one — the other can wait.',   paper: '#F0E8DA' },
  { key: 'reference', label: 'reference',        blurb: 'stickers, this page, the crisis card, and a stock-up list.',       paper: '#F0F0EF' },
  { key: 'bonus',     label: 'pomodoro & resets',blurb: 'pomodoro thoughts, a midday reset, and a quarterly witness.',      paper: '#FBF4EC' },
  { key: 'cycle',     label: 'daily & cycle',    blurb: 'the restyled v5 dailies, plus weekly, monthly and quarterly.',     paper: '#F2F0EC' },
];
const PAPER: Record<string, string> = Object.fromEntries(SECTIONS.map(s => [s.key, s.paper]));
// Sections that have a matching pre-built bundle PDF in output/bundles/.
const BUNDLE_KEYS = ['spine', 'shelf', 'weekly', 'monthly', 'homework', 'reference', 'bonus'];

// ── Section assignment by NN- filename prefix (mirrors assemble-bundles.ts) ──
function sectionOf(file: string): string {
  const m = file.match(/^(\d+)/);
  if (!m) return 'shelf';
  const n = Number(m[1]);
  if (n === 0) return 'cover';
  if (n >= 1 && n <= 3) return 'spine';
  if (n >= 4 && n <= 11) return 'shelf';
  if (n === 12) return 'weekly';
  if (n === 13 || n === 14) return 'monthly';
  if (n >= 15 && n <= 20) return 'homework';
  if (n >= 21 && n <= 24) return 'reference';
  if (n >= 25 && n <= 28) return 'bonus';
  return 'shelf';
}

// ── Human titles ─────────────────────────────────────────────────────────────
const TITLES: Record<string, string> = {
  '00-cover': 'cover',
  '01-daily-checkin': 'daily check-in',
  '02-brain-dump': 'brain dump',
  '03-evening-close': 'evening close',
  '04-cbt-thought-record': 'CBT thought record',
  '05-self-worth-reframe': 'self-worth reframe',
  '06-behavioral-activation': 'behavioral activation',
  '07-adhd-focus-booster': 'ADHD focus booster',
  '08-scene-capture': 'scene capture',
  '09-letter-to-no-one': 'letter to no one',
  '10-quote-permission': 'permission',
  '11-loose-page': 'loose page',
  '12-weekly-pattern-review-left': 'weekly pattern review \u00b7 left',
  '12-weekly-pattern-review-right': 'weekly pattern review \u00b7 right',
  '13-letter-week-1': 'letter \u00b7 week 1',
  '13-letter-week-2': 'letter \u00b7 week 2',
  '13-letter-week-3': 'letter \u00b7 week 3',
  '13-letter-week-4': 'letter \u00b7 week 4',
  '14-monthly-identity-doorway': 'monthly identity doorway',
  '15-cover-shreya-homework': 'homework packet \u2014 cover',
  '16-doorway-A-tuesday-morning': 'doorway A \u00b7 tuesday morning',
  '17-doorway-B-the-sentence': 'doorway B \u00b7 the sentence',
  '18-doorway-C-before-it-got-heavy': 'doorway C \u00b7 before it got heavy',
  '19-doorway-D-fear-projection': 'doorway D \u00b7 fear projection',
  '20-experiment-30-min-and-break': 'experiment \u00b7 30 min & a break',
  '21a-sticker-library': 'sticker library \u00b7 a',
  '21b-sticker-library': 'sticker library \u00b7 b',
  '22-quick-start': 'quick start',
  '23-crisis-card': 'crisis card',
  '24-stock-up': 'stock-up list',
  '25-pomodoro-thoughts': 'pomodoro thoughts',
  '26-pomodoro-thoughts-alt': 'pomodoro thoughts \u00b7 alt',
  '27-midday-reset': 'midday reset',
  '28-quarterly-witness': 'quarterly witness',
};
function prettyTitle(slug: string): string {
  if (TITLES[slug]) return TITLES[slug];
  return slug.replace(/^\d+[a-z]?-/, '').replace(/-/g, ' ');
}

// ── Manifest ──────────────────────────────────────────────────────────────────
interface Item { i: number; section: string; sectionLabel: string; title: string; path: string; }
const V5_ORDER = ['today.html', 'midday.html', 'reflect.html', 'brain-dump.html', 'weekly.html', 'monthly.html', 'quarterly.html'];
const V5_TITLES: Record<string, string> = {
  today: 'today', midday: 'midday', reflect: 'reflect', 'brain-dump': 'brain dump',
  weekly: 'weekly', monthly: 'monthly', quarterly: 'quarterly',
};

const items: Item[] = [];
let idx = 0;

const v6Files = fs.readdirSync(PAGES_DIR).filter(f => f.endsWith('.html')).sort((a, b) => a.localeCompare(b, 'en'));
for (const f of v6Files) {
  const slug = f.replace('.html', '');
  const key = sectionOf(f);
  items.push({ i: idx++, section: key, sectionLabel: key, title: prettyTitle(slug), path: 'pages/' + f });
}
for (const f of V5_ORDER) {
  if (!fs.existsSync(path.join(V5_DIR, f))) continue;
  const slug = f.replace('.html', '');
  items.push({ i: idx++, section: 'cycle', sectionLabel: 'cycle', title: V5_TITLES[slug] ?? slug.replace(/-/g, ' '), path: 'pages-v5restyled/' + f });
}

// ── Quick-link markup (master + bundle PDFs) ────────────────────────────────
const bundleLinks = BUNDLE_KEYS
  .map(k => `<a class="lnk" href="output/bundles/${k}.pdf" target="_blank" rel="noopener">${k}</a>`)
  .join('');

// ── Render ──────────────────────────────────────────────────────────────────
const PAGES_JSON = JSON.stringify(items);
const SECTIONS_JSON = JSON.stringify(SECTIONS);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prax Journal v6 — the whole shelf</title>
${FONTS_LINK}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --desk:#E4DFD2; --paper:#F6EFE2; --ink:#1f2126; --quiet:#6E6658; --whisper:#B5AD9F;
  --sage:#4E6249; --sage-soft:#7e9b85; --clay:#c08866; --amber:#d6a45e;
  --line:rgba(31,33,38,.12); --line-soft:rgba(31,33,38,.07);
  --serif:'Fraunces','Iowan Old Style','Charter','Georgia',serif;
  --sans:'Instrument Sans',-apple-system,'Helvetica Neue',sans-serif;
  --mono:'JetBrains Mono','SF Mono','Menlo',monospace;
  --thumb-w:246px; --thumb-h:347px;
}
html{scroll-behavior:smooth}
body{
  background:var(--desk); color:var(--ink); font-family:var(--sans);
  -webkit-font-smoothing:antialiased; min-height:100vh;
  background-image:
    radial-gradient(120% 80% at 50% -10%, rgba(255,251,242,.55), transparent 60%),
    radial-gradient(100% 60% at 50% 120%, rgba(192,136,102,.06), transparent 60%);
}

/* ── Masthead ─────────────────────────────────────────────────────────── */
.mast{padding:46px 32px 26px; max-width:1320px; margin:0 auto}
.kick{font-family:var(--mono); font-size:10px; letter-spacing:.26em; text-transform:uppercase; color:var(--whisper)}
.mast h1{font-family:var(--serif); font-style:italic; font-weight:400; font-size:clamp(38px,5.4vw,64px);
  line-height:.98; letter-spacing:-.015em; margin:10px 0 14px; color:var(--ink)}
.mast h1 .amp{color:var(--clay); font-style:italic}
.lede{font-size:15px; line-height:1.55; color:var(--quiet); max-width:62ch}

/* ── Control bar ──────────────────────────────────────────────────────── */
.bar{position:sticky; top:0; z-index:30; backdrop-filter:saturate(1.1) blur(8px);
  background:linear-gradient(180deg, rgba(228,223,210,.94), rgba(228,223,210,.82));
  border-bottom:1px solid var(--line); padding:11px 32px}
.bar-in{max-width:1320px; margin:0 auto; display:flex; gap:14px; align-items:center; flex-wrap:wrap}
.search{flex:1 1 240px; display:flex; align-items:center; gap:9px; background:var(--paper);
  border:1px solid var(--line); border-radius:999px; padding:9px 16px; min-width:200px;
  box-shadow:inset 0 1px 2px rgba(42,40,36,.05)}
.search svg{flex:none; opacity:.5}
.search input{border:0; background:transparent; outline:none; width:100%; font-family:var(--sans);
  font-size:14px; color:var(--ink)}
.search input::placeholder{color:var(--whisper)}
.count{font-family:var(--mono); font-size:11px; color:var(--quiet); white-space:nowrap}
.links{display:flex; align-items:center; gap:7px; flex-wrap:wrap}
.links .grp-l{font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--whisper); margin-right:2px}
.lnk{font-family:var(--mono); font-size:11px; letter-spacing:.04em; text-decoration:none; color:var(--sage);
  border:1px solid rgba(78,98,73,.34); border-radius:999px; padding:5px 11px; transition:.18s}
.lnk:hover{background:var(--sage); color:#F6EFE2; border-color:var(--sage)}
.lnk.master{color:var(--clay); border-color:rgba(192,136,102,.4)}
.lnk.master:hover{background:var(--clay); color:#fff; border-color:var(--clay)}

/* ── Sections + grid ──────────────────────────────────────────────────── */
.wrap{max-width:1320px; margin:0 auto; padding:14px 32px 160px}
.section{margin-top:42px}
.sec-head{display:flex; align-items:flex-end; gap:14px; flex-wrap:wrap; padding-bottom:12px;
  border-bottom:1px solid var(--line); position:relative}
.sec-head::after{content:''; position:absolute; left:0; bottom:-1px; width:54px; height:3px;
  background:var(--swatch,#ccc); border-radius:2px}
.sec-key{font-family:var(--mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--sage)}
.sec-label{font-family:var(--serif); font-style:italic; font-weight:400; font-size:25px; line-height:1; color:var(--ink)}
.sec-blurb{font-size:13px; color:var(--quiet); flex:1 1 240px; min-width:0}
.sec-n{font-family:var(--mono); font-size:11px; color:var(--whisper)}

.grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(var(--thumb-w),1fr));
  gap:30px 24px; margin-top:24px; justify-items:center}

/* ── Card ─────────────────────────────────────────────────────────────── */
.card{width:var(--thumb-w); opacity:0; transform:translateY(10px);
  animation:rise .5s cubic-bezier(.2,.7,.2,1) forwards; animation-delay:var(--d,0ms)}
@keyframes rise{to{opacity:1; transform:none}}
.thumb{position:relative; display:block; width:var(--thumb-w); height:var(--thumb-h);
  border:0; padding:0; cursor:pointer; overflow:hidden; border-radius:4px; background:var(--bg,#F2F0EC);
  box-shadow:0 1px 2px rgba(42,40,36,.06), 0 6px 20px rgba(42,40,36,.10);
  transition:transform .22s cubic-bezier(.2,.7,.2,1), box-shadow .22s}
.thumb::before{content:''; position:absolute; left:0; top:0; height:100%; width:6px;
  background:rgba(192,136,102,.20); z-index:2; pointer-events:none}
.thumb::after{content:''; position:absolute; inset:0; border-radius:4px; z-index:3; pointer-events:none;
  box-shadow:inset 0 0 0 1px rgba(31,33,38,.05)}
.thumb iframe{width:880px; height:1240px; border:0; transform:scale(.28); transform-origin:top left;
  pointer-events:none}
.card:hover .thumb{transform:translateY(-4px); box-shadow:0 2px 4px rgba(42,40,36,.08), 0 16px 38px rgba(42,40,36,.18)}
.zoom{position:absolute; right:8px; bottom:8px; z-index:4; font-family:var(--mono); font-size:9px;
  letter-spacing:.12em; text-transform:uppercase; color:var(--quiet); background:rgba(246,239,226,.86);
  border:1px solid var(--line); border-radius:999px; padding:3px 8px; opacity:0; transition:.2s; pointer-events:none}
.card:hover .zoom{opacity:1}
.pick{position:absolute; top:8px; right:8px; z-index:5; width:24px; height:24px; cursor:pointer}
.pick input{position:absolute; opacity:0; width:100%; height:100%; margin:0; cursor:pointer}
.pick span{position:absolute; inset:0; border-radius:6px; background:rgba(246,239,226,.86);
  border:1px solid var(--line); transition:.16s; box-shadow:0 1px 2px rgba(42,40,36,.12)}
.pick span::after{content:''; position:absolute; left:7px; top:3px; width:6px; height:11px;
  border:solid #F6EFE2; border-width:0 2px 2px 0; transform:rotate(45deg) scale(.4); opacity:0; transition:.16s}
.pick input:checked + span{background:var(--sage); border-color:var(--sage)}
.pick input:checked + span::after{opacity:1; transform:rotate(45deg) scale(1)}
.card.sel .thumb{box-shadow:0 0 0 2px var(--sage), 0 14px 34px rgba(42,40,36,.18)}
.meta{margin-top:11px; padding:0 2px}
.meta .mk{font-family:var(--mono); font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--sage-soft)}
.meta .mt{font-family:var(--serif); font-style:italic; font-size:16px; line-height:1.2; color:var(--ink); margin-top:3px}

/* ── Lightbox ─────────────────────────────────────────────────────────── */
.lb{position:fixed; inset:0; z-index:90; display:none; place-items:center;
  background:rgba(31,28,24,.66); backdrop-filter:blur(6px)}
.lb.on{display:grid; animation:fade .2s ease}
@keyframes fade{from{opacity:0}to{opacity:1}}
.lb-top{position:fixed; top:0; left:0; right:0; display:flex; align-items:center; gap:16px;
  padding:16px 24px; color:#F2EAD9; z-index:2}
.lb-ttl{font-family:var(--serif); font-style:italic; font-size:20px}
.lb-pos{font-family:var(--mono); font-size:11px; letter-spacing:.1em; color:#cdbfa8}
.lb-spacer{flex:1}
.lb-top a,.lb-btn{font-family:var(--mono); font-size:11px; letter-spacing:.08em; text-transform:uppercase;
  color:#F2EAD9; text-decoration:none; border:1px solid rgba(242,234,217,.34); border-radius:999px;
  padding:6px 13px; background:transparent; cursor:pointer; transition:.16s}
.lb-top a:hover,.lb-btn:hover{background:rgba(242,234,217,.16)}
.lb-stage{position:relative; will-change:transform}
.lb-stage iframe{width:880px; height:1240px; border:0; background:#F6EFE2; border-radius:3px;
  box-shadow:0 30px 90px rgba(0,0,0,.5)}
.lb-nav{position:fixed; top:50%; transform:translateY(-50%); z-index:2; width:52px; height:52px;
  border-radius:999px; border:1px solid rgba(242,234,217,.3); background:rgba(31,28,24,.4); color:#F2EAD9;
  font-size:22px; cursor:pointer; display:grid; place-items:center; transition:.16s}
.lb-nav:hover{background:rgba(242,234,217,.18)}
.lb-prev{left:22px} .lb-next{right:22px}

/* ── Combine tray ─────────────────────────────────────────────────────── */
.tray{position:fixed; left:50%; bottom:26px; transform:translateX(-50%) translateY(140%); z-index:60;
  display:flex; align-items:center; gap:16px; padding:12px 16px 12px 22px; border-radius:999px;
  background:#23211d; color:#F2EAD9; box-shadow:0 18px 48px rgba(0,0,0,.34); transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.tray.on{transform:translateX(-50%) translateY(0)}
.tray .tn{font-family:var(--mono); font-size:12px; letter-spacing:.06em}
.tray .tn b{color:var(--amber); font-weight:500}
.tray button{font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase;
  border:0; border-radius:999px; padding:9px 16px; cursor:pointer; transition:.16s}
.tray .clear{background:transparent; color:#cdbfa8; border:1px solid rgba(242,234,217,.28)}
.tray .clear:hover{color:#F2EAD9}
.tray .combine{background:var(--clay); color:#fff}
.tray .combine:hover{background:#cd9374}

.foot{max-width:1320px; margin:0 auto; padding:0 32px 60px; color:var(--whisper); font-size:12.5px;
  line-height:1.6; font-style:italic; font-family:var(--serif)}
.empty{padding:60px 0; text-align:center; color:var(--quiet); font-style:italic; font-family:var(--serif); font-size:18px; display:none}

@media (prefers-reduced-motion:reduce){
  .card{animation:none; opacity:1; transform:none}
  .thumb,.lb,.tray{transition:none}
}
@media (max-width:560px){
  .mast,.bar,.wrap,.foot{padding-left:18px; padding-right:18px}
  :root{--thumb-w:208px; --thumb-h:293px}
  .thumb iframe{transform:scale(.236)}
}
</style>
</head>
<body>

<header class="mast">
  <div class="kick">prax journal · v6 · master shelf</div>
  <h1>every page, <span class="amp">one</span> shelf.</h1>
  <p class="lede">A quiet index of the whole journal. Each card is a live render of the real page — open
    one full-size, or tick a few and combine them into your own printable set. Nothing here is owed; pull
    what fits the day and skip the rest.</p>
</header>

<div class="bar">
  <div class="bar-in">
    <label class="search">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      <input id="q" type="search" placeholder="search pages — “brain dump”, “crisis”, “doorway”…" autocomplete="off">
    </label>
    <span class="count" id="count"></span>
    <div class="links">
      <span class="grp-l">pdf</span>
      <a class="lnk master" href="output/master/prax-master-journal.pdf" target="_blank" rel="noopener">master · 43pp</a>
      ${bundleLinks}
    </div>
  </div>
</div>

<main class="wrap" id="wrap"></main>
<div class="empty" id="empty">nothing matches that. try fewer letters.</div>

<footer class="foot">
  Thumbnails render live from <code>pages/</code> and <code>pages-v5restyled/</code>. For pixel-perfect
  Goodnotes imports, prefer the section <b>bundles</b> or the <b>master</b> PDF above — the browser
  “combine → print” sheet is best for quick, custom sets via Save&nbsp;as&nbsp;PDF.
</footer>

<!-- Lightbox -->
<div class="lb" id="lb" aria-hidden="true">
  <div class="lb-top">
    <span class="lb-ttl" id="lbTtl"></span>
    <span class="lb-pos" id="lbPos"></span>
    <span class="lb-spacer"></span>
    <a id="lbOpen" href="#" target="_blank" rel="noopener">open ↗</a>
    <button class="lb-btn" id="lbClose">close ✕</button>
  </div>
  <button class="lb-nav lb-prev" id="lbPrev" aria-label="previous">‹</button>
  <div class="lb-stage" id="lbStage"><iframe id="lbFrame" title="page"></iframe></div>
  <button class="lb-nav lb-next" id="lbNext" aria-label="next">›</button>
</div>

<!-- Combine tray -->
<div class="tray" id="tray">
  <span class="tn"><b id="trayN">0</b> selected</span>
  <button class="clear" id="trayClear">clear</button>
  <button class="combine" id="trayGo">combine → print</button>
</div>

<script>
var PAGES = ${PAGES_JSON};
var SECTIONS = ${SECTIONS_JSON};
var PAPER = {}; SECTIONS.forEach(function(s){ PAPER[s.key] = s.paper; });
var selected = new Set();

// ── Build the shelf ───────────────────────────────────────────────────────
function cardHTML(p){
  return '<div class="card" data-i="'+p.i+'" data-section="'+p.section+'" data-t="'+p.title.toLowerCase()+'">'
    + '<label class="pick"><input type="checkbox" data-i="'+p.i+'"><span></span></label>'
    + '<button class="thumb" data-open="'+p.i+'" style="--bg:'+(PAPER[p.section]||'#F2F0EC')+'" aria-label="open '+p.title+'">'
    +   '<iframe loading="lazy" tabindex="-1" scrolling="no" src="'+p.path+'"></iframe>'
    +   '<span class="zoom">open</span>'
    + '</button>'
    + '<div class="meta"><div class="mk">'+p.sectionLabel+'</div><div class="mt">'+p.title+'</div></div>'
    + '</div>';
}
function build(){
  var html = '', n = 0;
  SECTIONS.forEach(function(s){
    var inSec = PAGES.filter(function(p){ return p.section === s.key; });
    if(!inSec.length) return;
    var cards = inSec.map(function(p){ return cardHTML(p); }).join('');
    html += '<section class="section" data-sec="'+s.key+'">'
      + '<div class="sec-head" style="--swatch:'+s.paper+'">'
      +   '<span class="sec-key">'+s.key+'</span>'
      +   '<span class="sec-label">'+s.label+'</span>'
      +   '<span class="sec-blurb">'+s.blurb+'</span>'
      +   '<span class="sec-n">'+inSec.length+(inSec.length===1?' page':' pages')+'</span>'
      + '</div><div class="grid">'+cards+'</div></section>';
    n += inSec.length;
  });
  document.getElementById('wrap').innerHTML = html;
  // staggered reveal (capped)
  var cards = document.querySelectorAll('.card');
  for(var k=0;k<cards.length;k++){ cards[k].style.setProperty('--d', Math.min(k*26, 620)+'ms'); }
  document.getElementById('count').textContent = n + ' pages';
}
build();

// ── Lightbox ───────────────────────────────────────────────────────────────
var lb = document.getElementById('lb'), lbFrame = document.getElementById('lbFrame'),
    lbStage = document.getElementById('lbStage'), lbTtl = document.getElementById('lbTtl'),
    lbPos = document.getElementById('lbPos'), lbOpen = document.getElementById('lbOpen');
var cur = -1;
function visibleItems(){
  var out = [];
  document.querySelectorAll('.card').forEach(function(c){
    if(c.style.display !== 'none') out.push(Number(c.getAttribute('data-i')));
  });
  return out;
}
function fitStage(){
  var s = Math.min((window.innerHeight*0.88)/1240, (window.innerWidth*0.92)/880);
  lbStage.style.transform = 'scale('+s+')';
}
function openLB(i){
  var p = PAGES[i]; if(!p) return;
  cur = i;
  lbFrame.src = p.path;
  lbTtl.textContent = p.title;
  lbOpen.href = p.path;
  var vis = visibleItems(); var at = vis.indexOf(i);
  lbPos.textContent = (at+1) + ' / ' + vis.length;
  lb.classList.add('on'); lb.setAttribute('aria-hidden','false');
  fitStage();
}
function closeLB(){ lb.classList.remove('on'); lb.setAttribute('aria-hidden','true'); lbFrame.src='about:blank'; cur=-1; }
function step(dir){
  var vis = visibleItems(); if(!vis.length) return;
  var at = vis.indexOf(cur); if(at<0) at = 0;
  var next = (at + dir + vis.length) % vis.length;
  openLB(vis[next]);
}
document.getElementById('wrap').addEventListener('click', function(e){
  var t = e.target.closest('.thumb'); if(t){ openLB(Number(t.getAttribute('data-open'))); }
});
document.getElementById('lbClose').addEventListener('click', closeLB);
document.getElementById('lbPrev').addEventListener('click', function(){ step(-1); });
document.getElementById('lbNext').addEventListener('click', function(){ step(1); });
lb.addEventListener('click', function(e){ if(e.target === lb) closeLB(); });
window.addEventListener('resize', function(){ if(cur>=0) fitStage(); });
document.addEventListener('keydown', function(e){
  if(cur<0) return;
  if(e.key === 'Escape') closeLB();
  else if(e.key === 'ArrowRight') step(1);
  else if(e.key === 'ArrowLeft') step(-1);
});

// ── Selection + combine ─────────────────────────────────────────────────────
var tray = document.getElementById('tray'), trayN = document.getElementById('trayN');
function syncTray(){
  trayN.textContent = selected.size;
  tray.classList.toggle('on', selected.size > 0);
}
document.getElementById('wrap').addEventListener('change', function(e){
  if(e.target.matches('.pick input')){
    var i = Number(e.target.getAttribute('data-i'));
    var card = e.target.closest('.card');
    if(e.target.checked){ selected.add(i); card.classList.add('sel'); }
    else { selected.delete(i); card.classList.remove('sel'); }
    syncTray();
  }
});
document.getElementById('trayClear').addEventListener('click', function(){
  selected.clear();
  document.querySelectorAll('.pick input:checked').forEach(function(b){ b.checked = false; });
  document.querySelectorAll('.card.sel').forEach(function(c){ c.classList.remove('sel'); });
  syncTray();
});
document.getElementById('trayGo').addEventListener('click', function(){
  if(!selected.size) return;
  var order = PAGES.filter(function(p){ return selected.has(p.i); });
  var sheets = order.map(function(p){
    var abs = new URL(p.path, location.href).href;
    return '<div class="sheet"><iframe src="'+abs+'" scrolling="no"></iframe></div>';
  }).join('');
  var doc = '<!doctype html><html><head><meta charset="utf-8"><title>combined · '+order.length+' pages</title>'
    + '<style>@page{size:A4 portrait;margin:0}*{margin:0;padding:0}'
    + 'html,body{background:#fff}.sheet{width:210mm;height:297mm;overflow:hidden;page-break-after:always}'
    + '.sheet iframe{width:210mm;height:297mm;border:0;display:block}'
    + '@media screen{body{background:#E4DFD2;padding:10mm}.sheet{margin:0 auto 10mm;box-shadow:0 10px 34px rgba(42,40,36,.18)}}'
    + '</style></head><body>'+sheets
    + '<scr'+'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},900);});</scr'+'ipt>'
    + '</body></html>';
  var w = window.open('', '_blank');
  if(!w){ alert('Allow pop-ups to open the combined print sheet.'); return; }
  w.document.open(); w.document.write(doc); w.document.close();
});

// ── Search filter ────────────────────────────────────────────────────────────
var q = document.getElementById('q'), empty = document.getElementById('empty');
q.addEventListener('input', function(){
  var v = q.value.trim().toLowerCase();
  var shown = 0;
  document.querySelectorAll('.card').forEach(function(c){
    var hay = c.getAttribute('data-t') + ' ' + c.getAttribute('data-section');
    var ok = !v || hay.indexOf(v) !== -1;
    c.style.display = ok ? '' : 'none';
    if(ok) shown++;
  });
  document.querySelectorAll('.section').forEach(function(s){
    var any = s.querySelector('.card:not([style*="display: none"])');
    s.style.display = any ? '' : 'none';
  });
  document.getElementById('count').textContent = shown + (shown===1?' page':' pages');
  empty.style.display = shown ? 'none' : 'block';
});
</script>
</body>
</html>`;

fs.writeFileSync(OUT_INDEX, html, 'utf-8');
const bySection: Record<string, number> = {};
items.forEach(it => { bySection[it.section] = (bySection[it.section] ?? 0) + 1; });
console.log('[master-index] wrote index.html — ' + items.length + ' pages');
console.log('[master-index] sections: ' + SECTIONS.filter(s => bySection[s.key]).map(s => s.key + '=' + bySection[s.key]).join(' '));
