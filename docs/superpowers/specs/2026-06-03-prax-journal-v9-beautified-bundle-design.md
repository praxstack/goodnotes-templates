# Prax Journal v9 — Beautified 30-Day Journal + Linked Appendix + PNG/Pomodoro Packs

**Date:** 2026-06-03
**Status:** Approved → in implementation
**Versioning:** Shipped **v8** (218pp master, `cline/build-v8.ts` / `cline/output/v8/`, commit `9abc127`)
is a **frozen checkpoint** — left untouched. This feature set ships as **v9**: new namespace
`cline/build-v9.ts` → `cline/output/v9/`. Shared generators (`build-cards.ts`, `build-tools.ts`,
`build-extras.ts`, `build-pomodoro-tomato.ts`) stay version-agnostic and feed both.
**Builds on:** v7/v8 (`cline/build-*.ts`)

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
   canonical for the v9 master.
6. **Beautification scope:** faint content-aware watermark + rotating corner sprig on
   **every** v9 page — daily, permission, appendix, and singles — for one cohesive look.
7. **Dual output:** every page emits **HTML + PDF**; every sticker emits **SVG + PNG**.

---

## Outputs (all under `cline/output/v9/`, gitignored build artifacts)

```
v9/
  prax-journal-v9-daily.pdf        # ~171pp: 30×(morning,brain,midday,evening,permission)
                                   #         + appendix index + 20 appendix pages, two-way links
  daily/day-01.pdf … day-30.pdf    # 5pp each (4 daily + permission)
  singles/                         # one HTML + one 1-page PDF per appendix page
    permission.{pdf,html}, 01-quick-start.{pdf,html}, … , urge-reach-log.{pdf,html}
  truth-deck-png/
    page-01-z1.png … page-66-pNN.png   # 300 DPI renders (re-rendered from card SVG)
    contact-sheet.png
  sticker-sheets/                  # truth/quote/pill printable A4 sheets (from PNGs)
  pomodoro-tomato/                 # session + capture + catch-decide, tomato + clock SVGs (+ HTML)
  v9-master-bundle.pdf             # wrapper: daily bundle + sheets + carried-over tools/pomodoro/extras

stickers/ (shared, version-agnostic)
  {truth,quote,pill}/*.png + *.svg # 65 stickers, SVG + PNG both
```

---

## Architecture

### Page rendering (Chromium → A4 PDF), reused from v7/v8
- One `renderAndVerify()` per unique page; QA gate fails loudly.
- Render cache so repeated pages (permission ×30, daily motifs) render once and are
  copied into bundles via `pdf-lib`.
- Every rendered page also written as `.html` next to its `.pdf`.

### A. Daily bundle assembly (`cline/build-v9.ts`)
1. Render 4 daily page-types × 6 sprig motifs = 24 base pages.
2. Render the permission page once (with its watermark).
3. Render the 20 appendix pages once each (tools 01–15 + 6 extras), reusing v7
   page HTML wrapped in the v9 shell (watermark + sprig + content-aware motif).
4. Render the appendix **index** page (lists all 20 with their titles).
5. Compose `prax-journal-v9-daily.pdf`:
   `[day1×4][permission] … [day30×4][permission] [index] [appendix×20]`.
6. **Link pass (A→B):** after merge, add `GoTo` link annotations — index rows →
   appendix page refs, each appendix page → index page. Verify destinations resolve;
   if any check fails, degrade to a visible page-number index (fallback B). Log mode.

### B. Singles
- Each appendix page + permission written to `v9/singles/` as both `.pdf` (1 page)
  and `.html`. Singles have no links (one page each).

### C. Truth-deck PNGs (`cline/build-deck-png.ts`)
- Re-render each card SVG opaque at 300 DPI (no Poppler dependency) → `page-NN-*.png`.
  Then a `contact-sheet.png` grid of all 66.

### D. Pomodoro clockify (1 + 4)
- Extend `build-pomodoro-tomato.ts`: add a reusable `clock()` SVG (dial + ticks +
  25-min sweep) alongside the tomato glyph. Apply to session + capture + catch-decide.
  Emit HTML alongside PDF.
- Add a sage `clock()` to the sage pomodoro pages (tools 14–15) in `build-tools.ts`.
  Sage originals remain; tomato pad is canonical for the v9 master.

### E. Master bundle
- `v9-master-bundle.pdf` wraps: `prax-journal-v9-daily.pdf` + sticker sheets +
  carried-over tools / tomato pomodoro / extras / truth-deck.

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
| CBT / self-worth | speech bubble |
| Tiny-task / scene / quick-start | leaf |
| 30-min / pomodoro / urge-reach | clock |
| Doorways A–D | doorway arch |
| Letter / monthly / weekly / stock-up | letter / calendar |

Corner sprig (leaf/sprig/berry/fern/bud/flower) rotates per page for variety.

---

## Render-QA & safety

- Gate on every freshly-rendered page: A4 box, overflow ≤ 1px, footer not collided,
  minFont ≥ 7px. Exit non-zero on any fail.
- Link verification gate: every annotation destination resolvable, else fallback B.
- PII gate before commit: no `profile.json` / `.env` staged; 0 real-name matches in
  source; `output/` stays gitignored. **`piiPrax/` is never touched.**
- Only the `.ts` source files are committed; PDFs/PNGs/HTML are regenerable artifacts.
- **v8 (`build-v8.ts`, `output/v8/`) is frozen — not modified by v9 work.**

---

## Out of scope (YAGNI)

- No v5/v6 pack imports into v9 (separate generators; revisit only if asked).
- No content/tone edits to existing v7 pages.
- No transparent-sticker re-cutting (the 65 PNGs/SVGs come from `build-cards.ts`).
- No interactivity beyond the two-way appendix links.

---

## Testing / verification

1. `build-cards.ts` → 65 stickers as SVG + PNG (svg=65, png=66 incl. contact sheet).
2. `build-pomodoro-tomato.ts` → 3 pages pass QA (clock SVGs); HTML + PDF each.
3. `build-tools.ts` → 15 pages pass QA (sage clock on pomodoro); HTML each.
4. `build-deck-png.ts` → 66 PNGs @300dpi + contact sheet (png=67).
5. `build-v9.ts` → 24 daily base + permission + 20 appendix + index all pass QA;
   link verification reports A (or B fallback); daily bundle + master written.
6. `v9/singles/` has 22 PDFs + 22 HTML (permission + 15 tools + 6 extras).
7. Open `prax-journal-v9-daily.pdf`; sample index link jumps; appendix "↑ index" returns (mode A).
8. PII gate clean; commit + push source.
