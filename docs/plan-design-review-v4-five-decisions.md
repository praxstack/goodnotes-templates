# Design Review v4 — v5.3 Layouts + Sticker Grammar

**Date:** 2026-04-28
**Reviewer:** Cline via `/plan-design-review` (inline)
**Reviewing:** Monthly blank page, Quarterly blank page, 12-sticker grammar
**Branch:** main · HEAD after Eng Review v4
**Posture:** evaluate visual grammar, UX flow, writing-zone ergonomics, brand consistency with shipped Weekly (b2db914)

Eng review v4 flagged G5: Quarterly layout needs sketch before authoring. This review delivers that sketch + sketches for Monthly + sticker grammar rubric.

---

## 1 · Monthly blank page layout (C2)

**Intent:** blank-page reminder in the PDF at end-of-each-calendar-month that (a) lets Prax do a brief handwritten reflection, (b) reminds him to AirDrop the notebook to AI for the data-filled version.

### Block map

```
B-01  Masthead                  § MONTHLY REVIEW · MAY  +  "this month"  +  date
B-02  Free-writing card (sage)  3 lines, "what this month felt like"
B-03  Remembered dashboard      2×2 grid: wins (amber) + patterns (clay)
                                          best day (amber) + hardest (clay)
B-04  Reminder card (lavender)  "AirDrop → AI → monthly-review-YYYY-MM.pdf"
                                list of what arrives: cigs/mood/chest-kg/patterns
B-05  Intention line (sage)     "what I want next month to feel like"
                                12mm solid line, big handwriting
Footer                          prax journal · v5 · monthly review
```

### Key grammar
- Masthead parallel to Weekly's "Sunday Review → this week": "Monthly Review · MAY → this month"
- 2 sage + 1 clay + 1 lavender + 1 sage ribbon at bottom for intention
- Writing-lines: 6mm for dashboard rows (widened from 5mm per design note), 8mm for free-writing, 12mm for intention
- Shadow-suppress on print, overflow: clip on .page

### Scoring

| Dimension | Score |
|---|---|
| Hierarchy | 8/10 |
| Contrast with Weekly | 7/10 (Weekly = dashboard, Monthly = reflection-first with mini-dash) |
| Writing-zone adequacy | 7/10 → **8/10** after 5→6mm widen |
| Reminder visibility | 9/10 |
| Aesthetic consistency | 9/10 |
| **Overall** | **8/10** |

**Proceed with C2. Fold in: 6mm rows, day-number affordances on best/hardest.**

---

## 2 · Quarterly blank page layout (C3) — G5 resolution

**Intent:** baked-in page at end-of-quarter (Mar 31, Jun 30, Sep 30, Dec 31). Narrative-first, NOT dashboard. Forces "what season were you in?" reflection.

### Block map

```
B-01  Masthead              § SEASON REVIEW · Q2 2026  +  "this season"  +  date range
B-02  Narrative card        3 lines · "in three sentences, what happened"
B-03  Three-column triad    worked (sage)  |  didn't (clay)  |  changed (lavender)
                            3 rows each, 6mm dotted lines
B-04  Intention (hero)      "what I want next season to feel like"
                            SINGLE 12mm solid line, biggest handwriting on page
B-05  Reminder (lavender)   "AirDrop → AI → quarterly-review-YYYY-QN.pdf"
                            list of 90-day aggregates
Footer                      prax journal · v5 · season review · Q2 2026
```

### Why narrative, not dashboard

Weekly = "pulse check" (7-day snapshot). Monthly = "landscape" (30-day overview). Quarterly = "who did I become?" (90-day narrative). The grammar shifts accordingly:

| Aperture | Format | Question |
|---|---|---|
| Weekly (b2db914) | Dashboard + intention | What was this week? |
| Monthly (C2) | Reflection + mini-dash + intention | Where am I? |
| Quarterly (C3) | Narrative + triad + intention | Who did I become? |

### Scoring

| Dimension | Score |
|---|---|
| Narrative vs dashboard differentiation | 9/10 |
| Emotional weight | 9/10 |
| Triad column width concern | 7/10 → verify at authoring |
| Intention prominence | 8/10 → **9/10** with 12mm intention line |
| **Overall** | **8.5/10** |

**Proceed with C3. Fold in: 12mm hero intention line, verify 3-column triad fits handwriting width at 100%.**

**Fallback if triad is cramped:** merge to 2 columns — "worked / didn't" + "changed" below, single column 7mm rows.

---

## 3 · Sticker grammar (C5) — 12-sticker rubric

**Intent:** 12 data-capturing stickers, Warm Analog mini-card style, same paper+grammar as v5 journal pages.

### Canonical grammar (every sticker must hit)

```
Canvas        400×600  · 600×600  · 800×600   (compact · standard · expanded)
Paper bg      #F9F5EC
Corner rx     24  · 28  · 32
Top rail      5px × full width, ONE accent color
Hero title    Fraunces 400-500, opsz 72-144, SOFT 60-100
Kicker        JetBrains Mono 600, 11px, spacing 0.18em, "§ NAME"
Subtitle      Fraunces italic, 12px, 0.8 opacity
Writing lines solid 1px (primary) or dotted 0.8px (secondary)
Footer        JetBrains Mono 400, 8-10px, "PRAX JOURNAL · STICKER"
a11y          <title> + <desc> + role="img"
```

### Per-sticker accent + size (final)

| # | Sticker | Accent | Size | Why |
|---|---------|--------|------|-----|
| 1 | Thought Flip | clay | expanded | CBT hard reframe |
| 2 | If-Then Plan | sage | standard | growth / intention |
| 3 | Craving Surf | lavender | standard | pass through |
| 4 | Wins Jar | amber | expanded | warmth accumulation |
| 5 | Three Good Things | amber | standard | positive psych |
| 6 | Friend Letter | sage | expanded | gentle self-compassion |
| 7 | Grateful for | amber | compact | quick gratitude |
| 8 | Win Today | sage | compact | single focus |
| 9 | Mood Dot | lavender | compact | neutral observation |
| 10 | Named Patterns | clay | standard | pattern recognition |
| 11 | Shame + Baggage | clay | standard | heavy / <REDACTED-PSYCH-FIRST> content |
| 12 | PHQ-2 Lite | lavender | compact | clinical tool |

### Scoring

| Dimension | Score |
|---|---|
| Grammar consistency | 9/10 |
| Palette distribution | 9/10 (4 amber/sage, 2 clay/lavender each, balanced) |
| Size-class discipline | 9/10 |
| Typography ceiling | 9/10 (if Fraunces base64 inlines correctly — VERIFY on sticker 1) |
| **Overall** | **9/10** |

**Proceed with C5. Ship Mood Dot FIRST to verify base64 Fraunces renders correctly in sharp/librsvg. If fallback to Times, fix render pipeline BEFORE authoring the other 11.**

---

## Consolidated findings

| Layout | Status | Blockers | Must-fix before commit |
|---|---|---|---|
| Monthly (C2) | CLEAR | none | widen dashboard rows 5→6mm; day-number affordance |
| Quarterly (C3) | CLEAR | G5 resolved via this sketch | 12mm hero intention; verify triad width |
| Sticker grammar (C5) | CLEAR | none | Mood Dot first with Fraunces base64 verification |

**No new commits** required beyond the v5.3 plan. Design notes fold into existing C2, C3, C5.

---

## Plan Status Footer

| Review | Status |
|---|---|
| CEO Review v4 | CLEAR · 0 unresolved |
| Eng Review v4 | CLEAR · 5W + 1C integrated into commit plan (C6a, C6b added) |
| Design Review v4 (this doc) | **CLEAR** · 3 refinements fold into C2/C3/C5 |
| Codex Review | not run |

**VERDICT:** all three reviews clear. Safe to begin C2 (Monthly blank page). Commit ladder:

```
C2  Monthly blank (6mm rows, day-number)
C3  Quarterly blank (12mm intention, triad-width check)
C4  profile.example.json + Zod + gitignore (PII fix)
C5  12-stickers starting with Mood Dot verification
C6  render-stickers.ts
C6a inline local fonts in templates (G1)
C6b splice edge-case tests (G4)
C7  generate-journal.ts full CLI
C8  Docs × 4 surfaces
```

---

*End of Design Review v4. Proceeding to C2: Monthly blank page.*
