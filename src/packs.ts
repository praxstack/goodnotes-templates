/**
 * Pack Registry — defines all shippable templates that live under `packs/`.
 *
 * Each entry maps to an HTML file inside a `packs/<category>/<name>/` directory.
 * See `packs/README.md` for the convention. This registry is the integration
 * point between pack-side HTML and renderer-side code (Puppeteer, PDF
 * post-processing, visual-regression tests).
 *
 * This file moved from `src/templates/registry.ts` → `src/packs.ts` during
 * the v3 restructure (2026-04-28, commit C7). All template moves are recorded
 * in `docs/plan-ceo-review-v3-refined.md`.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PACKS_DIR = path.join(REPO_ROOT, 'packs');

export type PackCategory =
  | 'journal'
  | 'planner'
  | 'tracker'
  | 'notes'
  | 'worksheet';

export interface TemplateEntry {
  /** Unique template ID (stable across renames — used by tests + CLI). */
  id: string;
  /** Display name. */
  name: string;
  /** Category for organization. */
  category: PackCategory;
  /** Brief description. */
  description: string;
  /** Absolute path to the HTML file under packs/. */
  htmlPath: string;
  /** Whether this is a multi-page template. */
  multiPage: boolean;
  /** Number of pages (for multi-page templates). */
  pageCount: number;
}

/**
 * Helper: build an htmlPath for a pack. Keeps the registry lines short +
 * grep-able ("what pack is this template in?" → see the tuple).
 */
function pack(
  category: 'journals' | 'planners' | 'trackers' | 'notes' | 'worksheets',
  name: string,
  file = `${name}.html`,
): string {
  return path.join(PACKS_DIR, category, name, file);
}

function journal(version: string, file: string): string {
  return path.join(PACKS_DIR, 'journals', 'prax-journal', 'versions', version, file);
}

/**
 * All registered templates. Order drives chooser display + any "render
 * everything" scripts. Group by category.
 */
export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  // ─── Prax Journal v1 · "adhd-gentle" ──────────────────────────────
  {
    id: 'adhd-gentle-daily',
    name: 'ADHD Gentle Daily',
    category: 'journal',
    description: 'CBT-informed daily page for ADHD + depression + anxiety — 1 page, 5 min',
    htmlPath: journal('v1', 'daily.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-gentle-weekly',
    name: 'ADHD Gentle Weekly',
    category: 'journal',
    description: 'Weekly review with mood map, win counter, self-compassion check',
    htmlPath: journal('v1', 'weekly.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-gentle-monthly',
    name: 'ADHD Gentle Monthly',
    category: 'journal',
    description: 'Monthly celebration — stats, mood trend, biggest win, one focus',
    htmlPath: journal('v1', 'monthly.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Prax Journal v2 · 4-page expansion ───────────────────────────
  {
    id: 'adhd-v2-today',
    name: 'ADHD v2 Today',
    category: 'journal',
    description: 'Productivity page — Frog, Rule of 3, Focus, Pomodoro, Brain Dump',
    htmlPath: journal('v2', 'today.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v2-reflect',
    name: 'ADHD v2 Reflect',
    category: 'journal',
    description: 'Feelings page — CBT thought check, self-care, gratitude, free write',
    htmlPath: journal('v2', 'reflect.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v2-weekly',
    name: 'ADHD v2 Weekly',
    category: 'journal',
    description: 'Weekly review — mood map, win counter, patterns, self-compassion',
    htmlPath: journal('v2', 'weekly.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v2-monthly',
    name: 'ADHD v2 Monthly',
    category: 'journal',
    description: 'Monthly review — stats, mood trend, biggest win, one focus',
    htmlPath: journal('v2', 'monthly.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Prax Journal v3 · refined v2 with dark variants ──────────────
  {
    id: 'adhd-v3-today',
    name: 'ADHD v3 Today',
    category: 'journal',
    description: 'v3 productivity page with dark.css sidecar',
    htmlPath: journal('v3', 'today.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v3-reflect',
    name: 'ADHD v3 Reflect',
    category: 'journal',
    description: 'v3 feelings page with dark.css sidecar',
    htmlPath: journal('v3', 'reflect.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v3-weekly',
    name: 'ADHD v3 Weekly',
    category: 'journal',
    description: 'v3 weekly review with dark.css sidecar',
    htmlPath: journal('v3', 'weekly.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v3-monthly',
    name: 'ADHD v3 Monthly',
    category: 'journal',
    description: 'v3 monthly review with dark.css sidecar',
    htmlPath: journal('v3', 'monthly.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Prax Journal v4 · Warm Analog Editorial lands ────────────────
  {
    id: 'adhd-v4-today',
    name: 'Prax Journal v4 Today',
    category: 'journal',
    description: 'v4 Warm Analog — morning commit, the one thing, 3 ifs',
    htmlPath: journal('v4', 'today.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v4-reflect',
    name: 'Prax Journal v4 Reflect',
    category: 'journal',
    description: 'v4 Warm Analog — evening triad, Named Patterns, cigs + chest-kg',
    htmlPath: journal('v4', 'reflect.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v4-brain-dump',
    name: 'Prax Journal v4 Brain Dump',
    category: 'journal',
    description: 'v4 Warm Analog — free canvas with sticker watermarks',
    htmlPath: journal('v4', 'brain-dump.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Prax Journal v5 · current (Midday + Rx card + Jar matrix) ────
  {
    id: 'adhd-v5-today',
    name: 'Prax Journal v5 Today',
    category: 'journal',
    description: 'v5 — morning commit + <REDACTED-PSYCH-FIRST> 2-second pause matrix',
    htmlPath: journal('v5', 'today.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v5-midday',
    name: 'Prax Journal v5 Midday',
    category: 'journal',
    description: 'v5 — 2 pm re-anchor with body scan + jar visualization',
    htmlPath: journal('v5', 'midday.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v5-reflect',
    name: 'Prax Journal v5 Reflect',
    category: 'journal',
    description: 'v5 — evening process + cigs /year projection + Rx card',
    htmlPath: journal('v5', 'reflect.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v5-brain-dump',
    name: 'Prax Journal v5 Brain Dump',
    category: 'journal',
    description: 'v5 — free canvas with 12-sticker watermark hints',
    htmlPath: journal('v5', 'brain-dump.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'prax-journal-design-system',
    name: 'Prax Journal Design System',
    category: 'journal',
    description: 'Live reference page: every token, block archetype, writing-zone variant',
    htmlPath: path.join(PACKS_DIR, 'journals', 'prax-journal', 'design-system.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Standalone journaling sheets ─────────────────────────────────
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    category: 'journal',
    description: 'Daily gratitude with affirmation and evening reflection',
    htmlPath: pack('journals', 'gratitude-journal'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'morning-pages',
    name: 'Morning Pages',
    category: 'journal',
    description: '3-page stream-of-consciousness freewriting (Julia Cameron)',
    htmlPath: pack('journals', 'morning-pages'),
    multiPage: true,
    pageCount: 3,
  },
  {
    id: 'reflection-journal',
    name: 'Reflection Journal',
    category: 'journal',
    description: 'End-of-day wins, challenges, learnings, and intentions',
    htmlPath: pack('journals', 'reflection-journal'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'prompted-journal',
    name: 'Prompted Journal',
    category: 'journal',
    description: 'Self-discovery prompts with response space and insights',
    htmlPath: pack('journals', 'prompted-journal'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Planners ─────────────────────────────────────────────────────
  {
    id: 'weekly-planner',
    name: 'Weekly Planner',
    category: 'planner',
    description: '7-day week view with goals and priorities',
    htmlPath: pack('planners', 'weekly-planner'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'monthly-planner',
    name: 'Monthly Planner',
    category: 'planner',
    description: 'Calendar grid with monthly goals and notes',
    htmlPath: pack('planners', 'monthly-planner'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'yearly-overview',
    name: 'Yearly Overview',
    category: 'planner',
    description: '12-month mini calendar grid with annual goals',
    htmlPath: pack('planners', 'yearly-overview'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Trackers ─────────────────────────────────────────────────────
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    category: 'tracker',
    description: 'Monthly 31-day grid for 15 habits with streaks',
    htmlPath: pack('trackers', 'habit-tracker'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'mood-tracker',
    name: 'Mood Tracker',
    category: 'tracker',
    description: 'Monthly calendar with 5-level mood circles',
    htmlPath: pack('trackers', 'mood-tracker'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'budget-tracker',
    name: 'Budget Tracker',
    category: 'tracker',
    description: 'Income, expenses, savings with net calculations',
    htmlPath: pack('trackers', 'budget-tracker'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'fitness-log',
    name: 'Fitness Log',
    category: 'tracker',
    description: 'Exercises, cardio, body stats, and energy tracking',
    htmlPath: pack('trackers', 'fitness-log'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'reading-log',
    name: 'Reading Log',
    category: 'tracker',
    description: 'Book tracking with ratings and reading stats',
    htmlPath: pack('trackers', 'reading-log'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Notes ────────────────────────────────────────────────────────
  {
    id: 'cornell-notes',
    name: 'Cornell Notes',
    category: 'notes',
    description: 'Classic Cornell Method — cue column, notes, summary',
    htmlPath: pack('notes', 'cornell-notes'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    category: 'notes',
    description: 'Attendees, agenda, notes, actions, and decisions',
    htmlPath: pack('notes', 'meeting-notes'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Worksheets ───────────────────────────────────────────────────
  {
    id: 'eat-the-frog',
    name: 'Eat the Frog',
    category: 'worksheet',
    description: 'Brian Tracy productivity method — do the hardest thing first',
    htmlPath: pack('worksheets', 'eat-the-frog'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'eisenhower-matrix',
    name: 'Eisenhower Matrix',
    category: 'worksheet',
    description: 'Urgent vs. Important 4-quadrant priority grid',
    htmlPath: pack('worksheets', 'eisenhower-matrix'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'meal-planning',
    name: 'Meal Planner',
    category: 'worksheet',
    description: 'Weekly meal grid with grocery list',
    htmlPath: pack('worksheets', 'meal-planning'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'project-planning',
    name: 'Project Planner',
    category: 'worksheet',
    description: 'Milestones, tasks, risks, and progress tracking',
    htmlPath: pack('worksheets', 'project-planning'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'travel-planner',
    name: 'Travel Planner',
    category: 'worksheet',
    description: 'Itinerary, packing list, reservations, and budget',
    htmlPath: pack('worksheets', 'travel-planner'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'goal-setting',
    name: 'Goal Setting',
    category: 'worksheet',
    description: 'SMART goals with milestones and obstacle planning',
    htmlPath: pack('worksheets', 'goal-setting'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'recipe-card',
    name: 'Recipe Card',
    category: 'worksheet',
    description: 'Ingredients, directions, notes, and rating',
    htmlPath: pack('worksheets', 'recipe-card'),
    multiPage: false,
    pageCount: 1,
  },
];

/**
 * Get a template by ID.
 */
export function getTemplate(id: string): TemplateEntry | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}

/**
 * Get all templates in a category.
 */
export function getTemplatesByCategory(category: PackCategory): TemplateEntry[] {
  return TEMPLATE_REGISTRY.filter((t) => t.category === category);
}

/**
 * Get all template IDs.
 */
export function getTemplateIds(): string[] {
  return TEMPLATE_REGISTRY.map((t) => t.id);
}
