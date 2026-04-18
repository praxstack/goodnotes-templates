# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- **FIND-0022 (High, CVSS 7.1, CWE-59)** — Preview HTTP server symlink
  path-traversal guard now uses `fs.realpath` + `fs.lstat`. Live POC that
  previously leaked `/etc/passwd` now returns 403. (`src/cli/preview-server.ts`)
- **FIND-0001 (Medium, CVSS 5.3)** — Preview server binds to `127.0.0.1` by
  default; opt-in to LAN exposure via `PREVIEW_HOST=0.0.0.0`.
- **FIND-0003 (Medium, CVSS 4.4)** — Chromium `--no-sandbox` is now gated to
  `CI` / `DOCKER_CONTAINER` / `GITHUB_ACTIONS` environments only. Developer
  workstations use Chromium's native sandbox again.
- **FIND-0004 (Low, CWE-918)** — Puppeteer now intercepts every outbound
  request and only allows `data:`, `file:`, `fonts.googleapis.com`,
  `fonts.gstatic.com`. Template-driven SSRF is closed.
- **FIND-0005 (High, CVSS 8.2, GHSA-6v7q-wjvx-w8wg)** — `basic-ftp` CRLF
  injection closed via `npm audit fix`.
- **FIND-0006 (Medium)** — `vitest` bumped `^2.1.8` → `^4.1.4`; vite/esbuild
  moderate advisories resolved.
- **FIND-0009 (Medium, CWE-494)** — All GitHub Actions pinned by full commit
  SHA (`actions/checkout@11bd719…`, etc.). `.github/dependabot.yml` groups
  weekly bumps to keep SHAs fresh without manual churn.
- **FIND-0010 (Low, CWE-353)** — Release artifacts signed with `sigstore/cosign`
  keyless OIDC. Verify with `cosign verify-blob ...`.
- **FIND-0027 (Low, dormant)** — SVG sticker generators now XML-escape any
  interpolated `text` arg.

### Added

- **FIND-0016 — T1-module tests.** 22 new tests across 3 files
  (`tests/unit/preview-server.test.ts`, `pdf-postprocess.test.ts`,
  `svg-renderer.test.ts`). Test count: 25 → 47.
- **Property-based tests.** `pdf-postprocess-property.test.ts` covers
  `cssToPageRect` round-trip identity; `locale-property.test.ts` covers
  year-entry → page-count invariants across 50+ fuzzed years (incl. leap).
- **WCAG contrast gate.** `tests/unit/contrast.test.ts` parses every
  `src/templates/themes/*.css` variable block and fails on sub-4.5:1 pairs.
- **Coverage gate.** `vitest.config.ts` now enforces line ≥ 60, statements
  ≥ 60, functions ≥ 55, branches ≥ 75 on the core/T1/T2 surface via
  `@vitest/coverage-v8`.
- **ESLint 9 flat config.** `eslint.config.js` wires up `@typescript-eslint/*`
  plugins; `npm run lint` returns 0 errors, 0 warnings.
- **`scripts/audit.sh`** — re-runs the CODEX-AUDIT tool surface
  (tokei + npm-audit + depcheck + license-checker + gitleaks + semgrep +
  tsc). Outputs land in `audit/_runtime/tool-outputs/audit-summary.md`.
- **`.github/workflows/audit.yml`** — monthly audit probe (1st of each
  month, 06:00 UTC); fails on HIGH+ CVE regression.
- **`.github/workflows/ci.yml`** — PR-gating CI: `npm ci && npm run build &&
  npm test --run && npm audit --audit-level=high` on every pull request.
- **`.github/CODEOWNERS`** — T1 files, `.github/`, `audit/`, `package.json`
  route automatically.
- **`.github/dependabot.yml`** — weekly grouped npm + actions bumps.
- **`scripts/download-fonts.ts`** — offline-font bootstrap (FIND-0014 half 1).
  Downloads the 7 Google Fonts stylesheets used across templates, extracts
  woff2 URLs, caches them under `assets/fonts/<family>/`, writes aggregator
  `fonts.css`. Second half — rewrite the 32 HTML templates — is deliberately
  manual (visual diff required).
- **`THIRD_PARTY_LICENSES.md`** — generated via `license-checker --markdown`.
  Includes prominent LGPL-3.0-or-later notice for `@img/sharp-libvips-*`.
- **`audit/README.md`** — how to read audit artifacts, verify any finding,
  re-run the probe.
- **`audit/POST_SPRINT_STATUS.md`** — closed / deferred breakdown with
  commit hashes and acceptance criteria.

### Changed

- **FIND-0011** — `npm run build` (`tsc --noEmit`) was failing with 2 errors
  on HEAD; `tsconfig.json` gets `lib: [ES2022, DOM]` and `package.json` gets
  `"type": "module"`. Build is clean.
- **FIND-0007** — Production dep tree shrunk from 12 → 4 (pdf-lib, puppeteer,
  sharp, commander). Removed: pdfkit, @svgdotjs/svg.js, svgdom, chalk, ora,
  glob, handlebars, fontkit (+ devDeps @types/pdfkit, looks-same).
- **FIND-0015** — Color-mode CSS discovery moved into exported
  `resolveColorModeCSS` helper; ad-hoc scripts should consume from there.
- **FIND-0017** — `batchRenderHTML` now returns `{ results, failures }`;
  callers can exit non-zero on partial failure.
- **FIND-0024** — `addHyperlinks` skips rects with non-finite or
  zero/negative dimensions (warn + continue).
- **FIND-0026** — `addBookmarks` has a new `onRangeError: 'throw' | 'warn'`
  option (default `'warn'` for back-compat; CI should use `'throw'`).
- **FIND-0025** — `getBrowser()` now caches the launch *promise*, not the
  resolved browser. Concurrent callers share one Chromium launch.
- **FIND-0021** — Preview server emits `ETag` + `Cache-Control: public,
  max-age=60` and honours `If-None-Match` with 304.
- **FIND-0002** — Gallery `esc()` now escapes the full `[&<>"']` set.
- **FIND-0013** — `README.md §Architecture`, `CONTRIBUTING.md §Contribute`,
  and `CLAUDE.md` rewritten to match the post-HLD self-contained template
  world. References to deleted files (`themes.ts`, `pdfkit-renderer.ts`)
  are gone.
- **FIND-0019** — `package.json.repository.url` + README clone URL +
  CONTRIBUTING.md clone URL switched from `yourusername` stub to
  `praxstack/goodnotes-templates`.

### Deferred (follow-up work; see `audit/POST_SPRINT_STATUS.md`)

- **FIND-0012** — Swap regex HTML parser for `cheerio` in
  `daily-year-v2.ts`.
- **FIND-0014 — half 2** — Rewrite every HTML template's `<link>` to use
  the local `assets/fonts/fonts.css`. Script for download is shipped.
- **FIND-0018** — Add the 21 missing `.dark.css` siblings.

## [1.0.0] — 2026-04-09

Initial engine. See git log for commit-level detail.
