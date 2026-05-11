# Codebase Audit Report — goodnotes-templates (iteration-4)

| | |
|---|---|
| **Date** | 2026-05-11 |
| **HEAD** | `2529d90` — "feat(customisation): Tier 2 themes — 378 pre-rendered themed PDFs + gallery swatch picker" |
| **Repository** | `github.com/praxstack/goodnotes-templates` |
| **Protocol** | CodeBaseGPT-Pro 9-phase (senior engineering council framing) |
| **Auditor** | Cline · Claude Sonnet 4.5 |
| **Prior audits** | iter-1 (2026-04-18 breadth), iter-2 (depth), iter-3 (adversarial) |
| **Scope** | Full-repo re-audit after W5 monorepo migration, `apps/gallery` addition, v1.0.0 npm ship |

---

## 1. Executive Dashboard

**Repository:** `goodnotes-templates` (a.k.a. `pretext-templates`)
**Shape:** 3-workspace npm monorepo: `packages/core`, `packages/cli`, `packages/packs-*` (27 packs), `apps/gallery` (Astro 6 SSG)
**Shippable surfaces:**

1. `@praxlannister/pretext-core` on npm (rendering engine)
2. `@praxlannister/pretext-cli` on npm (Commander CLI)
3. `pretext-templates.vercel.app` (public gallery / marketplace)
4. The Praxis Ledger monthly release (bookmarked PDF + standalone HTML + 60-sticker pack + fonts + CSS + source templates)

### Inventory

| Metric | Value |
|---|---|
| Total tracked files (excluding node_modules/dist/audit runtime) | **3,946** |
| TypeScript LOC (packages + scripts + tests + apps) | **~19,639** |
| Top-level packages | 29 (`packs-*` × 27, `core`, `cli`) + 1 app (`gallery`) |
| HTML pack templates | 48 (27 canonical + v3/v4/v5 history + design system) |
| Tests | 235 passing (18 files) — all green |
| Prod deps (all workspaces) | 423 resolved (core: 4 direct · cli: 1 direct · gallery: 3 direct) |
| Dev deps | 190 resolved |

### Issue Summary (iteration-4)

| Severity | Count | % of Total |
|---|---:|---:|
| Critical | **1** | 12% |
| High | 0 | — |
| Medium | 4 | 50% |
| Low | 2 | 25% |
| Informational | 1 | 13% |
| **Total (new this iteration)** | **8** | 100% |

Plus the 4 deferred findings from iter-1–3 (`FIND-0012`, `FIND-0014`, `FIND-0018`, `FIND-0028`) that are still open — see `audit/POST_SPRINT_STATUS.md` and `audit/iteration-1/GAPS.md`.

### Top 5 risks (post-prioritization)

1. **🔴 FIND-I4-001 · PII committed to git.** `packages/packs-prax-journal/profile.local.json` is in the tree with real patient data (name, medications with dosages, psychiatrist registration №). `.gitignore` only blocks the pre-W5 path `packs/journals/prax-journal/profile*.json`; the W5 migration (`dcf13a7`) moved the files without updating ignore rules. **Effort:** XS (0.5 pd).
2. **🟠 FIND-I4-002 · npm-audit regression.** 6 vulnerabilities (1 high `fast-uri`, 5 moderate `yaml`) introduced via `apps/gallery` → `@astrojs/check` chain. Fixable with `npm audit fix --force`, which upgrades `@astrojs/check` to a patched line. **Effort:** XS (0.25 pd).
3. **🟠 FIND-I4-003 · ESLint is a silent no-op.** `eslint.config.js` globs `src/**/*.ts`, but W5 moved sources to `packages/**/*.ts`. `scripts/**` explicitly ignored. `npm run lint` succeeds with zero files inspected. **Effort:** XS (0.25 pd).
4. **🟠 FIND-I4-004 · Coverage threshold failing.** `vitest.config.ts` sets `branches: 75` but current is **61.99%**. Tests pass 235/235 but `--coverage` exits non-zero. If CI runs `npm test -- --coverage`, PRs are blocked; if it doesn't, the gate has drifted to decorative. **Effort:** S (1 pd to get to 75%).
5. **🟡 FIND-I4-005 · Gallery ships without a CSP or X-Content-Type-Options.** The Astro gallery is static HTML on Vercel. No meta-tag CSP and no `vercel.json` security headers. Risk is low (SSG, no user input, no auth) but OG image URLs and pack HTML are content-attacker-reachable surfaces. **Effort:** S (0.5 pd).

### Effort to close (iteration-4 findings only)

| Bucket | Count | Effort |
|---|---:|---|
| P0 (critical) | 1 | 0.5 pd |
| P1 (high-impact medium) | 3 | ~2 pd |
| P2 (medium · fix next sprint) | 1 | 0.5 pd |
| P3 (polish) | 3 | ~0.75 pd |
| **Total** | **8** | **~3.75 person-days** |

### Health grade · **B** (was C+ at iter-1)

Moved up two grades from iter-1's **C+** thanks to the 23 closed findings between iter-1 and today. Still short of **A-** because:

- One open Critical (FIND-I4-001) is a policy violation rather than a bug.
- Multiple silent-failure guardrails drifted during the W5 migration: ESLint, coverage threshold, monthly audit probe (which flagged none of these because the probe runs on the scripts-renamed paths that also slipped).
- Four iter-1 findings remain deferred; three of them are in the "large-but-known" bucket documented in `POST_SPRINT_STATUS.md`.

After Sprint 1 closes FIND-I4-001 through -004, grade moves to **A-**.

---

## 2. Methodology

### Phases executed (9-phase protocol)

| # | Phase | Output |
|---:|---|---|
| 1 | Discovery & cataloging | `phase-validation.md §1` · file census complete |
| 2 | Documentation deep-dive | `phase-validation.md §2` — docs are dense and largely current; gaps listed |
| 3 | Architectural review | `architecture.md` — monorepo topology, dependency graph, pack registry design |
| 4 | Intensive code review | `findings.md` — function-level review of 6 hotspot files (puppeteer-renderer, pdf-postprocess, prax-journal-renderer, preview-server, profile schema, standalone-builder) |
| 5 | QA & testing audit | `TEST_STRATEGY.md` — 235 tests pass; coverage 67.64% / branches 61.99% (fails 75% threshold) |
| 6 | Security deep-dive | `findings.md §Security` — npm audit, secret scan, PII audit, gallery CSP |
| 7 | UI/UX & accessibility audit | `findings.md §UI-UX` — gallery + pack HTML spot-check |
| 8 | Consolidation & prioritization | this report |
| 9 | Roadmap & deliverables | `IMPLEMENTATION_ROADMAP.md` + this report |

### Tools run live

| Tool | Version | Result |
|---|---|---|
| `tsc --noEmit` | 5.6.3 | **exit 0** (clean) |
| `npm test` (vitest 4.1.4) | 235 tests across 18 files | **all pass**, 840 ms |
| `npm test -- --coverage` | v8 coverage | 67.64% stmts · 68.32% lines · **61.99% branches** (below 75% threshold → exits non-zero) |
| `npm audit` | npm 10 | **6 vulnerabilities** (1 high `fast-uri`, 5 moderate `yaml`) in gallery transitive deps |
| `npx eslint 'packages/**/*.ts'` | 9.39.4 | 0 files matched (config bug — FIND-I4-003) |
| `git ls-files`, `git check-ignore` | 2.53 | `profile.local.json` tracked; `.gitignore` stale — FIND-I4-001 |
| `find + wc -l` | — | 3,946 files, 19,639 TS LOC, 48 HTML templates |
| Manual grep: secrets, `any` casts, `TODO`/`FIXME`, `console.*` in ship paths | — | 3 `any` in `pdf-postprocess.ts` (bounded to pdf-lib untyped internals); 0 TODOs in shipping code; 7 intentional `console.log`/`warn` in `core/` |
| Manual grep: CSP / security headers in gallery | — | 0 hits (FIND-I4-005) |

### What was NOT measured (see also `audit/GAPS.md` for iter-1-3 gaps)

- **G4-001** Lighthouse / axe-core not run live on `pretext-templates.vercel.app` — would cost ~15 min; scoped out for brevity of this iteration.
- **G4-002** `cosign verify-blob` not re-executed on v1.0.0 release artifacts — iter-1 verified the signing infra; no reason to believe regression.
- **G4-003** Visual regression suite (`vitest.visual.config.ts`) not run — baseline screenshots not checked; would need baseline refresh since v1.0.0 layout changes landed.
- **G4-004** `npm outdated` at ecosystem level not enumerated — focus was vulnerability regressions, not release-candy churn.
- **G4-005** Cross-app compatibility (Notability · Noteshelf · CollaNote) — requires iPad device testing, out of scope for a desk-based audit.

---

## 3. Topology Snapshot

See `architecture.md` for the full tables. Summary:

```
goodnotes-templates/              (monorepo root · private, not published)
├── packages/
│   ├── core/            @praxlannister/pretext-core      ← renderer lib (npm)
│   ├── cli/             @praxlannister/pretext-cli       ← CLI (npm)
│   └── packs-<27>/      @praxlannister/pretext-packs-…   ← each pack is its own package
├── apps/
│   └── gallery/         @pretext-templates/gallery       ← Astro SSG, Vercel-hosted
├── scripts/             ~5.8k LOC of one-off + release scripts (ESLint-ignored)
├── shared/              fonts + base.css + 14 theme CSS swaps
├── tests/               235 tests across unit/visual/e2e
└── docs/                plan-* reviews (CEO/eng/design), HLD/LLD, migration record
```

### Trust boundaries (unchanged from iter-1)

1. **`packages/cli/src/preview-server.ts`** — local HTTP server, dev-only, bound to 127.0.0.1 (iter-1 FIND-0001 closed), symlink-safe (iter-1 FIND-0022 closed).
2. **Puppeteer renderer** — Chromium instance with sandbox on dev workstations, off on CI only (FIND-0003 closed). Outbound requests allow-listed to `data:` | `file:` | `fonts.{googleapis,gstatic}.com` (FIND-0004 closed).
3. **`apps/gallery` → public web** — new surface since iter-1. SSG output on Vercel. No user input; OG image URLs and pack HTML are the interesting surfaces. FIND-I4-005 addresses header hardening.

### Hottest paths (T1 modules — function-level review this iteration)

| Module | LOC | Why T1 |
|---|---:|---|
| `packages/core/src/puppeteer-renderer.ts` | 438 | Chromium lifecycle, network allow-list, render-scale knob |
| `packages/core/src/pdf-postprocess.ts` | 301 | PDF byte-manipulation; pdf-lib `any` casts |
| `packages/core/src/prax-journal-renderer.ts` | 453 | PII placeholder substitution; consumes `profile.json` |
| `packages/cli/src/preview-server.ts` | 202 | Only network-facing code in the ship paths |
| `packages/core/src/types/profile.ts` | 288 | Zod schema for PII — the policy contract |
| `packages/core/src/standalone-builder.ts` | 268 | Regex-driven HTML stitcher (iter-1 FIND-0012 family) |

---

## 4. Architecture Assessment (delta from iter-1)

**Positive deltas since iter-1:**

- ✅ Clean monorepo split: `core` (rendering lib) + `cli` (Commander wrapper) + `packs-*` (27 self-contained packages with manifests).
- ✅ Published on npm with SHA-pinned GitHub Actions + `sigstore/cosign` keyless OIDC signing.
- ✅ Strict Zod v3 schema on `profile.json` with explicit schema versioning and migration-aware parse errors (`ProfileParseError`).
- ✅ 4-rule network allow-list in Puppeteer renderer, memory-aware Chromium restart (`PRAX_BROWSER_RESTART_EVERY`), render-scale fallback for mobile Safari heap ceiling.
- ✅ Pure standalone-builder extracted into `core` so the CLI, bundle-release script, and future gallery preview all share one implementation (iter-1 Finding 1.3 closed).
- ✅ pdf-postprocess hyperlink rect validation (NaN/Infinity/negative sizes skipped with warning) — iter-1 FIND-0024 closed with regression test.

**Deltas introduced since iter-1 (new in iteration-4):**

- ❌ **Stale `.gitignore`** — W5 migration moved source files but not ignore rules. Result: the whole point of Q4's "data-only reference, PII never in repo" is defeated by a working directory checked in.
- ❌ **Stale `eslint.config.js` glob** — same root cause (paths moved from `src/` to `packages/*/src/`).
- ❌ **npm-audit drift** — gallery added `astro`, `@astrojs/check`, `blurhash` etc. after iter-1's 0-vuln state. `@astrojs/check@0.9.4` transitively depends on a vulnerable `yaml@2.x` chain; `fast-uri` high CVSS hit likely via the same tree.
- ❌ **Gallery has no CSP or `X-Content-Type-Options`** — iter-1 didn't cover this because the gallery didn't exist yet.

**No-change since iter-1:**

- Test-to-source ratio acceptable (235 tests / ~19.6k LOC ≈ 1.2% file ratio, but the 235 tests are heavily concentrated on the risky pure-logic modules: splice, profile-schema, pdf-postprocess, preview-server, standalone-builder). The iter-1 philosophy "cover the logic, not the coverage percentage" still applies.
- Regex-based HTML parser in `standalone-builder.ts` (iter-1 FIND-0012) works and has dedicated tests; not worth swapping for cheerio yet.
- Runtime dependency on `fonts.googleapis.com` in the pack-HTML render path (iter-1 FIND-0014) — the Prax Journal v5 already self-hosts base64-inlined fonts, but the other 26 packs still load Google Fonts at render time. Gradual migration pack-by-pack is sound.

### Tech-stack assessment

| Component | Current | Status | Notes |
|---|---|---|---|
| Node runtime | ≥18 (CI on 20) | ✅ current LTS | |
| TypeScript | ^5.6.3 (ambient 5.9 available) | ✅ fine | strict mode on, `tsc --noEmit` clean |
| Puppeteer | ^23.11.1 | ✅ current major | |
| pdf-lib | ^1.17.1 | 🟡 unmaintained | 1.x hasn't shipped in 2+ years; iter-1 FIND-0028 tracked |
| zod | 3.23.8 | 🟡 on 3.x; 4.x out | Pinned exactly — deliberate; 4.x migration is a sprint of its own |
| sharp | ^0.33.5 (core) / 0.34.5 (gallery) | 🟢 current, split versions OK (workspaces) | libvips LGPL notice in THIRD_PARTY_LICENSES.md (iter-1 FIND-0020 closed) |
| astro | 6.2.1 | ✅ current major | |
| vitest | 4.1.4 | ✅ current major | |
| commander | ^12.1.0 | ✅ current major | |

No tech-stack overhaul warranted. The `pdf-lib` unmaintained concern is real but the usage surface is narrow (metadata, hyperlinks, bookmarks, merge) and all are tested.

---

## 5. Findings Summary (by dimension)

### 🔒 Security (3 findings this iteration)

| ID | Severity | Title |
|---|---|---|
| FIND-I4-001 | **Critical** | `profile.local.json` with real PII is tracked in git |
| FIND-I4-002 | Medium | `npm audit` shows 1 high + 5 moderate via `@astrojs/check` |
| FIND-I4-005 | Low | Gallery ships without CSP / X-Content-Type-Options headers |

### 🧪 Quality & gates (3 findings)

| ID | Severity | Title |
|---|---|---|
| FIND-I4-003 | Medium | ESLint glob uses pre-W5 `src/**/*.ts` path; lints 0 files |
| FIND-I4-004 | Medium | Coverage threshold in `vitest.config.ts` (branches 75%) fails at 61.99% |
| FIND-I4-008 | Informational | `packages/cli/src/preview-server.ts` has 2 duplicated gallery-HTML strings (code + live page) — minor drift risk |

### ⚙️ Correctness / edge cases (1 finding)

| ID | Severity | Title |
|---|---|---|
| FIND-I4-006 | Low | `getRestartThreshold()` silently falls back to 50 on invalid env var; CLI has no equivalent validate-or-error path like `--render-scale` |

### 📚 Docs & operability (1 finding)

| ID | Severity | Title |
|---|---|---|
| FIND-I4-007 | Low | `audit/POST_SPRINT_STATUS.md` claims "0 vulnerabilities"; truth is 6 vulns since the gallery landed. Doc is stale, which undermines audit trust |

Details in [`findings.md`](./findings.md). Every item has a file·line, evidence, concrete recommendation, and effort estimate.

### Deferred from iter-1–3 (still open)

| ID | Severity | Title | Status |
|---|---|---|---|
| FIND-0012 | Medium | Replace regex HTML parser with cheerio | Deferred — touched at each template-editing session and still no drift; reassess in iteration-5 |
| FIND-0014 | High (P1) | Runtime dep on Google Fonts for non-v5 packs | Partially addressed — Prax Journal v5 self-hosts; migration strategy documented; 26 packs still depend on CDN |
| FIND-0018 | Medium | WCAG AA contrast audit across 14 themes | Still open — needs pa11y / axe run; deferred again here |
| FIND-0028 | Low | `pdf-lib` unmaintained | Still tracked — usage surface narrow, covered by tests |

---

## 6. Threat model · delta from iter-1

Two new threat paths since iter-1:

- **T4-1 · Supply chain via gallery.** The gallery expanded the dev-dep surface. Automated dep updates + monthly audit probe mitigate; FIND-I4-002 is the symptom that probe gating didn't catch.
- **T4-2 · Public repo PII exposure.** Whoever clones this repo gets the maintainer's therapist registration numbers and medications in plain JSON. FIND-I4-001 — highest severity this iteration.

No new T-class on the Puppeteer renderer or preview server. Iter-1 threat model for those remains current.

---

## 7. Test Strategy (delta)

Details in [`TEST_STRATEGY.md`](./TEST_STRATEGY.md). Summary:

- **Strength:** 235 tests concentrated on the risky modules. Pure-logic coverage is excellent (`svg-renderer.ts` 100% lines, `standalone-builder.ts` well-covered by 11 tests).
- **Gap:** `puppeteer-renderer.ts` is at 27% / 33% branches because the actual Chromium calls are integration-y. This is intentional per iter-1 philosophy, but the coverage threshold in `vitest.config.ts` doesn't match reality — either lower the threshold explicitly (with commentary) or add 2–3 integration tests that exercise `renderHTMLToPDF` against a 1-page fixture.
- **Ask:** restore the "`npm run test` hits the 75% threshold" invariant — either raise coverage (preferred, ~1 pd) or explicitly reduce the threshold to 60% with a note that branches through Chromium are out of scope.

---

## 8. Implementation Roadmap (summary)

Full detail in [`IMPLEMENTATION_ROADMAP.md`](./IMPLEMENTATION_ROADMAP.md) and [`.csv`](./IMPLEMENTATION_ROADMAP.csv).

### Sprint 1 — ~1 day — P0 + the cheap P1s

1. **TICKET-I4-001 · Remove PII from git + fix `.gitignore`** — `git rm --cached`, purge from history with `git filter-repo`, update `.gitignore` to match post-W5 paths, force-push with PII-cleared history. **0.5 pd.**
2. **TICKET-I4-002 · `npm audit fix --force`** for the `@astrojs/check` / `yaml` / `fast-uri` chain. Run tests. **0.25 pd.**
3. **TICKET-I4-003 · Fix `eslint.config.js` glob** — `src/**/*.ts` → `packages/**/*.ts`. Include `scripts/**/*.ts` with a narrower ruleset (no `@typescript-eslint/no-unused-vars` warn) so they're not invisible. **0.25 pd.**

Sprint 1 total: **1 person-day.**

### Sprint 2 — ~2 days — P1 quality gates + gallery hardening

4. **TICKET-I4-004 · Get vitest branch coverage to 75%** — 3 Chromium-mocked integration tests on `puppeteer-renderer.ts`, or explicit threshold lower-with-note. **1 pd.**
5. **TICKET-I4-005 · Add CSP + `X-Content-Type-Options` + `Referrer-Policy` via `vercel.json`** for the gallery. Test deploy, verify with curl. **0.5 pd.**
6. **TICKET-I4-006 · Mirror `--render-scale`-style validate-or-error for `PRAX_BROWSER_RESTART_EVERY`** — keeps the silent fallback for env vars but surfaces typos at CLI boundary. **0.25 pd.**

Sprint 2 total: **~2 person-days.**

### Sprint 3 — ~1 day — housekeeping

7. **TICKET-I4-007 · Update `audit/POST_SPRINT_STATUS.md`** with the iter-4 delta, move it to `audit/STATUS.md` as rolling status, so "post-sprint" isn't frozen to 2026-04-18. **0.25 pd.**
8. **TICKET-I4-008 · Extract gallery-HTML from preview-server.ts** into a dedicated template module if/when it grows beyond the current 1 screen; document the intentional duplication today. **Doc-only. 0.25 pd.**
9. **Revisit deferred iter-1 items** — decide which ones graduate to Sprint 4. **0.5 pd decision-making.**

Total to reach **A- grade:** **~4 person-days** across 3 small sprints.

---

## 9. Future Enhancements (unchanged from iter-1 direction, updated)

Not for this audit to prescribe, but for the next CEO/eng review:

- **Editor tier** (Tier 3 from `docs/CUSTOMISATION.md`) — in-browser fill + live theme preview + export PDF. Deferred on demand-gate from Tier 2 (378 pre-rendered themed PDFs).
- **Cross-pack theming engine** extracted — the pattern works; candidate for moving into `core` once the 26 pending packs migrate off Google Fonts CDN.
- **Automated a11y gate** — run axe-core in CI against the Astro static output + sampled pack PDFs (text contrast). Closes iter-1 FIND-0018.
- **Visual regression baselines refreshed post-v1.0.0** — the suite exists at `tests/visual/`; the baselines predate the Wave-1 + Wave-2 sticker pack and Simple Pages.

---

## 10. Enterprise readiness checklist

| Category | Status |
|---|---|
| **Security** | 🟡 needs FIND-I4-001 closed; CSP absent |
| • No hardcoded secrets | ⚠ `profile.local.json` = PII committed |
| • Dependency vulns | ⚠ 1 high, 5 moderate (all transitive, all fixable with `npm audit fix --force`) |
| • Signed releases | ✅ cosign keyless |
| • CI gate on PRs | ✅ `ci.yml` SHA-pinned |
| • Supply-chain monthly probe | ✅ `audit.yml` runs 1st of month |
| **Quality** | 🟡 drift since iter-1 |
| • tsc strict | ✅ `tsc --noEmit` clean |
| • Tests pass | ✅ 235/235 |
| • Coverage threshold met | ❌ 61.99% / 75% |
| • ESLint functional | ❌ lints 0 files (FIND-I4-003) |
| **Operations** | 🟢 |
| • Monorepo layout discoverable | ✅ |
| • npm publish working | ✅ v1.0.0 on npm |
| • Vercel deploy working | ✅ gallery live |
| • Docs up-to-date | 🟡 `POST_SPRINT_STATUS.md` stale |
| **Compliance / licensing** | 🟢 |
| • MIT for code | ✅ |
| • CC BY 4.0 for generated assets | ✅ |
| • Third-party license manifest | ✅ `THIRD_PARTY_LICENSES.md` includes libvips LGPL |

---

## 11. Phase validation

All 9 phases completed. See [`phase-validation.md`](./phase-validation.md) for the per-phase YES/NO checklist.

---

## 12. Appendix

- **A.** Full findings with evidence: [`findings.md`](./findings.md)
- **B.** Architecture detail + dependency graph: [`architecture.md`](./architecture.md)
- **C.** Implementation roadmap: [`IMPLEMENTATION_ROADMAP.md`](./IMPLEMENTATION_ROADMAP.md), [`.csv`](./IMPLEMENTATION_ROADMAP.csv)
- **D.** Test strategy: [`TEST_STRATEGY.md`](./TEST_STRATEGY.md)
- **E.** Stakeholder deck outline: [`SLIDE_OUTLINE.md`](./SLIDE_OUTLINE.md)
- **F.** Machine-readable findings: [`CODEBASE_AUDIT_REPORT.json`](./CODEBASE_AUDIT_REPORT.json)

---

*Report generated by CodeBaseGPT-Pro 9-phase protocol via Cline · Claude Sonnet 4.5*
*Iteration-4 audit completed 2026-05-11*
