# Codebase Audit Report — goodnotes-templates

| | |
|---|---|
| **Date** | 2026-04-18 |
| **HEAD** | `6603b06` — "fix: bake bubblegum palette into templates 1-6 :root" |
| **Methodology** | CODEX-AUDIT v1.1, Balanced / Risk-Based |
| **Iterations run** | 3 (breadth + depth + adversarial) |
| **Budget used** | full-3-iterations, NETWORK:yes, no overrides |

---

## 1. Executive summary

`goodnotes-templates` is a 9-day-old, single-package TypeScript build tool that generates GoodNotes-ready PDF templates and PNG stickers via Puppeteer + `pdf-lib` + `sharp`. ~3.5k LOC TypeScript, 32 HTML templates, 8 CSS themes, one small CLI, one small preview HTTP server. No auth, no PII, no production service surface.

### Health grade: **C+**

Three conditions prevent a higher grade: (a) the build is broken on HEAD (`tsc --noEmit` exits 2 — **FIND-0011**); (b) the preview HTTP server contains a confirmed symlink path-traversal exploit (**FIND-0022**, POC executed); (c) the only CI workflow does not gate PRs, so broken builds, failing tests, or new HIGH CVEs land silently (**FIND-0008**). All three are cheap (XS / S effort) to close; after Sprint 1 the grade moves to B+.

### Finding counts

| Severity | Count | Notes |
|---|---:|---|
| **Critical** | 0 | — |
| **High** | 4 | FIND-0005 (transitive CVE, not reachable today), FIND-0008 (CI gate), FIND-0011 (tsc fails), FIND-0022 (symlink traversal, POC) |
| **Medium** | 11 | security hardening + doc drift + a11y + vitest CVEs + dead deps + HTML parser |
| **Low** | 11 | polish, caching, validation, dormant primitives |
| **Informational** | 1 | FIND-0023 (downgraded in iter-3 adversarial pass) |
| **Total** | 27 | iter-1: 21 · iter-2: 6 · iter-3 refuted: 0 fully, 1 partially |

### Top 5 risks (after prioritization across all 27 findings)

1. **FIND-0011** — `tsc --noEmit` fails; `npm run build` is broken on HEAD (P0, XS).
2. **FIND-0022** — Preview server symlink path-traversal (confirmed POC, P0, S).
3. **FIND-0008** — CI doesn't run tests/build/audit on PRs (P0, S).
4. **FIND-0005** — basic-ftp HIGH-CVSS transitive (P1, XS). Not currently reachable by this code, but trivial to close with `npm audit fix`.
5. **FIND-0014** — Runtime dependency on Google Fonts contradicts the documented "no external APIs at runtime" guarantee and is the latency floor for every render (P1, M).

### Estimated effort-to-green (t-shirt sum)

Sprint 1 (P0s): XS + S + S ≈ **~2 days of focused work.**
Sprints 2–4 (P1 + P2 + P3 batches): ~3 days + ~5 days + ~1 day ≈ **~9 more days of focused work total.**

---

## 2. Methodology

### Tools run (all outputs under `_runtime/tool-outputs/` unless noted)

| Tool | Version | Purpose | Output |
|---|---|---|---|
| `tokei` | 14.0.0 | LOC inventory | `tokei.json` |
| `git log` | 2.53.0 | Change hotspots | inline in `topology.md` |
| `rg` + `fd` | 15.1.0 + 10.4.2 | Manual pattern scan | inline |
| `tsc` | 6.0.2 (TypeScript 5.6.3 via npm) | Strict build check | `tsc-noemit.log` |
| `npx vitest run` | 2.1.9 | Test execution | stdout (cited in Phase 6 doc) |
| `npm audit` | (built-in) | Dep vulns | `npm-audit.json` |
| `npx depcheck` | latest | Unused deps | `depcheck.json` |
| `license-checker` | latest | License breakdown | `licenses-prod.json`, `licenses-all.json` |
| `gitleaks` | 8.30.1 | Secrets scan (full history) | `gitleaks.sarif` |
| `semgrep` | 1.157.0 | SAST (5 rulesets: p/typescript, p/javascript, p/security-audit, p/nodejs, p/owasp-top-ten) | `semgrep.sarif` |
| Node POC (`node -e`) | 22.21.1 | Symlink path-traversal reproduction | `symlink-poc.log` |

### Gaps — what was not measured

Tracked in `audit/GAPS.md`. Summary:

- **G-001** Agent determinism — Cline CLI does not expose model/temperature pins.
- **G-002** `madge` not installed — dependency graph was hand-built.
- **G-003** CycloneDX SBOM not generated — `package-lock.json` + `licenses-prod.json` used as proxies.
- **G-004** Phase-0 misstated "no .github/workflows" — corrected in Phase 2.
- **G-005** Test coverage % — `@vitest/coverage-v8` not installed; test file-level map used instead.
- **G-006** Lighthouse / pa11y / axe not run — dev-only preview gallery + static PDFs are out of scope for Core Web Vitals; contrast audit deferred to FIND-0018 remediation.

### Iteration discipline

| Iteration | Purpose | Output |
|---|---|---|
| 1 (breadth) | All 9 dimensions at baseline depth | 21 findings |
| 2 (depth) | Drill into 3 T1 modules (preview-server, puppeteer-renderer, pdf-postprocess) | 6 new findings; POC executed for FIND-0022 |
| 3 (adversarial) | Subagent tries to disprove every iter-1/2 finding using full evidence pack | 26 confirmed; 1 partially refuted (FIND-0023 downgraded to Informational); 0 inconclusive |

**Determinism:** `agent_config.model = unknown` (Cline CLI does not expose it), `temperature = null`. Audit is not strictly re-runnable across different models. Logged in GAPS.

---

## 3. Topology & risk map

See `_runtime/topology.md` for full tables.

**Not a monorepo.** 96 files, ~26.7k lines of code (TypeScript 3,451 LoC; HTML/CSS 7,498 LoC; JSON 7,183 LoC; Markdown 1,690 LoC comment lines). Test-to-source ratio ~11%.

**T1 modules (line-by-line review):**

- `src/cli/preview-server.ts` (network-facing)
- `src/core/puppeteer-renderer.ts` (`--no-sandbox` Chromium; hottest path)
- `src/core/pdf-postprocess.ts` (coord math; PDF parsing)

**T2 modules (function-level review):** year-planner builders, svg/png renderers, CLI entry, dimensions, locale.

**T3 modules (spot-check):** registry, scripts, HTML templates. **T4:** themes CSS, tests themselves, docs.

---

## 4. Architecture assessment

See `iteration-1/architecture.md` for the full rubric (mean 2.5 / 5 — appropriate for a 9-day-old tool).

- **Strengths:** explicit trust-boundary guard in preview-server (even though flawed — FIND-0022), transparent pass-through renderer matches the HLD intent, Puppeteer browser reuse, tests exist on the right pure-logic files.
- **Weaknesses:** 67% unused prod deps (FIND-0007), doc drift (FIND-0013), unconditional `--no-sandbox` Chromium (FIND-0003), regex HTML parser (FIND-0012), hard network dependency on Google Fonts (FIND-0014), silent error swallow (FIND-0017), no observability (acceptable for a build tool).
- **Target:** no rewrite. Six incremental deltas, each XS–M. Listed in `architecture.md §Target architecture`.

---

## 5. Threat model summary

See `iteration-1/threat-model.md`. STRIDE across 4 trust boundaries + 4 attacker profiles. 12 threats catalogued. Priority ranking (final, post-iter-3):

1. **T-01 / FIND-0022** — Symlink path-traversal (High, POC). → Sprint 1.
2. **T-04 / FIND-0001** — Preview server on 0.0.0.0 (Medium). → Sprint 2.
3. **T-02 / FIND-0002** — XSS via filename in gallery (Medium, bounded in-context). → Sprint 4.
4. **T-05 / FIND-0003** — `--no-sandbox` Chromium (Medium). → Sprint 3.
5. **T-09 / FIND-0009** — CI Actions pinned by tag (Medium). → Sprint 2.
6. **T-10 / FIND-0010** — Unsigned release artifacts (Low). → Sprint 4.

LINDDUN not applicable (no PII — see Phase 7.5).

---

## 6. Findings by dimension

### Security (14 findings)

| ID | Severity | Title |
|---|---|---|
| FIND-0022 | High | Preview server path-traversal guard is symlink-unsafe |
| FIND-0005 | High | basic-ftp transitive — HIGH CVSS (not reachable today) |
| FIND-0001 | Medium | Preview server binds to 0.0.0.0 |
| FIND-0002 | Medium | Bespoke HTML escape misses single-quote |
| FIND-0003 | Medium | Chromium `--no-sandbox` unconditional |
| FIND-0006 | Medium | vitest 2.x pulls moderate vite/esbuild CVEs |
| FIND-0009 | Medium | GH Actions pinned by tag not SHA |
| FIND-0004 | Low | Puppeteer `networkidle0` + no URL allow-list |
| FIND-0010 | Low | Release artifacts unsigned |
| FIND-0020 | Low | Missing THIRD_PARTY_LICENSES for libvips LGPL |
| FIND-0027 | Low | SVG sticker text interpolation unescaped (dormant) |

### Correctness (9 findings)

| ID | Severity | Title |
|---|---|---|
| FIND-0011 | High | `tsc --noEmit` fails — broken build |
| FIND-0012 | Medium | Bespoke HTML parser in `daily-year-v2.ts` is fragile |
| FIND-0014 | Medium | "No external APIs at runtime" claim false — Google Fonts |
| FIND-0017 | Low | `batchRenderHTML` swallows errors silently |
| FIND-0024 | Low | `addHyperlinks` does not validate rect values |
| FIND-0026 | Low | `addBookmarks` silently clamps out-of-range pageIndex |
| FIND-0025 | Low | Puppeteer `getBrowser` race (dormant) |
| FIND-0021 | Low | Preview server lacks ETag / Cache-Control |
| FIND-0023 | Informational | NUL/backslash not filtered (iter-3 adversarial downgrade) |
| FIND-0015 | Low | Color-mode CSS resolver duplicated |

### Maintainability (3 findings)

| ID | Severity | Title |
|---|---|---|
| FIND-0007 | Medium | 8 of 12 prod deps unused |
| FIND-0013 | Medium | README/CONTRIBUTING/CLAUDE.md reference deleted files |
| FIND-0019 | Low | package.json repository.url stub + README clone URL broken |

### Operability (1 finding)

| ID | Severity | Title |
|---|---|---|
| FIND-0008 | High | CI workflow does not gate merges — no test/build/audit on PRs |

### Testability (1 finding)

| ID | Severity | Title |
|---|---|---|
| FIND-0016 | Medium | Zero tests on T1 modules |

### UX/A11y (1 finding)

| ID | Severity | Title |
|---|---|---|
| FIND-0018 | Medium | 11/32 templates have dark variants; contrast not audited |

Full per-finding detail (evidence snippets, CVSS vectors, code sketches, tests, verification, rollback) in:
- `iteration-1/findings.json`
- `iteration-2/findings.json`
- `iteration-3/verification-results.md` (adversarial verdicts)

---

## 7. Privacy & compliance

**Result: `not_applicable`.** System processes zero personal data — no auth, no user accounts, no logged PII, no analytics SDKs, no CRM sync. Phase 7.5 short-circuited. See `iteration-1/privacy-review.md`.

One residual privacy-of-developer note: Google Fonts fetches at render time reveal the developer's IP to Google (FIND-0014 side-effect).

---

## 8. Test strategy summary

See `TEST_STRATEGY.md` for the full plan. Highlights:

- Current: 25 tests passing (CHECKPOINT.md claimed 27 — ✗). Coverage of T1 modules = 0.
- Proposed: 8 targeted new test files, ~30 new tests, all XS or S effort each.
- Coverage floors: T1 ≥ 80% line / 70% branch; T2 ≥ 70% line; T3/T4 not enforced.
- New CI gate: `npm ci && npm run build && npm test && npm audit --audit-level=high` on every PR.

---

## 9. Roadmap summary

See `IMPLEMENTATION_ROADMAP.md` + `IMPLEMENTATION_ROADMAP.csv` for the per-ticket table.

Sprints:

| Sprint | Theme | Ticket count | Effort |
|---|---|---:|---|
| 1 | Unblock build + close P0 exploit | 3 | ~2 days |
| 2 | Supply chain + doc hygiene batch | 6 | ~3 days |
| 3 | Offline + a11y + code quality | 5 | ~5 days |
| 4 | Polish + back-burner | 13 | ~1 day (all XS) |

**Total effort to close everything: ~11 focused working days.** Post-Sprint 1, health grade moves from C+ to B+.

---

## 10. Gaps & what we could not verify

See `audit/GAPS.md` for the 6 entries. Summary: SBOM not generated, madge not installed, coverage % not measured, a11y tools not run, `basic-ftp` in-context reachability is logically near-zero but not proven unreachable with tooling.

None of these gaps would change P0/P1 prioritization if resolved.

---

## 11. Appendices

### Raw tool outputs (reviewer can verify every metric)

All under `audit/_runtime/tool-outputs/`:

- `tokei.json` — LOC counts
- `npm-audit.json` — 6 vulnerabilities
- `depcheck.json` — 8 unused prod, 4 unused dev
- `licenses-prod.json`, `licenses-all.json` — 244 prod packages, 11 license types
- `gitleaks.sarif` — 0 leaks
- `semgrep.sarif` — 0 findings (5 rulesets)
- `tsc-noemit.log` — 2 errors
- `symlink-poc.log` — FIND-0022 reproduction transcript

### SBOM path

Not generated (G-003). `package-lock.json` (committed) is the interim proxy.

### Monorepo

**Not a monorepo.** Every ticket in package `<root>`.

### Repo metadata

- License (code): MIT.
- Declared asset license: CC BY 4.0 (per README.md §License). No file-level declaration in repo; flagged as FIND-0020 scope.
- Node engines: `>=18.0.0`.
- Repository remote: `https://github.com/praxstack/goodnotes-templates.git` (per workspace metadata) — contradicts `package.json` stub (`yourusername/…`) → FIND-0019.
