# REVIEW: goodnotes-templates, branch fix/audit-2026-10

Reviewer: independent Opus review, 2026-10-08. Separate fix worktree, HEAD `1845361`, merge-base with origin/main `f93ff9b`. Nothing in the branch was modified. "Before" behaviour was checked in a throwaway base worktree (since removed) using the original repo's base `node_modules`.

> Note: this review is of the first five commits. M1, M2, m1, m2 and several nits were addressed by later commits on PR #25 before merge. Privacy-related parts of this review are kept privately by the owner.

## Verdict: request-changes

The five commits fix the cited root causes and every new test fails on base and passes on the branch. Two problems block merging as-is:

1. The Astro 7 major bump changes rendering: missing spaces in the gallery.
2. The example-PDF content guard test silently degrades when `pdftotext` is missing.

Both fixes are small.

Counts: blocker 0, major 2, minor 4, nit 7.

## Per-commit verdicts

| Commit | Finding | Verdict | Notes |
|---|---|---|---|
| 6c17476 | GNT-001 lockfile regen, drop pnpm files | approve-with-nits | `npm ci --dry-run` passes. The test fails on base (EUSAGE). Docs still tell users to run pnpm commands. |
| a2a8f50 | GNT-003 astro 7.3.7, mdx 8.0.3, sharp 0.35.5, puppeteer 25.12.0 | **request-changes** | Clears the audit gate (high=0). Astro 7 changes whitespace handling by default and drops spaces in the gallery (M1). It also brings in an engines tightening (m2). |
| 48fc7aa | GNT-002 generate.yml | approve-with-nits | Correct now: the script exists, exits 1 on failure, writes to `dist/packs/`, and has `--no-sandbox` under `GITHUB_ACTIONS`. The release body still mentions stickers. |
| fd4f224 | GNT-025 bundle-release validation | approve-with-nits | `--month` is validated and confined to `output/`, and the PDF is checked before `rmSync`. Both CLI tests fail on base. The temp-dir swap was not done, as disclosed. |
| 1845361 | GNT-019 example PDFs + content test | **request-changes** (test only) | See M2. |

## Findings

### Major

**M1. Astro 7's whitespace change removes spaces in the gallery**
- **Where:** `apps/gallery/astro.config.mjs:9`, which has no `compressHTML` setting. Example: `apps/gallery/src/pages/packs/[id].astro:143-146`.
- **What happens:** Astro 7 defaults `compressHTML` to `'jsx'` (see `astro/dist/core/config/schemas/defaults.js:29`). That removes whitespace around elements when they sit on separate source lines.
- **Evidence:** I built both galleries, served them on 127.0.0.1 and took full-page screenshots.
  - `/`, `/browse` and `/search` are pixel-identical.
  - Every pack page (`/packs/*`), `/remix` and `/contribute` differ, and the differences are missing spaces. Examples: "Built with the@praxlannister/pretext-cli", "open a PR atpretext-templates.vercel.app/compare", "under@your-scope/pretext-", "CONTRIBUTEFOR THE ...".
  - In the generated HTML, all 32 of 32 pages lose inter-element whitespace (361 changed text lines). Most of these are inside flex containers, where nothing visible changes.
- **Fix:** set `compressHTML: true` in `astro.config.mjs`, which restores Astro 6 behaviour, or add `{" "}` at the affected sites. Then re-run the screenshot diff. FIXES.md said "gallery build OK" and that a visual diff was "not performed" (for PDFs); the gallery was not checked visually either.

**M2. The example-PDF content test degrades silently without `pdftotext`**
- **Where:** `tests/unit/example-pdf-pii.test.ts`.
- The built-in fallback text extractor did not match the PDF streams, so without `pdftotext` the test checked almost nothing, and `ci.yml` did not install `poppler-utils`.
- **Fix (done in 17e147d):** a stricter fallback scanner, `poppler-utils` in CI, and a hard failure when `CI` is set and `pdftotext` is missing.

### Minor

**m1. Deny-list approach in the content test** - replaced with structural rules in 17e147d; details kept privately by the owner.

**m2. Engines floor is now understated**
- **Where:** `package.json:56` says `"node": ">=22.12.0"`.
- `undici@8.11.2` (via astro 7 → unifont) requires `>=22.19.0`, and `.npmrc` sets `engine-strict=true`. So `npm ci` fails with EBADENGINE on Node 22.12-22.18. CI is unaffected because it uses the latest Node 22.
- **Fix:** raise the engines floor to `>=22.19.0`.

**m3. render-all-packs timed out intermittently on the branch (not proven to be a regression)**
- Three runs on the branch:
  - Run 1: 26 ok; budget-tracker failed with "Navigation timeout of 30000 ms".
  - Run 2: 25 ok; budget-tracker and goal-setting timed out.
  - Run 3: 27 ok.
- Base: 27 ok in 1 of 1 runs, in the same window.
- The host load average was about 250 throughout, and packs fetch Google Fonts under `networkidle0`. This is most likely environmental.
- When both versions use the same Chrome (`PUPPETEER_EXECUTABLE_PATH`), the outputs match: all 27 PDFs have the same page count, page size and text, and 26 of 27 are the same byte size. tactile-habits differs by 173 bytes, which is about 2 pixels.
- Not verified: in CI, puppeteer 25 downloads its own newer Chrome.

**m4. bundle-release can still lose the previous bundle**
- **Where:** `scripts/bundle-release.ts:303-306`.
- The old bundle is still deleted before the new one is built. Any later failure (for example, `readdirSync(STICKERS)` throwing) loses it. This was disclosed in FIXES.md as "temp dir swap not done".
- **Fix:** build into `output/.tmp-<name>`, then `renameSync`.

### Nits

- `.github/workflows/generate.yml:108`: the release body still says "templates and stickers". Stickers are no longer produced.
- `apps/gallery/astro.config.mjs:5`: the comment still says "Astro 6 config".
- `tests/unit/bundle-release.test.ts`, the `--month ".."` case: asserting that `package.json` still exists under `--dry-run` proves nothing, because dry-run never deletes. The `status === 2` assertion is the meaningful one.
- pnpm references remain after the pnpm files were removed: `packages/packs-prax-journal/versions/v6/{README.md,INSTALL.md}`, the `build-v5-restyled.ts` header, `docs/ONBOARDING.md:128`, and a comment in `.npmrc`.
- FIXES.md gives the branch as `fix/audit-2026-10-02`. The actual branch is `fix/audit-2026-10`.
- The lockfile-sync test `does not carry a second ... lockfile` checks an implementation detail. It is acceptable.

## Check results (branch HEAD vs base)

| Check | Base (f93ff9b) | Branch (1845361) |
|---|---|---|
| `npm ci --dry-run` | fails (EUSAGE, lock drift) | exit 0 |
| `npm run build` | OK | OK |
| `npm run lint` | 0 errors / 2 warnings | 0 errors / 2 warnings (same) |
| `npm test` | 25 files / 383 pass | 29 files / 411 pass |
| `npm test -- --run --coverage` (CI gate) | n/a | pass; 93.97% stmts, 86.34% branches |
| new tests run against base code | n/a | 13 fail / 15 pass; every targeted test fails as claimed |
| gallery `astro check` | 0 errors / 14 hints | 0 errors / 0 warnings / 14 hints |
| `render-all-packs` | 27 ok (59.6 s) | 27 ok on 1 of 3 runs; 2 runs hit navigation timeouts under load (m3) |
| rendered pack PDFs, base vs branch | n/a | same pages, page size and text for 27/27 |
| gallery build | 32 pages | 32 pages |
| gallery visual diff | n/a | missing spaces on pack pages, `/remix`, `/contribute` (M1) |
| gallery preview routes (`/`, `/browse`, `/packs/<id>`, `/remix`, `/search`, PDF, 404) | 200/200/200/200/200/pdf/404 | identical |
| `npm audit --audit-level=high` | fails | exit 0 |
| lockfile | n/a | 581 entries, all from registry.npmjs.org with integrity. 7 top-level major bumps, all explained by puppeteer, astro and css-select. `get-tsconfig@5.0.0-beta.6` is pinned by astro itself. |

Not run: `test:visual` and `test:e2e`, which were already broken on base per SETUP.md, and the generate.yml workflow on GitHub.

## FIXES.md claims I could not confirm, or that are overstated

- **GNT-019 test:** see M2.
- **GNT-003, "build ... gallery check/build ... all pass":** true, but the gallery's rendered output changed (M1).
- **"render-all-packs 27 ok":** reproduced on only 1 of 3 runs under heavy host load (m3).
- **generate.yml behaviour on GitHub:** not executable locally. I checked it statically: paths and steps are consistent, `npm ci` works, and the script exits non-zero on failure.
- **Owner decisions:** details kept privately by the owner.
