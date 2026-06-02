# Prax Journal v7 — Cline build

A from-scratch implementation of the **v7 Daily Pilot + Truth Deck**, built in this
`cline/` subdir as a parallel to `../codex/`. Both follow the same approved design:
[`docs/superpowers/specs/2026-06-02-prax-journal-v7-daily-and-truth-deck-design.md`](../docs/superpowers/specs/2026-06-02-prax-journal-v7-daily-and-truth-deck-design.md).

Governing principle: **depth is allowed, debt is not.** Only 2 daily pages are *owed*.

## Quick start

```bash
# from repo root (the pnpm wrapper triggers a deps-check that can fail; call tsx directly)
./node_modules/.bin/tsx cline/build-daily.ts     # 4 daily pages → output/daily-pilot.pdf
./node_modules/.bin/tsx cline/build-cards.ts      # 65 SVG→PNG stickers + flip-deck PDF (~3 min)
./node_modules/.bin/tsx cline/build-extras.ts     # reminders card + 5 as-needed PDFs

open cline/output/daily-pilot.pdf
```

Every build **render-verifies** in headless Chromium and fails loudly on overflow,
footer collision, or sub-7px text — "built" never means "claimed" (spec §7/§8).

## What it produces

| Script | Output | Notes |
|---|---|---|
| `build-daily.ts` | `output/daily-pilot.pdf` (4 pp) + `pages/*.html` | Morning · Brain Dump · Midday · Evening. Morning + Evening are *owed*; the others say *optional* in the header. |
| `build-cards.ts` | `output/stickers/{truth,quote,pill}/*.png` (20/20/25), `contact-sheet.png`, `output/truth-deck-flip.pdf` (66 pp) | Cards authored as **SVG**, rasterised to **transparent PNG** (`omitBackground`) for GoodNotes. Flip-deck opens on the meta-pill **Z1**, one card per page, **no all-cards view** (anti-binge, spec §4.5). |
| `build-extras.ts` | `output/extras/*.pdf` (6) | Permanent reminders card (front/back) + Letter to No One · Therapy Prep/Debrief · Urge/Phone-Reach Log · Monthly Letter · Weekly Strip — each a single-page PDF you insert into GoodNotes when needed. |

## The Truth Deck (the heart of it)

Three register-packs you pick from by what you can handle that morning, then drag a
sticker onto the Morning page's **"today's card:"** box:

- **truth** (calm, sage) — numb days. worth + compassion + the operating rules.
- **quote** (light, sage-soft) — flat days. borrowed wisdom on starting + pace.
- **pill** (mirror + blunt, clay) — restless/avoidant days. keeda · anti-victim · body-urge · night.

Clinical guardrails baked into every pill (spec §4.2/§4.4): it targets the
**behaviour / the story, never the person**; it **always ends in an exit action**;
and it's **never the only option** (truth is always there). People are abstracted;
no medication doses anywhere (spec §5).

## Into GoodNotes

1. **Daily:** open `daily-pilot.pdf` → Print → Save as PDF (margins **None**, background graphics **ON**) → import. Duplicate the Morning/Evening pages per day.
2. **Stickers:** import `output/stickers/<pack>/*.png` as sticker elements; drag onto any page.
3. **Flip-deck:** import `truth-deck-flip.pdf`; swipe to read one card on numb days.
4. **As-needed:** import any `output/extras/*.pdf` page and slot it where you need it.

## Layout

```
cline/
  build-daily.ts     build-cards.ts     build-extras.ts
  pages/             # generated daily HTML (gitignored)
  output/            # generated PDFs + PNG stickers (gitignored)
```

Regenerate anything by re-running its script. Nothing in `output/` or `pages/` is
source — the three `build-*.ts` files are.
