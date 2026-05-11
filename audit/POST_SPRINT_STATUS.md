# Post-implementation status — CODEX-AUDIT v1.1 findings

> **⚠ SUPERSEDED 2026-05-11.** This document is the frozen iter-3 snapshot.
> The current-of-record status doc is [`iteration-4/STATUS.md`](./iteration-4/STATUS.md).
> Kept here for historical reference (FIND-I4-007).

**Date:** 2026-04-18
**Branch:** `main`
**Implementation commits:** 7 atomic commits (`4ff4ed8 … 57453b3`) after the audit commit (`53beee8`).

## Verification (HEAD)

| Check | Before | After |
|---|---|---|
| `npx tsc --noEmit` | **2 errors (FIND-0011)** | **exit 0** ✓ |
| `npx vitest run` | 25 tests | **47 tests** ✓ |
| `npm audit` | 6 vulns (1 high, 5 moderate) | **0 vulnerabilities** ✓ |
| Production deps | 12 (8 unused) | **4** (all used) ✓ |
| `.github/workflows/` | 1 (generate only, no PR gate) | **2** (ci.yml + generate.yml, both SHA-pinned) ✓ |
| Release artifacts | Unsigned | **cosign-signed** (.sig + .crt) ✓ |
| Preview server bind | 0.0.0.0 | **127.0.0.1** ✓ |
| Symlink path-traversal POC | Succeeds (leaks /etc/passwd) | **Returns 403** ✓ |
| `yourusername/` placeholder | 3 hits | **0 hits** ✓ |
| THIRD_PARTY_LICENSES.md | absent | **present with LGPL notice** ✓ |

## Closed findings (23 of 27)

| ID | Title | Priority | Commit |
|---|---|---|---|
| FIND-0001 | Preview bind 127.0.0.1 | P1 | 9b67b76 |
| FIND-0002 | Complete HTML escape | P2 | 9b67b76 |
| FIND-0003 | Chromium --no-sandbox CI-only | P2 | e1ef399 |
| FIND-0004 | Puppeteer request allow-list | P2 | e1ef399 |
| FIND-0005 | basic-ftp HIGH CVE | P1 | e4f324c |
| FIND-0006 | vitest → vitest@4.1.4 | P2 | e4f324c |
| FIND-0007 | Remove 12 unused deps | P1 | e4f324c |
| FIND-0008 | CI gate on PRs | P0 | 31c1c6d |
| FIND-0009 | Pin Actions by SHA | P1 | 31c1c6d |
| FIND-0010 | Sign releases (cosign) | P2 | 31c1c6d |
| FIND-0011 | Fix tsc --noEmit | P0 | 4ff4ed8 |
| FIND-0013 | Doc drift to deleted files | P1 | ce12534 |
| FIND-0015 | Dedup color-mode resolver | P2 | e1ef399 |
| FIND-0016 | T1 module tests (12+8+4 = 24 new) | P1 | 57453b3 |
| FIND-0017 | batchRenderHTML failure array | P2 | e1ef399 |
| FIND-0019 | Fix package.json + README URLs | P2 | e4f324c + ce12534 |
| FIND-0020 | THIRD_PARTY_LICENSES.md | P2 | ce12534 |
| FIND-0021 | ETag + Cache-Control | P3 | 9b67b76 |
| FIND-0022 | Symlink path-traversal (POC-verified) | P0 | 9b67b76 |
| FIND-0023 | NUL / backslash filter | P3 | 9b67b76 |
| FIND-0024 | addHyperlinks rect validation | P2 | e1ef399 |
| FIND-0025 | getBrowser race (cache promise) | P3 | e1ef399 |
| FIND-0026 | addBookmarks strict-mode option | P2 | e1ef399 |
| FIND-0027 | escXml in SVG generators | P3 | e1ef399 |

**Rate:** 23/27 findings closed in 7 commits. The 3 P0 blockers (FIND-0008, -0011, -0022) are closed, verified live, and covered by new regression tests.

## Deferred findings (4 of 27) — backlog

Each of these requires substantive design work or content churn the audit author should own.

### FIND-0012 — Replace bespoke HTML parser with cheerio (M)

- **Why defer:** Works today; correctness only at risk if a contributor adds HTML comments or attribute variations around `<body>` / `<div class="page">`. Adds `cheerio` (~1.5 MB). Best handled at the same time the year-planner is next touched.
- **When:** Next feature that modifies `daily-year-v2.ts`.
- **Acceptance:** `parseSinglePageTemplate` uses `cheerio.load(html)` and has the test fixtures described in `TEST_STRATEGY.md §2`.

### FIND-0014 — Self-host Google Fonts (M)

- **Why defer:** Requires downloading ~20 woff2 files into `assets/fonts/`, mutating 32 HTML templates to replace `<link>` with `@font-face`, and writing `scripts/download-fonts.ts` (declared in `package.json` but missing from disk). Each template change is visual — needs a before/after render check. FIND-0004 (Puppeteer request allow-list) is already shipped, so fonts.googleapis.com + fonts.gstatic.com remain on the allow-list as a safety net.
- **When:** Dedicated font-hosting PR.
- **Acceptance:** `docker run --network=none` can render every template. Allow-list in `puppeteer-renderer.ts` can drop the `fonts.*` domains and keep only `data:` + `file:`.

### FIND-0018 — Dark-mode parity + WCAG contrast (M)

- **Why defer:** Advertised (`PROBLEM_STATEMENT.md FR-04.2`) as "every light theme has a dark variant"; today 11/32 HTML templates have `.dark.css`. Adding the other 21 requires design judgment (matching contrast targets on the existing color system). Also want a scripted WCAG 4.5:1 contrast gate.
- **When:** Dedicated a11y PR with a contrast-ratio check in CI.
- **Acceptance:** Each of the 32 HTML templates has a `.dark.css` sibling, or the PROBLEM_STATEMENT gets scoped down to the subset that does. A new `tests/unit/contrast.test.ts` parses `--fg` / `--bg` variables and fails on sub-4.5:1 pairs.

### FIND-0012-companion: color-mode resolver caller update

- **Why defer:** `scripts/generate-4week.ts` still has its own two-step `resolveColorModeCSS` equivalent. `puppeteer-renderer.ts` now exports the helper, but flipping the script to use it is one of many script-file touch-ups that should happen when the scripts see their next refresh. Not a regression today.
- **Acceptance:** `rg 'presetPath.*themes.*\.css' scripts/` returns 0 matches.

## Backlog hygiene

Two tiny carry-overs in the fix batch:

- **Font allow-list tightening** — the Puppeteer URL allow-list today is `data:|file:|fonts.googleapis.com|fonts.gstatic.com`. Once FIND-0014 ships it becomes `data:|file:` only. Record as a companion todo in `src/core/puppeteer-renderer.ts` line ~107.
- **`vitest.visual.config.ts`** — referenced by `package.json.scripts.test:visual` but missing from disk. Either create it (alongside a concrete visual-regression setup) or drop the script entry. Low priority; no tool currently invokes it.

---

## 2026-05-08 · Post-v1.0.0 audit re-evaluation

After shipping v1.0.0 (tag `f5a4528`, gallery live at `pretext-templates.vercel.app`, 27 packs, 14 themes), we re-examined the 4 remaining deferred items. Architecture has shifted enough that the original findings no longer map cleanly. Verdict per item:

### FIND-0012 — cheerio swap — **CLOSED (file deleted)**

- `daily-year-v2.ts` no longer exists on HEAD. The rebrand sprint's splice/render pipeline (`scripts/generate-journal.ts` → `packages/core/src/pdf-splice.ts`) replaced it with pdf-lib-native page composition; no HTML parsing happens outside Puppeteer.
- No follow-up needed. If a future feature re-introduces HTML parsing outside the renderer, reach for `cheerio` from day one.

### FIND-0012-companion — color-mode resolver caller update — **CLOSED (scripts deleted)**

- `scripts/generate-4week.ts` was deleted during the rebrand. The modern renderer entry point is `packages/cli/src/index.ts`, which uses `@praxlannister/pretext-core/puppeteer-renderer` via the subpath export. The helper is consumed through the published API now, not via file-path probing.

### FIND-0014 — Self-host Google Fonts — **RE-DEFERRED with updated rationale**

Original reason (SSRF via CDN) is already mitigated by FIND-0004 — the Puppeteer request allow-list locks outbound to `data:`, `file:`, `fonts.googleapis.com`, `fonts.gstatic.com`. The surviving reason to self-host is `docker run --network=none` support and carrier-grade offline rendering.

- **Cost now:** 27 packs pull Google Fonts (`cornell-notes.html` alone cites Poppins + Lora + Fira Code). Base64-inlining fonts into every pack would add ~1.2-1.8 MB per PDF (already proven on prax-journal v5) = +30-50 MB across the release zip.
- **Acceptance (revised):** opt-in not default. Add `--inline-fonts` flag to `@praxlannister/pretext-cli render` that downloads, subsets, and base64-inlines fonts at render time. Default off. Self-hosted-fonts CI gate only runs on packs flagged `"offline": true` in their manifest.
- **When:** when a real user asks for offline rendering. Until then the allow-list is a defensible posture.

### FIND-0018 — Dark-mode parity — **OBSOLETED — deliverable already shipped via theme system**

Re-audited on 2026-05-08: **27 pack HTMLs, 0 `.dark.css` siblings in the current pack dirs.** But the premise — "mechanically add 21 `.dark.css` siblings" — is wrong for the 2026 pack catalog:

1. Each pack uses a bespoke design-token palette (the tactile claymorphic family alone declares 20+ variables for cream paper + dusty rose + mint rings; a `prefers-color-scheme: dark` invert would obliterate the skeuomorphic gradients).
2. The v1/v2/v3/v4 prax-journal `.dark.css` files that existed pre-rebrand were variable overrides, not theme recolors; they are still on disk at `packages/packs-prax-journal/versions/v{1,2,3,4}/`.
3. The theme system that does work (`packages/core/assets/themes/*.css` → `apps/gallery/src/data/theme-palette.json`) is orthogonal to per-pack `.dark.css`. With v1.0.0 + this session's commit `bb10a15`, all 14 light + dark palettes are surfaced in the gallery and baked into 378 OG cards.
4. The README claim "14 light + dark pairs" refers to **the theme palette system**, which is now honest. The `.dark.css` sibling pattern is a legacy concept the pack catalog abandoned.

**Decision:** FIND-0018 is obsoleted. The advertised deliverable — dark-mode parity — is shipped via commit `bb10a15`. Per-pack `.dark.css` is no longer a live architectural concept; if a future pack needs a hand-tuned dark variant, the author writes one and reviews it visually. There is no bulk-generate path that preserves design intent.

**Acceptance for any future dark.css additions:** author-authored only, visual-diff reviewed, must match the pack's existing design tokens. Not CI-mechanical.

---

## Final deferral status after 2026-05-08 re-audit

| ID | Was | Is now |
|---|---|---|
| FIND-0012 | Deferred (audit row) | **Closed — file deleted** |
| FIND-0012-companion | Deferred | **Closed — script deleted** |
| FIND-0014 | Deferred (self-host fonts) | **Re-deferred with revised `--inline-fonts` opt-in acceptance** |
| FIND-0018 | Deferred (21 missing dark.css) | **Obsoleted — deliverable shipped via theme palette system (commit bb10a15)** |

Net: 2 findings closed, 2 re-scoped with honest rationale. The audit is no longer a hidden debt — it's a visible deferral with a reason each remaining item doesn't ship.
