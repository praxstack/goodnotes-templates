/**
 * @praxlannister/pretext-core — registry + manifest schemas.
 *
 * Two Zod schemas that govern the pack-metadata lifecycle:
 *
 *   1. `PackManifest` — the shape of `packages/packs-<id>/manifest.json`.
 *      Authored by hand (or by `pretext-templates init`) and committed
 *      alongside each pack's source HTML. Never fetched over the wire.
 *
 *   2. `Registry`    — the shape of the compiled `registry.json` that
 *      `scripts/generate-registry.ts` (W2 T3) produces by walking all
 *      `packages/packs-<id>/manifest.json` files. Served from
 *      `pretext-templates.dev/registry.json` (primary) and
 *      `raw.githubusercontent.com/…/registry.json` (fallback) per
 *      Finding 1.2 of the eng-review.
 *
 * ## Philosophy (mirrors `./profile.ts`)
 *
 * - **Zod is the single source of truth.** TS types are `z.infer<…>`;
 *   there is no hand-maintained `interface` that could drift.
 * - **`.strict()` everywhere.** Unknown fields fail loud — catches typos
 *   and drift before a broken manifest ships to the registry.
 * - **`schema_version` is required.** A registry or manifest that
 *   declares an unsupported version refuses to parse, with a fix
 *   message pointing at `MIGRATION.md`.
 * - **Every error is actionable.** `parseManifest()` and `parseRegistry()`
 *   flatten `ZodError.issues` into a `RegistryParseError` that carries
 *   the full diagnostic list (path · message · expected · received).
 *
 * ## What's NOT here (yet)
 *
 * - **Semver resolution.** `pack.version` is validated as a semver string
 *   but we don't resolve ranges here. W11 T1 adds `semver@7.x` + a
 *   `resolvePackVersion()` helper.
 * - **Signature verification.** The registry isn't signed today. When/if
 *   we add Sigstore-style signing, the signature field goes on the
 *   `Registry` schema, not per-pack.
 * - **Remote fetching.** This module is pure Zod + types. Fetching with
 *   primary/fallback routing + 5-minute cache lives in a sibling module
 *   (W11 T2) that imports these schemas.
 */

import { z } from 'zod';
import { RegistryParseError } from '../errors.js';

// ─── Schema versions ────────────────────────────────────────────────
// Bump when the shape changes in a backwards-incompatible way. Consumers
// compare the version at the top of the file against these constants
// and refuse to proceed if they don't match (forward-compatible
// consumers can accept a range; we haven't needed that yet).
export const MANIFEST_SCHEMA_VERSION = 1;
export const REGISTRY_SCHEMA_VERSION = 1;

// ─── Leaf validators ────────────────────────────────────────────────

/**
 * Kebab-case identifier. Used for pack ids and category names. Enforced
 * so URL slugs on the gallery are stable and filesystem-safe across
 * every OS (no spaces, no uppercase on case-insensitive FSes, no dots
 * that break `packages/packs-*` globs).
 */
const KebabId = z
  .string()
  .min(1, 'id cannot be empty')
  .regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$/u,
    'id must be kebab-case (lowercase letters, digits, hyphens; cannot start/end with a hyphen)',
  );

/**
 * Semver string (major.minor.patch with optional -prerelease / +build).
 * We validate the shape here; range resolution lives elsewhere.
 * Regex is intentionally permissive to match the semver spec without
 * pulling in the `semver` package just for parsing.
 */
const SemverString = z
  .string()
  .regex(
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u,
    'expected semver MAJOR.MINOR.PATCH (e.g. 1.2.3, 2.0.0-beta.1)',
  );

/**
 * SHA-256 hash as 64 lowercase hex chars. Used for `integrity` on pack
 * assets so the gallery + CLI can verify a downloaded tarball hasn't
 * been tampered with. Lowercase enforced so equality comparisons are
 * case-sensitive but author-friendly.
 */
const Sha256 = z
  .string()
  .regex(
    /^[a-f0-9]{64}$/u,
    'expected lowercase sha256 hex (64 chars)',
  );

/**
 * Categories a pack can belong to. Fixed union today; widening requires
 * a `schema_version` bump on both manifest and registry (consumers
 * display chips per category, so adding one silently would leave the
 * gallery with an unhandled label).
 */
export const PACK_CATEGORIES = [
  'journal',
  'planner',
  'tracker',
  'notes',
  'worksheet',
  'cover',
] as const;

const PackCategory = z.enum(PACK_CATEGORIES);

// ─── Pack manifest ──────────────────────────────────────────────────

/**
 * Minimum viable manifest — what goes in `packages/packs-<id>/manifest.json`.
 * Every field here is required; optional fields are called out explicitly.
 *
 * Field rules:
 *
 * - `id` is the registry key. Must be globally unique and match the
 *   package directory name (`packages/packs-<id>/`).
 * - `version` follows semver; bump per change. The registry emits the
 *   latest version per `id` unless a consumer asks for a range.
 * - `entry` is the pack's HTML file relative to the package directory,
 *   e.g. `template.html` or `v5/today.html`. Used by the renderer.
 * - `description` is one line (≤140 chars) — the gallery card summary.
 * - `author` is free-form (name or GitHub handle).
 * - `tags` are lowercase free-text labels for gallery filtering; max 8
 *   to keep card chips scannable.
 * - `thumbnail` is an optional PNG path relative to the package dir;
 *   when present the gallery uses it instead of auto-generating one.
 */
export const PackManifestSchema = z
  .object({
    schema_version: z.literal(MANIFEST_SCHEMA_VERSION),
    id: KebabId,
    version: SemverString,
    name: z.string().min(1, 'name cannot be empty').max(60, 'name is too long (max 60)'),
    description: z.string().min(1, 'description cannot be empty').max(140, 'description is too long (max 140)'),
    category: PackCategory,
    author: z.string().min(1, 'author cannot be empty'),
    entry: z
      .string()
      .min(1, 'entry cannot be empty')
      .regex(/\.html?$/u, 'entry must be an .html file'),
    tags: z.array(z.string().min(1).regex(/^[a-z0-9-]+$/u, 'tags must be lowercase kebab-case')).max(8, 'max 8 tags').optional(),
    thumbnail: z.string().regex(/\.(png|jpg|jpeg|webp)$/u, 'thumbnail must be a PNG/JPG/WEBP path').optional(),
    integrity: Sha256.optional(),
    /**
     * Optional free-form homepage/repo URL. When omitted, the gallery
     * hides the "view source" link on the pack card.
     */
    repository: z.string().url('repository must be an absolute URL').optional(),
    /**
     * SPDX license identifier, e.g. 'MIT' or 'Apache-2.0'. Optional;
     * the gallery shows "license unspecified" when absent.
     */
    license: z.string().max(60, 'license identifier is too long').optional(),
  })
  .strict();

/**
 * Inferred TS type for a pack manifest. Derived from the schema so
 * there's no hand-maintained `interface` to drift.
 */
export type PackManifest = z.infer<typeof PackManifestSchema>;

// ─── Registry ───────────────────────────────────────────────────────

/**
 * Compiled registry.json — a flat list of every known pack + top-level
 * metadata the gallery uses for display.
 *
 * Consumers should always look at the latest entry per `id`; the
 * registry currently emits one row per pack (latest version wins),
 * but the schema is forward-compatible with a future per-version
 * emission if we ever need to serve multiple versions at once.
 */
export const RegistrySchema = z
  .object({
    schema_version: z.literal(REGISTRY_SCHEMA_VERSION),
    /**
     * ISO-8601 timestamp (with timezone) of when this registry was
     * compiled. Consumers display "registry updated 3 minutes ago"
     * on the gallery footer.
     */
    generated_at: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u,
        'generated_at must be ISO-8601 with timezone',
      ),
    /**
     * Commit SHA the registry was compiled from — lets consumers pin
     * to a specific revision and helps us diff "which packs changed
     * between these two registries".
     */
    source_commit: z
      .string()
      .regex(/^[a-f0-9]{7,40}$/u, 'source_commit must be a git hex hash')
      .optional(),
    packs: z.array(PackManifestSchema),
  })
  .strict();

export type Registry = z.infer<typeof RegistrySchema>;

// ─── Parsers ────────────────────────────────────────────────────────

/**
 * Parse a `PackManifest` from an arbitrary value (e.g. `JSON.parse(raw)`)
 * and throw `RegistryParseError` on failure. The error carries the
 * full Zod issue list so `scripts/generate-registry.ts` can surface
 * all problems at once.
 *
 * @param source  Human-readable origin for error messages (file path or URL).
 * @param input   The parsed JSON value to validate.
 */
export function parseManifest(source: string, input: unknown): PackManifest {
  const result = PackManifestSchema.safeParse(input);
  if (result.success) return result.data;
  throw new RegistryParseError(
    { source, issues: result.error.issues },
    result.error,
  );
}

/**
 * Parse the registry document (as served by `pretext-templates.dev`
 * or its fallback). Same error discipline as `parseManifest`.
 */
export function parseRegistry(source: string, input: unknown): Registry {
  const result = RegistrySchema.safeParse(input);
  if (result.success) return result.data;
  throw new RegistryParseError(
    { source, issues: result.error.issues },
    result.error,
  );
}
