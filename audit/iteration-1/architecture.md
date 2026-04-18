# Phase 3 — Architecture Review

## Pattern classification

**Modular monolith**, CLI-style. Single Node process, entrypoints = one CLI (`commander`) + one optional HTTP preview server. Rendering is delegated to three cohesive modules (`puppeteer-renderer`, `svg-renderer`/`png-renderer`, `pdf-postprocess`). There is no event bus, no queue, no DB, no RPC surface.

This is appropriate for the domain (build tool). The HLD doc (`docs/HLD-self-contained-templates.md`) explicitly chose this shape by deleting the former orchestrator (`renderer.ts` + `themes.ts`) in favor of "template is self-contained". The decision is well-documented and well-reasoned.

## Current architecture (Mermaid)

See `audit/_runtime/dependency-graph.mmd`.

## Strengths (observed, with evidence)

1. **Explicit trust boundary separation** — HTTP server (`src/cli/preview-server.ts`) has a clear allow-list (`filePath.startsWith(absDir + path.sep)`; line 39). The non-network code paths read only from hard-coded paths under `src/templates/`. This is unusually disciplined for a 9-day-old repo.
2. **Transparent pass-through renderer** — `puppeteer-renderer.ts:75` comment explicitly states "does not inject theme CSS or fonts". Matches the HLD intent (§2.2) with no drift. The comment is enforced by the code.
3. **Clear coord-system documentation in the PDF post-processor** — `pdf-postprocess.ts:9-13` documents the CSS→PDF Y-flip and `cssToPageRect()` is the single place it happens. Prevents off-by-one bugs.
4. **Puppeteer browser reuse** — `getBrowser()` caches the Chromium instance (line 28). Saves ~2s per render on batch jobs. Correctly checks `connected` before reuse.
5. **Tests exist on the highest-risk pure logic** — `locale.ts` and `daily-year-v2.ts` have real tests (3 test files total). The tested functions are exactly where correctness defects would compound across 365 pages.

## Weaknesses (observed, with evidence)

1. **8 of 12 production deps are unused** (Phase 2 depcheck). Ships dead code to every `npm install`: `pdfkit`, `@svgdotjs/svg.js`, `svgdom`, `chalk`, `ora`, `glob`, `handlebars`, `fontkit`. Attack-surface inflation at zero benefit.
2. **Doc / code drift** (Phase 1 claims ledger). README arch section, CONTRIBUTING.md, and `CLAUDE.md` all reference files that were deleted in the self-contained refactor (`themes.ts`, `pdfkit-renderer.ts`). HLD/LLD are correct; user-facing docs are stale.
3. **Puppeteer launches Chromium with `--no-sandbox --disable-setuid-sandbox` unconditionally** (`puppeteer-renderer.ts:32-38`). This is the standard Docker/CI workaround, but flipping it off on developer workstations is unnecessary risk given untrusted HTML could theoretically be rendered. The HLD thesis is "HTML is trusted because it's shipped in-repo" — true today, but nothing in the code enforces that.
4. **Regex-based HTML parsing of templates** (`daily-year-v2.ts:121-152`, `daily-year-v2.ts:197-207`). `<body>`, `<div class="page">`, `data-inject` patterns are all matched by regex with the implicit assumption that templates are well-formed and attribute order is stable. A template contributor adding e.g. `<body data-theme="dark">` works (covered), but `<body  class="x" >` with multiple spaces breaks `bodyMatch[0].length`. Fragile.
5. **Network-dependent rendering** — every HTML template fetches Google Fonts via `<link>`. `puppeteer-renderer.ts:124` uses `waitUntil: 'networkidle0'` which blocks on those requests. Directly contradicts `PROBLEM_STATEMENT.md §8` "No external APIs at runtime". Offline rendering fails silently.
6. **No CHANGELOG, no release tagging, no dependabot/renovate config** — the single `.github/workflows/generate.yml` only rebuilds assets on push to `main`; no pre-merge gate.
7. **Overuse of `tests/**` in `tsconfig.exclude`** — excluded from build, but `vitest` still runs them. Build + test live in different worlds. Fine; noted for consistency.
8. **No input validation on CLI `render` template path** (`src/cli/index.ts:33-45`). `fs.access()` only confirms existence; a user can pass any path on disk as a template. For a build tool, this is fine — but `package.json` exposes this as a `bin`, so a future supply-chain consumer installs it globally. A malicious flag like `--output /etc/passwd.pdf` would fail on permissions, not on validation. Low priority.
9. **Duplicate entry-point logic** — `src/cli/index.ts` and `scripts/generate-4week.ts` + `scripts/render-v3.ts` each implement their own color-mode CSS discovery (`generate-4week.ts:80-95` duplicates `puppeteer-renderer.ts:92-107`). Drift risk.
10. **No observability** — no logs beyond `console.log`, no metrics, no structured error output, no exit code discipline across scripts (some have `catch (err) { console.error; process.exit(1) }`, some don't).

## Rubric (1–5, with evidence)

| Dimension | Score | Justification (cited) |
|---|---:|---|
| Modularity | 4 | Renderer / post-processor / CLI / generators cleanly separated. `svg-renderer` + `png-renderer` are a tight two-step pipeline. Tests confirm `locale.ts` is pure. (`src/core/*` split) |
| Scalability | 3 | Monthly batching in `daily-year-v2.ts` avoids OOM for 1500+ page docs. Single-process; no horizontal surface because none is needed. Bumped from N/A to 3 because the code does actually think about batch size. |
| Resilience | 2 | No retry/backoff on Puppeteer launch. `networkidle0` hang if Google Fonts times out. `batchRenderHTML` swallows errors and continues silently (`puppeteer-renderer.ts:201-204`) — ok for a best-effort build, bad if a user expected N files and got N-1. |
| Testability | 2 | Pure-logic files testable; I/O-heavy modules (`puppeteer-renderer`, `pdf-postprocess`, `preview-server`) have zero tests and few seams. Browser singleton + `fs.readFile` direct calls prevent easy stubbing. |
| Deployability | 3 | `npm ci` + GH Actions + Releases — works. Not signed (Phase 2 §2.6). No branch protection gate. |
| Observability | 1 | `console.log` only. No log levels, no structured output, no metrics, no trace IDs. Acceptable for a build tool; flagged because docs claim "error messages MUST be actionable" (NFR-04.4). |

Mean: **2.5 / 5.** Reasonable for a 9-day-old build tool; the gaps are fixable, not structural.

## Target architecture (delta, not a rewrite)

Only incremental changes — no proposed rewrite.

1. Pin Chromium args to CI-only. Default launch should let Puppeteer decide; add `{ args: [...] }` only when `process.env.CI` is truthy.
2. Self-host Google Fonts under `assets/fonts/` (the directory is already mentioned as a plan in `PROBLEM_STATEMENT.md §Risk`). Replace `<link>` in every HTML template with a local `@font-face` block loaded via a `file://` URL. Aligns with C-22 claim.
3. Parse HTML with a real parser (`cheerio` or `parse5`) in `daily-year-v2.ts`. Drop the bespoke depth-counting `<div>` matcher.
4. Remove unused deps (Phase 2 §2.8). Keep `handlebars` in mind for future string-templating if needed, but zero usage today.
5. Extract shared color-mode CSS discovery into one helper; delete the duplication in `scripts/generate-4week.ts`.
6. CI: add `npm run build && npm test && npm audit --audit-level=high` to workflow's pre-merge path. Add a second workflow for PRs (currently `on: push`).

Each of these is a **S** (1 day) or **M** (1–3 days) t-shirt.

## Migration delta

No module deletions, no renames, no public API changes. All six items above are additive or in-place simplifications.
