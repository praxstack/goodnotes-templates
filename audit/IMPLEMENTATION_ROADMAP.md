# Implementation Roadmap — goodnotes-templates

**Generated:** 2026-04-18 (CODEX-AUDIT v1.1)
**Total tickets:** 27 (21 iter-1 + 6 iter-2; FIND-0023 reclassified to Informational per iter-3)
**Not a monorepo** — all tickets in package `<root>`.

## Prioritization

| Priority | Finding count | Rationale |
|---:|---:|---|
| **P0** | 3 | Blockers — Critical CVSS, broken build, or gate-missing. Should land in Sprint 1. |
| **P1** | 7 | High-value hygiene; pair with P0 on the same branch where dependencies allow. |
| **P2** | 12 | Normal polish; batch across Sprints 2–3. |
| **P3** | 4 | Back-burner. Pick up opportunistically. |

## Sprint plan (t-shirt budget, not days)

### Sprint 1 — Unblock the build & close critical vulns (budget: XS+S+S = ~2 days equivalent)

| # | Ticket | Effort | Why |
|---|---|---|---|
| 1 | **FIND-0011** — Fix tsc --noEmit | XS | Blocker: `npm run build` is currently broken. Must land before adding any CI gate. |
| 2 | **FIND-0022** — Symlink path-traversal fix | S | Confirmed exploit POC. Close before any broader distribution. |
| 3 | **FIND-0008** — Add PR-gating CI workflow | S | After #1, enforce it. |

### Sprint 2 — Supply chain + hygiene batch (budget: XS×4 + S×2 ≈ ~3 days)

| # | Ticket | Effort |
|---|---|---|
| 4 | **FIND-0001** — Bind 127.0.0.1 by default | XS |
| 5 | **FIND-0005** — `npm audit fix` (basic-ftp) | XS |
| 6 | **FIND-0009** — Pin Actions by SHA + dependabot | XS |
| 7 | **FIND-0019** — Fix repository.url + README URLs | XS |
| 8 | **FIND-0007** — Remove 8 unused prod deps | S |
| 9 | **FIND-0013** — Documentation drift fix (pair with #8) | S |

### Sprint 3 — Offline + a11y + code quality (budget: M×2 + S×2 ≈ ~5 days)

| # | Ticket | Effort |
|---|---|---|
| 10 | **FIND-0014** — Self-host Google Fonts (closes FIND-0004 too) | M |
| 11 | **FIND-0016** — Add T1-module tests | M |
| 12 | **FIND-0003** — Gate --no-sandbox to CI | S |
| 13 | **FIND-0006** — Bump vitest to 4.x | S |
| 14 | **FIND-0018** — Dark-mode audit + contrast | M |

### Sprint 4 — Polish + back-burner (budget: mostly XS)

| # | Ticket | Effort |
|---|---|---|
| 15 | **FIND-0002** — Complete esc() | XS |
| 16 | **FIND-0010** — Sign release artifacts | S |
| 17 | **FIND-0012** — Replace HTML regex parser with cheerio | M |
| 18 | **FIND-0017** — Signal failures in batchRenderHTML | S |
| 19 | **FIND-0020** — Generate THIRD_PARTY_LICENSES.md | XS |
| 20 | **FIND-0024** — Rect validation in addHyperlinks | XS |
| 21 | **FIND-0026** — Strict mode for addBookmarks clamp | XS |
| 22 | **FIND-0015** — Dedupe color-mode resolver | XS |
| 23 | **FIND-0021** — ETag on preview server | XS |
| 24 | **FIND-0025** — Fix getBrowser race (cache promise) | XS |
| 25 | **FIND-0027** — Escape SVG text (dormant) | XS |
| 26 | **FIND-0023** — NUL/backslash reject (info-only) | XS |
| 27 | **FIND-0004** — Puppeteer request allow-list | S (folds into #10) |

## Risk matrix (blast-radius × fix cost)

```
              cheap (XS/S)            │ expensive (M/L/XL)
              ─────────────────────── ┼ ───────────────────────
high blast  │ FIND-0011 tsc broken    │ FIND-0014 self-host fonts
   radius   │ FIND-0022 symlink POC   │ FIND-0018 dark-mode audit
            │ FIND-0008 CI gate       │ FIND-0016 T1 tests
            │ FIND-0001 bind 127.0.0.1│ FIND-0012 cheerio swap
            │ FIND-0005 audit fix     │
            │ FIND-0007 dead deps     │
            │ FIND-0013 doc drift     │
              ─────────────────────── ┼ ───────────────────────
low blast   │ FIND-0002 esc '        │ — (mostly empty)
  radius    │ FIND-0009 pin SHAs     │
            │ FIND-0010 sign release │
            │ …                      │
```

**Read:** all three Do-First candidates are in the cheap + high-blast quadrant. No high-blast item is expensive — no multi-sprint blockers. Good news.

## Machine-readable form

See `IMPLEMENTATION_ROADMAP.csv` (Jira/Linear-importable) — same 27 rows with explicit `acceptance_criteria`, `verification_method`, `rollback_plan`, `package` columns.
