# GAPS — merged across iterations

Format per entry:
- **What we tried to check**
- **Why it failed**
- **What would resolve it**

---

## G-001 — Agent determinism (model + temperature)

- **What:** Record `agent_config.model` (pinned version) and `temperature` in `capabilities.json` so audit re-runs are comparable.
- **Why it failed:** The Cline CLI does not expose the currently selected LLM model identifier or temperature to the agent at runtime.
- **Resolution:** Record pin + temperature out-of-band (in the CI step that invokes the audit), or use an agent runtime that exposes those knobs (Claude Code's `--model` pin, Codex's model selector).

---

## G-002 — `madge` not installed at probe time

- **What:** Build a static TypeScript dependency graph (`madge --circular`, `madge --json`) to detect circular deps and over-coupling.
- **Why it failed:** `madge` missing from the sandbox. Topology graph in `topology.md` is a hand-constructed Mermaid diagram based on `rg` of imports.
- **Resolution:** Install on demand via `npx madge` (network:yes). Will be attempted in Phase 3.

---

## G-003 — SBOM (CycloneDX) not generated

- **What:** Generate a CycloneDX SBOM (`syft dir:. -o cyclonedx-json` or `cdxgen`) for supply-chain provenance.
- **Why it failed:** `syft` not installed; `npx @cyclonedx/cdxgen` was skipped to keep Phase 2 timely for a 244-package tree. `package-lock.json` + `licenses-all.json` used as functional proxies.
- **Resolution:** `brew install syft && syft dir:. -o cyclonedx-json > audit/_runtime/sbom.cdx.json && cyclonedx validate --input-file audit/_runtime/sbom.cdx.json`. Add this to CI; re-run annually.

---

## G-004 — `.github/workflows/generate.yml` contradiction vs Phase 0

- **What:** Phase 0 `topology.md §10` initially asserted "no `.github/workflows/`". That was wrong — the file exists.
- **Why it failed:** `fd` default excludes dotfiles unless `-H` is passed. Phase 0 used `ls .github/ 2>/dev/null` which did find it, but I hadn't noticed until Phase 1. Phase 0's `topology.md §10` "no CI quality gates → Phase 6 High" plan should be re-scoped: CI exists, but **does not gate** (Phase 6 will clarify).
- **Resolution:** Phase 6 will assess the workflow as a **builder, not a gate** (no `npm test`, no lint, no audit in pre-merge path — workflow only runs on push to `main` and only does asset generation + release upload).

---

## G-005 — Coverage % not measured

- **What:** Compute line/branch coverage via `vitest run --coverage`.
- **Why it failed:** `@vitest/coverage-v8` not installed; audit did not add packages beyond license-checker to avoid side effects.
- **Resolution:** `npm i -D @vitest/coverage-v8` + add `coverage.thresholds` to `vitest.config.ts`. Wire into CI per TEST_STRATEGY §4.

---

## G-006 — Accessibility tooling not run

- **What:** `lighthouse`, `pa11y`, `axe-core` audits.
- **Why it failed:** Preview gallery is a dev-only web UI; shipping artifact is static PDFs — Core Web Vitals are not applicable. Contrast ratios for `.dark.css` files not measured this iteration (captured as FIND-0018).
- **Resolution:** Add a CI step `npx pa11y src/templates/html/*.html` for the HTML surfaces; and a small script that parses CSS variables and verifies WCAG 4.5:1 / 3:1. Part of FIND-0018 remediation.

---

## G-007 — In-context reachability of `basic-ftp` CVE not tool-verified

- **What:** Prove the `basic-ftp` FTP-command-injection path is unreachable from this codebase.
- **Why it failed:** Logical argument is strong (Puppeteer only uses `basic-ftp` when downloading Chromium via FTP, and this repo never drives FTP URLs) but not backed by a reachability tool (e.g., a data-flow-aware SAST + call-graph).
- **Resolution:** Closing FIND-0005 via `npm audit fix` makes this gap moot.
