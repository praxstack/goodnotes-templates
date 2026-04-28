# Prax Journal

A personal ADHD + depression journal in the **Warm Analog Editorial** aesthetic, designed for GoodNotes on iPad, authored as HTML + generated to bookmarked A4 PDF.

**For:** Prax. Specifically. One user, one body, one set of therapists.
**Format:** A4 portrait PDF with bookmarks. Drag-in stickers (PNG + SVG).
**Delivery:** Generate on Mac → AirDrop to iPad → import as GoodNotes notebook.

## Daily spread (v5 · current)

Four A4 pages per day, opened in sequence across the day:

1. **`today.html`** — Morning commit. The one thing · 3 ifs · meds · cigs baseline · chest-kg start.
2. **`midday.html`** — 2 pm check-in. 2-second pause · body scan · jar visualization · re-anchor.
3. **`reflect.html`** — Evening process. Triad · cigs reality · chest-kg close · Named Patterns · Rx card.
4. **`brain-dump.html`** — Free canvas. Sticker watermarks hint at 12-sticker library.

The daily spread is the **behavioral system**: morning commit → midday re-anchor → evening process → free writing.

## Pack contents

```
packs/journals/prax-journal/
├── README.md           you are here
├── DESIGN.md           Warm Analog Editorial design contract (tokens, grammar, constraints)
├── SPEC.md             implementation contract for builders
├── CHANGELOG.md        v1 → v5 history
├── profile.json        single source of truth for meds · therapists · patterns (Iter-1)
├── design-system.html  live reference page showing every token + block archetype
├── versions/
│   ├── v1/             "adhd-gentle" — 3 pages, minimal, gentle tone
│   ├── v2/             "adhd-v2"     — 4 pages with weekly + monthly
│   ├── v3/             "adhd-v3"     — refined v2 with dark.css
│   ├── v4/             Warm Analog Editorial lands — Today / Reflect / BrainDump
│   └── v5/             + Midday + Rx card + Jar matrix (current)
└── stickers/
    ├── README.md       sticker backlog (living)
    └── <name>/         per-sticker directory (SVG source + data spec)
```

## Running the generator

From repo root:

```
npm run journal -- --from 2026-04-28 --to 2026-05-30
```

Produces `output/prax-journal-2026-04-28_2026-05-30.pdf` — bookmarked A4, daily spread for every day, weekly review page spliced every Sunday. Import into GoodNotes.

(To be implemented in Phase 2 · `src/generators/prax-journal.ts`.)

## Month-end loop

1. Live in the PDF for ~30 days
2. At month-end, export filled notebook from GoodNotes as PDF, AirDrop to Mac
3. AI reads and aggregates (`docs/monthly-generation-playbook.md`)
4. AI generates `output/monthly-review-<yyyy-mm>.pdf` — one page, pre-filled with real data
5. Import back to GoodNotes, reflect, decide iteration-2 scope

See [`/docs/plan-ceo-review-v3-refined.md`](../../../docs/plan-ceo-review-v3-refined.md) for the full loop rationale.
