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
        { role: 'psychology', name: '<REDACTED-PSYCH-FIRST>', notes: 'jar + body work' },
        { role: 'psychiatry', name: 'Dr <REDACTED-PSYCH-FIRST-DR> <REDACTED-PSYCH-LAST-DR>' },
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
    expect(raw).not.toMatch(/\b<REDACTED-PSYCH-FIRST>\b/u);
    expect(raw).not.toMatch(/\b<REDACTED-PSYCH-FIRST-DR>\b/u);
    expect(raw).not.toMatch(/\bPrax\b/u);
  });
});

// ─── Repo-wide PII guard (post-C4 code-review P0 fix) ────────────
//
// Addresses the finding from the C2+C3+C4 review: G3 "close the PII
// leak" was structurally incomplete because the real surface was
// embedded in template HTML (Rx card, therapist attributions) and
// pack-level docs. This test expands the guard from the example file
// to the entire tracked repo. It walks every non-binary, non-test
// file under the paths below and fails the build if any of the
// identity tokens reappear.
//
// Scope excludes:
//   - tests/ itself (this file legitimately names the tokens)
//   - profile.README.md (documents what the tokens are that we block)
//   - node_modules/ (obviously)
//   - tests/visual/baselines/*.png (binary)
//   - audit/ (historical audit captures that predate C4; frozen by
//     design and require a separate conversation to rewrite)
const PII_TOKENS: ReadonlyArray<RegExp> = [
  /\b<REDACTED-PSYCH-FIRST>\b/u,
  /\b<REDACTED-PSYCH-FIRST-DR>\b/u,
  /\b<REDACTED-PSYCH-LAST-DR>\b/u,
];

// Directories the guard walks. Kept explicit so a future contributor
// adding a new top-level dir (e.g. examples/) thinks about whether it
// needs to be in scope.
const PII_GUARD_ROOTS: ReadonlyArray<string> = [
  'packs',
  'src',
  'shared',
  'scripts',
  'docs',
];

function* walk(dir: string): Generator<string> {
  // Lazy walk using sync readdir so the test stays deterministic and
  // vitest-friendly. Nothing here is fast-path, so the 40ms cost is fine.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  let entries: ReturnType<typeof fs.readdirSync>;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
      continue;
    }
    yield full;
  }
}

function isTextFile(p: string): boolean {
  // Cheap allow-list. Extending this is fine; false negatives are
  // caught by binary files being skipped below.
  return /\.(md|mdx|ts|tsx|js|jsx|mjs|cjs|json|html|css|svg|txt|yml|yaml)$/u.test(p);
}

describe('Repo-wide PII guard (post-code-review P0)', () => {
  it('no PII token appears in packs/ · src/ · shared/ · scripts/ · docs/', () => {
    const hits: Array<{ file: string; token: string }> = [];

    for (const root of PII_GUARD_ROOTS) {
      const abs = path.join(REPO_ROOT, root);
      for (const file of walk(abs)) {
        if (!isTextFile(file)) continue;
        // Skip our own test file — it legitimately names the tokens
        // in order to block them.
        if (file.endsWith('tests/unit/profile.test.ts')) continue;
        // profile.README.md documents what the blocked tokens ARE
        // (for the PII-rule explanation), so it is out of scope.
        if (file.endsWith('profile.README.md')) continue;
        // Gitignored per-user profiles (`profile.local.json`,
        // `profile.prax.json`, …) are the *intended* home for PII —
        // the whole point of the guard is ensuring PII doesn't leak
        // out of them into templates/docs. They're excluded from the
        // commit via `.gitignore` (pattern: `profile.*.json` with a
        // negation for `profile.example.json`), so the guard has no
        // business inspecting them. Match the same shape here.
        {
          const base = path.basename(file);
          if (
            /^profile\..+\.json$/u.test(base) &&
            base !== 'profile.example.json'
          ) {
            continue;
          }
        }


        const content = readFileSync(file, 'utf8');
        for (const re of PII_TOKENS) {
          const match = content.match(re);
          if (match) {
            hits.push({
              file: path.relative(REPO_ROOT, file),
              token: match[0],
            });
          }
        }
      }
    }

    if (hits.length > 0) {
      const preview = hits
        .slice(0, 10)
        .map((h) => `  • ${h.file} → "${h.token}"`)
        .join('\n');
      const overflow = hits.length > 10 ? `\n  … and ${hits.length - 10} more` : '';
      throw new Error(
        `PII guard tripped — ${hits.length} match${hits.length === 1 ? '' : 'es'}:\n${preview}${overflow}\n\n` +
          'Real names (therapists, psychiatrists, the user) MUST NOT live in templates or docs. ' +
          'They belong in profile.local.json (gitignored). See packs/journals/prax-journal/profile.README.md.',
      );
    }
    expect(hits).toHaveLength(0);
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
        'allergies',           // v2
        'baselines',
        'emergency_contact',   // v2
        'medications',
        'named_patterns',
        'schema_version',
        'therapists',
        'user',
      ].sort(),
    );
  });
});

// ─── P3 fix: schema_version float rejected with a targeted message ────
//
// Original code-review P3: parseProfile's fast-path for "newer schema
// version" only fires for integer versions. A caller passing 1.5 or 2.3
// falls through to the generic strict parse which produces a less-helpful
// "expected integer" error. This test locks the *current* behavior (the
// fast-path doesn't fire → we still get a ProfileParseError with Zod's
// message), then documents why that is acceptable:
//
//   Zod's own "expected integer" message is path-precise and actionable.
//   Our fast-path is specifically tuned for "valid integer, but too new";
//   a float is never valid, so the generic path IS the right answer.
//
// If the fast-path is ever extended to cover floats, this test becomes
// the anchor for the new behavior.
describe('ProfileSchema — schema_version float case (P3 doc-lock)', () => {
  it('rejects schema_version 1.5 with a strict-parse error (not the fast-path)', () => {
    try {
      parseProfile(makeProfile({ schema_version: 1.5 }));
      throw new Error('expected parseProfile to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(ProfileParseError);
      const err = e as ProfileParseError;
      // Should mention 'integer' because Zod's .int() check fired.
      expect(err.message.toLowerCase()).toContain('integer');
      // And must NOT claim the version is newer than supported — that's
      // the fast-path message, reserved for genuine integer overshoots.
      expect(err.message).not.toMatch(/newer than this generator supports/u);
    }
  });
});

// ─── P2 fix: empty-string baseline keys rejected explicitly ──────────
//
// Original code-review P2: `z.record(z.string().min(1), z.number().finite())`
// has a well-known Zod 3 gotcha where the key schema's .min(1) does NOT
// run against the actual object keys — so `{ "": 5 }` parses successfully.
// The fix below adds a superRefine that walks Object.keys explicitly.
//
// These tests lock the fix. They fail today (red), pass once the schema
// is patched (green).
describe('Baselines record — empty-string keys rejected (P2 fix)', () => {
  it('rejects { "": 5 } with a clear baselines issue', () => {
    expect(() =>
      parseProfile(makeProfile({ baselines: { '': 5 } })),
    ).toThrow(ProfileParseError);
  });

  it('rejects { "   ": 5 } (whitespace-only key)', () => {
    expect(() =>
      parseProfile(makeProfile({ baselines: { '   ': 5 } })),
    ).toThrow(ProfileParseError);
  });

  it('accepts a normal non-empty key', () => {
    expect(() =>
      parseProfile(makeProfile({ baselines: { cigs_per_day: 10 } })),
    ).not.toThrow();
  });
});

// ─── schema v2: backwards compatibility ─────────────────────────────
//
// v1 → v2 is an additive change: all new fields are optional, so every
// profile that parsed as v1 must still parse as v2 without modification.
// A v1 profile that declared `schema_version: 1` must also still parse
// — the fast-path only rejects versions > PROFILE_SCHEMA_VERSION.
describe('schema v2 — additive compatibility', () => {
  it('PROFILE_SCHEMA_VERSION is 2', () => {
    expect(PROFILE_SCHEMA_VERSION).toBe(2);
  });

  it('still accepts a v1-shaped profile (schema_version: 1) unchanged', () => {
    const v1 = {
      schema_version: 1,
      user: { name: 'V1 User' },
    };
    expect(() => parseProfile(v1)).not.toThrow();
  });

  it('defaults allergies to []', () => {
    const p = parseProfile(makeProfile());
    expect(p.allergies).toEqual([]);
  });

  it('emergency_contact is undefined when absent', () => {
    const p = parseProfile(makeProfile());
    expect(p.emergency_contact).toBeUndefined();
  });

  it('v1 example profile parses as v2 with schema_version: 1 preserved', () => {
    const examplePath = path.join(
      REPO_ROOT,
      'packs/journals/prax-journal/profile.example.json',
    );
    const raw = JSON.parse(readFileSync(examplePath, 'utf-8'));
    // Mutate to v1 shape for this specific test
    raw.schema_version = 1;
    expect(() => parseProfile(raw)).not.toThrow();
  });
});

// ─── schema v2: new optional fields ─────────────────────────────────
describe('schema v2 — user.dob', () => {
  it('accepts a valid ISO dob', () => {
    const p = parseProfile(
      makeProfile({ user: { name: 'U', dob: '1992-08-14' } }),
    );
    expect(p.user.dob).toBe('1992-08-14');
  });

  it('rejects a non-ISO dob with a path-specific message', () => {
    try {
      parseProfile(makeProfile({ user: { name: 'U', dob: '14 Aug 1992' } }));
      throw new Error('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(ProfileParseError);
      const err = e as ProfileParseError;
      expect(err.issues.some((i) => i.path === 'user.dob')).toBe(true);
    }
  });

  it('omits dob when absent (no default)', () => {
    const p = parseProfile(makeProfile());
    expect(p.user.dob).toBeUndefined();
  });
});

describe('schema v2 — user.weight_kg', () => {
  it('accepts a positive finite number', () => {
    const p = parseProfile(
      makeProfile({ user: { name: 'U', weight_kg: 71.2 } }),
    );
    expect(p.user.weight_kg).toBe(71.2);
  });

  it('rejects zero weight', () => {
    expect(() =>
      parseProfile(makeProfile({ user: { name: 'U', weight_kg: 0 } })),
    ).toThrow(ProfileParseError);
  });

  it('rejects negative weight', () => {
    expect(() =>
      parseProfile(makeProfile({ user: { name: 'U', weight_kg: -10 } })),
    ).toThrow(ProfileParseError);
  });

  it('rejects non-finite (Infinity)', () => {
    expect(() =>
      parseProfile(
        makeProfile({ user: { name: 'U', weight_kg: Number.POSITIVE_INFINITY } }),
      ),
    ).toThrow(ProfileParseError);
  });

  it('rejects weight_kg as a string', () => {
    expect(() =>
      parseProfile(makeProfile({ user: { name: 'U', weight_kg: '71 kg' } })),
    ).toThrow(ProfileParseError);
  });
});

describe('schema v2 — allergies', () => {
  it('accepts a flat list of non-empty strings', () => {
    const p = parseProfile(
      makeProfile({ allergies: ['penicillin', 'peanuts'] }),
    );
    expect(p.allergies).toEqual(['penicillin', 'peanuts']);
  });

  it('rejects an empty string entry', () => {
    expect(() =>
      parseProfile(makeProfile({ allergies: ['penicillin', ''] })),
    ).toThrow(ProfileParseError);
  });

  it('rejects non-string entries', () => {
    expect(() =>
      parseProfile(makeProfile({ allergies: [{ name: 'penicillin' }] })),
    ).toThrow(ProfileParseError);
  });
});

describe('schema v2 — emergency_contact', () => {
  it('accepts a minimal contact (name + phone)', () => {
    const p = parseProfile(
      makeProfile({
        emergency_contact: { name: 'Jamie', phone: '+91 98xxx 00000' },
      }),
    );
    expect(p.emergency_contact?.name).toBe('Jamie');
    expect(p.emergency_contact?.phone).toBe('+91 98xxx 00000');
    expect(p.emergency_contact?.relationship).toBeUndefined();
  });

  it('accepts an optional relationship', () => {
    const p = parseProfile(
      makeProfile({
        emergency_contact: {
          name: 'Jamie',
          phone: '+91 98xxx 00000',
          relationship: 'partner',
        },
      }),
    );
    expect(p.emergency_contact?.relationship).toBe('partner');
  });

  it('rejects a contact missing phone', () => {
    expect(() =>
      parseProfile(makeProfile({ emergency_contact: { name: 'Jamie' } })),
    ).toThrow(ProfileParseError);
  });

  it('rejects unknown fields (strict object)', () => {
    expect(() =>
      parseProfile(
        makeProfile({
          emergency_contact: {
            name: 'Jamie',
            phone: '123',
            email: 'oops@no.com',
          },
        }),
      ),
    ).toThrow(ProfileParseError);
  });
});

describe('schema v2 — therapist.specialty', () => {
  it('accepts a non-empty specialty string', () => {
    const p = parseProfile(
      makeProfile({
        therapists: [
          { role: 'psychology', name: 'Dr X', specialty: 'ADHD' },
        ],
      }),
    );
    expect(p.therapists[0]?.specialty).toBe('ADHD');
  });

  it('rejects an empty-string specialty', () => {
    expect(() =>
      parseProfile(
        makeProfile({
          therapists: [{ role: 'psychology', name: 'Dr X', specialty: '' }],
        }),
      ),
    ).toThrow(ProfileParseError);
  });

  it('still accepts a therapist without specialty (v1 shape)', () => {
    const p = parseProfile(
      makeProfile({
        therapists: [{ role: 'psychology', name: 'Dr X' }],
      }),
    );
    expect(p.therapists[0]?.specialty).toBeUndefined();
  });
});
