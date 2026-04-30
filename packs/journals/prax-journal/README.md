# Prax Journal · **The Praxis Ledger**

A personal ADHD + depression journal in the **Warm Analog Editorial** aesthetic, designed for GoodNotes on iPad, authored as HTML + generated to bookmarked A4 PDF.

**For:** Prax. Specifically. One user, one body, one set of therapists.
**Format:** A4 portrait PDF with bookmarks. Drag-in stickers (PNG + SVG).
**Delivery:** Generate on Mac → AirDrop to iPad → import as GoodNotes notebook.
**Release name:** _The Praxis Ledger — &lt;Month YYYY&gt;_ (tagline: _A Monthly Daybook for the Unquiet Mind_).

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
    ├── README.md              sticker backlog (living)
    └── <slug>/                per-sticker directory — 60 skeuomorphic stickers
                               (SVG source + README + rendered PNG)
```

### Sticker pack (60 items)

Four deep-paper archetypes — **field-note** · **ledger** · **herbarium** · **clinic** —
rendered at three dimension classes (compact 400×600, standard 600×600, expanded 800×600)
across four accents (sage, clay, amber, lavender). Wave-1 authored 20, Wave-2 authored 28,
the original 12 round out the pack. Every sticker is XML-safe, escapes `&` in `<desc>`,
and uses an 8-layer tactile filter stack (drop shadow + vignette + fiber turbulence +
edge highlights).

Browse locally after a build:

```
open output/all-stickers/all/
# or the dimension-bucketed view:
open output/all-stickers/standard-600x600/
```

## Monthly release bundle · The Praxis Ledger

One command assembles the self-contained release folder:

```
# 1. Generate the month's bookmarked PDF
npx tsx scripts/generate-journal.ts \
  --from 2026-05-01 --to 2026-05-31 \
  --out output/journal-may-2026.pdf

# 2. Bundle into "The Praxis Ledger — <Month YYYY>/"
npx tsx scripts/bundle-release.ts \
  --pdf output/journal-may-2026.pdf \
  --month "May 2026" \
  --from 2026-05-01 --to 2026-05-31
```

Produces `output/The Praxis Ledger — May 2026/` containing:

| Path | What |
|---|---|
| `The Praxis Ledger — May 2026.pdf` | Bookmarked A4 PDF (135 pp, 39 bookmarks for May 2026) |
| `The Praxis Ledger — May 2026.html` | Standalone HTML (built in-process by `scripts/build-standalone-html.ts` — style-dedupe keeps 135 pages under 2 MB) |
| `README.md` | Bundle-level readme |
| `assets/fonts/` | Fraunces · Instrument Sans · JetBrains Mono (self-hosted) |
| `assets/css/` | `base.css` + 14 theme files |
| `assets/source-html/` | v5 per-section templates (`today.html`, `midday.html`, `reflect.html`, `brain-dump.html`, `weekly.html`, `monthly.html`, `quarterly.html`, `design-system.html`) |
| `sticker-pack/pngs/` | `all/` (60) · `compact-400x600/` · `standard-600x600/` · `expanded-800x600/` |
| `sticker-pack/svgs/` | 60 flat SVG sources |
| `sticker-pack/README.md` | Pack-level readme |

Everything is a **real file copy** — no symlinks — so the folder zips cleanly,
AirDrops, and drags into GoodNotes as a self-contained artifact. Lives under
`output/` which is gitignored (no repo bloat).

### Legacy one-shot generator (PDF only)

```
npm run journal -- --from 2026-04-28 --to 2026-05-30
```

Produces `output/prax-journal-2026-04-28_2026-05-30.pdf`. Use the bundle flow
above for a full monthly release.

## Month-end loop

1. Live in the PDF for ~30 days
2. At month-end, export filled notebook from GoodNotes as PDF, AirDrop to Mac
3. AI reads and aggregates (`docs/monthly-generation-playbook.md`)
4. AI generates `output/monthly-review-<yyyy-mm>.pdf` — one page, pre-filled with real data
5. Import back to GoodNotes, reflect, decide iteration-2 scope

See [`/docs/plan-ceo-review-v3-refined.md`](../../../docs/plan-ceo-review-v3-refined.md) for the full loop rationale.
