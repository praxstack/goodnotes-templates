# Iteration-4 findings · full detail

> Each finding has: ID, severity, category, file · line range, evidence,
> recommendation, effort, priority. IDs use the `FIND-I4-NNN` namespace to
> avoid collision with iter-1–3 (`FIND-0001…FIND-0028`).

---

## FIND-I4-001 — PII committed to git (**CRITICAL**)

| | |
|---|---|
| **Severity** | Critical (CVSS ≈ 6.5 Medium technically, but Critical by project policy) |
| **Category** | Security · privacy · policy-violation |
| **CWE** | CWE-532 (Information exposure through log/file) / CWE-200 |
| **File** | `packages/packs-prax-journal/profile.local.json` (164 lines of real PII) |
| **Git status** | Tracked since commit `dcf13a7` ("feat(packs): W5 · big-bang 22 packs → packages/packs-*") |
| **Priority** | **P0 · fix this sprint · this is the highest-risk issue in the repo** |
| **Effort** | XS (0.5 person-days) |

### Evidence

```
$ git ls-files --error-unmatch packages/packs-prax-journal/profile.local.json
packages/packs-prax-journal/profile.local.json

$ git check-ignore -v packages/packs-prax-journal/profile.local.json; echo "exit=$?"
exit=1                                                    # ← not ignored

$ git log --oneline -- packages/packs-prax-journal/profile.local.json
dcf13a7 feat(packs): W5 · big-bang 22 packs → packages/packs-*

$ head -25 packages/packs-prax-journal/profile.local.json
{
  "schema_version": 1,
  "user": {
    "name": "<REDACTED full name — maintainer>",
    "pronouns": "he/him",
    ...
  },
  "therapists": [
    { "role": "psychiatry", "name": "<REDACTED psychiatrist full name>",
      "credentials": "<REDACTED medical credentials>",
      "registration_number": "<REDACTED MCI reg number>",
      ...
    }
  ],
  "medications": [
    { "name": "<REDACTED brand-name prescription medication>", "dose": "weekly pen", ... },
    ...
  ]
}

$ grep -E 'profile|\.env|\.local|secret' .gitignore
.env
.env.local
# profile.json holds medications, therapist names, and baselines.
packs/journals/prax-journal/profile.json         # ← pre-W5 path
packs/journals/prax-journal/profile.*.json       # ← pre-W5 path
!packs/journals/prax-journal/profile.example.json
```

### Why this is critical

1. `docs/plan-ceo-review-v4-five-decisions-locked.md` Q4 locks the decision
   that "profile.json = data-only reference, templates stay hardcoded · **G3
   critical (PII not in repo)**".
2. `packages/core/src/types/profile.ts` module header explicitly states: "the
   real profile.json contains PII (meds + therapist names) and must **never**
   be committed to git. Only profile.example.json — which holds generic
   placeholders — is committable."
3. `audit/POST_SPRINT_STATUS.md` claimed this was closed (FIND-0013 /
   overall PII policy).
4. The repo is public on GitHub (`github.com/praxstack/goodnotes-templates`).
   Anyone who clones it today gets the maintainer's medications with
   dosages, their psychiatrist's full name + registration number (MCI
   lookup-able), and their psychologist's name + practice.

### Root cause

The W5 monorepo migration (commit `dcf13a7`) moved source files from
`packs/journals/prax-journal/…` to `packages/packs-prax-journal/…` but
did **not** update the `.gitignore` entries. The original `.gitignore`
blocks `packs/journals/prax-journal/profile.json` and
`packs/journals/prax-journal/profile.*.json` — both of those globs are
now no-ops because no files live at those paths anymore.

### Recommendation

Two-phase fix. Both phases needed.

**Phase A — stop the bleeding (5 min):**

```bash
# 1. Move actual PII out of repo
mv packages/packs-prax-journal/profile.local.json ~/keep-this-private/

# 2. Update .gitignore to match post-W5 paths
cat >> .gitignore <<'EOF'

# W5-era profile paths (superseded pre-W5 `packs/journals/...` rules)
packages/packs-prax-journal/profile.json
packages/packs-prax-journal/profile.*.json
!packages/packs-prax-journal/profile.example.json
!packages/packs-prax-journal/profile.README.md
EOF

# 3. Remove from index
git rm --cached packages/packs-prax-journal/profile.local.json
git commit -m "fix(privacy): block profile.local.json post-W5 migration (FIND-I4-001)"
git push
```

This removes the file from future checkouts, but **git history still
contains the PII at commit `dcf13a7`.**

**Phase B — purge from git history (30 min, requires force-push):**

```bash
# Use git-filter-repo (modern, avoids BFG quirks)
pip install git-filter-repo
git filter-repo \
  --path packages/packs-prax-journal/profile.local.json \
  --invert-paths \
  --force

# Re-add remote (filter-repo strips it)
git remote add origin https://github.com/praxstack/goodnotes-templates.git

# Force-push — coordinate with any collaborators first
git push --force-with-lease origin main
```

After force-push, rotate any secrets that might have leaked (psychiatrist
registration number is public-ish, but treat the combination as sensitive).

### Acceptance criteria

- `git ls-files | grep profile.local` returns nothing.
- `git log --all --full-history -- packages/packs-prax-journal/profile.local.json` returns nothing.
- `.gitignore` blocks the new paths (`git check-ignore -v packages/packs-prax-journal/profile.local.json` exits 0).
- Regression test in `tests/unit/profile.test.ts` asserts that
  `profile.local.json` does not exist in the repo root at test time.

### Prevent recurrence

Add to CI a tiny "no PII paths committed" gate — one `ls-files | grep`
line, fails the build if `profile.local.json` (or any future
`profile.*.json` that isn't `.example.json` or `README.md`) is tracked.

---

## FIND-I4-002 — npm audit regression: 1 high + 5 moderate (Medium)

| | |
|---|---|
| **Severity** | Medium |
| **Category** | Security · supply-chain |
| **File** | `apps/gallery/package.json` (transitive chain via `@astrojs/check`) |
| **CVEs** | GHSA-q3j6-qgpj-74h6, GHSA-v39h-62p7-jpjc (fast-uri HIGH); GHSA-48c2-rrv3-qjmp (yaml MODERATE) |
| **Priority** | P1 |
| **Effort** | XS (0.25 pd) |

### Evidence

```
$ npm audit
fast-uri  <=3.1.1                Severity: high
  fast-uri vulnerable to path traversal via percent-encoded dot segments
  fast-uri vulnerable to host confusion via percent-encoded authority delimiters

yaml  2.0.0 - 2.8.2               Severity: moderate
  yaml is vulnerable to Stack Overflow via deeply nested YAML collections
  Depends on vulnerable versions of yaml → yaml-language-server
                                        → volar-service-yaml
                                        → @astrojs/language-server
                                        → @astrojs/check  (devDep of apps/gallery)

6 vulnerabilities (5 moderate, 1 high)
```

Note: all 6 vulns are **dev-only** (via `@astrojs/check`). The fast-uri
vulnerabilities require an attacker to feed untrusted URLs to the parser;
in our usage `fast-uri` is inside the Astro language-server tooling, not
in any runtime path. Still, it's the kind of thing a user who runs
`npm install` will see in their terminal on first clone, and it erodes
trust in the "0 vulnerabilities" claim from `POST_SPRINT_STATUS.md`.

### Recommendation

```bash
npm audit fix --force
# Installs @astrojs/check@0.9.2 (breaking change per npm's warning but
# @astrojs/check is dev-only; gallery build uses astro check which is
# separately maintained)
npm test
npm run build
```

Then:

- Commit the `package-lock.json` delta.
- Update `audit/POST_SPRINT_STATUS.md` with the new "after" column (this
  is FIND-I4-007 — do it as part of this fix).
- Consider adding `npm audit --audit-level=high` to the CI `verify` job
  (already in `audit.yml` monthly probe; add it to `ci.yml` so it blocks
  PRs). Already present — `.github/workflows/ci.yml` has `Fail if HIGH+
  vulns` step. So the 6 vulns are either pre-existing at the time CI
  last ran green, or CI skipped the run. Confirm by re-running CI on a
  trivial PR after the fix.

### Acceptance criteria

- `npm audit` exits 0 with `"vulnerabilities": {}`.
- CI green on a subsequent PR.

---

## FIND-I4-003 — ESLint globbing matches zero files (Medium)

| | |
|---|---|
| **Severity** | Medium |
| **Category** | Quality · tooling drift |
| **File** | `eslint.config.js` lines 24 (`files: ['src/**/*.ts']`) and 13–20 (ignores include `scripts/**`) |
| **Priority** | P1 |
| **Effort** | XS (0.25 pd) |

### Evidence

```
$ npx eslint 'packages/**/*.ts' 'tests/**/*.ts' 2>&1 | tail -5
If you don't want to lint these files, remove the pattern "scripts/" from …
  * If the file is ignored because no matching configuration was supplied, …

$ npx eslint packages/core/src/puppeteer-renderer.ts
(silent — exits 0 because no config applies to the file path)
```

The `eslint.config.js` flat config has:

```js
{
  files: ['src/**/*.ts'],   // ← pre-W5 path; no file matches this any more
  …rules
},
{
  files: ['tests/**/*.ts'], // ← still valid
  …
}
```

After the W5 monorepo migration, sources live at `packages/core/src/**`,
`packages/cli/src/**`, and ad-hoc at `packages/packs-*/`. None match
`src/**/*.ts`. ESLint still runs, still exits 0, and reports "no files
match" for the tests run — but the core TypeScript rules simply don't
apply to any shipping file.

Scripts (`scripts/**`) are **explicitly ignored** per line 18 of the
config ("ad-hoc dev scripts; out of scope for now"). That was the right
call when `scripts/` was small; it's now ~5.8k LOC.

### Recommendation

```js
// eslint.config.js
{
  files: ['packages/**/*.ts'],           // ← W5-aware
  …same rules as before
},
{
  files: ['scripts/**/*.ts'],             // ← restore
  languageOptions: { … },                 // same as packages/, or looser
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',  // scripts are one-offs; let them be noisy
    'no-empty': 'off',
  },
},
{
  files: ['tests/**/*.ts'],
  …
}
```

Remove `'scripts/**'` from the global `ignores` array. Keep `apps/**`
ignored or add a separate stanza that understands `.astro` files (via
`eslint-plugin-astro`) — that's an engineering decision, not a bug fix.
For now, stopping the silent-no-op is the win.

### Acceptance criteria

- `npx eslint packages/` reports a real count (expect: 0 errors, possibly
  a handful of `no-unused-vars` warnings).
- `npm run lint` in CI fails on a deliberately-introduced unused
  variable.

---

## FIND-I4-004 — Coverage threshold failing (Medium)

| | |
|---|---|
| **Severity** | Medium |
| **Category** | Quality gate |
| **File** | `vitest.config.ts` lines 14–19 (thresholds) vs actual coverage |
| **Priority** | P1 |
| **Effort** | S (1 pd to fix by adding tests; 5 min to fix by lowering threshold) |

### Evidence

```
$ npx vitest run --coverage
…
All files       | 67.64 | 61.99 | 80.89 | 68.32 |
                                ^^^^^^^
                          branches below 75% threshold

ERROR: Coverage for branches (61.99%) does not meet global threshold (75%)
exit 1
```

Thresholds in `vitest.config.ts`:

```ts
thresholds: {
  lines: 60,       // ✓ actual 68.32%
  statements: 60,  // ✓ actual 67.64%
  functions: 55,   // ✓ actual 80.89%
  branches: 75,    // ✗ actual 61.99% — misses by 13 percentage points
}
```

The largest branch-coverage gap is `puppeteer-renderer.ts` at 33.33%
branches — the error paths (stale browser handle, failed sandbox
detection, memory-restart tripwire) are not exercised by unit tests.

### Why this is a gate problem

Either the CI runs `npm test -- --coverage`, in which case every PR
fails and devs are working around it, **or** CI runs `npm test` without
coverage, in which case the threshold is decorative. Both paths are bad:
option A creates gate fatigue; option B makes `vitest.config.ts` say
something the codebase doesn't have to obey.

### Recommendation

**Option 1 — raise coverage** (recommended):

Add ~5 tests to `tests/unit/puppeteer-renderer-*.test.ts` that mock the
Puppeteer surface and exercise error paths:

- stale browser handle → re-launch
- sandbox env detection CI=true vs CI=undefined
- `maybeRestartBrowser` hits/misses threshold (mostly done; extend the
  existing `puppeteer-renderer-restart.test.ts`)
- `renderHTMLToPDFFile` write failure (mock `fs.writeFile` → reject)
- `batchRenderHTML` with 1 failing template → `failures[]` populated

Expected delta: +8–12 percentage points on branches. **Effort: 1 pd.**

**Option 2 — lower threshold to 60% with explicit comment** (cheap,
acceptable):

```ts
thresholds: {
  lines: 60,
  statements: 60,
  functions: 55,
  // Branches ceiling reflects the intentional ~25% unit-test coverage
  // of puppeteer-renderer.ts (Chromium lifecycle is integration, not
  // unit). Raise once FIND-I4-004 Option 1 lands. See iter-4 audit.
  branches: 60,
},
```

Commit the change and re-run CI. **Effort: 5 min.**

Either is acceptable; Option 1 leaves the gate teeth intact.

### Acceptance criteria

- `npm test -- --coverage` exits 0.
- Either coverage ≥ 75% branches or the threshold drops to a number the
  current tests meet with a justifying comment.

---

## FIND-I4-005 — Gallery missing CSP + security headers (Low)

| | |
|---|---|
| **Severity** | Low (mitigated by SSG + no auth + no user input) |
| **Category** | Security · defense-in-depth |
| **File** | `apps/gallery/src/layouts/Layout.astro` (missing `<meta http-equiv="Content-Security-Policy" …>`); no `vercel.json` |
| **Priority** | P2 |
| **Effort** | S (0.5 pd) |

### Evidence

```
$ grep -rEn 'Content-Security-Policy|X-Frame|X-Content-Type|Strict-Transport' apps/gallery
(no matches)

$ ls apps/gallery/ | grep vercel
(no vercel.json)
```

The gallery serves:

- MDX-rendered pack pages (user-controlled content through the MDX body
  — author-controlled for now, but MDX can execute arbitrary JSX).
- Static OG images.
- Pack PDFs as downloads.
- Theme-palette JSON as data.

No JavaScript from third parties today, no forms, no auth, no
cookies — so this is **defense in depth, not an exploit path**. But
shipping without `Content-Security-Policy: default-src 'self'` or
`X-Content-Type-Options: nosniff` is an unnecessary risk once the gallery
starts hosting user-submitted packs (even via PRs merged after CODEOWNERS
review).

### Recommendation

Add `vercel.json` at the repo root (Vercel auto-picks it up):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy",
          "value": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), camera=(), microphone=()" }
      ]
    }
  ]
}
```

Adjust `style-src` if the generated CSS needs `'unsafe-inline'` (it will,
Astro inlines critical CSS by default). Test with
`curl -I https://pretext-templates.vercel.app/ | grep -i 'content-security'`
after deploy.

### Acceptance criteria

- `curl -I` on the live gallery shows the four headers.
- Manual browse — all 29 pack pages, search, remix — no CSP violations
  in DevTools Console.

---

## FIND-I4-006 — Env-var silent-fallback inconsistency (Low)

| | |
|---|---|
| **Severity** | Low |
| **Category** | UX · consistency |
| **File** | `packages/core/src/puppeteer-renderer.ts` lines 53–58 |
| **Priority** | P3 |
| **Effort** | XS (0.25 pd) |

### Evidence

Two env-var-driven knobs sit side by side:

- `PRAX_RENDER_SCALE` — `resolveRenderScale()` silently falls back to
  1.0 on invalid input; but CLI `--render-scale` explicitly validates
  and errors (`packages/cli/src/index.ts` lines 78–95).
- `PRAX_BROWSER_RESTART_EVERY` — `getRestartThreshold()` silently falls
  back to 50; **no CLI equivalent exists to surface typos at that boundary.**

```ts
function getRestartThreshold(): number {
  const raw = process.env.PRAX_BROWSER_RESTART_EVERY;
  if (raw === undefined) return 50;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 50;
}
```

### Why it's worth a note

The internal comment in the render-scale section (lines 211–219)
documents the "silent fallback so a typo'd env var can't brick a
year-long run" principle. It's a reasonable trade-off. But the
inconsistency — one knob gets a CLI-level validator, the other doesn't —
is the kind of drift that becomes an actual bug the next time someone
wires the restart threshold to CLI flags.

### Recommendation

Either:

1. When/if a CLI flag is added for browser restart (not today), mirror
   the `--render-scale` validate-or-error pattern.
2. In the meantime, log a `console.warn` when the env var is present but
   unparseable (single line, ~5 LoC). Keeps silent behavior for typos
   but surfaces them in any operator's terminal.

Non-urgent.

### Acceptance criteria

N/A — documentation / consistency note.

---

## FIND-I4-007 — `POST_SPRINT_STATUS.md` is stale (Low)

| | |
|---|---|
| **Severity** | Low |
| **Category** | Docs drift |
| **File** | `audit/POST_SPRINT_STATUS.md` (dated 2026-04-18) |
| **Priority** | P3 |
| **Effort** | XS (0.25 pd, bundle with FIND-I4-002 fix) |

### Evidence

`POST_SPRINT_STATUS.md` claims "`npm audit` → **0 vulnerabilities** ✓"
and is dated 2026-04-18. Today (2026-05-11) `npm audit` shows 6
vulnerabilities. Nothing wrong with the doc at time of writing; it's
frozen when the world moved on.

### Recommendation

Rename `audit/POST_SPRINT_STATUS.md` → `audit/STATUS.md` and update its
top with a `Last-updated: <date>` field. Add the iter-4 delta to its
tables (new finding column, new "After iter-4 sprint" column).

Or — cheaper — leave `POST_SPRINT_STATUS.md` as the frozen 2026-04-18
snapshot and add a new `audit/STATUS-2026-05-11.md` with the iter-4
numbers. Either is fine; the anti-pattern is leaving the old one as the
top doc people read.

### Acceptance criteria

- Top of `audit/` README points at the current rolling status doc.
- "0 vulnerabilities" claim no longer appears next to today's date.

---

## FIND-I4-008 — preview-server.ts gallery HTML duplicated in dev tooling (Informational)

| | |
|---|---|
| **Severity** | Informational |
| **Category** | Code duplication |
| **File** | `packages/cli/src/preview-server.ts` lines 128–201 (`generateGalleryHTML`) |
| **Priority** | P4 (may never fix) |
| **Effort** | Doc-only (0.25 pd) |

### Evidence

The `preview-server.ts` dev-time gallery generator builds its own
mini-gallery HTML inline (≈75 LoC). The production gallery at
`apps/gallery/` serves a completely different, richer UI. Two
implementations exist of "render a browsable index of packs."

### Why it's intentional (for now)

- `preview-server.ts` runs during dev **before** Astro is built — the
  Astro gallery is static-site-generated, so it needs a separate
  dev-time alternative.
- The two galleries serve different audiences (dev workflow vs public
  marketplace).
- Extracting the HTML template would be over-engineering per AGENTS.md
  §Simplicity First.

### Recommendation

**Don't fix yet.** Document the intent at the top of
`preview-server.ts`:

```ts
// NOTE: `generateGalleryHTML` is intentionally separate from the Astro
// gallery at apps/gallery/. This one runs during dev-loop before Astro
// builds; the public gallery is SSG'd to output. If both grow, extract
// to a shared template module. Today both are <200 LoC and the
// duplication is cheaper than abstraction. See audit/iteration-4/findings.md
// FIND-I4-008.
```

### Acceptance criteria

- Comment added.
- Next iteration auditor knows this is deliberate.

---

## Cross-cutting observations

### The W5 migration checklist that wasn't

Three of the iteration-4 findings (FIND-I4-001 stale .gitignore,
FIND-I4-003 stale ESLint glob, FIND-I4-004 coverage threshold arguably
in the same bucket if `src/` was assumed) share one root cause: the
W5 monorepo migration (`dcf13a7`) moved paths without running the
"what else depends on these paths?" checklist.

A 5-minute post-migration sweep would have caught all three. Suggested
one-time cleanup script, saved as `scripts/post-migration-audit.sh`:

```bash
#!/usr/bin/env bash
# Post-migration audit: find references to pre-W5 paths.
set -euo pipefail
echo "== stale 'packs/' references in config files =="
git grep -En '(packs/journals|packs/planners|src/)' \
  -- '*.json' '*.js' '*.ts' '*.yml' '*.yaml' '.gitignore'
echo
echo "== stale 'packs/' paths in gitignore that match zero files =="
while IFS= read -r pat; do
  if [[ "$pat" =~ ^# ]] || [[ -z "$pat" ]]; then continue; fi
  matches=$(find . -path "./node_modules" -prune -o -path "./$pat" -print 2>/dev/null | wc -l)
  if [[ $matches -eq 0 ]]; then
    echo "  STALE (matches nothing): $pat"
  fi
done < .gitignore
```

Not a finding, but worth adding to `scripts/` per the "prevent recurrence"
principle.
