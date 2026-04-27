# CEO Plan — Weekly · Monthly · Sticker Library

**Date:** 2026-04-27
**Branch:** main
**Mode:** SELECTIVE EXPANSION (neutral posture, cherry-pick)
**Reviewer:** Cline via `plan-ceo-review`

## 0 · System state (pre-review audit)

**What already exists:**
- v5 daily spread: `adhd-v5-today/midday/reflect/brain-dump` (4 pages, A4, bookmarked)
- Warm Analog Editorial design contract in `prax-journal-design.md` (12 sections locked)
- `src/stickers/{banners,decorative,frames,functional,sticky-notes,washi}/` directory skeleton — **empty**
- 10 sticker names used as watermarks + hints on Brain Dump:
  - *Three Good Things · Grateful for · Win Today · Thought Flip · What Would I Tell a Friend · If–Then Plan · Craving Surf · Wins Jar · Mood Dot · + 1 open slot*
- Reflect's header comment lists 4 "intermittent" patterns deferred to a sticker bench that was later removed: *Thought Flip · Named Patterns + note · Shame + Baggage · Craving log*
- `prax-journal-design.md § 10` declares filename convention but v4/v5 weekly-reflect and monthly-reflect are not yet built

**What doesn't exist yet:**
- Any weekly-spread HTML (planned: `adhd-v4-weekly-reflect.html` per contract § 10)
- Any monthly-spread HTML
- Any actual sticker HTML under `src/stickers/<family>/<name>.html`

**Retrospective flag:** Reflect dropped a full "sticker bench" strip earlier because it fought the editorial aesthetic. Lesson: **stickers have to live as standalone peel-in objects**, not as a strip-within-a-daily-page. Any sticker plan that puts 10 stickers inline on a page will fail the same way.

---

## 0A · Premise challenge

Three things I'd push back on before implementing:

### P1 — "Weekly + Monthly" might be too big
Does Prax actually want weekly and monthly pages, or has he just seen Hobonichi/Clever Fox do it and felt he should? The v5 spread already has:
- **Today** → morning commit
- **Midday** → 2 PM check-in
- **Reflect** → evening process
- **Brain Dump** → free canvas

Those four cover 24 hours at two resolutions (minutes via Midday, hours via Today/Reflect). If the problem is **"did I make progress across weeks?"** or **"what patterns am I seeing over a month?"**, weekly/monthly IS the right answer. But if the real problem is "the daily is working, I want to zoom out sometimes", that might be solved by **one combined "Step Back" page** that auto-reformats depending on whether you fill it at week-end or month-end. One template, two cadences.

### P2 — "Number of stickers" might be the wrong frame
The question "how many stickers" implies stickers are a shipping target. They're not. Stickers are a **delivery mechanism for intermittent practices** (Thought Flip when a loop runs, Craving Surf when urges hit). So the real question is: **what practices is Prax already using frequently enough that they deserve to be stickers but not so frequently they belong on a daily page?**

That's a usage question, not a count question. Start with 3–6 stickers Prax actually needs this month. Ship more later if they prove useful.

### P3 — Weekly/monthly might be stickers-first, not spreads-first
Alternative framing: instead of building dedicated weekly/monthly **pages**, build weekly/monthly **spread-fillers** — a "Week in review" sticker that spans 2× brain-dump pages, or a "Month trends" sticker stretched across a single A4. That keeps the journal structure anchored on the 4-page daily + Brain Dump canvas, and escalation to weekly/monthly becomes a sticker peel-in, not a new page type.

---

## 0B · Dream state mapping (12-month ideal)

```
  CURRENT STATE                THIS PLAN                    12-MONTH IDEAL
  ─────────────                ─────────                    ──────────────
  4-page daily                 +?-page weekly               2-month PDF shipped:
  (Today, Midday,              +?-page monthly              ~60 daily spreads +
   Reflect, Brain Dump)        +N stickers                  weekly every 7 days +
                                                            monthly every ~30 days
  Empty stickers/              Non-empty                    + sticker library drop-in
                                                            anywhere via Brain Dump
                                                            + one unbroken design contract
                                                            + the journal that Prax
                                                              actually writes in for a year
```

The dream state is a printable/GoodNotes-importable **60-day PDF** with weekly review pages spliced in at natural cadence and a peel-in sticker library for intermittent practices. Everything past that (year 2, scale to other users) is a different conversation.

---

## 0C-bis · Implementation alternatives (MANDATORY)

Three approaches, ranked by my honest recommendation:

### APPROACH A · **Stickers first, zoom-out second** (MINIMAL VIABLE · ~90 LOC + N sticker files)
- Build 6 sticker HTML files matching the 6 already-named patterns in the v5 watermark (Three Good Things · Thought Flip · If-Then · Craving Surf · Wins Jar · What Would I Tell a Friend). Each is a 1-page A4 or half-page A4 that you print once, cut out, peel in anywhere.
- Ship **no** weekly/monthly for now. Add a single "Step Back" sticker that's a half-page reusable reflection block with "this week | this month | this season" radio at the top.
- Reuses: existing `src/stickers/` folder skeleton, design contract § 5 card archetype, `@media print` rules.
- Pros: honors P2 + P3 above. Ship what Prax will actually use. Low blast radius. 1 template can do weekly AND monthly.
- Cons: no "official" weekly/monthly landmark pages for scroll/bookmark; feels less complete if Prax wants that ceremony.
- Effort: human ~2 days / CC+gstack ~30 min.

### APPROACH B · **Full 3-tier ceremony** (IDEAL ARCHITECTURE · ~500 LOC)
- Build `adhd-v5-weekly.html` (1 page A4, end-of-week: 7-day recap grid + Wins/Grateful/Proud aggregation + "Named Patterns" block + Next week's Frog)
- Build `adhd-v5-monthly.html` (1 page A4, end-of-month: 30-day chest-kg trend + Mood/Anxiety/Energy avg + "Insights I don't want to forget" + Rx follow-up reminder)
- Build 12 stickers (the 10 watermarked + 2 slots for future)
- Reuses: all design contract tokens, block archetypes, squircle pattern, shadow-fix
- Pros: complete journal. Scroll from daily → weekly → monthly at natural cadences. The "bible" that Prax's 12-month ideal describes.
- Cons: big commit. Two pages I'm not 100% sure Prax needs (P1 risk). 12 sticker HTML files is 12× the ongoing design cost if the aesthetic contract shifts later.
- Effort: human ~6 days / CC+gstack ~2 h.

### APPROACH C · **Sticker library + one "Step Back" page** (MIDDLE PATH · ~250 LOC)
- Ship 6 essential stickers: Thought Flip, If-Then Plan, Craving Surf, Wins Jar, Three Good Things, What Would I Tell a Friend (the 6 CBT/BA practices Prax already has research on)
- Build **ONE** `adhd-v5-step-back.html` page that does both weekly and monthly via a radio at the top ("this week | this month | this quarter") — reuses ~60% of Reflect's layout with aggregation grids instead of daily scales
- Defer the other 4 watermarked stickers (Grateful for · Win Today · Mood Dot · + open) and anything below the 6
- Pros: addresses P1 (one page does two jobs), P2 (ships the practices Prax knows he needs), P3 (stickers are the intermittent-delivery path). Scope-locked: 6 + 1.
- Cons: "Step Back" as a concept is new — user hasn't seen it before. Mental model is different from Hobonichi/Clever Fox.
- Effort: human ~3 days / CC+gstack ~1 h.

---

## RECOMMENDATION — Approach **C** (middle path)

**Why:** Honors engineering preferences from the contract (completeness + DRY + right-sized diff). Ships the 6 stickers Prax has research for, not a wishlist count. One "Step Back" page replaces two unproven pages — lower risk, same coverage. Matches Prax's pattern of "less ornament, more utility" (demonstrated by the Sticker Bench removal earlier in this thread).

If Prax uses "Step Back" 3× in 3 weeks → split into separate weekly/monthly files in a follow-up commit. If he uses it 0×, we only spent 1 h instead of 2. Both outcomes are cheap.

---

## Decision matrix

| Question | Approach A | Approach B | Approach C |
|---|---|---|---|
| Completeness vs 12-mo ideal | 6/10 | 10/10 | 8/10 |
| Respects P1 (do we need weekly AND monthly?) | ✅ | ❌ assumes yes | ✅ |
| Respects P2 (number of stickers = usage-driven) | ✅ 6 | ⚠ 12 is arbitrary | ✅ 6 |
| Respects P3 (stickers as intermittent path) | ✅ | Mixed | ✅ |
| Matches Prax's observed pattern "less is more" | ✅ | ❌ | ✅ |
| Blast radius if aesthetic contract changes | Low | High (12 stickers) | Medium (6 stickers + 1 page) |
| CC+gstack compressed effort | 30 min | 2 h | 1 h |

---

## Scope proposed (if Approach C chosen)

**In scope for this sprint:**
1. `src/stickers/functional/thought-flip.html` — 1 page A4, CBT 3-column pattern from Reflect
2. `src/stickers/functional/if-then-plan.html` — 1 page A4, "If X then I'll Y" pre-commit grid
3. `src/stickers/functional/craving-surf.html` — 1 page A4, Marlatt urge-surfing worksheet
4. `src/stickers/functional/wins-jar.html` — 1 page A4, 30-slot cumulative wins list
5. `src/stickers/functional/three-good-things.html` — 1 page A4, Seligman 3-prompt
6. `src/stickers/functional/friend-letter.html` — 1 page A4, self-compassion rewrite worksheet
7. `src/templates/html/adhd-v5-step-back.html` — 1 page A4, week/month/quarter toggle
8. `scripts/generate-v5-stickers.ts` — render all 6 stickers into one `output/prax-stickers.pdf`
9. Extend visual-regression baselines to include the 7 new HTML files
10. Update `prax-journal-design.md § 10` with sticker convention + "step-back" entry

**Explicit NOT in scope:**
- Dedicated weekly page (folded into Step Back)
- Dedicated monthly page (folded into Step Back)
- Stickers beyond the 6 core (Grateful for · Win Today · Mood Dot · + open)
- Sticker printer assembly guide (TODOS.md)
- Year-at-a-glance view (out of 60-day ideal; maybe v6)

---

## Decisions locked

**D1 · Approach B — Full ceremony.** 12 stickers + separate weekly + separate monthly.
**D2 · Digital-first.** This is a GoodNotes journal. No printable physical stickers. Stickers = draggable digital cards with transparent backgrounds.
**D3 · SVG source + full SVG artifact + PNG exports at 3 sizes.** Per sticker: 1 `sticker.svg` (authoring source) + 1 standalone shippable `sticker.svg` (GoodNotes vector) + 3 PNGs (300 / 600 / 1200 px, 2x retina). **48 artifacts total for 12 stickers.**

---

## Final scope (locked)

### New templates (2 pages)
| File | Purpose |
|---|---|
| `src/templates/html/adhd-v5-weekly.html` | End-of-week. 7-day recap grid · Wins/Grateful/Proud aggregation · Named Patterns · Next week's Frog |
| `src/templates/html/adhd-v5-monthly.html` | End-of-month. 30-day Chest-kg + Mood/Anxiety/Energy trend bars · Insights I don't want to forget · Rx follow-up reminder |

### New stickers (12 · all digital, all transparent-bg SVG + PNG)
| # | Sticker | Family | Source |
|---|---|---|---|
| 1 | Thought Flip | `functional/` | CBT 3-col pattern from Reflect |
| 2 | If–Then Plan | `functional/` | Gollwitzer implementation intentions |
| 3 | Craving Surf | `functional/` | Marlatt urge-surfing |
| 4 | Wins Jar | `functional/` | 30-slot cumulative wins |
| 5 | Three Good Things | `functional/` | Seligman positive-psych |
| 6 | What Would I Tell a Friend | `functional/` | Neff self-compassion rewrite |
| 7 | Grateful for | `functional/` | Daily gratitude triple |
| 8 | Win Today | `functional/` | Single-focus badge + 1 line |
| 9 | Mood Dot | `functional/` | 1-10 mood scale with context blank |
| 10 | Named Patterns | `functional/` | Prax-specific + free slot ("doomscroll · prereq trap · …") |
| 11 | Shame + Baggage | `functional/` | Shreya: just notice, don't force |
| 12 | PHQ-2 Lite | `functional/` | 2-question depression screen (weekly check-in) |

### New scripts
| File | Purpose |
|---|---|
| `scripts/render-stickers.ts` | Reads every `src/stickers/functional/*.svg`, exports PNG at 300/600/1200 px via `sharp`. Copies source SVG to `output/stickers/<name>/<name>.svg`. Writes `output/stickers/index.html` for browser preview. |
| `scripts/generate-v5-full-spread.ts` | Renders Today/Midday/Reflect/Weekly/BrainDump/Monthly into one bookmarked PDF for iPad review. |

### Updated docs + tests
- `prax-journal-design.md § 10` — add weekly, monthly, sticker rows; add `§ 13 Sticker format` (transparent bg · 3 PNG sizes · shareable SVG · hand-drawn character consistent with frog icon).
- `tests/visual/v5-snapshots.test.ts` — add weekly + monthly HTML to the 8-spec suite → 10 baselines.

### Explicit NOT in scope
- Printable physical sticker sheets (obsolete per D2)
- Year-at-a-glance page (v6)
- Sticker drag-drop animation in GoodNotes (out of our control)
- Backward-compat with non-GoodNotes apps

---

## Sequenced commit plan

**Commit 1** · `feat(journal): weekly + monthly spread pages (v5)` — the two new HTML files, CSS, visual-regression baselines.
**Commit 2** · `feat(stickers): 12-sticker library SVG sources` — all 12 authored SVGs under `src/stickers/functional/`.
**Commit 3** · `feat(stickers): render-stickers.ts pipeline + PNG exports` — script + generated PNG fixtures in output/ (gitignored output, script committed).
**Commit 4** · `feat(journal): full-spread PDF generator with weekly/monthly splice` — replaces 4-page/5-page verifiers.
**Commit 5** · `docs(journal): update design contract § 10 + new § 13 sticker format` — contract updated to match shipped reality.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | **CLEAR** | B + digital-first + SVG source + PNG 3 sizes. 3/3 decisions locked. |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | **run next** |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | run after eng |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | N/A | personal journal, no dev UX |

**VERDICT:** CEO review **CLEARED** — ready to implement. Eng review recommended before shipping.

**UNRESOLVED:** 0.
