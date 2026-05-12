/**
 * Generator framework (CEO v5 Phase 1 · E1).
 *
 * Generalises the Prax Journal generator shape (scripts/generate-journal.ts)
 * so every pack in the library can opt into parameterised PDF generation
 * behind a single CLI entrypoint:
 *
 *   pretext generate <pack-id> --year 2027 --habits "lift,walk,read" --output out.pdf
 *
 * The contract is intentionally small so per-pack generators compose cleanly:
 *
 *   1. CLI parses flags + resolves pack-id → generator function
 *   2. Generator returns a parameterised HTML string
 *   3. Puppeteer renders HTML → PDF via the existing renderer
 *   4. Optional post-processing (bookmarks, metadata) via pdf-postprocess
 *
 * See `docs/plan-ceo-review-v5-10x-100x-expansion.md` §0E (Phase 1) for the
 * architectural rationale.
 */

// ─── Input/output types ────────────────────────────────────────

/**
 * The canonical input every pack generator accepts. Fields are all optional
 * because different pack types care about different dimensions (habit-tracker
 * wants year+habits; weekly-planner wants from+weeks; yearly-overview wants
 * just year). Generators read the fields they need and ignore the rest.
 *
 * This matches the shape Prax Journal's internal CLI already uses, so
 * migration from `scripts/generate-journal.ts` to this framework is
 * additive — the Prax generator becomes one of N packs that speak this
 * interface.
 */
export interface GeneratorInput {
  /** ISO date — start of the date range. Used by calendar-based packs. */
  from?: string;
  /** ISO date — end of the date range (exclusive). */
  to?: string;
  /** Year integer for dated planners (1900-2100). */
  year?: number;
  /** Month integer for monthly templates (1-12). */
  month?: number;
  /** Number of weeks for weekly templates (1-52). */
  weeks?: number;
  /** Habit labels for habit-tracker (max 12, each max 40 chars). */
  habits?: readonly string[];
  /** Locale tag (e.g., 'en-US', 'es-ES'). Defaults to en-US if unset. */
  locale?: string;
  /** Path to profile JSON — Prax Journal-specific. */
  profilePath?: string;
  /** Theme id for the shared token vocabulary. Omit for pack default. */
  theme?: string;
  /** First day of week (0 = Sunday, 1 = Monday). Defaults to 1. */
  weekStart?: 0 | 1;
}

/**
 * Result returned by a generator. Just the HTML; the dispatch CLI handles
 * rendering and post-processing uniformly.
 */
export interface GeneratorOutput {
  /** Parameterised HTML ready for Puppeteer. Self-contained (inline styles,
   * preconnect to Google Fonts only). */
  html: string;
  /** Optional suggested filename stem (without .pdf extension). */
  suggestedFilename?: string;
  /** Optional PDF metadata to inject post-render. */
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  /** Optional bookmark outline for multi-page PDFs. */
  bookmarks?: Array<{ title: string; pageIndex: number }>;
}

/**
 * The shape every per-pack `generate.ts` exports as its default function.
 */
export type GeneratorFn = (input: GeneratorInput) => Promise<GeneratorOutput>;

// ─── Input validation ──────────────────────────────────────────

/** Error thrown when an input fails validation. Named so the CLI can
 * distinguish validation errors (exit 1, show usage) from runtime errors
 * (exit 2, propagate). */
export class InvalidGeneratorInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGeneratorInputError';
  }
}

/**
 * Validate a GeneratorInput against the documented contract. Returns the
 * input unchanged on success; throws `InvalidGeneratorInputError` with a
 * specific, actionable message on failure.
 *
 * Validation is defensive: each field has an explicit range/format check,
 * and the caller (dispatch CLI) prints the error and exits. This is the
 * first place a bad `--year 1800` or `--habits a,b,c,d,e,f,g,h,i,j,k,l,m`
 * gets rejected.
 */
export function validateGeneratorInput(input: GeneratorInput): GeneratorInput {
  if (input.from !== undefined) {
    const d = Date.parse(input.from);
    if (Number.isNaN(d)) {
      throw new InvalidGeneratorInputError(
        `--from must be an ISO date (got: "${input.from}")`,
      );
    }
  }
  if (input.to !== undefined) {
    const d = Date.parse(input.to);
    if (Number.isNaN(d)) {
      throw new InvalidGeneratorInputError(
        `--to must be an ISO date (got: "${input.to}")`,
      );
    }
  }
  if (input.from !== undefined && input.to !== undefined) {
    if (Date.parse(input.from) > Date.parse(input.to)) {
      throw new InvalidGeneratorInputError(
        `--from (${input.from}) must be on or before --to (${input.to})`,
      );
    }
  }
  if (input.year !== undefined) {
    if (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2100) {
      throw new InvalidGeneratorInputError(
        `--year must be an integer in 1900-2100 (got: ${input.year})`,
      );
    }
  }
  if (input.month !== undefined) {
    if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) {
      throw new InvalidGeneratorInputError(
        `--month must be an integer in 1-12 (got: ${input.month})`,
      );
    }
  }
  if (input.weeks !== undefined) {
    if (!Number.isInteger(input.weeks) || input.weeks < 1 || input.weeks > 52) {
      throw new InvalidGeneratorInputError(
        `--weeks must be an integer in 1-52 (got: ${input.weeks})`,
      );
    }
  }
  if (input.habits !== undefined) {
    if (!Array.isArray(input.habits)) {
      throw new InvalidGeneratorInputError(
        `--habits must be a comma-separated list`,
      );
    }
    if (input.habits.length > 12) {
      throw new InvalidGeneratorInputError(
        `--habits accepts at most 12 entries (got: ${input.habits.length})`,
      );
    }
    for (const h of input.habits) {
      if (typeof h !== 'string' || h.length === 0) {
        throw new InvalidGeneratorInputError(
          `--habits entries must be non-empty strings`,
        );
      }
      if (h.length > 40) {
        throw new InvalidGeneratorInputError(
          `--habits entries must be ≤40 characters (got "${h}" · ${h.length} chars)`,
        );
      }
    }
  }
  if (input.weekStart !== undefined && input.weekStart !== 0 && input.weekStart !== 1) {
    throw new InvalidGeneratorInputError(
      `--week-start must be 0 (Sunday) or 1 (Monday) (got: ${String(input.weekStart)})`,
    );
  }
  return input;
}

// ─── Registry lookup ───────────────────────────────────────────

/**
 * Pack IDs that opt in to the generator framework. Kept as a closed enum
 * for now — each entry must have a `generate.ts` sibling of its HTML
 * under `packages/packs-<id>/generate.ts` exporting a default GeneratorFn.
 *
 * Phase 1 targets 5 flagship packs per CEO v5. Starting with habit-tracker
 * as the reference implementation; others follow in subsequent commits.
 */
export const GENERATOR_PACKS = [
  'habit-tracker',
  // Phase 1 stretch: 'weekly-planner', 'monthly-planner', 'yearly-overview',
  // 'prax-journal' — all follow the same contract.
] as const;

export type GeneratorPackId = (typeof GENERATOR_PACKS)[number];

export function isGeneratorPack(id: string): id is GeneratorPackId {
  return (GENERATOR_PACKS as readonly string[]).includes(id);
}
