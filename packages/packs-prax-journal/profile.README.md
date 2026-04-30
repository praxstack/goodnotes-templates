# Prax Journal — `profile.json` workflow

## What this file is

`profile.json` is the **data-only reference** that the AI monthly and
quarterly review generators consume to compute meaningful aggregates
like *"cigs down 2.8 from baseline 10"* or *"mood improving since
Med X started 2026-04-13"*.

It is **not** a template — HTML pages under `versions/` stay hardcoded
(FIND-0010 self-contained invariant). This JSON is read exactly twice:

1. Once by the generator on startup, to validate via
   [`src/types/profile.ts`](../../../src/types/profile.ts).
2. Once per AI review, as reference data for the month/quarter summary.

Locked by decision **Q4** in
[`docs/plan-ceo-review-v4-five-decisions-locked.md`](../../../docs/plan-ceo-review-v4-five-decisions-locked.md).

## PII rule (critical)

**`profile.json` MUST NEVER be committed to git.** It contains:

- Your real name + pronouns
- Therapist names and specialties
- Current medications with dose + cadence + start date
- Personal baselines (cigs/day, chest-kg, etc.)

This repo's [`.gitignore`](../../../.gitignore) blocks:

```
packages/packs-prax-journal/profile.json
packages/packs-prax-journal/profile.*.json      # profile.local.json, profile.bak.json …
!packages/packs-prax-journal/profile.example.json  # explicit allow for the committable seed
```

The test [`tests/unit/profile.test.ts`](../../../tests/unit/profile.test.ts)
includes a **regression guard** (`describe('profile.example.json …')`) that
fails CI if the committed example ever contains real names (`Shreya`,
`Pallavi`, `Prax`). Belt-and-braces: the gitignore prevents commit, the
test prevents accidental copy-paste.

## Bootstrap (one-time setup)

```bash
# From the repo root, inside packages/packs-prax-journal/
cp profile.example.json profile.json

# Edit profile.json with your real data. Every placeholder string
# ("Your Name Here", "Your Psychologist Here", "Example SSRI") must be
# replaced — the schema is strict and will reject empty strings.
$EDITOR profile.json

# Validate immediately:
npx tsx -e "
  import('./src/types/profile.js').then(async ({ parseProfile }) => {
    const { readFileSync } = await import('node:fs');
    const p = parseProfile(JSON.parse(readFileSync('packages/packs-prax-journal/profile.json', 'utf8')));
    console.log('✅ profile.json valid — user:', p.user.name);
  });
"
```

## Schema at a glance

See [`src/types/profile.ts`](../../../src/types/profile.ts) for the
source of truth. Shape:

```jsonc
{
  "schema_version": 1,           // bump if fields change shape
  "user": {
    "name": "...",               // required, non-empty
    "pronouns": "...",           // optional
    "tz": "Asia/Kolkata",        // IANA string, defaults to Asia/Kolkata
    "locale": "en-IN"            // defaults to en-IN
  },
  "therapists": [                // optional array (default [])
    {
      "role": "psychology" | "psychiatry" | "coach" | "medical" | "other",
      "name": "...",
      "notes": "..."             // optional
    }
  ],
  "medications": [               // optional array (default [])
    {
      "name": "...",
      "dose": "...",
      "cadence": "...",
      "started_on": "YYYY-MM-DD", // optional, strict ISO
      "purpose": "..."           // optional
    }
  ],
  "named_patterns": [            // optional array (default [])
    { "name": "...", "reframe": "..." }
  ],
  "baselines": {                 // optional record<string, number>
    "cigs_per_day": 10
  }
}
```

## Validation rules the generator enforces

- **Strict mode** — unknown fields fail with a listed path.
- `schema_version` must be a positive integer **≤ the current supported
  version** (bump the generator before bumping the profile).
- `user.tz` must match IANA `Area/Location` format.
- `medication.started_on` must be strict `YYYY-MM-DD`.
- `baselines.*` values must be finite numbers (no `NaN`, no `Infinity`).
- Every required string must be non-empty.

On failure the generator throws `ProfileParseError` with up to 5
inline issues plus an overflow count. Every issue carries the JSON
path so you can grep for it in the file.

## When to bump `schema_version`

Bump only when the **shape changes in a backwards-incompatible way**
(rename a field, remove a field, change a type). Adding an optional
field is backwards-compatible — keep the version and document it in
the schema file's top comment.

Current version: **`1`** (initial v5.3 shape, 2026-04-29).

## Related reading

- CEO decision Q4: [`docs/plan-ceo-review-v4-five-decisions-locked.md`](../../../docs/plan-ceo-review-v4-five-decisions-locked.md)
- Eng review G3 critical: [`docs/plan-eng-review-v4-five-decisions.md`](../../../docs/plan-eng-review-v4-five-decisions.md)
- Schema source: [`src/types/profile.ts`](../../../src/types/profile.ts)
- Tests (acceptance criteria): [`tests/unit/profile.test.ts`](../../../tests/unit/profile.test.ts)
