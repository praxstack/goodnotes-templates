# Architecture — iteration-4 snapshot

> Delta-focused. Assumes the reader has already read
> `audit/iteration-1/architecture.md` for first-principles context.
> This file records **what changed between iter-1 (2026-04-18) and today
> (2026-05-11)**, and scores the current shape on the standard rubric.

## 1. Monorepo topology (new)

```
goodnotes-templates/
├── package.json                     ← workspace root (private)
│   "workspaces": ["packages/*", "apps/*"]
│
├── packages/
│   ├── core/                        @praxlannister/pretext-core        (npm)
│   │   └── src/                     rendering + post-processing lib
│   │       ├── puppeteer-renderer.ts (438 LOC · T1)
│   │       ├── pdf-postprocess.ts    (301 LOC · T1)
│   │       ├── prax-journal-renderer.ts (453 LOC · T1)
│   │       ├── standalone-builder.ts    (268 LOC · T1)
│   │       ├── svg-renderer.ts          (495 LOC)
│   │       ├── sticker-renderer.ts      (1204 LOC · largest source file)
│   │       ├── pdf-splice.ts, splice.ts (137+206)
│   │       ├── png-renderer.ts / dimensions.ts / errors.ts / …
│   │       ├── registry-resolve.ts, packs.ts (registry)
│   │       ├── types/ (profile, index, registry)
│   │       └── utils/locale.ts
│   │
│   ├── cli/                         @praxlannister/pretext-cli         (npm)
│   │   └── src/
│   │       ├── index.ts (273 LOC)        ← Commander entrypoint
│   │       ├── scaffold.ts (210 LOC)     ← `init` / `remix` commands
│   │       └── preview-server.ts (202 LOC · T1)  ← dev gallery
│   │
│   └── packs-*/  ×27                @praxlannister/pretext-packs-…  (npm-publishable)
│       each pack is its own package with:
│           <pack-id>.html           (self-contained, Warm Analog Editorial tokens)
│           manifest.json            (id, category, entry, tags, version)
│           README.md
│           themes/ (optional)
│           stickers/ (prax-journal only — 60 skeuomorphic + SVG sources)
│           versions/v{N}/ (prax-journal only — historical versions)
│
├── apps/
│   └── gallery/                     @pretext-templates/gallery          (Astro SSG · Vercel)
│       ├── astro.config.mjs         output=static · MDX · site=https://pretext-templates.dev
│       ├── src/
│       │   ├── pages/               index · [id] · search · remix · contribute
│       │   ├── content/packs/*.mdx  (29 packs → 27 unique + 2 tactile extras)
│       │   ├── layouts/Layout.astro (OpenGraph · Twitter cards)
│       │   ├── components/          BlurhashImage · ThemeSwap
│       │   ├── data/                blurhash-manifest · theme-palette
│       │   └── config/site.ts
│       └── scripts/                 8 build-time scripts (og cards · pdf copy · blurhash · …)
│
├── scripts/                         ~5.8k LOC of pipeline / release scripts
│   (build-*, render-all-*, generate-*, bundle-release, audit.sh, …)
│
├── shared/                          Fraunces · Instrument Sans · JetBrains Mono + 14 theme CSS
│
├── tests/
│   ├── unit/        18 files · 235 tests (happy-path + property-based)
│   ├── visual/      sharp pixel-diff v5 snapshots (0.5% drift budget)
│   └── e2e/         gallery-smoke (Playwright)
│
├── audit/                           iteration-1..4 findings + deliverables
└── docs/                            plan-* reviews, HLD/LLD, gstack-archive
```

## 2. Dependency graph (trimmed to direct deps)

```
┌────────────────────────────────────────────┐
│  Root (private)                            │
│    devDeps: typescript, vitest, eslint,    │
│    prettier, tsx, playwright, fast-check   │
└───────────┬──────────────────┬─────────────┘
            │                  │
            ▼                  ▼
  ┌─────────────────┐  ┌─────────────────┐
  │ @praxlannister/ │  │  @pretext-      │
  │ pretext-core    │  │  templates/     │
  │                 │  │  gallery        │
  │  pdf-lib ^1.17  │  │                 │
  │  puppeteer ^23  │  │  astro 6.2.1    │
  │  sharp ^0.33    │  │  @astrojs/mdx   │
  │  zod 3.23.8     │  │  sharp 0.34.5   │
  │  semver 7.7     │  │  blurhash 2.0   │
  └────────┬────────┘  └─────────────────┘
           │
           ▼
  ┌─────────────────┐
  │ @praxlannister/ │
  │ pretext-cli     │
  │  commander ^12  │
  └─────────────────┘

  27× packs-* packages: no runtime deps
  (self-contained HTML templates)
```

Full resolved graph: 423 prod + 190 dev + 149 optional = **760 packages**
in `node_modules`. Stable since iter-1 save for the gallery addition.

## 3. Request flow · pack rendering

```
 CLI `pretext render <pack>.html -o out.pdf`
     │
     ▼
  packages/cli/src/index.ts (Commander route)
     │   resolves dimensions via core/dimensions.ts
     │   resolves render scale via core/puppeteer-renderer.ts::resolveRenderScale
     ▼
  packages/core/src/puppeteer-renderer.ts::renderHTMLToPDFFile
     │   ├── maybeRestartBrowser() — C7b.3 memory-aware restart
     │   ├── getBrowser() — shared Chromium (race-safe promise cache)
     │   ├── setRequestInterception — allow-list: data: | file: | fonts.googleapis | fonts.gstatic
     │   ├── setContent(html, {waitUntil: 'networkidle0'})
     │   ├── document.fonts.ready
     │   └── page.pdf({ preferCSSPageSize, printBackground, scale })
     ▼
  Buffer  →  optional pdf-postprocess.ts
                 ├── addMetadata (title, author, creator, keywords)
                 ├── addHyperlinks (rect-validated, CSS→PDF Y-flip)
                 └── addBookmarks (hierarchical, /GoTo /Fit destinations)
     │
     ▼
  output/<pack>.pdf
```

Prax Journal monthly release adds:

```
  scripts/generate-journal.ts
     │
     ▼  buildPageSequence → 37 PageSpec[]
  resolvePageSpecFiles (4 daily HTMLs, 1 review HTML)
     │
     ▼  substituteProfile (DR_* · RX_* · DAY_* · WEEK_* · MONTH_*)
  renderHTMLToPDF × 37
     │
     ▼  pdf-splice.concat → one PDF
  addBookmarks (flat, date-keyed)
     │
     ▼
  output/journal-<month>.pdf  (135 pp · 39 bookmarks · 54 MB)

  scripts/bundle-release.ts then:
     ├── copies fonts/ + css/ + source-html/
     ├── calls scripts/build-standalone-html.ts
     │    → uses core/standalone-builder.ts (single-module · dedupe fonts via Set<string>)
     └── copies 60-sticker pack (PNG + SVG)
```

## 4. Trust boundary map (updated)

| Boundary | Direction | Status | Notes |
|---|---|---|---|
| CLI args → core lib | inbound | ✓ validated (render-scale, paper-size) | FIND-I4-006 minor |
| `profile.json` → core lib | inbound | ✓ Zod strict parse, schema_version gate | FIND-I4-001 is a filesystem / policy issue, not a validation one |
| Template HTML → Chromium | inbound | ✓ network allow-list restricts outbound | FIND-0004 closed iter-1 |
| Chromium → OS | outbound | ✓ sandbox on except in CI/Docker | FIND-0003 closed iter-1 |
| preview-server HTTP | bidirectional | ✓ 127.0.0.1 only, symlink-safe, NUL/backslash filter | FIND-0022 / FIND-0023 closed iter-1 |
| **NEW · Gallery → public web** | outbound | 🟡 no CSP / headers | FIND-I4-005 |
| Pack MDX → Astro SSG | inbound | ✓ build-time only; authors are CODEOWNERS | |
| npm registry → repo | inbound | 🟡 6 transitive vulns in gallery dev-deps | FIND-I4-002 |

## 5. Rubric score (iter-4)

Scored 1–5 (1=missing, 5=excellent), comparable to iter-1's rubric.

| Dimension | iter-1 | iter-4 | Δ | Notes |
|---|---:|---:|---:|---|
| Maintainability | 3 | **4** | +1 | Monorepo split improves discoverability; standalone-builder extracted into core |
| Scalability | 3 | **3** | 0 | Not a scale-first product; acceptable. Browser restart threshold + render-scale knob are proof of "we know where scale bites" |
| Security | 2 | **3** | +1 | iter-1 P0s closed (CI, tsc, symlink); iter-4 introduces FIND-I4-001 (PII) which drops us from 4 to 3 |
| Performance | 3 | **3.5** | +0.5 | Memory-aware restart, promise-cached browser, font dedupe in standalone builder |
| Testability | 3 | **3.5** | +0.5 | 235 tests vs iter-1's 25; property tests for pdf-postprocess; branches still 62% |
| Observability | 2 | **2** | 0 | Intentional — build tool, no ongoing service. Some `console.log/warn` for human operators |
| Modularity | 3 | **4** | +1 | `core/cli/packs-*/gallery` monorepo split + subpath imports (`@praxlannister/pretext-core/dimensions`) |
| Documentation | 4 | **4** | 0 | README + AGENTS + CLAUDE + plan-* are in good shape; POST_SPRINT_STATUS.md stale (FIND-I4-007) |
| Licensing | 3 | **4** | +1 | THIRD_PARTY_LICENSES.md with LGPL notice (closed FIND-0020); per-pack MIT manifests |
| **Mean** | 2.9 | **3.44** | +0.5 | |

## 6. What's missing (structural gaps, not findings)

1. **No integration-level test for the render pipeline end-to-end.** The
   unit tests mock Puppeteer; the visual suite (`vitest.visual.config.ts`)
   asserts pixel fidelity but runs off pre-rendered snapshots. A thin
   integration test that renders one tiny fixture via real Puppeteer and
   asserts PDF page count + bookmark count exists at `tests/unit/pdf-splice.test.ts`
   but only for the splice layer. Consider extracting an
   `tests/integration/render-pipeline.test.ts` that guards the
   "CLI → PDF output" contract.
2. **No central registry doc for env vars.** `PRAX_BROWSER_RESTART_EVERY`,
   `PRAX_RENDER_SCALE`, `PREVIEW_HOST`, `DOCKER_CONTAINER`,
   `GITHUB_ACTIONS`, `CI` are all consumed silently across ≥3 files.
   One-page doc at `docs/env-vars.md` would prevent future surprise.
3. **`audit/` + `docs/gstack-archive/` are bulky but not indexed.** A
   one-line README at the top of each subdirectory pointing at the
   current-of-record doc would help any new reader. Not urgent.

## 7. Target architecture · incremental deltas

Same five-delta list from iter-1 §Target architecture still applies,
trimmed to post-v1.0.0:

1. **D1 · self-host fonts for all 26 non-v5 packs** — removes Google Fonts
   runtime dependency (iter-1 FIND-0014). Migration is pack-by-pack,
   gated on each pack's next touch. Current progress: 1/27 (Prax Journal
   v5 only).
2. **D2 · axe-core / pa11y gate in CI** — runs against `apps/gallery/dist/`
   output + sampled pack PDFs (text-layer extracted). Closes FIND-0018.
3. **D3 · refresh visual regression baselines** — post-v1.0.0 / Wave-1 +
   Wave-2 sticker pack. Takes ~15 min with the existing `tests/visual/`
   harness. Blocker is that CI doesn't run `test:visual` today
   (intentional — baselines are macOS-specific, not portable to Ubuntu
   runners).
4. **D4 · editor tier (Tier 3 from CUSTOMISATION.md)** — deferred on
   demand from Tier 2.
5. **D5 · optional `--require-profile` flag on the Prax Journal
   renderer** — currently `substituteProfile` falls back to
   printed-blank underscores when no profile is supplied, which is by
   design. But a strict mode that errors on missing profile could serve
   CI pipelines that *expect* a fully filled Rx card.

None of D1–D5 are urgent for iter-4 Sprint 1–3.
