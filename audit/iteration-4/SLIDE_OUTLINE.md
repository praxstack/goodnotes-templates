# Slide Deck Outline · Iteration-4 Audit Read-Out

> Audience: maintainer + any future "CEO-mode" retro.
> 10 slides, ~15-min read-out. Notes are the talking-point for each slide.
> All numbers are traceable to `CODEBASE_AUDIT_REPORT.md`.

---

## Slide 1 · Executive summary

**Project health: 🟡 → 🟢 (one week away from green)**

- Iteration-4 audit of `goodnotes-templates` · HEAD `2529d90`
- 23/27 findings from iter-1 **closed**
- **1 critical** introduced since iter-1 (PII committed to git)
- **4 mediums**, **2 lows**, **1 info** also new
- **~4 person-days** to reach health grade A-

Notes: Iter-1 (2026-04-18) found 27 issues in a 9-day-old tool. Iter-4
(2026-05-11) finds 8 issues in a mature, npm-published, gallery-live
monorepo. The drift is predictable — monorepo migrations break
path-dependent guardrails — and all of it is cheap to close.

---

## Slide 2 · What changed since iter-1

| Milestone | Status |
|---|---|
| W5 monorepo migration (`dcf13a7`) | ✅ landed |
| npm publish `@praxlannister/pretext-core@1.0.0` | ✅ live |
| npm publish `@praxlannister/pretext-cli@1.0.0` | ✅ live |
| Gallery shipped on Vercel | ✅ live at `pretext-templates.vercel.app` |
| 14 themes × 27 packs = 378 themed PDFs | ✅ (HEAD commit) |
| 60-sticker skeuomorphic pack | ✅ (Wave 1 + 2) |
| The Praxis Ledger monthly release pipeline | ✅ (bundle-release.ts) |
| Tests: 25 → 235 | ✅ |
| Health grade: C+ → **B** | ✅ |

Notes: The project shipped real v1.0.0 between iter-1 and iter-4. That's
the headline. Iter-4 is about the rough edges that came with v1.0.0, not
about whether the thing works. It does.

---

## Slide 3 · The one critical

**FIND-I4-001 · `profile.local.json` with real PII is tracked in git.**

- File: `packages/packs-prax-journal/profile.local.json`
- Contains: maintainer's name, psychiatrist's name + MCI registration №, 6+ medications with dosages
- Root cause: W5 migration moved files from `packs/journals/prax-journal/` to `packages/packs-prax-journal/`; `.gitignore` still blocks the old path only
- Public repo: anyone who clones it today has this
- **P0 · ~0.5 person-days · TICKET-I4-001**

Notes: This isn't a bug in the code — the Zod schema works, the renderer
works, the tests around PII substitution pass. This is a policy violation
caused by a stale `.gitignore`. Two-phase fix: stop the bleeding (git rm),
then purge history (git-filter-repo + force-push). Total effort 0.5
person-days.

---

## Slide 4 · The four mediums (all tooling drift)

| Finding | What drifted | Fix |
|---|---|---|
| FIND-I4-002 | `npm audit`: 6 vulns in `@astrojs/check` chain | `npm audit fix --force` · 0.25 pd |
| FIND-I4-003 | ESLint glob still points to pre-W5 `src/**` path | Update to `packages/**` · 0.25 pd |
| FIND-I4-004 | vitest branch-coverage threshold 75 · actual 62 | Add 5 Chromium tests OR lower threshold · 1 pd |
| FIND-I4-005 | Public gallery ships without CSP / security headers | Add `vercel.json` · 0.5 pd |

Notes: Three of four share the same root cause — W5 migration didn't
sweep for path-dependent config files. The fourth (gallery CSP) is just
"the gallery didn't exist at iter-1, so we never audited its headers".
Post-migration checklist would have caught the first three in 5 minutes.

---

## Slide 5 · Risk matrix

```
                       High Impact               Low Impact
                    ┌──────────────────────┬──────────────────────┐
  Quick fix (XS)    │ FIND-I4-001  (P0)    │ FIND-I4-002  (P1)   │
                    │ (policy violation)    │ FIND-I4-003  (P1)   │
                    │                       │ FIND-I4-007  (P3)   │
                    │                       │ FIND-I4-008  (P4)   │
                    ├──────────────────────┼──────────────────────┤
  Longer fix (S-M)  │ FIND-I4-004  (P1)    │ FIND-I4-005  (P2)   │
                    │ (coverage gate)       │ (gallery CSP)       │
                    │                       │ FIND-I4-006  (P3)   │
                    └──────────────────────┴──────────────────────┘
```

Notes: The only High-Impact item is the PII finding, which is also a
quick fix. The coverage-gate item is in the long-but-important quadrant.
Everything else is either defense-in-depth (CSP) or polish.

---

## Slide 6 · Security posture

Before iter-4 sprint:

- 🔴 PII committed to git (FIND-I4-001)
- 🟠 6 dependency CVEs in dev-deps (FIND-I4-002)
- 🟡 Gallery has no CSP (FIND-I4-005)

After iter-4 sprint (proposed):

- 🟢 PII removed from history, CI gate prevents recurrence
- 🟢 Zero npm audit vulns
- 🟢 4 security headers on gallery

Signed releases (cosign), preview-server symlink-safe, Chromium
sandbox-on-default, request allow-list — all iter-1 wins **still hold**.
Iter-4 adds the hardening pieces that shipped alongside the v1.0.0 surface.

Notes: Nothing is actively exploitable today (PII excepted — which is
a policy issue, not a code-execution vulnerability). The iter-4 security
work is about containment and hygiene, not putting out fires.

---

## Slide 7 · Quality metrics

|  | iter-1 | today | after iter-4 sprint |
|---|---:|---:|---:|
| Tests passing | 25 | **235** | ~240 (+5 puppeteer-renderer tests) |
| tsc --noEmit | 2 errors | ✅ clean | ✅ clean |
| npm audit | 6 vulns | 6 vulns (different set) | **0** |
| ESLint actually lints | ✅ | ❌ | ✅ |
| Branch coverage | n/a | 62% · misses 75% gate | 72–77% · passes |
| CI gate on PRs | absent | present but drifting | enforced |
| Gallery security headers | n/a | 0 | 4 |

Notes: The delta from iter-1 to today is massive (25 → 235 tests, monorepo,
npm live, gallery live). The delta from today to Sprint 2 done is small
and all about restoring what's already supposed to work.

---

## Slide 8 · Roadmap

```
Sprint 1 (Day 1)   · 1 pd   · P0 + cheap P1
  ████ T-001 PII  ██ T-002 npm audit  ██ T-003 ESLint

Sprint 2 (Day 2-3) · 2 pd   · quality gates + gallery hardening
  ████ T-004 coverage tests       ██ T-005 CSP headers
  ▌ T-006 env-var validation

Sprint 3 (Day 4)   · 1 pd   · housekeeping
  ▌ T-007 status refresh  ▌ T-008 comment  ▌ deferred review
```

**Total: ~4 person-days.** One maintainer, no parallelism needed.

Notes: The sprint is tiny because the project is in good shape. If any of
these findings had been on the critical path, we'd be talking person-weeks.
As it stands, one solid focused day closes the P0 and two of the three P1s.

---

## Slide 9 · Resource & budget

- **People:** 1 maintainer (no coordination cost; optional second pair of eyes on the force-push for TICKET-I4-001)
- **Infra:** $0 new services
- **Tooling:** $0 — all tools already installed
- **Labor:** ~4 person-days ≈ 0.5–1 work week

**Decision point:** is the maintainer willing to force-push history to
purge the PII? If yes, run TICKET-I4-001 Phase B. If no, Phase A alone
(remove from HEAD, block future commits) is the minimum viable fix — but
the PII stays in git history forever.

Notes: Phase B is the right answer. Clones after the force-push won't
carry the PII. Existing clones will be stale and need re-cloning, which
is a one-time inconvenience for a small project.

---

## Slide 10 · What "done" looks like · Next steps · Q&A

**Done (end of Sprint 2):**

- 0 critical / 0 high findings open
- `npm audit` = 0
- `npm test -- --coverage` = exit 0
- `npm run lint` actually lints shipping code
- Gallery has CSP
- Health grade: **A-**

**Next after iter-4:**

- Schedule iter-5 audit for ~2026-08 or after the next major ship
- Decide which of the 4 deferred iter-1 items graduate (FIND-0014 Google Fonts migration is the likely candidate)
- Consider adding an integration test for the CLI→PDF contract (~1 pd, D5)

**Q&A / open discussion.**

Notes: iter-5 doesn't need to be expensive. The monthly audit probe
(`audit.yml`) already runs the full tool surface. Iter-5 can be a
focused pass: "check the deferred items, re-score the rubric, call it
done in a day."

---

*Slide outline generated by CodeBaseGPT-Pro 9-phase protocol · 2026-05-11*
