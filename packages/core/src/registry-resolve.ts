/**
 * @pretext-templates/core — semver range resolver for registry packs.
 *
 * W11 · CEO plan E5.
 *
 * No schema bump. Registry schema stays at v1; this module is additive —
 * consumers that never call `resolvePackVersion` are unaffected. The
 * registry's per-pack row already carries `version` (semver string); we
 * just surface a helper that picks the best match for a user-supplied
 * range.
 *
 * Contract (mirrors the npm-standard semver.maxSatisfying but wrapped so
 * errors are actionable + typed):
 *
 *   resolvePackVersion(registry, 'prax-journal', '^5.0.0')
 *     → { id: 'prax-journal', version: '5.3.0', ... }  // PackManifest
 *
 *   resolvePackVersion(registry, 'prax-journal', '*')
 *     → highest version in the registry for that id
 *
 *   resolvePackVersion(registry, 'prax-journal', '10.0.0')
 *     → throws PackNotFoundError with the list of satisfiable versions
 *
 * Today the registry emits at most one row per id (generate-registry.ts
 * currently only keeps the latest version per pack). This resolver is
 * forward-compatible with a future emission that carries multiple
 * versions of the same id — no change needed here.
 */

import { maxSatisfying, valid, validRange } from 'semver';
import type { PackManifest, Registry } from './types/registry.js';
import { PackNotFoundError } from './errors.js';

/**
 * Compute up to N closest-match pack ids via simple prefix/substring
 * heuristics. Lightweight alternative to a full Levenshtein pass —
 * plenty good for a 22-pack registry.
 */
function nearestIds(target: string, all: string[], n = 3): string[] {
  const lower = target.toLowerCase();
  const scored = all
    .filter((id) => id !== target)
    .map((id) => {
      const l = id.toLowerCase();
      let score = 0;
      if (l.includes(lower) || lower.includes(l)) score += 3;
      if (l[0] === lower[0]) score += 1;
      return { id, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.id);
}

/**
 * Resolve the best-matching manifest for a pack id + semver range.
 *
 * @param registry  Validated Registry (from parseRegistry()).
 * @param id        Kebab-case pack id.
 * @param range     Semver range (e.g. '^5.0.0', '~5.3', '>=5.0.0 <6.0.0',
 *                  '*' for latest, or an exact version like '5.3.0').
 * @throws {PackNotFoundError} if no version in the registry satisfies.
 * @throws {Error} if `range` is not a parseable semver range.
 */
export function resolvePackVersion(
  registry: Registry,
  id: string,
  range: string,
): PackManifest {
  if (!validRange(range)) {
    // Semver can't parse it → user error, not a registry error.
    // Surface the bad range in the message so the CLI can print it back.
    throw new Error(
      `resolvePackVersion: '${range}' is not a valid semver range. ` +
        `Examples: '^5.0.0', '~5.3', '>=5 <6', '5.3.0', '*'.`,
    );
  }

  const knownIds = [...new Set(registry.packs.map((p) => p.id))].sort();
  const candidates = registry.packs.filter((p) => p.id === id);
  if (candidates.length === 0) {
    throw new PackNotFoundError({
      requested: id,
      suggestions: nearestIds(id, knownIds),
      knownCount: knownIds.length,
    });
  }

  // `maxSatisfying` walks the candidates and returns the highest version
  // that satisfies the range, or null. We map versions back to their
  // full manifest after the pick so consumers get the whole row.
  const versions = candidates.map((p) => p.version).filter((v) => valid(v));
  const picked = maxSatisfying(versions, range);
  if (picked === null) {
    // Range didn't match any existing version. We re-use PackNotFoundError
    // but add the available-versions hint to the message via a subclass
    // of Error — PackNotFoundError already exposes requested/suggestions
    // so we annotate its message suffix via a specialised error below.
    throw new PackVersionNotFoundError({
      id,
      range,
      availableVersions: versions.sort(),
    });
  }

  // Find the matching manifest. `find` is safe: maxSatisfying returned a
  // version that definitely exists in `candidates`.
  const match = candidates.find((p) => p.version === picked);
  if (!match) {
    throw new Error(
      `resolvePackVersion: internal bug — maxSatisfying picked '${picked}' ` +
        `but no candidate manifest carries that version (this should be impossible).`,
    );
  }
  return match;
}

/**
 * Thrown when the pack id exists but no version satisfies the requested
 * semver range. Distinct from PackNotFoundError (which is id-level) so
 * callers can print specific advice ("upgrade your range" vs "check the
 * pack id").
 */
export class PackVersionNotFoundError extends Error {
  readonly code = 'pack-version-not-found';
  constructor(
    public readonly details: {
      id: string;
      range: string;
      availableVersions: string[];
    },
  ) {
    const { id, range, availableVersions } = details;
    super(
      `Pack '${id}' exists but no version satisfies range '${range}'. ` +
        `Available: ${availableVersions.join(', ')}`,
    );
    this.name = 'PackVersionNotFoundError';
  }
}

/**
 * Convenience: list all unique pack ids in the registry, sorted.
 * Handy for CLI `--list` + gallery /browse fallback paths.
 */
export function listPackIds(registry: Registry): string[] {
  return [...new Set(registry.packs.map((p) => p.id))].sort();
}
