/**
 * Build the remaining 8 stickers for C5b.
 *
 * Pipeline proven by C5a Mood Dot (base64 Fraunces via sharp/librsvg).
 * Mood Dot v6 plus Thought Flip / Wins Jar / Friend Letter (C5b batch 1)
 * established the grammar. This script ships the last 8 mechanical
 * variants, all on the same paper / rail / font stack.
 *
 * ## The 8 stickers
 *
 *   If-Then Plan     sage · standard · Gollwitzer implementation intention
 *   Craving Surf     lavender · standard · Marlatt urge-surfing worksheet
 *   Three Good Things amber · standard · Seligman positive-psych triple
 *   Named Patterns   clay · standard · pattern recognition tally
 *   Shame + Baggage  clay · standard · "notice, don't force"
 *   Grateful for     amber · compact · quick gratitude tap
 *   Win Today        sage · compact · single-focus badge + 1 line
 *   PHQ-2 Lite       lavender · compact · 2-question weekly screen
 *
 * Run: npx tsx scripts/build-stickers-remaining.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  rasterize,
  SIZE_CLASSES,
  PALETTE,
  stickerShell,
  kickerLine,
  solidLine,
  dottedLine,
} from '../src/core/sticker-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');

// Post-refactor: stickerShell + helpers moved to src/core/sticker-renderer.ts
// so the 4 flagship scripts and this batch script share the same
// canonical surface.

// ─── Output ────────────────────────────────────────────────
async function ship(name: string, svg: string): Promise<void> {
  const dir = path.join(REPO, 'packs/journals/prax-journal/stickers', name);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${name}.svg`), svg);
  await rasterize(svg, path.join(dir, `${name}.png`), 4);
  console.log(`  ✓ ${name}  (${Math.round(svg.length / 1024)} KB)`);
}

// ─── STANDARD (600×600) · If-Then Plan ─────────────────────
{
  const { width: W } = SIZE_CLASSES.standard;
  const bodyLines: string[] = [];
  const marginX = 44;
  // IF block
  bodyLines.push(kickerLine('§ IF', marginX, 210, 'sage'));
  bodyLines.push(solidLine(marginX, 245, W - marginX));
  bodyLines.push(dottedLine(marginX, 285, W - marginX));
  // THEN I'LL block
  bodyLines.push(kickerLine('§ THEN I\'LL', marginX, 345, 'sage'));
  bodyLines.push(solidLine(marginX, 380, W - marginX));
  bodyLines.push(dottedLine(marginX, 420, W - marginX));
  bodyLines.push(dottedLine(marginX, 460, W - marginX));
  await ship('if-then-plan', stickerShell({
    id: 'if-then-plan',
    title: 'If-Then Plan',
    desc: 'A warm-analog sticker with a sage rail. The Gollwitzer implementation-intention pattern — "If X happens, then I\'ll Y" — split into two writing blocks for the cue and the committed response.',
    size: 'standard',
    accent: 'sage',
    kicker: '§ IF-THEN PLAN',
    hero: 'if · then',
    subtitle: 'the plan that survives the moment',
    whisper: 'small commitments · survive the spiral',
    bodySvg: bodyLines.join('\n'),
  }));
}

// ─── STANDARD · Craving Surf (Marlatt urge-surfing) ────────
{
  const { width: W } = SIZE_CLASSES.standard;
  const bodyLines: string[] = [];
  const marginX = 44;
  // "the urge:" + line
  bodyLines.push(kickerLine('§ THE URGE', marginX, 200, 'lavender'));
  bodyLines.push(solidLine(marginX, 235, W - marginX));
  // intensity scale 1-5 (smaller than Mood Dot's 1-10 — urges come in quintile gradations)
  bodyLines.push(kickerLine('§ INTENSITY 1–5', marginX, 275, 'lavender'));
  const scaleY = 310;
  const scaleX0 = marginX + 10;
  const scaleGap = (W - 2 * marginX - 20) / 4;
  for (let i = 0; i < 5; i++) {
    const cx = scaleX0 + i * scaleGap;
    bodyLines.push(`  <circle cx="${cx}" cy="${scaleY}" r="12" fill="rgba(249,245,236,0.65)" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>`);
    bodyLines.push(`  <text x="${cx}" y="${scaleY + 4}" text-anchor="middle" font-family="'JetBrains Mono', Menlo, monospace" font-size="10" font-weight="500" fill="${PALETTE.lavender.ink}" fill-opacity="0.7">${i + 1}</text>`);
  }
  // "rode it out — yes/no"
  bodyLines.push(kickerLine('§ RODE IT OUT', marginX, 380, 'lavender'));
  bodyLines.push(`  <g transform="translate(${marginX + 110}, 375)">
    <circle cx="0" cy="0" r="10" fill="none" stroke="${PALETTE.lavender.ink}" stroke-width="1.2"/>
    <text x="22" y="4" font-family="'Fraunces', Georgia, serif" font-size="12" fill="${PALETTE.ink}" style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">yes</text>
    <circle cx="68" cy="0" r="10" fill="none" stroke="${PALETTE.lavender.ink}" stroke-width="1.2"/>
    <text x="90" y="4" font-family="'Fraunces', Georgia, serif" font-size="12" fill="${PALETTE.ink}" style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">no</text>
  </g>`);
  // "next time i'll..."
  bodyLines.push(kickerLine('§ NEXT TIME I\'LL', marginX, 440, 'lavender'));
  bodyLines.push(dottedLine(marginX, 475, W - marginX));
  await ship('craving-surf', stickerShell({
    id: 'craving-surf',
    title: 'Craving Surf',
    desc: 'A warm-analog sticker with a lavender rail. Marlatt urge-surfing worksheet: name the craving, rate its intensity 1–5, record whether you rode it out, and jot a next-time plan.',
    size: 'standard',
    accent: 'lavender',
    kicker: '§ CRAVING SURF',
    hero: 'urge surf',
    subtitle: 'ride the wave · don\'t drown it',
    whisper: 'the urge always passes · you don\'t have to',
    bodySvg: bodyLines.join('\n'),
  }));
}

// ─── STANDARD · Three Good Things (Seligman) ──────────────
{
  const { width: W } = SIZE_CLASSES.standard;
  const bodyLines: string[] = [];
  const marginX = 44;
  // Three numbered rows
  const rowY0 = 220;
  const rowGap = 90;
  for (let i = 0; i < 3; i++) {
    const y = rowY0 + i * rowGap;
    bodyLines.push(`  <text x="${marginX}" y="${y}"
          font-family="'Fraunces', Georgia, serif"
          font-size="22" font-weight="400"
          fill="${PALETTE.amber.ink}"
          style="font-variation-settings: 'opsz' 40, 'SOFT' 60;">${String(i + 1).padStart(2, '0')}</text>`);
    bodyLines.push(solidLine(marginX + 40, y - 4, W - marginX, 1.3));
    bodyLines.push(dottedLine(marginX + 40, y + 32, W - marginX, 0.9));
  }
  await ship('three-good-things', stickerShell({
    id: 'three-good-things',
    title: 'Three Good Things',
    desc: 'A warm-analog sticker with an amber rail. Seligman positive-psychology triple: three lines to capture what went right today, even small.',
    size: 'standard',
    accent: 'amber',
    kicker: '§ THREE GOOD THINGS',
    hero: 'three good things',
    subtitle: 'even the small ones count',
    whisper: 'the brain magnifies what it practices · Seligman',
    bodySvg: bodyLines.join('\n'),
  }));
}

// ─── STANDARD · Named Patterns ─────────────────────────────
{
  const { width: W } = SIZE_CLASSES.standard;
  const bodyLines: string[] = [];
  const marginX = 44;
  // 5 rows: name on left, 5 tick boxes on right
  const rowY0 = 220;
  const rowGap = 44;
  const defaultPatterns = ['doomscroll', 'catastrophize', 'prereq trap', 'rejection scanner', '____________'];
  defaultPatterns.forEach((name, i) => {
    const y = rowY0 + i * rowGap;
    bodyLines.push(`  <text x="${marginX}" y="${y + 4}"
          font-family="'Fraunces', Georgia, serif"
          font-size="14" font-weight="400"
          fill="${PALETTE.clay.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${name}</text>`);
    // 5 tick boxes
    for (let t = 0; t < 5; t++) {
      const bx = W - marginX - (5 - t) * 22;
      bodyLines.push(`  <rect x="${bx}" y="${y - 8}" width="14" height="14" rx="2" ry="2"
            fill="rgba(249,245,236,0.5)" stroke="${PALETTE.clay.edge}" stroke-width="0.8"/>`);
    }
  });
  await ship('named-patterns', stickerShell({
    id: 'named-patterns',
    title: 'Named Patterns',
    desc: 'A warm-analog sticker with a clay rail. Five named cognitive loops with five tick boxes each — tick once every time the loop runs during the day. Blank row invites a personal pattern.',
    size: 'standard',
    accent: 'clay',
    kicker: '§ NAMED PATTERNS',
    hero: 'patterns today',
    subtitle: 'one tick each time it runs',
    whisper: 'naming it is half the work',
    bodySvg: bodyLines.join('\n'),
  }));
}

// ─── STANDARD · Shame + Baggage ────────────────────────────
{
  const { width: W } = SIZE_CLASSES.standard;
  const bodyLines: string[] = [];
  const marginX = 44;
  // "what showed up"
  bodyLines.push(kickerLine('§ WHAT SHOWED UP', marginX, 210, 'clay'));
  bodyLines.push(solidLine(marginX, 245, W - marginX));
  bodyLines.push(dottedLine(marginX, 285, W - marginX));
  // "where in the body"
  bodyLines.push(kickerLine('§ WHERE IN THE BODY', marginX, 335, 'clay'));
  bodyLines.push(dottedLine(marginX, 370, W - marginX));
  // "noticed, didn't force"
  bodyLines.push(`  <g transform="translate(${marginX}, 420)">
    <rect x="0" y="0" width="14" height="14" rx="2" ry="2"
          fill="rgba(249,245,236,0.5)" stroke="${PALETTE.clay.ink}" stroke-width="1"/>
    <text x="24" y="12"
          font-family="'Fraunces', Georgia, serif"
          font-size="13"
          fill="${PALETTE.clay.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">noticed · didn't try to fix it</text>
  </g>`);
  bodyLines.push(dottedLine(marginX, 475, W - marginX));
  await ship('shame-baggage', stickerShell({
    id: 'shame-baggage',
    title: 'Shame + Baggage',
    desc: 'A warm-analog sticker with a clay rail. Names a shame spike when it arrives, locates it in the body, and logs that it was noticed without being forced to resolve. Gentle, non-judgmental capture.',
    size: 'standard',
    accent: 'clay',
    kicker: '§ SHAME + BAGGAGE',
    hero: 'baggage, noticed',
    subtitle: 'notice · don\'t force it',
    whisper: 'the weight becomes bearable when it\'s named',
    bodySvg: bodyLines.join('\n'),
  }));
}

// ─── COMPACT · Grateful for ────────────────────────────────
{
  const { width: W } = SIZE_CLASSES.compact;
  const bodyLines: string[] = [];
  const marginX = 36;
  bodyLines.push(solidLine(marginX, 260, W - marginX, 1.3));
  bodyLines.push(dottedLine(marginX, 310, W - marginX, 0.9));
  bodyLines.push(dottedLine(marginX, 355, W - marginX, 0.9));
  await ship('grateful-for', stickerShell({
    id: 'grateful-for',
    title: 'Grateful for',
    desc: 'A warm-analog compact sticker with an amber rail. One solid primary line plus two dotted secondary lines to quickly name what you\'re grateful for in the moment.',
    size: 'compact',
    accent: 'amber',
    kicker: '§ GRATEFUL FOR',
    hero: 'grateful',
    subtitle: 'name one. then maybe two more.',
    whisper: 'gratitude isn\'t performance · it\'s a memory aid',
    bodySvg: bodyLines.join('\n'),
  }));
}

// ─── COMPACT · Win Today ───────────────────────────────────
{
  const { width: W } = SIZE_CLASSES.compact;
  const bodyLines: string[] = [];
  const marginX = 36;
  // Single check mark + one big line
  bodyLines.push(`  <g transform="translate(${W / 2 - 16}, 240)">
    <rect x="0" y="0" width="32" height="32" rx="4" ry="4"
          fill="rgba(249,245,236,0.6)" stroke="${PALETTE.sage.ink}" stroke-width="1.5"/>
  </g>`);
  bodyLines.push(kickerLine('§ THE ONE THING', marginX, 320, 'sage'));
  bodyLines.push(solidLine(marginX, 358, W - marginX, 1.5));
  bodyLines.push(dottedLine(marginX, 410, W - marginX, 0.9));
  await ship('win-today', stickerShell({
    id: 'win-today',
    title: 'Win Today',
    desc: 'A warm-analog compact sticker with a sage rail. A single check box plus one solid writing line captures the one thing that made today count. Small is allowed.',
    size: 'compact',
    accent: 'sage',
    kicker: '§ WIN TODAY',
    hero: 'today\'s win',
    subtitle: 'one is enough',
    whisper: 'small is not nothing · small is today',
    bodySvg: bodyLines.join('\n'),
  }));
}

// ─── COMPACT · PHQ-2 Lite ──────────────────────────────────
{
  const { width: W } = SIZE_CLASSES.compact;
  const bodyLines: string[] = [];
  const marginX = 36;
  // Two PHQ-2 questions, each with 0-3 scale (Not at all · Several days · More than half · Nearly every day)
  const questions = [
    'Little interest / pleasure in doing things',
    'Feeling down, depressed, or hopeless',
  ];
  const qY0 = 220;
  const qGap = 140;
  questions.forEach((q, qi) => {
    const y = qY0 + qi * qGap;
    bodyLines.push(kickerLine(`Q${qi + 1}`, marginX, y, 'lavender'));
    bodyLines.push(`  <text x="${marginX + 36}" y="${y}"
          font-family="'Fraunces', Georgia, serif"
          font-size="11"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${q}</text>`);
    for (let s = 0; s < 4; s++) {
      const cx = marginX + 20 + s * ((W - 2 * marginX - 40) / 3);
      const cy = y + 48;
      bodyLines.push(`  <circle cx="${cx}" cy="${cy}" r="10" fill="rgba(249,245,236,0.6)" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>`);
      bodyLines.push(`  <text x="${cx}" y="${cy + 4}" text-anchor="middle"
            font-family="'JetBrains Mono', Menlo, monospace"
            font-size="10" font-weight="500"
            fill="${PALETTE.lavender.ink}" fill-opacity="0.7">${s}</text>`);
    }
  });
  bodyLines.push(`  <text x="${W / 2}" y="510"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="8" font-weight="500"
        letter-spacing="${8 * 0.12}"
        fill="${PALETTE.lavender.ink}" fill-opacity="0.6">0 NOT AT ALL · 1 SEVERAL DAYS · 2 > HALF · 3 NEARLY EVERY DAY</text>`);
  await ship('phq2-lite', stickerShell({
    id: 'phq2-lite',
    title: 'PHQ-2 Lite',
    desc: 'A warm-analog compact sticker with a lavender rail. The PHQ-2 depression screen rendered as two questions with a 0-3 scale each. Weekly self-check — not a diagnosis, a ballpark.',
    size: 'compact',
    accent: 'lavender',
    kicker: '§ PHQ-2 LITE',
    hero: 'weekly check',
    subtitle: 'two questions · past 14 days',
    whisper: 'a number, not a verdict',
    bodySvg: bodyLines.join('\n'),
  }));
}

console.log('');
console.log('All 8 remaining stickers built. Eye-check the set and commit.');
