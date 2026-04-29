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
 * This module is the pure functional core. `scripts/generate-journal.ts`
 * wraps it with Puppeteer rendering and PDF splicing (C7b).
 *
 * ## Status
 *
 * **C7a · GREEN.** Implementation passes the 7 canonical + 1 bonus
 * edge-case tests in `tests/unit/splice.test.ts`. No Puppeteer, no file
 * IO — pure calendar math, runs in sub-millisecond for a 90-day range.
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

// ─── Date helpers (UTC, no timezone surprises) ─────────────────
//
// Everything below operates on UTC Dates built from integer Y/M/D
// triples. This sidesteps every DST / locale cliff and keeps the
// output deterministic across machines.

/** Parse a `YYYY-MM-DD` string into a UTC Date at 00:00. */
function parseUTC(isoDate: string): Date {
  const [yStr, mStr, dStr] = isoDate.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    throw new Error(`invalid date: ${isoDate} (expected YYYY-MM-DD)`);
  }
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a UTC Date back to `YYYY-MM-DD` (zero-padded). */
function formatUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Advance a UTC Date by one calendar day (pure; returns a new Date). */
function addOneDay(d: Date): Date {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/** True if `d` is the last day of its calendar month. */
function isMonthEnd(d: Date): boolean {
  // If adding one day bumps the month, today is the last day of this month.
  return addOneDay(d).getUTCMonth() !== d.getUTCMonth();
}

/**
 * True if `d` is Mar 31 / Jun 30 / Sep 30 / Dec 31.
 * Assumes `d` is already a month-end — checks the month only. We still
 * call this after `isMonthEnd` so the contract is "last day of Mar/Jun/
 * Sep/Dec", not "any day of those months".
 */
function isQuarterEnd(d: Date): boolean {
  const monthZeroIndexed = d.getUTCMonth();
  // Mar=2, Jun=5, Sep=8, Dec=11
  return monthZeroIndexed === 2 || monthZeroIndexed === 5 || monthZeroIndexed === 8 || monthZeroIndexed === 11;
}

/**
 * Build the ordered page sequence for a date range. See file docstring
 * for the splice rules; see `tests/unit/splice.test.ts` for the 7
 * canonical edge cases that pin the behaviour down.
 */
export function buildPageSequence(opts: BuildPageSequenceOptions): PageSpec[] {
  const start = parseUTC(opts.from);
  const end = parseUTC(opts.to);

  // Inverted range — generator will render nothing.
  if (end.getTime() < start.getTime()) return [];

  const out: PageSpec[] = [];

  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addOneDay(cursor)) {
    const iso = formatUTC(cursor);
    out.push({ kind: 'daily', date: iso });

    // 0 = Sunday in the JS / UTC day-of-week convention.
    if (cursor.getUTCDay() === 0) {
      out.push({ kind: 'weekly', weekEnding: iso });
    }

    if (isMonthEnd(cursor)) {
      out.push({ kind: 'monthly', monthEnding: iso });

      // Quarterly strictly follows the monthly on the same day, per the
      // compound-day ordering rule (daily → weekly → monthly → quarterly).
      if (isQuarterEnd(cursor)) {
        out.push({ kind: 'quarterly', quarterEnding: iso });
      }
    }
  }

  return out;
}
