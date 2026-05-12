# TODOS · pretext-templates

> Deferred items from CEO Plan v5 and prior cycles. Each has a gate — the
> signal that lights up the work. Do not pull any of these forward without
> the gate being hit; premature pulls undermine the North Star's cadence.
>
> Roadmap is in `docs/plan-ceo-review-v5-10x-100x-expansion.md`.
> Vision is in `docs/NORTH-STAR.md`.
> This is the "later" file.

---

## Active TODOs (gated, ordered by likely unlock date)

### T-001 · Tier 3 static editor (pdf-lib overlay)

**What.** Build `/customise/<pack-id>` gallery route. Client-side pdf-lib
text overlay on top of a fetched themed PDF. No server. User picks theme,
fills declared fields, exports personalised PDF.

**Why.** Closes the "I want to tweak the year / my habit names / my start
date" gap. Tier 2 themes gave us customisation-of-surface; Tier 3 gives
customisation-of-content.

**Pros.** Real differentiator vs static PDF libraries. Fully offline-capable.
No infra cost. Uses `pdf-lib` already in tree.

**Cons.** PDF overlay math is fiddly; font metrics per theme will need per-
pack coordinate tables. Maintenance burden scales with pack count.

**Context.** SPEC.md §0 explicitly gates this on Tier 2 download metrics
arriving. CEO v5 Phase 2 ships those metrics. After Phase 2, we have
concrete answers to "which pack is worth the effort first?"

**Gate.** 100+ downloads/week on at least one pack (from Phase 2 D1 stats).

**Effort.** CC ~1.5h per pack; start with 1 pack, extend pattern.

**Priority.** P2 (high value, gated).

**Depends on.** CEO v5 Phase 2 shipping + 4+ weeks of data.

---

### T-002 · i18n on generators

**What.** Add locale support to the 5 flagship generators (weekly, monthly,
yearly, habit, prax-journal). es-ES / de-DE / ja-JP at minimum. Dates, day
names, month names, headers.

**Why.** Zero non-EN signal today, but Phase 2 will produce `locale_hint`
from Accept-Language on every download. If ≥5% of downloads are non-EN, i18n
becomes highest-signal next move.

**Pros.** Unlocks international reach; each locale is additive; generator
pattern already supports `--locale` flag.

**Cons.** Per-locale QA burden; typographic pairs may need per-locale font
tweaks (ja-JP needs a CJK fallback).

**Context.** The generator dispatch already threads `--locale` through.
Prax Journal already has an `en-US` implied. Real work is per-locale string
tables + typographic fallbacks.

**Gate.** ≥5% of Phase 2 downloads carry a non-EN `locale_hint`.

**Effort.** CC ~1h per locale × 3 locales = ~3h total.

**Priority.** P2 (gated).

**Depends on.** CEO v5 Phase 2 shipping + 4+ weeks of D1 signal.

---

### T-003 · Sticker library expansion (60 → 100+)

**What.** Curated sticker additions to Prax Journal library, chosen by
adherence signal from practice-of-week (E4).

**Why.** v1 sticker CEO plan captured the deep lesson: adherence > inventory.
No new stickers until practice-of-week has 4+ weeks of real usage data
showing which categories run thin vs which are unused.

**Pros.** Matches the evidence-based taxonomy already in place (CBT · DBT ·
BA · ACT · ERP · positive-psych · self-monitoring).

**Cons.** Easy to over-build; the lesson of v1 is "don't ship 60 mediocre
stickers when 40 focused ones would serve better."

**Context.** 60 stickers live today · sticker research docs still accurate.
Next wave waits on signal.

**Gate.** 4+ weeks of practice-of-week data showing which categories Prax
(or any user who enables it) actually reaches for vs ignores.

**Effort.** CC ~30m per sticker; aim for batches of 10-15 per gate-hit.

**Priority.** P3 (gated · quality over quantity).

**Depends on.** CEO v5 Phase 4 shipping + 4 weeks of usage data.

---

### T-004 · Community contribution funnel

**What.** `/contribute` gallery route becomes a real submission form + PR
template. `pretext audit` lint is the merge gate. Docs: "how to author a
pack in 60 minutes."

**Why.** Today the `/contribute` route is a placeholder. The audit CLI
(CEO v5 Phase 3) is the piece that makes external PRs safely mergeable
without a 2-hour human review each time.

**Pros.** Unlocks the compounding flywheel · taste becomes a community
asset not a Prax-only asset.

**Cons.** Community contribution dynamics are unpredictable; post-launch
triage cost is non-zero.

**Context.** Required for the North Star §3 "3 community-contributed packs
merged" outcome.

**Gate.** CEO v5 Phase 3 shipping + first external "how do I contribute?"
GH issue.

**Effort.** CC ~1h (form + template + docs).

**Priority.** P2 (gated · unlocks compounding).

**Depends on.** CEO v5 Phase 3.

---

### T-005 · Printed companion guide PDF

**What.** A printed assembly + usage guide for the Prax Journal digital
spread. Explains how to AirDrop, import, which page goes where, how
month-end AI review works.

**Why.** Captured in v2 CEO plan. Still valid: the journal has enough
nuance that a 4-8 page walkthrough would reduce setup friction for any
future user.

**Pros.** One-time authoring cost; lives under `packages/packs-prax-journal/
docs/GUIDE.html` and re-renders with the rest.

**Cons.** Out of date if the pack evolves significantly.

**Context.** Only meaningful if Prax Journal becomes multi-user (see T-004).

**Gate.** First non-Prax user of Prax Journal.

**Effort.** CC ~1h.

**Priority.** P3.

**Depends on.** T-004 unlocking external users.

---

### T-006 · Crisis card pocket PDF

**What.** Single-page, pocket-size PDF with the user's coping strategies
(IF-THEN plans, emergency contacts from profile.json, top 3 named patterns).
For moments of acute distress.

**Why.** v2 CEO plan identified this as a 10x delight item. Small effort,
real safety upside.

**Pros.** Uses existing profile.json schema; generates alongside full
journal run.

**Cons.** Needs careful copy; generic crisis card content is worse than no
card. Must be derived from the specific user's data or not shipped.

**Context.** Single new page template in `packages/packs-prax-journal/
versions/v5/crisis-card.html`.

**Gate.** Prax explicit opt-in · one usage-test cycle.

**Effort.** CC ~45m.

**Priority.** P3.

**Depends on.** User signal.

---

### T-007 · Therapist-share PHI-redacted export

**What.** A derived export from a filled journal — PII redacted, patterns
only, shareable with a therapist. Something like
`pretext export prax-journal --in filled.pdf --out anonymised.pdf
--keep=patterns,mood,sleep`.

**Why.** Captured in v2 CEO plan. Real clinical use case · reduces
friction on the therapist side of the feedback loop.

**Pros.** Strong privacy posture; aligns with the "no cloud" DNA.

**Cons.** Requires reading filled GoodNotes PDFs — either via OCR (fragile)
or via direct GoodNotes export (which doesn't exist). Probably waits on a
structured-data branch of Prax Journal (moving from handwriting → typed
fields for therapist-shareable data).

**Context.** Intersects with the larger "structured capture" question.

**Gate.** Prax + therapist explicit request + structured-capture prototype.

**Effort.** CC ~4-6h (non-trivial).

**Priority.** P3.

**Depends on.** Separate structured-capture prototype.

---

### T-008 · Safari iPad browser-PDF probe

**What.** Manual probe: does Puppeteer-rendered PDF output open cleanly in
Safari iPad (not just Chromium)? Decision blocker from DECISIONS.md.

**Why.** Without this probe, we ship blind; unknown bug surface on a major
user platform.

**Pros.** Either confirms "safe to ship" or surfaces a concrete, fixable
bug.

**Cons.** Requires physical iPad device. Operator task; not agent-doable.

**Context.** Blocker #D7 from DECISIONS.md still open.

**Gate.** Prax has iPad + 15min.

**Effort.** ~15m human time.

**Priority.** P2.

**Depends on.** Prax physical access.

---

### T-009 · Per-user sticker preferences (beyond localStorage)

**What.** Move practice-of-week preferences from localStorage v0 (CEO v5
Phase 4) to a per-user JSON profile (like `~/.pretext/sticker-prefs.json`)
that can sync across devices via the user's own cloud (iCloud Drive, etc).

**Why.** localStorage breaks when users switch browsers or clear cache.
Per-user JSON in their own cloud is "offline-first + sync-if-you-want-it."

**Pros.** Elegant; no backend required; matches DNA.

**Cons.** Breaks the simple "just visit a URL" model of the gallery.
Probably only matters if we see friction in Phase 4.

**Context.** Only worth building if Phase 4 shows real adoption.

**Gate.** Phase 4 localStorage v0 has ≥ 4 weeks usage + user explicitly
requests sync.

**Effort.** CC ~45m.

**Priority.** P3.

**Depends on.** CEO v5 Phase 4 data.

---

## Carried from prior plans (for audit trail, not active)

- ✅ **C1** · Weekly page (v5) — shipped
- ✅ **C2** · Monthly page (v5) — shipped
- ✅ **C3** · Quarterly page (v5) — shipped
- ✅ **C4** · profile.json + Zod schema — shipped
- ✅ **C5** · 12-sticker library — shipped (exceeded: 60 stickers)
- ✅ **C6** · render-stickers.ts pipeline — shipped
- ✅ **C7** · generate-journal.ts full CLI — shipped
- ✅ **C8** · README/docs in 4 places — shipped

---

## Tombstoned (considered · rejected · do not revive without fresh argument)

- ❌ SaaS hosted customisation — violates offline-first DNA
- ❌ Mobile app — GoodNotes is the mobile surface
- ❌ Handwriting recognition — GoodNotes' job, not ours
- ❌ Real-time collaboration — anti-pattern for single-user planning
- ❌ Calendar API integration — breaks offline model
- ❌ Pop-culture / licensed content — MIT/CC BY 4.0 purity matters
- ❌ Ship a template without a researched editorial grammar — dilutes taste
  (the defensible asset)

---

**Last updated:** 2026-05-12 (CEO Plan v5 Phase 0 · P0.6 companion doc)
