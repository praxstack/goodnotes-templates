/**
 * Template Registry — defines all available HTML templates
 * and their metadata for the generation pipeline.
 *
 * Each entry maps to an HTML file in src/templates/html/
 * that gets rendered via Puppeteer (self-contained CSS, no theme injection).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_DIR = path.join(__dirname, 'html');

export interface TemplateEntry {
  /** Unique template ID (matches filename without .html) */
  id: string;
  /** Display name */
  name: string;
  /** Category for organization */
  category: 'planner' | 'journal' | 'tracker' | 'notes' | 'worksheet';
  /** Brief description */
  description: string;
  /** Path to HTML file */
  htmlPath: string;
  /** Whether this is a multi-page template */
  multiPage: boolean;
  /** Number of pages (for multi-page templates) */
  pageCount: number;
}

/**
 * All registered templates. Order matters for output organization.
 */
export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  // ─── ADHD Gentle Planner (CBT-informed) ────────────────────
  {
    id: 'adhd-gentle-daily',
    name: 'ADHD Gentle Daily',
    category: 'planner',
    description: 'CBT-informed daily page for ADHD + depression + anxiety — 1 page, 5 min',
    htmlPath: path.join(HTML_DIR, 'adhd-gentle-daily.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-gentle-weekly',
    name: 'ADHD Gentle Weekly',
    category: 'planner',
    description: 'Weekly review with mood map, win counter, self-compassion check',
    htmlPath: path.join(HTML_DIR, 'adhd-gentle-weekly.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-gentle-monthly',
    name: 'ADHD Gentle Monthly',
    category: 'planner',
    description: 'Monthly celebration — stats, mood trend, biggest win, one focus',
    htmlPath: path.join(HTML_DIR, 'adhd-gentle-monthly.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── ADHD v2 Planner (expanded 4-page set) ─────────────────
  {
    id: 'adhd-v2-today',
    name: 'ADHD v2 Today',
    category: 'planner' as const,
    description: 'Productivity page — Frog, Rule of 3, Focus, Pomodoro, Brain Dump',
    htmlPath: path.join(HTML_DIR, 'adhd-v2-today.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v2-reflect',
    name: 'ADHD v2 Reflect',
    category: 'planner' as const,
    description: 'Feelings page — CBT thought check, self-care, gratitude, free write',
    htmlPath: path.join(HTML_DIR, 'adhd-v2-reflect.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v2-weekly',
    name: 'ADHD v2 Weekly',
    category: 'planner' as const,
    description: 'Weekly review — mood map, win counter, patterns, self-compassion',
    htmlPath: path.join(HTML_DIR, 'adhd-v2-weekly.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'adhd-v2-monthly',
    name: 'ADHD v2 Monthly',
    category: 'planner' as const,
    description: 'Monthly review — stats, mood trend, biggest win, one focus',
    htmlPath: path.join(HTML_DIR, 'adhd-v2-monthly.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Planners ──────────────────────────────────────────────
  {
    id: 'eat-the-frog',
    name: 'Eat the Frog',
    category: 'planner',
    description: 'Brian Tracy productivity method — do the hardest thing first',
    htmlPath: path.join(HTML_DIR, 'eat-the-frog.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'weekly-planner',
    name: 'Weekly Planner',
    category: 'planner',
    description: '7-day week view with goals and priorities',
    htmlPath: path.join(HTML_DIR, 'weekly-planner.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'monthly-planner',
    name: 'Monthly Planner',
    category: 'planner',
    description: 'Calendar grid with monthly goals and notes',
    htmlPath: path.join(HTML_DIR, 'monthly-planner.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'yearly-overview',
    name: 'Yearly Overview',
    category: 'planner',
    description: '12-month mini calendar grid with annual goals',
    htmlPath: path.join(HTML_DIR, 'yearly-overview.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'eisenhower-matrix',
    name: 'Eisenhower Matrix',
    category: 'planner',
    description: 'Urgent vs. Important 4-quadrant priority grid',
    htmlPath: path.join(HTML_DIR, 'eisenhower-matrix.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'meal-planning',
    name: 'Meal Planner',
    category: 'planner',
    description: 'Weekly meal grid with grocery list',
    htmlPath: path.join(HTML_DIR, 'meal-planning.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'project-planning',
    name: 'Project Planner',
    category: 'planner',
    description: 'Milestones, tasks, risks, and progress tracking',
    htmlPath: path.join(HTML_DIR, 'project-planning.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'travel-planner',
    name: 'Travel Planner',
    category: 'planner',
    description: 'Itinerary, packing list, reservations, and budget',
    htmlPath: path.join(HTML_DIR, 'travel-planner.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Journals ──────────────────────────────────────────────
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    category: 'journal',
    description: 'Daily gratitude with affirmation and evening reflection',
    htmlPath: path.join(HTML_DIR, 'gratitude-journal.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'morning-pages',
    name: 'Morning Pages',
    category: 'journal',
    description: '3-page stream-of-consciousness freewriting (Julia Cameron)',
    htmlPath: path.join(HTML_DIR, 'morning-pages.html'),
    multiPage: true,
    pageCount: 3,
  },
  {
    id: 'reflection-journal',
    name: 'Reflection Journal',
    category: 'journal',
    description: 'End-of-day wins, challenges, learnings, and intentions',
    htmlPath: path.join(HTML_DIR, 'reflection-journal.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'prompted-journal',
    name: 'Prompted Journal',
    category: 'journal',
    description: 'Self-discovery prompts with response space and insights',
    htmlPath: path.join(HTML_DIR, 'prompted-journal.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Trackers ──────────────────────────────────────────────
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    category: 'tracker',
    description: 'Monthly 31-day grid for 15 habits with streaks',
    htmlPath: path.join(HTML_DIR, 'habit-tracker.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'mood-tracker',
    name: 'Mood Tracker',
    category: 'tracker',
    description: 'Monthly calendar with 5-level mood circles',
    htmlPath: path.join(HTML_DIR, 'mood-tracker.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'budget-tracker',
    name: 'Budget Tracker',
    category: 'tracker',
    description: 'Income, expenses, savings with net calculations',
    htmlPath: path.join(HTML_DIR, 'budget-tracker.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'fitness-log',
    name: 'Fitness Log',
    category: 'tracker',
    description: 'Exercises, cardio, body stats, and energy tracking',
    htmlPath: path.join(HTML_DIR, 'fitness-log.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'reading-log',
    name: 'Reading Log',
    category: 'tracker',
    description: 'Book tracking with ratings and reading stats',
    htmlPath: path.join(HTML_DIR, 'reading-log.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Notes ─────────────────────────────────────────────────
  {
    id: 'cornell-notes',
    name: 'Cornell Notes',
    category: 'notes',
    description: 'Classic Cornell Method — cue column, notes, summary',
    htmlPath: path.join(HTML_DIR, 'cornell-notes.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    category: 'notes',
    description: 'Attendees, agenda, notes, actions, and decisions',
    htmlPath: path.join(HTML_DIR, 'meeting-notes.html'),
    multiPage: false,
    pageCount: 1,
  },

  // ─── Worksheets ────────────────────────────────────────────
  {
    id: 'goal-setting',
    name: 'Goal Setting',
    category: 'worksheet',
    description: 'SMART goals with milestones and obstacle planning',
    htmlPath: path.join(HTML_DIR, 'goal-setting.html'),
    multiPage: false,
    pageCount: 1,
  },
  {
    id: 'recipe-card',
    name: 'Recipe Card',
    category: 'worksheet',
    description: 'Ingredients, directions, notes, and rating',
    htmlPath: path.join(HTML_DIR, 'recipe-card.html'),
    multiPage: false,
    pageCount: 1,
  },
];

/**
 * Get a template by ID.
 */
export function getTemplate(id: string): TemplateEntry | undefined {
  return TEMPLATE_REGISTRY.find(t => t.id === id);
}

/**
 * Get all templates in a category.
 */
export function getTemplatesByCategory(category: TemplateEntry['category']): TemplateEntry[] {
  return TEMPLATE_REGISTRY.filter(t => t.category === category);
}

/**
 * Get all template IDs.
 */
export function getTemplateIds(): string[] {
  return TEMPLATE_REGISTRY.map(t => t.id);
}
