# Prax Journal v8 — Beautified 30-Day Journal + Linked Appendix + PNG/Pomodoro Packs

**Date:** 2026-06-03
**Status:** Approved (brainstorming) → pending spec review → writing-plans
**Builds on:** v7 (`cline/build-*.ts`), v8 base (`cline/build-v8.ts`, commit `9abc127`)

---

## Goal

Turn the existing v7 content into a warm, navigable, month-long journal **plus**
import-friendly singles, high-quality deck PNGs, and a clockified tomato Pomodoro
set — all additive. No v7 tone/content rewrite (Surgical Changes). Every freshly
rendered page passes render-QA (A4 / overflow ≤ 1px / footer not collided /
minFont ≥ 7px). All decorations clipped in a QA-safe `.bleed-layer` so they can
never inflate `scrollHeight` (the lesson from `build-pomodoro-tomato.ts`).

---

## Locked decisions (from brainstorming)

1. **Daily bundle structure:** permission page repeats after *each* day; all other
   tool/extra pages appear once in an appendix at the end, preceded by a linked index.
   Plus standalone single-page PDFs for easy individual import.
2. **Navigation:** two-way — index entry → appendix page, and each appendix page →
   "↑ index". Link approach **A with automatic fallback to B**: attempt real
   tappable `GoTo` link annotations (pdf-lib), verify they resolve in the merged
   PDF; if verification fails, degrade to a clean page-number index (no broken links).
3. **Appendix contents:** tools 01–15 + all 6 extras (one copy each). Permission
   (tool 02) is the *only* page repeated daily.
4. **Truth-deck PNGs:** `truth-deck-flip.pdf` (66pp) → one PNG per page at **300 DPI**
   + a contact-sheet overview.
5. **Pomodoro (1 + 4):** keep the sage originals; add a **tomato** variant of capture +
   catch-decide; add cute **clock-face SVGs** (25-min dial) to **all** pomodoro pages
   — both the sage `pomodoro-pad` (tools 14–15) and the tomato pad
   (`build-pomodoro-tomato.ts`: session + capture + catch-decide). Tomato set is
   canonical for v8.
6. **Beautification scope:** faint content-aware watermark + rotating corner sprig on
   **every** v8 page — daily, permission, appendix, and singles — for one cohesive look.

---

## Outputs (all under `cline/output/v8/`, gitignored build artifacts)

```
v8/
  prax-journal-v8-daily.pdf        # ~171pp: 30×(morning,brain,midday,evening,permission)
                                   #         + appendix index + 20 appendix pages, two-way links
  daily/day-01.pdf … day-30.pdf    # 5pp each (4 daily + permission)
  singles/                         # one 1-page PDF per appendix page (permission + 15 tools + 6 extras)
    permission.pdf, 01-quick-start.pdf, 03-crisis-card.pdf, … , urge-reach-log.pdf
  appendix/appendix.pdf            # index + 20 pages standalone (the same linked block)
  truth-deck-png/
    page-01.png … page-66.png      # 300 DPI full-page renders
    contact-sheet.png
  sticker-sheets/                  # unchanged from v8 base (truth/quote/pill)
  pomodoro-tomato/                 # session + capture + catch-decide, tomato + clock SVGs
  v8-master-bundle.pdf             # regenerated wrapper: daily bundle + sheets + truth-deck + tomato pomodoro
```

---

## Architecture

### Page rendering (Chromium → A4 PDF), reused from v7/v8
- One `renderAndVerify()` per unique page; QA gate fails loudly.
- Render cache so repeated pages (permission ×30, daily motifs) render once and are
  copied into bundles via `pdf-lib`.

### A. Daily bundle assembly
1. Render 4 daily page-types × 6 sprig motifs = 24 base pages (existing v8 logic).
2. Render the permission page once (with its watermark).
3. Render the 20 appendix pages once each (tools 01–15 + 6 extras), reusing v7
   page HTML wrapped in the v8 shell (watermark + sprig + content-aware motif).
4. Render the appendix **index** page (lists all 20 with their titles).
5. Compose `prax-journal-v8-daily.pdf`:
   `[day1×4][permission] … [day30×4][permission] [index] [appendix×20]`.
6. **Link pass (A→B):** after merge, add `GoTo` link annotations — index rows →
   appendix page refs, each appendix page → index page. Verify each annotation's
   destination page index is in range and the link rect is on the right page; if any
   check fails, strip annotations and re-render the index with visible page numbers
   (fallback B). Log which mode shipped.

### B. Singles
- Each appendix page (already rendered single-page PDFs) written to `v8/singles/`.
  No re-render; reuse the same page bytes. Singles have no links (one page each).

### C. Truth-deck PNGs
- Load `truth-deck-flip.pdf`; for each of 66 pages, render to PNG at 300 DPI
  (Chromium: set deviceScaleFactor or viewport so A4 → ~2480×3508). Write
  `page-NN.png`. Then compose `contact-sheet.png` (grid thumbnail of all 66).

### D. Pomodoro clockify (1 + 4)
- Extend `build-pomodoro-tomato.ts`: add a reusable `clock(size, minutes)` SVG
  (dial + tick marks + 25-min sweep) alongside the existing tomato glyph. Apply to
  session + capture + catch-decide.
- Add the same clock SVG to the sage pomodoro pages (tools 14–15) in `build-tools.ts`
  (or a thin v8 wrapper) — keeping the sage palette, just adding the clock motif.
- Sage originals remain; tomato pad is canonical for the v8 master.

### E. Master bundle
- Regenerate `v8-master-bundle.pdf` to wrap: `prax-journal-v8-daily.pdf` +
  sticker sheets + (optionally) truth-deck pages + tomato pomodoro.

---

## Content-aware watermark motifs (faint, ~5% opacity, bleed-layer clipped)

| Page | Motif |
|---|---|
| Morning | sunrise |
| Brain-dump | thought-cloud |
| Midday | high sun |
| Evening | crescent moon + stars |
| Permission | open book |
| Crisis card | small heart |
| CBT / self-worth | speech bubble / mirror |
| Tiny-task / 30-min | single leaf / clock |
| Doorways A–D | doorway arch |
| Pomodoro | tomato + clock |
| Extras | letter / calendar / leaf as fitting |

Corner sprig (leaf/sprig/berry/fern/bud/flower) rotates per page for variety.

---

## Render-QA & safety

- Gate on every freshly-rendered page: A4 box, overflow ≤ 1px, footer not collided,
  minFont ≥ 7px. Exit non-zero on any fail.
- Link verification gate: every annotation destination resolvable, else fallback B.
- PII gate before commit: no `profile.json` / `.env` staged; 0 real-name matches in
  source; `output/` stays gitignored. **`piiPrax/` is never touched.**
- Only the `.ts` source files are committed; PDFs/PNGs are regenerable artifacts.

---

## Out of scope (YAGNI)

- No v5/v6 pack imports into v8 (separate generators; revisit only if asked).
- No content/tone edits to existing v7 pages.
- No transparent-sticker re-cutting (the 65 PNGs already exist).
- No interactivity beyond the two-way appendix links.

---

## Testing / verification

1. Run extended `build-pomodoro-tomato.ts` → 3 pages pass QA (clock SVGs added).
2. Run `build-v8.ts` → 24 daily base + permission + 20 appendix + index all pass QA;
   link verification reports A (or B fallback).
3. Confirm `v8/singles/` has 22 single-page PDFs (permission + 15 tools + 6 extras).
4. Confirm `truth-deck-png/` has 66 PNGs + contact sheet; spot-check one is ~300 DPI.
5. Open `prax-journal-v8-daily.pdf`; verify a sample index link jumps and a sample
   appendix "↑ index" link returns (if mode A).
6. PII gate clean; commit + push source.
