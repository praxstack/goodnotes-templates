# CEO Plan v4 — Five Decisions Locked (post-dialog)

**Date:** 2026-04-28
**Branch:** main · HEAD `b2db914`
**Mode:** Verbal walkthrough of v2's five expansions, one-by-one
**Reviewer:** Cline via `plan-ceo-review`
**Supersedes:** `docs/plan-ceo-review-v3-refined.md` on the five E1-E5 expansions
**Preserves:** v3's three locks (Option-a flow · fluid stickers · packs/ restructure)

v2 proposed E1-E5 as a menu with strong recommendations. v3 refined the flow but didn't explicitly verbalize each expansion. User requested a one-at-a-time walkthrough in plain language with "honest recommendation, then your call." This doc locks the outcome of that walkthrough.

---

## The five decisions (locked)

### Q1 · Monthly page → **C (hybrid)**

**Decision:** The generated PDF contains a **blank Monthly Review page** at the end of each calendar month. At month-end, Prax AirDrops the filled notebook to AI, which reads all 30 days and generates a **separate 1-page monthly-review-YYYY-MM.pdf** pre-filled with aggregates (cigs total, mood mean, chest-kg trend, Named Patterns tally).

**Why hybrid:** the blank page in the PDF is a **visual reminder** at month-end — "oh right, I need to do the monthly review now." Without it, depression-brain skips the ritual. The AI-filled version is the real reflection; the blank is the alarm clock.

**What lands in v5.3:**
- `packs/journals/prax-journal/versions/v5/monthly.html` — blank template, Warm Analog grammar, same squircle vocabulary as Weekly
- `docs/monthly-generation-playbook.md` — handoff doc for the AirDrop→AI→PDF workflow

**What does NOT land in v5.3:**
- Baked-in aggregation (no reading of filled GoodNotes pages at generate time — that's AI's job post-hoc)
- Any in-template data substitution for monthly (that's quarter-later E5 territory)

---

### Q2 · Quarterly page → **C (hybrid, same as Monthly)**

**Decision:** Same pattern as Monthly. Blank Quarterly page spliced in PDF at end of each calendar quarter (Mar 31, Jun 30, Sep 30, Dec 31). Also prompts Prax to AirDrop → AI generates `quarterly-review-YYYY-QN.pdf` with 90-day aggregates + narrative layout.

**Why:** Quarterly needs the same reminder-and-deep-review pattern. Different aperture (90 days vs 30), but same trust model.

**What lands in v5.3:**
- `packs/journals/prax-journal/versions/v5/quarterly.html` — blank template, 90-day-aperture grammar (narrative layout vs Weekly/Monthly's data-first layout)

**Design note:** Quarterly layout is **narrative** — "what this season taught me" — not a dashboard. 3 + 3 reflection prompts (what worked · what didn't · what Q-next should feel like). Single big handwritten sentence at the bottom. Different grammar from Weekly's dashboard.

---

### Q3 · Practice-of-the-week → **D (skip for v5.3)**

**Decision:** Not building the practice-of-the-week corner card on Today for v5.3. Revisit after Prax lives with the 12 stickers for one month.

**Why defer:**
1. Pattern-driven rotation requires data that doesn't exist in month 1 (no Named Pattern history).
2. We don't yet know if 12-sticker paralysis is a real problem — might self-resolve as Prax gravitates toward 2-3 natural favorites.
3. Adding a new block to Today = re-baseline every visual-regression. Not cheap.

**Decision trigger for revisiting:** if at month-1 retro Prax reports "I never opened Brain Dump to grab a sticker, too many choices," then we build it.

---

### Q4 · profile.json → **B (data-only reference, no templating)**

**Decision:** Ship `packs/journals/prax-journal/profile.json` with full schema (user, therapists, meds, baselines, named_patterns). Validate with Zod at generator startup. **Templates stay hardcoded** — no `{{...}}` placeholders, no substitution pipeline.

**Why:**
- AI-generated monthly/quarterly reviews NEED profile.json to compute meaningful aggregates ("cigs down 2.8 from baseline 10" requires knowing baseline=10)
- Templating adds ongoing test burden for a feature (edit-once when meds change) that runs ~4x/year
- Self-contained templates are an invariant we want to keep (FIND-0010)

**What lands in v5.3:**
- `packs/journals/prax-journal/profile.json` — seeded with current meds/therapists/patterns/baselines
- `src/types/profile.ts` — TypeScript interface + Zod schema with schema_version field
- Generator reads and validates profile.json on startup; fails loud if malformed
- AI review playbook consumes profile.json to compute comparisons

**What does NOT land in v5.3:**
- Template substitution pipeline (no `{{meds.0.name}}` in HTML files)
- Per-page personalization beyond what the generator injects into bookmarks

**Future upgrade path:** if meds-edit-cost becomes painful, we migrate to full E3 templating in a future version. Schema stays compatible (schema_version field).

---

### Q5 · Generator CLI → **A (full generator CLI, documented everywhere)**

**Decision:** Ship `src/generators/prax-journal.ts` as a proper CLI. Install a `journal` npm script. Flags: `--from`, `--to`, `--profile`, `--output`, `--preview`, `--locale`.

**Docs must be in 4 places:**
1. `README.md` (top-level) — quick-start how to generate a journal
2. `packs/journals/prax-journal/README.md` — pack-specific usage
3. `CLAUDE.md` — AI-assistant instructions for generate/regenerate commands
4. `docs/monthly-generation-playbook.md` — month-end workflow

**What lands in v5.3:**
- `src/generators/prax-journal.ts` — the CLI entry point
- `package.json` — `"journal": "tsx src/generators/prax-journal.ts"` script
- Splice logic: daily 4pp · weekly on Sundays · monthly at calendar-month-end · quarterly at quarter-end
- Bookmarked output (flat TOC)
- Profile validation on startup
- README updates in 4 files

**Example invocation:**
```bash
npm run journal -- --from 2026-05-01 --to 2026-05-31
# Produces: output/prax-journal-2026-05-01_2026-05-31.pdf
# Contents: 31 × 4 daily (124) + 4 weekly + 1 monthly = 129 pages, bookmarked
```

---

## Revised Phase 2 commit ladder (supersedes v3's 5-commit plan)

| # | Commit | Summary |
|---|--------|---------|
| C2 | `feat(prax-journal): Monthly blank page (v5)` | 1-page A4, Warm Analog grammar, ends at `overflow: clip` like Weekly |
| C3 | `feat(prax-journal): Quarterly blank page (v5)` | 1-page A4, narrative aperture grammar |
| C4 | `feat(prax-journal): profile.json + Zod schema (data-only)` | JSON file + Zod schema + validation helper |
| C5 | `feat(prax-journal): 12-sticker library (SVGs)` | 12 SVGs, all data-capturing, backlog README updated |
| C6 | `feat(prax-journal): render-stickers.ts pipeline` | SVG→PNG at 300/600/1200 via sharp |
| C7 | `feat(prax-journal): generate-journal.ts full CLI` | The flagship — runs end-to-end with all pages spliced |
| C8 | `docs(prax-journal): README + pack README + CLAUDE.md + playbook` | All 4 doc surfaces updated, monthly-generation-playbook authored |

Already shipped (pre-v4):
- C1: Weekly page (b2db914)

Total new commits this plan: 7. Estimated CC+gstack effort: ~3 hours.

---

## What v4 keeps from v3

1. **Option (a) flow** — user writes in GoodNotes, AI reads at month-end. (Reinforced by Q1/Q2 hybrid decisions.)
2. **Fluid stickers with data spec** — add/delete freely, data-capturing stickers need 3-line README.
3. **packs/ structure** — Phase 1 shipped, foundations in place.

## What v4 drops from v3

1. **No practice-of-the-week on Today** (Q3=D). Defer decision to post-month-1.

## What v4 adds vs v3

1. **Blank Monthly + Quarterly pages IN the PDF** (Q1+Q2 hybrid). v3 had these as AI-only artifacts; v4 adds the baked-in blank as a reminder UI.
2. **profile.json landed as data-only** (Q4=B), explicitly NOT templating. Simpler than v2's full E3.
3. **4-surface documentation requirement** for generator (Q5=A, documented everywhere).

---

## Explicit NOT in scope for v5.3

- Practice-of-the-week rotation logic (deferred per Q3=D)
- Template substitution / `{{...}}` placeholders (deferred per Q4=B)
- YAML frontmatter on daily templates (v5.4 territory, per v3)
- CSV extract for therapists (v5.4 territory, per v3)
- Crisis card (v6 territory)
- Multi-user generalization (never — Prax is the user)
- GoodNotes plugin / iPad-side code (impossible — GoodNotes has no plugin API)

---

## GSTACK REVIEW REPORT (required runs before implementation)

| Review | Trigger | Why | Status | Blocking? |
|--------|---------|-----|--------|-----------|
| CEO Review v4 | `/plan-ceo-review` verbal walkthrough | Lock 5 decisions in plain language | **THIS DOC** | No |
| Eng Review v4 | `/plan-eng-review` | Architecture check on revised v5.3 scope (Monthly + Quarterly blank + profile.json data-only + generator CLI) | **REQUIRED NEXT** | Yes |
| Design Review v4 | `/plan-design-review` | UI/UX check on Monthly + Quarterly blank layouts + sticker grammar | **REQUIRED NEXT** | Yes |
| Codex Review | `/codex review` | Independent 2nd opinion | Optional | No |

**UNRESOLVED:** 0 at the CEO level. All five expansions are locked.
**VERDICT:** v4 CEO review **CLEARED**. Now must pass Eng + Design reviews on the revised scope before C2 (Monthly blank page) lands.

---

## Next action

1. Commit this v4 plan.
2. Run `/plan-eng-review` on the revised scope. Specifically challenge:
   - Monthly + Quarterly blank pages: do the splice rules (end-of-calendar-month, end-of-quarter) cover edge cases (year boundaries, dates outside range)?
   - profile.json: what happens when it's missing, malformed, or schema-version-mismatched? What fails loudly vs silently?
   - Generator CLI: handling of midnight timezones, locale dates, partial date ranges, stale old PDFs in output/
3. Run `/plan-design-review` on Monthly + Quarterly blank layouts before authoring them.
4. Only after both reviews clear → begin C2.

---

*End of v4 plan. Five decisions locked. Next step: Eng review.*
