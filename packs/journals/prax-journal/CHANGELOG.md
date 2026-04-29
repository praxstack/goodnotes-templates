# Prax Journal — Changelog

Version history of the journal pack. See `versions/` for frozen snapshots of each era.

## v5 — Warm Analog Editorial + Midday + Rx (2026-04 · current)

- **C6a · font self-contained (G1)** — inlined 5 WOFF2 files as base64 `@font-face`
  rules directly into each of the 7 v5 pages. Google Fonts `<link>` removed. Pages
  now render with the warm-analog voice offline. Same base64 pipeline as stickers.
  Rewriter: `scripts/inline-v5-fonts.ts` (idempotent, marker-gated).
- **C6a polish** — three small post-review fixes: (a) `font-display: block` matches
  the sticker renderer (cosmetic alignment; for data URIs both values behave
  identically, but one value is easier to reason about); (b) `FONT_FILES` hoisted
  to a single exported constant in `src/core/sticker-renderer.ts` so stickers and
  v5 pages can't drift; (c) 500 KB soft cap on the generated `<style>` block to
  flag accidental variable-axis bloat. Marker bumped to `v5-inlined-woff2-v2`;
  the rewriter treats any v1-marked page as "re-emit" so roll-forward needs no
  `--force` flag.

- **Added Midday** as page 2 of 4 (2 pm re-anchor)
  - 2-second pause matrix (therapist-guided anchor)
  - Body scan block (heat · tight · sink)
  - Jar visualization — "the jar holds everything"
- **Added Rx card** on Reflect — blank template; Prax hand-fills from `profile.local.json`
- **Chest-kg metric** on Today + Reflect (0–5 scale, subjective)
- **Cigs horror metric** moved to Reflect (reality before redemption) with `/year` projection
- **Jar mascot SVG** on Midday (42mm hand-drawn, 8% opacity bottom-right)
- Design-review pass: P0 contrast WCAG AA · P1 7mm primary writing lines · inline-style cleanup
- `@media print { box-shadow: none }` across all 4 pages (Chromium print shadow-halo fix)
- `prax-journal-design-system.html` — live token + grammar reference page

## v4 — Warm Analog Editorial lands (2026-04)

- Aesthetic baseline: cream paper `#F9F5EC` · Fraunces + Instrument Sans + JetBrains Mono
- Palette: sage · clay · amber · lavender (with `-ink` variants for text-safe pairs)
- Three pages: Today · Reflect · Brain Dump
- Squircle card archetype (3.5mm radius · 2px accent rail · 3-layer warm shadow)
- Self-contained template contract (FIND-0010): one HTML, one `<style>` block, no imports

## v3 — Refined v2 with dark variants (2026-04)

- Added `.dark.css` sidecar for each of today · reflect · weekly · monthly
- Cleaner spacing, tighter typography
- 4-page daily (today · reflect) + weekly + monthly flows

## v2 — Four-page structure (2026-03)

- Established the today · reflect · weekly · monthly rhythm
- First ADHD-focused content (hour-grid, Named Patterns, cigs + chest-kg origins)

## v1 — "adhd-gentle" (2026-03)

- Three-page minimal: daily · weekly · monthly
- Gentle-tone copy, low-stakes, no Rx card, no therapist references

---

## Upcoming (v5.2 · Iteration-1)

- `versions/v5/weekly.html` — Sunday end-of-week recap page (matches Warm Analog grammar)
- `packs/journals/prax-journal/stickers/` — 12-sticker library: Thought Flip · If-Then Plan · Craving Surf · Wins Jar · Three Good Things · Friend Letter · Grateful for · Win Today · Mood Dot · Named Patterns · Shame + Baggage · PHQ-2 Lite
- `src/generators/prax-journal.ts` — 1-month PDF generator with weekly splice
- `docs/monthly-generation-playbook.md` — month-end read-and-generate handoff doc
