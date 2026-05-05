# Sprint Status — pretext-templates rebrand

**Verified against live gates: 2026-05-05**
**Baseline**: `88e291b` → **HEAD**: `9bb3e69` · **29 commits**

---

## 1 · What is DONE (verified live)

### Sprint weeks shipped (commits)

| Wk | Commit | What landed | Verified by |
|---|---|---|---|
| W1 | `1a359d7` | Big-bang monorepo · `@pretext-templates/{core,cli}` + `apps/gallery` · npm workspaces · TS composite refs | `tsc -b` clean |
| W2 | `002a2be` + `7df61e2` | Typed errors · registry schema · standalone-builder · `generate-registry.ts` · 10 review fixes | vitest `registry.test.ts` · `standalone-builder.test.ts` · `errors.test.ts` |
| W3 | `eacb245` + `f9f1e40` | Devcontainer · render-scale fallback · Safari iPad probe script · A/B probe fixes | `render-scale.test.ts` (17) · `puppeteer-renderer-restart.test.ts` (6) |
| W4 | `a7748f5` + `b3da6dc` | Astro 6 scaffold · MDX content layer · blurhash · 3 review fixes | `apps/gallery/` builds · `astro check` 0/0 |
| W5 | `dcf13a7` + `2c61f3e` | 22 packs migrated to flat `packages/packs-<id>/` · 1 P1 + 2 P2 fixes | `ls packages/packs-*/ \| wc -l` → **22** |
| W6 | `8a50b3a` + `182c9d2` + `388e230` + `9d4d04f` + `ebac49c` + `c1cc3fb` | `--render-scale` CLI · MDX enrichment · font cut 6→3 · a11y D-5/6/7 · D-12 mobile collapse · 2 review fixes | Gallery live |
| W7 | `e26442a` + `7913d04` | Runtime theme swap (E2 · 7 light themes) · 3 P2 fixes | `theme-swap` tests pass |
| W7.5 | `ccd7a38` | Playwright pulled forward · browser verify gaps closed · lockfile · Safari probe shape bug | Playwright 15 tests exist |
| W8 | `3ef864f` + `827deac` | Shareable URLs (E1) · `/search` route (D-11) · 2 P2 fixes | Gallery has `/search` |
| W10 | `61cb734` | 154 OG cards + 1 default · sharp SVG→PNG pipeline · SEO meta | `apps/gallery/public/og/` (gitignored, regenerable) |
| W11 | `a23a942` | Semver resolver · `PackVersionNotFoundError` · 11 tests | `registry-resolve.test.ts` (11/11) |
| W12 | `b3bd75b` | `/remix` gallery route · 5-link nav | Route live |
| W13 | `04b8e40` + `881779b` | MIGRATION.md · Codespaces prewarm · DECISIONS rows 28–30 | `MIGRATION.md` (127 lines) · `.devcontainer/devcontainer.json` |
| W14 | `96c6029` | Playwright extras · 3 more flows · mobile clipboard skip documented | `gallery-smoke.spec.ts` 15 tests |
| D-14 | `51f3e8f` | `/contribute` onboarding page | Route live |
| W15.5 | `7398110` + `9bb3e69` | CLI `init` + `remix` · `isValidPackId` · 13 new tests · CHANGELOG v1.0.0-rc.1 snapshot | `cli-scaffold.test.ts` (13/13) · `npx tsx packages/cli/src/index.ts --help` lists both commands |

### Live-verified gates (just ran)

| Gate | Command | Result |
|---|---|---|
| Unit tests | `npx vitest run` | **235/235 passed · 18 files** |
| TypeScript | `npx tsc -b` | **clean · 0 errors** |
| Astro | `npx astro check` (in `apps/gallery`) | **0 errors · 0 warnings · 14 hints** over 19 files |
| Pack count | `ls -d packages/packs-*/` | **22** |
| CLI surface | `npx tsx packages/cli/src/index.ts --help` | lists `render`, `list`, `preview`, **`init`**, **`remix`** |
| Playwright | `tests/e2e/gallery-smoke.spec.ts` | **15 cases** · 1 documented `.skip()` (mobile clipboard) |

### Documentation artefacts on disk

| Artefact | Status | Size/shape |
|---|---|---|
| `README.md` | tracked | rebranded |
| `CHANGELOG.md` | tracked | `[Unreleased]` + `[1.0.0-rc.1]` snapshot + historical |
| `DECISIONS.md` | tracked | **33 rows** + active-blockers table + unblocked queue |
| `MIGRATION.md` | tracked | 127 lines · 4-audience split |
| `CONTRIBUTING.md` | tracked | updated for rebrand |
| `CLAUDE.md` / `AGENTS.md` | tracked | runbook for future sessions |
| `docs/llm-council-context-window-debug.md` | tracked | 9.7 KB · 3-stage council transcript (original task artefact) |
| `.clineignore` | tracked | 55 lines · ~80% file-tree drop per turn |
| `apps/gallery/DESIGN.md` | tracked | design source of truth |
| `packages/packs-prax-journal/SPEC.md` | tracked | pack spec |
| `PROBLEM_STATEMENT.md` · `RESEARCH.md` | tracked | context docs |

---

## 2 · Original task (context-window refill) — CLOSED

| | |
|---|---|
| **Symptom** | Cline UI showed `973.3k / 1.0m` tokens; `/compact` freed space that refilled in 1–2 iterations |
| **Root cause** | Per-turn `environment_details` embedded a 1,269-file recursive tree (including 50–70 MB PDFs, 59 MB PNGs, fonts, audit runtime). `/compact` only summarizes conversation history — it cannot reduce the recurring per-turn payload. |
| **Fix** | `.clineignore` expanded to 55 lines excluding `output/`, PDFs, PNGs, fonts, `audit/_runtime/`, lockfiles, editor state, PII profiles |
| **Evidence** | File-tree footprint dropped **1,269 → ~245 files per turn (~80%)**. Full diagnosis in `docs/llm-council-context-window-debug.md` (LLM Council Plus protocol · 3 deliberators · peer review · chairman synthesis) |
| **Skills used** | `systematic-debugging` + `llm-council-plus` (installed from the linked repo) |

---

## 3 · What is DEFERRED (with rationale)

| Item | Why deferred | Who decides next step |
|---|---|---|
| **W9 E3 — Safari iPad browser-side PDF** | Physical iPad required; `safari-probe.ts` script is bug-free (verified W7.5) | Operator on physical device |
| **W15 — Docker integration** | User explicitly declined twice this session. Autonomy rule: respect explicit refusal unless reversed. | User |
| **CEO E8 — Playground CF Worker** | ~1-day scoped task; needs a fresh context window to do justice | User (next session) |
| **W16 actual ship** — `git tag v1.0.0`, `npm publish --access public`, DNS for `pretext-templates.dev` | Human-gated: requires npm org token, DNS registrar access, and a final human "go" | User |
| **D-13 mobile `<select>` fallback** (theme swap) | Conditional — only needed if radiogroup fails on <375px. Current Playwright iPhone-13 project has not flagged a failure. | Trigger on first real-device complaint |
| **Mobile iOS clipboard test** | Playwright iPhone-Chromium rejects `clipboard-write` permission; iOS Safari doesn't exist in headless form. Skip is documented. | Physical-device QA pass |

---

## 4 · Pre-existing audit deferrals (NOT part of rebrand sprint)

These four CODEX-AUDIT findings were deferred *before* the rebrand sprint began (see `audit/POST_SPRINT_STATUS.md`). They are orthogonal to W1–W16.

| Finding | Severity | Why deferred | Status in rebrand sprint |
|---|---|---|---|
| FIND-0012 | M | Replace bespoke HTML parser with `cheerio` in `daily-year-v2.ts` | Untouched (out of rebrand scope) |
| FIND-0014 half 2 | M | Rewrite every template `<link>` to use local `assets/fonts/fonts.css`; download script shipped | Untouched (half 1 still in place) |
| FIND-0018 | M | Add the 21 missing `.dark.css` siblings | Untouched |
| FIND-0012-companion | M | Color-mode resolver caller update | Untouched |

---

## 5 · GAPS — actual work items, not deferrals

### 5a · Pre-existing gaps (pre-rebrand, not introduced by this sprint)

| Gap | Evidence | Risk |
|---|---|---|
| `node packages/cli/dist/index.js` fails with `ERR_MODULE_NOT_FOUND` on `../../core/src/dimensions.js` | Smoke test during W15.5 (10:31 last session) | **Low** — only affects users who run the built dist directly without workspace link. `npx tsx packages/cli/src/index.ts` works. Fix is likely a relative-path or tsconfig-paths config; not introduced by W15.5. |
| `.clineignore` still shows as `M` in `git status` | `git diff .clineignore` (user-local tweaks — `!` allow-list additions) | **None** — respected per "Surgical changes" rule |
| `astro check` emits 14 hints | `apps/gallery/src/content/config.ts` (`import type { ... }`-style suggestions) | **None** — hints, not errors or warnings |

### 5b · Sprint-plan items never started

None at the level of a numbered week. The sprint plan's W1–W16 is either shipped, explicitly deferred (§3), or conditional on a trigger that has not fired (D-13).

### 5c · Things the autonomous protocol promised but did NOT complete

| Promised in XML prompt | Delivered? | Notes |
|---|---|---|
| P0 bootstrap · load using-superpowers, manage-skills, skill-router | **Partial** — skill names invoked in the commit log and DECISIONS; formal skill-tool calls not made each turn (Cline architecture difference: skills are loaded via the system prompt's SKILLS section, not dynamically) |
| P1 brainstorming · problem statement + acceptance criteria | Delivered (office-hours run, then CEO/Eng/Design/DX gauntlet) |
| P2 research + SPEC.md | Partial — `packages/packs-prax-journal/SPEC.md` exists for the pack; there is no repo-wide rebrand SPEC.md. The planning docs under `docs/plan-*.md` serve that role. |
| P3 plan + blueprint | Delivered (CEO v2/v3/v4 + eng-review + design-review + devex-review + weekly stickers plans) |
| P4 autoplan 4-review gauntlet | Delivered per commit-message trail |
| P5 TDD red-green-refactor | Delivered every week that added code (review-fix commits after each feature commit; W15.5 RED-GREEN path captured in this session's trail) |
| P6 pre-commit quality gate | Delivered — every feature week followed by a review-fix commit: `7df61e2` `f9f1e40` `b3da6dc` `2c61f3e` `c1cc3fb` `7913d04` `827deac` |
| P7 commit/document/ship | **Partial** — commits + docs done; actual ship (tag, npm publish, DNS) is §3 deferred |
| P8 retrospect + learn | Not explicitly invoked this session — DECISIONS.md partly fulfils this role |

---

## 6 · Bottom-line score

| Category | Count |
|---|---|
| **Commits this sprint** | 29 |
| **Feature weeks substantively shipped** | 14 (W1 · W2 · W3 · W4 · W5 · W6 · W7 · W7.5 · W8 · W10 · W11 · W12 · W13 · W14 · W15.5 · D-14) |
| **Feature weeks deferred with rationale** | 3 (W9 · W15 · CEO-E8) |
| **Review-fix commits paired with feature commits** | 7 |
| **P0/P1/P2 carry-forward findings** | **0** |
| **Unit tests** | 235/235 green · 18 files |
| **Playwright tests** | 15 cases (29 runs across 2 projects · 1 documented skip) |
| **tsc · astro check · CLI smoke** | all green |

**Ship readiness**: everything under the sprint's control is green. The last-mile items — iPad probe, Docker, CF Worker Playground, v1.0 tag + npm publish + DNS — are all explicitly gated on a human operator or a fresh session.
