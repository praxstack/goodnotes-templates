# gstack archive

Relevant planning/design/review artefacts migrated from
`~/.gstack/projects/goodnotes-templates/` on 2026-05-05.

These files were transient to the gstack tool's local state and are NOT
auto-regenerated. Copied here so the rebrand-sprint ground-truth trail
(CEO expansion plan, design mocks, review findings) lives alongside the
code it drove.

## Contents

| Path | What it is | Dated |
|---|---|---|
| `ceo-plans/2026-04-30-shadcn-for-goodnotes.md` | **ACTIVE** CEO plan — Registry + Gallery + Codespaces (the plan W1–W16 executed against) | 2026-04-30 |
| `ceo-plans/archive/2026-04-09-full-breadth-engine.md` | Superseded earlier CEO plan (pre-rebrand) | 2026-04-09 |
| `designs/pretext-gallery-homepage-20260430/wireframes.html` | v1 mockup | 2026-04-30 20:22 |
| `designs/pretext-gallery-homepage-20260430/wireframes-v2.html` | v2 mockup | 2026-04-30 20:34 |
| `designs/pretext-gallery-homepage-20260430/wireframes-v3.html` | **FINAL** mockup — 4 surfaces, 1831 lines, "the ledger is the site" | 2026-04-30 20:56 |
| `praxlannister-main-design-20260409-194856.md` | Original design doc (pre-rebrand, full-breadth engine) | 2026-04-09 |
| `praxlannister-main-design-20260430-163246.md` | **Active** design doc — shadcn-for-goodnotes reframe | 2026-04-30 |
| `praxlannister-main-design-review-20260430-2058.md` | Design review output | 2026-04-30 |
| `praxlannister-main-devex-review-20260430-2110.md` | Developer-experience review output | 2026-04-30 |
| `praxlannister-main-eng-review-20260430-1935.md` | **Active** engineering review (feeds into W1–W16) | 2026-04-30 |
| `praxlannister-main-eng-review-test-plan-20260430-1735.md` | Test strategy companion | 2026-04-30 |
| `praxlannister-main-test-plan-20260409-203137.md` | Original test plan (pre-rebrand) | 2026-04-09 |
| `main-reviews.jsonl` | Review-gate audit trail (one JSON line per review call) | — |
| `timeline.jsonl` | Session event log (gstack skill invocations) | — |

## How this was authored

These artefacts were produced by the gstack autoplan gauntlet:
`office-hours → plan-ceo-review → plan-eng-review → plan-design-review →
plan-devex-review → codex-plan-review`. The outputs landed in
`~/.gstack/projects/goodnotes-templates/` during the April 2026 autoplan
session that scoped the rebrand sprint. The commit log + `DECISIONS.md`
capture the *execution*; this archive captures the *intent*.

## Mock-vs-shipped gap reference

`designs/pretext-gallery-homepage-20260430/wireframes-v3.html` is the
final mock. It showed 4 surfaces. Comparing to the shipped
`apps/gallery/`:

| Mock surface | Shipped match |
|---|---|
| S1 · editorial home (VOL/NO masthead · 7-pack TOC · hero spread) | partial — home exists, no masthead/TOC/spread |
| S2 · `/packs/[id]` newspaper spread · "RUN IN BROWSER · 60s" · "FORK & REBRAND" · "COPY LIVE URL" · FORMAT/TYPESET/PALETTE colophon | partial — `/packs/[id]` exists, no in-browser render, no download button, no per-pack theme picker |
| S3 · theme swap side-by-side + toast | partial — home swatches only |
| S4 · codespaces landing / onboarding | shipped as `/contribute` (D-14) |

See `SPRINT-STATUS.md` §5c and `DECISIONS.md` rows 21–33 for the
executed sprint trail.

## Keep or purge?

Keep. Cheap (~356 KB). Preserves the "why did we ship what we shipped"
trail that `SPRINT-STATUS.md` alone can't answer — especially the S1/S2
mock-vs-shipped delta the user flagged in the latest conversation.
