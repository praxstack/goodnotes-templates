# Test Strategy — iteration-4

## 1. Where we are

- **Test files:** 18 unit + 1 visual + 1 e2e = **20 files**
- **Passing tests:** 235/235 (vitest 4.1.4)
- **Runtime:** ~680 ms for unit, ~140 ms for property tests
- **Coverage (v8, on included files only):**
  - Statements: **67.64%**
  - Branches: **61.99%** ← fails the 75% threshold in `vitest.config.ts`
  - Functions: **80.89%**
  - Lines: **68.32%**

### Coverage per module (current)

| Module | Stmts | Branch | Funcs | Lines | Test file(s) |
|---|---:|---:|---:|---:|---|
| `cli/src/preview-server.ts` | 87.2 | 71.7 | 100 | 87.95 | `preview-server.test.ts` (well-covered) |
| `core/src/svg-renderer.ts` | 100 | 90.6 | 100 | 100 | `svg-renderer.test.ts` |
| `core/src/standalone-builder.ts` | high | — | — | — | `standalone-builder.test.ts` (11 tests) |
| `core/src/pdf-postprocess.ts` | 61.7 | 61.4 | 55.6 | 64.5 | `pdf-postprocess.test.ts` + property test |
| `core/src/puppeteer-renderer.ts` | **27.0** | **33.3** | **33.3** | **23.8** | `puppeteer-renderer-restart.test.ts` (6 tests) — deliberately minimal |
| `core/src/dimensions.ts` | 55 | 75 | 80 | 61.1 | `dimensions.test.ts` |
| `core/src/utils/locale.ts` | 50.6 | 51.2 | 83.3 | 50.6 | `locale.test.ts` |

## 2. The coverage-threshold problem (FIND-I4-004)

`vitest.config.ts` says branches ≥ 75; reality is 61.99. The root
cause is `puppeteer-renderer.ts` (33.33% branches) — the error paths
(stale browser handle, sandbox-env detection, memory-restart tripwire)
are not exercised by unit tests. This is **intentional** per the iter-1
philosophy that Chromium lifecycle is an integration concern. The
threshold just hasn't kept up.

## 3. Target pyramid

```
        /\
       /  \   E2E (playwright)        gallery-smoke.spec.ts
      / 5% \  ————————————————————    (1 file · keep as smoke only)
     /——————\
    /        \  Integration / visual   tests/visual/v5-snapshots.test.ts
   /   ~15%   \ ——————————————————    sharp pixel-diff · 0.5% budget
  /————————————\                       + tests/integration/ (add one
 /              \                        for CLI→PDF contract · ~1 pd)
/      80%       \  Unit · vitest      18 files, 235 tests
/                 \ ——————————————     covering splice · profile · pdf-splice
/___________________\                   · pdf-postprocess · standalone-builder
                                        · dimensions · render-scale · restart
                                        · scaffold · svg-renderer · preview-server
                                        · registry · locale · errors
```

Units ≈ 80%, visual + integration ≈ 15%, E2E ≈ 5%. We're at roughly
90 / 5 / 5 today — only one E2E file and no real integration tests.
The ratio is fine; the depth of the unit layer around `puppeteer-renderer`
is what needs lifting.

## 4. Proposed new tests (priority order)

### Tier 1 — unblock the branch-coverage gate (~1 pd · FIND-I4-004)

Create `tests/unit/puppeteer-renderer-errors.test.ts` with:

1. `getBrowser()` re-launch on stale handle.
   - Setup: invoke `getBrowser()`, mock `b.connected` to return `false`, re-invoke.
   - Assert: a fresh Puppeteer launch happens; old promise is discarded.
2. `getChromiumLaunchArgs()` branching on `process.env.CI`,
   `DOCKER_CONTAINER`, `GITHUB_ACTIONS` (all three set vs none).
   - Assert: `--no-sandbox` is present when any env var is set; absent otherwise.
3. `resolveColorModeCSS()` falls through both candidates when neither
   file exists.
   - Setup: mock `fs.readFile` to reject for both paths.
   - Assert: returns `null`.
4. `batchRenderHTML` with 1 failing template.
   - Setup: mock `renderHTMLToPDFFile` to resolve for template[0], reject for template[1].
   - Assert: `results.length === 1`, `failures.length === 1`, failure message propagated.
5. `renderHTMLToPDFFile` with `fs.writeFile` rejection.
   - Assert: error propagates; `page.close` still called via `finally`.

**Expected coverage delta:** +8–12 pp on branches. Gets branches
past 70%, probably past 75%.

### Tier 2 — regression tests for iter-4 fixes

- `tests/unit/pii-guard.test.ts` (new): `git ls-files` output does
  not contain `profile.local.json`. Covers TICKET-I4-001 acceptance.
- `tests/unit/env-var-validation.test.ts` (new): `getRestartThreshold()`
  warns on non-numeric input (once TICKET-I4-006 lands).

### Tier 3 — structural gaps (not iter-4 blockers; backlog)

- `tests/integration/cli-render.test.ts`: spawns the CLI, renders a
  tiny 1-page fixture HTML via real Puppeteer, asserts PDF is created
  and page count is 1. Covers architecture.md §6 point 1.
- `tests/visual/baselines-refresh.md`: runbook for refreshing pixel-diff
  baselines after v1.0.0 layout changes (addresses G4-003).
- Accessibility: axe-core against `apps/gallery/dist/` output in CI
  (FIND-0018, deferred iter-1).

## 5. Missing test types (inventory)

| Type | Status | Notes |
|---|---|---|
| Unit | ✅ 235 passing | Solid coverage on pure logic |
| Property | ✅ `pdf-postprocess-property.test.ts` using fast-check | Covers invariants of rect validation |
| Integration | ❌ | One CLI→PDF fixture recommended (~1 pd) |
| E2E | 🟡 1 file | `gallery-smoke.spec.ts` via Playwright; not run in CI |
| Visual regression | 🟡 present but stale | Baselines predate v1.0.0 layout changes |
| Performance | ❌ | No load tests; rendering is CPU-bound but not user-facing real-time |
| Security SAST | ✅ semgrep + gitleaks via `scripts/audit.sh` | Run monthly via `audit.yml` |
| Accessibility | ❌ | Deferred — FIND-0018 |
| Contract | n/a | No API surface |

## 6. CI/CD quality gates

### Today

- `.github/workflows/ci.yml` runs on every PR + push to main: `npm ci · build · test · npm audit --audit-level=high`.
- Monthly: `.github/workflows/audit.yml` re-runs the full audit tool surface (tokei, npm-audit, semgrep, gitleaks) and uploads artifacts.

### Missing gates

| Gate | Current | Proposed |
|---|---|---|
| `npm test -- --coverage` threshold | decorative (see FIND-I4-004) | enforce after TICKET-I4-004 |
| `npm run lint` catches issues | no (FIND-I4-003) | enforce after TICKET-I4-003 |
| `profile.local.json` not tracked | no | add as one-line grep step (TICKET-I4-001) |
| Visual regression | not in CI | keep local-only (baselines are macOS-specific) |
| E2E gallery-smoke | not in CI | add as nightly (not PR blocker — Playwright Chromium install is slow) |

## 7. Test-strategy principles (from iter-1, still valid)

1. **Cover the logic, not the coverage percentage.** Pure functions
   (splice, profile-schema, pdf-postprocess, standalone-builder) get
   heavy unit coverage. Chromium lifecycle stays integration-y.
2. **Property-based tests for invariants.** We already have
   fast-check on pdf-postprocess; consider extending to splice's
   `buildPageSequence` (monotonic, no gaps, correct kinds per date).
3. **Tests document policy.** Where a test exists, it's a contract.
   `prax-journal-renderer.test.ts`'s 30 tests anchor the PII
   substitution contract; don't remove them during refactors.
4. **No synthetic tests to hit coverage.** Raising `branches` from 62
   to 75 by mocking internal state with no real assertions is worse
   than a lower threshold. Prefer Option 1 (real tests on real paths)
   or Option 2 (honest threshold).

## 8. Roadmap (test-layer · 4 weeks, but ~1 pd of actual work)

```
Week 1: ████ TICKET-I4-004 (5 new tests in puppeteer-renderer-errors.test.ts)
        → branch coverage 62% → ~72-77% → gate passes

Week 2: ▌ Add pii-guard regression test after TICKET-I4-001 lands
        ▌ Add env-var-validation test after TICKET-I4-006 lands

Week 3+ (post-iter-4, backlog):
        █ Integration test: CLI→PDF contract
        █ Refresh visual-regression baselines
        █ axe-core integration (FIND-0018 closure)
```

## 9. Coverage targets (post iter-4 Sprint 2)

| Dimension | Current | Sprint-2 target | 6-month stretch |
|---|---:|---:|---:|
| Statements | 67.64 | 75 | 85 |
| Branches | 61.99 | 75 | 80 |
| Functions | 80.89 | 85 | 90 |
| Lines | 68.32 | 75 | 85 |

Stretch targets depend on integration + a11y tests landing, which are
outside this sprint's scope.

## 10. What "done" looks like

After Sprint 2:

- `npm test -- --coverage` exits 0.
- `npm run lint` actually lints.
- `npm audit` says 0.
- A regression test proves `profile.local.json` stays out.
- CI's quality gates are functioning, not decorative.

That's the test-strategy delta the iter-4 sprint is buying.
