# Phase 6 — Tests & Quality Gates

## Test execution

**Tool run:** `npx vitest run --reporter=default`

```
Test Files  3 passed (3)
Tests       25 passed (25)
Duration    3.42s
```

Files:
- `tests/unit/dimensions.test.ts` — 6 tests
- `tests/unit/locale.test.ts` — 10 tests
- `tests/unit/daily-year-v2.test.ts` — 9 tests

**CHECKPOINT.md claims "27 tests passing" → ACTUAL 25** (C-10 ✗). Likely stale after test-file deletions during the self-contained refactor.

## Coverage %

**Status:** `NOT MEASURED — @vitest/coverage-v8 not installed.` To avoid side effects (installing packages), coverage was not gathered in this iteration. Tracked in GAPS.

Inferred coverage by mapping: only the `.ts` files with matching tests in `tests/unit/*.test.ts` are covered. Files covered:
- `src/core/dimensions.ts` ✓
- `src/utils/locale.ts` ✓
- `src/templates/planners/daily-year-v2.ts` ✓ (partial — pure-logic only, `buildDayEntries`, `computePageCounts`; `buildMonthHTML`, parser, hyperlink builder uncovered)

Files with **zero test coverage:**
- `src/core/puppeteer-renderer.ts` — T1
- `src/core/pdf-postprocess.ts` — T1
- `src/cli/preview-server.ts` — T1
- `src/cli/index.ts` — T2
- `src/core/svg-renderer.ts` — T2
- `src/core/png-renderer.ts` — T2
- `src/templates/planners/daily-year.ts` — T2 (the v1 planner)
- `src/templates/registry.ts` — T3
- All 9 `scripts/*.ts` — T3

## Test-maturity signals (present/absent)

| Signal | Present? | Evidence |
|---|---|---|
| Contract tests | Absent | No `pact` / OpenAPI contract setup; none applicable — no API surface |
| Property-based tests | Absent | No `fast-check` / `hypothesis`; low benefit here (pure helpers already well-covered) |
| Fuzz tests | Absent | No `atheris` / `libfuzzer` harness; marginal benefit — no untrusted parsers outside `pdf-lib` (itself fuzzed upstream) |
| Visual regression tests | **Partial** | `looks-same` declared as devDep (but depcheck says unused); `vitest.visual.config.ts` referenced in npm script but not present on disk. Incomplete setup. |
| Flaky-test quarantine | Absent | No `@skip`/`retry`/`flaky` marker usage; test suite stable enough at 25 tests |
| Snapshot tests | Absent | No `toMatchSnapshot` usage |
| Mutation testing | Absent | No `stryker` / `mutmut` |

## CI quality gates (see FIND-0008)

`.github/workflows/generate.yml` triggers: `push: { branches: [main], paths: ['src/**', 'package.json'] }` and `workflow_dispatch`. **No `pull_request` trigger.** The workflow runs only `npm ci` + `npx tsx src/cli/index.ts generate` + release-upload. It does NOT run:

- `npm run build` (would catch FIND-0011)
- `npm test` (would catch test regressions)
- `npm audit` (would catch FIND-0005/06)
- any lint

`npm run lint` script exists but references eslint and `--eslintrc` flag syntax that is deprecated for ESLint 9. No `eslint.config.js` in repo. The lint script therefore fails if invoked — see ad-hoc run in Phase 5.

## Proposed additions (targeted, not volume)

| Test | Type | Protects | Effort |
|---|---|---|---|
| `preview-server.test.ts` — bind-localhost | integration | FIND-0001 | XS |
| `preview-server.test.ts` — path-traversal rejected for `../`, `..\\`, symlink | integration | T-01 / Iteration-2 verification | XS |
| `preview-server.test.ts` — filename XSS escaped | unit | FIND-0002 | XS |
| `puppeteer-renderer.test.ts` — launch args depend on `process.env.CI` | unit (via spy) | FIND-0003 | S |
| `pdf-postprocess.test.ts` — `cssToPageRect` roundtrip property (via fast-check optional) | unit | PDF coord correctness | S |
| `pdf-postprocess.test.ts` — bookmark pageIndex clamp | unit | `addBookmarks` edge case | XS |
| `batchRenderHTML.test.ts` — reports failures, non-zero exit | unit | FIND-0017 | S |
| `parseSinglePageTemplate.test.ts` — pathological inputs | unit | FIND-0012 | S (after cheerio swap) |

## Coverage-floor proposal (per-tier, not global)

Per the CODEX-AUDIT guidance:

| Tier | Module set | Branch coverage floor |
|---|---|---:|
| T1 | `preview-server`, `puppeteer-renderer`, `pdf-postprocess` | ≥ 80% line / ≥ 70% branch (they're I/O-heavy — 90% unrealistic) |
| T2 | year planners, svg/png renderers, cli, dimensions, locale | ≥ 70% line |
| T3 | registry, scripts | not enforced |
| T4 | themes, HTML, tests | N/A |

Current T1 coverage is ~0 %. Enforcing a floor is therefore a **target**, not a check — shipping FIND-0016 unlocks it.

## Exit gate

- Coverage % NOT MEASURED — see GAPS G-005.
- Test pass rate cited from live `vitest run` output above.
- CI-gate assessment cited from literal workflow YAML.
