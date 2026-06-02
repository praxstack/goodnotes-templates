# codex/ — Prax Journal v7 build

Implementation of the approved design at
`docs/superpowers/specs/2026-06-02-prax-journal-v7-daily-and-truth-deck-design.md`.

## Layout
```
codex/
  build-daily.ts     # generates the 4 Daily Pilot pages → HTML + render-verified A4 PDF
  pages/             # generated daily HTML (morning, brain-dump, midday, evening)
  output/            # generated PDFs + render-QA report (gitignored build artifacts)
```

## Build order (per spec §7)
1. **Daily Pilot** (this dir, `build-daily.ts`) — Morning · Brain Dump · Midday · Evening.
2. Truth Deck — 65 cards authored as SVG → PNG sticker packs + flip-deck PDF.
3. Permanent Reminders card.
4. As-needed single-page PDFs.

## Run
```bash
# from repo root (pnpm's deps-check wrapper can block `pnpm tsx`; call tsx directly):
./node_modules/.bin/tsx codex/build-daily.ts
open codex/output/daily-pilot.pdf
```

## Principles (locked)
- **Depth allowed, debt not** — only Morning + Evening are *owed*; Brain Dump + Midday optional.
- **Fillable in fog** — taps and short lines, no essays. Morning ≈ 2 min, Evening ≈ 3 min.
- **Render-verify, never claim** — every page checked for exact A4, zero overflow, no footer
  collision before it's called done.
- Design language locked from v6 (Fraunces / Instrument Sans / JetBrains Mono · warm paper).
- Privacy: no literal names, no medication doses.
