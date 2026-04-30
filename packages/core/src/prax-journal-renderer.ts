/**
 * Prax Journal renderer — maps a `PageSpec` to its hardcoded v5 HTML
 * file(s), optionally substitutes a narrow set of identity placeholders
 * from the profile, and renders them to PDF buffers.
 *
 * This is the thin adapter between the pure splice layer
 * (`src/core/splice.ts`, C7a) and Puppeteer
 * (`src/core/puppeteer-renderer.ts`).
 *
 * ## Templates stay hardcoded
 *
 * The self-contained-templates invariant (FIND-0010, `src/types/profile.ts`)
 * says: HTML templates stay on disk as-is. We do NOT fill in per-day content
 * — no dates, no tasks, no mood, no cigarette counts. Those stay blank
 * because this is a *printed planner*; the user writes them by hand.
 *
 * ## Narrow PII substitution (Rx card only, today.html only)
 *
 * The one exception is a small set of identity fields on the Rx block
 * of `today.html`: doctor name, credentials, registration number,
 * default follow-up days. Those are static across every day of the
 * journal and repeating the same blanks 365 times defeats the whole
 * point of the printed Rx card. So the renderer:
 *
 *   1. Reads the HTML off disk (unchanged).
 *   2. If a `profile` is supplied, substitutes a whitelist of
 *      `{{PLACEHOLDER}}` tokens with values derived from the first
 *      `therapists[]` entry whose `role === 'psychiatry'`.
 *   3. If no profile is supplied, or the psychiatry entry is missing
 *      a given field, the placeholder falls back to a printed-blank
 *      glyph (a short underline) so the template still reads as a
 *      handwrite-ready form.
 *
 * The placeholder whitelist is small, explicit, and lives in one place
 * (`PROFILE_PLACEHOLDERS` below). Adding a new placeholder is a two-line
 * change: add the token to the whitelist and add the corresponding field
 * to the profile schema.
 *
 * ## Daily = 4 pages
 *
 * A "daily" `PageSpec` expands into four A4 HTML files rendered in order:
 *   today.html  →  midday.html  →  reflect.html  →  brain-dump.html
 *
 * This 4-page rhythm (morning commit → midday re-anchor → evening
 * process → unstructured canvas) is the behavioural system the journal
 * encodes. Weekly / monthly / quarterly each expand to a single file.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHTMLToPDF } from './puppeteer-renderer.js';
import { getPageDimensions } from './dimensions.js';
import { isLeapYear } from './utils/locale.js';
import type { PageSpec } from './splice.js';
import type { Profile } from './types/profile.js';

// Re-export so external callers (and tests that predate the dedupe)
// keep importing `isLeapYear` from this module. Single source of truth
// now lives in `./utils/locale.ts` (see code-review finding P2-4).
export { isLeapYear };

/**
 * Root of the v5 HTML pack (the only version wired today). Exposed so
 * tests and CLI flags can override it without string-munging paths.
 *
 * Resolved relative to this module's location (walk up from
 * `packages/core/src/` → repo root → `packs/...`) so the path is correct
 * regardless of CWD. Fixes F10 of eng-review: the previous
 * `path.resolve('packs/...')` broke under the monorepo layout when
 * commands ran from a workspace subdirectory.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
export const V5_PACK_DIR = path.join(REPO_ROOT, 'packages/packs-prax-journal/versions/v5');

/**
 * Filenames that make up one daily spread, in render order. Exported so
 * tests can pin the order without re-deriving it.
 */
export const DAILY_HTML_FILES = [
  'today.html',
  'midday.html',
  'reflect.html',
  'brain-dump.html',
] as const;

/**
 * Filenames for the review kinds. One file each — kept as a typed lookup
 * so an exhaustiveness check in `resolvePageSpecFiles` catches any new
 * `PageSpec` variants at compile time.
 */
export const REVIEW_HTML_FILE: Record<
  Exclude<PageSpec['kind'], 'daily'>,
  string
> = {
  weekly:    'weekly.html',
  monthly:   'monthly.html',
  quarterly: 'quarterly.html',
};

/**
 * Number of medication rows the Rx card exposes on `today.html`. The
 * template hard-codes 8 `.rx-item` blocks; this constant keeps the
 * whitelist + `extractRxFields` in lock-step with the markup.
 */
export const RX_SLOT_COUNT = 8;

/**
 * Build the full `{{RX_N_NAME}}/{{RX_N_DOSE}}` slot whitelist for N=1..8.
 * Done programmatically so we cannot drift between the two token families
 * or off-by-one when slot count changes.
 */
function buildRxSlotPlaceholders(): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 1; i <= RX_SLOT_COUNT; i++) {
    out[`RX_${i}_NAME`] = '___________';
    out[`RX_${i}_DOSE`] = '__ · _-_-_';
  }
  return out;
}

/**
 * Whitelist of `{{PLACEHOLDER}}` tokens that `substituteProfile` recognises,
 * mapped to a short printed-blank fallback used when the profile (and/or
 * page) doesn't supply the value. These match the tokens that appear in
 * the v5 HTML.
 *
 * Three families:
 *   - `DR_*`   — psychiatrist identity (name / credentials / reg № / F-U).
 *                Sourced from the profile; static across every day of the
 *                journal.
 *   - `RX_N_*` — medication slots N=1..8 (name + dose). Sourced from the
 *                profile; static across every day of the journal.
 *   - `DAY_*`  — per-day date values (date, weekday, day-of-year, days in
 *                year). Sourced from the `PageSpec.date` when the page is
 *                a `daily` kind. Review pages (weekly/monthly/quarterly)
 *                don't embed these tokens in their HTML, so the whitelist
 *                regex never finds a match on them — zero-risk fallback.
 *
 * Fallbacks are short underscore runs, chosen so the rendered blank form
 * looks visually equivalent to the pre-substitution template.
 */
export const PROFILE_PLACEHOLDERS = {
  DR_NAME:         '_________________',
  DR_CREDENTIALS:  '[credentials]',
  DR_REG:          '__________',
  DR_FOLLOWUP:     '__',
  ...buildRxSlotPlaceholders(),
  // ── Per-day date tokens (filled from PageSpec.date when kind='daily') ──
  DAY_DATE:        '__________',
  DAY_WEEKDAY:     '___',
  DAY_OF_YEAR:     '___',
  DAYS_IN_YEAR:    '365',
} as const;

export type ProfilePlaceholder = keyof typeof PROFILE_PLACEHOLDERS;

/**
 * Pull identity + medication fields from a profile into the placeholder
 * token map. Two independent sources, combined into one map:
 *
 *   1. Psychiatrist identity — the first `therapists[]` entry whose
 *      `role === 'psychiatry'` wins. Deterministic; absent fields stay
 *      undefined so the caller (`substituteProfile`) applies the fallback.
 *
 *   2. Medication rows — the first `RX_SLOT_COUNT` (= 8) entries of
 *      `medications[]` populate the Rx card in declaration order. To
 *      reorder which meds show, reorder the array in `profile.json`.
 *      Meds beyond slot 8 are not rendered (the template only has 8 rows);
 *      write them in the margin or trim the profile to the ones you want
 *      printed.
 */
function extractRxFields(profile: Profile): Partial<Record<ProfilePlaceholder, string>> {
  const out: Partial<Record<ProfilePlaceholder, string>> = {};

  // ── Psychiatrist identity ─────────────────────────────────────
  const psych = profile.therapists.find((t) => t.role === 'psychiatry');
  if (psych) {
    out.DR_NAME = psych.name;
    if (psych.credentials !== undefined) out.DR_CREDENTIALS = psych.credentials;
    if (psych.registration_number !== undefined) out.DR_REG = psych.registration_number;
    if (psych.follow_up_days !== undefined) out.DR_FOLLOWUP = String(psych.follow_up_days);
  }

  // ── Medication rows 1..RX_SLOT_COUNT ──────────────────────────
  // First N meds, declaration order. Extras silently drop (documented
  // behaviour — user controls which get printed via profile order).
  const meds = profile.medications.slice(0, RX_SLOT_COUNT);
  meds.forEach((m, idx) => {
    const n = idx + 1; // 1-based for template readability
    (out as Record<string, string>)[`RX_${n}_NAME`] = m.name;
    (out as Record<string, string>)[`RX_${n}_DOSE`] = m.dose;
  });

  return out;
}


/**
 * Derive the `DAY_*` placeholder values from an ISO `YYYY-MM-DD` date
 * string. Pure, UTC-only (matches `splice.ts` + `pdf-splice.ts` bookmark
 * titles — no timezone drift).
 *
 * Produces, for e.g. `'2026-04-30'`:
 *   - `DAY_DATE`     → `'April 30'`
 *   - `DAY_WEEKDAY`  → `'Thu'`
 *   - `DAY_OF_YEAR`  → `'120'`
 *   - `DAYS_IN_YEAR` → `'365'`
 *
 * Exported so tests can pin the formatting contract and so any future
 * non-daily page kind that wants to display "N/365" can share the math.
 */
export function deriveDateFields(
  isoDate: string,
): Partial<Record<ProfilePlaceholder, string>> {
  const [yStr, mStr, dStr] = isoDate.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  const utc = Date.UTC(year, month - 1, day);

  // Day-of-year: 1-based; Jan 1 → 1, Dec 31 (non-leap) → 365.
  const yearStart = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((utc - yearStart) / 86_400_000) + 1;
  const daysInYear = isLeapYear(year) ? 366 : 365;

  // Intl.DateTimeFormat with explicit UTC timezone matches bookmarkTitle()
  // and buildPageSequence() — the whole renderer is UTC-locked.
  const dateFmt = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const weekdayFmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });

  return {
    DAY_DATE:     dateFmt.format(utc),
    DAY_WEEKDAY:  weekdayFmt.format(utc),
    DAY_OF_YEAR:  String(dayOfYear),
    DAYS_IN_YEAR: String(daysInYear),
  };
}

/**
 * Replace every `{{PLACEHOLDER}}` token in `html` with its resolved value,
 * or the fallback from `PROFILE_PLACEHOLDERS` when neither the profile
 * nor the page supplies it. Pure, no IO.
 *
 * Value resolution (first match wins):
 *   1. Profile — DR_* identity + RX_N_* medication slots from `profile`.
 *   2. Page    — DAY_* date tokens derived from `page.date` when `page`
 *                is a `daily` kind. Review pages (weekly/monthly/
 *                quarterly) don't embed `DAY_*` tokens, so they sail
 *                through untouched.
 *   3. Fallback — the printed-blank glyph from `PROFILE_PLACEHOLDERS`.
 *
 * Implementation detail: we build a single RegExp from the whitelist so
 * any token the whitelist doesn't know about is left untouched — this
 * prevents accidental substitution into unrelated curly-brace text
 * (e.g. CSS `{ … }` rules, JSON samples in comments).
 */
export function substituteProfile(
  html: string,
  profile?: Profile,
  page?: PageSpec,
): string {
  const filled: Partial<Record<ProfilePlaceholder, string>> = {
    ...(profile ? extractRxFields(profile) : {}),
    ...(page && page.kind === 'daily' ? deriveDateFields(page.date) : {}),
  };

  const keys = Object.keys(PROFILE_PLACEHOLDERS) as ProfilePlaceholder[];
  const pattern = new RegExp(`\\{\\{(${keys.join('|')})\\}\\}`, 'g');
  return html.replace(pattern, (_match, token: string) => {
    const key = token as ProfilePlaceholder;
    return filled[key] ?? PROFILE_PLACEHOLDERS[key];
  });
}

/**
 * Map a `PageSpec` to the absolute HTML file paths that make it up.
 * Pure — no IO. The default `versionDir` points at the v5 pack; tests
 * and future `--pack` flags can pass any directory that holds the
 * expected filenames.
 *
 * Ordering matters: `daily` returns the 4 files in the render order
 * that defines the behavioural rhythm (see module docstring).
 */
export function resolvePageSpecFiles(
  page: PageSpec,
  versionDir: string = V5_PACK_DIR,
): string[] {
  switch (page.kind) {
    case 'daily':
      return DAILY_HTML_FILES.map((f) => path.join(versionDir, f));
    case 'weekly':
    case 'monthly':
    case 'quarterly':
      return [path.join(versionDir, REVIEW_HTML_FILE[page.kind])];
  }
}

export interface RenderPageSpecOptions {
  /** Override the HTML pack directory. Defaults to `V5_PACK_DIR`. */
  versionDir?: string;
  /**
   * Optional profile for narrow identity substitution. When absent, the
   * `{{PLACEHOLDER}}` tokens fall back to printed-blank glyphs so the
   * template still reads as a hand-writable form.
   */
  profile?: Profile;
}

/**
 * Render a `PageSpec` to one PDF buffer per constituent HTML file.
 *
 * - Daily returns 4 buffers (today / midday / reflect / brain-dump)
 * - Weekly / monthly / quarterly return 1 buffer each
 *
 * Every v5 HTML uses `@page { size: A4 portrait; margin: 0 }`, so we
 * pass `multiPage: true` to `renderHTMLToPDF` and let CSS drive the
 * page size. The caller is responsible for concatenating the buffers
 * into a final PDF — that's C7b.2's job.
 */
export async function renderPageSpec(
  page: PageSpec,
  opts: RenderPageSpecOptions = {},
): Promise<Buffer[]> {
  const files = resolvePageSpecFiles(page, opts.versionDir);
  // Dimensions are required by `PuppeteerRenderOptions` but ignored in
  // `multiPage` mode — CSS `@page` rules take over. We still pass A4
  // portrait for debuggability / non-multiPage fallback.
  const dims = getPageDimensions('a4', 'portrait');

  const buffers: Buffer[] = [];
  for (const htmlPath of files) {
    const rawHtml = await fs.readFile(htmlPath, 'utf-8');
    const htmlContent = substituteProfile(rawHtml, opts.profile, page);
    buffers.push(
      await renderHTMLToPDF({
        htmlPath,
        htmlContent,
        dimensions: dims,
        multiPage: true,
      }),
    );
  }
  return buffers;
}
