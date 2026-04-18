# Phase 1 — Documentation & Spec Review

## Documentation inventory

| File | Purpose | Status |
|---|---|---|
| `README.md` (304 lines) | User-facing intro, quick-start, arch diagram, roadmap | Present, detailed; some stale claims (see claims ledger) |
| `CLAUDE.md` (38 lines) | Agent routing rules | Present; overstates ("TypeScript monorepo" — it is not) |
| `CONTRIBUTING.md` | Contributor onboarding | Present; references deleted files (`src/core/themes.ts`, `pdfkit-renderer.ts`, `themes.test.ts`) |
| `PROBLEM_STATEMENT.md` (374 lines) | Requirements, NFRs, scope | Present, thorough, labelled "DRAFT — awaiting approval" |
| `RESEARCH.md` | Market + stack research | Present; referenced often |
| `CHECKPOINT.md` | Session notes | Present; worklog nature (not a stable spec) |
| `LICENSE` | MIT | Present (dual-licensed per README: MIT code + CC BY 4.0 assets) |
| `docs/HLD-self-contained-templates.md` (233 lines) | High-level design for theme removal | Present, clear, approved |
| `docs/LLD-self-contained-templates.md` | Low-level execution plan | Present, step-by-step |
| `docs/superpowers/specs/2026-04-10-self-contained-templates-design.md` | Source spec for theme removal | Present, marked Approved |

## Quality rubric (0–5)

| Dimension | Score | Evidence |
|---|---:|---|
| User-facing accuracy | 2 | Multiple stale claims in README (themes.ts, pdfkit-renderer), stub repo URL `yourusername/…` |
| Contributor onboarding | 1 | CONTRIBUTING.md instructs editing files that were deleted in the self-contained refactor |
| Architecture / design | 4 | HLD/LLD/spec are unusually good for a 9-day-old repo |
| Runbook / ops | 0 | No runbook; no rotation, no secrets, no incident flow — N/A for a build tool |
| Release / CHANGELOG | 0 | No CHANGELOG; version `1.0.0` in package.json with no release tag |

## Most important documentation gaps (only listing ones that cause real reader harm)

- **D-1** `README.md` §"Architecture" lists files that don't exist (`themes.ts`, `pdfkit-renderer.ts`) and implies the theming story still works that way. A new reader running `npm install` cannot reconcile the README with the source tree.
- **D-2** `CONTRIBUTING.md` §"How to add a new theme" directs contributors to edit `src/core/themes.ts` — which was deleted. First contribution attempt fails.
- **D-3** `package.json` `repository.url = https://github.com/yourusername/goodnotes-templates` (placeholder), while actual origin is `https://github.com/praxstack/goodnotes-templates`. Affects `npm pkg`, issue trackers, and GitHub linkback.
- **D-4** `README.md` §"Quick Start" tells users to clone `yourusername/goodnotes-templates` → 404 for every external reader.
- **D-5** `README.md` roadmap marks "8 color themes" as ✅ and "Puppeteer-rendered planners" as ☐ — the actual state is the inverse (themes were removed by design; Puppeteer planners exist and ship).
- **D-6** No `CHANGELOG.md`; `CHECKPOINT.md` is not a substitute (narrative, not versioned).
- **D-7** Test count in CHECKPOINT claims "27 tests passing". Current count is 3 test files; will be measured in Phase 6.

None of these are blockers for internal use; they are blockers for external adoption, which is an explicit success metric per `PROBLEM_STATEMENT.md §7`.
