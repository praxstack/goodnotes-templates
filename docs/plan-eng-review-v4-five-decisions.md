# Engineering Review v4 — v5.3 Revised Scope

**Date:** 2026-04-28
**Reviewer:** Cline via `/plan-eng-review` (inline)
**Reviewing:** `docs/plan-ceo-review-v4-five-decisions-locked.md`
**Branch:** main · HEAD after v4 CEO plan
**Posture:** HOLD SCOPE — make the locked v4 scope bulletproof

---

## Summary

v4 CEO plan locks 5 decisions via verbal walkthrough. This review evaluates the revised v5.3 scope for architectural soundness, error coverage, security, edge cases, and long-term trajectory.

**Verdict:** CLEAR with **5 warnings + 1 critical**. Critical = G3 (profile.json must be gitignored). Must-fix before C4.

---

## §1 Architecture

Clean dependency graph. `profile.json → generator → puppeteer → pdf-lib`. Stickers are a sibling subsystem. No cycles. No SPOFs beyond Puppeteer itself.

**Scaling:** 30 days ≈ 45s, 90 days ≈ 2 min, 365 days ≈ 8 min (with potential Puppeteer memory pressure — see G2).

**Rollback:** atomic per-commit. No migrations. Worst case `git revert` returns to b2db914.

## §2 Error & Rescue Map

All generator startup errors rescued with clear messages. Render errors mostly rescued; one GAP at offline Google Fonts → **G1**.

## §3 Security

Personal Mac, minimal surface. One critical: profile.json contains meds + therapist names, will leak to GitHub if committed → **G3**.

## §4 Edge Cases

Splice logic at month/quarter boundaries needs spec tests: mid-month starts, year boundary, leap year, single-day range, Sunday as --from → **G4**.

## §5 Code Quality

Clean. DRY via `pickPagesForDate(date)`. YAGNI applied (no plugin system). Cyclomatic complexity low.

## §6 Tests

Five test surfaces defined: profile parse, splice logic, integration, sticker render, visual baselines.

## §7 Performance

Acceptable for expected workload (monthly regen of 30 days). No optimization needed.

## §8 Observability

Logs every step. Exit codes. Sufficient for single-user CLI.

## §9 Deployment

No deploy — local CLI. `profile.example.json` seed pattern.

## §10 Long-term

5/5 reversibility. profile.json-as-data-only is a conscious simpler choice; upgrade path is clear.

## §11 Design

Monthly layout parallels Weekly (low risk). Quarterly needs sketch before authoring → **G5**.

---

## Findings

| # | Severity | Finding | Fix |
|---|---|---|---|
| **G1** | **WARNING** | Templates still hit `fonts.googleapis.com` at render time; offline = Times fallback | Rewrite `<link>` tags to reference `shared/fonts/fonts.css`. New commit **C6a** |
| **G2** | **WARNING** | Puppeteer memory pressure for 365-day renders | Browser restart every 100 pages inside generator (C7) |
| **G3** | **CRITICAL** | profile.json with meds + therapist names will commit PII to GitHub | Add `profile.json` to `.gitignore`, ship `profile.example.json` as committable template. **Must-fix in C4** |
| **G4** | **WARNING** | Splice edge cases (month/quarter/year boundaries, leap, partial ranges, single day) lack spec tests | Write 7 canonical test cases. New commit **C6b** — TDD spec before C7 |
| **G5** | **WARNING** | Quarterly narrative layout different from Weekly/Monthly dashboard; needs sketch first | Addressed by `/plan-design-review`. Blocks C3 until sketch approved |
| G6 | NICE-TO-HAVE | Default Puppeteer page timeout (15s) tight? | Non-issue — v5 pages render in 800ms; 18× headroom |

---

## Revised Commit Plan

| # | Commit | Status |
|---|---|---|
| C2 | Monthly blank page | **Unblocked — proceed** |
| C3 | Quarterly blank page | **Blocked on design review** (G5) |
| C4 | profile.example.json + Zod schema + gitignore rule | **Adjusted — profile.example.json not profile.json** (G3) |
| C5 | 12-sticker SVG library | Unblocked — proceed after C4 |
| C6 | render-stickers.ts pipeline | Unblocked — proceed after C5 |
| **C6a** | **Inline local fonts in templates (FIND-0014 second half)** (G1) | **New commit** |
| **C6b** | **Splice edge-case TDD tests** (G4) | **New commit** |
| C7 | generate-journal.ts CLI | Unblocked once C6a + C6b land |
| C8 | Docs (README × 4 surfaces) | Last commit |

Total commits for v5.3: **9** (up from 7 in v4 CEO plan). +30 min estimated CC+gstack effort for C6a + C6b.

---

## Risk Register (updated)

Copied from v2 + new entries:

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | profile.json schema drift | Low | Med | schema_version field + Zod fail-fast |
| R2 | Generator scope-creep toward SaaS | Low | High | Non-goal explicit in v4 plan |
| R7 | **PII leak via profile.json commit** | **High if ignored** | **High** | **G3 gitignore fix** |
| R8 | Offline font render looks wrong | Med | Low | G1 local font inline |
| R9 | Year-boundary splice wrong | Med | Low | G4 tests |
| R10 | 90-day render memory crash | Low | Med | G2 browser restart |

---

## Plan Status Footer

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review v4 | Verbal walkthrough | Lock 5 decisions | 1 | CLEAR | 0 unresolved |
| Eng Review v4 | This doc | Architecture+errors+edge cases | 1 | **CLEAR · 5W + 1C** | G1-G5 |
| Design Review v4 | `/plan-design-review` | Monthly + Quarterly layouts + sticker grammar | 0 | — | **required before C3** |

**CROSS-MODEL:** n/a this cycle.
**UNRESOLVED:** G5 blocks C3 (Quarterly) until design review completes. G3 blocks C4 (profile.json) until gitignore ships. All others integrate into the commit plan above.
**VERDICT:** Eng-CLEARED. Proceed with C2 (Monthly blank page — nothing blocks it). In parallel, run design review on Monthly + Quarterly layouts.

---

*End of Eng Review v4. Next: design review (Monthly + Quarterly layouts), then C2.*
