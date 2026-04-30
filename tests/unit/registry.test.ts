/**
 * tests/unit/registry.test.ts
 *
 * Covers the Zod schemas + parsers in
 * `packages/core/src/types/registry.ts`:
 *   - valid manifest + registry round-trip
 *   - strict mode rejects unknown fields
 *   - every leaf regex (kebab-id, semver, sha256, ISO-8601 datetime)
 *     rejects the shapes it's supposed to
 *   - parser functions throw `RegistryParseError` with the Zod issues
 */

import { describe, expect, it } from 'vitest';
import {
  PackManifestSchema,
  RegistrySchema,
  parseManifest,
  parseRegistry,
  MANIFEST_SCHEMA_VERSION,
  REGISTRY_SCHEMA_VERSION,
  type PackManifest,
  type Registry,
} from '../../packages/core/src/types/registry.js';
import { RegistryParseError } from '../../packages/core/src/errors.js';

// ─── Helpers ────────────────────────────────────────────────────────

const VALID_MANIFEST: PackManifest = {
  schema_version: MANIFEST_SCHEMA_VERSION,
  id: 'prax-journal',
  version: '1.0.0',
  name: 'Prax Journal',
  description: 'CBT-informed daily journal for ADHD · depression · anxiety.',
  category: 'journal',
  author: 'praxstack',
  entry: 'v5/today.html',
};

const VALID_REGISTRY: Registry = {
  schema_version: REGISTRY_SCHEMA_VERSION,
  generated_at: '2026-04-30T19:45:00+05:30',
  source_commit: '88e291b',
  packs: [VALID_MANIFEST],
};

describe('PackManifestSchema', () => {
  it('accepts a minimum-viable valid manifest', () => {
    expect(() => PackManifestSchema.parse(VALID_MANIFEST)).not.toThrow();
  });

  it('accepts optional fields when shape is valid', () => {
    const enriched: PackManifest = {
      ...VALID_MANIFEST,
      tags: ['adhd', 'cbt', 'depression'],
      thumbnail: 'cover.png',
      integrity: 'a'.repeat(64),
      repository: 'https://github.com/praxstack/prax-journal',
      license: 'MIT',
    };
    expect(() => PackManifestSchema.parse(enriched)).not.toThrow();
  });

  it('rejects unknown top-level fields (.strict)', () => {
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, extra_field: 'nope' }),
    ).toThrow();
  });

  it('rejects wrong schema_version', () => {
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, schema_version: 99 }),
    ).toThrow();
  });

  it('enforces kebab-case id', () => {
    const bad = ['Prax-Journal', '-leading', 'trailing-', 'has_underscore', '9lead-digit'];
    for (const id of bad) {
      expect(() => PackManifestSchema.parse({ ...VALID_MANIFEST, id })).toThrow();
    }
    // Leading digits rejected per the regex (id must start with letter).
    // Valid-shape check:
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, id: 'prax-journal-v5' }),
    ).not.toThrow();
  });

  it('enforces semver shape for version', () => {
    const bad = ['1', '1.0', '1.0.0.0', 'v1.0.0', 'latest'];
    for (const version of bad) {
      expect(() => PackManifestSchema.parse({ ...VALID_MANIFEST, version })).toThrow();
    }
    const good = ['0.0.1', '10.20.30', '1.2.3-beta.1', '2.0.0+build.7'];
    for (const version of good) {
      expect(() => PackManifestSchema.parse({ ...VALID_MANIFEST, version })).not.toThrow();
    }
  });

  it('enforces 60-char limit on name and 140-char on description', () => {
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, name: 'x'.repeat(61) }),
    ).toThrow();
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, description: 'x'.repeat(141) }),
    ).toThrow();
  });

  it('rejects non-html entry', () => {
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, entry: 'template.md' }),
    ).toThrow();
  });

  it('rejects non-hex sha256 integrity', () => {
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, integrity: 'z'.repeat(64) }),
    ).toThrow();
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, integrity: 'a'.repeat(63) }),
    ).toThrow();
  });

  it('caps tags at 8 items and enforces kebab-case', () => {
    expect(() =>
      PackManifestSchema.parse({
        ...VALID_MANIFEST,
        tags: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9'],
      }),
    ).toThrow();
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, tags: ['Not-Kebab'] }),
    ).toThrow();
  });

  it('enforces fixed category enum', () => {
    expect(() =>
      PackManifestSchema.parse({ ...VALID_MANIFEST, category: 'random' }),
    ).toThrow();
    // sanity: every declared category passes
    for (const c of ['journal', 'planner', 'tracker', 'notes', 'worksheet', 'cover']) {
      expect(() =>
        PackManifestSchema.parse({ ...VALID_MANIFEST, category: c }),
      ).not.toThrow();
    }
  });
});

describe('RegistrySchema', () => {
  it('accepts a valid registry', () => {
    expect(() => RegistrySchema.parse(VALID_REGISTRY)).not.toThrow();
  });

  it('accepts empty packs array', () => {
    expect(() =>
      RegistrySchema.parse({ ...VALID_REGISTRY, packs: [] }),
    ).not.toThrow();
  });

  it('rejects unknown top-level fields (.strict)', () => {
    expect(() =>
      RegistrySchema.parse({ ...VALID_REGISTRY, extra: 'no' }),
    ).toThrow();
  });

  it('requires ISO-8601 with timezone on generated_at', () => {
    expect(() =>
      RegistrySchema.parse({ ...VALID_REGISTRY, generated_at: '2026-04-30' }),
    ).toThrow();
    expect(() =>
      RegistrySchema.parse({
        ...VALID_REGISTRY,
        generated_at: '2026-04-30T19:45:00', // missing timezone
      }),
    ).toThrow();
    // sanity: Z and +05:30 both pass
    expect(() =>
      RegistrySchema.parse({
        ...VALID_REGISTRY,
        generated_at: '2026-04-30T14:15:00Z',
      }),
    ).not.toThrow();
  });

  it('rejects bogus source_commit', () => {
    expect(() =>
      RegistrySchema.parse({ ...VALID_REGISTRY, source_commit: 'HEAD' }),
    ).toThrow();
    expect(() =>
      RegistrySchema.parse({ ...VALID_REGISTRY, source_commit: 'abc123d' }),
    ).not.toThrow();
  });
});

describe('parseManifest()', () => {
  it('returns the validated value on success', () => {
    const result = parseManifest('test://manifest', VALID_MANIFEST);
    expect(result.id).toBe('prax-journal');
  });

  it('throws RegistryParseError with the source path and issue list', () => {
    const bad = { ...VALID_MANIFEST, version: 'not-semver', id: '-bad' };
    try {
      parseManifest('packages/packs-foo/manifest.json', bad);
      throw new Error('expected parseManifest to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(RegistryParseError);
      const pretextErr = err as RegistryParseError;
      expect(pretextErr.details.source).toBe('packages/packs-foo/manifest.json');
      expect(pretextErr.details.issues.length).toBeGreaterThanOrEqual(2);
      expect(pretextErr.message).toContain('packages/packs-foo/manifest.json');
    }
  });
});

describe('parseRegistry()', () => {
  it('returns the validated value on success', () => {
    const result = parseRegistry('test://reg', VALID_REGISTRY);
    expect(result.packs).toHaveLength(1);
  });

  it('throws RegistryParseError on shape drift', () => {
    const bad = { ...VALID_REGISTRY, schema_version: 99 };
    expect(() => parseRegistry('test://reg', bad)).toThrow(RegistryParseError);
  });

  it('cascades per-pack failures up as a single parse error', () => {
    const badPackRegistry = {
      ...VALID_REGISTRY,
      packs: [{ ...VALID_MANIFEST, id: '-bad-id' }],
    };
    expect(() => parseRegistry('test://reg', badPackRegistry)).toThrow(
      RegistryParseError,
    );
  });
});
