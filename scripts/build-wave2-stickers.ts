/**
 * Build Wave-2 — the remaining 28 stickers to complete the 60-pack.
 *
 * User overrode CEO-plan's staged wave-split (approach B) to ship
 * all 60 in one go (approach A). Wave-2 picks up where Wave-1 leaves
 * off; together with the 12 existing stickers, total = 60.
 *
 * Grouping (from docs/plan-ceo-review-sticker-expansion-v1.md § Step 0D):
 *   CBT beyond thought-flip (6):
 *     behavioral-experiment, cost-benefit-grid, downward-arrow,
 *     disqualifying-positives, should-statement-swap, catastrophizing-ladder
 *   DBT distress-tolerance + emotion-regulation (5):
 *     radical-acceptance, opposite-action, check-the-facts, pro-and-con,
 *     accumulate-positive-short
 *   DBT interpersonal effectiveness (3):
 *     dearman, give-stamp, fast-stamp
 *   ACT defusion + values (5):
 *     leaves-on-stream, values-card-draw, committed-action,
 *     workability-question, observer-self
 *   ERP / OCD deep (2): erp-hierarchy, uncertainty-tap
 *   ADHD deep (3): self-talk-script, task-estimation-log, pomodoro-stamp
 *   Smoking deep (2): nrt-usage, money-saved-stamp
 *   Positive psych (2): savor-anticipation, awe-capture
 *
 * Total: 28. Combined with Wave-1 (20) + existing (12) = 60.
 *
 * Every sticker uses a small body builder and the archetype preset
 * matching its family. Kept compact — stickers that just need writing
 * lines + a scale don't need more geometry.
 *
 * Run: npx tsx scripts/build-wave2-stickers.ts
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
  archetype,
  type Accent,
  type StickerSize,
  type SkeuoArchetype,
} from '../packages/core/src/sticker-renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');

async function ship(name: string, svg: string): Promise<void> {
  const dir = path.join(REPO, 'packages/packs-prax-journal/stickers', name);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${name}.svg`), svg);
  await rasterize(svg, path.join(dir, `${name}.png`), 4);
  console.log(`  ✓ ${name}  (${Math.round(svg.length / 1024)} KB)`);
}

/** Horizontal dot scale. */
function dotScale(
  x0: number, x1: number, y: number, n: number, accent: Accent,
  radius = 12, labelStart = 1,
): string {
  const gap = (x1 - x0) / (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const cx = x0 + i * gap;
    return `  <circle cx="${cx}" cy="${y}" r="${radius}"
            fill="rgba(249,245,236,0.65)"
            stroke="${PALETTE[accent].edge}" stroke-width="1"/>
  <text x="${cx}" y="${y + 4}" text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="10" font-weight="500"
        fill="${PALETTE[accent].ink}" fill-opacity="0.7">${i + labelStart}</text>`;
  }).join('\n');
}

/** Tick checkbox with label. */
function checkBox(x: number, y: number, label: string, accent: Accent): string {
  return `  <g transform="translate(${x}, ${y})">
    <rect x="0" y="0" width="14" height="14" rx="2" ry="2"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE[accent].edge}" stroke-width="1"/>
    <text x="22" y="12"
          font-family="'Fraunces', Georgia, serif" font-size="12"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${label}</text>
  </g>`;
}

/**
 * N writing lines (solid first, dotted rest).
 *
 * Unused today — kept as a documented primitive that future wave-2
 * stickers can pull in. `_` prefix satisfies `no-unused-vars` without
 * forcing us to delete a useful abstraction.
 */
function _writingLines(x0: number, x1: number, yStart: number, n: number, gap = 38): string {
  return Array.from({ length: n }, (_, i) => {
    const y = yStart + i * gap;
    return i === 0
      ? solidLine(x0, y, x1, 1.4)
      : dottedLine(x0, y, x1, 0.9);
  }).join('\n');
}

interface Entry {
  id: string;
  title: string;
  desc: string;
  size: StickerSize;
  accent: Accent;
  kicker: string;
  hero: string;
  subtitle: string;
  whisper: string;
  archetype: SkeuoArchetype;
  archetypeOpts?: { dateText?: string; stampLabel?: string; monogram?: string };
  body: (W: number) => string;
}

const WAVE2: Entry[] = [
  // ═════ CBT beyond thought-flip (6) ═════════════════════════════
  {
    id: 'behavioral-experiment',
    title: 'Behavioral Experiment',
    desc: 'Expanded CBT sticker (sage). Bennett-Levy belief update: predicted probability 0-100, actual outcome, updated probability. Tests a hot cognition against reality.',
    size: 'expanded', accent: 'sage',
    kicker: '§ BELIEF · TEST',
    hero: 'the experiment',
    subtitle: 'predict · observe · update',
    whisper: 'cognitions change by being tested, not argued',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'TESTED', dateText: 'CBT · 2026' },
    body: (W) => `
${kickerLine('§ THE BELIEF', 60, 220, 'sage')}
${solidLine(60, 255, W - 60, 1.4)}
${kickerLine('§ PREDICTED PROB 0–100', 60, 305, 'sage')}
${solidLine(260, 310, 360, 1.3)}
${kickerLine('§ ACTUAL OUTCOME', 60, 355, 'sage')}
${solidLine(60, 390, W - 60, 1.3)}
${dottedLine(60, 425, W - 60)}
${kickerLine('§ UPDATED PROB 0–100', 60, 475, 'sage')}
${solidLine(260, 480, 360, 1.3)}
`,
  },
  {
    id: 'cost-benefit-grid',
    title: 'Cost–Benefit Grid',
    desc: 'Expanded CBT 2×2 decisional-matrix sticker (clay). Advantages / disadvantages of holding a belief or keeping a habit. Beck 2011.',
    size: 'expanded', accent: 'clay',
    kicker: '§ COST · BENEFIT',
    hero: '2 × 2',
    subtitle: 'is this belief worth keeping?',
    whisper: 'the math is cheaper than the hesitation',
    archetype: 'ledger',
    archetypeOpts: { monogram: '±' },
    body: (W) => {
      const pad = 60;
      const rowH = 110;
      const colW = (W - pad * 2) / 2;
      const y0 = 230;
      const headers = ['+ KEEPING IT', '− KEEPING IT', '+ CHANGING IT', '− CHANGING IT'];
      const cells = [0, 1, 2, 3].map(i => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = pad + col * colW;
        const y = y0 + row * rowH;
        return `  <rect x="${x}" y="${y}" width="${colW - 10}" height="${rowH - 10}" rx="4" ry="4"
            fill="rgba(249,245,236,0.4)" stroke="${PALETTE.clay.edge}" stroke-width="1"/>
  <text x="${x + 10}" y="${y + 20}"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="10" font-weight="600" letter-spacing="${10 * 0.14}"
        fill="${PALETTE.clay.ink}">${headers[i]}</text>
  ${dottedLine(x + 10, y + 45, x + colW - 20, 0.9)}
  ${dottedLine(x + 10, y + 70, x + colW - 20, 0.9)}`;
      }).join('\n');
      return cells;
    },
  },
  {
    id: 'downward-arrow',
    title: 'Downward Arrow',
    desc: 'Standard CBT core-belief laddering sticker (clay). "If true, what would that mean about me?" Chased 3 levels deep to surface the core belief. Burns.',
    size: 'standard', accent: 'clay',
    kicker: '§ LADDER DOWN',
    hero: 'and if true…',
    subtitle: 'chase the thought to the core belief',
    whisper: 'the core belief is where compassion can land',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'TRACED', dateText: 'CBT · 2026' },
    body: (W) => `
${kickerLine('§ TRIGGER THOUGHT', 44, 220, 'clay')}
${solidLine(44, 255, W - 44, 1.4)}
  <text x="${W / 2}" y="290" text-anchor="middle"
        font-family="'Fraunces', Georgia, serif" font-size="13" font-style="italic"
        fill="${PALETTE.clay.ink}" fill-opacity="0.7">↓ and if that were true…</text>
${solidLine(44, 330, W - 44, 1.3)}
  <text x="${W / 2}" y="365" text-anchor="middle"
        font-family="'Fraunces', Georgia, serif" font-size="13" font-style="italic"
        fill="${PALETTE.clay.ink}" fill-opacity="0.7">↓ and that would mean…</text>
${solidLine(44, 405, W - 44, 1.3)}
  <text x="${W / 2}" y="440" text-anchor="middle"
        font-family="'Fraunces', Georgia, serif" font-size="13" font-style="italic"
        fill="${PALETTE.clay.ink}" fill-opacity="0.7">↓ about me …</text>
${solidLine(44, 480, W - 44, 1.4)}
`,
  },
  {
    id: 'disqualifying-positives',
    title: 'Disqualifying Positives',
    desc: 'Compact CBT distortion sticker (amber). Tally count of times today you dismissed something good, plus one reframe line.',
    size: 'compact', accent: 'amber',
    kicker: '§ DISQ POS',
    hero: 'one I dismissed',
    subtitle: 'name the good thing',
    whisper: 'dismissing the good is a habit · reversible',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ TIMES TODAY', 36, 230, 'amber')}
  <g transform="translate(36, 250)">
    ${Array.from({ length: 7 }, (_, i) => `<rect x="${i * 44}" y="0" width="34" height="22" rx="3" ry="3"
            fill="rgba(249,245,236,0.55)" stroke="${PALETTE.amber.edge}" stroke-width="1"/>`).join('\n    ')}
  </g>
${kickerLine('§ ONE I\'LL OWN', 36, 340, 'amber')}
${solidLine(36, 375, W - 36, 1.4)}
${dottedLine(36, 415, W - 36)}
`,
  },
  {
    id: 'should-statement-swap',
    title: 'Should → Could',
    desc: 'Compact cognitive-distortion sticker (sage). Tick how many "should" statements today, write one "could" reframe.',
    size: 'compact', accent: 'sage',
    kicker: '§ SHOULD → COULD',
    hero: 'swap it',
    subtitle: '"should" narrows · "could" opens',
    whisper: 'the word choice shapes the day',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ SHOULDS CAUGHT', 36, 230, 'sage')}
  <g transform="translate(36, 250)">
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${(i % 5) * 36}" y="${Math.floor(i / 5) * 36}" width="26" height="26" rx="3" ry="3"
            fill="rgba(249,245,236,0.55)" stroke="${PALETTE.sage.edge}" stroke-width="1"/>`).join('\n    ')}
  </g>
${kickerLine('§ ONE SWAP', 36, 380, 'sage')}
${solidLine(36, 415, W - 36, 1.4)}
${dottedLine(36, 455, W - 36)}
`,
  },
  {
    id: 'catastrophizing-ladder',
    title: 'Catastrophizing Ladder',
    desc: 'Standard CBT sticker (lavender). Estimate the worst-case probability, check facts, re-estimate. Defuses runaway future-thinking.',
    size: 'standard', accent: 'lavender',
    kicker: '§ CATASTROPHIZE',
    hero: 're-estimate',
    subtitle: 'what are the odds, really?',
    whisper: 'the brain\'s first estimate is usually off · by a lot',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'RE-RATED', dateText: 'CBT · 2026' },
    body: (W) => `
${kickerLine('§ THE FEARED OUTCOME', 44, 220, 'lavender')}
${solidLine(44, 255, W - 44, 1.4)}
${kickerLine('§ FIRST PROB 0–100', 44, 305, 'lavender')}
${solidLine(220, 310, 340, 1.3)}
${kickerLine('§ EVIDENCE FOR', 44, 355, 'lavender')}
${dottedLine(44, 390, W - 44)}
${kickerLine('§ EVIDENCE AGAINST', 44, 425, 'lavender')}
${dottedLine(44, 460, W - 44)}
${kickerLine('§ NEW PROB 0–100', 44, 495, 'lavender')}
${solidLine(220, 500, 340, 1.3)}
`,
  },

  // ═════ DBT distress tolerance + emotion regulation (5) ═════════
  {
    id: 'radical-acceptance',
    title: 'Radical Acceptance',
    desc: 'Standard DBT sticker (sage). Linehan skill: SUDS 0-100 pre/post radical acceptance of what-is.',
    size: 'standard', accent: 'sage',
    kicker: '§ RADICAL ACCEPT',
    hero: 'what is, is',
    subtitle: 'distress tolerance · DBT',
    whisper: 'acceptance is not approval · it is stance',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'ACCEPTED', dateText: 'DBT · 2026' },
    body: (W) => `
${kickerLine('§ WHAT I\'M ACCEPTING', 44, 220, 'sage')}
${solidLine(44, 255, W - 44, 1.4)}
${dottedLine(44, 295, W - 44)}
${kickerLine('§ SUDS 0–100 · BEFORE', 44, 345, 'sage')}
${solidLine(260, 350, 360, 1.3)}
${kickerLine('§ SUDS 0–100 · AFTER', 44, 400, 'sage')}
${solidLine(260, 405, 360, 1.3)}
${kickerLine('§ ONE THING I\'M LEARNING', 44, 455, 'sage')}
${dottedLine(44, 490, W - 44)}
`,
  },
  {
    id: 'opposite-action',
    title: 'Opposite Action',
    desc: 'Compact DBT emotion-regulation sticker (clay). Name the emotion + did the opposite behaviour.',
    size: 'compact', accent: 'clay',
    kicker: '§ OPPOSITE ACTION',
    hero: 'do the other thing',
    subtitle: 'emotion regulation · DBT',
    whisper: 'the feeling argues · the body wins',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'DID IT', dateText: 'DBT · 2026' },
    body: (W) => `
${kickerLine('§ EMOTION', 36, 230, 'clay')}
${solidLine(36, 265, W - 36, 1.4)}
${kickerLine('§ OPPOSITE ACTION', 36, 310, 'clay')}
${solidLine(36, 345, W - 36, 1.4)}
${kickerLine('§ DID IT?', 36, 400, 'clay')}
  <g transform="translate(${W / 2 - 50}, 435)">
    <circle cx="0" cy="0" r="10" fill="none" stroke="${PALETTE.clay.ink}" stroke-width="1.3"/>
    <text x="20" y="4" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}">yes</text>
    <circle cx="70" cy="0" r="10" fill="none" stroke="${PALETTE.clay.ink}" stroke-width="1.3"/>
    <text x="90" y="4" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}">no</text>
  </g>
`,
  },
  {
    id: 'check-the-facts',
    title: 'Check the Facts',
    desc: 'Standard DBT emotion-regulation worksheet (sage). Linehan CtF: event / interpretation / emotion fit / change.',
    size: 'standard', accent: 'sage',
    kicker: '§ CHECK THE FACTS',
    hero: 'is the emotion fit?',
    subtitle: 'fact-check before reaction',
    whisper: 'interpretation is not the event',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'FACT-CHECKED', dateText: 'DBT · 2026' },
    body: (W) => `
${kickerLine('§ EVENT', 44, 220, 'sage')}
${solidLine(44, 255, W - 44, 1.4)}
${kickerLine('§ INTERPRETATION', 44, 300, 'sage')}
${solidLine(44, 335, W - 44, 1.4)}
${kickerLine('§ EMOTION + INTENSITY 1–10', 44, 380, 'sage')}
${solidLine(240, 385, W - 44, 1.3)}
${kickerLine('§ FIT? · Y / N', 44, 425, 'sage')}
${kickerLine('§ WHAT NOW', 44, 470, 'sage')}
${dottedLine(44, 505, W - 44)}
`,
  },
  {
    id: 'pro-and-con',
    title: 'Pro · Con',
    desc: 'Standard DBT 4-quadrant impulse-delay sticker (amber). Linehan: acting on urge vs resisting — short-term vs long-term pros and cons.',
    size: 'standard', accent: 'amber',
    kicker: '§ PROS · CONS',
    hero: 'before you act',
    subtitle: 'impulse delay · DBT',
    whisper: 'the 4 boxes beat the urge',
    archetype: 'ledger',
    archetypeOpts: { monogram: '4' },
    body: (W) => {
      const pad = 44;
      const colW = (W - pad * 2) / 2;
      const rowH = 110;
      const y0 = 220;
      const headers = ['+ ACTING', '− ACTING', '+ RESISTING', '− RESISTING'];
      return [0, 1, 2, 3].map(i => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = pad + col * colW;
        const y = y0 + row * rowH;
        return `  <rect x="${x}" y="${y}" width="${colW - 10}" height="${rowH - 10}" rx="4" ry="4"
            fill="rgba(249,245,236,0.4)" stroke="${PALETTE.amber.edge}" stroke-width="1"/>
  <text x="${x + 10}" y="${y + 20}"
        font-family="'JetBrains Mono', Menlo, monospace"
        font-size="10" font-weight="600" letter-spacing="${10 * 0.14}"
        fill="${PALETTE.amber.ink}">${headers[i]}</text>
  ${dottedLine(x + 10, y + 50, x + colW - 20, 0.9)}
  ${dottedLine(x + 10, y + 75, x + colW - 20, 0.9)}`;
      }).join('\n');
    },
  },
  {
    id: 'accumulate-positive-short',
    title: 'Accumulate · Short',
    desc: 'Compact DBT emotion-regulation sticker (amber). Plan one short-term joy today. Linehan ABC PLEASE.',
    size: 'compact', accent: 'amber',
    kicker: '§ ACCUMULATE +',
    hero: 'plan one joy',
    subtitle: 'short-term · today',
    whisper: 'small joys accrue · Linehan',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ ONE JOY, PLANNED', 36, 230, 'amber')}
${solidLine(36, 265, W - 36, 1.4)}
${kickerLine('§ WHEN', 36, 310, 'amber')}
${solidLine(90, 315, W - 36, 1.3)}
${kickerLine('§ PREDICTED PLEASURE 0–10', 36, 365, 'amber')}
${dotScale(56, W - 56, 405, 11, 'amber', 9, 0)}
${kickerLine('§ ACTUAL 0–10', 36, 460, 'amber')}
${dotScale(56, W - 56, 500, 11, 'amber', 9, 0)}
`,
  },

  // ═════ DBT interpersonal effectiveness (3) ═════════════════════
  {
    id: 'dearman',
    title: 'DEAR MAN',
    desc: 'Expanded DBT interpersonal-effectiveness sticker (sage). Describe/Express/Assert/Reinforce + Mindful/Appear confident/Negotiate worksheet.',
    size: 'expanded', accent: 'sage',
    kicker: '§ DEAR · MAN',
    hero: 'the script',
    subtitle: 'interpersonal effectiveness · DBT',
    whisper: 'asking clearly is a skill · not a flaw',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'USED', dateText: 'DBT · 2026' },
    body: (W) => {
      const pad = 60;
      const labels = [
        ['D', 'Describe the situation'],
        ['E', 'Express feelings'],
        ['A', 'Assert the ask'],
        ['R', 'Reinforce the benefit'],
        ['M', 'Mindful of the ask'],
        ['A', 'Appear confident'],
        ['N', 'Negotiate'],
      ];
      return labels.map(([k, l], i) => {
        const y = 220 + i * 42;
        return `  <g transform="translate(${pad}, ${y})">
    <text x="0" y="0"
          font-family="'JetBrains Mono', Menlo, monospace" font-size="14" font-weight="700"
          fill="${PALETTE.sage.ink}">${k}</text>
    <text x="26" y="0"
          font-family="'Fraunces', Georgia, serif" font-size="12"
          fill="${PALETTE.ink}" fill-opacity="0.7"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${l}</text>
  </g>
  ${dottedLine(pad + 180, y - 4, W - pad, 0.9)}`;
      }).join('\n');
    },
  },
  {
    id: 'give-stamp',
    title: 'GIVE Stamp',
    desc: 'Compact DBT sticker (lavender). Gentle/Interested/Validate/Easy-manner tick + outcome 1-5.',
    size: 'compact', accent: 'lavender',
    kicker: '§ GIVE',
    hero: 'relationship mode',
    subtitle: 'DBT interpersonal',
    whisper: 'how you say it is half the ask',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'HELD', dateText: 'DBT · 2026' },
    body: (W) => {
      const opts = [['G', 'gentle'], ['I', 'interested'], ['V', 'validate'], ['E', 'easy manner']];
      const rows = opts.map(([k, l], i) => {
        const y = 230 + i * 40;
        return `  <g transform="translate(36, ${y})">
    <rect x="0" y="0" width="14" height="14" rx="2" ry="2"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>
    <text x="22" y="12" font-family="'JetBrains Mono', Menlo, monospace" font-size="12" font-weight="700"
          fill="${PALETTE.lavender.ink}">${k}</text>
    <text x="44" y="12" font-family="'Fraunces', Georgia, serif" font-size="12"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${l}</text>
  </g>`;
      }).join('\n');
      return `${rows}
${kickerLine('§ OUTCOME 1–5', 36, 415, 'lavender')}
${dotScale(56, W - 56, 455, 5, 'lavender')}`;
    },
  },
  {
    id: 'fast-stamp',
    title: 'FAST Stamp',
    desc: 'Compact DBT self-respect sticker (amber). Fair/Apologies-no/Stick-to-values/Truthful tick.',
    size: 'compact', accent: 'amber',
    kicker: '§ FAST',
    hero: 'self-respect',
    subtitle: 'DBT interpersonal',
    whisper: 'the self that holds is the self that belongs',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'HELD', dateText: 'DBT · 2026' },
    body: (_W) => {
      const opts = [['F', 'fair'], ['A', 'apologies · no'], ['S', 'stick to values'], ['T', 'truthful']];
      return opts.map(([k, l], i) => {
        const y = 230 + i * 50;
        return `  <g transform="translate(36, ${y})">
    <rect x="0" y="0" width="14" height="14" rx="2" ry="2"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.amber.edge}" stroke-width="1"/>
    <text x="22" y="12" font-family="'JetBrains Mono', Menlo, monospace" font-size="14" font-weight="700"
          fill="${PALETTE.amber.ink}">${k}</text>
    <text x="48" y="12" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${l}</text>
  </g>`;
      }).join('\n');
    },
  },

  // ═════ ACT defusion + values (5) ═══════════════════════════════
  {
    id: 'leaves-on-stream',
    title: 'Leaves on a Stream',
    desc: 'Standard ACT defusion sticker (sage). Hayes defusion: count thoughts you watched float past, rate stuckness 0-10.',
    size: 'standard', accent: 'sage',
    kicker: '§ DEFUSION',
    hero: 'watch them pass',
    subtitle: 'thoughts as leaves · Hayes ACT',
    whisper: 'you are not what passes through the mind',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ THOUGHTS FLOATED', 44, 220, 'sage')}
  <g transform="translate(44, 240)">
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${(i % 5) * 52}" y="${Math.floor(i / 5) * 44}" width="38" height="32" rx="4" ry="4"
            fill="rgba(249,245,236,0.55)" stroke="${PALETTE.sage.edge}" stroke-width="1"/>`).join('\n    ')}
  </g>
${kickerLine('§ STUCKNESS 0–10', 44, 400, 'sage')}
${dotScale(64, W - 64, 445, 11, 'sage', 9, 0)}
`,
  },
  {
    id: 'values-card-draw',
    title: 'Values Card',
    desc: 'Compact ACT values sticker (amber). One value drawn today + one action taken on it.',
    size: 'compact', accent: 'amber',
    kicker: '§ VALUE · TODAY',
    hero: 'the compass',
    subtitle: 'one value · one action',
    whisper: 'values point · actions arrive',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ VALUE', 36, 230, 'amber')}
${solidLine(36, 265, W - 36, 1.4)}
${kickerLine('§ ONE ACTION TAKEN', 36, 325, 'amber')}
${solidLine(36, 360, W - 36, 1.4)}
${dottedLine(36, 400, W - 36)}
${kickerLine('§ DID IT MATCH?', 36, 450, 'amber')}
  <g transform="translate(${W / 2 - 50}, 485)">
    <circle cx="0" cy="0" r="10" fill="none" stroke="${PALETTE.amber.ink}" stroke-width="1.3"/>
    <text x="20" y="4" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}">yes</text>
    <circle cx="70" cy="0" r="10" fill="none" stroke="${PALETTE.amber.ink}" stroke-width="1.3"/>
    <text x="90" y="4" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}">no</text>
  </g>
`,
  },
  {
    id: 'committed-action',
    title: 'Committed Action',
    desc: 'Standard ACT sticker (sage). One 24-hour micro-commitment tied to a named value.',
    size: 'standard', accent: 'sage',
    kicker: '§ COMMIT',
    hero: 'one step · 24h',
    subtitle: 'committed action · ACT',
    whisper: 'the smallest step matters most',
    archetype: 'field-note',
    archetypeOpts: { dateText: 'ACT · 2026' },
    body: (W) => `
${kickerLine('§ VALUE', 44, 220, 'sage')}
${solidLine(100, 225, W - 44, 1.3)}
${kickerLine('§ THE STEP', 44, 275, 'sage')}
${solidLine(44, 310, W - 44, 1.4)}
${dottedLine(44, 350, W - 44)}
${kickerLine('§ WHEN (TODAY · TOMORROW)', 44, 400, 'sage')}
${solidLine(300, 405, W - 44, 1.3)}
${kickerLine('§ DONE?', 44, 450, 'sage')}
  <g transform="translate(140, 445)">
    <rect x="0" y="-12" width="24" height="24" rx="4" ry="4"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.sage.ink}" stroke-width="1.5"/>
  </g>
`,
  },
  {
    id: 'workability-question',
    title: 'Workability',
    desc: 'Compact ACT sticker (clay). "Is this working for me?" Y/N tap — cuts through self-argument.',
    size: 'compact', accent: 'clay',
    kicker: '§ WORKABILITY',
    hero: 'is this working?',
    subtitle: 'Hayes ACT · the test',
    whisper: '"right" is expensive · "working" is cheap',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ WHAT I\'M DOING', 36, 230, 'clay')}
${solidLine(36, 265, W - 36, 1.4)}
${dottedLine(36, 305, W - 36)}
${kickerLine('§ IS IT WORKING?', 36, 360, 'clay')}
  <g transform="translate(${W / 2 - 60}, 395)">
    <circle cx="0" cy="0" r="14" fill="none" stroke="${PALETTE.clay.ink}" stroke-width="1.5"/>
    <text x="24" y="5" font-family="'Fraunces', Georgia, serif" font-size="16"
          fill="${PALETTE.ink}">yes</text>
    <circle cx="80" cy="0" r="14" fill="none" stroke="${PALETTE.clay.ink}" stroke-width="1.5"/>
    <text x="104" y="5" font-family="'Fraunces', Georgia, serif" font-size="16"
          fill="${PALETTE.ink}">no</text>
  </g>
${kickerLine('§ IF NOT · THEN WHAT', 36, 450, 'clay')}
${dottedLine(36, 485, W - 36)}
`,
  },
  {
    id: 'observer-self',
    title: 'Observer Self',
    desc: 'Standard ACT sticker (lavender). Notice / Name / Normalize — Harris triad for defusing.',
    size: 'standard', accent: 'lavender',
    kicker: '§ OBSERVER',
    hero: 'notice · name · normalize',
    subtitle: 'the self behind the thought',
    whisper: 'observing is the escape hatch',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ NOTICE (what showed up)', 44, 220, 'lavender')}
${solidLine(44, 255, W - 44, 1.3)}
${kickerLine('§ NAME (call it by its name)', 44, 305, 'lavender')}
${solidLine(44, 340, W - 44, 1.3)}
${kickerLine('§ NORMALIZE (brains do this)', 44, 390, 'lavender')}
${solidLine(44, 425, W - 44, 1.3)}
${dottedLine(44, 475, W - 44)}
`,
  },

  // ═════ ERP / OCD deep (2) ══════════════════════════════════════
  {
    id: 'erp-hierarchy',
    title: 'ERP Hierarchy',
    desc: 'Expanded OCD exposure-hierarchy sticker (sage). 5 SUDS levels (20/40/60/80/100), check-off when done.',
    size: 'expanded', accent: 'sage',
    kicker: '§ HIERARCHY',
    hero: 'the ladder',
    subtitle: '5 SUDS levels · ERP',
    whisper: 'build the ladder · climb one rung at a time',
    archetype: 'ledger',
    archetypeOpts: { monogram: 'H' },
    body: (W) => {
      const suds = [20, 40, 60, 80, 100];
      const rows = suds.map((s, i) => {
        const y = 220 + i * 48;
        return `${kickerLine(`§ SUDS ${s}`, 60, y, 'sage')}
${solidLine(150, y - 4, W - 140, 1.3)}
  <g transform="translate(${W - 90}, ${y - 14})">
    <rect x="0" y="0" width="24" height="24" rx="4" ry="4"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.sage.ink}" stroke-width="1.5"/>
  </g>`;
      }).join('\n');
      return rows;
    },
  },
  {
    id: 'uncertainty-tap',
    title: 'Uncertainty Tap',
    desc: 'Compact OCD sticker (clay). Tolerated uncertainty Y/N + discomfort 1-5. Builds tolerance to "not knowing".',
    size: 'compact', accent: 'clay',
    kicker: '§ UNCERTAINTY',
    hero: 'not-knowing, held',
    subtitle: 'the discomfort is the work',
    whisper: 'certainty is a cost we pay elsewhere',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'HELD', dateText: 'ERP · 2026' },
    body: (W) => `
${kickerLine('§ WHAT I\'M NOT-KNOWING', 36, 230, 'clay')}
${solidLine(36, 265, W - 36, 1.4)}
${dottedLine(36, 305, W - 36)}
${kickerLine('§ TOLERATED?', 36, 355, 'clay')}
  <g transform="translate(${W / 2 - 50}, 390)">
    <circle cx="0" cy="0" r="10" fill="none" stroke="${PALETTE.clay.ink}" stroke-width="1.3"/>
    <text x="20" y="4" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}">yes</text>
    <circle cx="70" cy="0" r="10" fill="none" stroke="${PALETTE.clay.ink}" stroke-width="1.3"/>
    <text x="90" y="4" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}">no</text>
  </g>
${kickerLine('§ DISCOMFORT 1–5', 36, 445, 'clay')}
${dotScale(56, W - 56, 485, 5, 'clay')}
`,
  },

  // ═════ ADHD deep (3) ═══════════════════════════════════════════
  {
    id: 'self-talk-script',
    title: 'Self-Talk Script',
    desc: 'Standard ADHD executive-function sticker (clay). Barkley internalization-of-speech: write the private sentence you\'re using right now to guide yourself through the task.',
    size: 'standard', accent: 'clay',
    kicker: '§ SELF-TALK',
    hero: 'the inner coach',
    subtitle: 'Barkley · Vygotskian ADHD',
    whisper: 'the private sentence builds the public self',
    archetype: 'field-note',
    archetypeOpts: { dateText: 'COACH · 2026' },
    body: (W) => `
${kickerLine('§ TASK', 44, 220, 'clay')}
${solidLine(44, 255, W - 44, 1.4)}
${kickerLine('§ WHAT I\'M TELLING MYSELF', 44, 305, 'clay')}
${solidLine(44, 340, W - 44, 1.4)}
${dottedLine(44, 380, W - 44)}
${kickerLine('§ FRIEND-VOICE SWAP', 44, 430, 'clay')}
${dottedLine(44, 465, W - 44)}
${dottedLine(44, 500, W - 44)}
`,
  },
  {
    id: 'task-estimation-log',
    title: 'Task Estimation',
    desc: 'Standard ADHD time-blindness sticker (sage). 3 rows of estimated vs actual minutes. Closes the planning-fallacy gap over time.',
    size: 'standard', accent: 'sage',
    kicker: '§ EST · ACTUAL',
    hero: 'time audit',
    subtitle: 'estimate · do · compare',
    whisper: 'the brain lies about duration · data doesn\'t',
    archetype: 'ledger',
    archetypeOpts: { monogram: 'Σ' },
    body: (W) => {
      const pad = 44;
      const header = `  <g transform="translate(${pad}, 220)">
    <text x="0" y="0" font-family="'JetBrains Mono', Menlo, monospace" font-size="10" font-weight="600"
          letter-spacing="${10 * 0.14}" fill="${PALETTE.sage.ink}">§ TASK</text>
    <text x="240" y="0" font-family="'JetBrains Mono', Menlo, monospace" font-size="10" font-weight="600"
          letter-spacing="${10 * 0.14}" fill="${PALETTE.sage.ink}">§ EST (MIN)</text>
    <text x="380" y="0" font-family="'JetBrains Mono', Menlo, monospace" font-size="10" font-weight="600"
          letter-spacing="${10 * 0.14}" fill="${PALETTE.sage.ink}">§ ACTUAL (MIN)</text>
  </g>`;
      const rows = Array.from({ length: 3 }, (_, i) => {
        const y = 260 + i * 60;
        return `${solidLine(pad, y, pad + 220, 1.2)}
${solidLine(pad + 240, y, pad + 340, 1.2)}
${solidLine(pad + 380, y, W - pad, 1.2)}`;
      }).join('\n');
      return header + '\n' + rows;
    },
  },
  {
    id: 'pomodoro-stamp',
    title: 'Pomodoro Stamp',
    desc: 'Compact ADHD sticker (clay). 25-minute focus-block tick + focus quality 1-5. Cirillo technique.',
    size: 'compact', accent: 'clay',
    kicker: '§ POMODORO',
    hero: '25 min · done',
    subtitle: 'one block · one focus',
    whisper: 'momentum is built in blocks',
    archetype: 'field-note',
    archetypeOpts: { dateText: 'BLOCK · 2026' },
    body: (W) => `
${kickerLine('§ TASK', 36, 230, 'clay')}
${solidLine(36, 265, W - 36, 1.4)}
${kickerLine('§ BLOCKS DONE', 36, 320, 'clay')}
  <g transform="translate(36, 340)">
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${i * 56}" y="0" width="44" height="28" rx="4" ry="4"
            fill="rgba(249,245,236,0.55)" stroke="${PALETTE.clay.edge}" stroke-width="1.3"/>`).join('\n    ')}
  </g>
${kickerLine('§ FOCUS 1–5', 36, 420, 'clay')}
${dotScale(56, W - 56, 460, 5, 'clay')}
`,
  },

  // ═════ Smoking deep (2) ════════════════════════════════════════
  {
    id: 'nrt-usage',
    title: 'NRT Usage',
    desc: 'Compact cessation sticker (amber). Which nicotine replacement used + dose + helped 1-5.',
    size: 'compact', accent: 'amber',
    kicker: '§ NRT',
    hero: 'nicotine replacement',
    subtitle: 'what · dose · help',
    whisper: 'the tool is not the trophy',
    archetype: 'ledger',
    archetypeOpts: { monogram: 'N' },
    body: (W) => `
${kickerLine('§ TYPE', 36, 220, 'amber')}
  <g transform="translate(36, 240)">
${checkBox(0,  0, 'patch', 'amber')}
${checkBox(0,  34, 'gum', 'amber')}
${checkBox(0,  68, 'lozenge', 'amber')}
${checkBox(0, 102, 'vape', 'amber')}
  </g>
${kickerLine('§ DOSE (MG)', 36, 395, 'amber')}
${solidLine(140, 400, W - 36, 1.3)}
${kickerLine('§ HELPED 1–5', 36, 445, 'amber')}
${dotScale(56, W - 56, 485, 5, 'amber', 10)}
`,
  },
  {
    id: 'money-saved-stamp',
    title: 'Money Saved',
    desc: 'Compact cessation milestone sticker (amber). Cigarettes not-smoked × unit cost. Small number compounds.',
    size: 'compact', accent: 'amber',
    kicker: '§ $ SAVED',
    hero: 'not-smoked',
    subtitle: '× unit cost · compounds',
    whisper: 'small savings add up · every one counts',
    archetype: 'field-note',
    archetypeOpts: { dateText: 'SAVED · 2026' },
    body: (W) => `
${kickerLine('§ CIGS NOT SMOKED', 36, 230, 'amber')}
  <g transform="translate(${W / 2}, 275)">
    <text x="0" y="0" text-anchor="middle"
          font-family="'Fraunces', Georgia, serif" font-size="60" font-weight="400"
          fill="${PALETTE.amber.ink}"
          style="font-variation-settings: 'opsz' 72, 'SOFT' 40;">____</text>
  </g>
${kickerLine('§ × UNIT COST', 36, 355, 'amber')}
${solidLine(160, 360, W - 36, 1.3)}
${kickerLine('§ = SAVED', 36, 420, 'amber')}
${solidLine(120, 425, W - 36, 1.4)}
`,
  },

  // ═════ Positive psych (2) ══════════════════════════════════════
  {
    id: 'savor-anticipation',
    title: 'Savor · Anticipation',
    desc: 'Compact anticipatory-savouring sticker (amber). Pre-taste a future event + excitement 1-5. Bryant &amp; Veroff.',
    size: 'compact', accent: 'amber',
    kicker: '§ SAVOR AHEAD',
    hero: 'looking forward',
    subtitle: 'pre-taste the event',
    whisper: 'anticipation is its own pleasure',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ THE EVENT', 36, 230, 'amber')}
${solidLine(36, 265, W - 36, 1.4)}
${dottedLine(36, 305, W - 36)}
${kickerLine('§ EXCITEMENT 1–5', 36, 360, 'amber')}
${dotScale(56, W - 56, 400, 5, 'amber')}
${kickerLine('§ WHEN', 36, 460, 'amber')}
${solidLine(90, 465, W - 36, 1.3)}
`,
  },
  {
    id: 'awe-capture',
    title: 'Awe Moment',
    desc: 'Compact Keltner awe sticker (sage). Capture the awe-thing + location. Awe expands the self.',
    size: 'compact', accent: 'sage',
    kicker: '§ AWE',
    hero: 'the moment',
    subtitle: 'that widened you',
    whisper: 'awe makes the self smaller · in the right way',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ WHAT', 36, 230, 'sage')}
${solidLine(36, 265, W - 36, 1.4)}
${kickerLine('§ WHERE', 36, 315, 'sage')}
${solidLine(36, 350, W - 36, 1.3)}
${kickerLine('§ ONE WORD', 36, 400, 'sage')}
${solidLine(36, 435, W - 36, 1.4)}
`,
  },
];

async function main(): Promise<void> {
  console.log(`\nBuilding Wave-2 (${WAVE2.length} stickers)…\n`);
  for (const s of WAVE2) {
    const { width: W } = SIZE_CLASSES[s.size];
    const svg = stickerShell({
      id: s.id,
      title: s.title,
      desc: s.desc,
      size: s.size,
      accent: s.accent,
      kicker: s.kicker,
      hero: s.hero,
      subtitle: s.subtitle,
      whisper: s.whisper,
      bodySvg: s.body(W),
      skeuo: archetype(s.archetype, s.size, s.accent, s.archetypeOpts),
    });
    await ship(s.id, svg);
  }
  console.log(`\n✓ All ${WAVE2.length} Wave-2 stickers built.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
