/**
 * Prax Journal profile schema — the data-only reference contract.
 *
 * Locked by decision Q4 in docs/plan-ceo-review-v4-five-decisions-locked.md.
 * Addresses G3 (CRITICAL) in docs/plan-eng-review-v4-five-decisions.md:
 * the real profile.json contains PII (meds + therapist names) and must
 * never be committed to git. Only profile.example.json — which holds
 * generic placeholders — is committable.
 *
 * ## Philosophy
 *
 * `profile.json` is **data**, not templating. HTML templates stay
 * hardcoded (FIND-0010 self-contained invariant). Only the AI
 * monthly/quarterly review generators consume this file to compute
 * aggregates like "cigs down 2.8 from baseline 10" where baseline=10
 * can only come from the profile.
 *
 * ## Validation discipline
 *
 * - All schemas are strict (`.strict()`) — unknown fields fail loud.
 *   This catches typos and drift early instead of silently ignoring them.
 * - `schema_version` is a required number field. Incrementing it is how
 *   we signal migrations. A parser that sees an unsupported version
 *   refuses to proceed and tells the operator how to upgrade.
 * - Every error message is actionable: path, what was expected, what
 *   was received. See `parseProfile()` for how we flatten ZodError
 *   into a human-readable multi-line diagnostic.
 *
 * ## Why TypeScript types are derived (`z.infer`)
 *
 * The Zod schema is the single source of truth. TypeScript interfaces
 * are `z.infer<typeof Schema>` — there is no hand-maintained `interface`
 * that could drift. Adding a field means editing the schema once.
 */

import { z } from 'zod';

// ─── Current schema version ─────────────────────────────────────────
// Bump when the shape changes in a backwards-incompatible way.
// schema_version 1: initial v5.3 shape (2026-04-29).
export const PROFILE_SCHEMA_VERSION = 1;

// ─── Leaf schemas ──────────────────────────────────────────────────

/** ISO-8601 date (YYYY-MM-DD) — enforced with a regex, not new Date(). */
const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'expected ISO date YYYY-MM-DD');

/** Current medications — just enough for the AI to compute comparisons. */
const Medication = z
  .object({
    name: z.string().min(1, 'medication.name cannot be empty'),
    dose: z.string().min(1, 'medication.dose cannot be empty'),
    cadence: z.string().min(1, 'medication.cadence cannot be empty'),
    started_on: IsoDate.optional(),
    purpose: z.string().optional(),
  })
  .strict();

/** A care provider — Prax currently has <REDACTED-PSYCH-FIRST> (psych) + Dr <REDACTED-PSYCH-FIRST-DR> (psy). */
const Therapist = z
  .object({
    role: z.enum(['psychology', 'psychiatry', 'coach', 'medical', 'other']),
    name: z.string().min(1, 'therapist.name cannot be empty'),
    notes: z.string().optional(),
  })
  .strict();

/** Named pattern — the <REDACTED-PSYCH-FIRST>-style loops Prax tallies weekly. */
const NamedPattern = z
  .object({
    name: z.string().min(1, 'pattern.name cannot be empty'),
    reframe: z.string().optional(),
  })
  .strict();

/**
 * Baselines — the "cigs down 2.8 from baseline 10" math requires
 * knowing the number 10. Exact keys are intentionally open-ended so
 * future trackers slot in without a schema bump; the record value is
 * constrained to number for aggregate safety.
 */
const Baselines = z
  .record(
    z.string().min(1),
    z.number().finite('baseline values must be finite numbers'),
  );

/** Identity block — the only hard-required user piece. */
const User = z
  .object({
    name: z.string().min(1, 'user.name cannot be empty'),
    pronouns: z.string().optional(),
    tz: z
      .string()
      .regex(
        /^[A-Za-z_]+\/[A-Za-z_]+$/u,
        'tz should be an IANA string like Asia/Kolkata',
      )
      .default('Asia/Kolkata'),
    locale: z.string().default('en-IN'),
  })
  .strict();

// ─── Root schema ───────────────────────────────────────────────────

export const ProfileSchema = z
  .object({
    schema_version: z
      .number()
      .int()
      .positive('schema_version must be a positive integer'),
    user: User,
    therapists: z.array(Therapist).default([]),
    medications: z.array(Medication).default([]),
    named_patterns: z.array(NamedPattern).default([]),
    baselines: Baselines.default({}),
  })
  .strict();

/** Canonical TypeScript type — derived, not hand-maintained. */
export type Profile = z.infer<typeof ProfileSchema>;

// ─── Parse + validate ──────────────────────────────────────────────

export class ProfileParseError extends Error {
  public readonly issues: ReadonlyArray<{ path: string; message: string }>;

  constructor(message: string, issues: ReadonlyArray<{ path: string; message: string }>) {
    super(message);
    this.name = 'ProfileParseError';
    this.issues = issues;
  }
}

/**
 * Parse an untrusted JSON-shaped value into a validated Profile.
 *
 * Throws `ProfileParseError` with a multi-line message on any failure:
 * - Top-level line identifies what went wrong ("schema_version mismatch",
 *   "strict parse failed").
 * - Each issue line includes a JSON path and the Zod-verbatim message.
 *
 * Supports both current-version acceptance and future-proofing:
 * - If `schema_version > PROFILE_SCHEMA_VERSION`, we throw a targeted
 *   upgrade-needed error instead of the generic "strict parse failed"
 *   so the operator knows to update the generator before editing the file.
 */
export function parseProfile(value: unknown): Profile {
  // Fast-path: catch schema_version mismatch before we let Zod complain
  // about a dozen downstream shape differences that may be due to the
  // version bump.
  if (typeof value === 'object' && value !== null && 'schema_version' in value) {
    const v = (value as { schema_version: unknown }).schema_version;
    if (typeof v === 'number' && Number.isInteger(v) && v > PROFILE_SCHEMA_VERSION) {
      throw new ProfileParseError(
        `profile.schema_version=${v} is newer than this generator supports ` +
          `(max ${PROFILE_SCHEMA_VERSION}). Upgrade the prax-journal package ` +
          `or downgrade your profile.json.`,
        [
          {
            path: 'schema_version',
            message: `got ${v}, expected <= ${PROFILE_SCHEMA_VERSION}`,
          },
        ],
      );
    }
  }

  const result = ProfileSchema.safeParse(value);
  if (result.success) return result.data;

  const issues = result.error.issues.map((i) => ({
    path: i.path.length === 0 ? '<root>' : i.path.join('.'),
    message: i.message,
  }));
  const preview = issues
    .slice(0, 5)
    .map((i) => `  • ${i.path}: ${i.message}`)
    .join('\n');
  const overflow = issues.length > 5 ? `\n  … and ${issues.length - 5} more` : '';

  throw new ProfileParseError(
    `profile.json validation failed (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n${preview}${overflow}`,
    issues,
  );
}
