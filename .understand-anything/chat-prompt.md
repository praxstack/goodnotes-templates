You are a knowledgeable assistant that answers questions about a software codebase.
Use the following knowledge graph context to inform your answer.
Reference specific files, functions, classes, and relationships from the graph.
If layers are present, explain which architectural layer(s) are relevant.
Be concise but thorough — link concepts to actual code locations.

---

# Project: pretext-templates

Programmatically generate high-quality digital planning templates, stickers, and page assets optimized for GoodNotes and similar digital note-taking apps. Monorepo root — see packages/*. Note: this project has over 100 source files; consider scoping analysis to a subdirectory for faster results.

**Languages:** astro, css, csv, html, javascript, json, jsonl, markdown, mdx, mmd, shell, typescript, unknown, yaml
**Frameworks:** Astro, GitHub Actions, Playwright, Puppeteer, TypeScript, Vercel, Vitest

## Relevant Layers

### Core Engine
Core rendering and template engine shared by all packs and the CLI.

### Template Packs
Self-contained template packs (journals, planners, trackers, tactile series, etc.).

### Tests
Unit, end-to-end, and visual regression test suites.

### CI/CD & Dev Environment
GitHub Actions workflows, dev container config, and environment automation.

### Project Configuration
Root-level monorepo configuration, build tooling, lint/test configs, and workspace settings.

## Code Components

### renderPageSpec (function)
- **File:** packages/core/src/prax-journal-renderer.ts
- **Complexity:** simple
- **Summary:** Function `renderPageSpec` (25 lines) in prax-journal-renderer.ts.
- **Tags:** function, exported, test

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

### eat-the-frog.html (file)
- **File:** packages/packs-eat-the-frog/eat-the-frog.html
- **Complexity:** complex
- **Summary:** HTML template (eat-the-frog.html, 445 lines).
- **Tags:** html, template, frontend

### eisenhower-matrix.html (file)
- **File:** packages/packs-eisenhower-matrix/eisenhower-matrix.html
- **Complexity:** complex
- **Summary:** HTML template (eisenhower-matrix.html, 479 lines).
- **Tags:** html, template, frontend

### prax-journal-renderer.test.ts (file)
- **File:** tests/unit/prax-journal-renderer.test.ts
- **Complexity:** complex
- **Summary:** Test file containing 1 test functions and 0 test fixtures.
- **Tags:** test, source, module

### puppeteer-renderer-mock.test.ts (file)
- **File:** tests/unit/puppeteer-renderer-mock.test.ts
- **Complexity:** complex
- **Summary:** Test file containing 5 test functions and 0 test fixtures.
- **Tags:** test, source, module

### puppeteer-renderer-pure.test.ts (file)
- **File:** tests/unit/puppeteer-renderer-pure.test.ts
- **Complexity:** moderate
- **Summary:** Test file containing 0 test functions and 0 test fixtures.
- **Tags:** test, source, module

### puppeteer-renderer-restart.test.ts (file)
- **File:** tests/unit/puppeteer-renderer-restart.test.ts
- **Complexity:** moderate
- **Summary:** Test file containing 0 test functions and 0 test fixtures.
- **Tags:** test, source, module

### render-scale.test.ts (file)
- **File:** tests/unit/render-scale.test.ts
- **Complexity:** moderate
- **Summary:** Test file containing 0 test functions and 0 test fixtures.
- **Tags:** test, source, module

### standalone-builder.test.ts (file)
- **File:** tests/unit/standalone-builder.test.ts
- **Complexity:** moderate
- **Summary:** Test file containing 1 test functions and 0 test fixtures.
- **Tags:** test, source, module

### svg-renderer.test.ts (file)
- **File:** tests/unit/svg-renderer.test.ts
- **Complexity:** simple
- **Summary:** Test file containing 0 test functions and 0 test fixtures.
- **Tags:** test, source, module

### render.ts (file)
- **File:** tests/visual/helpers/render.ts
- **Complexity:** moderate
- **Summary:** Typescript module exposing 3 functions and 3 exports (126 lines).
- **Tags:** test, source, module

### prax-journal-renderer.ts (file)
- **File:** packages/core/src/prax-journal-renderer.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 10 functions and 12 exports (453 lines).
- **Tags:** core-engine, source, module

### makeProfile (function)
- **File:** tests/unit/prax-journal-renderer.test.ts
- **Complexity:** simple
- **Summary:** Function `makeProfile` (10 lines) in prax-journal-renderer.test.ts.
- **Tags:** function, source, module

### splice.ts (file)
- **File:** packages/core/src/splice.ts
- **Complexity:** moderate
- **Summary:** Typescript module exposing 6 functions and 1 export (137 lines).
- **Tags:** core-engine, source, module

### profile.ts (file)
- **File:** packages/core/src/types/profile.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 1 function and 4 exports (288 lines).
- **Tags:** type-definition, core-engine, source

### puppeteer-renderer.ts (file)
- **File:** packages/core/src/puppeteer-renderer.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 12 functions and 9 exports (448 lines).
- **Tags:** core-engine, source, module

### makePage (function)
- **File:** tests/unit/puppeteer-renderer-mock.test.ts
- **Complexity:** moderate
- **Summary:** Function `makePage` (40 lines) in puppeteer-renderer-mock.test.ts.
- **Tags:** function, source, module

### makePage (function)
- **File:** tests/unit/standalone-builder.test.ts
- **Complexity:** simple
- **Summary:** Function `makePage` (13 lines) in standalone-builder.test.ts.
- **Tags:** function, source, module

### standalone-builder.ts (file)
- **File:** packages/core/src/standalone-builder.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 5 functions and 1 export (268 lines).
- **Tags:** core-engine, source, module

### errors.ts (file)
- **File:** packages/core/src/errors.ts
- **Complexity:** complex
- **Summary:** Typescript module defining 5 classes (~327 lines).
- **Tags:** core-engine, source, module

### svg-renderer.ts (file)
- **File:** packages/core/src/svg-renderer.ts
- **Complexity:** complex
- **Summary:** Typescript module exposing 24 functions and 2 exports (495 lines).
- **Tags:** core-engine, source, module

### getBrowser (function)
- **File:** tests/visual/helpers/render.ts
- **Complexity:** simple
- **Summary:** Function `getBrowser` (19 lines) in render.ts.
- **Tags:** function, exported, helper

### closeBrowser (function)
- **File:** tests/visual/helpers/render.ts
- **Complexity:** simple
- **Summary:** Function `closeBrowser` (7 lines) in render.ts.
- **Tags:** function, exported, source

### renderToPng (function)
- **File:** tests/visual/helpers/render.ts
- **Complexity:** moderate
- **Summary:** Function `renderToPng` (66 lines) in render.ts.
- **Tags:** function, exported, source

### v5-snapshots.test.ts (file)
- **File:** tests/visual/v5-snapshots.test.ts
- **Complexity:** moderate
- **Summary:** Test file containing 0 test functions and 0 test fixtures.
- **Tags:** test, source, module

### tsconfig.base.json (config)
- **File:** tsconfig.base.json
- **Complexity:** simple
- **Summary:** TypeScript compiler configuration (17 lines).
- **Tags:** configuration, typescript, build-system

### tsconfig.json (config)
- **File:** tsconfig.json
- **Complexity:** simple
- **Summary:** TypeScript compiler configuration (10 lines).
- **Tags:** configuration, typescript, build-system

### README.md (document)
- **File:** packages/packs-eat-the-frog/README.md
- **Complexity:** simple
- **Summary:** Project README with 4 sections (25 lines) — primary entry-point documentation.
- **Tags:** documentation, entry-point, overview

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

## Relationships

- prax-journal-renderer.ts --[contains]--> renderPageSpec
- prax-journal-renderer.ts --[exports]--> renderPageSpec
- prax-journal-renderer.ts --[imports]--> puppeteer-renderer.ts
- prax-journal-renderer.ts --[imports]--> splice.ts
- prax-journal-renderer.ts --[imports]--> profile.ts
- prax-journal-renderer.test.ts --[contains]--> makeProfile
- prax-journal-renderer.test.ts --[imports]--> prax-journal-renderer.ts
- prax-journal-renderer.test.ts --[imports]--> splice.ts
- prax-journal-renderer.test.ts --[imports]--> profile.ts
- puppeteer-renderer.ts --[contains]--> _resetRenderCountForTest
- puppeteer-renderer.ts --[exports]--> _resetRenderCountForTest
- puppeteer-renderer.ts --[contains]--> _renderCountForTest
- puppeteer-renderer.ts --[exports]--> _renderCountForTest
- puppeteer-renderer-mock.test.ts --[contains]--> makePage
- puppeteer-renderer-mock.test.ts --[imports]--> puppeteer-renderer.ts
- puppeteer-renderer-pure.test.ts --[imports]--> puppeteer-renderer.ts
- puppeteer-renderer-restart.test.ts --[imports]--> puppeteer-renderer.ts
- render-scale.test.ts --[imports]--> puppeteer-renderer.ts
- standalone-builder.ts --[imports]--> errors.ts
- standalone-builder.test.ts --[contains]--> makePage
- standalone-builder.test.ts --[imports]--> standalone-builder.ts
- standalone-builder.test.ts --[imports]--> errors.ts
- svg-renderer.test.ts --[imports]--> svg-renderer.ts
- render.ts --[contains]--> getBrowser
- render.ts --[exports]--> getBrowser
- render.ts --[contains]--> closeBrowser
- render.ts --[exports]--> closeBrowser
- render.ts --[contains]--> renderToPng
- render.ts --[exports]--> renderToPng
- v5-snapshots.test.ts --[imports]--> render.ts
- tsconfig.base.json --[configures]--> prax-journal-renderer.ts
- tsconfig.base.json --[configures]--> splice.ts
- tsconfig.base.json --[configures]--> profile.ts
- tsconfig.base.json --[configures]--> prax-journal-renderer.test.ts
- tsconfig.base.json --[configures]--> puppeteer-renderer.ts
- tsconfig.base.json --[configures]--> puppeteer-renderer-mock.test.ts
- tsconfig.base.json --[configures]--> puppeteer-renderer-pure.test.ts
- tsconfig.base.json --[configures]--> puppeteer-renderer-restart.test.ts
- tsconfig.base.json --[configures]--> render-scale.test.ts
- tsconfig.base.json --[configures]--> errors.ts
- tsconfig.base.json --[configures]--> standalone-builder.ts
- tsconfig.base.json --[configures]--> standalone-builder.test.ts
- tsconfig.base.json --[configures]--> svg-renderer.ts
- tsconfig.base.json --[configures]--> svg-renderer.test.ts
- tsconfig.base.json --[configures]--> render.ts
- tsconfig.base.json --[configures]--> v5-snapshots.test.ts
- tsconfig.json --[configures]--> prax-journal-renderer.ts
- tsconfig.json --[configures]--> splice.ts
- tsconfig.json --[configures]--> profile.ts
- tsconfig.json --[configures]--> prax-journal-renderer.test.ts
- tsconfig.json --[configures]--> puppeteer-renderer.ts
- tsconfig.json --[configures]--> puppeteer-renderer-mock.test.ts
- tsconfig.json --[configures]--> puppeteer-renderer-pure.test.ts
- tsconfig.json --[configures]--> puppeteer-renderer-restart.test.ts
- tsconfig.json --[configures]--> render-scale.test.ts
- tsconfig.json --[configures]--> errors.ts
- tsconfig.json --[configures]--> standalone-builder.ts
- tsconfig.json --[configures]--> standalone-builder.test.ts
- tsconfig.json --[configures]--> svg-renderer.ts
- tsconfig.json --[configures]--> svg-renderer.test.ts
- tsconfig.json --[configures]--> render.ts
- tsconfig.json --[configures]--> v5-snapshots.test.ts
- README.md --[documents]--> eat-the-frog.html
- README.md --[documents]--> eisenhower-matrix.html
- ci.yml --[triggers]--> prax-journal-renderer.test.ts
- ci.yml --[triggers]--> makeProfile
- ci.yml --[triggers]--> puppeteer-renderer-mock.test.ts
- ci.yml --[triggers]--> makePage
- ci.yml --[triggers]--> puppeteer-renderer-pure.test.ts
- ci.yml --[triggers]--> puppeteer-renderer-restart.test.ts
- ci.yml --[triggers]--> render-scale.test.ts
- ci.yml --[triggers]--> standalone-builder.test.ts
- ci.yml --[triggers]--> makePage
- ci.yml --[triggers]--> svg-renderer.test.ts
- ci.yml --[triggers]--> render.ts
- ci.yml --[triggers]--> getBrowser
- ci.yml --[triggers]--> closeBrowser
- ci.yml --[triggers]--> renderToPng
- ci.yml --[triggers]--> v5-snapshots.test.ts
- prax-journal-renderer.ts --[tested_by]--> prax-journal-renderer.test.ts
- standalone-builder.ts --[tested_by]--> standalone-builder.test.ts
- svg-renderer.ts --[tested_by]--> svg-renderer.test.ts

---

**User question:** how does this codebase render PDFs and stickers, and what tests guard the rendering pipeline?