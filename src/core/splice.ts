/**
 * Page-sequence splicer for the Prax Journal generator.
 *
 * Given a date range `[from, to]`, produce the full ordered list of pages
 * the generator needs to render — dailies plus the weekly / monthly /
 * quarterly review pages spliced in at calendar-driven boundaries.
 *
 * Design decisions (locked in `docs/plan-ceo-review-v4-five-decisions-locked.md`
 * and eng-reviewed in `docs/plan-eng-review-v4-five-decisions.md` · G4):
 *
 *   1. A daily is emitted for every date in `[from, to]` inclusive.
 *   2. A weekly is emitted on every Sunday that falls within the range,
 *      immediately AFTER that Sunday's daily. No implicit week-end weekly
 *      when the range ends mid-week — explicit over implicit.
 *   3. A monthly is emitted on the last day of every calendar month that
 *      falls within the range, immediately after that day's daily (and
 *      after any weekly for that day). No implicit end-of-range monthly.
 *   4. A quarterly is emitted on Mar 31, Jun 30, Sep 30, Dec 31 within
 *      range — after the monthly for that same day. Compound days (Sunday
 *      + month-end + quarter-end) emit all four in order:
 *          daily → weekly → monthly → quarterly
 *   5. Dates are `YYYY-MM-DD` strings treated as calendar days (UTC-safe
 *      parsing). No time-of-day, no timezones, no DST to worry about —
 *      the journal is a printed artefact.
 *   6. Inverted ranges (`to < from`) return an empty array. The generator
 *      CLI surfaces that to the user as "nothing to render".
 *
 * This module is the pure functional core. C7's `scripts/generate-journal.ts`
 * wraps it with Puppeteer rendering and PDF splicing.
 *
 * ## Status
 *
 * **C6b · TDD RED.** This stub throws `NotImplementedError` so the 7
 * canonical test cases in `tests/unit/splice.test.ts` fail loudly with a
 * diagnostic message. The GREEN implementation lands in C7 alongside
 * the generator CLI.
 */

export type PageSpec =
  | { kind: 'daily';     date: string }
  | { kind: 'weekly';    weekEnding: string }
  | { kind: 'monthly';   monthEnding: string }
  | { kind: 'quarterly'; quarterEnding: string };

export interface BuildPageSequenceOptions {
  /** Inclusive start date, `YYYY-MM-DD`. */
  from: string;
  /** Inclusive end date, `YYYY-MM-DD`. */
  to: string;
}

export class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedError';
  }
}

/**
 * Build the ordered page sequence for a date range. See file docstring for
 * the splice rules; see `tests/unit/splice.test.ts` for the 7 canonical
 * edge cases that pin the behaviour down.
 *
 * @throws {NotImplementedError} until C7 lands the GREEN implementation
 */
export function buildPageSequence(_opts: BuildPageSequenceOptions): PageSpec[] {
  throw new NotImplementedError(
    'buildPageSequence is C6b-RED · implementation lands in C7 · see src/core/splice.ts header for the splice rules',
  );
}
