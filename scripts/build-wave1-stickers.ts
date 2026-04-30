/**
 * Build Wave-1 — the 20 targeted sticker expansion.
 *
 * Follows the CEO plan in docs/plan-ceo-review-sticker-expansion-v1.md
 * (Approach B: ship the highest-signal 20 first, then Wave-2 after 30
 * days of usage data — *user overrode to ship all 60, so Wave-2 ships
 * in build-wave2-stickers.ts*).
 *
 * Grouping (by condition):
 *   1. ADHD / executive function (4)
 *      time-check, working-memory-offload, transition-warning,
 *      affect-regulation-pause
 *   2. Smoking cessation (4)
 *      urge-tally, trigger-log, replacement-behavior, time-since-last
 *   3. Medication experience (3)
 *      med-kick, side-effect-dot, missed-dose
 *   4. OCD / ERP (2)
 *      erp-script, compulsion-delay
 *   5. Anxiety (2)
 *      gad2-lite, tipp-stamp
 *   6. Depression / behavioural activation (1)
 *      ba-scheduled
 *   7. Sleep (2)
 *      sleep-log, worry-to-bed
 *   8. Self-compassion + savouring (2)
 *      self-kindness-break, savor-in-moment
 *
 * Every sticker uses an `archetype()` preset mapped to its family,
 * and a small, hand-authored `bodySvg` that expresses the one
 * practice it captures (scale / tap grid / worksheet / stamp).
 *
 * Run: npx tsx scripts/build-wave1-stickers.ts
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

// ─── Ship helper (same shape as build-stickers-remaining) ───────
async function ship(name: string, svg: string): Promise<void> {
  const dir = path.join(REPO, 'packs/journals/prax-journal/stickers', name);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${name}.svg`), svg);
  await rasterize(svg, path.join(dir, `${name}.png`), 4);
  console.log(`  ✓ ${name}  (${Math.round(svg.length / 1024)} KB)`);
}

// ─── Small body-building primitives ─────────────────────────────
// Kept local so Wave 1 doesn't leak into the renderer's public API.

/** Numbered row of N empty ticks (for tally-based stickers). */
function tickRow(x0: number, y: number, n: number, accent: Accent, boxW = 18): string {
  const gap = boxW + 6;
  return Array.from({ length: n }, (_, i) => {
    const bx = x0 + i * gap;
    return `  <rect x="${bx}" y="${y}" width="${boxW}" height="${boxW}" rx="3" ry="3"
            fill="rgba(249,245,236,0.55)"
            stroke="${PALETTE[accent].edge}" stroke-width="1.1"/>`;
  }).join('\n');
}

/** Labeled 1-5 (or 0-N) dot scale, horizontal. */
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

/** Compact Q&A row: "Q1 <question text> … 0 1 2 3" dot scale. */
function qRow(
  qNum: number, text: string, y: number, W: number, accent: Accent,
): string {
  const marginX = 36;
  const scaleY = y + 46;
  return `${kickerLine(`Q${qNum}`, marginX, y, accent)}
  <text x="${marginX + 30}" y="${y}"
        font-family="'Fraunces', Georgia, serif"
        font-size="11"
        fill="${PALETTE.ink}"
        style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${text}</text>
${dotScale(marginX + 16, W - marginX - 16, scaleY, 4, accent, 10, 0)}`;
}

/** Horizontal label+line for "THING:" + writing line. */
function labeledLine(
  label: string, y: number, W: number, accent: Accent,
  dotted = false, pad = 44,
): string {
  const labelW = label.length * 8 + 8;
  const line = dotted
    ? dottedLine(pad + labelW + 4, y + 4, W - pad, 0.9)
    : solidLine(pad + labelW + 4, y + 4, W - pad, 1.3);
  return `${kickerLine(label, pad, y, accent, 10)}
${line}`;
}

// ─── Sticker dataset (data-driven) ──────────────────────────────
// Each sticker = id + copy + build(body) function + archetype mapping.
// Body builders receive width W and emit an SVG fragment string.

interface WaveEntry {
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

const WAVE1: WaveEntry[] = [
  // ───── ADHD / executive function ─────────────────────────────
  {
    id: 'time-check',
    title: 'Time Check',
    desc: 'A compact ADHD time-blindness sticker with a sage rail. Tap current clock time + estimate how long you\'ve been on the current task — closes Barkley\'s time horizon gap.',
    size: 'compact', accent: 'sage',
    kicker: '§ TIME CHECK',
    hero: 'what time is it?',
    subtitle: 'notice the hour · notice the drift',
    whisper: 'time slips · naming it pulls it back',
    archetype: 'field-note',
    archetypeOpts: { dateText: 'CHECK · 2026' },
    body: (W) => `
${kickerLine('§ RIGHT NOW', 36, 235, 'sage')}
${solidLine(36, 270, W - 36, 1.4)}
${kickerLine('§ ON THIS TASK FOR', 36, 315, 'sage')}
${dotScale(56, W - 56, 355, 7, 'sage', 13, 5)}
  <text x="${W / 2}" y="390" text-anchor="middle"
        font-family="'Fraunces', Georgia, serif" font-size="10" font-style="italic"
        fill="${PALETTE.sage.ink}" fill-opacity="0.6">5 · 10 · 20 · 30 · 60 · 90 · 120 min</text>
${kickerLine('§ I PLANNED', 36, 435, 'sage')}
${dottedLine(36, 468, W - 36)}
`,
  },

  {
    id: 'working-memory-offload',
    title: 'Working Memory Offload',
    desc: 'Standard ADHD sticker (sage). Barkley nonverbal working-memory offload: 6 numbered slots for what\'s currently in your head before starting the next task.',
    size: 'standard', accent: 'sage',
    kicker: '§ BRAIN OFFLOAD',
    hero: 'dump it here',
    subtitle: '6 slots · empty the RAM',
    whisper: 'nothing held in-head works twice',
    archetype: 'field-note',
    archetypeOpts: { dateText: 'OFFLOAD · 2026' },
    body: (W) => {
      const pad = 44;
      const slots = Array.from({ length: 6 }, (_, i) => {
        const y = 210 + i * 42;
        const n = String(i + 1).padStart(2, '0');
        return `  <text x="${pad}" y="${y}"
              font-family="'JetBrains Mono', Menlo, monospace" font-size="11" font-weight="600"
              fill="${PALETTE.sage.ink}" fill-opacity="0.7">${n}</text>
${solidLine(pad + 26, y - 4, W - pad, 1.2)}`;
      }).join('\n');
      return slots;
    },
  },

  {
    id: 'transition-warning',
    title: 'Transition Warning',
    desc: 'Compact task-switching sticker (amber). Tap when you\'re about to switch tasks + capture what you were doing in 5 words, so the thread survives the interruption. Hallowell/Ratey.',
    size: 'compact', accent: 'amber',
    kicker: '§ TRANSITION',
    hero: 'mid-switch',
    subtitle: 'what were you doing?',
    whisper: 'the thread you drop is the work you lose',
    archetype: 'field-note',
    archetypeOpts: { dateText: 'SWITCH · 2026' },
    body: (W) => `
  <g transform="translate(${W / 2 - 20}, 230)">
    <rect x="0" y="0" width="40" height="40" rx="6" ry="6"
          fill="rgba(249,245,236,0.6)"
          stroke="${PALETTE.amber.ink}" stroke-width="1.8"/>
  </g>
${kickerLine('§ WHAT I WAS DOING', 36, 310, 'amber')}
${solidLine(36, 345, W - 36, 1.4)}
${dottedLine(36, 385, W - 36)}
${kickerLine('§ WHAT I\'M SWITCHING TO', 36, 425, 'amber')}
${solidLine(36, 460, W - 36, 1.4)}
`,
  },

  {
    id: 'affect-regulation-pause',
    title: 'Affect Regulation Pause',
    desc: 'Compact emotion-intensity sticker (lavender). Tap when emotion spikes, rate intensity 1-5, name one trigger word before reacting. Barkley self-regulation of affect.',
    size: 'compact', accent: 'lavender',
    kicker: '§ PAUSE · NAME',
    hero: 'emotion, now',
    subtitle: 'before the react · a breath',
    whisper: 'the pause is the work',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ INTENSITY 1–5', 36, 230, 'lavender')}
${dotScale(56, W - 56, 270, 5, 'lavender')}
${kickerLine('§ ONE WORD', 36, 330, 'lavender')}
${solidLine(36, 363, W - 36, 1.4)}
${kickerLine('§ ONE BREATH', 36, 405, 'lavender')}
  <g transform="translate(${W / 2 - 40}, 440)">
    <circle cx="0"  cy="0" r="8" fill="none" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>
    <circle cx="20" cy="0" r="8" fill="none" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>
    <circle cx="40" cy="0" r="8" fill="none" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>
    <circle cx="60" cy="0" r="8" fill="none" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>
    <circle cx="80" cy="0" r="8" fill="none" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>
  </g>
`,
  },

  // ───── Smoking cessation ──────────────────────────────────────
  {
    id: 'urge-tally',
    title: 'Urge Tally',
    desc: 'Compact cessation sticker (clay). 10 tap-boxes for each urge event + peak intensity 1-5. Marlatt relapse prevention — counting urges defuses them.',
    size: 'compact', accent: 'clay',
    kicker: '§ URGE TALLY',
    hero: 'cravings today',
    subtitle: 'one tap per urge · no judgment',
    whisper: 'counting is coping',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'RIDDEN', dateText: 'RP · 2026' },
    body: (W) => `
${kickerLine('§ TAP EACH URGE', 36, 230, 'clay')}
  <g transform="translate(36, 250)">
${tickRow(0, 0, 5, 'clay', 26)}
${tickRow(0, 34, 5, 'clay', 26)}
  </g>
${kickerLine('§ PEAK INTENSITY 1–5', 36, 360, 'clay')}
${dotScale(56, W - 56, 405, 5, 'clay')}
`,
  },

  {
    id: 'trigger-log',
    title: 'Trigger Log',
    desc: 'Standard ecological-momentary-assessment sticker (clay). 3 columns: where + with whom + mood — capture the context of the urge so the AI can surface patterns.',
    size: 'standard', accent: 'clay',
    kicker: '§ TRIGGER LOG',
    hero: 'the setup',
    subtitle: 'where · who · mood',
    whisper: 'the context is the cure',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'LOGGED', dateText: 'EMA · 2026' },
    body: (W) => {
      const pad = 44;
      const colW = (W - pad * 2 - 40) / 3;
      const colY = 230;
      const cols = [
        { k: '§ WHERE', opts: ['home', 'work', 'bar', 'car', 'other'] },
        { k: '§ WHO',   opts: ['alone', 'partner', 'friend', 'family', 'coworker'] },
        { k: '§ MOOD',  opts: ['bored', 'stressed', 'happy', 'sad', 'angry'] },
      ];
      return cols.map((c, i) => {
        const x0 = pad + i * (colW + 20);
        const items = c.opts.map((o, j) => `
  <g transform="translate(${x0}, ${colY + 40 + j * 32})">
    <rect x="0" y="0" width="14" height="14" rx="2" ry="2"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.clay.edge}" stroke-width="1"/>
    <text x="22" y="12"
          font-family="'Fraunces', Georgia, serif" font-size="12"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${o}</text>
  </g>`).join('');
        return `${kickerLine(c.k, x0, colY, 'clay')}${items}`;
      }).join('\n');
    },
  },

  {
    id: 'replacement-behavior',
    title: 'Replacement Behavior',
    desc: 'Compact alternative-action sticker (sage). Tick which replacement you used when the urge hit, rate how well it worked 1-5. Miller/Rollnick MI + behavioural substitution.',
    size: 'compact', accent: 'sage',
    kicker: '§ INSTEAD, I…',
    hero: 'one of these',
    subtitle: 'instead of lighting up',
    whisper: 'the urge shrinks the second time you defer',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'USED', dateText: 'MI · 2026' },
    body: (W) => {
      const pad = 36;
      const opts = ['water', 'walk', 'call', 'breath', 'candy', 'other'];
      const rows = opts.map((o, i) => {
        const y = 230 + i * 34;
        return `  <g transform="translate(${pad}, ${y})">
    <rect x="0" y="0" width="14" height="14" rx="2" ry="2"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.sage.edge}" stroke-width="1"/>
    <text x="22" y="12"
          font-family="'Fraunces', Georgia, serif" font-size="12"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${o}</text>
  </g>`;
      }).join('\n');
      return `${rows}
${kickerLine('§ WORKED 1–5', pad, 470, 'sage')}
${dotScale(pad + 20, W - pad - 20, 510, 5, 'sage', 10)}`;
    },
  },

  {
    id: 'time-since-last',
    title: 'Time Since Last',
    desc: 'Compact cessation milestone sticker (amber). Hand-write the hours:minutes since your last cigarette. Behavioural commitment — every hour is a data point and a win.',
    size: 'compact', accent: 'amber',
    kicker: '§ SINCE LAST',
    hero: 'the streak',
    subtitle: 'hours · minutes',
    whisper: 'every hour is a win · on record',
    archetype: 'field-note',
    archetypeOpts: { dateText: 'STREAK · 2026' },
    body: (W) => `
  <g transform="translate(${W / 2}, 270)">
    <text x="-90" y="0"
          font-family="'Fraunces', Georgia, serif" font-size="68" font-weight="400"
          text-anchor="end"
          fill="${PALETTE.amber.ink}"
          style="font-variation-settings: 'opsz' 72, 'SOFT' 40;">__</text>
    <text x="-40" y="0"
          font-family="'Fraunces', Georgia, serif" font-size="42"
          fill="${PALETTE.amber.ink}" fill-opacity="0.55">h</text>
    <text x="60" y="0"
          font-family="'Fraunces', Georgia, serif" font-size="68" font-weight="400"
          text-anchor="end"
          fill="${PALETTE.amber.ink}"
          style="font-variation-settings: 'opsz' 72, 'SOFT' 40;">__</text>
    <text x="90" y="0"
          font-family="'Fraunces', Georgia, serif" font-size="42"
          fill="${PALETTE.amber.ink}" fill-opacity="0.55">m</text>
  </g>
${kickerLine('§ AS OF', 36, 355, 'amber')}
${solidLine(36, 390, W - 36, 1.3)}
${kickerLine('§ NEXT MILESTONE', 36, 435, 'amber')}
${dottedLine(36, 470, W - 36)}
`,
  },

  // ───── Medication experience ──────────────────────────────────
  {
    id: 'med-kick',
    title: 'Med Kick',
    desc: 'Compact stimulant-effect sticker (lavender). Capture how many minutes until you feel the kick, and subjective peak effect 1-5. Clinical med-experience self-report for psychiatrist conversations.',
    size: 'compact', accent: 'lavender',
    kicker: '§ MED KICK',
    hero: 'felt it in',
    subtitle: 'minutes · peak effect',
    whisper: 'the body reports · the pharmacist listens',
    archetype: 'ledger',
    archetypeOpts: { monogram: 'Rx' },
    body: (W) => `
${kickerLine('§ FELT IT IN (MIN)', 36, 225, 'lavender')}
  <g transform="translate(${W / 2}, 265)">
    <text x="0" y="0" text-anchor="middle"
          font-family="'Fraunces', Georgia, serif" font-size="52" font-weight="400"
          fill="${PALETTE.lavender.ink}"
          style="font-variation-settings: 'opsz' 72, 'SOFT' 40;">____</text>
  </g>
${kickerLine('§ PEAK EFFECT 1–5', 36, 340, 'lavender')}
${dotScale(56, W - 56, 380, 5, 'lavender')}
${kickerLine('§ NOTES', 36, 435, 'lavender')}
${dottedLine(36, 470, W - 36)}
`,
  },

  {
    id: 'side-effect-dot',
    title: 'Side Effect Dot',
    desc: 'Compact sticker (clay). Six tiny glyph-circles capture today\'s stimulant side-effects: appetite↓, sleep↓, jitter, mood-flat, headache, other — fill the ones that happened. FDA PRO pattern.',
    size: 'compact', accent: 'clay',
    kicker: '§ SIDE EFFECTS',
    hero: 'what showed up',
    subtitle: 'tap the ones that happened',
    whisper: 'the body tracks · the doctor sees',
    archetype: 'ledger',
    archetypeOpts: { monogram: 'Rx' },
    body: (W) => {
      const labels = ['appetite ↓', 'sleep ↓', 'jitter', 'mood flat', 'headache', 'other'];
      const rows = labels.map((l, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 48 + col * ((W - 96) / 2);
        const y = 230 + row * 54;
        return `  <g transform="translate(${x}, ${y})">
    <circle cx="12" cy="12" r="11" fill="rgba(249,245,236,0.55)"
            stroke="${PALETTE.clay.edge}" stroke-width="1.2"/>
    <text x="34" y="16"
          font-family="'Fraunces', Georgia, serif" font-size="12"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${l}</text>
  </g>`;
      }).join('\n');
      return `${rows}
${kickerLine('§ SEVERITY 1–5', 36, 425, 'clay')}
${dotScale(56, W - 56, 465, 5, 'clay')}`;
    },
  },

  {
    id: 'missed-dose',
    title: 'Missed Dose',
    desc: 'Compact med-adherence sticker (clay). Date + which med + why (3 options). Adherence log for the psychiatry conversation — no judgment, just signal.',
    size: 'compact', accent: 'clay',
    kicker: '§ MISSED DOSE',
    hero: 'a skip, logged',
    subtitle: 'no shame · just data',
    whisper: 'adherence is a trend not a moment',
    archetype: 'ledger',
    archetypeOpts: { monogram: '✕' },
    body: (W) => `
${kickerLine('§ WHEN', 36, 230, 'clay')}
${solidLine(96, 235, W - 36, 1.3)}
${kickerLine('§ WHICH MED', 36, 280, 'clay')}
${solidLine(140, 285, W - 36, 1.3)}
${kickerLine('§ WHY', 36, 340, 'clay')}
  <g transform="translate(36, 370)">
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="14" height="14" rx="2" fill="rgba(249,245,236,0.55)" stroke="${PALETTE.clay.edge}"/>
      <text x="22" y="12" font-family="'Fraunces', Georgia, serif" font-size="12"
            fill="${PALETTE.ink}"
            style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">forgot</text>
    </g>
    <g transform="translate(0, 34)">
      <rect x="0" y="0" width="14" height="14" rx="2" fill="rgba(249,245,236,0.55)" stroke="${PALETTE.clay.edge}"/>
      <text x="22" y="12" font-family="'Fraunces', Georgia, serif" font-size="12"
            fill="${PALETTE.ink}"
            style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">side effects</text>
    </g>
    <g transform="translate(0, 68)">
      <rect x="0" y="0" width="14" height="14" rx="2" fill="rgba(249,245,236,0.55)" stroke="${PALETTE.clay.edge}"/>
      <text x="22" y="12" font-family="'Fraunces', Georgia, serif" font-size="12"
            fill="${PALETTE.ink}"
            style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">ran out / other</text>
    </g>
  </g>
`,
  },

  // ───── OCD / ERP ─────────────────────────────────────────────
  {
    id: 'erp-script',
    title: 'ERP Script',
    desc: 'Expanded OCD exposure/response-prevention sticker (sage). Name the obsession, note whether you resisted the compulsion, rate distress pre/post on SUDS 0-100. Foa &amp; Yadin ERP.',
    size: 'expanded', accent: 'sage',
    kicker: '§ ERP SCRIPT',
    hero: 'exposure · response',
    subtitle: 'let it be uncomfortable · let it pass',
    whisper: 'the brain learns from the sitting · not the checking',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'COMPLETED', dateText: 'ERP · 2026' },
    body: (W) => {
      const pad = 60;
      return `
${kickerLine('§ OBSESSION', pad, 220, 'sage')}
${solidLine(pad, 255, W - pad, 1.4)}
${dottedLine(pad, 295, W - pad)}
${kickerLine('§ RESISTED?', pad, 345, 'sage')}
  <g transform="translate(${pad + 130}, 340)">
    <circle cx="0" cy="0" r="10" fill="none" stroke="${PALETTE.sage.ink}" stroke-width="1.3"/>
    <text x="22" y="4" font-family="'Fraunces', Georgia, serif" font-size="14"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">yes</text>
    <circle cx="80" cy="0" r="10" fill="none" stroke="${PALETTE.sage.ink}" stroke-width="1.3"/>
    <text x="102" y="4" font-family="'Fraunces', Georgia, serif" font-size="14"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">no</text>
  </g>
${kickerLine('§ SUDS 0–100 · PRE', pad, 395, 'sage')}
${solidLine(pad + 150, 400, pad + 260, 1.3)}
${kickerLine('§ SUDS 0–100 · POST', pad + 320, 395, 'sage')}
${solidLine(pad + 480, 400, pad + 600, 1.3)}
${kickerLine('§ WHAT I NOTICED', pad, 450, 'sage')}
${dottedLine(pad, 485, W - pad)}
`;
    },
  },

  {
    id: 'compulsion-delay',
    title: 'Compulsion Delay',
    desc: 'Compact OCD delay-ladder sticker (sage). Check which delay length you tolerated (1m / 5m / 15m / 30m / 60m) before doing the compulsion (or not). Abramowitz ERP.',
    size: 'compact', accent: 'sage',
    kicker: '§ DELAY',
    hero: 'wait it out',
    subtitle: 'then see how much the urge dropped',
    whisper: 'delay is a dose of exposure',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'DELAYED', dateText: 'ERP · 2026' },
    body: (W) => {
      const labels = ['1m', '5m', '15m', '30m', '60m'];
      const boxes = labels.map((l, i) => {
        const x = 40 + i * ((W - 80) / 5);
        return `  <g transform="translate(${x}, 240)">
    <rect x="0" y="0" width="42" height="42" rx="6" ry="6"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.sage.edge}" stroke-width="1.3"/>
    <text x="21" y="26" text-anchor="middle"
          font-family="'JetBrains Mono', Menlo, monospace" font-size="12" font-weight="600"
          fill="${PALETTE.sage.ink}" fill-opacity="0.75">${l}</text>
  </g>`;
      }).join('\n');
      return `${boxes}
${kickerLine('§ URGE AT END 1–5', 36, 340, 'sage')}
${dotScale(56, W - 56, 385, 5, 'sage')}
${kickerLine('§ DID I DO IT?', 36, 440, 'sage')}
  <g transform="translate(${W / 2 - 50}, 475)">
    <circle cx="0" cy="0" r="10" fill="none" stroke="${PALETTE.sage.ink}" stroke-width="1.3"/>
    <text x="20" y="4" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">yes</text>
    <circle cx="70" cy="0" r="10" fill="none" stroke="${PALETTE.sage.ink}" stroke-width="1.3"/>
    <text x="90" y="4" font-family="'Fraunces', Georgia, serif" font-size="13"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">no</text>
  </g>`;
    },
  },

  // ───── Anxiety ────────────────────────────────────────────────
  {
    id: 'gad2-lite',
    title: 'GAD-2 Lite',
    desc: 'Compact GAD-2 anxiety screen (lavender). Parallels PHQ-2 Lite — two questions on a 0-3 scale. Kroenke et al. anxiety self-screen.',
    size: 'compact', accent: 'lavender',
    kicker: '§ GAD-2 LITE',
    hero: 'anxiety check',
    subtitle: 'two questions · past 14 days',
    whisper: 'a number, not a verdict',
    archetype: 'ledger',
    archetypeOpts: { monogram: 'G' },
    body: (W) => `
${qRow(1, 'Feeling nervous / anxious / on edge', 220, W, 'lavender')}
${qRow(2, 'Unable to stop or control worrying', 360, W, 'lavender')}
  <text x="${W / 2}" y="510"
        text-anchor="middle"
        font-family="'JetBrains Mono', Menlo, monospace" font-size="8" font-weight="500"
        letter-spacing="${8 * 0.12}"
        fill="${PALETTE.lavender.ink}" fill-opacity="0.6">0 NOT AT ALL · 1 SEVERAL · 2 &gt; HALF · 3 NEARLY EVERY</text>
`,
  },

  {
    id: 'tipp-stamp',
    title: 'TIPP Stamp',
    desc: 'Compact DBT distress-tolerance sticker (lavender). Tick which TIPP skill you used (Temperature / Intense-exercise / Paced-breathing / Paired-muscle-relaxation) + rate pre/post intensity 1-5. Linehan DBT.',
    size: 'compact', accent: 'lavender',
    kicker: '§ TIPP',
    hero: 'tipp skill used',
    subtitle: 'distress tolerance · DBT',
    whisper: 'change the body · change the wave',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'USED', dateText: 'DBT · 2026' },
    body: (W) => {
      const opts = [
        ['T', 'temperature (cold)'],
        ['I', 'intense exercise'],
        ['P', 'paced breathing'],
        ['P', 'paired relaxation'],
      ];
      const rows = opts.map(([k, l], i) => {
        const y = 220 + i * 38;
        return `  <g transform="translate(36, ${y})">
    <rect x="0" y="0" width="14" height="14" rx="2" ry="2"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.lavender.edge}" stroke-width="1"/>
    <text x="22" y="12" font-family="'JetBrains Mono', Menlo, monospace" font-size="12" font-weight="600"
          fill="${PALETTE.lavender.ink}">${k}</text>
    <text x="44" y="12" font-family="'Fraunces', Georgia, serif" font-size="12"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${l}</text>
  </g>`;
      }).join('\n');
      return `${rows}
${kickerLine('§ PRE 1–5', 36, 400, 'lavender')}
${dotScale(56, W / 2 - 20, 438, 5, 'lavender', 9)}
${kickerLine('§ POST 1–5', W / 2 + 10, 400, 'lavender')}
${dotScale(W / 2 + 30, W - 36, 438, 5, 'lavender', 9)}`;
    },
  },

  // ───── Depression / BA ────────────────────────────────────────
  {
    id: 'ba-scheduled',
    title: 'BA · Scheduled',
    desc: 'Standard behavioural-activation sticker (sage). Plan one pleasure-predicted activity today and rate actual pleasure / mastery 0-10 after. Martell BA for depression.',
    size: 'standard', accent: 'sage',
    kicker: '§ BA · SCHEDULED',
    hero: 'one thing, planned',
    subtitle: 'behavioural activation · Martell',
    whisper: 'action first · motivation follows',
    archetype: 'clinic',
    archetypeOpts: { stampLabel: 'DONE', dateText: 'BA · 2026' },
    body: (W) => `
${kickerLine('§ ACTIVITY', 44, 220, 'sage')}
${solidLine(44, 255, W - 44, 1.4)}
${kickerLine('§ WHEN', 44, 300, 'sage')}
${solidLine(100, 305, W - 44, 1.3)}
${kickerLine('§ PLEASURE 0–10', 44, 360, 'sage')}
${dotScale(64, W / 2 - 20, 400, 11, 'sage', 10, 0)}
${kickerLine('§ MASTERY 0–10', 44, 450, 'sage')}
${dotScale(64, W / 2 - 20, 490, 11, 'sage', 10, 0)}
`,
  },

  // ───── Sleep ──────────────────────────────────────────────────
  {
    id: 'sleep-log',
    title: 'Sleep Log',
    desc: 'Compact sleep-quality sticker (lavender). Bedtime + wake time stamps, quality 1-5, awakenings tally. PSQI-lite shape for month-end trend.',
    size: 'compact', accent: 'lavender',
    kicker: '§ SLEEP LOG',
    hero: 'last night',
    subtitle: 'bedtime · wake · quality',
    whisper: 'sleep reports itself · if you listen',
    archetype: 'ledger',
    archetypeOpts: { monogram: 'Z' },
    body: (W) => `
${kickerLine('§ BEDTIME', 36, 220, 'lavender')}
${solidLine(130, 225, W - 36, 1.3)}
${kickerLine('§ WOKE AT', 36, 270, 'lavender')}
${solidLine(130, 275, W - 36, 1.3)}
${kickerLine('§ QUALITY 1–5', 36, 325, 'lavender')}
${dotScale(56, W - 56, 365, 5, 'lavender')}
${kickerLine('§ AWAKENINGS', 36, 420, 'lavender')}
  <g transform="translate(36, 440)">
${tickRow(0, 0, 6, 'lavender', 22)}
  </g>
`,
  },

  {
    id: 'worry-to-bed',
    title: 'Worry · Parked',
    desc: 'Compact CBT-I stimulus-control sticker (lavender). Write the worry that\'s keeping you up, tick "parked until tomorrow". Perlis et al. CBT-I — stimulus control.',
    size: 'compact', accent: 'lavender',
    kicker: '§ WORRY PARKED',
    hero: 'write it · park it',
    subtitle: 'morning-self deals with it',
    whisper: 'the bed is for sleep · not deliberation',
    archetype: 'herbarium',
    body: (W) => `
${kickerLine('§ THE WORRY', 36, 230, 'lavender')}
${solidLine(36, 265, W - 36, 1.4)}
${dottedLine(36, 300, W - 36)}
${dottedLine(36, 335, W - 36)}
  <g transform="translate(${W / 2 - 80}, 400)">
    <rect x="0" y="0" width="20" height="20" rx="3" ry="3"
          fill="rgba(249,245,236,0.55)"
          stroke="${PALETTE.lavender.ink}" stroke-width="1.5"/>
    <text x="30" y="15"
          font-family="'Fraunces', Georgia, serif" font-size="14" font-style="italic"
          fill="${PALETTE.ink}"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">parked until tomorrow</text>
  </g>
`,
  },

  // ───── Self-compassion + savouring ────────────────────────────
  {
    id: 'self-kindness-break',
    title: 'Self-Kindness Break',
    desc: 'Compact Neff self-compassion sticker (sage). Hand-on-heart, write one sentence you\'d say to a friend in this same situation.',
    size: 'compact', accent: 'sage',
    kicker: '§ SELF-KINDNESS',
    hero: 'hand on heart',
    subtitle: 'say it to yourself · friend-voice',
    whisper: 'you would never talk this way to a friend',
    archetype: 'herbarium',
    body: (W) => `
  <g transform="translate(${W / 2}, 240)">
    <path d="M0,-18 C-8,-28 -26,-22 -26,-6 C-26,8 0,24 0,24 C0,24 26,8 26,-6 C26,-22 8,-28 0,-18 Z"
          fill="none" stroke="${PALETTE.sage.ink}" stroke-width="1.6"
          stroke-opacity="0.6"/>
  </g>
${kickerLine('§ WHAT YOU\'D SAY TO A FRIEND', 36, 330, 'sage')}
${solidLine(36, 365, W - 36, 1.4)}
${dottedLine(36, 405, W - 36)}
${dottedLine(36, 445, W - 36)}
`,
  },

  {
    id: 'savor-in-moment',
    title: 'Savor · In Moment',
    desc: 'Compact savouring sticker (amber). Tick which sense captured the moment (sight / sound / taste / touch / smell) and write one detail ≤10 words. Bryant &amp; Veroff absorption savouring.',
    size: 'compact', accent: 'amber',
    kicker: '§ SAVOR',
    hero: 'this, right now',
    subtitle: 'what the body remembers',
    whisper: 'naming the sense anchors the moment',
    archetype: 'herbarium',
    body: (W) => {
      const senses = ['sight', 'sound', 'taste', 'touch', 'smell'];
      const cells = senses.map((s, i) => {
        const x = 36 + i * ((W - 72) / 5);
        return `  <g transform="translate(${x}, 230)">
    <rect x="0" y="0" width="50" height="50" rx="6" ry="6"
          fill="rgba(249,245,236,0.55)" stroke="${PALETTE.amber.edge}" stroke-width="1.3"/>
    <text x="25" y="30" text-anchor="middle"
          font-family="'Fraunces', Georgia, serif" font-size="12"
          fill="${PALETTE.amber.ink}" fill-opacity="0.75"
          style="font-variation-settings: 'opsz' 14, 'SOFT' 60;">${s}</text>
  </g>`;
      }).join('\n');
      return `${cells}
${kickerLine('§ THE DETAIL', 36, 330, 'amber')}
${solidLine(36, 365, W - 36, 1.4)}
${dottedLine(36, 410, W - 36)}`;
    },
  },
];

// ─── Build all ──────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\nBuilding Wave-1 (${WAVE1.length} stickers)…\n`);
  for (const s of WAVE1) {
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
  console.log(`\n✓ All ${WAVE1.length} Wave-1 stickers built.`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
