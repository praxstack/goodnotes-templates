/**
 * Parameterised generator for the Habit Tracker pack (CEO v5 · E1).
 *
 * Contract:
 *   - Reads `habit-tracker.html` (the self-contained, hand-tuned template)
 *   - Fills the Month/Year date-field spans based on --year + --month
 *   - Fills the empty `<span class="habit-name-line">` spans with the
 *     user's --habits labels (up to 15; the template supports 15 rows,
 *     but the documented contract allows 12 — extras beyond N get blank)
 *   - Returns the patched HTML + metadata + a filename hint
 *
 * Explicitly preserves FIND-0010 (self-contained templates) — we don't
 * move any CSS or add server-side template engines; just swap content
 * inside the existing DOM.
 *
 * Shape matches `GeneratorFn` in `@praxlannister/pretext-core/generator`.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  GeneratorFn,
  GeneratorInput,
  GeneratorOutput,
} from '@praxlannister/pretext-core/generator';

// Resolve the HTML template path relative to this file. Works both as
// tsx source and compiled JS (build would land it alongside .ts via tsc,
// but this pack is typically consumed in-source via the CLI's dynamic
// import). `import.meta.url` keeps us ESM-clean.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(HERE, 'habit-tracker.html');

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function monthName(month: number, locale: string): string {
  // Locale support starts en-US; other locales degrade gracefully.
  // Phase 1 ships en only; i18n is gated on Phase 2 Accept-Language signal.
  if (locale.startsWith('en') || locale === undefined) {
    return MONTH_NAMES_EN[month - 1];
  }
  // Intl fallback so we at least get a plausible label for non-EN.
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long' }).format(
      new Date(2000, month - 1, 1),
    );
  } catch {
    return MONTH_NAMES_EN[month - 1];
  }
}

/**
 * Replace the contents of the empty date-field spans with month + year.
 *
 * The template's DOM order (verified by grep at line 607-612) is:
 *   <span class="date-label">Month</span>
 *   <span class="date-field"></span>
 *   <span class="date-label">Year</span>
 *   <span class="date-field narrow"></span>
 *
 * We patch the first non-narrow .date-field after "Month" with the month
 * name, and the first .date-field.narrow after "Year" with the year.
 * Regex is anchored on the label to survive future CSS/class reshuffles.
 */
function fillDateFields(html: string, month: number | undefined, year: number | undefined, locale: string): string {
  let out = html;
  if (month !== undefined) {
    out = out.replace(
      /<span class="date-label">Month<\/span>\s*<span class="date-field"><\/span>/,
      `<span class="date-label">Month</span><span class="date-field">${monthName(month, locale)}</span>`,
    );
  }
  if (year !== undefined) {
    out = out.replace(
      /<span class="date-label">Year<\/span>\s*<span class="date-field narrow"><\/span>/,
      `<span class="date-label">Year</span><span class="date-field narrow">${year}</span>`,
    );
  }
  return out;
}

/**
 * Fill up to N `<span class="habit-name-line">` slots with user labels.
 * Preserves extra empty slots (so users who pass 3 habits still get a
 * usable grid with room to add more on paper).
 */
function fillHabitLabels(html: string, habits: readonly string[] | undefined): string {
  if (!habits || habits.length === 0) return html;
  let idx = 0;
  return html.replace(
    /<span class="habit-name-line"><\/span>/g,
    () => {
      if (idx < habits.length) {
        const label = habits[idx++];
        // Escape HTML-sensitive chars in user input.
        const safe = label
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<span class="habit-name-line">${safe}</span>`;
      }
      return '<span class="habit-name-line"></span>';
    },
  );
}

const generate: GeneratorFn = async (input: GeneratorInput): Promise<GeneratorOutput> => {
  const locale = input.locale ?? 'en-US';
  const year = input.year;
  const month = input.month;

  // Sanity: at least one of year/month/habits should be provided, otherwise
  // the user is just asking for the static template — which we still serve,
  // but we nudge via the suggestedFilename.
  const raw = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  let html = fillDateFields(raw, month, year, locale);
  html = fillHabitLabels(html, input.habits);

  // Build a filename that reflects what was parameterised.
  const parts: string[] = ['habit-tracker'];
  if (year !== undefined) parts.push(String(year));
  if (month !== undefined) parts.push(String(month).padStart(2, '0'));
  const suggestedFilename = parts.join('-');

  const title = [
    'Habit Tracker',
    month !== undefined ? monthName(month, locale) : null,
    year !== undefined ? String(year) : null,
  ].filter(Boolean).join(' · ');

  return {
    html,
    suggestedFilename,
    metadata: {
      title,
      author: 'pretext-templates',
      subject: 'Monthly habit tracker',
      keywords: ['habit', 'tracker', 'monthly', 'planner', 'goodnotes'],
    },
  };
};

export default generate;
