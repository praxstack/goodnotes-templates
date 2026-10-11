# goodnotes-templates — Understanding (comprehension lead, 2026-10-05)

HEAD f93ff9b (2026-06-11). 195 commits (171 "Prax Lannister", 22 "prax", 1 cline, 1 dependabot). Activity: dense 2026-04 to 2026-06-11, none on main since; only Dependabot + scheduled workflows since.
Repo is PUBLIC; .git pack 415 MiB (tracked content ~408 MB in packages/, 382 MB of it under packages/packs-prax-journal/stickers).

## Purpose
Programmatic generator of GoodNotes-ready planner/journal/tracker templates (HTML -> PDF via Puppeteer, SVG/Sharp stickers), plus an Astro "gallery" site and a pack registry. Single author (Prax). Brands drift: repo `goodnotes-templates`, root package `pretext-templates`, npm scope `@praxlannister/pretext-{core,cli}`, docs say `@pretext-templates/*`, CLI name `goodnotes-templates`/`pretext`.

## Architecture / module map
- Root: npm workspaces (`packages/*`, `apps/*`), `package-lock.json` AND `pnpm-lock.yaml` both tracked; `pnpm-workspace.yaml` contains only a placeholder `allowBuilds: esbuild: set this to true or false`. Real tool = npm (CI uses npm ci).
- `packages/core` (`@praxlannister/pretext-core`): puppeteer-renderer.ts (HTML->PDF, restart loop), pdf-postprocess.ts (pdf-lib merge/bookmarks/links/metadata), pdf-splice.ts/splice.ts, prax-journal-renderer.ts (PageSpec -> PDF, `substituteProfile`), svg-renderer.ts / sticker-renderer.ts (1204 lines, 15+ sticker types) / png-renderer.ts, packs.ts (pack registry, generator packs), registry-resolve.ts (semver resolution), standalone-builder.ts, dimensions.ts (paper sizes), audit.ts, errors.ts (typed errors), generator.ts + generator-helpers.ts, types/ (zod schemas incl. profile.ts), utils/locale.ts.
- `packages/cli`: commander CLI with commands render, list, preview (local server on 127.0.0.1), init, remix, generate <pack-id>, audit. preview-server.ts, scaffold.ts.
- `packages/packs-*` (27): each has manifest.json, <id>.html, README, optional generate.ts. `packs-prax-journal` is the flagship (versions v1..v7, v6 = 134 files, v6.zip 19.9 MB, stickers/ 60 PNG ~382 MB + SVG, SPEC/DESIGN/CHANGELOG, profile.example.json).
- `apps/gallery`: Astro 6 + MDX content layer (content/packs/*.mdx), routes: index, browse, search, remix, contribute, packs/[id]; scripts (build-og-cards, copy-pack-pdfs, copy-pack-themed-pdfs); deployed on Vercel (vercel.json with CSP + PDF headers).
- `scripts/`: sticker builders (build-stickers*, wave1/2, wins-jar...), generate-journal.ts, bundle-release.ts ("The Praxis Ledger" monthly bundle), build-standalone-html.ts, generate-registry.ts, render-all-pack-themes.ts (27x14=378 themed PDFs), safari-probe.ts, audit.sh.
- `cline/` and `codex/`: parallel AI-agent-authored v7-v9 Prax Journal builders (Daily Pilot, Truth Deck, Pomodoro, 30-day bundle) outside the workspace; `shared/` fonts; `references/` design refs; `audit/` (6 iterations of CODEX-AUDIT findings); `docs/` (plans, HLD/LLD, council transcript, ONBOARDING, CUSTOMISATION, NORTH-STAR); `.understand-anything/` tool scratch tracked.

## Main flows
1. `render <html>` -> Puppeteer -> PDF (default out path logic; see finding on stale `^packs/` regex).
2. `generate <pack-id> [--year/--month/--habits/...]` -> generator pack -> PDF.
3. Prax Journal pipeline: `scripts/generate-journal.ts --from --to` -> buildPageSequence -> substituteProfile (profile.json, gitignored PII) -> pdf-splice with bookmarks -> `bundle-release.ts` -> output/<Ledger>/ (PDF 54 MB, HTML, stickers).
4. Gallery: registry.json + MDX -> Astro build -> Vercel; themed PDFs copied into public/.
Persistence: files only (no DB). Profile JSON on disk (gitignored; CI gate FIND-I4-001). External: Google Fonts (renderer allows fonts.googleapis.com), npm/Vercel/GitHub releases (cosign in generate.yml release job). Env: PRAX_RENDER_SCALE. Needs a Puppeteer Chrome (here: not installed, ver 131.0.6778.204 expected) for anything that renders PDFs.

## Build / test (verified today)
- `npm run build` (tsc -b core+cli): OK. `npx vitest run`: 25 files / 383 tests pass in ~1s. `npm run lint`: 0 errors, 2 warnings (build-master-index.ts:46, build-v6-pdf.ts:336). `node packages/cli/dist/index.js --help` works.
- `npm ci` FAILS (locally and in CI): lockfile out of sync (package.json playwright ^1.60.0 / tsx ^4.22.3 / pdf-lib added in 912ee6f 2026-05-30; lock last regenerated 2026-05-12 at 1.59.1 / 4.21.0).
- `npm audit --audit-level=high` failed at audit time (fixed by GNT-003 in PR #25). The CI step would have failed even with a synced lockfile.
- Not executed: playwright e2e, test:visual, gallery build (heavy; Chrome absent).

## CI (.github/workflows)
- ci.yml (PR + push main): npm ci, PII gate, build, lint, test+coverage, npm audit high, coverage upload. Every recorded run on main since 2026-06-03 and every Dependabot PR run FAILED.
- generate.yml (push to main on `src/**`/package.json): runs `npx tsx src/cli/index.ts generate --pages --stickers` — `src/` does not exist, CLI `generate` takes `<pack-id>` and has no --pages/--stickers; path filter `src/**` never matches. Last runs all failed (May); the release job (cosign) has never worked.
- audit.yml monthly probe: fails at `npm ci` (2026-08-01, 09-01, 10-01); also a 5h18m run on 10-01. Cannot open tracking issue as claimed.
- dependabot.yml: weekly grouped PRs (prod/dev/actions); 3 open (#22,#23,#24) all failing CI; #16 ImgBot open.

## GitHub backlog
Open issues: 0. PRs: 24 total; open #16 (ImgBot, 2026-05-30), #22, #23, #24 (Dependabot). Remote branches ahead of main: dependabot/* x5 (1 commit each), imgbot (1). No human branches.

## Documents: authoritative vs historical
Authoritative-ish: AGENTS.md (Karpathy principles), package.json/CI files, DECISIONS.md (33 rows, through W14), CHANGELOG.md [Unreleased] (Tier-2 themes), docs/CUSTOMISATION.md, packages/packs-prax-journal/SPEC.md + v6/v7 SPEC, README (partially).
Historical / stale: CLAUDE.md (describes pre-monorepo `packs/`, `src/` layout and HEAD e96c88f, last updated 2026-04-30), CHECKPOINT.md ("Session 1": src/templates/... plan, 27 tests), SPRINT-STATUS.md (2026-05-05: 235 tests/22 packs), TODOS.md ("pretext-templates", gated), CONTRIBUTING.md (`packs/<category>/...`, `tsc --noEmit`), PROBLEM_STATEMENT/RESEARCH, docs/plan-*, audit/iteration-*.

## Roadmap vs reality (spot checks, 12)
1. "235/235 tests, 18 files" (SPRINT-STATUS) -> now 383/25 (stale count, code ahead). OK direction.
2. "22 packs" (SPRINT-STATUS, DECISIONS #7) -> 27 dirs and 27 registry entries; README says 27. Doc drift only in SPRINT-STATUS/DECISIONS.
3. "`node packages/cli/dist/index.js` fails ERR_MODULE_NOT_FOUND" (SPRINT-STATUS 5a) -> works now (stale gap).
4. "CI gates PRs on build+test+audit" (ci.yml header) -> job red on every run since 2026-06-03.
5. "Monthly audit probe ... Opens a tracking issue" -> never reaches that; fails at npm ci; also no issue-opening step present in audit.yml.
6. "Generate Assets release pipeline" (generate.yml) -> invokes nonexistent src/cli/index.ts.
7. README line 149 `packs/ <- 27 shippable templates` -> directory does not exist; packs are packages/packs-*.
8. CLAUDE.md: `src/packs.ts`, `src/core/puppeteer-renderer.ts`, `src/cli/index.ts` -> all moved to packages/core/src, packages/cli/src.
9. .gitignore sticker PNG rule (`packs/journals/prax-journal/stickers/*/*.png`, "regenerable, saves 59 MB") is on old path; 60 PNGs (~9.7 MB each, ~382 MB total in tracked sticker dir) are tracked under packages/ -> repo bloat of 415 MiB.
10. PII guard: new-path rules exist (.gitignore:45-47) and `git check-ignore` confirms profile.json/profile.*.json ignored; only profile.example.json tracked. Claim holds. gitleaks history/tree: no leaks; trufflehog empty.
11. CLI default output path: `template.replace(/^packs\//,'output/')` (packages/cli/src/index.ts, render action) never matches `packages/...` -> PDF written next to the source template inside the source tree.
12. Pack manifests/registry `repository` still `praxstack/pretext-templates` (registry.json:105 etc.); registry.json source_commit a65f26c4 / generated 2026-05-08 vs HEAD f93ff9b.
13. Prax Journal v7: commit messages claim "v7 Daily Pilot + Truth Deck build"; versions/v7 holds only SPEC.md, code lives in cline/ and codex/ outside workspace/lint/test (cline/ is not covered by `npm run lint` which targets packages/ scripts/ tests/).
14. Deferred items in SPRINT-STATUS (W9 iPad, W15 Docker, CF Worker, v1.0 tag/npm publish/DNS) remain undone; README shows npm badges for @praxlannister/pretext-* which depend on a publish that SPRINT-STATUS says was human-gated (unverified whether published).
Unfinished per TODOS.md (gated): Tier-3 editor T-001, i18n T-002, etc. FIND-0012/0014b/0018/0012-companion audit deferrals untouched.

## Risk areas for bug hunters
- packages/cli/src/index.ts (stale path regexes, generate/audit command wiring), packages/core/src/puppeteer-renderer.ts (browser restart/memory; request blocking), prax-journal-renderer.ts + substituteProfile, standalone-builder.ts, sticker-renderer.ts (1204 lines, SVG string building), preview-server.ts, scaffold.ts (`isValidPackId`), registry-resolve.ts, apps/gallery client scripts (theme swap, shareable URL, search `?q=`), build-v6-pdf.ts, CI/workflow integrity. Security-related risk areas: details kept privately by the owner.

## Pre-pass scanner summary
gitleaks history (200 commits) + tree: none. trufflehog: none. Other scanner results (osv, semgrep, trivy): details kept privately by the owner.

## Addendum (from earlier-run logs in this dir, test-visual2.log)
`npm run test:visual` fails 11/11: tests/visual reads `packs/journals/prax-journal/versions/v5/*.html` (pre-monorepo path, ENOENT). README documents test:visual as a gate. Gallery build (gallery-build.log) validates 27 packs and soft-skips themed PDFs when dist/packs-themed is absent; render-all-packs.ts rendered 27/27 OK in an earlier run.
