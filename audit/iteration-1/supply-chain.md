# Phase 2 — Dependency, Supply Chain & Infrastructure Audit

## 2.1 — SBOM

**Status:** `NOT GENERATED — syft not installed, `cdxgen` skipped due to sandbox install cost`. Tracked in `GAPS.md` (G-003). `package-lock.json` + `licenses-all.json` collectively serve as a functional BOM for the purposes of this audit. A proper CycloneDX SBOM should be added to CI.

## 2.2 — Dependency vulnerabilities

**Tool run:** `npm audit --json` → `_runtime/tool-outputs/npm-audit.json`

**Scorecard:** 6 vulnerabilities — **1 high, 5 moderate, 0 critical, 0 low**. All are transitive (none of the 12 prod dependencies is directly vulnerable; the only direct-listed vulnerable package is `vitest`, which is a devDependency).

### Per-CVE detail

| # | Package | Dep path | Severity | CVSS | Advisory | Fix |
|---|---|---|---|---|---|---|
| SC-V-01 | `basic-ftp` | puppeteer → extract-zip → … | **High** | 8.2 + 7.5 | GHSA-6v7q-wjvx-w8wg (CRLF→FTP cmd injection), GHSA-rp42-5vxx-qpwr (DoS via unbounded `Client.list()`) | `fixAvailable: true` (non-major via `npm audit fix`) |
| SC-V-02 | `esbuild` | vitest/vite → esbuild | Moderate | 5.3 | GHSA-67mh-4wv8-2f99 (dev-server SSRF-like: any site can read responses) | `vitest@4.1.4` (semver-major bump) |
| SC-V-03 | `vite` | vitest → vite | Moderate | 0 (unscored) | GHSA-4w7w-66w2-5vf9 (path traversal in `.map` handling) | `vitest@4.1.4` |
| SC-V-04 | `vitest` (direct devDep) | root | Moderate | — | Rollup of ↑ | `vitest@4.1.4` — **semver-major bump**, test-suite risk |
| SC-V-05 | `vite-node` | vitest → vite-node | Moderate | — | Via vite | `vitest@4.1.4` |
| SC-V-06 | `@vitest/mocker` | vitest → mocker | Moderate | — | Via vite | `vitest@4.1.4` |

**Observations:**

- The only **high-severity** issue (`basic-ftp`) sits under `puppeteer` via `extract-zip` (Puppeteer's downloader for `chrome-headless-shell`). `basic-ftp` is **only used when a user opts into FTP-backed downloads**; in the default install flow it is loaded but not exercised. Exploit requires a user to feed attacker-controlled FTP credentials/URIs to Puppeteer — **this repo never does that**. Real-world exploitability from this codebase ≈ **near zero**. Still record; `npm audit fix` closes it.
- The 5 moderate Vite/esbuild/vitest issues affect only the **dev test runner** when used in browser mode on a shared network. Exploitability here ≈ **near zero** (headless CI, local dev only). Upgrade is still desirable but not urgent.

## 2.3 — Container image scanning

**Status:** `not_applicable` — no Dockerfile, no container build, no k8s manifests. Confirmed via `fd -t f -HI -E node_modules -e Dockerfile` (empty) and `fd -t f -HI -e yaml -e yml .github` returning only `generate.yml`.

## 2.4 — Infrastructure-as-Code scanning

**Status:** `not_applicable` — no Terraform, no Helm, no k8s, no Ansible. `.github/workflows/generate.yml` is the only IaC-ish file (reviewed inline under Phase 3).

## 2.5 — Secret scanning (git history + HEAD)

**Tool run:** `gitleaks detect --source=. --log-opts="--all" --redact` → `_runtime/tool-outputs/gitleaks.sarif`

**Result:** `0 leaks found. 1.66 MB scanned across full history.` → **Clean.**

Supplementary `rg` for well-known token prefixes:

```
rg -P '(?:sk|pk|xox|ghp|glpat|AIza|AKIA)[A-Za-z0-9_\-]{16,}' -l
```

Zero matches across repo excluding `node_modules/` and `audit/_runtime/tool-outputs/`.

## 2.6 — Supply-chain integrity (SLSA posture)

**Tool runs:** grep of `.github/workflows/*.yml`

| Check | Result | Evidence |
|---|---|---|
| CI actions pinned by full commit SHA? | **No** — all actions pinned by tag (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`, `softprops/action-gh-release@v2`) | `.github/workflows/generate.yml:22,24,42,64,80` |
| Release artifacts signed (cosign / sigstore / PGP)? | **No** — `action-gh-release` uploads unsigned `.zip` | `generate.yml:85-100` |
| SLSA provenance (`*.intoto.jsonl`)? | **No** — none emitted | workflow never generates provenance |
| Reproducible builds? | **Partial** — `npm ci` pins versions via `package-lock.json`, but `node-version: '20'` is a floating major (20.x at build time) | `generate.yml:25` |
| Dependabot / renovate? | **No** — no `dependabot.yml`, no `renovate.json` | `fd -HI dependabot.yml renovate.json` = empty |
| CODEOWNERS / branch protection | Not verifiable from repo (branch protection is a server-side setting) | — |

## 2.7 — License audit

**Tool run:** `license-checker --json --production` → `_runtime/tool-outputs/licenses-prod.json`

**Production transitive dep count:** 244 packages.

### License breakdown (prod only)

| License | Count | Compatibility with MIT code + CC BY 4.0 assets |
|---|---:|---|
| MIT | 188 | ✓ |
| Apache-2.0 | 18 | ✓ |
| ISC | 14 | ✓ |
| BlueOak-1.0.0 | 9 | ✓ (permissive, SPDX-recognized) |
| BSD-2-Clause | 6 | ✓ |
| BSD-3-Clause | 3 | ✓ |
| 0BSD | 2 | ✓ |
| (MIT AND Zlib) | 1 | ✓ (`pako@1.0.11`) |
| Python-2.0 | 1 | ✓ (`argparse@2.0.1`; Python-2.0 is permissive) |
| `MIT*` (asterisk = inferred) | 1 | Review (`png-js@1.0.0` — inferred by license-checker; actually MIT per package) |
| **LGPL-3.0-or-later** | **1** | ⚠ (`@img/sharp-libvips-darwin-arm64@1.0.4`) |

### The LGPL finding

`sharp` dynamically links the system `libvips` image library. The **prebuilt binary shipped by `@img/sharp-libvips-*`** is LGPL-3.0-or-later. This is the legacy binding packaging — the **actual linked binary is dual-licensed** (LGPL-3.0-or-later / commercial). `sharp` itself (the Node wrapper) is Apache-2.0.

**Practical implication for this repo:**
- `sharp` is used at **build time** to rasterize SVG → PNG (`src/core/png-renderer.ts:28`). The generated PNGs are **not derivatives** of libvips (SPDX + industry practice — LGPL-3 dynamic-link exception). So shipping PNG output is fine under MIT/CC BY 4.0.
- If you ever **statically linked** sharp-libvips into a redistributable binary, you'd need to (a) ship under LGPL-3-compatible terms or (b) release the libvips source. You don't.
- **Risk: Low.** But users who `npm install` this package **do** pull the LGPL binary onto their machine. A prominent NOTICE / THIRD_PARTY_LICENSES file citing `libvips (LGPL-3.0-or-later)` is industry standard and currently **absent**.

### Unlicensed or `MIT*` packages

- `png-js@1.0.0` — license-checker couldn't find a LICENSE file, hence `MIT*`. Manual check of the repo confirms MIT. Low risk.

### No GPL/AGPL/SSPL in proprietary-conflict categories

No GPL-2/3, AGPL, SSPL, CC-BY-NC, or unlicensed packages that would create copyleft contagion on the generated PDFs.

## 2.8 — Unused dependencies (depcheck)

**Tool run:** `npx depcheck --json` → `_runtime/tool-outputs/depcheck.json`

```json
{
  "unused_dependencies": [
    "pdfkit", "@svgdotjs/svg.js", "svgdom",
    "chalk", "ora", "glob", "handlebars", "fontkit"
  ],
  "unused_devDependencies": [
    "@types/pdfkit", "looks-same",
    "@typescript-eslint/eslint-plugin", "@typescript-eslint/parser"
  ],
  "missing": {}
}
```

**Read:** 8 of 12 production dependencies (67%) are unused. All are remnants of the pre-HLD-refactor theme system. Each shipped unused dep adds install-time surface, security-advisory surface, and disk/download cost.

Cross-checked by grepping usage — confirmed by depcheck's own `.using` map which only lists `pdf-lib`, `sharp`, `puppeteer`, `commander` as actually imported.

## 2.9 — Static analysis (semgrep)

**Tool run:** `semgrep --config=p/typescript --config=p/javascript --config=p/security-audit --config=p/nodejs --config=p/owasp-top-ten --sarif` → `_runtime/tool-outputs/semgrep.sarif`

**Result:** **0 findings.** For a 3.5k-LOC TS codebase with no DB / no user input / no auth / no external API, this is consistent with the low attack surface. Findings in Phase 5 will come from manual review, not rulesets.

## Exit gate

- Every severity count cites `_runtime/tool-outputs/npm-audit.json` with JSONPath `$.metadata.vulnerabilities.*`.
- SBOM was skipped (G-003 in GAPS.md); `package-lock.json` + `licenses-all.json` are usable proxies.
- Missing-tool gaps recorded; no tool was pretend-run.
