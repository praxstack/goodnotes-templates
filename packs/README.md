# packs/

All shippable GoodNotes-ready digital products live here, grouped by category.

Each pack is a self-contained unit: HTML templates, DESIGN.md, SPEC.md, CHANGELOG.md,
stickers, profile data. A pack can be shipped in isolation.

## Categories

- `journals/` — multi-page journaling systems (Prax Journal v5, gratitude, morning pages, etc.)
- `planners/` — daily/weekly/monthly/yearly planners
- `trackers/` — habit, mood, budget, fitness, reading
- `notes/` — note-taking systems (Cornell, meeting)
- `worksheets/` — single-page productivity sheets (Eisenhower, frog, goals)
- `covers/` — notebook covers (future)

## Conventions

- **Single-template pack:** `packs/<category>/<name>/<name>.html`
- **Multi-template pack:** `packs/<category>/<name>/versions/v<N>/*.html`
- Every pack owns its own `README.md` describing purpose and usage.
- Packs may own a `DESIGN.md`, `SPEC.md`, `CHANGELOG.md`, `stickers/`, `profile.json` as needed.
- Shared CSS themes live under `/shared/themes/`. Shared fonts under `/shared/fonts/`.
