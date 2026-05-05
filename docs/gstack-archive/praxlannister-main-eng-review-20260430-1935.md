---
title: pretext-templates · engineering review v1
status: COMPLETE
created: 2026-04-30T19:35:00+05:30
supersedes: none
descends_from: ceo-plans/2026-04-30-shadcn-for-goodnotes.md
test_plan_artefact: praxlannister-main-eng-review-test-plan-20260430-1735.md
decisions_count: 17  # 13 findings + D1/D2/D3 + D4-D7
mode: FULL_REVIEW
---

# pretext-templates — `/plan-eng-review` v1

Engineering-side review of the approved CEO plan (`ceo-plans/2026-04-30-shadcn-for-goodnotes.md`). Scope: lock architecture, data flow, code quality, tests, and performance before code is written. **No code changes produced** — this is a plan artefact only.

HEAD at review time: `88e291b` (tsc clean · 143/143 tests passing).

## Sprint timeline (updated by D4)

| | **Original CEO plan** | **After eng-review** |
|---|---|---|
| Weeks | 11 | **16** |
| Scope | Full (Approach C + E1-E7) | Full (unchanged) |
| P(ship) | ~25% (both reviewers) | target ≥ 60% |
| Slack buffer | 0 | 5 weeks (covers monorepo hidden breakage, Safari pivot, CI flake) |

---

## Section 0 · Scope Challenge (locked before findings)

**Eureka:** `commander@12.1.0` is already installed and used in `src/cli/index.ts` (6591 bytes, has `render`/`list`/`preview` subcommands today). CEO plan's `citty` recommendation was wrong — overridden.

**D1 — CLI library.** Decision: **KEEP commander@12.1.0**. Zero rework. Boring-by-default win.

---

## Section 1 · Architecture (5 findings)

**ASCII system diagram** (post-monorepo):

```
                              ┌─────────────────────────┐
                              │   pretext-templates.dev │   Astro SSG
                              │   (gallery + MDX docs)  │   Netlify (primary)
                              └────────────┬────────────┘
                                           │ island hydration
                                           ▼
                ┌──────────────────────────────────────────┐
                │  registry.json                           │
                │  primary: pretext-templates.dev/reg.json │
                │  fallback: raw.githubusercontent.com/... │
                └──────┬───────────────────────────────────┘
                       │
   ┌───────────────────┼──────────────────────────────────┐
   │                   │                                  │
   ▼                   ▼                                  ▼
┌──────┐        ┌─────────────┐               ┌──────────────────┐
│ CLI  │        │ packages/   │               │ apps/gallery/    │
│cmdr  │        │   core      │ ← imports →   │  theme-swap E2   │
│ init │◀──────▶│  (splice,   │               │  OG cards E4     │
│ add  │        │  renderer,  │               │  shareable U. E1 │
│ build│        │  themes)    │               │  Codespaces E7   │
│ remix│        └─────────────┘               └──────────────────┘
│rebas.│              │                                  │
└──────┘              ▼                                  ▼
   │           ┌──────────────┐                   ┌────────────┐
   └──────────▶│ puppeteer    │◀──────────────────│ browser    │
               │ restart@50   │                   │ PDF E3     │
               └──────┬───────┘                   │ (Safari??) │
                      │                           └────────────┘
                      ▼
              ┌────────────────┐
              │  output/*.pdf  │
              └────────────────┘
```

**Finding 1.1 — npm workspaces monorepo.** Root + `packages/{core,cli}` + `packages/packs-*` + `apps/gallery`.
**Finding 1.2 — registry.json failover.** Primary `pretext-templates.dev/registry.json`, fallback `raw.githubusercontent.com/praxstack/pretext-templates/main/registry.json`. Both served with `Cache-Control: max-age=300`.
**Finding 1.3 — Extract `packages/core/src/standalone-builder.ts`.** Today 1 real callsite (`scripts/build-standalone-html.ts`); planned callsites add up to 3 (CLI build, gallery PDF, standalone export). Extracted module owns page-sequence → standalone-HTML compilation.
**Finding 1.4 — `semver@7.x`** for pack versioning.
**Finding 1.5 — Codespaces `.devcontainer/devcontainer.json`** on `mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm`, `postCreateCommand: npm ci && npm test`, target < 60s boot.

**D2 — Architecture.** Decision: **Accept all 5 findings**.

---

## Section 2 · Code Quality (4 findings · locked silently)

**Finding 2.1 — `packages/core/src/types/registry.ts`** with Zod schema mirroring `src/types/profile.ts` pattern (schema + parser + typed errors).
**Finding 2.2 — Keep `src/packs.ts`; add `scripts/generate-registry.ts`** that walks `packages/packs-*/manifest.json` and emits `registry.json`.
**Finding 2.3 — DRY standalone-builder** across CLI/gallery/export callsites.
**Finding 2.4 — `packages/core/src/errors.ts`** class hierarchy (ProfileParseError pattern extended to RegistryFetchError, PackNotFoundError, RendererCrashError, StandaloneCompileError).

---

## Section 3 · Tests + Coverage

**Test plan artefact:** `praxlannister-main-eng-review-test-plan-20260430-1735.md` (written in-session).

Summary:
- **5 Playwright E2E flows** (gallery home, pack detail, theme swap, Codespaces boot sim, CLI happy path).
- **6 vitest unit test suites** (registry parser · errors · standalone-builder · semver resolver · CLI sub-commands · devcontainer manifest sanity).
- **2 Docker integration tests** (amd64, arm64 — catches F8 hoisting, F10 V5_PACK_DIR).
- **0 LLM evals** (no LLM in scope).
- **143 existing tests must stay green.** Big-bang monorepo migration (D6) makes this a Week 1 forcing function.

Coverage diagram (baseline 0/50 paths covered — everything post-migration is new code):

```
paths  tested  untested  planned  gap
─────  ──────  ────────  ───────  ───
  50       0        50       50    0   (fully planned, 0 blind spots)
```

---

## Section 4 · Performance (4 findings · locked silently)

**Finding 4.1 — Astro `<Image>` + blurhash** for 3G LCP on gallery.
**Finding 4.2 — Safari mobile 200MB heap test Week 3** with 150dpi fallback (see D7 — kept as-is despite reviewer pushback).
**Finding 4.3 — `PRAX_BROWSER_RESTART_EVERY=50`** already shipped (C7b.3, commit `88e291b`).
**Finding 4.4 — sharp** for 56 OG cards (1200×630 PNG) in < 30s CI budget.

---

## Section 5 · Outside Voice (2 reviewers)

**Reviewer 1 — Adversarial senior staff (new context).** Filesystem-scoped, read CEO plan + test plan + repo reality.

**Reviewer 2 — Claude Opus 4.7 at highest adaptive thinking, 1M context.** Deep systems architect, cold-start principal engineer walking in.

Both independently flagged:

| Concern | Rev 1 | Rev 2 |
|---|---|---|
| Monorepo migration under-budgeted | ✅ | ✅ |
| 11 weeks infeasible for solo | ✅ (P=25%) | ✅ (realistic 18-22w) |
| Safari WebKit mobile PDF is existential risk | ✅ | ✅ |
| Theme-via-override invariant at risk | implied | ✅ explicit |
| Scope can be cut ~40-60% without losing thesis | ✅ | ✅ |

Reviewer 2 additionally produced:
- 9-workstream coupling graph showing 5 of 9 "parallel" lanes actually serialize.
- 10-mode failure taxonomy with likelihood/blast-radius/detection triplets.
- A 200-word "simplest thing that could work" (3-week MVP, 3 packs, static gallery, CLI with init/add/build only).
- Three hardest questions (Safari real-device timing · monorepo fallback · Week-6 scope-creep commitment device).

### Cross-model tensions (surfaced to user)

| Tension | Rev 1 | Rev 2 |
|---|---|---|
| Codespaces | KEEP | CUT |
| Rebrand migration | ADD MIGRATION.md | COSMETIC |

### User decisions on outside voice (D4-D7)

**D4 — Feasibility.** Decision: **16 weeks, keep full scope.** Slack covers monorepo hidden breakage + Safari pivot if required + CI flake. Both reviewers' scope-cut recommendations REJECTED.

**D5 — Codespaces + rebrand tension.** Decision: **Codespaces KEEP as originally planned (Week 3, <60s boot, full documentation).** MIGRATION.md at repo root on first `@pretext-templates/*` publish. Rev 1's full-commitment version wins over my descoped recommendation.

**D6 — Monorepo strategy.** Decision: **Big-bang Week 1. Budget 3-5 days for hidden breakage.** Alternative strangler / defer / hybrid options rejected. Philosophy: fail-fast in Week 1 where slack is cheapest.

**D7 — Safari mobile PDF probe.** Decision: **Keep Week 3 probe as originally planned.** Week-0 spike test rejected. Accept the risk that Week 4-16 may need pivot if Safari fails. *(Reviewer 1 & 2 both pushed for earlier probe — user elected to trust the plan. Logged as explicit risk acceptance.)*

---

## Section 6 · NOT in scope

Explicitly OUT of this review / sprint:

1. **LLM evals** — no LLM features in this plan.
2. **Custom font subsetting for gallery** — use Google Fonts CDN with `display=swap`; subset only if LCP fails Week 3.
3. **Figma plugin** — design doc's "Dream 3" deferred beyond 16 weeks.
4. **Stripe / payments** — monetization deferred; gallery is free-to-use.
5. **Analytics / funnel tracking** — add only if `ship` goal hit.
6. **Internationalization** — English only; `src/utils/locale.ts` stays UTC-first, no i18n layer added.
7. **Mobile native app** — iOS/Android native apps are NOT on the roadmap. Browser-only distribution.
8. **Drag-and-drop visual editor** — CLI + gallery only; no in-browser template editing (E2 is theme *swap*, not template editing).
9. **AI-generated templates** — no LLM-authored content in pack manifests.
10. **Multi-tenant SaaS** — single public gallery, no user accounts.

---

## Section 7 · What already exists (repo reality anchor)

| Component | Status | Path |
|---|---|---|
| CLI (commander) | ✅ installed, 3 subcommands | `src/cli/index.ts` |
| Preview server | ✅ working | `src/cli/preview-server.ts` |
| Puppeteer renderer | ✅ with restart logic | `src/core/puppeteer-renderer.ts` |
| Splice pipeline | ✅ 143 tests | `src/core/splice.ts` |
| Standalone HTML builder | ✅ 1.5MB output | `scripts/build-standalone-html.ts` |
| Bundle-release script | ✅ monthly PDFs | `scripts/bundle-release.ts` |
| Themes (12) | ✅ | `shared/themes/*.css` |
| Fonts (3 families) | ✅ inlined | `shared/fonts/` |
| 7 template packs | 1 full (prax-journal v5) + 6 stubs | `packs/**/*.html` |
| Profile schema (Zod) | ✅ v2 | `src/types/profile.ts` |
| Sticker renderer (60) | ✅ 4 archetypes | `src/core/sticker-renderer.ts` + `scripts/build-*.ts` |
| AGENTS.md | ✅ 4 Karpathy principles | `AGENTS.md` |
| CLAUDE.md | ✅ repo context | `CLAUDE.md` |

---

## Section 8 · TODOS (each a candidate for GitHub issue)

Ordered by sprint-week:

1. **W1 T1.** Workspaces migration: `package.json` → root manifest + `packages/` + `apps/gallery` + update every relative import.
2. **W1 T2.** Verify 143 tests still pass after migration (forcing function for D6).
3. **W1 T3.** Shared tsconfig base; per-workspace tsconfig extends.
4. **W1 T4.** Update `scripts/bundle-release.ts` & `scripts/build-standalone-html.ts` for new layout.
5. **W2 T1.** Extract `packages/core/src/standalone-builder.ts`.
6. **W2 T2.** Zod `packages/core/src/types/registry.ts` + parser + errors.
7. **W2 T3.** `scripts/generate-registry.ts` walking `packages/packs-*/manifest.json`.
8. **W2 T4.** `packages/core/src/errors.ts` class hierarchy.
9. **W3 T1.** `.devcontainer/devcontainer.json` + `postCreateCommand`.
10. **W3 T2.** Safari WebKit 200MB heap real-device probe (accepted-risk per D7).
11. **W3 T3.** 150dpi fallback codepath in renderer.
12. **W4-6.** Astro gallery scaffold + MDX + blurhash + pack detail routes.
13. **W4-6.** Migrate 7 packs to `packages/packs-*` with manifests.
14. **W7.** Theme swap runtime (E2).
15. **W8.** Shareable URL encoding/decoding (E1).
16. **W9.** Browser-side PDF with theme swap (E3 — pivots if D7 probe fails).
17. **W10.** OG card generation with sharp (E4).
18. **W11.** Semver registry resolver (E5).
19. **W12.** Remix flow (E6).
20. **W13.** `MIGRATION.md` on first `@pretext-templates/*` publish.
21. **W14.** End-to-end Playwright 5 flows.
22. **W15.** Docker integration tests (amd64 + arm64).
23. **W16.** Buffer / polish / ship.

---

## Section 9 · Failure modes registry (from Rev 2)

Linked to CEO plan Section 2 error/rescue map. Top 4 by severity:

| ID | Mode | Likelihood | Blast | Detection | Rescue |
|---|---|---|---|---|---|
| F2 | Safari WebKit 200MB heap OOM on 130pp PDF | HIGH | E3 dead | Week 3 probe (D7) | Server-side render fallback on Cloudflare Workers |
| F6 | Codespaces boot > 60s | MED | E7 persona gap reopens | Week 3 timing test | Accept > 60s, update docs |
| F8 | npm workspace hoisting breaks puppeteer native deps | MED | Everything | W1 migration forces detection | Pin puppeteer at workspace level, exclude from hoist |
| F10 | `V5_PACK_DIR` hardcoded breaks on workspace split | HIGH | generate-journal dead | W1 migration forces detection | Replace with `packs/prax-journal/versions/v5` resolved relative to workspace root |

---

## Section 10 · Parallelization strategy (worktrees)

Sprint has 3 parallel lanes after Week 2:

| Lane | Worktree | Dependencies |
|---|---|---|
| A. Packs | `packages/packs-*` | Week 2 core extraction must land first |
| B. Gallery | `apps/gallery` | Registry format locked Week 2 |
| C. CLI + registry | `packages/{cli,core}` | Depends on error classes + Zod types |

Solo dev reality: cannot realistically run all 3 in parallel. Recommended sequence:
- **Weeks 1-3:** Foundation (migration + errors + registry + Codespaces + Safari probe). Serial.
- **Weeks 4-8:** Packs lane dominant. Gallery lane on alt-days.
- **Weeks 9-12:** Gallery lane dominant. CLI lane on alt-days.
- **Weeks 13-16:** Integration + tests + polish.

---

## Section 11 · Completion summary

| | Count |
|---|---|
| Total decisions | 17 |
| Findings | 13 (1.1-1.5 · 2.1-2.4 · 3 · 4.1-4.4) |
| User decisions | 7 (D1-D7) |
| Cross-model tensions resolved | 2 (Codespaces · rebrand) |
| Risks explicitly accepted by user | 2 (D4 = 16w over reviewer's 18-22w · D7 = no Week-0 Safari probe) |
| Artefacts written | 2 (this file + test plan) |
| Code changes | 0 |
| Plans revised | 1 (CEO plan timeline 11→16) |
| Next recommended skill | `/plan-design-review` (UI scope: gallery + theme swap + OG cards) |

---

## GSTACK REVIEW REPORT

| Review | Status | Reviewer | Date | Notes |
|---|---|---|---|---|
| office-hours | ✅ APPROVED | self | 2026-04-30 | 7 premises locked, landscape confirmed |
| plan-ceo-review | ✅ COMPLETE | SELECTIVE EXPANSION | 2026-04-30 | Approach C + E1-E7, rebrand, timeline 11w |
| plan-eng-review | ✅ COMPLETE | this doc | 2026-04-30 | 13 findings + 4 outside-voice tensions resolved, timeline 16w |
| plan-design-review | ⏳ PENDING | — | — | Gallery UI + theme swap + OG cards unreviewed |
| ship | 🚫 BLOCKED | — | — | No code changes yet (HARD GATE) |

**User-accepted risks (explicit):**
1. 16 weeks solo has reviewer-estimated P(ship) between 25-45%. User accepts this over scope cuts.
2. Safari WebKit probe at Week 3 (not Week 0). If probe fails, Weeks 4-16 require pivot to server-side PDF — burn of 2-3 weeks of slack.
3. Monorepo big-bang Week 1 (not strangler). 3-5 days budgeted for hidden breakage. If it exceeds 5 days, Week 2 slips.

**Green-light conditions to start code (user confirmation required):**
- This file reviewed ✅ (implicit on sprint start)
- `/plan-design-review` completed or explicitly skipped
- User says "go" (HARD GATE)
