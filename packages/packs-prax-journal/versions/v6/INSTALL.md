# Prax Journal v6 — install

Two artifacts to install. Do them in order.

---

## 1. The journal PDF

Build it once, then transfer to iPad.

```bash
# from repo root
pnpm tsx packages/packs-prax-journal/versions/v6/build-v6-pdf.ts
```

Produces `output/v6-prax-journal.pdf` — a single A4 PDF with all of v6's pages concatenated. AirDrop / iCloud / email it to your iPad, then in Goodnotes:

1. Tap the PDF → Share → **Open in Goodnotes**.
2. When prompted for paper size, choose **A4** (this matches the 210mm page CSS).
3. Goodnotes imports it as a notebook with selectable text, vector strokes, and full typography preserved.

For day-to-day use, **duplicate** the daily-spine pages (3, 4, 5) each morning via long-press → *Duplicate*. The original stays clean as a master template.

---

## 2. The 41-sticker library

See **`stickers/INSTALL.md`** for the full setup — the short version:

- Drag all 41 SVGs from `stickers/` into the Goodnotes **Elements** panel as a *Prax Journal v6* collection. One-time setup, ~3 minutes.
- From any page, tap Elements → tap a sticker → drop it on the page. Resize with the corner handle. Vector, so always crisp.
- The fallback (no Elements panel) is to lasso-copy stickers off page 21 of the imported PDF.

---

## What you'll have

- `output/v6-prax-journal.pdf` — the journal, on iPad, in Goodnotes.
- *Prax Journal v6* — an Elements collection of 41 reusable, scalable, on-tap stickers.

Read `README.md` for tone rubric, design DNA, and the page-by-page table.
Read `stickers/INSTALL.md` for the per-pack sticker reference and the *what-to-stamp-when* lookup.
