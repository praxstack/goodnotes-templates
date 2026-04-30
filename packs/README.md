# packs/

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 100" width="100%" role="img" aria-label="packs overview">
  <rect width="720" height="100" fill="#f3ecdc"/>
  <g font-family="Georgia,serif" font-size="14" fill="#1b1815">
    <g transform="translate(20 30)">
      <rect width="104" height="52" rx="3" fill="#fff" stroke="#8a9a7b" stroke-width="1.3"/>
      <text x="12" y="20" font-weight="700" fill="#5e6f53">journals</text>
      <text x="12" y="40" font-size="11" fill="#6b5d3f">5 packs</text>
    </g>
    <g transform="translate(140 30)">
      <rect width="104" height="52" rx="3" fill="#fff" stroke="#b87d5a" stroke-width="1.3"/>
      <text x="12" y="20" font-weight="700" fill="#8a5b42">planners</text>
      <text x="12" y="40" font-size="11" fill="#6b5d3f">3 packs</text>
    </g>
    <g transform="translate(260 30)">
      <rect width="104" height="52" rx="3" fill="#fff" stroke="#d4a656" stroke-width="1.3"/>
      <text x="12" y="20" font-weight="700" fill="#8a6a1e">trackers</text>
      <text x="12" y="40" font-size="11" fill="#6b5d3f">5 packs</text>
    </g>
    <g transform="translate(380 30)">
      <rect width="104" height="52" rx="3" fill="#fff" stroke="#8a9a7b" stroke-width="1.3"/>
      <text x="12" y="20" font-weight="700" fill="#5e6f53">notes</text>
      <text x="12" y="40" font-size="11" fill="#6b5d3f">2 packs</text>
    </g>
    <g transform="translate(500 30)">
      <rect width="114" height="52" rx="3" fill="#fff" stroke="#b7a3c7" stroke-width="1.3"/>
      <text x="12" y="20" font-weight="700" fill="#6d5a86">worksheets</text>
      <text x="12" y="40" font-size="11" fill="#6b5d3f">7 packs</text>
    </g>
    <g transform="translate(630 30)" opacity="0.4">
      <rect width="74" height="52" rx="3" fill="#fff" stroke="#1b1815" stroke-width="1" stroke-dasharray="3 2"/>
      <text x="10" y="20" font-weight="700">covers</text>
      <text x="10" y="40" font-size="10" fill="#6b5d3f">future</text>
    </g>
  </g>
</svg>
</div>

All shippable GoodNotes-ready digital products live here, grouped by category.
**22 packs across 5 live categories.** Each pack is a self-contained unit: HTML
templates, optional DESIGN.md / SPEC.md / CHANGELOG.md, optional sticker pack,
optional profile data. A pack ships in isolation — point the CLI at its HTML,
render to PDF, AirDrop, done.

---

## Category tour

### [`journals/`](journals/) — multi-page journaling systems · **5 packs**

| Pack | One-liner | Pages |
|---|---|---|
| [`prax-journal/`](journals/prax-journal/) | The Praxis Ledger — personal ADHD + depression journal (v5 daily spread + weekly / monthly / quarterly reviews) | multi-page · per-month release bundle |
| [`gratitude-journal/`](journals/gratitude-journal/) | Single-page gratitude sheet | 1 |
| [`morning-pages/`](journals/morning-pages/) | Julia Cameron "morning pages" template | 1 |
| [`prompted-journal/`](journals/prompted-journal/) | Daily prompt journaling sheet | 1 |
| [`reflection-journal/`](journals/reflection-journal/) | End-of-day reflection sheet | 1 |

### [`planners/`](planners/) — calendar grids · **3 packs**

| Pack | Scope |
|---|---|
| [`weekly-planner/`](planners/weekly-planner/) | 7-day layout |
| [`monthly-planner/`](planners/monthly-planner/) | Full-month grid |
| [`yearly-overview/`](planners/yearly-overview/) | 12-month at-a-glance |

### [`trackers/`](trackers/) — behavior & data · **5 packs**

| Pack | Tracks |
|---|---|
| [`habit-tracker/`](trackers/habit-tracker/) | Daily habits (monthly grid) |
| [`mood-tracker/`](trackers/mood-tracker/) | Mood over time |
| [`budget-tracker/`](trackers/budget-tracker/) | Income · expenses · savings |
| [`fitness-log/`](trackers/fitness-log/) | Workouts, sets × reps × weight |
| [`reading-log/`](trackers/reading-log/) | Books, start / finish / rating |

### [`notes/`](notes/) — structured note-taking · **2 packs**

| Pack | System |
|---|---|
| [`cornell-notes/`](notes/cornell-notes/) | Cornell two-column + summary |
| [`meeting-notes/`](notes/meeting-notes/) | Agenda · attendees · decisions · actions |

### [`worksheets/`](worksheets/) — single-page productivity · **7 packs**

| Pack | Framework |
|---|---|
| [`eat-the-frog/`](worksheets/eat-the-frog/) | Brian Tracy's "eat the frog" |
| [`eisenhower-matrix/`](worksheets/eisenhower-matrix/) | Urgency × importance 2×2 |
| [`goal-setting/`](worksheets/goal-setting/) | SMART / OKR goal capture |
| [`meal-planning/`](worksheets/meal-planning/) | Weekly meal grid |
| [`project-planning/`](worksheets/project-planning/) | Project charter · phases · milestones |
| [`recipe-card/`](worksheets/recipe-card/) | Ingredients · method · notes |
| [`travel-planner/`](worksheets/travel-planner/) | Itinerary · packing · bookings |

### [`covers/`](covers/) — notebook covers · _planned_

Empty directory reserved for notebook / binder cover art. Will ship when the first cover is authored.

---

## Conventions

- **Single-template pack:** `packs/<category>/<name>/<name>.html` + `README.md`.
- **Multi-template pack:** `packs/<category>/<name>/versions/v<N>/*.html` — every major revision is kept.
- Every pack owns its own `README.md` describing purpose, render instructions, and GoodNotes compatibility notes.
- Packs *may* own a `DESIGN.md` (design contract), `SPEC.md` (implementation contract), `CHANGELOG.md` (revision history), `stickers/` (matching SVG pack), `profile.json` (per-user data). None are required.
- Shared CSS themes live under [`/shared/themes/`](../shared/themes/). Shared fonts under [`/shared/fonts/`](../shared/fonts/).
- Pack HTML files are **self-contained** — they carry their own `@font-face` (base64 where size matters), their own tokens, their own layout. No theme injection at render time.
- Every pack passes the 5-command A4 verification recipe in [`CLAUDE.md`](../CLAUDE.md) before it ships.

---

## Rendering any pack

```bash
# From repo root
npx tsx src/cli/index.ts render \
  packs/worksheets/eisenhower-matrix/eisenhower-matrix.html \
  -o output/eisenhower.pdf
```

For multi-page / month-range renders (Prax Journal), see
[`packs/journals/prax-journal/README.md`](journals/prax-journal/README.md)
or the root [`README.md`](../README.md#the-praxis-ledger--monthly-release).

---

## Future

<!-- Empty on purpose — see AGENTS.md § Simplicity First -->

_Scheduled roadmap items land in `/docs/plan-*.md`. Nothing speculative here._
