/**
 * migrate-packs-w5 — W5 pack migration driver.
 *
 * ONE-SHOT SCRIPT · HISTORICAL ARTEFACT.
 *
 * This ran exactly once (2026-04-30, commit `dcf13a7`) to land the
 * big-bang pack migration from `packs/<category>/<id>/` to flat
 * `packages/packs-<id>/`. It is preserved for audit trail and as a
 * reference for how the 22 packs were seeded (descriptions, tags,
 * category mapping, MDX stubs).
 *
 * **Safe to delete after W6 lands** once we're confident no follow-up
 * migrations want to read from the seed table below. Until then it
 * sits here inert — the idempotent guards (directory-exists / file-
 * exists checks) mean re-running it on a clean tree is a no-op.
 *
 * Runs exactly once. Idempotent: if a pack is already at its new
 * location, we skip it. If a manifest already exists, we leave it
 * alone. If a gallery MDX already exists, we do not overwrite it.
 *
 * Usage:
 *   tsx scripts/migrate-packs-w5.ts          # dry-run (prints plan)
 *   tsx scripts/migrate-packs-w5.ts --apply  # actually move + write
 */

import { access, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..');
const OLD_ROOT = path.join(REPO, 'packs');
const NEW_ROOT = path.join(REPO, 'packages');
const MDX_DIR = path.join(REPO, 'apps/gallery/src/content/packs');

const APPLY = process.argv.includes('--apply');

// ── Registry schema alignment ────────────────────────────────────────
// Singular forms per packages/core/src/types/registry.ts PACK_CATEGORIES
// (schema is immutable without a schema_version bump). Repo folders are
// plural; this table translates.
const CATEGORY: Record<string, 'journal' | 'notes' | 'planner' | 'tracker' | 'worksheet' | 'cover'> = {
  journals: 'journal',
  notes: 'notes',
  planners: 'planner',
  trackers: 'tracker',
  worksheets: 'worksheet',
  covers: 'cover',
};

// ── Per-pack metadata ────────────────────────────────────────────────
// Descriptions (<=140 chars) hand-written from the existing READMEs so
// we ship meaningful copy instead of fabricated filler. Tags are
// lowercase kebab, <=8 per pack.

type Seed = {
  id: string;
  name: string; // <=60 chars, display title
  description: string; // <=140 chars
  category: keyof typeof CATEGORY | 'covers';
  entry: string; // relative to the NEW package dir
  tags: string[];
  version: string;
  author: string;
};

const SEEDS: Seed[] = [
  // ── journals ─────────────────────────────────────────────────────
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    description: 'A five-line gratitude rhythm for daily practice — small prompts, plenty of writing space.',
    category: 'journals',
    entry: 'gratitude-journal.html',
    tags: ['journal', 'gratitude', 'daily'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'morning-pages',
    name: 'Morning Pages',
    description: "Julia Cameron's three-page longhand rhythm. One ruled A4 sheet sized to carry the discipline.",
    category: 'journals',
    entry: 'morning-pages.html',
    tags: ['journal', 'morning-pages', 'stream-of-consciousness'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'prax-journal',
    name: 'Praxis Ledger',
    description: 'A 130-page bound journal that prints like an edition and plans like a system. Themeable.',
    category: 'journals',
    entry: 'versions/v5/today.html',
    tags: ['journal', 'planner', 'flagship', 'themeable'],
    version: '5.3.0',
    author: 'prax',
  },
  {
    id: 'prompted-journal',
    name: 'Prompted Journal',
    description: 'Dated pages with rotating prompts across the week — writing you can show up to without deciding first.',
    category: 'journals',
    entry: 'prompted-journal.html',
    tags: ['journal', 'prompts', 'daily'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'reflection-journal',
    name: 'Reflection Journal',
    description: 'End-of-day reflection layout with space for wins, what shifted, and a one-line summary.',
    category: 'journals',
    entry: 'reflection-journal.html',
    tags: ['journal', 'reflection', 'daily'],
    version: '0.1.0',
    author: 'prax',
  },
  // ── notes ────────────────────────────────────────────────────────
  {
    id: 'cornell-notes',
    name: 'Cornell Notes',
    description: 'The canonical Cornell layout — cue column, notes pane, summary zone. Rule-honest, no flourish.',
    category: 'notes',
    entry: 'cornell-notes.html',
    tags: ['notes', 'cornell', 'lecture'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Attendees / agenda / decisions / actions in fixed zones. Prints on one A4 page per meeting.',
    category: 'notes',
    entry: 'meeting-notes.html',
    tags: ['notes', 'meeting', 'work'],
    version: '0.1.0',
    author: 'prax',
  },
  // ── planners ─────────────────────────────────────────────────────
  {
    id: 'monthly-planner',
    name: 'Monthly Planner',
    description: 'Full-month grid with a notes column. Standalone or as the monthly review inside a bigger planner.',
    category: 'planners',
    entry: 'monthly-planner.html',
    tags: ['planner', 'monthly'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'weekly-planner',
    name: 'Weekly Planner',
    description: 'Mon-start weekly spread with intention + review. Enough structure to be useful, no more.',
    category: 'planners',
    entry: 'weekly-planner.html',
    tags: ['planner', 'weekly'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'yearly-overview',
    name: 'Yearly Overview',
    description: 'Twelve-month on one page. Year-at-a-glance for dating spreads, goals, and anchors.',
    category: 'planners',
    entry: 'yearly-overview.html',
    tags: ['planner', 'yearly'],
    version: '0.1.0',
    author: 'prax',
  },
  // ── trackers ─────────────────────────────────────────────────────
  {
    id: 'budget-tracker',
    name: 'Budget Tracker',
    description: 'Monthly income / expense / savings ledger with category totals. Pencil-friendly, no app required.',
    category: 'trackers',
    entry: 'budget-tracker.html',
    tags: ['tracker', 'budget', 'money'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'fitness-log',
    name: 'Fitness Log',
    description: 'Sets, reps, weights, cardio — a no-nonsense workout log that survives contact with real training.',
    category: 'trackers',
    entry: 'fitness-log.html',
    tags: ['tracker', 'fitness', 'training'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Monthly habit grid — one row per habit, one column per day, filled dots for completion.',
    category: 'trackers',
    entry: 'habit-tracker.html',
    tags: ['tracker', 'habits'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'mood-tracker',
    name: 'Mood Tracker',
    description: 'Monthly mood dot grid with a legend strip. Useful data without demanding journaling.',
    category: 'trackers',
    entry: 'mood-tracker.html',
    tags: ['tracker', 'mood', 'wellbeing'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'reading-log',
    name: 'Reading Log',
    description: 'Title / author / started / finished / rating / note. One line per book, one year per sheet.',
    category: 'trackers',
    entry: 'reading-log.html',
    tags: ['tracker', 'reading', 'books'],
    version: '0.1.0',
    author: 'prax',
  },
  // ── worksheets ───────────────────────────────────────────────────
  {
    id: 'eat-the-frog',
    name: 'Eat the Frog',
    description: "Brian Tracy's Eat That Frog! — one big frog box, three secondary task boxes, a reflection line.",
    category: 'worksheets',
    entry: 'eat-the-frog.html',
    tags: ['worksheet', 'productivity', 'priorities'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'eisenhower-matrix',
    name: 'Eisenhower Matrix',
    description: 'Urgent / important quadrant grid with room to write tasks, not just categorise them.',
    category: 'worksheets',
    entry: 'eisenhower-matrix.html',
    tags: ['worksheet', 'productivity', 'matrix'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'goal-setting',
    name: 'Goal Setting',
    description: 'One-page SMART goal layout with milestone ladder and a review prompt. Start once, finish once.',
    category: 'worksheets',
    entry: 'goal-setting.html',
    tags: ['worksheet', 'goals', 'planning'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'meal-planning',
    name: 'Meal Planning',
    description: 'Weekly meal grid + shopping list column on one A4. Plan Monday, shop once, cook calmly.',
    category: 'worksheets',
    entry: 'meal-planning.html',
    tags: ['worksheet', 'meals', 'planning'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'project-planning',
    name: 'Project Planning',
    description: 'Scope / risks / milestones / next-actions in fixed blocks. Project on one page.',
    category: 'worksheets',
    entry: 'project-planning.html',
    tags: ['worksheet', 'projects', 'planning'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'recipe-card',
    name: 'Recipe Card',
    description: 'A5-sized recipe card with ingredients, method, notes. Print, write, cook, stain, keep.',
    category: 'worksheets',
    entry: 'recipe-card.html',
    tags: ['worksheet', 'cooking', 'recipes'],
    version: '0.1.0',
    author: 'prax',
  },
  {
    id: 'travel-planner',
    name: 'Travel Planner',
    description: 'Trip-in-a-page: dates / route / stays / packing / budget. Fold it, tuck it, travel with it.',
    category: 'worksheets',
    entry: 'travel-planner.html',
    tags: ['worksheet', 'travel', 'planning'],
    version: '0.1.0',
    author: 'prax',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

function oldDir(s: Seed): string {
  return path.join(OLD_ROOT, s.category, s.id);
}
function newDir(s: Seed): string {
  return path.join(NEW_ROOT, `packs-${s.id}`);
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function gitMv(from: string, to: string): void {
  execFileSync('git', ['mv', from, to], { stdio: 'inherit' });
}

// ── Plan + execute ───────────────────────────────────────────────────

type Action =
  | { kind: 'move'; from: string; to: string }
  | { kind: 'manifest'; file: string }
  | { kind: 'mdx'; file: string };

async function plan(): Promise<Action[]> {
  const actions: Action[] = [];
  for (const seed of SEEDS) {
    const from = oldDir(seed);
    const to = newDir(seed);
    if ((await exists(from)) && !(await exists(to))) {
      actions.push({ kind: 'move', from, to });
    }
    actions.push({ kind: 'manifest', file: path.join(to, 'manifest.json') });
    actions.push({ kind: 'mdx', file: path.join(MDX_DIR, `${seed.id}.mdx`) });
  }
  return actions;
}

function manifestJson(s: Seed): string {
  const m = {
    schema_version: 1 as const,
    id: s.id,
    version: s.version,
    name: s.name,
    description: s.description,
    category: CATEGORY[s.category as keyof typeof CATEGORY],
    author: s.author,
    entry: s.entry,
    tags: s.tags,
    license: 'MIT',
    repository: 'https://github.com/praxstack/pretext-templates',
  };
  // Sorted keys for byte-stability, trailing newline for POSIX.
  const keys = Object.keys(m).sort() as (keyof typeof m)[];
  const sorted: Record<string, unknown> = {};
  for (const k of keys) sorted[k] = m[k];
  return JSON.stringify(sorted, null, 2) + '\n';
}

function mdxStub(s: Seed): string {
  const accent =
    s.category === 'journals'
      ? s.id === 'prax-journal'
        ? 'sage'
        : 'clay'
      : s.category === 'notes'
        ? 'ink'
        : s.category === 'planners'
          ? 'sage'
          : s.category === 'trackers'
            ? 'amber'
            : 'ink';
  const status = s.id === 'prax-journal' ? 'stable' : 'stub';
  const hero = s.id === 'prax-journal' ? '\nheroImage: /specimens/prax-journal.png' : '';
  return `---
id: ${s.id}
title: ${s.name}
category: ${CATEGORY[s.category as keyof typeof CATEGORY]}
oneLiner: ${JSON.stringify(s.description)}
version: ${s.version}${hero}
accent: ${accent}
status: ${status}
bylineYear: 2026
---

${s.description}

> Manifest-seeded stub — the full MDX lands in W6 when pack documentation is curated per pack.
`;
}

async function apply(actions: Action[]): Promise<void> {
  for (const a of actions) {
    if (a.kind === 'move') {
      await mkdir(path.dirname(a.to), { recursive: true });
      gitMv(a.from, a.to);
    }
    if (a.kind === 'manifest') {
      const dir = path.dirname(a.file);
      if (!(await exists(dir))) continue; // nothing migrated here; skip
      if (await exists(a.file)) continue;
      const seed = SEEDS.find((s) => newDir(s) === dir);
      if (!seed) continue;
      await writeFile(a.file, manifestJson(seed), 'utf8');
    }
    if (a.kind === 'mdx') {
      if (await exists(a.file)) continue;
      const id = path.basename(a.file, '.mdx');
      const seed = SEEDS.find((s) => s.id === id);
      if (!seed) continue;
      await mkdir(path.dirname(a.file), { recursive: true });
      await writeFile(a.file, mdxStub(seed), 'utf8');
    }
  }
}

async function main(): Promise<void> {
  const actions = await plan();
  console.log(`[migrate-packs-w5] planned actions (${actions.length}):`);
  for (const a of actions) {
    if (a.kind === 'move') console.log(`  mv    ${path.relative(REPO, a.from)} → ${path.relative(REPO, a.to)}`);
    if (a.kind === 'manifest') console.log(`  write ${path.relative(REPO, a.file)}`);
    if (a.kind === 'mdx') console.log(`  write ${path.relative(REPO, a.file)}`);
  }
  if (!APPLY) {
    console.log('\n[migrate-packs-w5] dry-run complete. re-run with --apply to execute.');
    return;
  }
  await apply(actions);
  console.log('\n[migrate-packs-w5] applied.');
}

// Sanity: every seed's description must fit the 140-char schema limit
// so we never ship an invalid manifest.
for (const s of SEEDS) {
  if (s.description.length > 140) {
    throw new Error(
      `seed ${s.id}: description is ${s.description.length} chars (max 140)`,
    );
  }
  if (s.name.length > 60) {
    throw new Error(`seed ${s.id}: name is ${s.name.length} chars (max 60)`);
  }
}

await main();
