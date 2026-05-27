# Project: pretext-templates

Programmatically generate high-quality digital planning templates, stickers, and page assets optimized for GoodNotes and similar digital note-taking apps. Monorepo root — see packages/*. Note: this project has over 100 source files; consider scoping analysis to a subdirectory for faster results.

**Languages:** astro, css, csv, html, javascript, json, jsonl, markdown, mdx, mmd, shell, typescript, unknown, yaml
**Frameworks:** Astro, GitHub Actions, Playwright, Puppeteer, TypeScript, Vercel, Vitest

## Relevant Layers

### CLI Package
Command-line interface package exposing the goodnotes-templates CLI entry points.

### Core Engine
Core rendering and template engine shared by all packs and the CLI.

### Template Packs
Self-contained template packs (journals, planners, trackers, tactile series, etc.).

### Build & Generation Scripts
TypeScript and shell scripts that render previews, build stickers, generate registries, and bundle releases.

### Tests
Unit, end-to-end, and visual regression test suites.

### Audit Reports
Multi-iteration audit findings, gap analyses, roadmaps, and verification results.

### CI/CD & Dev Environment
GitHub Actions workflows, dev container config, and environment automation.

## Code Components

### candyland-dark.css (file)
- **File:** packages/core/assets/themes/candyland-dark.css
- **Complexity:** simple
- **Summary:** Stylesheet (candyland-dark.css, 23 lines).
- **Tags:** stylesheet, css, frontend

### candyland.css (file)
- **File:** packages/core/assets/themes/candyland.css
- **Complexity:** simple
- **Summary:** Stylesheet (candyland.css, 27 lines).
- **Tags:** stylesheet, css, frontend

### eisenhower-matrix.html (file)
- **File:** packages/packs-eisenhower-matrix/eisenhower-matrix.html
- **Complexity:** complex
- **Summary:** HTML template (eisenhower-matrix.html, 479 lines).
- **Tags:** html, template, frontend

### CODEBASE_AUDIT_REPORT.json (config)
- **File:** audit/CODEBASE_AUDIT_REPORT.json
- **Complexity:** moderate
- **Summary:** CODEBASE_AUDIT_REPORT.json configuration file (139 lines).
- **Tags:** configuration, data

### renderPageSpec (function)
- **File:** packages/core/src/prax-journal-renderer.ts
- **Complexity:** simple
- **Summary:** Function `renderPageSpec` (25 lines) in prax-journal-renderer.ts.
- **Tags:** function, exported, test

### buildRemixCommands (function)
- **File:** packages/cli/src/scaffold.ts
- **Complexity:** moderate
- **Summary:** Function `buildRemixCommands` (49 lines) in scaffold.ts.
- **Tags:** function, exported, source

### _resetRenderCountForTest (function)
- **File:** packages/core/src/puppeteer-renderer.ts
- **Complexity:** simple
- **Summary:** Function `_resetRenderCountForTest` (3 lines) in puppeteer-renderer.ts.
- **Tags:** function, exported, test

### _renderCountForTest (function)
- **File:** packages/core/src/puppeteer-renderer.ts
- **Complexity:** simple
- **Summary:** Function `_renderCountForTest` (3 lines) in puppeteer-renderer.ts.
- **Tags:** function, exported, test

### resolveRenderScale (function)
- **File:** packages/core/src/puppeteer-renderer.ts
- **Complexity:** simple
- **Summary:** Function `resolveRenderScale` (14 lines) in puppeteer-renderer.ts.
- **Tags:** function, exported, source

### renderHTMLToPDF (function)
- **File:** packages/core/src/puppeteer-renderer.ts
- **Complexity:** complex
- **Summary:** Function `renderHTMLToPDF` (102 lines) in puppeteer-renderer.ts.
- **Tags:** function, exported, source

### renderHTMLToPDFFile (function)
- **File:** packages/core/src/puppeteer-renderer.ts
- **Complexity:** simple
- **Summary:** Function `renderHTMLToPDFFile` (14 lines) in puppeteer-renderer.ts.
- **Tags:** function, exported, source

### batchRenderHTML (function)
- **File:** packages/core/src/puppeteer-renderer.ts
- **Complexity:** simple
- **Summary:** Function `batchRenderHTML` (28 lines) in puppeteer-renderer.ts.
- **Tags:** function, exported, source

### renderOne (function)
- **File:** scripts/smoke-theme-injection.ts
- **Complexity:** moderate
- **Summary:** Function `renderOne` (32 lines) in smoke-theme-injection.ts.
- **Tags:** function, source, module

### buildStandaloneHtml (function)
- **File:** packages/core/src/standalone-builder.ts
- **Complexity:** moderate
- **Summary:** Function `buildStandaloneHtml` (42 lines) in standalone-builder.ts.
- **Tags:** function, exported, source

### stickerShell (function)
- **File:** packages/core/src/sticker-renderer.ts
- **Complexity:** complex
- **Summary:** Function `stickerShell` (246 lines) in sticker-renderer.ts.
- **Tags:** function, exported, source

### mergePDFs (function)
- **File:** packages/core/src/pdf-postprocess.ts
- **Complexity:** simple
- **Summary:** Function `mergePDFs` (13 lines) in pdf-postprocess.ts.
- **Tags:** function, exported, source

### renderStickerPNG (function)
- **File:** packages/core/src/png-renderer.ts
- **Complexity:** simple
- **Summary:** Function `renderStickerPNG` (18 lines) in png-renderer.ts.
- **Tags:** function, exported, source

### renderStickerToFile (function)
- **File:** packages/core/src/png-renderer.ts
- **Complexity:** simple
- **Summary:** Function `renderStickerToFile` (14 lines) in png-renderer.ts.
- **Tags:** function, exported, source

### batchRenderStickers (function)
- **File:** packages/core/src/png-renderer.ts
- **Complexity:** simple
- **Summary:** Function `batchRenderStickers` (22 lines) in png-renderer.ts.
- **Tags:** function, exported, source

### renderToPng (function)
- **File:** tests/visual/helpers/render.ts
- **Complexity:** moderate
- **Summary:** Function `renderToPng` (66 lines) in render.ts.
- **Tags:** function, exported, source

### prax-journal-renderer.ts (file)
- **File:** packages/core/src/prax-journal-renderer.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 10 functions and 12 exports (453 lines).
- **Tags:** core-engine, source, module

### scaffold.ts (file)
- **File:** packages/cli/src/scaffold.ts
- **Complexity:** moderate
- **Summary:** Typescript module exposing 5 functions and 3 exports (210 lines).
- **Tags:** cli, source, module

### puppeteer-renderer.ts (file)
- **File:** packages/core/src/puppeteer-renderer.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 12 functions and 9 exports (448 lines).
- **Tags:** core-engine, source, module

### smoke-theme-injection.ts (file)
- **File:** scripts/smoke-theme-injection.ts
- **Complexity:** moderate
- **Summary:** Typescript module exposing 3 functions and 0 exports (118 lines).
- **Tags:** build-script, source, module

### standalone-builder.ts (file)
- **File:** packages/core/src/standalone-builder.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 5 functions and 1 export (268 lines).
- **Tags:** core-engine, source, module

### sticker-renderer.ts (file)
- **File:** packages/core/src/sticker-renderer.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 25 functions and 27 exports (1204 lines).
- **Tags:** core-engine, source, module

### pdf-postprocess.ts (file)
- **File:** packages/core/src/pdf-postprocess.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 6 functions and 5 exports (301 lines).
- **Tags:** core-engine, source, module

### png-renderer.ts (file)
- **File:** packages/core/src/png-renderer.ts
- **Complexity:** moderate
- **Summary:** Typescript module exposing 3 functions and 3 exports (76 lines).
- **Tags:** core-engine, source, module

### render.ts (file)
- **File:** tests/visual/helpers/render.ts
- **Complexity:** moderate
- **Summary:** Typescript module exposing 3 functions and 3 exports (126 lines).
- **Tags:** test, source, module

### README.md (document)
- **File:** packages/packs-eisenhower-matrix/README.md
- **Complexity:** simple
- **Summary:** Project README with 4 sections (25 lines) — primary entry-point documentation.
- **Tags:** documentation, entry-point, overview

### ci.yml (pipeline)
- **File:** .github/workflows/ci.yml
- **Complexity:** moderate
- **Summary:** GitHub Actions workflow (ci.yml) defining CI/CD jobs (78 lines).
- **Tags:** infrastructure, ci-cd, github-actions, deployment

### generate.yml (pipeline)
- **File:** .github/workflows/generate.yml
- **Complexity:** moderate
- **Summary:** GitHub Actions workflow (generate.yml) defining CI/CD jobs (130 lines).
- **Tags:** infrastructure, ci-cd, github-actions, deployment

## Relationships

- prax-journal-renderer.ts --[contains]--> renderPageSpec
- prax-journal-renderer.ts --[exports]--> renderPageSpec
- prax-journal-renderer.ts --[imports]--> puppeteer-renderer.ts
- scaffold.ts --[contains]--> buildRemixCommands
- scaffold.ts --[exports]--> buildRemixCommands
- puppeteer-renderer.ts --[contains]--> _resetRenderCountForTest
- puppeteer-renderer.ts --[exports]--> _resetRenderCountForTest
- puppeteer-renderer.ts --[contains]--> _renderCountForTest
- puppeteer-renderer.ts --[exports]--> _renderCountForTest
- puppeteer-renderer.ts --[contains]--> resolveRenderScale
- puppeteer-renderer.ts --[exports]--> resolveRenderScale
- puppeteer-renderer.ts --[contains]--> renderHTMLToPDF
- puppeteer-renderer.ts --[exports]--> renderHTMLToPDF
- puppeteer-renderer.ts --[contains]--> renderHTMLToPDFFile
- puppeteer-renderer.ts --[exports]--> renderHTMLToPDFFile
- puppeteer-renderer.ts --[contains]--> batchRenderHTML
- puppeteer-renderer.ts --[exports]--> batchRenderHTML
- smoke-theme-injection.ts --[contains]--> renderOne
- smoke-theme-injection.ts --[imports]--> puppeteer-renderer.ts
- standalone-builder.ts --[contains]--> buildStandaloneHtml
- standalone-builder.ts --[exports]--> buildStandaloneHtml
- sticker-renderer.ts --[contains]--> stickerShell
- sticker-renderer.ts --[exports]--> stickerShell
- pdf-postprocess.ts --[contains]--> mergePDFs
- pdf-postprocess.ts --[exports]--> mergePDFs
- png-renderer.ts --[contains]--> renderStickerPNG
- png-renderer.ts --[exports]--> renderStickerPNG
- png-renderer.ts --[contains]--> renderStickerToFile
- png-renderer.ts --[exports]--> renderStickerToFile
- png-renderer.ts --[contains]--> batchRenderStickers
- png-renderer.ts --[exports]--> batchRenderStickers
- render.ts --[contains]--> renderToPng
- render.ts --[exports]--> renderToPng
- README.md --[documents]--> eisenhower-matrix.html
- ci.yml --[triggers]--> render.ts
- ci.yml --[triggers]--> renderToPng
- generate.yml --[triggers]--> smoke-theme-injection.ts
- generate.yml --[triggers]--> renderOne
