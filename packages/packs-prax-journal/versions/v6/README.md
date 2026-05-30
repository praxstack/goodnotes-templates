# Prax Journal v6

A 23-page therapeutic journal for ADHD + MDD + recent loss, built to *survive bad days*. Direction-B card grammar, 41-sticker library, Linehan diary-stamp × Pennebaker symbolic punctuation × Brach RAIN. Designed for Goodnotes on iPad.

---

## What this is

v5 was built for ideal-Prax. v6 is built for 9pm-Tuesday-Prax — the version that opens the journal heavy, restless, and one bad page away from abandoning it for the seventh time.

The design refuses two failure modes: **wellness optimism** (the bright "you got this!" voice that makes a heavy day feel exclude-from-this-app), and **clinical sterility** (the symptom-checklist register that turns the journal into homework). Instead it stamps moments. Past tense. The bee was named. The wave passed. The chair was empty. The hour was crossed alive. Stickers are *receipts* — proof that a noticed moment happened — not goals to chase. The journal rewards recognition; it never rewards compliance.

The 23 pages split into a 3-page daily spine (filled every day, ~7 minutes), a 6-page weekly/monthly shelf (filled at cadence), a 5-page therapy-homework set (locked to Shreya's S4 work — *pick one, the other can wait*), a 3-page if-then card system (Gollwitzer implementation intentions), a 3-page crisis card (with iCall / Vandrevala / AASRA baked in), the 41-sticker library reference, a cover, and an inside-back colophon. Every page is 210mm A4, importable into Goodnotes as native templates with selectable text, vector strokes, and respected typography.

---

## Page-by-page

| # | File | Purpose |
|---|---|---|
| 1 | `01-cover.html` | Title page — *Prax Journal v6*, opening line, no instruction |
| 2 | `02-orientation.html` | One-page how-to-use, directly addresses 6-prior-abandoned-systems |
| 3 | `03-daily-today.html` | Daily spine — morning intention + restlessness row + 3 work blocks |
| 4 | `04-daily-midday.html` | Daily spine — break-card grid + body-felt + if-then column |
| 5 | `05-daily-reflect.html` | Daily spine — wins jar + mood constellation + permission slips |
| 6 | `06-brain-dump.html` | Wide-text page for Pattern Names work — surfaces Ria thread + identity |
| 7 | `07-weekly-arc.html` | 7-day mosaic — moods, wins, restlessness frequency at a glance |
| 8 | `08-weekly-pattern-names.html` | Reflect-cadence — name the recurring threads of the week |
| 9 | `09-monthly-mosaic.html` | 28–31 cell sticker map — the month as a visual receipt |
| 10 | `10-monthly-letter.html` | Long-form letter to self — un-prompted, unstructured |
| 11 | `11-quarterly-witness.html` | Q1–Q4 retrospective — what shifted, what stayed, no goals |
| 12 | `12-shreya-tuesday-morning.html` | Homework #1 — identity-via-mundane-future |
| 13 | `13-shreya-2028-sentence.html` | Homework #2 — identity-via-character |
| 14 | `14-shreya-before-heavy.html` | Homework #3 — pre-grief love (handle with care) |
| 15 | `15-shreya-five-years.html` | Homework #4 — body-anchored fear projection |
| 16 | `16-shreya-experiment.html` | Homework #5 — 30+5 study experiment, ONE data point |
| 17 | `17-if-then-master.html` | Eight pre-committed if-then cards — full reference |
| 18 | `18-if-then-cards-cuttable.html` | Print-and-cut card-stock version (12 per A4) |
| 19 | `19-if-then-blanks.html` | 8 blank if-then templates for new pre-commitments |
| 20 | `20-crisis-card.html` | iCall / Vandrevala / AASRA + TIPP + name a person |
| 21 | `21-sticker-library.html` | Full 41-card reference page (lasso-copy fallback) |
| 22 | `22-sticker-decision-tree.html` | "What sticker for this moment?" flowchart |
| 23 | `23-colophon.html` | Inside-back — design DNA, evidence base, gratitude |

> *Note: pages 1–2 and 6–23 are filled at this writing; only `01-daily-checkin.html` exists in `pages/` as the wave-7 prototype. The build script reads whatever is present and renders that — adding pages is purely a matter of dropping new HTML into `pages/`.*

---

## How to build

The build pipeline turns each `pages/NN-*.html` file into an A4 PDF page, then concatenates all of them into a single import-ready PDF for Goodnotes.

```bash
# from repo root
pnpm tsx packages/packs-prax-journal/versions/v6/build-v6-pdf.ts

# or from this directory
cd packages/packs-prax-journal/versions/v6
npx tsx build-v6-pdf.ts
```

Produces `output/v6-prax-journal.pdf` (~1–4 MB depending on page count).

The script:
- reads `pages/*.html` sorted by NN- prefix
- renders each page with Playwright (Chromium) at A4, with `printBackground: true`
- waits for `document.fonts.ready` so Fraunces / Instrument Sans / JetBrains Mono are fully loaded
- concatenates with `pdf-lib` (no shell deps)
- respects `SOURCE_DATE_EPOCH` for byte-deterministic builds

If `pdf-lib` isn't installed yet:

```bash
pnpm add -D pdf-lib
```

(Playwright is already in this repo's `devDependencies`.)

---

## Refreshing the rotating content (seed reroll)

The journal carries a 200-item content library at `content-library/pool.json`
(50 ADHD coping techniques · 50 anxiety grounding cues · 50 CBT mini-lessons ·
50 attributed quotes). At build time, the pipeline picks one item per
header/footer slot on the 15 form-shaped pages — a different category in each
slot — using a deterministic PRNG seeded from `SOURCE_DATE_EPOCH`.

This means:

```bash
# Same seed → identical PDF byte-for-byte (default seed: 20260529)
npx tsx build-v6-pdf.ts

# Different seed → different content roll, same layout
SOURCE_DATE_EPOCH=$(date +%s) npx tsx build-v6-pdf.ts

# Or any specific number you want to remember
SOURCE_DATE_EPOCH=42 npx tsx build-v6-pdf.ts
```

Use cases:

- **Daily refresh.** Set `SOURCE_DATE_EPOCH=$(date +%s)` once a day to get a
  fresh roll of headers/footers across the 15 form-shaped pages. Re-import
  into Goodnotes as a new notebook to swap the rotation.
- **Reproducible kit for sharing.** Pin `SOURCE_DATE_EPOCH=20260529` (the
  default) and the PDF is byte-identical for anyone who builds it.
- **A/B testing copy.** Build with two different seeds and compare which
  phrasing lands better on a given week.

Adding new items to the pool is just a JSON append to the right category
array (see `content-library/README.md` for schema and the 8-line tone rubric
that every new item must pass).

The 9 archetype-locked pages (02 Brain Dump · 09 Letter to No One · 10 Quote
Permission · 11 Loose Page · 13 Monthly Letter · 15 Homework Cover · 21
Sticker Library · 22 Quick Start · 23 Crisis Card) deliberately carry NO
rotating content — the seed only affects the 15 form-shaped pages.

---

## How to use in Goodnotes

1. **Build the PDF** — `pnpm tsx packages/packs-prax-journal/versions/v6/build-v6-pdf.ts` produces `output/v6-prax-journal.pdf`.
2. **Transfer to iPad** — AirDrop, iCloud Drive, or email the PDF. Goodnotes' iOS share-sheet handles all three natively.
3. **Open in Goodnotes** — tap the PDF → Share → *Open in Goodnotes*. Choose **A4** when prompted. Goodnotes will import as a notebook with selectable text and vector strokes preserved.
4. **Install stickers** — see `stickers/INSTALL.md`. One-time setup: drag all 41 SVGs into the Goodnotes Elements panel as a *Prax Journal v6* collection. From any page, tap-drop-resize.
5. **Daily use** — pages 3–5 are the spine. Duplicate them every morning via Goodnotes' page-add (long-press a page → *Duplicate*). The first duplicate becomes today; the original stays clean as a master template.

The journal does not require daily completion. `25-permission-to-skip` exists for a reason.

---

## Visual DNA — locked tokens

```
paper        #F9F5EC   warm cream, not white — softens 9pm screen-glare
ink          #1f2126   not pure black; never goes glaring
ink-soft     #4A453D   body text, all running prose
ink-quiet    #6E6658   subheaders, captions
ink-whisper  #B5AD9F   hairlines, sticker-card edges
sage         #7e9b85   settling · permission · win
clay         #c08866   restlessness · CBT · crisis · shadow-edge
amber        #d6a45e   activation · break · if-then · in-between
lavender     #a89bbf   held space · mood · pattern · grief
```

```
serif   Fraunces — italic 38pt for titles, 14pt for prompts
sans    Instrument Sans — 8.5pt body, 5.5pt mono kicker uppercase
mono    JetBrains Mono — captions, page numbers, kicker labels
```

Stickers all share: 256×256 viewBox, transparent background, 6px stroke (=2.4px equivalent at typical Goodnotes sticker size), `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"` on the line-art `<g>`. Pack colour is the only varying token across all 41.

---

## Tone rubric

1. Past-tense receipts, not future-tense goals. Stamps recognise; they never instruct.
2. The cognition "I feel like a loser every day" is the **room** the journal works inside, not a problem to be argued with.
3. Wellness-language is contraband. "You got this," "self-care Sunday," "embrace the journey" — banned from every label.
4. Clinical-language is contraband too. "Symptoms," "deficit," "intervention" — banned. The journal is therapeutic, not clinical.
5. Granular-naming is the medicine. "Restlessness named" beats "feelings noticed" because *restless* is a distinct felt state with its own evidence base.
6. The journal carries Shreya's "pick one, the other can wait" verbatim. Self-amplifying it into "do all four" is exactly the pattern v6 was built to interrupt.
7. Permission and Mood are plural because rest, slowness, blankness, unknowing, fallibility, and asking are *categorically distinct* experiences — flattening them loses the texture.
8. The 41 stickers are not decorative. Each one traces to peer-reviewed clinical, contemplative, or behavioural-science literature. The kit is dense by design.
