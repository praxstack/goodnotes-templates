/**
 * build-cards.ts — Prax Journal v7 · The Truth Deck (Cline build)
 *
 * 65 cards in 3 register-packs (Truth 20 · Quote 20 · Pill 25), authored from the
 * locked design doc §4.6. Each card is composed as an SVG (square, 512×512) in the
 * v6 design language, then rasterised to a transparent PNG via Chromium
 * (omitBackground) so it drops cleanly into GoodNotes as a sticker. Also emits a
 * flip-deck PDF — one card per page, opening on a meta-pill (Z1), with NO all-cards
 * view (anti-binge rule, spec §4.5).
 *
 * Clinical guardrails (spec §4.2/§4.4): cards hit the BEHAVIOUR/STORY, never the
 * person; every pill ends in an exit action; people are abstracted (no real names).
 *
 * Output:
 *   cline/output/stickers/truth/*.png   (20)
 *   cline/output/stickers/quote/*.png   (20)
 *   cline/output/stickers/pill/*.png    (25)
 *   cline/output/stickers/contact-sheet.png
 *   cline/output/truth-deck-flip.pdf    (66 pp: Z1 cover + 65 cards)
 *
 * Run: ./node_modules/.bin/tsx cline/build-cards.ts
 */

import { chromium, type Browser } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'output');
const STICK = path.join(OUT, 'stickers');

type Pack = 'truth' | 'quote' | 'pill';
export interface Card { id: string; pack: Pack; cluster: string; text: string; exit?: string }

// ── CONTENT (design doc §4.6; abstracted, behaviour-targeted) ───────────────
// TRUTH (20): D Shame&Worth + G Compassion + reminders. Calm, read-only.
export const TRUTH: Card[] = [
  { id: 't01', pack: 'truth', cluster: 'worth', text: 'You are not your output. A day you produced nothing is still a day a worthwhile person lived through.' },
  { id: 't02', pack: 'truth', cluster: 'worth', text: 'The comparison\u2019s life is not the exam you\u2019re failing. It was never your exam \u2014 different paper, different day.' },
  { id: 't03', pack: 'truth', cluster: 'worth', text: 'The fraud feeling is a feeling, not evidence. Impostor syndrome targets the competent.' },
  { id: 't04', pack: 'truth', cluster: 'worth', text: 'Shame says \u201Cyou are bad.\u201D Guilt says \u201Cyou did a bad thing.\u201D At most this is guilt \u2014 and guilt you can work with.' },
  { id: 't05', pack: 'truth', cluster: 'worth', text: 'The distance you keep is the old shame protecting itself, not you. No one holds the scorecard you imagine.' },
  { id: 't06', pack: 'truth', cluster: 'worth', text: 'Your worth was not issued by a job and cannot be revoked by being between jobs.' },
  { id: 't07', pack: 'truth', cluster: 'compassion', text: 'You came back to this. After every gap, you came back. That stubbornness might be the most important thing about you.' },
  { id: 't08', pack: 'truth', cluster: 'compassion', text: 'Speak to yourself the way you\u2019d speak to someone you love who was this stuck. You\u2019d help them start small.' },
  { id: 't09', pack: 'truth', cluster: 'compassion', text: 'Resting is allowed before you\u2019ve earned it. Worth is not a wage you work off.' },
  { id: 't10', pack: 'truth', cluster: 'compassion', text: 'Showing up flat still counts. The bar is \u201Cshow up,\u201D not \u201Cshow up energised.\u201D' },
  { id: 't11', pack: 'truth', cluster: 'compassion', text: 'You are not behind on being a person. There is no schedule for that one.' },
  { id: 't12', pack: 'truth', cluster: 'compassion', text: 'The fact that this hurts means you still care. The pain is a sign the wanting is alive.' },
  { id: 't13', pack: 'truth', cluster: 'body', text: 'You can do the thing and feel the anxiety at the same time. Calm was never the entry requirement.' },
  { id: 't14', pack: 'truth', cluster: 'body', text: '\u201CBye mode\u201D is your body bracing for danger that isn\u2019t here. Thank it, feel your feet, begin anyway.' },
  { id: 't15', pack: 'truth', cluster: 'reminder', text: 'Blank is complete. A skipped field is not a failed day.' },
  { id: 't16', pack: 'truth', cluster: 'reminder', text: 'Frog before tooling. Body before brain.' },
  { id: 't17', pack: 'truth', cluster: 'reminder', text: 'Depth is allowed. Debt is not. Today only owes two pages.' },
  { id: 't18', pack: 'truth', cluster: 'reminder', text: 'The hand moves first, so move the hand. You can act before you feel ready.' },
  { id: 't19', pack: 'truth', cluster: 'reminder', text: 'Behind is a position, not a verdict. The facts only support the position.' },
  { id: 't20', pack: 'truth', cluster: 'reminder', text: 'You always came back. That is the whole report. Begin again.' },
];

// QUOTE (20): C Starting + curated borrowed wisdom. Light lift, attributed where real.
export const QUOTE: Card[] = [
  { id: 'q01', pack: 'quote', cluster: 'rogers', text: 'When I accept myself just as I am, then I can change.', exit: '\u2014 Carl Rogers' },
  { id: 'q02', pack: 'quote', cluster: 'starting', text: 'You don\u2019t have to see the whole staircase. Just take the first step.', exit: '\u2014 after M. L. King' },
  { id: 'q03', pack: 'quote', cluster: 'starting', text: 'The secret of getting ahead is getting started.', exit: '\u2014 attrib. Mark Twain' },
  { id: 'q04', pack: 'quote', cluster: 'starting', text: 'Motivation is not coming first. You move, then you feel like moving.' },
  { id: 'q05', pack: 'quote', cluster: 'starting', text: 'You do not need the whole plan before the first movement. The first movement is the plan.' },
  { id: 'q06', pack: 'quote', cluster: 'starting', text: 'The frog will never feel ready. Readiness is a decision you make while unready.' },
  { id: 'q07', pack: 'quote', cluster: 'starting', text: 'Five minutes of the real thing beats five hours of preparing to do the real thing.' },
  { id: 'q08', pack: 'quote', cluster: 'starting', text: 'Lower the bar until it\u2019s stupid. \u201COpen the doc.\u201D \u201CRead one line.\u201D Stupid-small is what starts you.' },
  { id: 'q09', pack: 'quote', cluster: 'starting', text: 'Done is a direction, not a finish line. Move one inch and you\u2019ve moved.' },
  { id: 'q10', pack: 'quote', cluster: 'pace', text: 'A flat day still counts as a day inside the month. Showing up flat is showing up.' },
  { id: 'q11', pack: 'quote', cluster: 'pace', text: 'Slow is a pace, not a failure. Your tempo is allowed.' },
  { id: 'q12', pack: 'quote', cluster: 'pace', text: 'Comparison measures your inside against their outside. It was never accurate.' },
  { id: 'q13', pack: 'quote', cluster: 'body', text: 'The urge is a wave in the body, not a command. Waves fall if you don\u2019t paddle into them.' },
  { id: 'q14', pack: 'quote', cluster: 'body', text: 'Feel your feet. Name five things you can see. You are here, and here is survivable.' },
  { id: 'q15', pack: 'quote', cluster: 'persistence', text: 'Fall seven times, stand up eight.', exit: '\u2014 Japanese proverb' },
  { id: 'q16', pack: 'quote', cluster: 'persistence', text: 'It does not matter how slowly you go as long as you do not stop.', exit: '\u2014 attrib. Confucius' },
  { id: 'q17', pack: 'quote', cluster: 'persistence', text: 'The wall doesn\u2019t have to be climbed in one move. You\u2019re allowed to stand near it.' },
  { id: 'q18', pack: 'quote', cluster: 'self', text: 'Talk to yourself as you would to someone you are responsible for helping.', exit: '\u2014 after a familiar rule' },
  { id: 'q19', pack: 'quote', cluster: 'self', text: 'If today all you did was not make it worse, that was a full day\u2019s work.' },
  { id: 'q20', pack: 'quote', cluster: 'self', text: 'You are allowed to begin again, as many times as it takes. The page resets every morning.' },
];

// PILL (25): A Keeda + B Anti-victim + E Body-urge + F Night. Mirror + blunt; every pill has an exit.
export const PILL: Card[] = [
  { id: 'p01', pack: 'pill', cluster: 'keeda', text: 'Building the system is not using the system. Right now you\u2019re doing the first.', exit: 'Close the builder. Open the real thing.' },
  { id: 'p02', pack: 'pill', cluster: 'keeda', text: 'A new tool has never once made you start. The tool was never the problem.', exit: 'Use the one you have. One line, now.' },
  { id: 'p03', pack: 'pill', cluster: 'keeda', text: 'Designing the perfect plan is the most sophisticated way you avoid the scary thing.', exit: 'Name it: avoidance. Then start ugly.' },
  { id: 'p04', pack: 'pill', cluster: 'keeda', text: '\u201CFigured out the architecture\u201D gives the same hit as the phone \u2014 it just costs a whole day.', exit: 'Do five minutes of the actual task.' },
  { id: 'p05', pack: 'pill', cluster: 'keeda', text: 'You don\u2019t have a tooling problem. You have a starting problem.', exit: 'Open the file. That\u2019s the fix.' },
  { id: 'p06', pack: 'pill', cluster: 'keeda', text: 'If reorganising it feels productive, that\u2019s the tell. Productive-feeling \u2260 productive.', exit: 'Switch to the thing that scares you.' },
  { id: 'p07', pack: 'pill', cluster: 'keeda', text: 'The keeda\u2019s promise is always \u201Cafter I build this, then I\u2019ll start.\u201D It has never kept it.', exit: 'Skip the build. Start now.' },
  { id: 'p08', pack: 'pill', cluster: 'keeda', text: 'The journal cannot do the work for you. At some point you close it and open the ugly real thing.', exit: 'Close this. Open that.' },
  { id: 'p09', pack: 'pill', cluster: 'victim', text: 'The field moving fast is real. \u201CSo there\u2019s no point\u201D is a story bolted on top.', exit: 'Drop the story. Do one rep anyway.' },
  { id: 'p10', pack: 'pill', cluster: 'victim', text: 'Being behind is a position. Being doomed is a verdict you keep handing yourself.', exit: 'Take the position. Make one move from it.' },
  { id: 'p11', pack: 'pill', cluster: 'victim', text: 'Nobody is coming to rescue you from this \u2014 and nobody needs to. You hold the key.', exit: 'Turn it. One small action.' },
  { id: 'p12', pack: 'pill', cluster: 'victim', text: 'You shipped real work for years. \u201CI got lucky / I\u2019m a fraud\u201D is an interpretation, not a fact.', exit: 'Act like the person who shipped it.' },
  { id: 'p13', pack: 'pill', cluster: 'victim', text: 'Feeling incapable and being incapable are different. The capability isn\u2019t the question.', exit: 'The starting is. Start.' },
  { id: 'p14', pack: 'pill', cluster: 'victim', text: 'Waiting to \u201Cfeel less behind\u201D before you begin guarantees you stay behind.', exit: 'Begin while still behind. Now.' },
  { id: 'p15', pack: 'pill', cluster: 'victim', text: 'You\u2019re building the case for why it can\u2019t be done. That case IS the procrastination.', exit: 'Stop explaining. Smallest piece, now.' },
  { id: 'p16', pack: 'pill', cluster: 'body', text: 'Your hand reaches for the phone before your thought does. Don\u2019t fight the thought \u2014 move the hand.', exit: 'Put it down. Open the file.' },
  { id: 'p17', pack: 'pill', cluster: 'body', text: 'The discomfort you\u2019re fleeing will not kill you. It\u2019s a sensation, not a tiger.', exit: 'Stay three seconds longer than feels possible.' },
  { id: 'p18', pack: 'pill', cluster: 'body', text: 'The urge to scroll is a wave, not a command. Don\u2019t paddle into it.', exit: 'One breath. Back to the one thing.' },
  { id: 'p19', pack: 'pill', cluster: 'body', text: 'Prep-instead-of-doing feels like progress because it lowers the fear, not the task.', exit: 'Name it. Do the task, not the prep.' },
  { id: 'p20', pack: 'pill', cluster: 'night', text: 'It\u2019s after 11 and the plan is getting grander. That\u2019s the spiral, not the solution.', exit: 'Put the pen down. Bed.' },
  { id: 'p21', pack: 'pill', cluster: 'night', text: 'Tonight\u2019s shame doesn\u2019t have to become tonight\u2019s elaborate new system.', exit: 'Tomorrow\u2019s one frog is enough. Sleep.' },
  { id: 'p22', pack: 'pill', cluster: 'night', text: 'The 11pm version of you is the most tired one, not the most honest one.', exit: 'Don\u2019t let him make tomorrow\u2019s promises. Sleep.' },
  { id: 'p23', pack: 'pill', cluster: 'night', text: 'Sleeping now is more productive than planning now.', exit: 'Go.' },
  { id: 'p24', pack: 'pill', cluster: 'meta', text: 'Insight is not change. Understanding the keeda perfectly and still not starting is just a smarter way of not starting.', exit: 'Stop understanding. Start doing.' },
  { id: 'p25', pack: 'pill', cluster: 'meta', text: 'You did not need a better truth. You needed to act on the ones you already had.', exit: 'You have them now. Go.' },
];

// Z1 — the anti-binge cover (front of the flip-deck only; not a sticker)
const Z1 = 'If you\u2019re reading a stack of these to \u201Cget motivated,\u201D even this is avoidance. Read one. Close the book. Do the thing.';

const CARDS: Card[] = [...TRUTH, ...QUOTE, ...PILL];

// ── SVG composition (v6 design language) ────────────────────────────────────
const PALETTE: Record<Pack, { paper: string; band: string; ink: string; accent: string; label: string }> = {
  truth: { paper: '#F2F0EC', band: '#4E6249', ink: '#2b2d33', accent: '#4E6249', label: 'truth' },
  quote: { paper: '#F1EFED', band: '#7e9b85', ink: '#2b2d33', accent: '#5f7a66', label: 'quote' },
  pill:  { paper: '#F6EFE2', band: '#c08866', ink: '#2b2d33', accent: '#a8693f', label: 'pill' },
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// naive word-wrap into <= maxChars lines
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

export function cardSVG(c: Card): string {
  const p = PALETTE[c.pack];
  const W = 512, H = 512, R = 28, M = 44;
  // body type sizes by length
  const len = c.text.length;
  const fontSize = len > 150 ? 27 : len > 110 ? 30 : len > 70 ? 34 : 39;
  const maxChars = len > 150 ? 30 : len > 110 ? 27 : 24;
  const lines = wrap(c.text, maxChars);
  const lineH = fontSize * 1.32;
  const blockH = lines.length * lineH;
  let y = H / 2 - blockH / 2 + fontSize * 0.85;
  // shift up a touch if there's an exit line
  if (c.exit) y -= 26;

  const textSpans = lines.map((ln) => {
    const yy = y; y += lineH;
    return `<text x="${M}" y="${yy.toFixed(1)}" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="${fontSize}" font-weight="420" fill="${p.ink}" letter-spacing="-0.3">${esc(ln)}</text>`;
  }).join('');

  const exitSVG = c.exit
    ? `<text x="${M}" y="${(H - 70).toFixed(1)}" font-family="'JetBrains Mono', monospace" font-size="19" fill="${p.accent}" letter-spacing="0.3">${esc(c.exit)}</text>`
    : '';

  // pill cards: a small target glyph; quote: an opening mark; truth: a dot
  const glyph = c.pack === 'pill' ? '\u2316' : c.pack === 'quote' ? '\u201C' : '\u00B7';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#1f2126" flood-opacity="0.16"/>
    </filter>
  </defs>
  <g filter="url(#sh)">
    <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="${R}" fill="${p.paper}"/>
    <rect x="10" y="10" width="14" height="${H - 20}" rx="7" fill="${p.band}" opacity="0.9"/>
    <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="${R}" fill="none" stroke="#1f2126" stroke-opacity="0.06" stroke-width="1"/>
  </g>
  <text x="${M}" y="68" font-family="'JetBrains Mono', monospace" font-size="16" letter-spacing="4" fill="${p.accent}" opacity="0.85">${p.label.toUpperCase()} \u00B7 ${c.cluster.toUpperCase()}</text>
  <text x="${W - 40}" y="74" text-anchor="end" font-family="Georgia, serif" font-size="40" fill="${p.band}" opacity="0.5">${glyph}</text>
  ${textSpans}
  ${exitSVG}
  <text x="${M}" y="${H - 34}" font-family="'JetBrains Mono', monospace" font-size="12" letter-spacing="2" fill="${p.ink}" opacity="0.32">prax \u00B7 ${c.id}</text>
</svg>`;
}

// flip-deck cover (Z1)
export function coverSVG(): string {
  const lines = wrap(Z1, 30);
  const lineH = 34 * 1.34;
  let y = 230 - (lines.length * lineH) / 2;
  const spans = lines.map(ln => { const yy = y; y += lineH; return `<text x="56" y="${yy.toFixed(1)}" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="34" fill="#2b2d33">${esc(ln)}</text>`; }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="10" y="10" width="492" height="492" rx="28" fill="#F6EFE2"/>
  <rect x="10" y="10" width="14" height="492" rx="7" fill="#c08866" opacity="0.9"/>
  <text x="56" y="74" font-family="'JetBrains Mono', monospace" font-size="16" letter-spacing="4" fill="#a8693f">START HERE \u00B7 META</text>
  ${spans}
  <text x="56" y="470" font-family="'JetBrains Mono', monospace" font-size="13" letter-spacing="2" fill="#2b2d33" opacity="0.4">prax \u00B7 z1 \u00B7 one card. then close it.</text>
</svg>`;
}

async function svgToPng(browser: Browser, svg: string, transparent: boolean): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400;1,9..144,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>*{margin:0;padding:0}html,body{background:transparent}</style></head>
    <body>${svg}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { if ((document as any).fonts) await (document as any).fonts.ready; });
  const el = await page.$('svg');
  const buf = await el!.screenshot({ omitBackground: transparent });
  await page.close();
  return buf;
}

async function main() {
  for (const pack of ['truth', 'quote', 'pill'] as Pack[]) {
    await fs.mkdir(path.join(STICK, pack), { recursive: true });
  }
  const browser = await chromium.launch();
  const pngById: Record<string, Buffer> = {};
  try {
    // sticker PNGs (transparent) + SVG source
    for (const c of CARDS) {
      const svg = cardSVG(c);
      const png = await svgToPng(browser, svg, true);
      pngById[c.id] = png;
      await fs.writeFile(path.join(STICK, c.pack, `${c.pack}__${c.id}.png`), png);
      await fs.writeFile(path.join(STICK, c.pack, `${c.pack}__${c.id}.svg`), svg, 'utf-8');
    }

    // contact sheet (opaque grid, all 65) — for human curation, NOT bundled into the journal
    const cols = 8;
    const rows = Math.ceil(CARDS.length / cols);
    const cell = 200, gap = 16, pad = 24;
    const cw = pad * 2 + cols * cell + (cols - 1) * gap;
    const ch = pad * 2 + rows * cell + (rows - 1) * gap;
    const imgs = CARDS.map((c, i) => {
      const x = pad + (i % cols) * (cell + gap);
      const y = pad + Math.floor(i / cols) * (cell + gap);
      return `<image x="${x}" y="${y}" width="${cell}" height="${cell}" href="data:image/png;base64,${pngById[c.id].toString('base64')}"/>`;
    }).join('');
    const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}"><rect width="${cw}" height="${ch}" fill="#E4DFD2"/>${imgs}</svg>`;
    await fs.writeFile(path.join(STICK, 'contact-sheet.png'), await svgToPng2(browser, sheet, cw, ch));

    // flip-deck PDF: Z1 cover + 65 cards, one per page (square pages)
    const deck = await PDFDocument.create();
    const order: { svg: string }[] = [{ svg: coverSVG() }, ...CARDS.map(c => ({ svg: cardSVG(c) }))];
    for (const { svg } of order) {
      const png = await svgToPng(browser, svg, false); // opaque on its own paper for the PDF
      const img = await deck.embedPng(png);
      const pg = deck.addPage([512, 512]);
      pg.drawImage(img, { x: 0, y: 0, width: 512, height: 512 });
    }
    deck.setTitle('Prax Journal v7 — Truth Deck (flip)');
    await fs.writeFile(path.join(OUT, 'truth-deck-flip.pdf'), await deck.save({ useObjectStreams: false }));
  } finally {
    await browser.close();
  }

  const counts = { truth: TRUTH.length, quote: QUOTE.length, pill: PILL.length };
  console.log(`[cards] stickers: truth=${counts.truth} quote=${counts.quote} pill=${counts.pill} (total ${CARDS.length})`);
  console.log(`[cards] → cline/output/stickers/{truth,quote,pill}/*.{png,svg} + contact-sheet.png`);
  console.log(`[cards] flip-deck: ${CARDS.length + 1} pages (Z1 cover + ${CARDS.length} cards) → cline/output/truth-deck-flip.pdf`);
}

// variant: render an arbitrary-size svg to png
async function svgToPng2(browser: Browser, svg: string, w: number, h: number): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>*{margin:0;padding:0}</style></head><body>${svg}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { if ((document as any).fonts) await (document as any).fonts.ready; });
  const el = await page.$('svg');
  const buf = await el!.screenshot({ omitBackground: false });
  await page.close();
  return buf;
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => { console.error('[cards] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
}

