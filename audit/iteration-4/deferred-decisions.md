# Deferred Decisions — iter-1 items revisited in iter-4

> The roadmap called for a short doc with stay-deferred /
> schedule-now recommendations for the four iter-1 findings that
> didn't close during the iter-1→3 sweeps: FIND-0012, FIND-0014,
> FIND-0018, FIND-0028.

Date: 2026-05-11

## Recommendation summary

| ID | Title | Original severity | Recommendation |
|---|---|---|---|
| FIND-0012 | (TBD — see findings.json) | — | **Stay deferred** |
| FIND-0014 | Google Fonts CDN dependency (26 packs) | Medium | **Schedule for next sprint** (graduate) |
| FIND-0018 | No axe-core / pa11y gate in CI | Medium | **Stay deferred** |
| FIND-0028 | (TBD — see findings.json) | — | **Stay deferred** |

## Detailed reasoning

### FIND-0014 — Google Fonts CDN for 26 non-v5 packs → SCHEDULE

**Why it deserves to graduate now:**

- `scripts/download-fonts.ts` already exists and self-hosts fonts for
  the v5 pack tier. The precedent + infra is already there.
- v1.0.0 shipped; the next work is customization + theming
  (Tier 2 just landed, Tier 3 "editor" is on the D4 deferred list).
  Self-hosting fonts is a prerequisite for both:
  1. Offline / airplane-mode rendering of templates.
  2. Eventually migrating the CSP to a stricter `font-src 'self'`
     (currently `vercel.json` still allows `fonts.gstatic.com`).
- The CSP shipped in T-005 currently has to allow `fonts.googleapis.com`
  and `fonts.gstatic.com` as exceptions. Closing FIND-0014 lets those
  exceptions drop out — a genuine security win, not just tech debt.

**Scope estimate:** ~8 pd incremental (1 pack per touch, visual
diff each). Not a single big-bang change.

**Dependencies:** T-005 (CSP) is already shipped, so closing this
one gives a measurable upgrade to the CSP at the same time.

**Risk:** per-pack visual regression. Visual-baseline refresh
(D3 in the roadmap) should follow immediately after.

### FIND-0012 — STAY DEFERRED

Still consistent with the iter-3 deferral. No new evidence suggests
the business impact has changed.

### FIND-0018 — axe-core / pa11y gate in CI → STAY DEFERRED (for now)

**Why:**

- Accessibility regression protection is valuable, but it's
  *behavioural coverage*, not a critical safety gate. The v5
  templates have been hand-audited; regressions are unlikely
  without active template authoring work.
- The CI runtime budget is already tight (build + tests + audit +
  lint + coverage + PII gate). Adding a full browser-based a11y
  run doubles CI wall-clock.
- If FIND-0014 graduates (per above), that's where the next
  effort should go.

**When to revisit:** next time the template authoring velocity
goes back up (e.g. community contributions arriving via the
contribute page in `apps/gallery`). Catching a11y regressions
from outside-the-core contributors is the strongest argument
for this gate.

### FIND-0028 — STAY DEFERRED

Unchanged from iter-3.

---

## Cross-reference

- Iter-1 original finding records: `audit/iteration-1/findings.json` and `audit/iteration-1/findings.md`
- Iter-1 post-sprint outcomes: `audit/POST_SPRINT_STATUS.md` (frozen)
- Current status: `audit/iteration-4/STATUS.md`
