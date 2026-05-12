/**
 * Parameterised generator for the Weekly Planner pack (CEO v5 · E1).
 *
 * Fills:
 *   - "Week of:" field with the Monday of the target week (or --from date)
 *   - Seven day-date-field spans with actual dates in DD/MM format
 *
 * Input semantics:
 *   - `--from` sets the week start (snapped to Monday if --week-start is 1,
 *     otherwise Sunday if --week-start is 0). Defaults to Monday-start.
 *   - If `--from` is omitted, the template stays printed-blank (the existing
 *     "__/__" placeholders).
 *
 * Preserves FIND-0010: no JS injected, just text substitution.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  GeneratorFn,
  GeneratorInput,
  GeneratorOutput,
} from '@praxlannister/pretext-core/generator';
import {
  shortDayDate,
  isoDate,
} from '@praxlannister/pretext-core/generator-helpers';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(HERE, 'weekly-planner.html');

/**
 * Snap a date to the start of its week. weekStart 1 = Monday, 0 = Sunday.
 * Returns a new Date; does not mutate input.
 */
function snapToWeekStart(d: Date, weekStart: 0 | 1): Date {
  const out = new Date(d);
  const dow = out.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const offset = weekStart === 1
    ? (dow === 0 ? -6 : 1 - dow)  // Mon start: Sun → -6, others → 1 - dow
    : -dow;                        // Sun start: always go back to Sunday
  out.setDate(out.getDate() + offset);
  return out;
}

/** Day order in the template's day-strip elements (lines 413-479). */
const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const generate: GeneratorFn = async (input: GeneratorInput): Promise<GeneratorOutput> => {
  const raw = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  let html = raw;

  if (input.from !== undefined) {
    const weekStart = input.weekStart ?? 1;
    const anchor = new Date(input.from);
    if (!Number.isNaN(anchor.getTime())) {
      const start = snapToWeekStart(anchor, weekStart);

      // Fill "Week of:" with the ISO date.
      // Template: <label>Week of:</label><span class="field"></span>
      html = html.replace(
        /<label>Week of:<\/label><span class="field"><\/span>/,
        `<label>Week of:</label><span class="field">${isoDate(start)}</span>`,
      );

      // Fill each day's short date. Template sequences Mon → Sun (weekStart=1)
      // or we start from Sunday (weekStart=0) and the first day-strip is "Mon"
      // but its date is actually day 2 of the week. Keep it simple: the
      // template *labels* are Mon..Sun; we substitute in that order assuming
      // weekStart=1 by default. If weekStart=0 we shift the template's
      // expectation by +1 day so Monday shows the 2nd day of the week — but
      // that's awkward. Decision: when weekStart=0, still fill Mon..Sun in
      // template order but the first day is Monday-of-the-week, which means
      // --from Sunday gets Monday as day 2. This matches the user's visual
      // expectation of "the week starting from my --from date" if they pass
      // a Monday, and gracefully handles other anchors.
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        // If weekStart=1 (Mon), start is already Monday so i=0 is Mon.
        // If weekStart=0 (Sun), start is Sunday; template's "Mon" is the
        // second day of the week visually, so we add i+1 to land Mon..Sun.
        day.setDate(start.getDate() + (weekStart === 1 ? i : i + 1));

        const label = DAY_ORDER[i];
        const re = new RegExp(
          `<span class="day-name">${label}</span><span class="day-date-field">__/__</span>`,
        );
        html = html.replace(
          re,
          `<span class="day-name">${label}</span><span class="day-date-field">${shortDayDate(day)}</span>`,
        );
      }
    }
  }

  const suggestedFilename = input.from !== undefined
    ? `weekly-planner-${input.from.slice(0, 10)}`
    : 'weekly-planner';

  const title = input.from !== undefined
    ? `Weekly Planner · Week of ${input.from.slice(0, 10)}`
    : 'Weekly Planner';

  return {
    html,
    suggestedFilename,
    metadata: {
      title,
      author: 'pretext-templates',
      subject: 'Weekly planner with 7-day grid and goals',
      keywords: ['weekly', 'planner', 'calendar', 'goodnotes'],
    },
  };
};

export default generate;
