# Iter-5 · Overnight Session Log — 2026-05-11

Agent: Cline (sonnet-4.7). Mode: Autonomous.
Starting HEAD: `6c08a3a` (iter-4 closed, 265/265 green, 0 vulns, 11 lint warnings).
Constraint: zero compromises on quality/truth/human-touch. Bedrock-only.

---

## Starting state (verified tonight, 23:08 local)

| Gate | Value | Notes |
|---|---|---|
| HEAD | `6c08a3a` | clean tree |
| vitest | 265/265 | ✅ |
| tsc -b | silent | ✅ |
| npm audit | 0 vulns | ✅ |
| lint errors / warnings | 0 / 11 | warnings are dead eslint-disables in scripts + tests |
| branch coverage | 67.5% | gate: 65, target: 75 |
| Live T-005 headers | **NONE** | `vercel.json` committed in `d8c46dd` but `curl -I https://pretext-templates.vercel.app/` returns no CSP/X-CTO/Referrer/Permissions |
| Dependabot PRs | 3 open (#1 #9 #10) | actions · prod · dev groups |
| Live anon health | 15/15 URLs 200 | pack pages, canonical PDFs, themed PDFs |

## Council input (Bedrock · Stage-1 only, 3/4 throttled)

`custom:claude-haiku-4-5` gave a complete prioritized plan.
Opus-4-7, Sonnet-4-6, Opus-4-6 all errored (rate-limit on simultaneous
cross-Opus Stage-1; documented behavior in llm-council skill).

Haiku's rank (adopted with path corrections for this repo's layout):

| Rank | Stream | Reason | Est |
|---|---|---|---|
| 1 | A — Fix live T-005 gap | Credibility breach; unblocks C | 45-75 min |
| 2 | B — Coverage 65→75 | Promised iter-4 work; makes gate meaningful | 2-3 h |
| 3 | C — CSP `unsafe-inline` migration | Depends on A verifying | 2-4 h |
| 4 | G — Dependabot (one at a time) | Entropy reduction | 1-2 h |
| 5 | E — 11 lint warnings | Low leverage; quick satisfaction | 30 min |
| 6 | I — FIND-0012/0028 audit | May already be closed | 30 min |
| skip | D (fonts · 8pd) | Too risky for one night |
| skip | F (Tier 1 expansion) | Feature, not fix — belongs v1.2 |
| skip | H (Tier 3 PoC) | Not blocking v1.0 |

## Path corrections from Haiku's plan (to match actual repo layout)

| Haiku said | This repo uses |
|---|---|
| `test/unit/...` | `tests/unit/...` (plural) |
| `src/puppeteer-renderer.ts` | `packages/core/src/puppeteer-renderer.ts` |
| `npm run test:coverage` | `npm test -- --coverage` |
| `vitest`-style .spec.ts | `.test.ts` (existing convention) |

## Plan for tonight

### Phase A — T-005 live gap (45-75 min)

1. Diagnose: read `vercel.json`, check its schema, look at Vercel deploy history, run a test deploy to a preview URL and curl that preview.
2. Fix based on root cause (most likely: vercel.json was shipped but no deploy has happened against the repo-root since — Vercel might be deploying from apps/gallery subdirectory and ignoring repo-root vercel.json).
3. Add **unit test** asserting vercel.json structure (headers array present, 4 named headers).
4. Add **shell smoke test** in `scripts/smoke-prod-headers.sh` that curls prod and asserts all 4 headers present. Wire into CI later.
5. Commit with TDD discipline: test-first where practical, config fix, verify.

### Phase B — Coverage 65→75 (2-3 h)

- Target: `puppeteer-renderer.ts` branches (33% → ~75%).
- TDD: write failing tests mocking Puppeteer/fs, then expand / verify renderer's existing error handling covers them.
- Don't add error handling for cases the renderer doesn't need — just *test what exists*.
- Commit: `test(core): cover puppeteer-renderer error paths (FIND-I4-004 follow-up)`.

### Phase C — 11 lint warnings (30 min if time remains)

- `npm run lint -- --fix` for the 6 auto-fixable.
- Manual review of remaining 5.
- Commit: `chore(lint): clean up stale eslint-disable directives`.

### Phase D — Dependabot review (if time)

- Read grouped PRs; merge the actions-only one first (lowest risk), then dev, then prod.
- Each merge → run tests → commit.

### Phase E — Final verification + comprehensive log (mandatory)

- Run all gates; publish updated iter-5 STATUS.md.
- gbrain put projects/pretext-templates/night-2026-05-11/final.md
- Commit everything; push to origin; verify live headers + everything that was claimed.

## Guardrails

- **Never claim complete without verification.** Every phase ends with live checks.
- **No silent scope expansion.** If Phase B reveals more uncovered code, note it and stop at 75%.
- **PII hygiene.** No `profile.*.json` except `.example.json` ever touches commits.
- **Atomic commits.** Red-green-refactor visible in the git log.

---

## Execution trace (updated as I go)

(empty — will fill)

---

## Execution trace (actual, not planned)

| Time (IST) | Event |
|---|---|
| 23:06 | Re-read iter-4 STATUS + findings + deferred-decisions |
| 23:08 | Gate probe: 265/265 · 0 audit · 11 lint · 67.5% branches · 0/4 live headers · 3 Dependabot PRs |
| 23:09 | llm-council-plus skill loaded · backend UP |
| 23:14 | Council fired (custom:claude-{haiku,opus-4-7,sonnet-4-6,opus-4-6}) |
| 23:17 | Haiku returned full plan (20k chars); Opus×3 throttled → documented fallback |
| 23:19 | SESSION-LOG.md committed (iter-5 opened) |
| 23:20 | Phase A start: vercel.json + vercel CLI deploy list |
| 23:21 | **Root cause 1 found**: `vercel --cwd=dist` excludes repo-root |
| 23:22 | Wrote `tests/unit/vercel-config.test.ts` (11 tests green first-run) |
| 23:24 | Wrote `apps/gallery/scripts/stage-vercel-config.ts` + wired into build |
| 23:29 | Wrote `scripts/smoke-prod-headers.sh` · proved RED (4/4 missing) |
| 23:31 | Commit `14f9d5d` (Phase A.1) |
| 23:33 | Deploy attempt 1 → **Root cause 2 revealed**: `_comment` rejected |
| 23:34 | Dropped `_comment` from vercel.json · extended contract tests to 13 |
| 23:36 | Deploy attempt 2 → Green. `pretext-templates-lcm9epg75` → alias `pretext-templates.vercel.app` |
| 23:37 | **Live smoke: 4/4 GREEN** (CSP + XCTO + Referrer + Permissions) |
| 23:38 | Commit `96740bd` (Phase A.2) · Phase A **CLOSED** |
| 23:40 | Phase B start: puppeteer-renderer mocking test |
| 23:42 | Wrote `puppeteer-renderer-mock.test.ts` (17 tests, first run 13/17) |
| 23:44 | Iter 1: fixture dir fix (4/17 failing: file-reading fixtures needed real writes, not mocked fs) |
| 23:46 | Iter 2: batchRenderHTML launch-cache subtlety — renderIdx moved into newPage override on the cached browser |
| 23:47 | 16/17 · isolated failure: missing fixture files for batch test → wrote `batch-{a,b,c}.html` |
| 23:51 | 17/17 green · coverage jumped 33.33% → 91.22% on puppeteer-renderer.ts |
| 23:52 | Raised vitest thresholds 60/55/65 → 75/80/75 |
| 23:55 | Discovered test-block `no-unused-vars` bug in eslint.config.js → fixed |
| 00:00 | Commit `6af3df1` (Phase B draft, included polluted fixtures) |
| 00:02 | Refactored fixtures to os.tmpdir mkdtemp, removed repo pollution |
| 00:04 | Amended → commit `6e48e2a` · Phase B **CLOSED** |
| 00:05 | Phase C start: 11 lint warnings categorized (6 stale disables · 5 unused vars/imports) |
| 00:10 | Cleaned all 11 warnings across 7 files |
| 00:11 | Commit `891c1af` · Phase C **CLOSED** · pushed |
| 00:12 | Phase D explicitly deferred (Dependabot major bumps need daylight review) |
| 00:13 | Final gate sweep: 295/295 · lint silent · tsc clean · headers live |
| 00:14 | Phase E: wrote `audit/iteration-5/STATUS.md` |

## Phases closed vs deferred

- ✅ Phase A · T-005 live gap (credibility breach, now closed)
- ✅ Phase B · coverage 65 → 75 (now 79.7%)
- ⏭ Phase C → actually started as ``lint cleanup'' and finished mid-session
- ⏸ Phase D · Dependabot — deferred to iter-6 (major-bump risk, daylight review needed)
- ✅ Phase E · documentation + STATUS landed

## Artefacts this session produced

**Code changes** (all pushed to `origin/main`):
- 4 scoped commits: `14f9d5d`, `96740bd`, `6e48e2a`, `891c1af`
- +605 lines of tests (17 puppeteer-renderer mock + 13 vercel-config contract)
- 2 helper scripts: `scripts/smoke-prod-headers.sh`, `apps/gallery/scripts/stage-vercel-config.ts`
- 1 config fix: `eslint.config.js` tests-block `no-unused-vars` toggle

**Docs & logs**:
- `audit/iteration-5/SESSION-LOG.md` (this file)
- `audit/iteration-5/STATUS.md`
- 4 rich commit messages capturing root cause + fix + recurrence-prevention

**Live artefacts** (production):
- `https://pretext-templates.vercel.app/` now returns CSP + nosniff + Referrer-Policy + Permissions-Policy
- `https://pretext-templates.vercel.app/packs/cornell-notes.pdf` also carries `content-type: application/pdf` (belt-and-braces against MIME sniffing)

## Honest caveats

1. **Council was partial.** 3/4 models throttled. Haiku alone produced the plan. Its path-priors were correct; I path-corrected the repo-specific filenames (`tests/` not `test/`, `packages/core/src/` not `src/`) in flight.
2. **Phase D deferred.** Merging 3 major-bump Dependabot PRs at midnight without per-PR CI verification is lazy. They'll land under daylight with proper verification.
3. **CSP still carries `'unsafe-inline'`.** Iter-5 got it live; iter-6 can tighten. The blocker ("we don't even have CSP live") is gone — now it's "we have CSP; can we tighten it?" which is a different, easier conversation.
