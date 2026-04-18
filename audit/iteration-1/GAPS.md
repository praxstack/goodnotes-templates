# Iteration 1 — Gaps (per-iteration subset)

This is the iteration-scoped view. Merged canonical list lives at `audit/GAPS.md`.

Gaps encountered during iteration-1 (breadth pass):

| ID | Phase | What we tried | Why it failed | Resolution |
|---|---|---|---|---|
| G-001 | Capability probe | Record model pin + temperature in capabilities.json | Cline CLI does not expose these to the agent | Record out-of-band in CI invocation; or switch to an agent that does expose them |
| G-002 | Phase 3 architecture | Run `madge --json` for static dep graph | `madge` not installed; `npx madge` deferred to avoid install churn | `npx madge --circular --json src/` |
| G-003 | Phase 2 supply chain | Generate CycloneDX SBOM via `syft` or `cdxgen` | `syft` not installed; `cdxgen` skipped to stay timely for 244-package tree | `brew install syft && syft dir:. -o cyclonedx-json` (1-time) |
| G-004 | Phase 0 → Phase 2 | Correctly record CI-workflow presence | Phase 0 transient miscall; corrected to "CI exists but does not gate" in Phase 2 | Already corrected in `topology.md` update + `supply-chain.md §2.6` |
| G-005 | Phase 6 tests | Compute line/branch coverage % via `vitest run --coverage` | `@vitest/coverage-v8` not installed; audit did not add packages | `npm i -D @vitest/coverage-v8` + `vitest.config.ts` threshold block |
| G-006 | Phase 8 a11y | Run `lighthouse` / `pa11y` / `axe` against the preview gallery + render a template, convert to PNG, run a11y | Tools not installed; preview is a dev-only tool and Core Web Vitals are not applicable to PDF artifact. Contrast not measured either. | Scripted contrast check on CSS variable pairs; `npx pa11y` per-route if/when needed |

Iteration-2 and Iteration-3 did not produce additional unresolved gaps beyond those above. **G-007** was added during the final consolidation pass to note that the in-context reachability of the `basic-ftp` CVE was argued logically but not verified by a data-flow tool — see `audit/GAPS.md`.
