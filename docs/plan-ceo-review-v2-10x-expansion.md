# CEO Plan v2 — Weekly · Monthly · Sticker Library — 10x SCOPE EXPANSION

**Date:** 2026-04-28
**Branch:** main · HEAD `17e5ac0`
**Mode:** **SCOPE EXPANSION (10x — cathedral posture)**
**Reviewer:** Cline via `plan-ceo-review`
**Supersedes:** `docs/plan-weekly-monthly-stickers.md` (v1, SELECTIVE EXPANSION)
**Eng review of v1:** `docs/plan-eng-review-weekly-monthly-stickers.md` (CLEAR · 0 critical · 2 warnings)

> **Mode note.** User directed "10x expansion". v1 was selective; v2 takes the gloves off. This document does not cut v1's locked decisions (D1 full ceremony · D2 digital-first · D3 SVG source + PNG triad). It asks what the journal becomes when we stop thinking in pages and stickers and start thinking in **practices**, **cadences**, **longitudinal memory**, and **felt aliveness**.

---

## 0 · System state (pre-review audit)

**Git history (last 15):**
```
17e5ac0 docs(eng): eng-review on Weekly+Monthly+Stickers plan — CLEAR with 2 warnings
441c8aa docs(plan): CEO plan for Weekly + Monthly + 12-sticker library
cd960a7 docs(journal): v5 design review + 5-page verifier script
c9defae feat(journal): design review §6 — signature moves on Midday · Reflect · Brain Dump
1c3b120 refactor(journal): class-ify remaining inline style= on Reflect + Midday
35cbd61 refactor(journal): bump primary writing lines to 7mm solid on v5
9f1af41 fix(a11y): close WCAG AA contrast gaps on v4 + v5 journal
ebba205 test(visual): Puppeteer baseline regression harness
883dcfe refactor(scripts): generalize open-journal-candidates + esc() XSS guard
33b5f97 feat(journal): v5 Prax Journal + design contract + reference page
```

**What exists at HEAD:**
- v5 daily spread (4 pages): Today · Midday · Reflect · Brain Dump — A4, bookmarked, shadow-fix'd
- Warm Analog Editorial design contract (`prax-journal-design.md`, 12 sections)
- Dr Pallavi Rx card (8 meds from 13-04-2026), Shreya Jar+Body matrix, chest-kg + 2-sec pause
- Self-contained templates (FIND-0010), `@media print { box-shadow: none }` on all 7
- Visual-regression harness: sharp pixel diff, 0.5% drift budget, 8 baselines
- Design-system reference page: fonts + color + squircle grammar preserved
- `src/stickers/{banners,decorative,frames,functional,sticky-notes,washi}/` — empty skeleton
- 10 sticker names watermarked on Brain Dump (ghost UI, no artifacts yet)
- Untracked: `scripts/generate-v5-4page.ts`

**What v1 locks:**
- 12 sticker SVGs → 48 artifacts (source SVG + shippable SVG + 300/600/1200 PNG)
- Separate `adhd-v5-weekly.html` + `adhd-v5-monthly.html`
- `scripts/render-stickers.ts` (viewBox validation per eng review W2)
- `scripts/generate-v5-full-spread.ts` (6-page bookmarked PDF)
- 5 commits (eng review W1 swap applied)

**Retrospective flags (v1 pre-audit, still valid):**
- Sticker-bench-as-strip was removed earlier in v5 Reflect because it fought editorial aesthetic. **Lesson holds:** stickers must live as standalone peel-in objects, not inline strips.
- Reflect header comment lists 4 deferred "intermittent" patterns (Thought Flip · Named Patterns · Shame + Baggage · Craving log) — now scheduled as stickers 1, 10, 11, 3 in v1.

**Gap vs v1:** v1 ships artifacts. v2 asks whether the artifacts alone make the journal feel **alive, adaptive, and longitudinal** — or whether they ship a beautiful static dataset.

---

## 0A · Premise challenge (second-order)

v1's P1/P2/P3 premise challenge was solid. v2 reopens the frame at a higher altitude:

### Q1 — Is the journal a book or a system?
v1 treats it as a book (pages + stickers as physical objects). v5 already proved the daily spread works as a **behavioral system** (morning commit → midday re-anchor → evening process). Weekly/monthly aren't extra pages — they're the **feedback loop** that lets the system learn. Without closing that loop, every day is a fresh start with no memory. That's a fundamentally different product than "Hobonichi + stickers."

**Implication:** weekly = "what did the 7 days teach me?", monthly = "what is the 30-day pattern my daily self can't see?", quarterly (v1 excluded) = "is this working?". These are the aperture steps Prax's ADHD brain cannot do alone — and they're why the 12-month ideal was ever worth building.

### Q2 — Are 12 stickers enough, or are they a sampler plate?
v1's 12 are well-chosen (CBT · BA · urge-surfing · self-compassion · PHQ-2). But they're a **menu** without a **curator**. The user opens Brain Dump, sees 12 sticker names watermarked, and has to decide which one applies right now. That's the classic ADHD friction: too many tabs, none feel right.

**Implication:** stickers need a **triage layer** — a 1-sticker "which sticker do I need?" (mood + trigger → sticker recommendation), or a **practice-of-the-week** surface on the daily Today page. Otherwise 12 stickers is 12 items of inventory, not a practice.

### Q3 — Is "digital-first" a constraint or a capability?
v1 locked D2 as digital-first, correctly. But v1 then treats stickers as static transparent PNGs. Digital-first unlocks things paper cannot: **tap-to-expand**, **data aggregation across entries**, **animated micro-interactions** ("drag cigs count to see trend"), **optional layered clip-art** (the jar that visually fills as wins accumulate). If we ship transparent PNGs we're shipping Hobonichi-in-GoodNotes. If we ship **interactive SVG** with GoodNotes-safe fallback, we're shipping something no paper journal can do.

### Q4 — Does the journal know Prax, or does Prax have to tell it every day?
Currently: Prax writes the same meds, same cigs counter, same therapists, same named patterns, every day. v1 doesn't change that. A 10x version has a **single `journal.profile.json`** (or YAML frontmatter on every day) that parameterizes every page so meds update once, cigs baseline recalculates once, Rx follow-up reminders fire automatically when 30 days elapse since last consult.

### Q5 — Does the journal survive without Cline?
Prax is building this with AI help. When the session ends, does the journal evolve or freeze? A 10x version ships a **self-serve content generator** — a TypeScript template function that takes a config + date range and emits the 60-day PDF. That means Prax can regenerate for May, June, July without re-opening this thread. The alternative is "the ADHD journal that only works as long as the AI pair is available" — fragile by design.

---

## 0B · Dream state mapping (12-month ideal, expanded)

```
  TODAY (17e5ac0)            V1 PLAN LANDED              V2 (10x) 12-MONTH IDEAL
  ───────────────            ──────────────              ────────────────────────
  4-page daily spread        + 2 spread pages            + self-knowing journal:
  empty stickers/            + 12 static stickers          - daily spread (4 pages)
  no memory loop             + 48 artifacts              + weekly recap loop
  fresh start every day      + 6-page bookmarked PDF       - monthly trend memory
  AI-dependent regen                                      + quarterly retrospective
                                                          + 12-sticker library with
                                                            practice-of-week curator
                                                          + single profile.json that
                                                            parameterizes every page
                                                          + self-serve generator:
                                                            npm run journal -- --from
                                                            2026-05-01 --to 2026-07-01
                                                          + longitudinal data layer:
                                                            every filled field extractable
                                                            to CSV for Shreya/Dr Pallavi
                                                          + printable assembly guide
                                                            (TODO v1 already captured)
                                                          + 60-day PDF every 2 months
                                                            with automatic meds/patterns
                                                            refresh from profile
                                                          + optional: "crisis card"
                                                            pocket-size single page for
                                                            panic/urge moments
                                                          + optional: share-safe export
                                                            for therapist review (PHI-
                                                            redacted, pattern-only)
```

**Framing the delta:** v1 closes the artifact gap. v2 closes the **memory gap, the curation gap, the parameterization gap, and the self-reliance gap** — the four gaps that determine whether Prax writes in this journal in month 4, month 7, month 12.

---

## 0C-bis · Implementation alternatives (v2 — mandatory)

### APPROACH X · **v1 shipped as-is** (baseline — what v1 already decided)
- 2 pages + 12 stickers + 48 artifacts + 6-page PDF + 5 commits
- Lake score: 7/10 (artifacts complete, system incomplete)
- CC+gstack effort: ~2 h (eng-reviewed, ready to ship)
- Verdict: **valid floor**. Nothing below this ships.

### APPROACH Y · **Cathedral** (10x vision, full 10-commit ladder)
v1 scope + the five 10x expansions listed in §0D (Loop · Curator · Profile · Generator · Longitudinal CSV). All opt-in individually.
- Lake score: 10/10 (artifacts + system + memory + curation + autonomy)
- Additional files (on top of v1): 1 profile schema + 1 quarterly template + 1 practice-of-week daily micro-surface + 1 extractor script + 1 generator CLI + 1 sticker-triage mini-sticker + TODOS.md scaffold
- Additional commits on top of v1's 5: +5 → **10 commits total, landable as 2 sub-releases (v5.2 = v1 / v5.3 = expansions)**
- CC+gstack effort: +~3 h on top of v1 = **~5 h total** (human-team ~12 days compressed)
- Verdict: **recommended cathedral**. Every expansion is user opt-in via §0D.

### APPROACH Z · **Post-artifact system-only** (skip v1, go straight to system)
Skip v1 entirely. Ship the profile + generator + longitudinal CSV **before** the 12 stickers, on the theory that the system matters more than the inventory.
- Lake score: 6/10 (powerful plumbing, no content)
- Verdict: **rejected**. Prax needs to *use* the journal. System-first without artifacts is a developer's instinct, not a user's. A profile with no pages to populate is a schema exercise.

**RECOMMENDATION: APPROACH Y — Cathedral.** v1 is the base contract (already eng-cleared). v2 adds the five 10x expansions as individually opt-in. Each expansion has a recommended enthusiasm level and a clear exit if Prax says "not yet."

---

## 0D · Scope Expansion — Five 10x proposals (all opt-in)

Each proposal below follows the expansive framing: **felt experience first · concrete shape · dual-scale effort · delta vs v1**. Read them like a menu. Accept any combination; reject any.

---

### E1 · **The Memory Loop** — Quarterly retrospective page
*(sixth-month, twelfth-month, season-of-life reflection)*

**Felt experience.** Prax opens the journal on 2026-06-30. The last page isn't another daily — it's a quarterly spread titled "Q2 2026 · what this season taught me". Top-left: every Named Pattern frequency count across the 90 days (doomscroll: 47 · prereq trap: 19 · catastrophize: 8). Top-right: Chest-kg 90-day trend as a dot series, annotated with "↓ after Shreya session 13-04". Middle: "Three things that worked" · "Three things I'll stop". Bottom: "What I want Q3 to feel like" — one sentence, big. The page knows what Prax wrote on every prior day and reflects it back.

**Concrete shape.** `adhd-v5-quarterly.html` (1 page A4). Static HTML renders the structure. A one-shot TypeScript script (`scripts/aggregate-quarter.ts`) reads the last 90 daily entries from `content/entries/*.yaml` (optional frontmatter, opt-in per day) and injects aggregations into the HTML via simple `<!-- @aggregate:named-patterns -->` comment placeholders. If no entries exist yet, the page renders blank fields for manual fill — backward-compatible. No new runtime dependency.

**Effort.** Human-team: ~2 days. CC+gstack: ~40 min.

**Delta vs v1.** v1 ends at monthly. Monthly × 3 ≠ quarterly — the quarterly aperture asks different questions ("what *season* of life are you in?") and its visual grammar trades the 30-day trend grid for a narrative layout. This is the "step back further" page that Prax's ADHD brain will never generate unprompted.

**Recommendation: STRONG YES.** Highest leverage per commit. The feature that makes this journal feel like it has *memory*. Single commit, 1 file, reuses existing aggregation pattern that monthly already needs.

---

### E2 · **The Curator** — Practice-of-the-week micro-surface on Today
*(triage layer so 12 stickers stops being 12 tabs)*

**Felt experience.** Top-right corner of Today page: a 14mm × 22mm corner card titled "this week · craving surf". Every Monday the practice rotates. No decisions, no menu, no clicking through 12 icons. The surface tells Prax which ONE sticker to prioritize this week based on last week's Named Patterns. If "craving" logged ≥ 3 times last week → Craving Surf. If "catastrophize" ≥ 3 → Thought Flip. Else default to the cycle (Three Good Things · If-Then · etc.). One sentence of copy beneath: "When the urge hits today — open Craving Surf, not Instagram."

**Concrete shape.** New block archetype `.practice-week` in Today's template (matches §5 card grammar — squircle, 3.5mm radius, 2px sage rail). Rotation logic lives in `scripts/generate-v5-full-spread.ts` — a single function `pickPracticeForWeek(weekStart, profile)` returns `{name, sticker, copy}`. No state, pure function of input week + recent-patterns array.

**Effort.** Human-team: ~1 day. CC+gstack: ~25 min.

**Delta vs v1.** v1 has 12 watermarks on Brain Dump (passive ghost UI). v2 adds one **active** surface on the page Prax opens every morning. Turns the sticker library from inventory into a practice rotation. Kills the "which sticker do I open?" decision cost.

**Recommendation: STRONG YES.** Cheapest behavioral unlock in the list. One block. No new file. Lives on Today.

---

### E3 · **The Profile** — Single `journal.profile.json` parameterizes every page
*(stop hand-editing meds, Rx date, therapist names on every template)*

**Felt experience.** `content/profile.json` holds:
```json
{
  "user": { "name": "Prax", "locale": "en-IN", "timezone": "Asia/Calcutta" },
  "therapists": [
    { "name": "Shreya", "role": "psychologist", "last_session": "2026-04-13" },
    { "name": "Dr Pallavi Joshi", "role": "psychiatrist", "last_consult": "2026-04-13", "next_due": "2026-05-13" }
  ],
  "meds": [
    { "name": "Prothiaden 25", "dose": "1-0-0", "since": "2026-04-13" },
    { "name": "Pexep CR 25", "dose": "1-0-0", "since": "2026-04-13" }
  ],
  "baselines": { "cigs_per_day_baseline": 10, "chest_kg_scale": [0, 5] },
  "named_patterns": ["doomscroll", "prereq trap", "catastrophize", "rejection scanner"]
}
```
Every template reads this at render time. Changing a med updates every future page. Missing the Rx follow-up date triggers a banner on Today page when the next-due date is within 7 days.

**Concrete shape.** Zod schema + JSON schema in `src/types/profile.ts`. Render pipeline reads profile once, passes as context object to every template. Backward-compat: if no profile, pages render with today's hardcoded strings (zero-breaking).

**Effort.** Human-team: ~3 days. CC+gstack: ~50 min.

**Delta vs v1.** v1 hardcodes meds + therapist names on every HTML file. Editing on 2026-05-13 after the next Dr Pallavi consult means editing 6+ files by hand. v2's profile is edit-once.

**Recommendation: STRONG YES.** Non-optional for longevity — without it, the journal rots every time meds change. But landable as a separate follow-up PR if user wants v1 to ship first.

---

### E4 · **The Generator** — `npm run journal -- --from 2026-05-01 --to 2026-07-01`
*(self-serve 60-day PDF with auto-spliced weekly/monthly/quarterly)*

**Felt experience.** Prax types one command. Forty seconds later, `output/prax-journal-2026-05-01_2026-07-01.pdf` exists: 62 daily spreads (4 pages each = 248 pages) + 9 weekly reviews spliced every Sunday + 2 monthly reviews + 1 quarterly review. Every page carries the profile meds. Every weekly auto-aggregates from the prior 7 daily entries (if filled) or renders blank structure (if not). Prax never re-opens Cline to regen next quarter.

**Concrete shape.** `scripts/generate-journal.ts` (CLI entry point). Uses existing `puppeteer-renderer` and `pdf-lib`. Flags: `--from YYYY-MM-DD --to YYYY-MM-DD --profile content/profile.json --output path.pdf`. Weekly splice: after every 7 daily pages, insert weekly. Every 4th weekly → monthly before it. Every 3rd monthly → quarterly. Bookmarks auto-generated flat (2026-05-01 · 2026-05-01 midday · … · Week 1 · …).

**Effort.** Human-team: ~2 days. CC+gstack: ~40 min. Replaces `scripts/generate-v5-full-spread.ts` from v1 — same effort, more scope.

**Delta vs v1.** v1's `generate-v5-full-spread.ts` renders **one** 6-page PDF for verification. v2's generator renders **N**-page PDFs for any date range, with correct cadence splices. The thing Prax actually needs to use the journal for 12 months.

**Recommendation: STRONG YES.** Every quarter Prax wants a new PDF to import into GoodNotes. Without this, he calls Cline every 8 weeks. Compression: 40 min of AI now vs forever of manual scripts later.

---

### E5 · **The Longitudinal Layer** — `scripts/extract-entries.ts` → CSV for therapists
*(data layer that turns journal entries into Shreya/Dr Pallavi-shareable insight)*

**Felt experience.** Before a therapy session, Prax types `npm run extract -- --from 2026-04-13 --to 2026-06-13 --fields mood,anxiety,energy,chest_kg,cigs,named_patterns`. Output: `output/extract-2026-04-13_2026-06-13.csv`. He opens it in Numbers, sees "cigs: mean 7.2 (down from baseline 10), trending -0.3/week. Chest-kg: 3.4 mean, 4.8 max (peaked 2026-05-02-07, rejection scanner flagged 6 times that week)." He walks into Shreya's office with **data**, not memory.

**Concrete shape.** Opt-in frontmatter on daily templates — each day becomes an editable YAML file (`content/entries/2026-04-28.yaml`) that the HTML template reads at render. Extraction reads the YAML directory, filters by date, emits CSV. PHI-safe: no free-form text exported, only numeric/enum fields by default (redaction flag available).

**Effort.** Human-team: ~4 days (biggest item). CC+gstack: ~1 h 15 min.

**Delta vs v1.** v1 is a PDF. v2's extraction layer makes the journal a **dataset**. The stuff Prax writes becomes the stuff Prax shows therapists — closes the loop that currently depends on Prax's memory (which, per his own note in CHECKPOINT.md, is unreliable in Q2 2026).

**Recommendation: YES, but defer to v5.4.** Biggest effort, least immediate felt impact. Land v5.2 (v1) + v5.3 (E1-E4) first, then E5 as a follow-up. But commit to the schema direction now so E5's YAML frontmatter is compatible with whatever daily-page structure E3/E4 create. If we build E3/E4 without thinking about E5, we'll retrofit awkwardly.

---

## 0E · Temporal interrogation (hour-by-hour, CC+gstack scale)

| Hour | Human-team task | CC+gstack compressed | Decisions to surface NOW |
|------|------------------|----------------------|--------------------------|
| 0-1 | v1 weekly.html + monthly.html | Build both (~20 min) | Weekly = end-of-week review OR rolling-7? Locked: **end-of-week, Sunday cadence**. Monthly = calendar month OR last-30-days? Locked: **calendar month**. |
| 1-2 | v1 12 sticker SVGs | Author all 12 (~25 min) | Stroke width? Locked: **1.5-1.8pt** (matches frog hand). Canvas? Locked: **3 size classes** (compact 400×600 · standard 600×600 · expanded 800×600). |
| 2-3 | v1 render + full-spread PDF | Build pipeline (~20 min) | E4 upgrade: make this the **generator** from day one. One extra hour now, saves 10 hours of retrofit. |
| 3-4 | E1 quarterly.html + aggregate-quarter.ts | Build (~30 min) | Aggregation format? YAML frontmatter on dailies (E5-compat) OR simple markdown counters? Locked (per §0D E5 note): **YAML**. |
| 4-5 | E2 practice-week corner card + rotation logic | Build (~20 min) | Rotation rule? Random, cycle-of-12, or pattern-driven? Locked: **pattern-driven with cycle fallback**. |
| 5 | E3 profile schema + wire to all templates | Build (~50 min) | Zod or just TypeScript interface? Locked: **Zod** (runtime validation, error on malformed profile). |
| 5-6 | E4 generator CLI | Build (~40 min) | Weekly splice cadence? Locked: **every 7 daily pages, inserted after Sunday**. |

**Total CC+gstack compressed: ~3 h 45 min for v5.2 + v5.3. E5 deferred as v5.4 (~1 h 15 min later).**

---

## Final scope (v2 locked)

### Ladder: v5.2 → v5.3 → v5.4

**v5.2 — "Artifact Complete" (v1 as-is, 5 commits · ~2 h)**
Retains every decision from `docs/plan-weekly-monthly-stickers.md`. Eng-reviewed. No changes.

**v5.3 — "System Alive" (+5 commits · +~2 h)** — **THIS IS THE 10x ADD**
1. `feat(journal): quarterly retrospective page (v5)` — E1 · new `adhd-v5-quarterly.html`
2. `feat(journal): practice-of-the-week surface on Today` — E2 · block archetype + rotation function
3. `feat(journal): journal.profile.json — single source of truth` — E3 · Zod schema + pipeline plumb
4. `refactor(journal): generator CLI replaces fixed-spread script` — E4 · renames `generate-v5-full-spread.ts` → `generate-journal.ts`, adds `--from/--to/--profile` flags, wires splice cadence
5. `docs(journal): contract §14 profile format + §15 generator CLI` — design contract extension

**v5.4 — "Longitudinal" (+3 commits · +~1 h 15)** — DEFERRED to follow-up PR, but schema-compatible NOW
6. `feat(journal): YAML frontmatter on daily templates (opt-in)`
7. `feat(journal): extract-entries CLI → CSV`
8. `docs(journal): therapist export guide`

### Files added (v5.3 only; v5.2 covered by v1)
| File | Purpose |
|---|---|
| `src/templates/html/adhd-v5-quarterly.html` | E1 · 90-day narrative retrospective |
| `content/profile.json` | E3 · single source of truth |
| `src/types/profile.ts` | E3 · Zod schema + TS interface |
| `scripts/aggregate-quarter.ts` | E1 · one-shot aggregator |
| `scripts/generate-journal.ts` | E4 · CLI generator (replaces `generate-v5-full-spread.ts`) |
| Today template edit | E2 · practice-week corner block |

### Explicit NOT in scope (v2)
- **Paper printing** (v1 D2 digital-first, preserved)
- **Multi-user generalization** (Prax is the user; ship for n=1 with clean-enough contracts to generalize later)
- **Sticker drag-drop animation in GoodNotes** (out of our control)
- **Mobile/web app** (the journal is a PDF + SVG set; the only app is GoodNotes)
- **E5's full extraction layer** (deferred to v5.4 but schema-locked now)
- **Auth, encryption at rest, cloud sync** (local files; user's machine owns the data)
- **Crisis card** (one-page panic-moment mini-sticker) — mentioned in dream state, deferred to v6 unless Prax flags an urgent need

---

## Sequenced commit plan (10 commits · two-stage release)

### v5.2 (v1 scope · already eng-cleared)
1. `feat(journal): weekly + monthly spread pages (v5)`
2. `docs(journal): contract §10 + §13 sticker format`
3. `feat(stickers): 12-sticker SVG sources`
4. `feat(stickers): render-stickers.ts pipeline + viewBox validation + PNG exports + clean-stale`
5. *(was "full-spread PDF generator" — replaced by commit 9 below, this commit slot reused for)* `test(visual): extend baselines to weekly + monthly`

### v5.3 (10x additions)
6. `feat(journal): quarterly retrospective page` — E1
7. `feat(journal): practice-of-the-week surface on Today` — E2
8. `feat(journal): journal.profile.json + Zod schema` — E3
9. `feat(journal): generator CLI (replaces full-spread script)` — E4, absorbs v5.2 commit 5's PDF role
10. `docs(journal): contract §14 profile + §15 generator`

### v5.4 (follow-up PR, after v5.3 ships)
11. `feat(journal): YAML frontmatter on dailies` — E5a
12. `feat(journal): extract-entries CLI → CSV` — E5b
13. `docs(journal): therapist-share workflow` — E5c

---

## Decision matrix (v1 vs v2)

| Dimension | v1 (Selective) | v2 (10x Expansion) |
|---|---|---|
| Artifact completeness | 7/10 | 10/10 |
| System aliveness (feedback loops) | 3/10 | 9/10 |
| Longevity w/o AI pair | 4/10 | 9/10 (v5.3) · 10/10 (v5.4) |
| Longitudinal insight (therapist-shareable data) | 1/10 | 3/10 (v5.3) · 9/10 (v5.4) |
| 12-month ideal coverage | 60% | 95% (v5.3 + v5.4) |
| CC+gstack effort | 2 h | 5 h (v5.2 + v5.3) · 6h 15m (full ladder) |
| Commits | 5 | 10 (v5.3) · 13 (v5.4) |
| Blast radius | Low | Medium (profile wiring touches 6 templates) |
| Reversibility | 5/5 | 4/5 (profile migration) · 3/5 (if E5 YAML adopted) |
| Matches Prax observed pattern "less ornament, more utility" | ✅ | ✅✅ (every addition is utility, no ornament) |

---

## User decision surface (cherry-pick per expansion)

**Take v1 as-is (v5.2) or expand to v5.3 / v5.4?**

| # | Expansion | Effort (CC+gstack) | Recommendation | Opt-in? |
|---|-----------|---------------------|----------------|---------|
| E1 | Quarterly retrospective | +30 min | **STRONG YES** | [ ] |
| E2 | Practice-of-the-week | +20 min | **STRONG YES** | [ ] |
| E3 | Profile schema | +50 min | **STRONG YES** | [ ] |
| E4 | Generator CLI | +40 min (replaces v1's) | **STRONG YES** | [ ] |
| E5 | YAML + extract CSV | +1 h 15 min (v5.4) | **YES, defer** | [ ] |

**Recommended combo:** v5.2 + all of v5.3 (E1-E4) = 10 commits, ~5 h CC+gstack, lands the cathedral. E5 as v5.4 follow-up.

**Minimal combo:** v5.2 only (ship v1 unchanged, no 10x). Valid — you're not obligated to expand just because this doc proposes it.

**Maximum combo:** v5.2 + v5.3 + v5.4 = 13 commits, ~6 h 15 min, every expansion shipped.

---

## Risk register (v2 additions only)

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| R1 | Profile Zod schema becomes load-bearing; changing it later breaks existing filled entries | Med | Med | Schema version field (`"schema_version": 1`); Zod parse with fallback to v0 for legacy |
| R2 | Generator CLI scope-creeps toward "multi-user journal SaaS" | Low | High | Explicit non-goal (§ Not in scope). Review at each commit. |
| R3 | YAML frontmatter on dailies (E5) adds friction if Prax forgets to fill it | High | Low | Opt-in. HTML renders fine without YAML. Extraction skips empty days. |
| R4 | Practice-of-week rotation algorithm feels "random" to Prax in week 2 | Med | Low | Expose rotation state in page footer: "Week 3 · cycle position 3/12 · pattern-driven: false" |
| R5 | Quarterly aggregator miscounts Named Patterns if variant spellings exist ("doomscroll" vs "doom scroll") | Med | Med | Normalize to lowercase + strip whitespace + singularize trailing 's'. Unit test. |
| R6 | Profile migration when Dr Pallavi updates meds: Prax edits profile, forgets some page still hardcodes old meds | Med | High | Lint: `scripts/check-hardcoded-meds.ts` greps templates for med names not in profile |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review (v2) | `/plan-ceo-review` 10x | Scope expansion | 2 | **CLEAR** | 5 expansions proposed (E1-E5). E1-E4 strong-recommend. E5 defer to v5.4. |
| CEO Review (v1) | `/plan-ceo-review` selective | Scope baseline | 1 | CLEAR | Landed at 441c8aa. B + digital-first + SVG+PNG triad. |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | Recommend before implementation starts. |
| Eng Review (v1) | `/plan-eng-review` | Architecture check | 1 | CLEAR | 0 critical · 2 warnings · 17e5ac0. Still applies to v5.2 scope. |
| Eng Review (v2) | `/plan-eng-review` | Architecture check on v5.3 additions | 0 | — | **required before v5.3 ships** (profile schema + generator CLI are architectural moves) |
| Design Review (v1) | `/plan-design-review` | UI/UX gaps | 0 | — | Required before implementation |
| Design Review (v2) | `/plan-design-review` | UI/UX on quarterly + practice-week block | 0 | — | Required before v5.3 ships |

**CODEX:** not run this cycle.
**CROSS-MODEL:** n/a.
**UNRESOLVED:** 5 (E1-E5 opt-in decisions — user selects combo).
**VERDICT:** v2 CEO review **CLEARED** in scope-expansion posture. Ready for user to pick combo. Recommended: **v5.2 + v5.3 (E1-E4), defer E5 to v5.4**. Eng review v2 + Design review v1+v2 must run before implementation.

---

## Next steps (CEO → Eng → Design → Ship)

1. **User picks combo** (minimal · recommended · maximum · custom).
2. If expansion accepted → run `/plan-eng-review` again on the v5.3 additions (profile schema is architectural, generator CLI replaces a non-trivial script).
3. Run `/plan-design-review` covering both v5.2 (weekly/monthly/stickers) and v5.3 (quarterly + practice-week).
4. Fresh session executes revised commit ladder.
5. Post-ship: `/qa` on the generated PDF against a 14-day test run; `/retro` at end of month 1 to evaluate whether practice-of-week + quarterly loop actually changed Prax's behavior (the real success metric).

---

**End of CEO Plan v2.** Cathedral drawn, opt-ins surfaced. Prax decides the combo.
