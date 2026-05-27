# pretext-templates

> Programmatically generate high-quality digital planning templates, stickers, and page assets optimized for GoodNotes and similar digital note-taking apps. Monorepo root — see packages/*. Note: this project has over 100 source files; consider scoping analysis to a subdirectory for faster results.

| | |
|---|---|
| **Languages** | astro, css, csv, html, javascript, json, jsonl, markdown, mdx, mmd, shell, typescript, unknown, yaml |
| **Frameworks** | Astro, GitHub Actions, Playwright, Puppeteer, TypeScript, Vercel, Vitest |
| **Components** | 624 nodes, 1020 relationships |
| **Last Analyzed** | 2026-05-27T03:53:19.203Z |

## Architecture

The project is organized into the following layers:

### Gallery App

Astro-based gallery web app that showcases the rendered templates and packs.

Key components: package.json, blurhash-manifest.json, theme-palette.json, tsconfig.json, DESIGN.md, README.md, astro.config.mjs, build-og-cards.ts, build-theme-palette.ts, copy-pack-pdfs.ts, copy-pack-themed-pdfs.ts, encode-blurhash.ts, enrich-pack-mdx.ts, generate-specimens.ts, stage-vercel-config.ts, validate-pack-ids.ts, BlurhashImage.astro, ThemeSwap.astro, site.ts, content.config.ts, budget-tracker.mdx, cornell-notes.mdx, eat-the-frog.mdx, eisenhower-matrix.mdx, fitness-log.mdx, goal-setting.mdx, gratitude-journal.mdx, habit-tracker.mdx, meal-planning.mdx, meeting-notes.mdx, monthly-planner.mdx, mood-tracker.mdx, morning-pages.mdx, prax-journal.mdx, project-planning.mdx, prompted-journal.mdx, reading-log.mdx, recipe-card.mdx, reflection-journal.mdx, simple-pages.mdx, tactile-daily-planner.mdx, tactile-habits.mdx, tactile-reflections.mdx, tactile-tasks.mdx, travel-planner.mdx, weekly-planner.mdx, yearly-overview.mdx, Layout.astro, browse.astro, contribute.astro, index.astro, [id].astro, remix.astro, search.astro, global.css

### CLI Package

Command-line interface package exposing the goodnotes-templates CLI entry points.

Key components: package.json, tsconfig.json, index.ts, preview-server.ts, scaffold.ts

### Core Engine

Core rendering and template engine shared by all packs and the CLI.

Key components: package.json, tsconfig.json, base.css, bold-tech-dark.css, bold-tech.css, bubblegum-dark.css, bubblegum.css, caffeine-dark.css, caffeine.css, candyland-dark.css, candyland.css, claude-dark.css, claude.css, cyberpunk-dark.css, cyberpunk.css, doom64-dark.css, doom64.css, audit.ts, dimensions.ts, errors.ts, generator-helpers.ts, generator.ts, index.ts, packs.ts, pdf-postprocess.ts, pdf-splice.ts, png-renderer.ts, prax-journal-renderer.ts, puppeteer-renderer.ts, registry-resolve.ts, splice.ts, standalone-builder.ts, sticker-renderer.ts, svg-renderer.ts, index.ts, profile.ts, registry.ts, locale.ts

### Template Packs

Self-contained template packs (journals, planners, trackers, tactile series, etc.).

Key components: manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, profile.example.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, manifest.json, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, CHANGELOG.md, DESIGN.md, README.md, SPEC.md, profile.README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, README.md, budget-tracker.html, cornell-notes.html, eat-the-frog.html, eisenhower-matrix.html, fitness-log.html, goal-setting.html, gratitude-journal.html, generate.ts, habit-tracker.html, meal-planning.html, meeting-notes.html, generate.ts, monthly-planner.html, mood-tracker.html, morning-pages.html, design-system.html, daily.dark.css, daily.html, monthly.dark.css, monthly.html, weekly.dark.css, weekly.html, monthly.dark.css, monthly.html, reflect.dark.css, reflect.html, today.dark.css, today.html, weekly.dark.css, weekly.html, monthly.dark.css, monthly.html, reflect.dark.css, reflect.html, today.dark.css, today.html, weekly.dark.css, weekly.html, brain-dump.html, reflect.html, today.html, brain-dump.html, midday.html, monthly.html, quarterly.html, reflect.html, today.html, weekly.html, project-planning.html, prompted-journal.html, reading-log.html, recipe-card.html, reflection-journal.html, simple-pages.html, tactile-daily-planner.html, tactile-habits.html, tactile-reflections.html, tactile-tasks.html, travel-planner.html, generate.ts, weekly-planner.html, generate.ts, yearly-overview.html

### Build & Generation Scripts

TypeScript and shell scripts that render previews, build stickers, generate registries, and bundle releases.

Key components: audit.sh, build-friend-letter.ts, build-mood-dot.ts, build-standalone-html.ts, build-stickers-remaining.ts, build-stickers.ts, build-thought-flip.ts, build-wave1-stickers.ts, build-wave2-stickers.ts, build-wins-jar.ts, bundle-release.ts, download-fonts.ts, generate-journal.ts, generate-registry.ts, inline-v5-fonts.ts, migrate-packs-w5.ts, probe-ink-density.ts, probe-sharp-fraunces.ts, rebuild-all-stickers-index.ts, render-all-pack-themes.ts, render-all-packs.ts, render-tactile-preview.ts, safari-probe.ts, smoke-c7b1.ts, smoke-c7b2.ts, smoke-prod-headers.sh, smoke-theme-injection.ts

### Tests

Unit, end-to-end, and visual regression test suites.

Key components: README.md, gallery-smoke.spec.ts, audit.test.ts, cli-scaffold.test.ts, contrast.test.ts, dimensions.test.ts, errors.test.ts, generator-framework.test.ts, generators-phase1.test.ts, locale.test.ts, pdf-postprocess-coverage.test.ts, pdf-postprocess-property.test.ts, pdf-postprocess.test.ts, pdf-splice.test.ts, prax-journal-renderer.test.ts, preview-server.test.ts, profile.test.ts, puppeteer-renderer-mock.test.ts, puppeteer-renderer-pure.test.ts, puppeteer-renderer-restart.test.ts, registry-resolve.test.ts, registry.test.ts, render-scale.test.ts, splice.test.ts, standalone-builder.test.ts, svg-renderer.test.ts, vercel-config.test.ts, diff.ts, render.ts, v5-snapshots.test.ts

### References

Reference designs and inspiration assets used by the design system.

Key components: DESIGN.md, code.html, code.html, code.html, code.html, code.html, code.html, code.html, code.html

### Audit Reports

Multi-iteration audit findings, gap analyses, roadmaps, and verification results.

Key components: CODEBASE_AUDIT_REPORT.json, capabilities.json, findings.json, findings.json, CODEBASE_AUDIT_REPORT.md, GAPS.md, IMPLEMENTATION_ROADMAP.md, POST_SPRINT_STATUS.md, README.md, SLIDE_OUTLINE.md, TEST_STRATEGY.md, topology.md, GAPS.md, architecture.md, claims-ledger.md, docs-review.md, findings.md, performance-and-observability.md, privacy-review.md, supply-chain.md, tests-and-quality-gates.md, threat-model.md, ui-ux-a11y.md, verification-results.md, CODEBASE_AUDIT_REPORT.json.md, CODEBASE_AUDIT_REPORT.md, IMPLEMENTATION_ROADMAP.md, README.md, SLIDE_OUTLINE.md, STATUS.md, TEST_STRATEGY.md, architecture.md, deferred-decisions.md, findings.md, phase-validation.md, SESSION-LOG.md, STATUS.md, STATUS.md, dependency-graph.mmd, IMPLEMENTATION_ROADMAP.csv, IMPLEMENTATION_ROADMAP.csv

### Design & Planning Docs

High-level design (HLD/LLD), CEO/eng/design plan reviews, and product North-Star documentation.

Key components: CUSTOMISATION.md, HLD-self-contained-templates.md, LLD-self-contained-templates.md, NORTH-STAR.md, design-review-v5-2026-04-27.md, README.md, 2026-04-30-shadcn-for-goodnotes.md, 2026-04-09-full-breadth-engine.md, praxlannister-main-design-20260409-194856.md, praxlannister-main-design-20260430-163246.md, praxlannister-main-design-review-20260430-2058.md, praxlannister-main-devex-review-20260430-2110.md, praxlannister-main-eng-review-20260430-1935.md, praxlannister-main-eng-review-test-plan-20260430-1735.md, praxlannister-main-test-plan-20260409-203137.md, llm-council-context-window-debug.md, plan-ceo-review-sticker-expansion-v1.md, plan-ceo-review-v2-10x-expansion.md, plan-ceo-review-v3-refined.md, plan-ceo-review-v4-five-decisions-locked.md, plan-ceo-review-v5-10x-100x-expansion.md, plan-design-review-v4-five-decisions.md, plan-eng-review-v4-five-decisions.md, plan-eng-review-weekly-monthly-stickers.md, plan-weekly-monthly-stickers.md, 2026-04-10-self-contained-templates-design.md, wireframes-v2.html, wireframes-v3.html, wireframes.html, main-reviews.jsonl, timeline.jsonl

### Example Outputs

Pre-rendered HTML/PDF example outputs for showcased packs.

Key components: prax_adhd_planner.html

### Shared Assets

Shared resources (fonts metadata, common assets) used across packs.

Key components: README.md

### CI/CD & Dev Environment

GitHub Actions workflows, dev container config, and environment automation.

Key components: dependabot.yml, CODEOWNERS, audit.yml, ci.yml, generate.yml, devcontainer.json

### Project Configuration

Root-level monorepo configuration, build tooling, lint/test configs, and workspace settings.

Key components: .npmrc, package.json, registry.json, tsconfig.base.json, tsconfig.json, vercel.json, eslint.config.js, playwright.config.ts, vitest.config.ts, vitest.visual.config.ts

### Project Documentation

Top-level project documentation (README, CHANGELOG, MIGRATION, CONTRIBUTING, status reports).

Key components: AGENTS.md, CHANGELOG.md, CHECKPOINT.md, CLAUDE.md, CONTRIBUTING.md, DECISIONS.md, MIGRATION.md, PROBLEM_STATEMENT.md, README.md, RESEARCH.md, SPRINT-STATUS.md, THIRD_PARTY_LICENSES.md, TODOS.md

### Miscellaneous (output)

Other files under output/.

Key components: .gitkeep

### Miscellaneous (root)

Other files under root/.

Key components: .clineignore

## Getting Started

Follow this guided tour to understand the codebase:

### 1. Project Overview & North Star

Start with the README and DECISIONS to understand what goodnotes-templates is and the principles guiding it. The North-Star doc explains the intent behind self-contained pack templates.

**Files to look at:**
- `README.md` — Project README with 16 sections (480 lines) — primary entry-point documentation.
- `DECISIONS.md` — Documentation: 13 sections, 110 lines.
- `docs/NORTH-STAR.md` — Documentation: 13 sections, 167 lines.
- `CHANGELOG.md` — Changelog tracking releases and notable changes (13 sections, 295 lines).

### 2. Monorepo Layout & Workspace Configuration

Inspect the monorepo's package.json, pnpm-workspace, base TypeScript config, and Vercel/Vitest tooling to see how the workspace is wired together.

**Files to look at:**
- `package.json` — Package manifest declaring dependencies, scripts, and metadata (76 lines).
- `tsconfig.base.json` — TypeScript compiler configuration (17 lines).
- `tsconfig.json` — TypeScript compiler configuration (10 lines).
- `vercel.json` — Vercel deployment configuration (39 lines).

### 3. Core Engine — How Templates Render

Dive into packages/core to see the rendering primitives, layout helpers, and the template/pack contract that every pack consumes.

**Files to look at:**
- `packages/core/src/index.ts` — Barrel/entry-point file re-exporting public symbols of its directory (46 exports, 0 fns, 0 classes).
- `packages/core/src/pdf-splice.ts` — Typescript module exposing 2 functions and 2 exports (206 lines).
- `packages/core/src/prax-journal-renderer.ts` — Typescript module exposing 10 functions and 12 exports (453 lines).
- `packages/core/src/splice.ts` — Typescript module exposing 6 functions and 1 export (137 lines).
- `packages/core/src/types/profile.ts` — Typescript module exposing 1 function and 4 exports (288 lines).
- `packages/core/src/utils/locale.ts` — Typescript module exposing 10 functions and 11 exports (213 lines).
- `packages/core/src/dimensions.ts` — Typescript module exposing 5 functions and 9 exports (156 lines).
- `packages/core/src/puppeteer-renderer.ts` — Typescript module exposing 12 functions and 9 exports (448 lines).
- `packages/core/src/audit.ts` — Typescript module exposing 5 functions and 6 exports (311 lines).
- `packages/core/src/errors.ts` — Typescript module defining 5 classes (~327 lines).
- `packages/core/src/registry-resolve.ts` — Typescript module exposing 3 functions and 3 exports (147 lines).
- `packages/core/src/standalone-builder.ts` — Typescript module exposing 5 functions and 1 export (268 lines).

### 4. CLI — Operator Entry Point

packages/cli is the command-line surface. Walk its TypeScript sources to understand how commands wire up to the core engine.

**Files to look at:**
- `packages/cli/src/index.ts` — Barrel/entry-point file re-exporting public symbols of its directory (0 exports, 0 fns, 0 classes).
- `packages/cli/src/preview-server.ts` — Typescript module exposing 2 functions and 1 export (220 lines).
- `packages/cli/src/scaffold.ts` — Typescript module exposing 5 functions and 3 exports (210 lines).

### 5. Build Scripts — Rendering Pipelines

scripts/ holds the orchestration that renders pages, builds stickers, generates the registry, and bundles releases. Read these to see the full build pipeline end-to-end.

**Files to look at:**
- `scripts/build-standalone-html.ts` — Typescript module exposing 3 functions and 0 exports (136 lines).
- `scripts/build-standalone-html.ts` — Function `parseArgs` (17 lines) in build-standalone-html.ts.
- `scripts/build-standalone-html.ts` — Function `main` (48 lines) in build-standalone-html.ts.
- `scripts/generate-journal.ts` — Typescript module exposing 4 functions and 0 exports (158 lines).
- `scripts/generate-journal.ts` — Function `parseArgs` (19 lines) in generate-journal.ts.
- `scripts/generate-journal.ts` — Function `main` (71 lines) in generate-journal.ts.
- `scripts/safari-probe.ts` — Typescript module exposing 5 functions and 0 exports (416 lines).
- `scripts/safari-probe.ts` — Function `buildHtmlProbe` (37 lines) in safari-probe.ts.
- `scripts/safari-probe.ts` — Function `buildPdfProbe` (54 lines) in safari-probe.ts.
- `scripts/safari-probe.ts` — Function `writeGuide` (111 lines) in safari-probe.ts.
- `scripts/safari-probe.ts` — Function `main` (37 lines) in safari-probe.ts.
- `scripts/smoke-c7b1.ts` — Typescript module exposing 2 functions and 0 exports (76 lines).
- `scripts/smoke-c7b1.ts` — Function `loadLocalProfile` (13 lines) in smoke-c7b1.ts.
- `scripts/smoke-c7b1.ts` — Function `main` (34 lines) in smoke-c7b1.ts.

### 6. Gallery App — The Showcase Surface

apps/gallery is the Astro-based public surface that renders previews of every template and pack. Trace the entry, layout, and pack-detail pages.

**Files to look at:**
- `apps/gallery/src/components/BlurhashImage.astro` — Astro source file (73 lines).
- `apps/gallery/src/components/ThemeSwap.astro` — Astro source file (264 lines).
- `apps/gallery/src/config/site.ts` — Typescript source file (20 lines).
- `apps/gallery/src/layouts/Layout.astro` — Astro source file (154 lines).
- `apps/gallery/src/pages/browse.astro` — Astro source file (172 lines).
- `apps/gallery/src/pages/contribute.astro` — Astro source file (208 lines).
- `apps/gallery/src/pages/index.astro` — Astro source file (311 lines).
- `apps/gallery/src/pages/packs/[id].astro` — Astro source file (355 lines).
- `apps/gallery/src/pages/remix.astro` — Astro source file (212 lines).
- `apps/gallery/src/pages/search.astro` — Astro source file (285 lines).
- `apps/gallery/package.json` — Package manifest declaring dependencies, scripts, and metadata (29 lines).
- `apps/gallery/astro.config.mjs` — Configuration module exposing settings and tunables (0 exports).
- `apps/gallery/scripts/build-og-cards.ts` — Typescript module exposing 7 functions and 0 exports (199 lines).
- `apps/gallery/scripts/build-og-cards.ts` — Function `xmlEscape` (10 lines) in build-og-cards.ts.
- `apps/gallery/scripts/build-og-cards.ts` — Function `svgCard` (32 lines) in build-og-cards.ts.

### 7. Tests — Unit, E2E & Visual Regression

Three test surfaces: tests/unit for logic, tests/e2e via Playwright for the gallery, and tests/visual for layout regression. Vitest runs unit + visual; Playwright runs e2e.

**Files to look at:**
- `tests/unit/locale.test.ts` — Test file containing 0 test functions and 0 test fixtures.
- `tests/unit/pdf-splice.test.ts` — Test file containing 1 test functions and 0 test fixtures.
- `tests/unit/prax-journal-renderer.test.ts` — Test file containing 1 test functions and 0 test fixtures.
- `tests/unit/prax-journal-renderer.test.ts` — Function `makeProfile` (10 lines) in prax-journal-renderer.test.ts.
- `tests/unit/profile.test.ts` — Test file containing 2 test functions and 0 test fixtures.
- `tests/unit/splice.test.ts` — Test file containing 0 test functions and 0 test fixtures.
- `tests/unit/cli-scaffold.test.ts` — Test file containing 0 test functions and 0 test fixtures.
- `tests/unit/dimensions.test.ts` — Test file containing 0 test functions and 0 test fixtures.
- `tests/unit/preview-server.test.ts` — Test file containing 2 test functions and 0 test fixtures.
- `tests/unit/preview-server.test.ts` — Function `spawnServer` (22 lines) in preview-server.test.ts.
- `tests/unit/puppeteer-renderer-mock.test.ts` — Test file containing 5 test functions and 0 test fixtures.
- `tests/unit/puppeteer-renderer-mock.test.ts` — Function `makePage` (40 lines) in puppeteer-renderer-mock.test.ts.

### 8. CI/CD & Audit Reports

GitHub Actions workflows in .github/workflows automate audit/CI/generate. The audit/ tree records six iterations of findings, gap analyses, and verification results that shaped the current state.

**Files to look at:**
- `.github/workflows/ci.yml` — GitHub Actions workflow (ci.yml) defining CI/CD jobs (78 lines).
- `.github/workflows/audit.yml` — GitHub Actions workflow (audit.yml) defining CI/CD jobs (46 lines).
- `.github/workflows/generate.yml` — GitHub Actions workflow (generate.yml) defining CI/CD jobs (130 lines).
- `audit/CODEBASE_AUDIT_REPORT.md` — Documentation: 29 sections, 269 lines.
- `audit/IMPLEMENTATION_ROADMAP.md` — Documentation: 9 sections, 88 lines.
- `audit/iteration-4/CODEBASE_AUDIT_REPORT.md` — Documentation: 32 sections, 350 lines.
- `audit/iteration-6/STATUS.md` — Documentation: 17 sections, 264 lines.

## File Map

| File | Purpose | Complexity |
|------|---------|------------|
| `packages/core/src/index.ts` | Barrel/entry-point file re-exporting public symbols of its directory (46 exports, 0 fns, 0 classes). | moderate |
| `packages/core/src/pdf-splice.ts` | Typescript module exposing 2 functions and 2 exports (206 lines). | moderate |
| `packages/core/src/prax-journal-renderer.ts` | Typescript module exposing 10 functions and 12 exports (453 lines). | complex |
| `packages/core/src/splice.ts` | Typescript module exposing 6 functions and 1 export (137 lines). | moderate |
| `packages/core/src/types/profile.ts` | Typescript module exposing 1 function and 4 exports (288 lines). | complex |
| `packages/core/src/utils/locale.ts` | Typescript module exposing 10 functions and 11 exports (213 lines). | moderate |
| `scripts/build-standalone-html.ts` | Typescript module exposing 3 functions and 0 exports (136 lines). | moderate |
| `scripts/generate-journal.ts` | Typescript module exposing 4 functions and 0 exports (158 lines). | moderate |
| `scripts/safari-probe.ts` | Typescript module exposing 5 functions and 0 exports (416 lines). | complex |
| `scripts/smoke-c7b1.ts` | Typescript module exposing 2 functions and 0 exports (76 lines). | moderate |
| `scripts/smoke-c7b2.ts` | Typescript module exposing 3 functions and 0 exports (103 lines). | moderate |
| `tests/unit/locale.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `tests/unit/pdf-splice.test.ts` | Test file containing 1 test functions and 0 test fixtures. | complex |
| `tests/unit/prax-journal-renderer.test.ts` | Test file containing 1 test functions and 0 test fixtures. | complex |
| `tests/unit/profile.test.ts` | Test file containing 2 test functions and 0 test fixtures. | complex |
| `tests/unit/splice.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `packages/cli/src/index.ts` | Barrel/entry-point file re-exporting public symbols of its directory (0 exports, 0 fns, 0 classes). | complex |
| `packages/cli/src/preview-server.ts` | Typescript module exposing 2 functions and 1 export (220 lines). | moderate |
| `packages/cli/src/scaffold.ts` | Typescript module exposing 5 functions and 3 exports (210 lines). | moderate |
| `packages/core/src/dimensions.ts` | Typescript module exposing 5 functions and 9 exports (156 lines). | moderate |
| `packages/core/src/puppeteer-renderer.ts` | Typescript module exposing 12 functions and 9 exports (448 lines). | complex |
| `scripts/render-all-pack-themes.ts` | Typescript module exposing 4 functions and 0 exports (209 lines). | moderate |
| `scripts/render-all-packs.ts` | Typescript module exposing 2 functions and 0 exports (132 lines). | moderate |
| `scripts/smoke-theme-injection.ts` | Typescript module exposing 3 functions and 0 exports (118 lines). | moderate |
| `tests/unit/cli-scaffold.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `tests/unit/dimensions.test.ts` | Test file containing 0 test functions and 0 test fixtures. | simple |
| `tests/unit/preview-server.test.ts` | Test file containing 2 test functions and 0 test fixtures. | moderate |
| `tests/unit/puppeteer-renderer-mock.test.ts` | Test file containing 5 test functions and 0 test fixtures. | complex |
| `tests/unit/puppeteer-renderer-pure.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `tests/unit/puppeteer-renderer-restart.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `tests/unit/render-scale.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `packages/core/src/audit.ts` | Typescript module exposing 5 functions and 6 exports (311 lines). | complex |
| `packages/core/src/errors.ts` | Typescript module defining 5 classes (~327 lines). | complex |
| `packages/core/src/registry-resolve.ts` | Typescript module exposing 3 functions and 3 exports (147 lines). | moderate |
| `packages/core/src/standalone-builder.ts` | Typescript module exposing 5 functions and 1 export (268 lines). | complex |
| `packages/core/src/types/registry.ts` | Typescript module exposing 2 functions and 7 exports (240 lines). | complex |
| `scripts/generate-registry.ts` | Typescript module exposing 4 functions and 0 exports (246 lines). | complex |
| `tests/unit/audit.test.ts` | Test file containing 1 test functions and 0 test fixtures. | complex |
| `tests/unit/errors.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `tests/unit/registry-resolve.test.ts` | Test file containing 2 test functions and 0 test fixtures. | moderate |
| `tests/unit/registry.test.ts` | Test file containing 0 test functions and 0 test fixtures. | complex |
| `tests/unit/standalone-builder.test.ts` | Test file containing 1 test functions and 0 test fixtures. | moderate |
| `apps/gallery/src/components/BlurhashImage.astro` | Astro source file (73 lines). | moderate |
| `apps/gallery/src/components/ThemeSwap.astro` | Astro source file (264 lines). | complex |
| `apps/gallery/src/config/site.ts` | Typescript source file (20 lines). | simple |
| `apps/gallery/src/layouts/Layout.astro` | Astro source file (154 lines). | moderate |
| `apps/gallery/src/pages/browse.astro` | Astro source file (172 lines). | moderate |
| `apps/gallery/src/pages/contribute.astro` | Astro source file (208 lines). | moderate |
| `apps/gallery/src/pages/index.astro` | Astro source file (311 lines). | complex |
| `apps/gallery/src/pages/packs/[id].astro` | Astro source file (355 lines). | complex |
| `apps/gallery/src/pages/remix.astro` | Astro source file (212 lines). | complex |
| `apps/gallery/src/pages/search.astro` | Astro source file (285 lines). | complex |
| `packages/core/src/sticker-renderer.ts` | Typescript module exposing 25 functions and 27 exports (1204 lines). | complex |
| `scripts/build-friend-letter.ts` | Typescript source file (108 lines). | moderate |
| `scripts/build-mood-dot.ts` | Typescript source file (126 lines). | moderate |
| `scripts/build-stickers-remaining.ts` | Typescript module exposing 1 function and 0 exports (343 lines). | complex |
| `scripts/build-thought-flip.ts` | Typescript source file (99 lines). | moderate |
| `scripts/build-wave1-stickers.ts` | Typescript module exposing 6 functions and 0 exports (777 lines). | complex |
| `scripts/build-wave2-stickers.ts` | Typescript module exposing 5 functions and 0 exports (875 lines). | complex |
| `scripts/build-wins-jar.ts` | Typescript source file (108 lines). | moderate |
| `scripts/inline-v5-fonts.ts` | Typescript module exposing 4 functions and 0 exports (212 lines). | moderate |
| `packages/core/src/generator-helpers.ts` | Typescript module exposing 5 functions and 5 exports (88 lines). | moderate |
| `packages/core/src/generator.ts` | Typescript module exposing 2 functions and 4 exports (205 lines). | moderate |
| `packages/packs-habit-tracker/generate.ts` | Typescript module exposing 4 functions and 0 exports (147 lines). | moderate |
| `packages/packs-monthly-planner/generate.ts` | Typescript module exposing 1 function and 0 exports (67 lines). | moderate |
| `packages/packs-weekly-planner/generate.ts` | Typescript module exposing 2 functions and 0 exports (117 lines). | moderate |
| `packages/packs-yearly-overview/generate.ts` | Typescript module exposing 1 function and 0 exports (54 lines). | simple |
| `tests/unit/generator-framework.test.ts` | Test file containing 0 test functions and 0 test fixtures. | complex |
| `tests/unit/generators-phase1.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `packages/core/src/pdf-postprocess.ts` | Typescript module exposing 6 functions and 5 exports (301 lines). | complex |
| `packages/core/src/png-renderer.ts` | Typescript module exposing 3 functions and 3 exports (76 lines). | moderate |
| `packages/core/src/svg-renderer.ts` | Typescript module exposing 24 functions and 2 exports (495 lines). | complex |
| `packages/core/src/types/index.ts` | Barrel/entry-point file re-exporting public symbols of its directory (0 exports, 0 fns, 0 classes). | complex |
| `tests/unit/pdf-postprocess-coverage.test.ts` | Test file containing 1 test functions and 0 test fixtures. | complex |
| `tests/unit/pdf-postprocess-property.test.ts` | Test file containing 2 test functions and 0 test fixtures. | moderate |
| `tests/unit/pdf-postprocess.test.ts` | Test file containing 1 test functions and 0 test fixtures. | moderate |
| `tests/unit/svg-renderer.test.ts` | Test file containing 0 test functions and 0 test fixtures. | simple |
| `tests/visual/helpers/diff.ts` | Typescript module exposing 2 functions and 2 exports (156 lines). | moderate |
| `tests/visual/helpers/render.ts` | Typescript module exposing 3 functions and 3 exports (126 lines). | moderate |
| `tests/visual/v5-snapshots.test.ts` | Test file containing 0 test functions and 0 test fixtures. | moderate |
| `docs/gstack-archive/designs/pretext-gallery-homepage-20260430/wireframes-v2.html` | HTML template (wireframes-v2.html, 2294 lines). | complex |
| `docs/gstack-archive/designs/pretext-gallery-homepage-20260430/wireframes-v3.html` | HTML template (wireframes-v3.html, 1831 lines). | complex |
| `docs/gstack-archive/designs/pretext-gallery-homepage-20260430/wireframes.html` | HTML template (wireframes.html, 1352 lines). | complex |
| `packages/core/assets/themes/bold-tech-dark.css` | Stylesheet (bold-tech-dark.css, 23 lines). | simple |
| `packages/core/assets/themes/bold-tech.css` | Stylesheet (bold-tech.css, 28 lines). | simple |
| `packages/core/assets/themes/bubblegum-dark.css` | Stylesheet (bubblegum-dark.css, 23 lines). | simple |
| `packages/core/assets/themes/bubblegum.css` | Stylesheet (bubblegum.css, 28 lines). | simple |
| `packages/core/assets/themes/caffeine-dark.css` | Stylesheet (caffeine-dark.css, 23 lines). | simple |
| `packages/core/assets/themes/caffeine.css` | Stylesheet (caffeine.css, 25 lines). | simple |
| `packages/core/assets/themes/candyland-dark.css` | Stylesheet (candyland-dark.css, 23 lines). | simple |
| `packages/core/assets/themes/candyland.css` | Stylesheet (candyland.css, 27 lines). | simple |
| `packages/core/assets/themes/claude-dark.css` | Stylesheet (claude-dark.css, 23 lines). | simple |
| `packages/core/assets/themes/claude.css` | Stylesheet (claude.css, 25 lines). | simple |
| `packages/core/assets/themes/cyberpunk-dark.css` | Stylesheet (cyberpunk-dark.css, 23 lines). | simple |
| `packages/core/assets/themes/cyberpunk.css` | Stylesheet (cyberpunk.css, 27 lines). | simple |
| `packages/core/assets/themes/doom64-dark.css` | Stylesheet (doom64-dark.css, 23 lines). | simple |
| `packages/core/assets/themes/doom64.css` | Stylesheet (doom64.css, 27 lines). | simple |
| `packages/packs-budget-tracker/budget-tracker.html` | HTML template (budget-tracker.html, 424 lines). | complex |
| `packages/packs-cornell-notes/cornell-notes.html` | HTML template (cornell-notes.html, 523 lines). | complex |
| `packages/packs-eat-the-frog/eat-the-frog.html` | HTML template (eat-the-frog.html, 445 lines). | complex |
| `packages/packs-eisenhower-matrix/eisenhower-matrix.html` | HTML template (eisenhower-matrix.html, 479 lines). | complex |
| `packages/packs-fitness-log/fitness-log.html` | HTML template (fitness-log.html, 411 lines). | complex |
| `packages/packs-goal-setting/goal-setting.html` | HTML template (goal-setting.html, 291 lines). | complex |
| `packages/packs-gratitude-journal/gratitude-journal.html` | HTML template (gratitude-journal.html, 639 lines). | complex |
| `packages/packs-habit-tracker/habit-tracker.html` | HTML template (habit-tracker.html, 916 lines). | complex |
| `packages/packs-meal-planning/meal-planning.html` | HTML template (meal-planning.html, 306 lines). | complex |
| `packages/packs-meeting-notes/meeting-notes.html` | HTML template (meeting-notes.html, 758 lines). | complex |
| `packages/packs-monthly-planner/monthly-planner.html` | HTML template (monthly-planner.html, 516 lines). | complex |
| `packages/packs-mood-tracker/mood-tracker.html` | HTML template (mood-tracker.html, 605 lines). | complex |
| `packages/packs-morning-pages/morning-pages.html` | HTML template (morning-pages.html, 306 lines). | complex |
| `packages/packs-prax-journal/design-system.html` | HTML template (design-system.html, 1352 lines). | complex |
| `packages/packs-prax-journal/versions/v1/daily.dark.css` | Stylesheet (daily.dark.css, 21 lines). | simple |
| `packages/packs-prax-journal/versions/v1/daily.html` | HTML template (daily.html, 617 lines). | complex |
| `packages/packs-prax-journal/versions/v1/monthly.dark.css` | Stylesheet (monthly.dark.css, 21 lines). | simple |
| `packages/packs-prax-journal/versions/v1/monthly.html` | HTML template (monthly.html, 188 lines). | moderate |
| `packages/packs-prax-journal/versions/v1/weekly.dark.css` | Stylesheet (weekly.dark.css, 21 lines). | simple |
| `packages/packs-prax-journal/versions/v1/weekly.html` | HTML template (weekly.html, 401 lines). | complex |
| `packages/packs-prax-journal/versions/v2/monthly.dark.css` | Stylesheet (monthly.dark.css, 21 lines). | simple |
| `packages/packs-prax-journal/versions/v2/monthly.html` | HTML template (monthly.html, 497 lines). | complex |
| `packages/packs-prax-journal/versions/v2/reflect.dark.css` | Stylesheet (reflect.dark.css, 21 lines). | simple |
| `packages/packs-prax-journal/versions/v2/reflect.html` | HTML template (reflect.html, 443 lines). | complex |
| `packages/packs-prax-journal/versions/v2/today.dark.css` | Stylesheet (today.dark.css, 21 lines). | simple |
| `packages/packs-prax-journal/versions/v2/today.html` | HTML template (today.html, 649 lines). | complex |
| `packages/packs-prax-journal/versions/v2/weekly.dark.css` | Stylesheet (weekly.dark.css, 21 lines). | simple |
| `packages/packs-prax-journal/versions/v2/weekly.html` | HTML template (weekly.html, 425 lines). | complex |
| `packages/packs-prax-journal/versions/v3/monthly.dark.css` | Stylesheet (monthly.dark.css, 19 lines). | simple |
| `packages/packs-prax-journal/versions/v3/monthly.html` | HTML template (monthly.html, 552 lines). | complex |
| `packages/packs-prax-journal/versions/v3/reflect.dark.css` | Stylesheet (reflect.dark.css, 19 lines). | simple |
| `packages/packs-prax-journal/versions/v3/reflect.html` | HTML template (reflect.html, 613 lines). | complex |
| `packages/packs-prax-journal/versions/v3/today.dark.css` | Stylesheet (today.dark.css, 19 lines). | simple |
| `packages/packs-prax-journal/versions/v3/today.html` | HTML template (today.html, 977 lines). | complex |
| `packages/packs-prax-journal/versions/v3/weekly.dark.css` | Stylesheet (weekly.dark.css, 19 lines). | simple |
| `packages/packs-prax-journal/versions/v3/weekly.html` | HTML template (weekly.html, 521 lines). | complex |
| `packages/packs-prax-journal/versions/v4/brain-dump.html` | HTML template (brain-dump.html, 401 lines). | complex |
| `packages/packs-prax-journal/versions/v4/reflect.html` | HTML template (reflect.html, 1251 lines). | complex |
| `packages/packs-prax-journal/versions/v4/today.html` | HTML template (today.html, 1189 lines). | complex |
| `packages/packs-prax-journal/versions/v5/brain-dump.html` | HTML template (brain-dump.html, 442 lines). | complex |
| `packages/packs-prax-journal/versions/v5/midday.html` | HTML template (midday.html, 427 lines). | complex |
| `packages/packs-prax-journal/versions/v5/monthly.html` | HTML template (monthly.html, 360 lines). | complex |
| `packages/packs-prax-journal/versions/v5/quarterly.html` | HTML template (quarterly.html, 322 lines). | complex |
| `packages/packs-prax-journal/versions/v5/reflect.html` | HTML template (reflect.html, 405 lines). | complex |
| `packages/packs-prax-journal/versions/v5/today.html` | HTML template (today.html, 523 lines). | complex |
| `packages/packs-prax-journal/versions/v5/weekly.html` | HTML template (weekly.html, 397 lines). | complex |
| `packages/packs-project-planning/project-planning.html` | HTML template (project-planning.html, 684 lines). | complex |
| `packages/packs-prompted-journal/prompted-journal.html` | HTML template (prompted-journal.html, 486 lines). | complex |
| `packages/packs-reading-log/reading-log.html` | HTML template (reading-log.html, 499 lines). | complex |
| `packages/packs-recipe-card/recipe-card.html` | HTML template (recipe-card.html, 509 lines). | complex |
| `packages/packs-reflection-journal/reflection-journal.html` | HTML template (reflection-journal.html, 338 lines). | complex |
| `packages/packs-simple-pages/simple-pages.html` | HTML template (simple-pages.html, 309 lines). | complex |
| `packages/packs-tactile-daily-planner/tactile-daily-planner.html` | HTML template (tactile-daily-planner.html, 751 lines). | complex |
| `packages/packs-tactile-habits/tactile-habits.html` | HTML template (tactile-habits.html, 576 lines). | complex |
| `packages/packs-tactile-reflections/tactile-reflections.html` | HTML template (tactile-reflections.html, 488 lines). | complex |
| `packages/packs-tactile-tasks/tactile-tasks.html` | HTML template (tactile-tasks.html, 632 lines). | complex |
| `packages/packs-travel-planner/travel-planner.html` | HTML template (travel-planner.html, 735 lines). | complex |
| `packages/packs-weekly-planner/weekly-planner.html` | HTML template (weekly-planner.html, 537 lines). | complex |
| `packages/packs-yearly-overview/yearly-overview.html` | HTML template (yearly-overview.html, 412 lines). | complex |
| `.clineignore` | Unknown source file (62 lines). | moderate |
| `.github/CODEOWNERS` | Unknown source file (20 lines). | simple |
| `apps/gallery/astro.config.mjs` | Configuration module exposing settings and tunables (0 exports). | simple |
| `apps/gallery/scripts/build-og-cards.ts` | Typescript module exposing 7 functions and 0 exports (199 lines). | moderate |
| `apps/gallery/scripts/build-theme-palette.ts` | Typescript module exposing 3 functions and 0 exports (147 lines). | moderate |
| `apps/gallery/scripts/copy-pack-pdfs.ts` | Typescript module exposing 1 function and 0 exports (90 lines). | moderate |
| `apps/gallery/scripts/copy-pack-themed-pdfs.ts` | Typescript module exposing 1 function and 0 exports (87 lines). | moderate |
| `apps/gallery/scripts/encode-blurhash.ts` | Typescript module exposing 2 functions and 0 exports (117 lines). | moderate |
| `apps/gallery/scripts/enrich-pack-mdx.ts` | Typescript module exposing 4 functions and 0 exports (192 lines). | moderate |
| `apps/gallery/scripts/generate-specimens.ts` | Typescript module exposing 3 functions and 0 exports (74 lines). | moderate |
| `apps/gallery/scripts/stage-vercel-config.ts` | Configuration module exposing settings and tunables (0 exports). | moderate |
| `apps/gallery/scripts/validate-pack-ids.ts` | Typescript module exposing 2 functions and 0 exports (69 lines). | moderate |
| `apps/gallery/src/content.config.ts` | Configuration module exposing settings and tunables (1 exports). | simple |
| `apps/gallery/src/content/packs/budget-tracker.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/cornell-notes.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/eat-the-frog.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/eisenhower-matrix.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/fitness-log.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/goal-setting.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/gratitude-journal.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/habit-tracker.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/meal-planning.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/meeting-notes.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/monthly-planner.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/mood-tracker.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/morning-pages.mdx` | Mdx source file (40 lines). | simple |
| `apps/gallery/src/content/packs/prax-journal.mdx` | Mdx source file (28 lines). | simple |
| `apps/gallery/src/content/packs/project-planning.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/prompted-journal.mdx` | Mdx source file (40 lines). | simple |
| `apps/gallery/src/content/packs/reading-log.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/recipe-card.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/reflection-journal.mdx` | Mdx source file (40 lines). | simple |
| `apps/gallery/src/content/packs/simple-pages.mdx` | Mdx source file (44 lines). | simple |
| `apps/gallery/src/content/packs/tactile-daily-planner.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/tactile-habits.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/tactile-reflections.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/tactile-tasks.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/travel-planner.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/weekly-planner.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/content/packs/yearly-overview.mdx` | Mdx source file (36 lines). | simple |
| `apps/gallery/src/styles/global.css` | Stylesheet (global.css, 200 lines). | moderate |
| `audit/_runtime/dependency-graph.mmd` | Mmd source file (18 lines). | simple |
| `docs/gstack-archive/main-reviews.jsonl` | Jsonl source file (9 lines). | simple |
| `docs/gstack-archive/timeline.jsonl` | Jsonl source file (5 lines). | simple |
| `eslint.config.js` | Configuration module exposing settings and tunables (0 exports). | moderate |
| `examples/prax-journal/prax_adhd_planner.html` | HTML template (prax_adhd_planner.html, 1271 lines). | complex |
| `output/.gitkeep` | Unknown source file (0 lines). | simple |
| `packages/core/assets/base.css` | Stylesheet (base.css, 229 lines). | complex |
| `packages/core/src/packs.ts` | Typescript module exposing 5 functions and 4 exports (493 lines). | complex |
| `playwright.config.ts` | Configuration module exposing settings and tunables (0 exports). | moderate |
| `references/stitch_cute_skeuomorphic_todo_journal/daily_planner_refined/code.html` | HTML template (code.html, 369 lines). | complex |
| `references/stitch_cute_skeuomorphic_todo_journal/daily_planner/code.html` | HTML template (code.html, 368 lines). | complex |
| `references/stitch_cute_skeuomorphic_todo_journal/daily_reflections_refined/code.html` | HTML template (code.html, 330 lines). | complex |
| `references/stitch_cute_skeuomorphic_todo_journal/daily_reflections/code.html` | HTML template (code.html, 330 lines). | complex |
| `references/stitch_cute_skeuomorphic_todo_journal/habit_tracker_refined/code.html` | HTML template (code.html, 500 lines). | complex |
| `references/stitch_cute_skeuomorphic_todo_journal/habit_tracker/code.html` | HTML template (code.html, 500 lines). | complex |
| `references/stitch_cute_skeuomorphic_todo_journal/tasks_notes_refined/code.html` | HTML template (code.html, 375 lines). | complex |
| `references/stitch_cute_skeuomorphic_todo_journal/tasks_notes/code.html` | HTML template (code.html, 375 lines). | complex |
| `scripts/audit.sh` | Shell source file (116 lines). | moderate |
| `scripts/build-stickers.ts` | Typescript module exposing 1 function and 0 exports (52 lines). | simple |
| `scripts/bundle-release.ts` | Typescript module exposing 9 functions and 0 exports (483 lines). | complex |
| `scripts/download-fonts.ts` | Typescript module exposing 6 functions and 0 exports (171 lines). | moderate |
| `scripts/migrate-packs-w5.ts` | Typescript module exposing 9 functions and 0 exports (446 lines). | complex |
| `scripts/probe-ink-density.ts` | Typescript source file (40 lines). | simple |
| `scripts/probe-sharp-fraunces.ts` | Typescript module exposing 1 function and 0 exports (84 lines). | moderate |
| `scripts/rebuild-all-stickers-index.ts` | Typescript module exposing 4 functions and 0 exports (230 lines). | moderate |
| `scripts/render-tactile-preview.ts` | Typescript module exposing 1 function and 0 exports (64 lines). | moderate |
| `scripts/smoke-prod-headers.sh` | Shell source file (99 lines). | moderate |
| `tests/e2e/gallery-smoke.spec.ts` | Test file containing 0 test functions and 0 test fixtures. | complex |
| `tests/unit/contrast.test.ts` | Test file containing 5 test functions and 0 test fixtures. | moderate |
| `tests/unit/vercel-config.test.ts` | Test file containing 2 test functions and 0 test fixtures. | moderate |
| `vitest.config.ts` | Configuration module exposing settings and tunables (0 exports). | moderate |
| `vitest.visual.config.ts` | Configuration module exposing settings and tunables (0 exports). | simple |

## Complexity Hotspots

These components are the most complex and deserve extra attention:

- **prax-journal-renderer.ts** (file): Typescript module exposing 10 functions and 12 exports (453 lines).
- **profile.ts** (file): Typescript module exposing 1 function and 4 exports (288 lines).
- **safari-probe.ts** (file): Typescript module exposing 5 functions and 0 exports (416 lines).
- **writeGuide** (function): Function `writeGuide` (111 lines) in safari-probe.ts.
- **pdf-splice.test.ts** (file): Test file containing 1 test functions and 0 test fixtures.
- **prax-journal-renderer.test.ts** (file): Test file containing 1 test functions and 0 test fixtures.
- **profile.test.ts** (file): Test file containing 2 test functions and 0 test fixtures.
- **index.ts** (file): Barrel/entry-point file re-exporting public symbols of its directory (0 exports, 0 fns, 0 classes).
- **startPreviewServer** (function): Function `startPreviewServer` (105 lines) in preview-server.ts.
- **puppeteer-renderer.ts** (file): Typescript module exposing 12 functions and 9 exports (448 lines).
- **renderHTMLToPDF** (function): Function `renderHTMLToPDF` (102 lines) in puppeteer-renderer.ts.
- **puppeteer-renderer-mock.test.ts** (file): Test file containing 5 test functions and 0 test fixtures.
- **audit.ts** (file): Typescript module exposing 5 functions and 6 exports (311 lines).
- **errors.ts** (file): Typescript module defining 5 classes (~327 lines).
- **standalone-builder.ts** (file): Typescript module exposing 5 functions and 1 export (268 lines).
- **registry.ts** (file): Typescript module exposing 2 functions and 7 exports (240 lines).
- **generate-registry.ts** (file): Typescript module exposing 4 functions and 0 exports (246 lines).
- **main** (function): Function `main` (103 lines) in generate-registry.ts.
- **audit.test.ts** (file): Test file containing 1 test functions and 0 test fixtures.
- **registry.test.ts** (file): Test file containing 0 test functions and 0 test fixtures.
- **ThemeSwap.astro** (file): Astro source file (264 lines).
- **index.astro** (file): Astro source file (311 lines).
- **[id].astro** (file): Astro source file (355 lines).
- **remix.astro** (file): Astro source file (212 lines).
- **search.astro** (file): Astro source file (285 lines).
- **sticker-renderer.ts** (file): Typescript module exposing 25 functions and 27 exports (1204 lines).
- **stickerShell** (function): Function `stickerShell` (246 lines) in sticker-renderer.ts.
- **build-stickers-remaining.ts** (file): Typescript module exposing 1 function and 0 exports (343 lines).
- **build-wave1-stickers.ts** (file): Typescript module exposing 6 functions and 0 exports (777 lines).
- **build-wave2-stickers.ts** (file): Typescript module exposing 5 functions and 0 exports (875 lines).
- **generator-framework.test.ts** (file): Test file containing 0 test functions and 0 test fixtures.
- **pdf-postprocess.ts** (file): Typescript module exposing 6 functions and 5 exports (301 lines).
- **svg-renderer.ts** (file): Typescript module exposing 24 functions and 2 exports (495 lines).
- **index.ts** (file): Barrel/entry-point file re-exporting public symbols of its directory (0 exports, 0 fns, 0 classes).
- **pdf-postprocess-coverage.test.ts** (file): Test file containing 1 test functions and 0 test fixtures.
- **AGENTS.md** (document): Documentation: 18 sections, 332 lines.
- **CHANGELOG.md** (document): Changelog tracking releases and notable changes (13 sections, 295 lines).
- **CONTRIBUTING.md** (document): Contributor guide with 16 sections covering development workflow and conventions.
- **PROBLEM_STATEMENT.md** (document): Documentation: 39 sections, 374 lines.
- **README.md** (document): Project README with 16 sections (480 lines) — primary entry-point documentation.
- **RESEARCH.md** (document): Documentation: 48 sections, 478 lines.
- **registry.json** (config): registry.json configuration file (480 lines).
- **findings.json** (config): findings.json configuration file (1100 lines).
- **CODEBASE_AUDIT_REPORT.json.md** (document): Documentation: 1 sections, 222 lines.
- **CODEBASE_AUDIT_REPORT.md** (document): Documentation: 32 sections, 350 lines.
- **architecture.md** (document): Documentation: 8 sections, 229 lines.
- **findings.md** (document): Documentation: 41 sections, 628 lines.
- **HLD-self-contained-templates.md** (document): Documentation: 19 sections, 233 lines.
- **LLD-self-contained-templates.md** (document): Documentation: 38 sections, 571 lines.
- **design-review-v5-2026-04-27.md** (document): Documentation: 38 sections, 337 lines.
- **plan-ceo-review-sticker-expansion-v1.md** (document): Documentation: 39 sections, 385 lines.
- **plan-ceo-review-v2-10x-expansion.md** (document): Documentation: 33 sections, 398 lines.
- **plan-ceo-review-v5-10x-100x-expansion.md** (document): Documentation: 61 sections, 795 lines.
- **plan-eng-review-weekly-monthly-stickers.md** (document): Documentation: 26 sections, 340 lines.
- **praxlannister-main-design-20260409-194856.md** (document): Documentation: 24 sections, 273 lines.
- **praxlannister-main-design-20260430-163246.md** (document): Documentation: 28 sections, 521 lines.
- **praxlannister-main-design-review-20260430-2058.md** (document): Documentation: 18 sections, 287 lines.
- **praxlannister-main-devex-review-20260430-2110.md** (document): Documentation: 20 sections, 285 lines.
- **praxlannister-main-eng-review-20260430-1935.md** (document): Documentation: 17 sections, 299 lines.
- **wireframes-v2.html** (file): HTML template (wireframes-v2.html, 2294 lines).
- **wireframes-v3.html** (file): HTML template (wireframes-v3.html, 1831 lines).
- **wireframes.html** (file): HTML template (wireframes.html, 1352 lines).
- **budget-tracker.html** (file): HTML template (budget-tracker.html, 424 lines).
- **cornell-notes.html** (file): HTML template (cornell-notes.html, 523 lines).
- **eat-the-frog.html** (file): HTML template (eat-the-frog.html, 445 lines).
- **eisenhower-matrix.html** (file): HTML template (eisenhower-matrix.html, 479 lines).
- **fitness-log.html** (file): HTML template (fitness-log.html, 411 lines).
- **goal-setting.html** (file): HTML template (goal-setting.html, 291 lines).
- **gratitude-journal.html** (file): HTML template (gratitude-journal.html, 639 lines).
- **habit-tracker.html** (file): HTML template (habit-tracker.html, 916 lines).
- **meal-planning.html** (file): HTML template (meal-planning.html, 306 lines).
- **meeting-notes.html** (file): HTML template (meeting-notes.html, 758 lines).
- **monthly-planner.html** (file): HTML template (monthly-planner.html, 516 lines).
- **mood-tracker.html** (file): HTML template (mood-tracker.html, 605 lines).
- **morning-pages.html** (file): HTML template (morning-pages.html, 306 lines).
- **DESIGN.md** (document): Documentation: 35 sections, 410 lines.
- **README.md** (document): Project README with 9 sections (295 lines) — primary entry-point documentation.
- **design-system.html** (file): HTML template (design-system.html, 1352 lines).
- **daily.html** (file): HTML template (daily.html, 617 lines).
- **weekly.html** (file): HTML template (weekly.html, 401 lines).
- **monthly.html** (file): HTML template (monthly.html, 497 lines).
- **reflect.html** (file): HTML template (reflect.html, 443 lines).
- **today.html** (file): HTML template (today.html, 649 lines).
- **weekly.html** (file): HTML template (weekly.html, 425 lines).
- **monthly.html** (file): HTML template (monthly.html, 552 lines).
- **reflect.html** (file): HTML template (reflect.html, 613 lines).
- **today.html** (file): HTML template (today.html, 977 lines).
- **weekly.html** (file): HTML template (weekly.html, 521 lines).
- **brain-dump.html** (file): HTML template (brain-dump.html, 401 lines).
- **reflect.html** (file): HTML template (reflect.html, 1251 lines).
- **today.html** (file): HTML template (today.html, 1189 lines).
- **brain-dump.html** (file): HTML template (brain-dump.html, 442 lines).
- **midday.html** (file): HTML template (midday.html, 427 lines).
- **monthly.html** (file): HTML template (monthly.html, 360 lines).
- **quarterly.html** (file): HTML template (quarterly.html, 322 lines).
- **reflect.html** (file): HTML template (reflect.html, 405 lines).
- **today.html** (file): HTML template (today.html, 523 lines).
- **weekly.html** (file): HTML template (weekly.html, 397 lines).
- **project-planning.html** (file): HTML template (project-planning.html, 684 lines).
- **prompted-journal.html** (file): HTML template (prompted-journal.html, 486 lines).
- **reading-log.html** (file): HTML template (reading-log.html, 499 lines).
- **recipe-card.html** (file): HTML template (recipe-card.html, 509 lines).
- **reflection-journal.html** (file): HTML template (reflection-journal.html, 338 lines).
- **simple-pages.html** (file): HTML template (simple-pages.html, 309 lines).
- **tactile-daily-planner.html** (file): HTML template (tactile-daily-planner.html, 751 lines).
- **tactile-habits.html** (file): HTML template (tactile-habits.html, 576 lines).
- **tactile-reflections.html** (file): HTML template (tactile-reflections.html, 488 lines).
- **tactile-tasks.html** (file): HTML template (tactile-tasks.html, 632 lines).
- **travel-planner.html** (file): HTML template (travel-planner.html, 735 lines).
- **weekly-planner.html** (file): HTML template (weekly-planner.html, 537 lines).
- **yearly-overview.html** (file): HTML template (yearly-overview.html, 412 lines).
- **findings.json** (config): findings.json configuration file (321 lines).
- **STATUS.md** (document): Documentation: 17 sections, 264 lines.
- **2026-04-30-shadcn-for-goodnotes.md** (document): Documentation: 35 sections, 437 lines.
- **2026-04-10-self-contained-templates-design.md** (document): Documentation: 35 sections, 445 lines.
- **prax_adhd_planner.html** (file): HTML template (prax_adhd_planner.html, 1271 lines).
- **base.css** (file): Stylesheet (base.css, 229 lines).
- **packs.ts** (file): Typescript module exposing 5 functions and 4 exports (493 lines).
- **code.html** (file): HTML template (code.html, 369 lines).
- **code.html** (file): HTML template (code.html, 368 lines).
- **code.html** (file): HTML template (code.html, 330 lines).
- **code.html** (file): HTML template (code.html, 330 lines).
- **code.html** (file): HTML template (code.html, 500 lines).
- **code.html** (file): HTML template (code.html, 500 lines).
- **code.html** (file): HTML template (code.html, 375 lines).
- **code.html** (file): HTML template (code.html, 375 lines).
- **bundle-release.ts** (file): Typescript module exposing 9 functions and 0 exports (483 lines).
- **main** (function): Function `main` (205 lines) in bundle-release.ts.
- **migrate-packs-w5.ts** (file): Typescript module exposing 9 functions and 0 exports (446 lines).
- **gallery-smoke.spec.ts** (file): Test file containing 0 test functions and 0 test fixtures.

---

*Generated by [Understand Anything](https://github.com/Lum1104/Understand-Anything) from knowledge graph v1.0.0*
