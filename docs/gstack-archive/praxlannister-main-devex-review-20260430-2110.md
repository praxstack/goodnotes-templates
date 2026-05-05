---
title: pretext-templates · developer-experience review v1
status: COMPLETE
created: 2026-04-30T21:10:00+05:30
descends_from:
  - ceo-plans/2026-04-30-shadcn-for-goodnotes.md
  - praxlannister-main-eng-review-20260430-1935.md
  - praxlannister-main-design-review-20260430-2058.md
mode: DX_EXPANSION
product_type: CLI + Library/SDK + Platform
personas: [yc-github-dev-B, creator-contributor-A]
tthw_current: "8 min (clone + npm ci + generate)"
tthw_target: "5 sec (playground) / 90s (npx)"
competitive_tier: CHAMPION
timeline_impact: 16w → 17w (added Playground W5-6)
---

# pretext-templates — `/plan-devex-review` v1

## Persona Cards

```
PERSONA B — GITHUB DEVELOPER
=============================
Who:       JS/TS developer, 3-8 YOE, active on GitHub, uses `npx` reflexively
Context:   Sees "pretext-templates" on HN or Twitter. Clicks to repo.
Tolerance: 5 min. If `npx @pretext-templates/cli` doesn't work, closes tab.
Expects:   README with 1 working command in first screenful.
           Node 20, TypeScript types, GitHub Actions CI, MIT license.

PERSONA A — CREATOR / CONTRIBUTOR
==================================
Who:       Designer-developer hybrid, wants to publish their own notebook pack
Context:   Already installed a pack, wants to make their own variant
Tolerance: 30 min for first contribution
Expects:   `remix` flow, clear DESIGN.md + SPEC.md patterns to copy,
           PR template, registry submission path, CI runs tests on fork
```

## Developer Empathy Narrative (Persona B today, HEAD 88e291b)

> T+0:00 — Lands on github.com/praxstack/goodnotes-templates. Title says "GoodNotes-compatible template engine." Intrigued.
>
> T+0:15 — Reads README. Sees `npm install` and `npm run generate` but no `npx`. Install section tells them to clone. Signal: personal project, not shipped tool.
>
> T+0:45 — Finds CLI has `render`, `list`, `preview` — three commands. No `add`, no `init`, no `build`. To get a template: clone + install + run generate-journal + PDF appears in `output/`. That's 4 steps minimum. No Codespaces button.
>
> T+1:30 — Scrolls `packs/`. Sees `prax-journal/`, `gratitude-journal/`, 5 more folders. Each has an HTML file. Can they copy one? Maybe. Nothing tells them that's the path.
>
> T+2:30 — Looking for a one-liner that produces a PDF. Can't find one. CEO plan's `npx @pretext-templates/cli add prax-journal` doesn't exist yet.
>
> T+3:00 — Closes tab. Might bookmark. Probably forgets.

**Today's TTHW: ~8 minutes. Target after W17: 5 seconds (playground) or 90 seconds (npx).**

## Competitive Benchmark

| Tool | TTHW | Notable |
|---|---|---|
| shadcn/ui | ~90s | `npx shadcn@latest add button` |
| create-next-app | ~60s | `npx create-next-app` → dev server up |
| astro | ~45s | `npm create astro@latest` |
| kudrykv/latex-yearly-planner | ~15min | clone + LaTeX + YAML + make |
| **pretext-templates TODAY** | **~8 min** | clone + npm ci + puppeteer chromium + generate |
| **pretext-templates W17 (post-review)** | **~5s** playground / ~90s npx | Champion tier |

## Magical Moment

**Delivery vehicle: Interactive playground at `pretext-templates.dev`** — user clicks "Run · prax-journal" on the home page, PDF generates via **Cloudflare Worker + headless Chromium** in <5 seconds, PDF downloads. Zero install. Zero prerequisite knowledge.

**URL pre-fills:** `?name=Sarah&month=2026-06` → PDF has "Sarah" in the Frog block. Shareable URLs become invite links.

**This is E8, a new workstream at W5-6** — before the gallery's polish lands in W7-8.

---

## 8 Review Passes

### PASS 1 · Getting Started — **9/10** ↑ from 3/10

- TTHW: 5s playground, 90s npx (Champion tier)
- Install: one button (playground) or one command (CLI)
- Magical moment: delivered Week 5-6
- Free tier: yes, MIT, no signup

**Decision DX-P1-1:** Playground accepts 2 URL pre-fills (`name`, `month`).

### PASS 2 · API/CLI/SDK Design — **8/10** ↑ from 5/10

Commander@12.1.0 locked in eng review.

**Gap DX-P2-1:** CLI needs 3 more subcommands:
- `preview` — expose existing preview-server as a subcommand
- `doctor` — diagnose Node/Chromium/output/registry issues
- `upgrade` — bump installed packs to newest semver

**Decision DX-P2-2:** Every CLI flag has a sensible default (add to CONTRIBUTING).

**Decision DX-P2-3:** `@pretext-templates/core` ships TypeScript types via `exports.types`, including Zod schema for registry + pack manifest.

### PASS 3 · Error Messages & Debugging — **9/10** ↑ from 4/10

**Decision DX-P3-1:** `src/core/errors.ts` class hierarchy follows 3-tier Hall of Fame:

| Class | Tier | Example |
|---|---|---|
| `ProfileParseError` | Tier 2 (Rust) | "Profile at `{path}` is missing field `user.name`. Required since v5.2. See docs/profile-v2.md." |
| `RegistryFetchError` | Tier 3 (Stripe JSON) | `{type, code, message, fallback_attempted, doc_url}` |
| `PackNotFoundError` | Tier 1 (Elm) | "I couldn't find `prax-journa`. Did you mean `prax-journal`? Run `pretext-templates list`." |
| `RendererCrashError` | Tier 2 | "Puppeteer crashed page 47. Usually Chromium OOM. Try: `PRAX_BROWSER_RESTART_EVERY=25`." |
| `StandaloneCompileError` | Tier 2 | "CSS collision on `.page`. Edit `{path}:{line}` to rename. See docs/css-collisions.md." |

**Decision DX-P3-2:** `pretext-templates doctor` runs 6 top detectors on demand.

### PASS 4 · Documentation & Learning — **9/10** ↑ from 5/10

- **DX-P4-1:** Docs ordering — 5-min quickstart is doc #1. "Publishing your own pack" is doc #2.
- **DX-P4-2:** Every pack detail page has a **runnable mini-playground** iframe.
- **DX-P4-3:** Auto-generated API reference via Zod → JSON schema + typedoc.
- **DX-P4-4:** `/search` route using Pagefind (build-time static index).

### PASS 5 · Upgrade & Migration — **8/10** ↑ from 4/10

- **DX-P5-1:** `/docs/semver-policy` — patch=bugfix, minor=additive, major=breaking.
- **DX-P5-2:** `pretext-templates upgrade` + codemods. Profile v1→v2 migration as reference.
- **DX-P5-3:** Deprecation warnings emit `console.warn` on install.
- **DX-P5-4:** MIGRATION.md at repo root (committed in eng review).

### PASS 6 · Dev Environment — **8/10** ↑ from 5/10

- ✅ TypeScript types included (DX-P2-3)
- **DX-P6-2:** CI non-interactive — `--no-prompt` flag on every subcommand
- ✅ Docker integration tests (eng review W15)
- ✅ Codespaces (eng review W3)
- VS Code extension **DEFERRED** to post-launch
- ✅ JSON schema autocomplete on `registry.json` free via Zod
- ✅ `--watch` mode on `preview` reuses preview-server's SSE/WS

### PASS 7 · Community & Ecosystem — **7/10** ↑ from 4/10

- ✅ MIT
- **DX-P7-2:** GitHub Discussions + Twitter `@pretextui`. No Discord initially.
- **DX-P7-3:** 3 real integration examples in `/examples` (Vite, Next.js, pure-HTML)
- ✅ Pack publishing is the plugin system (eng review E6)
- ✅ CONTRIBUTING.md (commit a12fcb1)
- ✅ MIT free forever

### PASS 8 · DX Measurement — **7/10** ↑ from 0/10

- **DX-P8-1:** TTHW instrumentation on playground — target p95 < 8s.
- **DX-P8-2:** Plausible or Umami funnel: `/` → `/packs/*` → "Run" click → download.
- **DX-P8-3:** "Was this helpful? [yes/no]" on every doc page → GitHub Discussions.
- **DX-P8-4:** Run `/devex-review` at Week 20 (boomerang) — measure reality vs. plan.

---

## DX SCORECARD

```
+====================================================================+
|              DX PLAN REVIEW — SCORECARD                             |
+====================================================================+
| Dimension            | Score  | Prior  | Trend  |
|----------------------|--------|--------|--------|
| Getting Started      |  9/10  |  3/10  |  +6 ↑  |
| API/CLI/SDK          |  8/10  |  5/10  |  +3 ↑  |
| Error Messages       |  9/10  |  4/10  |  +5 ↑  |
| Documentation        |  9/10  |  5/10  |  +4 ↑  |
| Upgrade Path         |  8/10  |  4/10  |  +4 ↑  |
| Dev Environment      |  8/10  |  5/10  |  +3 ↑  |
| Community            |  7/10  |  4/10  |  +3 ↑  |
| DX Measurement       |  7/10  |  0/10  |  +7 ↑  |
+--------------------------------------------------------------------+
| TTHW                 | ~5 sec (playground) / 90s (npx)              |
| Competitive Rank     | CHAMPION (< 2 min)                           |
| Magical Moment       | designed via Playground (CF Worker) W5-6     |
| Product Type         | CLI + Library/SDK + Platform                 |
| Mode                 | DX EXPANSION                                 |
| Overall DX           |  8/10  |  4/10  |  +4 ↑  |
+====================================================================+
| DX PRINCIPLE COVERAGE                                               |
| Zero Friction at T0         | ✅ covered (playground = 5s)         |
| Incremental Steps           | ✅ covered (playground → npx → remix)|
| Learn by Doing              | ✅ covered (runnable mini-playgrounds)|
| Fight Uncertainty           | ✅ covered (3-tier errors · doctor)  |
| Opinionated + Escape Hatches| ✅ covered (defaults · PRAX_CI · PRAX_BROWSER_RESTART_EVERY) |
| Code in Context             | ✅ covered (3 real /examples)        |
| Speed is a Feature          | ✅ covered (5s TTHW target)          |
| Magical Moments             | ✅ covered (playground as hero CTA)  |
+====================================================================+
```

## DX Implementation Checklist

- [ ] TTHW < 2 min (playground: 5s · npx: 90s)
- [ ] Installation is one command
- [ ] First run produces meaningful output
- [ ] Magical moment delivered via Playground at W5-6
- [ ] Every error: problem + cause + fix + docs link
- [ ] API/CLI naming guessable without docs
- [ ] Every parameter has a sensible default
- [ ] Docs have runnable mini-playgrounds on every pack page
- [ ] Examples show real integration (Vite, Next.js, pure-HTML)
- [ ] Upgrade path: `pretext-templates upgrade` + codemods + MIGRATION.md
- [ ] Breaking changes emit deprecation warnings
- [ ] TypeScript types via `@pretext-templates/core` exports.types
- [ ] CI mode: `--no-prompt` on every subcommand
- [ ] Free forever (MIT)
- [ ] CHANGELOG.md maintained
- [ ] Pagefind search on docs
- [ ] GitHub Discussions + Twitter monitored
- [ ] TTHW instrumentation + funnel analytics
- [ ] /devex-review boomerang at Week 20

---

## NOT in scope

1. **VS Code extension** — deferred post-launch
2. **Discord community channel** — starts with GitHub Discussions only
3. **Mobile iOS/Android SDK** — no native apps
4. **CLI localization** — English only
5. **OAuth / user accounts** — no authentication, no pack ownership beyond git
6. **Playground collaboration** — single-user only, no multi-cursor
7. **Streaming PDF rendering** — full PDF blob on download, no page-by-page stream
8. **Rate limiting on playground beyond fair-use CF defaults** — defer to CF's built-in
9. **Premium tier / paid packs** — MIT free forever, no monetization

## What already exists (reuse, don't reinvent)

| Asset | Reuse for |
|---|---|
| `src/cli/preview-server.ts` | `pretext-templates preview` subcommand |
| `src/core/puppeteer-renderer.ts` + `PRAX_BROWSER_RESTART_EVERY` | Playground CF Worker reuses exact same renderer |
| `src/types/profile.ts` Zod schema | Pack manifest Zod schema copies the pattern |
| Existing 9 `throw new Error` callsites | Migrate to 5 new error classes |
| `scripts/bundle-release.ts` | playground's pre-render path |
| 143 tests | regression floor for every DX change |
| CONTRIBUTING.md (a12fcb1) | Already documents the 4 Karpathy principles |
| `examples/prax-journal/` | starting point for the 3 integration examples |

## TODOs (18 items added to plan)

| # | Task | Week |
|---|---|---|
| DX-1 | `pretext-templates preview` subcommand | W7 |
| DX-2 | `pretext-templates doctor` subcommand | W7 |
| DX-3 | `pretext-templates upgrade` subcommand | W11 |
| DX-4 | `--no-prompt` flag on every subcommand | W7 |
| DX-5 | Playground CF Worker + headless Chromium | **W5-6** |
| DX-6 | Playground URL pre-fills (`name`, `month`) | **W5-6** |
| DX-7 | `src/core/errors.ts` 3-tier hierarchy | W2 |
| DX-8 | Doctor detector functions (6 checks) | W7 |
| DX-9 | `/docs/quickstart` as doc #1 | W8 |
| DX-10 | `/docs/publish-a-pack` as doc #2 | W8 |
| DX-11 | Pagefind search on `/search` route | W9 |
| DX-12 | Auto-generated API reference (Zod + typedoc) | W9 |
| DX-13 | Semver policy doc + codemods | W11 |
| DX-14 | Pack deprecation warning system | W11 |
| DX-15 | `/examples/` with 3 real integrations | W12 |
| DX-16 | TTHW instrumentation on playground | W6 |
| DX-17 | Funnel analytics (Plausible or Umami) | W12 |
| DX-18 | /devex-review boomerang | **W20** (post-launch) |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | ✅ CLEAR | Approach C + E1-E8 · 17w sprint |
| Codex Review | `/codex-plan-review` | Outside voice × 2 | 2 | ✅ CLEAR | All resolved |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | ✅ CLEAR | 13 findings · 11w → 16w |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | ✅ CLEAR | 4/10 → 8/10 · v2 approved · 18 TODOs |
| **DX Review** | `/plan-devex-review` | Developer experience | 1 | ✅ CLEAR | **4/10 → 8/10 · Playground added · 18 TODOs · 16w → 17w** |

- **UNRESOLVED:** 0 across all reviews.
- **USER-ACCEPTED RISKS (cumulative):**
  1. 17w solo P(ship) 25-45%.
  2. Safari WebKit probe Week 3 (not Week 0).
  3. Monorepo big-bang Week 1, 3-5 day budget.
  4. Progress-ring clock on Codespaces S4 (AI-cliché flagged).
  5. Playground CF Worker adds 1 week to timeline + new infra dependency.
- **VERDICT:** CEO + ENG + DESIGN + DX ALL CLEARED — ready to implement.
- **HARD GATE remaining:** user says "go" or runs `/ship` when Week 17 code lands.
