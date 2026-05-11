# Implementation Roadmap — iteration-4

> Takes the 8 iter-4 findings and turns them into sprint-sized tickets
> with priority, effort, dependencies, and acceptance criteria.
> Machine-readable version in [`IMPLEMENTATION_ROADMAP.csv`](./IMPLEMENTATION_ROADMAP.csv).

## Priority scoring (used by the rows below)

```
P0 (Critical): risk 9-10  · fix this sprint
P1 (High):     risk 7-8   · next sprint
P2 (Medium):   risk 4-6   · next release
P3 (Low):      risk 1-3   · backlog
P4 (Info):     risk 1     · doc/comment only
```

## Sprint 1 — 1 day — P0 + cheap P1

> Goal: close the only critical and unblock the silent-failure guardrails
> that have drifted since W5.

### TICKET-I4-001 · Remove PII from git + fix .gitignore (P0)

- **Finding:** FIND-I4-001
- **Effort:** 0.5 pd
- **Owner:** Maintainer (requires force-push coordination)
- **Dependencies:** none
- **Affected files:**
  - `packages/packs-prax-journal/profile.local.json` (remove from tree + history)
  - `.gitignore` (update with post-W5 paths)
  - `.github/workflows/ci.yml` (add a "no-PII gate" check)
  - `tests/unit/profile.test.ts` (regression test)
- **Acceptance criteria:**
  - [ ] `git ls-files | grep profile.local` returns nothing
  - [ ] `git log --all --full-history -- packages/packs-prax-journal/profile.local.json` returns nothing
  - [ ] `git check-ignore -v packages/packs-prax-journal/profile.local.json` exits 0
  - [ ] New regression test asserts the file is not tracked
  - [ ] CI step fails on a PR that deliberately commits a `profile.*.json` file that isn't `profile.example.json`
- **Testing needed:**
  - Add a unit test in `tests/unit/profile.test.ts` that shells out to `git ls-files` and asserts no `profile.local.json` is tracked.
  - Manual verification: clone the repo fresh after force-push, confirm PII is gone from history via `git log --all -p`.
- **Rollback strategy:**
  - The force-push is irreversible for history. Before running `git filter-repo`, back up the repo:
    `git clone --mirror . ../goodnotes-templates.backup.git`.
    Keep the backup offline until the maintainer is confident. After that, delete.
- **Runbook:**
  ```bash
  # Phase A — stop the bleeding
  mv packages/packs-prax-journal/profile.local.json ~/private/
  cat >> .gitignore <<'EOF'

  # W5-era profile paths (post-monorepo-migration)
  packages/packs-prax-journal/profile.json
  packages/packs-prax-journal/profile.*.json
  !packages/packs-prax-journal/profile.example.json
  !packages/packs-prax-journal/profile.README.md
  EOF
  git rm --cached packages/packs-prax-journal/profile.local.json
  git commit -m "fix(privacy): block profile.local.json post-W5 (FIND-I4-001)"
  git push

  # Phase B — purge from history
  pip install git-filter-repo
  git clone --mirror . ../goodnotes-templates.backup.git
  git filter-repo \
    --path packages/packs-prax-journal/profile.local.json \
    --invert-paths --force
  git remote add origin https://github.com/praxstack/goodnotes-templates.git
  git push --force-with-lease origin main
  ```

### TICKET-I4-002 · npm audit fix --force (P1)

- **Finding:** FIND-I4-002
- **Effort:** 0.25 pd
- **Owner:** Any contributor
- **Dependencies:** none
- **Affected files:** `package-lock.json`, `apps/gallery/package.json` (possibly)
- **Acceptance criteria:**
  - [ ] `npm audit` exits 0 with zero vulns
  - [ ] `npm test` still passes 235/235
  - [ ] `npm run build` (gallery) still builds
- **Testing needed:**
  - Re-run full test suite
  - Rebuild Astro gallery locally; sanity-check the first 3 pack pages render
- **Rollback:** Revert `package-lock.json` + `apps/gallery/package.json`.

### TICKET-I4-003 · Fix ESLint glob for post-W5 paths (P1)

- **Finding:** FIND-I4-003
- **Effort:** 0.25 pd
- **Dependencies:** none
- **Affected files:** `eslint.config.js`
- **Acceptance criteria:**
  - [ ] `npx eslint packages/` inspects ≥20 files (expected full core + cli)
  - [ ] `npm run lint` in CI fails on an artificially-introduced unused variable in a `packages/**/*.ts` file
- **Diff:**
  ```js
  // eslint.config.js — before
  ignores: [..., 'scripts/**', ...]
  files: ['src/**/*.ts']      // ← stale

  // after
  ignores: [... (remove 'scripts/**') ...]
  files: ['packages/**/*.ts']
  // + new block:
  { files: ['scripts/**/*.ts'],
    languageOptions: {...},
    rules: { '@typescript-eslint/no-unused-vars': 'off', 'no-empty': 'off' } }
  ```

## Sprint 2 — ~2 days — quality gates + gallery hardening

### TICKET-I4-004 · Restore branch-coverage gate (P1)

- **Finding:** FIND-I4-004
- **Effort:** 1.0 pd (Option 1) or 0.1 pd (Option 2)
- **Affected files:** `tests/unit/puppeteer-renderer-*.test.ts`, `vitest.config.ts`
- **Path A (recommended):** add 5 tests in `tests/unit/puppeteer-renderer-errors.test.ts`:
  - stale browser handle → re-launch (mock `b.connected = false`)
  - CI env detection branches (`CI=1`, `DOCKER_CONTAINER=1`, `GITHUB_ACTIONS=1` × missing)
  - `resolveColorModeCSS` 404 fallthrough
  - `batchRenderHTML` with 1 failing template → assert `failures[]` length 1 + exit-worthiness
  - `renderHTMLToPDFFile` with `fs.writeFile` rejection
- **Path B:** lower `branches` threshold to `60` with justifying comment referencing this finding.
- **Acceptance criteria:**
  - [ ] `npm test -- --coverage` exits 0
  - [ ] CI is actually enforcing the gate (run a deliberately-under-threshold PR to verify)

### TICKET-I4-005 · Gallery security headers via vercel.json (P2)

- **Finding:** FIND-I4-005
- **Effort:** 0.5 pd
- **Affected files:** new `vercel.json` at repo root
- **Acceptance criteria:**
  - [ ] `curl -I https://pretext-templates.vercel.app/` shows 4 headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
  - [ ] Browse all 29 pack detail pages — no CSP console violations
  - [ ] `curl -I ...` on one pack PDF shows `Content-Type: application/pdf` (content-sniffing defeated)
- **Risk:** Overly-tight CSP could break Astro's hydration / inline CSS. Start permissive (`'unsafe-inline'` on style-src) then tighten.
- **Testing needed:** Deploy to Vercel preview; test on 3 browsers (Chrome, Safari iPad, Firefox).

### TICKET-I4-006 · Env-var validation parity (P3)

- **Finding:** FIND-I4-006
- **Effort:** 0.25 pd
- **Affected files:** `packages/core/src/puppeteer-renderer.ts` (function `getRestartThreshold`)
- **Acceptance criteria:**
  - [ ] Unparseable `PRAX_BROWSER_RESTART_EVERY` value prints a single `console.warn` line, still falls back to 50
  - [ ] Unit test asserts the warn happens on non-numeric input
- **Code:**
  ```ts
  function getRestartThreshold(): number {
    const raw = process.env.PRAX_BROWSER_RESTART_EVERY;
    if (raw === undefined) return 50;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) return n;
    console.warn(
      `  ⚠ PRAX_BROWSER_RESTART_EVERY="${raw}" is not a valid non-negative integer; falling back to 50`,
    );
    return 50;
  }
  ```

## Sprint 3 — ~1 day — housekeeping

### TICKET-I4-007 · Refresh audit status doc (P3)

- **Finding:** FIND-I4-007
- **Effort:** 0.25 pd
- **Affected files:** `audit/POST_SPRINT_STATUS.md` → `audit/STATUS.md` (or add a dated iter-4 file)
- **Acceptance criteria:**
  - [ ] `audit/README.md` points at the current-of-record doc
  - [ ] The "0 vulnerabilities" claim is no longer presented as current

### TICKET-I4-008 · Document dev-vs-public gallery duplication (P4)

- **Finding:** FIND-I4-008
- **Effort:** 0.25 pd
- **Affected files:** `packages/cli/src/preview-server.ts` (comment-only)
- **Acceptance criteria:** [ ] Comment added at the top of `generateGalleryHTML`.

### Revisit deferred iter-1 items (discussion, not a ticket)

- **Effort:** 0.5 pd (decision + doc)
- Produce a short doc `audit/iteration-4/deferred-decisions.md` with
  stay-deferred/schedule-now recommendation for FIND-0012, -0014, -0018,
  -0028.
  - FIND-0014 (Google Fonts CDN for 26 packs) is the likely candidate
    to graduate — ties in with an eventual performance push and already
    has a precedent (v5 self-hosts).

## Gantt — 3 sprints

```
Week 1, Day 1:  █ T-001 PII  | █ T-002 npm audit | █ T-003 ESLint
Week 1, Day 2:  ██ T-004 coverage tests
Week 1, Day 3:  █ T-005 CSP headers
Week 1, Day 4:  ▌ T-006 env-var | ▌ T-007 status | ▌ T-008 comment | ▌ deferred review
                ————————————————————————————————————————
                Sprint 1       Sprint 2           Sprint 3
                1 pd           2 pd               1 pd       Total ~4 pd
```

## Resource requirements

One maintainer. All tickets are XS-S; no parallelism needed. The only
coordination point is TICKET-I4-001 Phase B (force-push); any other
person with a clone should pull after the rewrite.

## Budget estimate

- Infra: $0 (no new services).
- Tooling: $0 (all tools already installed).
- Labor: ~4 person-days ≈ 0.5–1 work week for a single maintainer.

## Success metrics

Measured on the PR that lands each ticket:

| Metric | Before iter-4 sprint | After (target) |
|---|---|---|
| Critical findings open | 1 | 0 |
| High findings open | 0 (+4 deferred) | 0 (+4 deferred) |
| `npm audit` vulns | 6 (1 high, 5 mod) | 0 |
| `npm run lint` file count | 0 shipping files | ≥20 |
| `npm test -- --coverage` exit | 1 (threshold miss) | 0 |
| Gallery security headers | 0 | 4 |
| `audit/` rolling status up-to-date | ❌ | ✅ |
| Health grade | B | A- |

## Future-beyond-iter-4 (for the next CEO/eng review, not this sprint)

- D1 · Self-host fonts for all 26 non-v5 packs (FIND-0014) — ~8 pd
  incremental (1 pack per touch)
- D2 · axe-core / pa11y gate in CI (FIND-0018) — ~2 pd
- D3 · Visual regression baseline refresh post-v1.0.0 — ~1 pd
- D4 · Editor tier (Tier 3 from `docs/CUSTOMISATION.md`) — 10+ pd,
  deferred on demand-gate
- D5 · Integration test: CLI → PDF contract — ~1 pd
