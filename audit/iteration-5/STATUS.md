# Iter-5 Sprint Status — overnight 2026-05-11 → 2026-05-12

> Supersedes: nothing; iter-4 STATUS remains accurate for what iter-4
> closed. This document records what iter-5 landed on top.
>
> Date: 2026-05-12 (early hours local)
> Branch: `main`
> HEAD: `891c1af`
> Council: 1/4 members (Haiku) — Opus×3 rate-limited; single-member call
> still converged cleanly on the prioritized A→B→C→E path.

---

## Summary

Iter-4 closed the iteration-4 findings and called out four remaining-debt
items at the bottom of `audit/iteration-4/STATUS.md`:

| # | Debt item | Iter-5 resolution |
|---|---|---|
| 1 | Raise branch coverage 65 → 75 | ✅ **CLOSED** — 295 tests, branches 79.7% |
| 2 | Drop CSP `'unsafe-inline'` | ⏳ unchanged (unblocked now that T-005 is live) |
| 3 | 10–11 lint warnings | ✅ **CLOSED** — 0 errors, 0 warnings |
| 4 | Verify T-005 headers in prod | ✅ **CLOSED** — 4/4 headers live, smoke-test green |

Also closed an **emergent** finding surfaced during the session:

- **T-005 live gap** — vercel.json committed in `d8c46dd` but production
  returned zero headers. Two stacked root causes: (a) the deploy flow
  used `vercel --cwd=apps/gallery/dist`, which excluded repo-root
  `vercel.json` from the upload surface; (b) the file itself contained
  an invalid `_comment` top-level key which Vercel silently rejects,
  applying zero headers. Both fixed; live verified.

---

## Sprint 1 — P0 remediations (single overnight session)

| Ticket | Commit | Finding | Status |
|---|---|---|---|
| T-I5-001 | `14f9d5d` | T-005 deploy surface gap | ✅ Shipped |
| T-I5-002 | `96740bd` | `_comment` invalid Vercel schema key | ✅ Shipped |
| T-I5-003 | `6e48e2a` | Puppeteer-renderer branch coverage | ✅ Shipped |
| T-I5-004 | `891c1af` | 11 lint warnings | ✅ Shipped |

### T-I5-001 — stage vercel.json into gallery deploy surface

**Root cause.** The deploy flow is `cd apps/gallery && npm run build &&
npx vercel --cwd=dist …`. The `--cwd=dist` flag scopes the upload to
`apps/gallery/dist/`, so the repo-root `vercel.json` never reaches Vercel.
A deploy "succeeds" with zero header rules applied.

**Fix.** New script `apps/gallery/scripts/stage-vercel-config.ts` copies
repo-root `vercel.json` into `apps/gallery/public/` at gallery build
time. Astro copies `public/` verbatim into `dist/`, so the deploy upload
carries the config. Wired into `npm run build`'s pipeline between
PDF staging and `astro build`.

**Guards.**

- `tests/unit/vercel-config.test.ts` — 13 contract tests pinning the
  shape: required headers present, non-empty, CSP names all core
  directives, Referrer-Policy restricted to safe values, Permissions-
  Policy locks down camera/mic/geo, PDF-scoped rule in place, no unknown
  top-level keys, no comment-style keys.
- `scripts/smoke-prod-headers.sh` — curl-based live assertion. Exit 0 on
  4/4 headers, 1 on partial, 2 on unreachable. Usable from CI or
  post-deploy.
- `apps/gallery/.gitignore` adds `public/vercel.json` (source of truth is
  the repo-root copy; avoid two-file drift).

### T-I5-002 — drop invalid `_comment` Vercel schema key

**Root cause.** Vercel's config schema rejects any top-level property
not in its allow-list. `vercel.json` carried an informational
`_comment` at the top — Vercel returned
`Error: Invalid vercel.json - should NOT have additional property "_comment"`
and applied zero headers (silent failure on the web side; an explicit
error on deploy).

**Fix.** Drop the `_comment` key. The information it carried now lives
in `tests/unit/vercel-config.test.ts` and
`apps/gallery/scripts/stage-vercel-config.ts`.

**Recurrence-prevention.** Two new contract tests:
- `has no unknown top-level keys` — pins the Vercel schema allow-list
  we actually use. New keys must be added to the allow-list
  intentionally.
- `is not littered with comment-style keys` — specifically rejects any
  top-level key starting with `_` or `//` (the two common JSON comment
  conventions) with a message explaining why.

### T-I5-003 — puppeteer-renderer branch coverage

**What landed.** `tests/unit/puppeteer-renderer-mock.test.ts` — 17 tests
mocking only the `puppeteer` module (via `vi.mock`), exercising:

- `renderHTMLToPDF` (11 tests): inline-content vs file-path branches,
  color-mode CSS injection (found + not-found warn), request allow-list
  continue/abort, render-scale 1.0 vs !=1.0, multiPage vs single-page
  page.pdf options, render-counter bumps on success but not failure,
  page.close() called in finally on throw.
- `renderHTMLToPDFFile` (2 tests): buffer writes to disk, page-count
  Math.max(1) guard on tiny outputs.
- `batchRenderHTML` (4 tests): success/failure partition across 3 renders,
  onProgress called with (name, 1-indexed, total), zero-templates
  contract, cached-browser launch-count assertion.

Coverage delta:

| File | Metric | Before | After |
|---|---|---|---|
| `puppeteer-renderer.ts` | branches | 33.33% | **91.22%** |
| `puppeteer-renderer.ts` | stmts    | 37.71% | **92.98%** |
| Gated files (overall) | branches | 67.52% | **79.70%** |
| Gated files (overall) | stmts    | 76.59% | **87.43%** |

**Gate raised.** `vitest.config.ts` thresholds: `lines/stmts 60 → 75`,
`functions 55 → 80`, `branches 65 → 75`. Gate now meaningful again.

**Secondary finding.** `eslint.config.js` had the base `no-unused-vars`
active in the `tests/**` block (vs `packages/**`/`apps/**`/`scripts/**`
where it's disabled). The base rule does NOT honor `argsIgnorePattern`,
so `_`-prefixed callback params triggered errors. Mirrored the other
block's pattern (`'no-unused-vars': 'off'` + delegate to the TS plugin's
version).

### T-I5-004 — 11 lint warnings → 0

**Three classes.**

1. **Stale `eslint-disable-next-line` comments** (6 warnings). All
   targeted rules that aren't enabled in the current config — pure
   no-ops. Deleted from:
   - `packages/core/src/puppeteer-renderer.ts` (`no-console` × 2)
   - `tests/unit/profile.test.ts` (`@ts-eslint/no-require-imports` × 2)
   - `tests/visual/v5-snapshots.test.ts` (`no-console` × 2)

2. **Unused local helpers** (2 warnings). `labeledLine` in
   `build-wave1-stickers.ts` and `writingLines` in `build-wave2-stickers.ts`
   are small, self-contained primitives that future stickers will likely
   pull in. Prefixed with `_` and expanded the doc-comment to name the
   intent ("currently unreferenced; kept as documented building block").

3. **Unused imports / args / vars** (3 warnings).
   - `scripts/build-wave2-stickers.ts:479` — `W` arg in the FAST stamp
     body builder. Renamed to `_W`.
   - `scripts/build-wins-jar.ts:15` — unused `SIZE_CLASSES` import.
     Removed.
   - `scripts/safari-probe.ts:51` — unused `bookmarkTitle` import
     (leftover from a previous refactor). Removed.

---

## Phase D (Dependabot) — explicitly deferred

3 Dependabot PRs open: `#1 actions`, `#9 prod`, `#10 dev`. All three
are **major-version bumps** (checkout v4→v6, setup-node v4→v6,
upload-artifact v4→v7, etc.) that move the GH Actions runtime to
Node 24 and change ESM / digest-checking defaults.

**Decision.** NOT merged tonight. These are dependency health tasks that
deserve per-PR CI verification under daylight, not overnight batch
land. Scheduled into next iter-6 sprint; each should get:
- Local CI run on the Dependabot branch.
- A deliberate dry-run of `.github/workflows/generate.yml` to catch the
  upload-artifact v4→v7 ESM surface change.
- A second-look at the download-artifact v7→v8 `digest-mismatch: error`
  default.

Safe to defer: the vulnerabilities are all dev-only (per iter-4 audit),
and `npm audit` stays at 0.

---

## Post-iter-5 health snapshot

| Metric | iter-4 close | iter-5 close |
|---|---|---|
| Critical findings open | 0 | **0** |
| High findings open | 0 | **0** |
| Remaining-debt items | 4 | **1** (CSP unsafe-inline; unblocked) |
| `npm audit` vulns | 0 | **0** |
| `npm run lint` warnings | 11 | **0** |
| `npm test` | 265/265 | **295/295** |
| Coverage branches | 67.5% | **79.7%** (above new 75 gate) |
| Live security headers | 0/4 on prod | **4/4 on prod, smoke-test verified** |
| Pretext-templates-vercel.app live URLs | 15/15 anon 200 | 15/15 anon 200 |
| Health grade | A- | **A** |

---

## Validation commands (re-run any time)

```bash
# Unit + coverage (should pass gates)
npm test -- --coverage      # expect: 295 passed, branches ≥ 75%

# Lint (should be silent)
npm run lint                # expect: 0 errors, 0 warnings

# Type-check (should be silent)
npx tsc -b

# Live T-005 verification
./scripts/smoke-prod-headers.sh   # expect: 4/4 green, exit 0

# Live headers dump (for audit logs)
curl -sI https://pretext-templates.vercel.app/ | grep -iE 'content-security|x-content-type|referrer|permissions'
```

---

## Remaining debt after iter-5

1. **CSP `'unsafe-inline'` in script-src + style-src.**
   Now that the rest of the CSP chain lives in production, we can
   meaningfully tighten. Two options:
   - Migrate Astro's inline scripts to external files (build-time).
   - Add per-script nonces via a Cloudflare edge function / Vercel
     middleware.
   Either is a 1-2 day task; neither was in the iter-5 overnight scope.

2. **3 Dependabot PRs.**
   See deferred section above.

3. **Tiering the coverage gate per-file** (nice-to-have).
   Current gate is overall. Could add per-file floors so
   `pdf-postprocess.ts` (61% branch) doesn't silently regress.

---

## Traceability

- Session plan and execution trace: `audit/iteration-5/SESSION-LOG.md`
- Council decision input: single-member Haiku (Opus throttled); stage-1
  only path per the llm-council skill's documented fallback.
- All commits signed as `Prax Lannister <prakhar.2019ca66@gmail.com>`,
  pushed to `origin/main` as they landed.
