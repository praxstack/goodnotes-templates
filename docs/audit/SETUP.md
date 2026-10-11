# goodnotes-templates (pretext-templates) - Mac setup, verified 2026-10-05

Repo: praxstack/goodnotes-templates. npm workspaces monorepo:
packages/core, packages/cli, 27 packs-* packages, apps/gallery (Astro 7). Node 24.21, npm 12.2.

Inventory and install guidance reverified on 2026-10-11 at main `6bfd36c` (PR #25 merged).
The validation results and remaining baseline notes below describe the original 2026-10-05 checkpoint (`f93ff9b`).

## 1. Install
```bash
cd goodnotes-templates
npm ci                           # install the exact, synchronized package-lock.json
```
PR #25 regenerated the lockfile; the previous `--no-package-lock` workaround is obsolete.
npm 12 blocks install scripts
(sharp, puppeteer, esbuild, fsevents): puppeteer therefore does NOT download its Chrome.

## 2. Env vars
- `PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`
  required for every PDF render and for `test:visual` (workaround for blocked postinstall; no download needed).
  Alternative: `npx puppeteer browsers install chrome` (downloads Chrome 131).
- No API keys or .env needed.

## 3. Build / lint / unit tests
```bash
npm run build        # tsc -b core + cli, OK
npm run lint         # 0 errors, 2 warnings (v6/build-master-index.ts:46, build-v6-pdf.ts:336)
npm test             # vitest: 25 files, 383 tests, all pass (~1s). Only tests/unit is included.
npx tsc --noEmit -p apps/gallery   # not needed; use gallery check below
npm --workspace @pretext-templates/gallery run check   # astro check: 0 errors, 0 warnings, 14 hints
```

## 4. Run the CLI
```bash
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
node packages/cli/dist/index.js --help          # or: npm start -- --help (tsx)
node packages/cli/dist/index.js list
node packages/cli/dist/index.js audit prax-journal          # 1 warning (tokens-used)
node packages/cli/dist/index.js generate habit-tracker --habits "Read,Walk" -o /tmp/habit.pdf   # ~2s, valid PDF
node packages/cli/dist/index.js render packages/packs-eat-the-frog/eat-the-frog.html -o /tmp/frog.pdf
```
Generator-enabled packs: habit-tracker, yearly-overview, monthly-planner, weekly-planner only.
`generate prax-journal` errors "does not have a generator" (use scripts/generate-journal.ts / v6 build scripts).

## 5. Gallery (Astro) - build, then preview
```bash
npx tsx scripts/render-all-packs.ts     # prerequisite, ~35-45s, writes dist/packs/*.pdf (27 ok)
cd apps/gallery && npm run build         # 32 pages, ~1s (fails without the step above: "source dist/packs does not exist")
npx astro preview --host 127.0.0.1 --port 4322
```
Verified with curl: `/`, `/browse`, `/packs/<id>`, `/remix`, `/search` = 200; `/packs/tactile-habits.pdf` = 200 application/pdf;
unknown route = 404. Dev mode: `cd apps/gallery && npx astro dev --host 127.0.0.1`.

## 6. Known failures / workarounds
- The original lock-drift failure is fixed by PR #25; `npm ci` succeeds (reverified 2026-10-11). Use step 1.
- `npm run test:visual`: 11/11 fail. Without the env var: "Could not find Chrome". With it: ENOENT because tests point at
  removed `packs/journals/prax-journal` (now `packages/packs-prax-journal`) - tests/visual/v5-snapshots.test.ts:20.
- `npm run test:e2e` (Playwright): not run; needs `npx playwright install chromium`. Spec asserts "Twenty-two packs" (tests/e2e/gallery-smoke.spec.ts:28) and
  the live page says Twenty-two while 27 packs exist, so the spec is likely also stale (unverified).
- README Quick start uses `src/cli/index.ts`, which does not exist (CLI is packages/cli/src/index.ts); .github/workflows/generate.yml:31 has the same stale path.
- `npm audit --audit-level=high` (a CI step) failed at audit time; fixed by PR #25.

## 7. Cleanup
No processes left running. Build artifacts (dist/, apps/gallery/dist, apps/gallery/public) are gitignored; `git status` is clean.
