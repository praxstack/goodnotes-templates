/**
 * Unit tests for src/types/profile.ts — the profile.json schema.
 *
 * Tests are the acceptance criteria for decision Q4 + G3 critical.
 * Each test maps to a real failure mode the generator must survive.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ProfileSchema,
  PROFILE_SCHEMA_VERSION,
  ProfileParseError,
  parseProfile,
  type Profile,
} from '../../src/types/profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// ─── Factory ─────────────────────────────────────────────────────
// A minimal-but-valid profile so each test can mutate one thing
// without rewriting the whole blob. Mirrors the shape the generator
// will consume at runtime.
function makeProfile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: PROFILE_SCHEMA_VERSION,
    user: { name: 'Test User' },
    ...overrides,
  };
}

describe('ProfileSchema — happy path', () => {
  it('parses a minimal valid profile and applies defaults', () => {
    const result = parseProfile(makeProfile());
    expect(result.user.name).toBe('Test User');
    // tz + locale have defaults
    expect(result.user.tz).toBe('Asia/Kolkata');
    expect(result.user.locale).toBe('en-IN');
    // arrays + record default to empty
    expect(result.therapists).toEqual([]);
    expect(result.medications).toEqual([]);
    expect(result.named_patterns).toEqual([]);
    expect(result.baselines).toEqual({});
  });

  it('accepts a fully-populated profile', () => {
    const full: unknown = makeProfile({
      user: { name: 'Prax', pronouns: 'he/him', tz: 'Asia/Kolkata', locale: 'en-IN' },
      therapists: [
        { role: 'psychology', name: 'Shreya', notes: 'jar + body work' },
        { role: 'psychiatry', name: 'Dr Pallavi Joshi' },
      ],
      medications: [
        {
          name: 'Placeholder SSRI',
          dose: '10 mg',
          cadence: 'nightly',
          started_on: '2026-04-13',
          purpose: 'depression',
        },
      ],
      named_patterns: [
        { name: 'doomscroll', reframe: 'one tap closes the tab' },
        { name: 'prereq trap' },
      ],
      baselines: { cigs_per_day: 10, chest_kg: 0 },
    });
    const result = parseProfile(full);
    expect(result.therapists).toHaveLength(2);
    expect(result.medications[0]?.started_on).toBe('2026-04-13');
    expect(result.baselines.cigs_per_day).toBe(10);
  });

  it('exposes schema_version as the module constant so consumers match', () => {
    expect(PROFILE_SCHEMA_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(PROFILE_SCHEMA_VERSION)).toBe(true);
  });
});

describe('ProfileSchema — strict mode rejects unknown fields', () => {
  it('throws on a root-level unknown key (typo protection)', () => {
    const bad = makeProfile({ namd_patterns: [] }); // typo of named_patterns
    expect(() => parseProfile(bad)).toThrow(ProfileParseError);
  });

  it('throws on an unknown key inside user', () => {
    const bad = makeProfile({ user: { name: 'X', email: 'leak@example.com' } });
    expect(() => parseProfile(bad)).toThrow(ProfileParseError);
  });

  it('throws on an unknown key inside medication', () => {
    const bad = makeProfile({
      medications: [
        { name: 'A', dose: '1', cadence: 'daily', side_effects: 'many' },
      ],
    });
    expect(() => parseProfile(bad)).toThrow(ProfileParseError);
  });
});

describe('ProfileSchema — schema_version gating', () => {
  it('accepts the current schema version', () => {
    expect(() => parseProfile(makeProfile())).not.toThrow();
  });

  it('rejects a future schema_version with a targeted upgrade message', () => {
    const bad = makeProfile({ schema_version: PROFILE_SCHEMA_VERSION + 1 });
    try {
      parseProfile(bad);
      throw new Error('expected parseProfile to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(ProfileParseError);
      expect((e as Error).message).toMatch(/newer than this generator supports/u);
      expect((e as Error).message).toMatch(/Upgrade the prax-journal package/u);
    }
  });

  it('rejects schema_version 0 (must be positive)', () => {
    expect(() => parseProfile(makeProfile({ schema_version: 0 }))).toThrow(
      ProfileParseError,
    );
  });

  it('rejects schema_version as a string', () => {
    expect(() => parseProfile(makeProfile({ schema_version: '1' }))).toThrow(
      ProfileParseError,
    );
  });
});

describe('ProfileSchema — leaf validation', () => {
  it('rejects empty user.name', () => {
    expect(() => parseProfile(makeProfile({ user: { name: '' } }))).toThrow(
      /user\.name cannot be empty/u,
    );
  });

  it('rejects non-IANA tz strings', () => {
    expect(() =>
      parseProfile(makeProfile({ user: { name: 'X', tz: 'not-an-iana-zone' } })),
    ).toThrow(/tz should be an IANA string/u);
  });

  it('rejects non-ISO started_on date on a medication', () => {
    expect(() =>
      parseProfile(
        makeProfile({
          medications: [
            { name: 'A', dose: '1', cadence: 'daily', started_on: '13-04-2026' },
          ],
        }),
      ),
    ).toThrow(/expected ISO date/u);
  });

  it('rejects NaN in a baseline value', () => {
    expect(() => parseProfile(makeProfile({ baselines: { cigs: NaN } }))).toThrow(
      ProfileParseError,
    );
  });

  it('rejects an unknown therapist role', () => {
    expect(() =>
      parseProfile(
        makeProfile({ therapists: [{ role: 'dentist', name: 'Dr Teeth' }] }),
      ),
    ).toThrow(ProfileParseError);
  });
});

describe('ProfileParseError — diagnostic quality', () => {
  it('carries a structured list of issues with paths', () => {
    const bad = makeProfile({
      user: { name: '', tz: 'bad-tz' },
      medications: [{ name: 'A', dose: '1', cadence: '' }],
    });
    try {
      parseProfile(bad);
      throw new Error('expected parseProfile to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(ProfileParseError);
      const err = e as ProfileParseError;
      expect(err.issues.length).toBeGreaterThanOrEqual(2);
      const paths = err.issues.map((i) => i.path);
      expect(paths).toContain('user.name');
      expect(paths).toContain('user.tz');
    }
  });

  it('caps the preview at 5 issues and mentions the overflow count', () => {
    // Seed 7 distinct leaf-level issues so Zod emits one issue *per violation*.
    // (Zod's strict() collapses multiple unknown keys into a single
    // 'unrecognized_keys' issue, so we use 7 wrong medication objects instead.)
    const bad = makeProfile({
      medications: [
        { name: '', dose: '1', cadence: 'd' },      // user.empty name
        { name: 'A', dose: '', cadence: 'd' },      // empty dose
        { name: 'B', dose: '1', cadence: '' },      // empty cadence
        { name: 'C', dose: '1', cadence: 'd', started_on: 'nope' }, // bad date
        { name: '', dose: '', cadence: 'd' },       // 2 empties → 2 issues
        { name: '', dose: '1', cadence: '' },       // 2 empties → 2 issues
      ],
    });
    try {
      parseProfile(bad);
      throw new Error('expected parseProfile to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(ProfileParseError);
      const err = e as ProfileParseError;
      // 8 distinct issues across the 6 medications; message caps preview at 5.
      expect(err.issues.length).toBeGreaterThanOrEqual(7);
      expect(err.message).toMatch(/… and \d+ more/u);
      // Path precision: each issue carries a `medications.N.field` path.
      expect(err.issues.every((i) => /^medications\.\d+\./u.test(i.path))).toBe(true);
    }
  });
});

describe('profile.example.json — committed seed', () => {
  const EXAMPLE_PATH = path.join(
    REPO_ROOT,
    'packs',
    'journals',
    'prax-journal',
    'profile.example.json',
  );

  it('exists and parses cleanly', () => {
    const raw = readFileSync(EXAMPLE_PATH, 'utf8');
    const parsed: Profile = parseProfile(JSON.parse(raw));
    expect(parsed.schema_version).toBe(PROFILE_SCHEMA_VERSION);
    expect(parsed.user.name.length).toBeGreaterThan(0);
  });

  it('contains NO real PII (sanity guard that protects against accidental copy)', () => {
    const raw = readFileSync(EXAMPLE_PATH, 'utf8');
    // Belt-and-braces: these are the two names the real profile.json will
    // contain. They must NEVER appear in the committed example. If this
    // test fails in CI it means someone overwrote the example with real
    // data before running `git add`.
    expect(raw).not.toMatch(/\bShreya\b/u);
    expect(raw).not.toMatch(/\bPallavi\b/u);
    // Prax's own name also should not leak — he's the only person whose
    // real identity lives in this repo and the example should stay generic.
    expect(raw).not.toMatch(/\bPrax\b/u);
  });
});

describe('ProfileSchema shape stability — regression guard', () => {
  it('keeps all root keys exported and spelled correctly', () => {
    // If someone renames `named_patterns` → `namedPatterns`, every
    // downstream consumer breaks silently. This test fails loud.
    // Zod 3: `.shape` is the public accessor on any ZodObject (including
    // the one returned by `.strict()`).
    const keys = Object.keys(ProfileSchema.shape).sort();
    expect(keys).toEqual(
      [
        'baselines',
        'medications',
        'named_patterns',
        'schema_version',
        'therapists',
        'user',
      ].sort(),
    );
  });
});
