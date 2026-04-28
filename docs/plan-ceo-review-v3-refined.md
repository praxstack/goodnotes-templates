# CEO Plan v3 — Refined through Dialogue (Iteration-1 loop)

**Date:** 2026-04-28
**Branch:** main · HEAD after `91929b2`
**Supersedes:** v2's E1–E5 ladder (`docs/plan-ceo-review-v2-10x-expansion.md`)
**Mode:** Walk-through / dialog mode. User in full control.
**Status:** Decisions locked · ready to execute

v2 was correct in vision, wrong in sequencing. This document is the refined plan after three rounds of dialogue with the user. v2 stays on disk for reference; v3 is what we build.

---

## Three locked decisions (from dialogue 2026-04-28)

### D1 · Option (a) flow — user writes in GoodNotes, AI reads at month-end

User has severe ADHD + depression and realistically won't maintain a daily or month-end aggregation ritual (options b or c from the dialog). The only loop that respects that is:

```
  Mac: generate 1-month PDF         (AI, ~1 command)
      ↓
  iPad: live in GoodNotes 30 days   (user, writes what they can)
      ↓
  iPad → Mac: AirDrop filled PDF    (user, 30 seconds)
      ↓
  Mac: AI reads handwriting         (~45 min of AI time)
      ↓
  Mac: AI generates monthly review  (1-page PDF, pre-filled with real data)
      ↓
  iPad: receive + reflect           (user, 30-60 min reflection)
      ↓
  loop (next month, iterate)
```

**Mitigation for AI-dependence:** a `docs/monthly-generation-playbook.md` ships with the repo so any future AI (or the user with basic scripting help) can run the month-end read-and-generate step. The system is AI-**assisted**, not AI-**locked**.

### D2 · Fluid stickers with data spec

- Adding a sticker = drop a file in the pack's `stickers/` folder. No cascading work.
- Deleting a sticker = remove the file. Existing pages keep it in handwriting.
- New sticker that captures **measurable data** (1-5 scale, tap-count, etc.) ships with a 3-line `README.md` describing the data type so monthly-review aggregation knows how to count it.
- Living **sticker backlog** at `packs/journals/prax-journal/stickers/README.md` — candidates, shipped, parked, cut. Single source of truth for what stickers exist and what's next.

### D3 · Repo restructure to `packs/` — prerequisite to Iteration-1

Current `src/templates/html/*.html` mixes products (journal · trackers · notes · worksheets) as sibling files. Doesn't scale. Can't ship one pack without dragging others. No spec per pack.

New structure:

```
goodnotes-templates/
├── packs/
│   ├── journals/
│   │   ├── prax-journal/
│   │   │   ├── README.md              ← what this pack is
│   │   │   ├── DESIGN.md              ← (was prax-journal-design.md)
│   │   │   ├── SPEC.md                ← implementation contract
│   │   │   ├── CHANGELOG.md           ← v2→v3→…→v5
│   │   │   ├── profile.json           ← meds, therapists, patterns (D3 support for Iter-1)
│   │   │   ├── versions/
│   │   │   │   ├── v2/ v3/ v4/        ← frozen
│   │   │   │   └── v5/                ← current
│   │   │   │       ├── today.html
│   │   │   │       ├── midday.html
│   │   │   │       ├── reflect.html
│   │   │   │       ├── brain-dump.html
│   │   │   │       └── weekly.html    (Iter-1 adds this)
│   │   │   └── stickers/
│   │   │       ├── README.md          ← living backlog
│   │   │       ├── thought-flip/
│   │   │       └── ...
│   ├── planners/
│   │   ├── monthly-planner/
│   │   ├── weekly-planner/
│   │   └── yearly-overview/
│   ├── trackers/
│   │   ├── habit-tracker/
│   │   ├── budget-tracker/
│   │   ├── fitness-log/
│   │   ├── mood-tracker/
│   │   └── reading-log/
│   ├── notes/
│   │   ├── cornell-notes/
│   │   └── meeting-notes/
│   ├── worksheets/
│   │   ├── eisenhower-matrix/
│   │   ├── eat-the-frog/
│   │   ├── goal-setting/
│   │   └── ... (all single-purpose sheets)
│   └── covers/                        ← future
├── shared/
│   ├── themes/                        ← moved from src/templates/themes
│   ├── fonts/                         ← moved from assets/fonts
│   └── base.css                       ← moved from src/templates/html/_base.css
├── src/
│   ├── core/                          ← renderers stay
│   ├── cli/                           ← narrower scope
│   ├── generators/
│   │   └── prax-journal.ts            ← Iter-1 generator
│   ├── types/
│   └── utils/
├── scripts/                           ← dev helpers
├── tests/                             ← paths updated to packs/**
├── docs/                              ← cross-pack docs only
└── README.md
```

---

## Migration plan (one focused pass, preserves git history)

**Order:**
1. Create `packs/` skeleton + category README files
2. Create `shared/` skeleton
3. Move `src/templates/themes/*` → `shared/themes/` (simple, low-risk first move)
4. Move `assets/fonts/*` → `shared/fonts/`
5. Move `src/templates/html/_base.css` → `shared/base.css`
6. Move Prax Journal (v2 · v3 · v4 · v5 · design-system page) → `packs/journals/prax-journal/versions/` + promote design doc
7. Move planners → `packs/planners/<name>/`
8. Move trackers → `packs/trackers/<name>/`
9. Move notes → `packs/notes/<name>/`
10. Move worksheets → `packs/worksheets/<name>/`
11. Update all path references in: scripts/ · tests/ · src/core/ · src/templates/registry.ts
12. Rebaseline visual-regression snapshots (paths changed)
13. Verify: `tsc --noEmit` · `npm run lint` · `npm run test:unit` · visual-regression

**Commits (atomic, revertable):**

- Commit 1: `chore(packs): scaffold packs/ + shared/ skeletons`
- Commit 2: `refactor(themes): move shared/themes + shared/fonts + shared/base.css`
- Commit 3: `refactor(packs): promote Prax Journal to packs/journals/prax-journal/ with versions/ + DESIGN.md + SPEC.md + README.md`
- Commit 4: `refactor(packs): move planners → packs/planners/`
- Commit 5: `refactor(packs): move trackers → packs/trackers/`
- Commit 6: `refactor(packs): move notes + worksheets → packs/`
- Commit 7: `refactor(code): update path references + rebaseline visual tests`

Tree clean at each commit. Tests pass at each commit. Restructure does **not** add new features or change behavior — it's purely a move.

---

## Iteration-1 scope (after restructure lands)

**Generate a 1-month journal PDF for Prax, valid 2026-04-28 → 2026-05-30 (Tue → Fri, 33 days, 5 Sundays).**

**Structure inside the PDF (in order):**
- Day 1 (Tue Apr 28): Today · Midday · Reflect · Brain Dump (4pp)
- Day 2 (Wed Apr 29): same (4pp)
- ... for 33 days = 132 daily pages
- 5 Sunday Weekly Reviews spliced (May 3 · 10 · 17 · 24 · 30) = 5 pages
- **Total: 137 pages**, bookmarked

**NOT in the PDF:**
- No built-in monthly page (generated separately at month-end from your data)
- No built-in quarterly page (will re-decide after Iter-1 retro)
- No profile-driven auto-fill yet (v5 templates already encode current meds; profile.json used only by the generator to stamp the date-specific header)

**Shipped alongside the PDF:**
- 12-sticker library (PNG at 300/600/1200 + source SVG) — fluid additions OK later
- `packs/journals/prax-journal/profile.json` — seeded with current meds/therapists/patterns from existing v5 HTML
- `docs/monthly-generation-playbook.md` — handoff doc for the month-end read-and-generate step

**Artifacts user hands to AI at month-end (~2026-05-30):**
- AirDrop the filled notebook exported from GoodNotes as PDF

**AI returns:**
- 1-page monthly review PDF pre-filled with the aggregates extracted from reading the filled pages
- AirDrop back to user
- User imports, reflects, writes takeaways directly on the page in GoodNotes

**Then:**
- Short retro (10 min): what worked, what didn't, sticker backlog updates
- Generate Iter-2 (next month) with any refinements

---

## Commit plan (Iteration-1, after restructure)

- **C1** · `feat(prax-journal): Weekly page (v5) — Sunday end-of-week recap`
- **C2** · `feat(prax-journal): sticker library — 12 functional SVGs + sticker backlog`
- **C3** · `feat(prax-journal): render-stickers.ts — SVG → PNG 300/600/1200`
- **C4** · `feat(prax-journal): generate-journal.ts — 1-month PDF with weekly splice`
- **C5** · `docs(prax-journal): README + SPEC + profile.json seed + monthly-generation-playbook`

Monthly page and quarterly page are **explicitly deferred** — they ship only if/when the month-end retro shows we need them, and they ship as **separately-generated artifacts** (per D1), not as built-in pages.

---

## Explicit NOT in scope for Iteration-1

- Monthly page baked into PDF (generated post-hoc per D1)
- Quarterly page (re-decide after Iter-1 or Iter-2 retro)
- YAML frontmatter / daily double-entry / CSV extract (ADHD reality — skip)
- E3 full profile → template pipe (Iter-1 only uses profile for date stamp, not full var replacement yet)
- Multi-user / cloud / auth / mobile app
- Crisis card

These are **not rejected, just not now.** Reassessed after each monthly retro.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review (v3 refined) | `/plan-ceo-review` dialog | Scope refined via 3-round user dialog | 3 | **CLEAR** | Option (a) flow · fluid stickers with spec · packs/ restructure prerequisite · Iter-1 is 1-month loop |
| CEO Review (v2) | `/plan-ceo-review` 10x | Scope expansion | 2 | CLEAR (superseded) | 5 expansions proposed, refined by v3 |
| CEO Review (v1) | `/plan-ceo-review` selective | Baseline | 1 | CLEAR (superseded) | Original D1/D2/D3 locked |
| Eng Review | `/plan-eng-review` | Architecture | 1 | CLEAR | Applied to v1 scope; needs re-run on v3 after restructure |
| Design Review | `/plan-design-review` | UI/UX | 0 | — | Run on restructured pack + weekly page |

**UNRESOLVED:** 0. Ready to execute.
**VERDICT:** v3 **CLEARED**. Restructure first (7 commits), then Iteration-1 (5 commits). Reassess at 2026-05-30 retro.

---

## Next steps

1. **Restructure** — execute the 7-commit migration. Tests green at each commit.
2. **Iteration-1** — 5 commits on the new structure. Ship 137-page PDF + 12 stickers + playbook.
3. **Live with it 2026-04-28 → 2026-05-30**.
4. **Month-end retro** (2026-05-30 evening) — AirDrop filled PDF · AI reads · generates monthly review · retro conversation · decide Iter-2 scope.
5. **Iteration-2** — refined based on lived data. Add/cut stickers. Adjust template blocks. Regenerate.

The cathedral is built block by block, with feedback at every block. That's the actual 10x loop.
