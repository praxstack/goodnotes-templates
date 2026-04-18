# Test Strategy — goodnotes-templates

**Status today:** 25 tests passing across 3 files. Zero coverage on T1 modules.

## 1. Coverage floors (per-tier, not global)

| Tier | Scope | Line floor | Branch floor | Rationale |
|---|---|---:|---:|---|
| T1 | `preview-server.ts`, `puppeteer-renderer.ts`, `pdf-postprocess.ts` | **≥ 80 %** | ≥ 70 % | Highest blast radius; I/O-heavy → 90% unrealistic |
| T2 | year planners, svg/png renderers, dimensions, locale, cli | **≥ 70 %** | ≥ 60 % | Business logic; needs stub-able |
| T3 | registry, scripts | not enforced | not enforced | Low blast; pattern-scan level |
| T4 | themes CSS, tests themselves, static HTML, docs | N/A | N/A | Non-executable or self-referencing |

**Rejected:** generic "≥ 85% coverage" target. Volume without risk targeting.

## 2. Proposed new tests (8 files, ~30 tests, mostly XS)

### `tests/unit/preview-server.test.ts` — new (covers T1)

- `test_binds_localhost_by_default` — integration; spawn server, `lsof -iTCP:port` expects `127.0.0.1`. Protects FIND-0001.
- `test_rejects_path_traversal_dotdot` — curl `/../passwd` expects 403.
- `test_rejects_symlink_escape` — create symlink under fixture output → `/etc`; curl it; expects 403. Protects FIND-0022.
- `test_rejects_nul_byte` — curl `%00`; expects 400 (or 404 post-FIND-0023 fix).
- `test_gallery_escapes_single_quote` — unit on `esc` helper (via export refactor). Protects FIND-0002.
- `test_etag_returns_304_on_revisit` — Protects FIND-0021.

### `tests/unit/puppeteer-renderer.test.ts` — new (covers T1)

- `test_launch_args_depend_on_CI_env` — spy on `puppeteer.launch`; assert `--no-sandbox` absent when `process.env.CI` unset. Protects FIND-0003.
- `test_getBrowser_single_launch_on_race` — parallel `Promise.all` → one `puppeteer.launch` call. Protects FIND-0025.
- `test_batchRenderHTML_returns_failures_array` — stub renderer to throw; caller exits non-zero. Protects FIND-0017.
- `test_resolveColorModeCSS_order` — unit on extracted helper. Protects FIND-0015.

### `tests/unit/pdf-postprocess.test.ts` — new (covers T1)

- `test_cssToPageRect_roundtrip` — property-like; trip CSS → PDF → CSS preserves values. (Optional `fast-check` if installed.)
- `test_addHyperlinks_skips_invalid_rect` — rect `[0,0,-1,-1]` logs warn + skips. Protects FIND-0024.
- `test_addBookmarks_throw_mode` — `onRangeError: 'throw'` throws on out-of-range. Protects FIND-0026.

### `tests/unit/svg-renderer.test.ts` — new (covers T2)

- `test_generateStickerSVG_escapes_text` — payload `'</text><x/></svg>'` escapes as `&lt;`. Protects FIND-0027.
- `test_all_sticker_types_produce_valid_svg` — iterate `STICKER_SIZES` keys; each returns non-empty SVG.

### `tests/unit/parseSinglePageTemplate.test.ts` — new (covers T2)

- `test_handles_html_comment_before_body` — template with `<!-- <div class="page"> draft -->`. Protects FIND-0012 (after cheerio swap).
- `test_handles_single_quoted_attribute` — `<div class='page'>` works.
- `test_throws_on_missing_body` — negative case.

### `tests/integration/render-offline.test.ts` — new (optional)

- `test_all_templates_render_without_network` — requires FIND-0014 shipped. Protects FIND-0004 / FIND-0014.

### `tests/unit/contrast.test.ts` — new (covers UX/A11y)

- Parse `src/templates/themes/*.css` + `src/templates/html/*.dark.css`; assert every `--fg` / `--bg` pair meets WCAG 4.5:1 (text) or 3:1 (large). Protects FIND-0018.

## 3. Test maturity signals — status

| Signal | Status | Plan |
|---|---|---|
| Unit | Thin (3 files) | Expand to 8 files per above |
| Integration | Missing | Add `preview-server.test.ts` + `render-offline.test.ts` |
| Contract | N/A | No API surface |
| Property-based | Missing | Low ROI here; optional `fast-check` on `cssToPageRect` |
| Fuzz | N/A | No untrusted parsers outside `pdf-lib` (fuzzed upstream) |
| Visual regression | Partial (`looks-same` declared but `vitest.visual.config.ts` missing) | Delete or complete — current state is cargo-culted |
| Mutation testing | N/A | Not worth for a build tool of this size |
| Flaky-test quarantine | Not needed yet | Adopt if suite grows past ~100 tests |

## 4. CI gate recommendations (FIND-0008)

New workflow `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request: {}
  push: { branches: [main] }
permissions:
  contents: read
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<SHA>   # pinned per FIND-0009
      - uses: actions/setup-node@<SHA>
        with: { node-version: '20', cache: npm }
      - run: npm ci
      - run: npm run build              # requires FIND-0011 shipped
      - run: npm test -- --run
      - run: npm audit --audit-level=high
      - run: npx depcheck               # fails on unused deps
      - run: npx pa11y file:///... # optional, Sprint 3
```

**Branch protection:** require this job before merge to `main`.

## 5. Coverage tooling

Install `@vitest/coverage-v8` (devDep); wire `vitest run --coverage`; gate floors per §1 via the `coverage.thresholds` block in `vitest.config.ts`.

Cost: one npm install + one config block. Effort: **XS.** Blocks nothing.
