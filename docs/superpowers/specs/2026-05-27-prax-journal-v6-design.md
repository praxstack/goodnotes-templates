# SPEC.md — prax-journal v6 (therapy-grounded companion)

> **Implementation contract.** Any competent engineer (or AI agent) reading this file can build a conforming implementation without asking clarifying questions. v5 stays untouched. v6 ships *alongside* it.
>
> **Status:** v0.1 draft · 27 May 2026 · subject to plan-design-review and plan-eng-review.

---

## 1. Problem Statement

The user (Prax) has a working ADHD/depression-grounded journal pack at `packages/packs-prax-journal/versions/v5/` (7 pages: today · midday · reflect · brain-dump · weekly · monthly · quarterly). It captures the **mechanics** of his condition: pseudo-doing, body-on-chest in kg, thought-flip, craving-surf, wins jar, smoking tally, pattern names (doomscroll · catastrophize · prereq trap · rejection scanner), identity-shifts.

What v5 does **not** capture is everything Shreya Banerjee diagnosed in Session 4 (1 May 2026):

1. **Pseudo-discomfort = restlessness** — a lifelong trait worsening, the central engine
2. **Reward-based motivation collapses** — needs to be value- or identity-based
3. **30-minute work blocks + dopamine-protected breaks** — prescribed, ignored for a week
4. **Sense-of-judgment thread** — carried from S3, not yet worked through
5. **Avoidance → night-shame → withdrawal from Ria** — the relationship cost
6. **Over-commitment** — making goals "somehow unachievable" as a form of avoidance

It also does not capture the **identity-doorway exercise** Prax operationalized himself in `Identity Questions Action Experiment.pdf` (4 questions: Tuesday morning · the sentence · 18-yr-old · fear projection), and lacks the **clinical thermometers** (PHQ-9 · GAD-7 · ASRS) that the AI Therapist persona spec (Dr. Alex Morgan v3.0) calls for.

Finally, v5 has **no read-between pages** — the kind of "real-diary" reading material (quotes, letters, permission slips) that gives an ADHD reader different reading material every day for ~3 months without asking them to write anything.

**v6 closes these gaps in one cohesive pack** — inheriting v5's visual DNA verbatim, alongside the existing v5 pages, while adding therapy-grounded writing pages, a sticker pack, and 72 themed read-between pages.

---

## 2. Goals and Non-Goals

### Goals

- **G1.** Add 7 new full-A4 writing pages capturing Shreya's S4 + Dr. Alex Morgan's screeners + Prax's PDF identity work.
- **G2.** Ship a sticker pack (~30 sticker types) so daily noticing (restlessness · break · wins · patterns · permissions) becomes a stamp-on-any-page workflow, not a fill-in-this-blank ritual.
- **G3.** Ship 72 read-between pages: 30 daily quotes + 12 monthly letters + 30 daily permission slips, themed across 6 weekly themes.
- **G4.** Inherit v5's visual DNA verbatim — A4 portrait, `#F9F5EC` paper, Fraunces (italic, opsz 144) + Instrument Sans + JetBrains Mono, ink/sage/clay/amber/lavender token system. v5 and v6 must look like the same family.
- **G5.** Self-contained HTML pages (matches v5 inlined-fonts pattern). Goodnotes/iPad first; print/PDF second.
- **G6.** Ship as a single workspace package extension at `packages/packs-prax-journal/versions/v6/`. v5 stays in `versions/v5/` untouched. One `package.json`, one render pipeline, sub-folders for the three buckets.
- **G7.** Stickers ship in three formats: individual SVG, individual PNG, printable PDF sticker sheets.
- **G8.** Therapy content authored against named, citable frameworks: Emmons (gratitude), Neff (MSC), Gilbert (CFT), Linehan (DBT), Harris (ACT), Brach (RAIN), Bowen (MBRP), Pressfield, Lamott, Pema Chödrön, Mary Oliver, Rumi, Carl Rogers, BJ Fogg, Gollwitzer, James Clear.
- **G9.** Riya → **Ria** (correct spelling) across all v6 content. Already corrected across mockups in `.superpowers/brainstorm/v6-mockups/`.
- **G10.** Every claim in every artefact carries provenance (timestamp from S4 transcript, PDF section, framework + author + year, or "synthesis").

### Non-Goals

- **NG1.** Replace v5. v5 stays at `versions/v5/`. v6 is additive.
- **NG2.** Diagnose Prax. The screeners are *thermometers*, not diagnoses. Spec must label them as such.
- **NG3.** Substitute for therapy. v6 is the homework artefact between Shreya sessions, not Shreya.
- **NG4.** Ship a mobile app, web SPA, or interactive form. Pages render to static HTML/PDF, then to images Goodnotes can ingest.
- **NG5.** Auto-generate the 72 read-between pages via LLM at runtime. They are **hand-authored** by Claude during the build phase and committed to source. No runtime LLM dependency.
- **NG6.** Provide crisis intervention. The crisis card is a *resource pointer* (helplines, scripts), not a service.
- **NG7.** Personalize content via user data at build time. The 72 read-between pages are static; the stickers are static. Personalization is via Goodnotes (the user picks what to stamp).
- **NG8.** Translate into Hindi at v6 ship time. Some quotes that are originally Hindi (from Shreya's transcript) will appear *as Hindi* in the source. Roman-script transliteration accompanies.
- **NG9.** Migrate v5 content forward. v5 ships unchanged.
- **NG10.** Build a real Dr. Alex Morgan AI agent. The persona doc inspired the screener pages and the session-log; v6 does not call any LLM at runtime.

---

## 3. System Overview

### 3.1 Components

```
packages/packs-prax-journal/
├── package.json                   # workspace package, no v6 changes
├── versions/
│   ├── v5/                        # untouched
│   │   ├── today.html
│   │   ├── midday.html
│   │   ├── reflect.html
│   │   ├── brain-dump.html
│   │   ├── weekly.html
│   │   ├── monthly.html
│   │   └── quarterly.html
│   └── v6/                        # NEW
│       ├── _shared.css            # inherits v5 DNA verbatim
│       ├── _shared.js             # (optional, for any common helpers)
│       ├── pages/                 # full-A4 writing pages
│       │   ├── identity-doorway.html
│       │   ├── judgment-log.html
│       │   ├── ria-thread.html
│       │   ├── screener-phq9.html
│       │   ├── screener-gad7.html
│       │   ├── screener-asrs.html
│       │   └── session-log.html
│       ├── stickers/              # small SVG/PNG components
│       │   ├── manifest.json      # canonical list of all stickers
│       │   ├── svg/               # individual SVG files
│       │   ├── png/               # individual PNG files (1024×1024 source resolution)
│       │   └── sheets/            # printable PDF sheets (A4 layouts)
│       ├── read-between/          # 72 read-only A4 pages
│       │   ├── manifest.json      # rotation metadata
│       │   ├── quotes/            # 30 daily quote pages, theme-keyed
│       │   ├── letters/           # 12 monthly letter pages
│       │   └── permissions/       # 30 daily permission slip pages
│       └── README.md              # how to use, theme map, rotation guide
└── manifest.json                  # registry entry — v6 surfaced as a new pack version
```

### 3.2 External Dependencies

- **Fonts:** Fraunces (display, variable) · Instrument Sans (body, variable) · JetBrains Mono (labels). Inlined as base64 in each page like v5.
- **Fonts Google CDN URLs (build-time only, for development preview):**
  - `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..900,0..100`
  - `https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700`
  - `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600`
- **Build tools:** existing repo's `pnpm`, `tsx`, `@playwright/test` (for PDF rendering), `puppeteer` (for sticker PNG export).
- **Goodnotes:** target consumer for stickers + pages. No SDK dependency at build time.
- **No runtime LLM dependency.** All content is hand-authored and committed.

### 3.3 Out of Scope (system boundary)

- Goodnotes integration plugin (none exists; user imports manually)
- Cross-platform mobile app
- Sync between physical journal and digital
- Voice transcription of journal entries
- AI summarization of journal contents

---

## 4. Core Domain Model

### 4.1 Visual DNA (inherited from v5)

```
:root {
  --page-w: 210mm; --page-h: 297mm; --margin: 10mm;
  --paper: #F9F5EC;
  --ink: #2A2824; --ink-soft: #4A453D; --ink-quiet: #6E6658; --ink-whisper: #B5AD9F;
  --sage: #7B9476; --sage-ink: #4E6249; --sage-tint: rgba(123, 148, 118, 0.08); --sage-edge: rgba(123, 148, 118, 0.22);
  --clay: #B85A44; --clay-ink: #8A3E2E; --clay-tint: rgba(184, 90, 68, 0.07); --clay-edge: rgba(184, 90, 68, 0.25);
  --amber: #C9884A; --amber-ink: #8F5D28; --amber-tint: rgba(201, 136, 74, 0.08); --amber-edge: rgba(201, 136, 74, 0.22);
  --lavender: #B6A9CB; --lavender-ink: #6B5D86; --lavender-tint: rgba(182, 169, 203, 0.10); --lavender-edge: rgba(182, 169, 203, 0.28);
  --font-serif: 'Fraunces', Georgia, serif;
  --font-sans:  'Instrument Sans', system-ui, sans-serif;
  --font-mono:  'JetBrains Mono', Consolas, monospace;
}
```

**Implementation note.** v6's `_shared.css` MUST be byte-equivalent to v5 inheritance for the variables above. Any deviation breaks the family look. The shared file inherits v5; it does not re-define those tokens differently.

### 4.2 Page entity

A `Page` is a full-A4 portrait HTML document with:

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `id` | string | yes | — | kebab-case slug, must match filename minus `.html` |
| `version` | string | yes | `"v6"` | must be `"v6"` |
| `kind` | enum | yes | — | one of `writing` \| `read-between` \| `screener` |
| `cadence` | enum | yes | — | one of `daily` \| `weekly` \| `monthly` \| `quarterly` \| `one-shot` \| `as-needed` |
| `title` | string | yes | — | shown in `<title>` and `<h1>` |
| `theme` | enum | for read-between only | — | one of the 6 themes (§7.1) or `crisis` for crisis-card |
| `provenance` | array<string> | yes | — | citation list — each entry: `"<source>: <reference>"` |
| `paper` | css var | yes | `var(--paper)` | always `#F9F5EC` |
| `dimensions` | object | yes | A4 portrait | `{ w: '210mm', h: '297mm' }` |

Stored as: HTML files + frontmatter-equivalent in a YAML/JSON sidecar OR as `<meta>` tags inside the HTML head. **Decision:** use HTML `<meta>` tags + a manifest.json that aggregates them.

### 4.3 Sticker entity

A `Sticker` is a small reusable visual component, exportable as SVG and PNG.

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `id` | string | yes | — | kebab-case slug |
| `category` | enum | yes | — | `restlessness` \| `break` \| `wins` \| `mood` \| `cbt` \| `dbt` \| `pattern` \| `permission` \| `if-then` \| `crisis` |
| `dimensions_mm` | object | yes | — | `{ w: number, h: number }`, max 80×80mm, min 15×15mm |
| `colorway` | enum | yes | — | one of: `ink` \| `sage` \| `clay` \| `amber` \| `lavender` (matches color tokens) |
| `transparent_bg` | boolean | yes | `true` | PNG alpha channel; SVG no `<rect>` background |
| `formats` | array | yes | `["svg", "png"]` | always both |
| `png_resolution` | number | yes | `1024` | longest edge in pixels at source |
| `text_baked` | boolean | yes | — | `true` if text is part of the asset; `false` if user writes on it in Goodnotes |
| `provenance` | array<string> | yes | — | citation list |

### 4.4 Read-between entity (72 of these)

A `ReadBetween` is a full-A4 page that the user reads, not writes on.

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| `id` | string | yes | — | kebab-case slug |
| `subkind` | enum | yes | — | `quote` \| `letter` \| `permission` |
| `theme` | enum | yes | — | one of 6 themes (§7.1) |
| `cadence` | enum | yes | — | `daily` for quotes/permissions, `monthly` for letters |
| `slot` | integer | yes | — | for quotes/permissions: 1–30; for letters: 1–12 |
| `title` | string | yes | — | shown at top of page |
| `body` | string | yes | — | the actual readable content |
| `attribution` | string | yes for quotes; `null` for permissions; signature line for letters | — | "Author, Source, Year" |
| `provenance` | array<string> | yes | — | citation list |

### 4.5 Build artefacts (output)

- **Per page:** one `.html` file (self-contained, fonts inlined) + one `.pdf` (rendered via Playwright) + one `.png` (1240×1754 = A4 @ 150dpi for Goodnotes sticker import).
- **Per sticker:** one `.svg`, one `.png` (1024×1024 max edge, transparent), and inclusion on at least one sheet PDF.
- **Sheets:** ~5–8 PDF sticker sheets (A4) grouping ~6–9 stickers each.
- **Manifest:** `pages/manifest.json`, `stickers/manifest.json`, `read-between/manifest.json` listing all artefacts.

---

## 5. Domain-Specific Contracts

### 5.1 Page contract — required structure

Every `pages/*.html` page MUST contain:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="prax-journal:id" content="<page-id>">
  <meta name="prax-journal:version" content="v6">
  <meta name="prax-journal:kind" content="writing|read-between|screener">
  <meta name="prax-journal:cadence" content="daily|weekly|monthly|quarterly|one-shot|as-needed">
  <meta name="prax-journal:theme" content="<theme>"> <!-- only for read-between -->
  <title>Prax Journal v6 — <Title></title>
  <link rel="stylesheet" href="../_shared.css">
  <style>/* page-specific overrides */</style>
</head>
<body>
  <div class="page">
    <div class="edge-tag"><page-id> · v6</div>
    <div class="runner"><!-- date · h1 · doy --></div>
    <!-- content blocks -->
    <div class="footer"><!-- provenance line --></div>
  </div>
</body>
</html>
```

**Important boundary.** Every writing page's `<div class="page">` MUST be exactly 210mm × 297mm. Pages MUST NOT scroll on print. Use `overflow: clip` on `.page` (already in v5 `_shared.css`).

### 5.2 Sticker contract — required structure

Every `stickers/svg/<id>.svg` MUST be:

- Single-file SVG (no external `<image>` references)
- Width/height set in mm to match `dimensions_mm`
- ViewBox set so 1 user unit = 1mm
- All text uses one of the three project fonts; either embed font subsets or use textPath with system fallback
- Background transparent (no white rect)
- Stroke widths in mm (e.g. `0.3mm`)
- IDs prefixed with sticker `id` to prevent collisions when multiple stickers are on the same page

PNG export: 1024px on the longest edge, transparent alpha, source from SVG via `headless-chrome --screenshot`.

### 5.3 Read-between contract — required structure

Read-between pages MUST contain:

- `<meta name="prax-journal:subkind" content="quote|letter|permission">`
- `<meta name="prax-journal:theme" content="<theme-name>">`
- `<meta name="prax-journal:slot" content="<slot-number>">`
- A theme indicator visible on the page (small color chip top-right)
- Attribution at the bottom (or signature for letters)
- No interactive elements; no form inputs; no writing surface

---

## 6. Configuration Specification

### 6.1 Build configuration

`packages/packs-prax-journal/versions/v6/config.json`:

```json
{
  "version": "v6.0.0",
  "themes": [
    { "id": "avoidance",        "color": "clay",     "weekday_default": 1 },
    { "id": "restlessness",     "color": "amber",    "weekday_default": 2 },
    { "id": "identity",         "color": "lavender", "weekday_default": 3 },
    { "id": "ria",              "color": "clay",     "weekday_default": 4 },
    { "id": "break-discipline", "color": "amber",    "weekday_default": 5 },
    { "id": "self-compassion",  "color": "sage",     "weekday_default": 6 }
  ],
  "rotation": {
    "quotes":      { "cycle_days": 30, "themed": true },
    "permissions": { "cycle_days": 30, "themed": true },
    "letters":     { "cycle_months": 12, "themed": false }
  },
  "client": {
    "name": "Prax",
    "partner_name": "Ria",
    "therapist_name": "Shreya"
  },
  "render": {
    "page_size": "A4",
    "page_dpi": 150,
    "fonts_inline": true,
    "render_outputs": ["html", "pdf", "png"]
  }
}
```

### 6.2 Configuration cheat-sheet (for agent consumption)

| Key | Type | Default | Meaning |
|---|---|---|---|
| `version` | string | `"v6.0.0"` | Pack version, semver |
| `themes` | array | (see above) | The 6 weekly themes |
| `themes[].id` | string | — | Theme slug |
| `themes[].color` | enum | — | One of: `ink`, `sage`, `clay`, `amber`, `lavender` |
| `themes[].weekday_default` | int | 1–6 | Suggested weekday (Mon=1, Sat=6, Sun=rest/no-theme) |
| `rotation.quotes.cycle_days` | int | `30` | Day-N maps to quote-N |
| `rotation.quotes.themed` | bool | `true` | If true, theme rotates the quote pool |
| `rotation.letters.cycle_months` | int | `12` | Month-N maps to letter-N |
| `client.name` | string | `"Prax"` | First-person referent in content |
| `client.partner_name` | string | `"Ria"` | Partner referent |
| `client.therapist_name` | string | `"Shreya"` | Therapist referent in attributions |
| `render.page_size` | string | `"A4"` | Always A4 portrait |
| `render.fonts_inline` | bool | `true` | Inline base64 fonts (matches v5) |

**Important nuance.** `client.name`, `client.partner_name`, and `client.therapist_name` ship as defaults inline. They are NOT externalized at runtime. Future versions (v6.1+) MAY templatize them; v6.0 hard-codes them in source files.

---

## 7. Themes & Rotation Logic

### 7.1 The 6 Themes

| # | Theme ID | Color | Anchor Quote | Source |
|---|---|---|---|---|
| 1 | `avoidance` | clay | "Then shame comes when you're going to sleep at night." | Shreya S4, 00:18:22 |
| 2 | `restlessness` | amber | "Your pseudo discomfort is restlessness." | Shreya S4, 00:23:03 |
| 3 | `identity` | lavender | "How do you want to make yourself?" | Shreya S4, 00:32:32 |
| 4 | `ria` | clay | "I had a hard day with myself. I'm here." | Synthesis (Prax PDF + S4 00:18:28) |
| 5 | `break-discipline` | amber | "We can't feed ourselves with dopamine. Even in the break." | Shreya S4, 00:46:50 |
| 6 | `self-compassion` | sage | "Permission renews on its own." | Synthesis (Neff MSC + Brach RAIN) |

### 7.2 Rotation algorithm — pseudocode

```
# For 30 daily quotes / 30 daily permissions:
function get_quote_for_day(N):
  # N is day-of-month (1..30) or day-since-pack-opened (1..30, then wraps)
  return quotes[N - 1]

function get_permission_for_day(N):
  return permissions[N - 1]

function get_letter_for_month(M):
  # M is 1..12
  return letters[M - 1]

# Theme assignment for the 30 quotes (and 30 permissions):
# Slots 1-5: avoidance (theme 1)
# Slots 6-10: restlessness (theme 2)
# Slots 11-15: identity (theme 3)
# Slots 16-20: ria (theme 4)
# Slots 21-25: break-discipline (theme 5)
# Slots 26-30: self-compassion (theme 6)
#
# This means: by day 5, the user has seen 5 quotes about avoidance.
# By day 30, they've seen 5 from each of the 6 themes.
# The 12 letters are NOT theme-bound; they follow their own narrative arc (§13).
```

**Important nuance.** The rotation is *positional*, not date-based. If the user starts on the 15th of June, day 1 = quote-1. Goodnotes does not enforce a date binding; the user just opens whichever quote they're "on." A reading-order indicator (`1/30` in the corner) helps them track.

### 7.3 Letter sequence (the 12-month narrative arc)

Letters do NOT theme by week; they follow a narrative across the year. The 12 letter archetypes (§13) are designed so that re-reading them in order builds a self-portrait:

1. From your 18-yr-old self (foundational)
2. From your future self (orientation)
3. From your shame, on a quiet day (RAIN-style internal voice work)
4. From Ria, on a good night (relational mirror)
5. From a part of you that loves the work (IFS-Self)
6. From your therapist (Shreya frame)
7. From your brother (sibling witness)
8. From the version of you that lived through this (post-arrival)
9. From a former Amazon colleague (career-trauma reframe)
10. From the body (somatic)
11. From the version of you who said no (boundary)
12. From the dead (Pema Chödrön / mortality lens — closing the year)

---

## 8. Subsystem Contract — Pages (the 7 v6 writing pages)

### 8.1 `pages/identity-doorway.html` — weekly

**Purpose.** The 4 PDF questions verbatim. Operationalizes Shreya's "तुम खुद को कैसे बनाना चाहते हो?" into specific gut-level entry points.

**Cadence.** Weekly. Suggested: Sunday or whatever day the user does longer reflection.

**Content blocks (top-to-bottom):**
1. Top runner: date · "doorways" · "id / not goals"
2. Pull quote: "Who do you want to be?" is too big to answer cold + framing strip
3. 2×2 grid of 4 doorway cards (A, B, C, D from the PDF)
4. Rules-for-answering strip (lavender-tinted, dashed border)
5. Footer: provenance to PDF + Shreya S4

**Layout reference.** `.superpowers/brainstorm/v6-mockups/03-identity-doorway.html` (already built, reviewed visual DNA confirmed).

**Provenance:** `Identity Questions Action Experiment.pdf` (your authored PDF) + Shreya S4 00:32:32

### 8.2 `pages/judgment-log.html` — weekly

**Purpose.** Catch the "constant sense of judgment" thread from S3 → S4 (00:28:03), specifically: which voice is judging, and would you say that to a friend?

**Cadence.** Weekly.

**Content blocks:**
1. Runner: "whose voice?" · thread S3→S4→S5
2. Pull quote on judgment as a felt-sense (not a fact)
3. 3 row entries (one moment per row): trigger, sentence-in-head, voice-source pills (parent/manager/cousin/past-me/unknown)
4. Friend-test box (would you say this to a friend?)
5. Week tally (M T W T F S S, judge-spoke count per day)
6. Footer: provenance

**Layout reference.** `04-judgment-log.html`

**Provenance:** Shreya S4 00:28:03 (callback to S3 thread)

### 8.3 `pages/ria-thread.html` — weekly

**Purpose.** Map the avoidance → night-shame → withdrawal-from-Ria → isolation cycle. Track its weekly rhythm. Find the 2-minute repair.

**Cadence.** Weekly.

**Content blocks:**
1. Runner: "the cycle" · S4 open thread
2. Loop diagram with 4 steps (avoidance → night-shame → withdrawal → isolation)
3. Week grid (5 rows × 7 days): avoided · shame-at-night · withdrew · talked-anyway · connection-score
4. Two cards: protect-cost question (clay) + small-move-this-week (sage) + the one-line truth ("I had a hard day with myself. I'm here.")
5. Closing pull-quote: "The relationship cost is the data."
6. Footer: provenance

**Layout reference.** `05-ria-thread.html` (Riya already corrected to Ria)

**Provenance:** Shreya S4 00:18:28

### 8.4 `pages/screener-phq9.html` — monthly

**Purpose.** Validated 9-item depression screener (Spitzer/Kroenke/Williams, public domain). Take it monthly. Watch the trend.

**Cadence.** Monthly. Same day as GAD-7.

**Content blocks:**
1. Runner: month + year · "phq-9" · 9q · depression
2. Header: "Over the last 2 weeks" framing
3. 9-question Likert grid (Not at all / Several days / More than half / Nearly every day = 0/1/2/3 scoring)
4. Q9 crisis cue (any non-zero answer triggers helpline reminder)
5. Total score box + 5 scoring bands (0-4 minimal · 5-9 mild · 10-14 moderate · 15-19 mod-severe · 20-27 severe)
6. 12-month trend graph (one bar per month, fillable by hand)
7. Footer: provenance + "not a diagnosis · a thermometer"

**Layout reference.** `06-screener-phq9.html`

**Provenance:** Spitzer, Kroenke, Williams (1999/2001) — Patient Health Questionnaire-9. Public domain. Cited via Dr. Alex Morgan v3.0 §10.

### 8.5 `pages/screener-gad7.html` — monthly

**Purpose.** Validated 7-item anxiety screener. Pair with PHQ-9 same day.

**Cadence.** Monthly.

**Content blocks:** Mirror PHQ-9 layout. 7 questions instead of 9. 4 scoring bands (0-4 · 5-9 · 10-14 · 15-21). Q5 ("being so restless that it is hard to sit still") highlighted with a clay annotation: "(this one's yours)". 12-month trend grid.

**Layout reference.** `07-screener-gad7.html`

**Provenance:** Spitzer, Kroenke, Williams, Löwe (2006) — GAD-7. Public domain.

### 8.6 `pages/screener-asrs.html` — one-shot

**Purpose.** WHO Adult ADHD Self-Report Scale Part A (6 questions). Take *once*; re-take only if life context shifts dramatically.

**Cadence.** One-shot (with re-take noted in usage guide).

**Content blocks:** Mirror screener layout. 6 questions, 5 columns (never/rarely/sometimes/often/very-often). **Shaded zones** mark positive markers. Q6 ("compelled to do things, like driven by a motor") annotated: "(I cannot wait)". Total positive markers / 6. Scoring band: 4+ = symptoms highly consistent with ADHD. Functional impairment open prompts at bottom.

**Layout reference.** `08-screener-asrs.html`

**Provenance:** Kessler et al. (2005), WHO Composite International Diagnostic Interview. Public domain.

### 8.7 `pages/session-log.html` — quarterly

**Purpose.** Clinical-file-lite: 3 Shreya sessions per quarter. Brought-in / walked-away / homework-done / open-thread. Page to bring to next session.

**Cadence.** Quarterly.

**Content blocks:**
1. Runner: quarter + year · "sessions" · 3 sessions
2. Header strip: 3 cards (intro · template-attribution · session-count)
3. 3 session blocks. Each block: left rail (session number, date, duration, vibe pills) + right grid (brought-in · walked-away-with · homework + done-checks · open-thread)
4. Bottom strip: threads alive across sessions (lavender, columned list)
5. Footer: provenance to Dr. Alex Morgan v3 §10

**Layout reference.** `09-session-log.html`

**Provenance:** Dr. Alex Morgan v3.0, §10 Session Notes template (your authored persona doc).

---

## 9. Subsystem Contract — Stickers (~30 sticker types)

Stickers are individual SVG/PNG files + grouped into PDF sheets. They are stamped into Goodnotes onto v5 or v6 pages.

### 9.1 Sticker categories (10 categories, ~30 types total)

#### 9.1.1 Restlessness stickers (5)

Source: page `01-restlessness-log.html`. Now atomized into stamps.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `restlessness-noticed` | 28×16mm | sage | yes ("noticed") | stamp on a moment when you spotted restlessness without acting |
| `restlessness-surfed` | 28×16mm | amber | yes ("surfed") | stamp when you waited 60s and the urge faded |
| `restlessness-acted` | 28×16mm | clay | yes ("acted") | stamp when you scrolled / ordered / smoked / left task |
| `restlessness-row` | 76×24mm | ink | partial (time + disguise blanks) | full row to write in a one-line restlessness moment |
| `restlessness-tally` | 30×30mm | lavender | partial (4-cell tally) | end-of-day tally: noticed / surfed / acted / total |

#### 9.1.2 Break protocol stickers (4)

Source: page `02-break-card.html`.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `break-30min` | 50×30mm | ink | yes ("30 min · one task · timer on") | stamp when you start a 30-min block |
| `break-analog` | 50×30mm | sage | yes ("5–10 min · analog only") | stamp when you start an analog break |
| `break-observe` | 50×30mm | amber | yes ("observe · one data point") | stamp when you check in after the break |
| `break-restart` | 50×30mm | sage | yes ("∞ restart · still session 1") | stamp when you bailed and restarted |

#### 9.1.3 Wins stickers (3)

Source: v5 wins jar (atomized).

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `win-tiny` | 24×16mm | sage | yes ("tiny win") | stamp on any win, however small |
| `win-effort` | 24×16mm | amber | yes ("counted") | stamp when effort happened, regardless of outcome |
| `win-streak` | 24×16mm | clay | yes ("3-in-a-row") | stamp on a 3rd consecutive day of any habit |

#### 9.1.4 Mood stickers (3)

Source: v5 mood dot.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `mood-sage` | 18×18mm | sage | no | calm / steady |
| `mood-amber` | 18×18mm | amber | no | restless / activated |
| `mood-clay` | 18×18mm | clay | no | heavy / shame |

#### 9.1.5 CBT thought-flip stickers (3)

Source: v5 thought-flip.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `thought-catch` | 60×20mm | clay | partial ("catch:" + blank) | stamp + write the automatic thought |
| `thought-question` | 60×20mm | amber | partial ("is this true?" + blank) | challenge it |
| `thought-flip` | 60×20mm | sage | partial ("kinder:" + blank) | the re-frame |

#### 9.1.6 DBT urge-surf stickers (1)

Source: v5 craving surf + Linehan / Bowen.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `urge-surf` | 50×35mm | amber | yes (60-second wave-rider, "this passes too") | stamp + sit with the urge for 60 seconds |

#### 9.1.7 Pattern names stickers (4)

Source: v5 weekly pattern tally — atomized.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `pattern-doomscroll` | 40×16mm | clay | yes ("doomscroll") | stamp when this pattern ran today |
| `pattern-catastrophize` | 40×16mm | clay | yes ("catastrophize") | ditto |
| `pattern-prereq` | 40×16mm | clay | yes ("prereq trap") | ditto |
| `pattern-rejection` | 40×16mm | clay | yes ("rejection scanner") | ditto |

#### 9.1.8 Permission slip stickers (6)

Source: page `12-interlude-permission.html` atomized.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `permission-tired` | 44×30mm | sage | yes ("you may be tired today") | stamp when you need it |
| `permission-small` | 44×30mm | amber | yes ("you may start absurdly small") | ditto |
| `permission-unknown` | 44×30mm | lavender | yes ("you may not know yet") | ditto |
| `permission-restart` | 44×30mm | clay | yes ("you may drop the streak") | ditto |
| `permission-quiet` | 44×30mm | ink | yes ("you may be quiet with Ria") | ditto |
| `permission-renew` | 44×30mm | sage | yes ("you may do this again tomorrow") | ditto |

#### 9.1.9 If-then stickers (8)

Source: page `14-if-then-cards.html` atomized.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `if-then-youtube` | 76×30mm | clay | yes (full if-then) | the YouTube urge → water trick |
| `if-then-break-long` | 76×30mm | sage | yes (full if-then) | break heading past 10min → close tabs, walk lap |
| `if-then-ambitious` | 76×30mm | amber | yes (full if-then) | ambitious to-do → cut in half twice |
| `if-then-judgment` | 76×30mm | lavender | yes (full if-then) | felt-judgment → name whose voice |
| `if-then-buy-now` | 76×30mm | clay | yes (full if-then) | want to order/buy/scroll → 60s sit-still |
| `if-then-shame-night` | 76×30mm | sage | yes (full if-then) | bedtime shame → "I had a hard day. I'm here." |
| `if-then-bailed` | 76×30mm | amber | yes (full if-then) | bailed on 30 → next 30 today, not tomorrow |
| `if-then-blank` | 76×30mm | ink | partial (blank if/then) | user fills their own |

#### 9.1.10 Crisis cue stickers (4)

Source: page `13-crisis-card.html` atomized.

| ID | Size | Color | Text baked? | Use |
|---|---|---|---|---|
| `crisis-helpline` | 64×40mm | clay | yes (iCall + Vandrevala numbers) | stamp on bedside / wallet page |
| `crisis-people` | 64×40mm | ink | partial (5-row blank phonebook) | fill 5 contacts |
| `crisis-warning` | 64×40mm | clay | yes (warning signs) | reference list |
| `crisis-stay-alive` | 64×40mm | sage | yes (90-min plan) | the protocol |

**Total: 41 sticker types** (slight expansion from "~30" in v0 spec — final count locked here).

### 9.2 Sticker sheets (PDF deliverables)

| Sheet | Stickers | A4 Layout |
|---|---|---|
| `sheet-restlessness.pdf` | 5 restlessness types × 4 instances each = 20 | 4×5 grid |
| `sheet-break.pdf` | 4 break × 3 instances + 4 if-then-related × 1 = 16 | 4×4 grid |
| `sheet-wins-mood.pdf` | 3 wins × 6 + 3 mood × 6 = 36 | 6×6 grid |
| `sheet-cbt-dbt.pdf` | 3 thought-flip × 4 + 1 urge-surf × 4 = 16 | 4×4 grid |
| `sheet-patterns.pdf` | 4 patterns × 6 = 24 | 4×6 grid |
| `sheet-permissions.pdf` | 6 permission × 4 = 24 | 4×6 grid |
| `sheet-if-then.pdf` | 8 if-then × 2 = 16 | 4×4 grid |
| `sheet-crisis.pdf` | 4 crisis × 1 large = 4 | 2×2 grid |

**Total sheets: 8 PDFs.** Each sheet uses the same `_shared.css` for visual consistency, and includes cut-line guides (dashed) between stickers.

---

## 10. Subsystem Contract — Read-Between Pages (72 total)

This is the largest content workload. Every artefact is hand-authored against named frameworks. The spec lists every slot with its title, body shape, attribution, theme, and provenance.

**Authorship ground rules (apply to all 72):**

1. **Real, not aspirational.** Content speaks to Prax's actual situation — restlessness, ADHD, post-Amazon shame, identity-vs-reward motivation, Ria, smoking, study avoidance. No generic "manifest your best self" content.
2. **Short.** Quotes ≤ 25 words. Permissions ≤ 60 words. Letters 250–450 words.
3. **Borrow rather than invent where possible.** Pull from named therapists/contemplatives. Mark synthesis explicitly when it's mine.
4. **No streak language.** Nothing reinforces "X days in a row" — Prax's perfectionism breaks streaks. Permission to drop the streak is a recurring motif.
5. **Body-first where possible.** Avoid pure cognition. Reference body sensation when the framework supports it (CFT, MSC, somatic).
6. **Hindi where it lands harder.** Some quotes from Shreya are in Hindi (Devanagari + Roman transliteration). Don't translate them out.
7. **Attribution honesty.** If a quote is paraphrased, mark it "after [Author]". If it's synthesis, mark it "synthesis (after [framework])".

**Frameworks used (the citation pool):**

- **Robert Emmons** — gratitude research; Univ. of California, Davis. *Thanks!* (2007)
- **Martin Seligman** — Positive Psychology; *Flourish* (2011); "Three Good Things" exercise
- **Kristin Neff** — Mindful Self-Compassion (MSC); self-kindness/common-humanity/mindfulness model; *Self-Compassion* (2011)
- **Paul Gilbert** — Compassion-Focused Therapy (CFT); *The Compassionate Mind* (2009); 3-systems affect regulation model
- **Marsha Linehan** — Dialectical Behavior Therapy (DBT); urge-surfing; *DBT Skills Training Manual* (2014)
- **Russ Harris** — Acceptance and Commitment Therapy (ACT); *The Happiness Trap* (2008); *The Confidence Gap* (2010); "expansion" practice
- **Tara Brach** — RAIN (Recognize · Allow · Investigate · Nurture); *Radical Acceptance* (2003); *Radical Compassion* (2019)
- **Sarah Bowen** — Mindfulness-Based Relapse Prevention (MBRP); urge-surfing for substance/behavioral cravings
- **Jon Kabat-Zinn** — MBSR; *Wherever You Go, There You Are* (1994); body-scan and present-moment work
- **Pema Chödrön** — *When Things Fall Apart* (1997); *The Places That Scare You* (2001); shenpa (the hook)
- **Steven Pressfield** — *The War of Art* (2002); resistance as the universal force
- **Anne Lamott** — *Bird by Bird* (1994); "shitty first drafts"
- **Mary Oliver** — poet; "your one wild and precious life"; *New and Selected Poems* (1992)
- **Rumi** — 13th c. Sufi poet; the guest house metaphor (*Coleman Barks translation*)
- **Carl Rogers** — *On Becoming a Person* (1961); unconditional positive regard
- **Brené Brown** — *Daring Greatly* (2012); shame resilience
- **BJ Fogg** — Tiny Habits (2019); B=MAP behavior model
- **Peter Gollwitzer** — Implementation Intentions (1999); if-then planning
- **James Clear** — *Atomic Habits* (2018); identity-based habits
- **David Burns** — *Feeling Good* (1980); cognitive behavioral therapy basics
- **Richard Schwartz** — Internal Family Systems; *No Bad Parts* (2021)
- **Cheryl Strayed** — *Tiny Beautiful Things* (2012); compassionate-witness letter form
- **Edith Eger** — *The Choice* (2017); choosing one's response
- **Cal Newport** — *Deep Work* (2016); attention as scarce resource
- **Sasha Hamdani** — *Self-Care for People with ADHD* (2022)
- **Byron Katie** — *Loving What Is* (2002); "is it true?" inquiry
- **Naomi Shihab Nye** — poet; "Kindness"
- **David Whyte** — poet; *The House of Belonging* (1997)
- **Padmasambhava** / Tibetan tradition — bardo teachings on impermanence

**File naming convention:**

```
read-between/quotes/01-quote-avoidance-shame-night.html
read-between/quotes/02-quote-avoidance-…
…
read-between/quotes/30-quote-self-compassion-renew.html

read-between/letters/01-letter-from-18-yr-old-self.html
…
read-between/letters/12-letter-from-the-dead.html

read-between/permissions/01-permission-tired-today.html
…
read-between/permissions/30-permission-…
```

---

## 11. The 30 Quotes (full content brief)

> Each quote is exactly one A4 page. Layout: full-bleed, dotted parchment background, large Fraunces italic centered, attribution in mono SC small caps below a thin rule. Theme color chip in top-right corner. See mockup `10-interlude-quote.html` for layout.

### Theme 1 — Avoidance (slots 1–5, color: clay)

| Slot | Title (h-tag) | Body (≤25 words) | Attribution | Provenance |
|---|---|---|---|---|
| 01 | **the work is on the other side of the resistance** | "Resistance is experienced as fear; the degree of fear equals the strength of Resistance." | Steven Pressfield, *The War of Art*, 2002 | direct quote |
| 02 | **shame is the cost · don't pay it twice** | "If we own the story then we can write the ending." | Brené Brown, *Daring Greatly*, 2012 | direct quote |
| 03 | **starting is the whole game** | "You don't have to see the whole staircase, just take the first step." | Martin Luther King Jr., 1963 | direct quote |
| 04 | **the avoiding is the loop** | "रात को shame आता है." → "Night brings the shame." | Prax, S4 transcript 00:18:22 | direct quote (own words) |
| 05 | **stop researching · start moving** | "It's not the load that breaks you, it's the way you carry it." | Lou Holtz; popularized via Lena Horne | direct quote |

### Theme 2 — Restlessness (slots 6–10, color: amber)

| Slot | Title | Body | Attribution | Provenance |
|---|---|---|---|---|
| 06 | **the discomfort isn't the work** | "उस पे respond नहीं करना है." → "You don't have to respond to it." | Shreya, S4 transcript 00:23:07 | direct quote |
| 07 | **wait is a verb** | "Patience is a sub-skill of love." | David Whyte, *Consolations*, 2014 | after Whyte |
| 08 | **the urge passes you, not the other way around** | "This too shall pass — even the wanting it to pass." | synthesis (after Linehan + Bowen) | synthesis |
| 09 | **restless from childhood ≠ broken** | "Whatever has to do with the body, has to do with the soul." | Mary Oliver, *Upstream*, 2016 | after Oliver |
| 10 | **you cannot wait — and you have waited before** | "It is in your moments of decision that your destiny is shaped." | Tony Robbins; widely circulated | direct quote |

### Theme 3 — Identity (slots 11–15, color: lavender)

| Slot | Title | Body | Attribution | Provenance |
|---|---|---|---|---|
| 11 | **identity is a doorway, not an answer** | "तुम खुद को कैसे बनाना चाहते हो?" → "How do you want to make yourself?" | Shreya, S4 transcript 00:32:32 | direct quote |
| 12 | **you become what you do, not what you intend** | "Every action you take is a vote for the type of person you wish to become." | James Clear, *Atomic Habits*, 2018 | direct quote |
| 13 | **before everything got heavy** | "Tell me, what is it you plan to do with your one wild and precious life?" | Mary Oliver, "The Summer Day", 1990 | direct quote |
| 14 | **becoming is enough** | "What you seek is seeking you." | Rumi, 13th c. (Coleman Barks tr.) | direct quote |
| 15 | **you don't have to know yet** | "I don't know" is information too. | from Prax's own PDF, *Identity Questions Action Experiment*, 2026 | direct quote (own words) |

### Theme 4 — Ria / Relationship (slots 16–20, color: clay)

| Slot | Title | Body | Attribution | Provenance |
|---|---|---|---|---|
| 16 | **don't let avoidance compound into isolation** | "Vulnerability is not weakness; it's our greatest measure of courage." | Brené Brown, *Daring Greatly*, 2012 | direct quote |
| 17 | **one line is enough** | "I had a hard day with myself. I'm here." | synthesis · the v6 borrow-able script | synthesis |
| 18 | **she sees you anyway** | "Be kind, for everyone you meet is fighting a hard battle." | Ian Maclaren, 1898 (often misattrib. Plato) | direct quote |
| 19 | **the relationship is paying the bill** | "Love is what we were born with. Fear is what we learned here." | Marianne Williamson, *A Return to Love*, 1992 | direct quote |
| 20 | **show up before you feel ready** | "You can't think your way into right action; you can act your way into right thinking." | William James (popularized via 12-step) | direct quote |

### Theme 5 — Break-discipline (slots 21–25, color: amber)

| Slot | Title | Body | Attribution | Provenance |
|---|---|---|---|---|
| 21 | **the break is the work too** | "हम dopamine से खुद को feed नहीं कर सकते. Even in the break." → "We can't feed ourselves with dopamine. Even in the break." | Shreya, S4 transcript 00:46:50 | direct quote |
| 22 | **30 minutes is plenty** | "It is enough to take care of one moment, one breath at a time." | Jon Kabat-Zinn, *Wherever You Go, There You Are*, 1994 | direct quote |
| 23 | **analog is the antidote** | "Attention is the rarest and purest form of generosity." | Simone Weil, *First and Last Notebooks*, 1970 | direct quote |
| 24 | **timer wins** | "If you do not change direction, you may end up where you are heading." | Lao Tzu (often-circulated tr.) | direct quote |
| 25 | **bailed is still session 1** | "Tiny is mighty." | BJ Fogg, *Tiny Habits*, 2019 | after Fogg |

### Theme 6 — Self-Compassion (slots 26–30, color: sage)

| Slot | Title | Body | Attribution | Provenance |
|---|---|---|---|---|
| 26 | **you would say it kinder to a friend** | "Self-compassion is, simply put, compassion turned inward." | Kristin Neff, *Self-Compassion*, 2011 | direct quote |
| 27 | **welcome the visitor at the door** | "This being human is a guest house. Every morning a new arrival." | Rumi, "The Guest House" (Coleman Barks tr.) | direct quote |
| 28 | **rain it · don't fight it** | "Recognize · Allow · Investigate · Nurture." | Tara Brach, *Radical Compassion*, 2019 | direct quote |
| 29 | **you are allowed to be tired today** | "Rest is not idle, is not a luxury, is not a passing fancy. It is essential." | Tricia Hersey, *Rest is Resistance*, 2022 | direct quote |
| 30 | **permission renews on its own** | "Look at you, alive again on a morning you were not promised." | Naomi Shihab Nye (paraphrased style after "Kindness") | after Nye |

**Layout per quote page:** see `.superpowers/brainstorm/v6-mockups/10-interlude-quote.html`. Apply the per-slot title, body, and attribution. Theme color chip in top-right.

---

## 12. The 30 Permission Slips (full content brief)

> Each permission is exactly one A4 page. Layout: 6-card grid like mockup `12-interlude-permission.html`, but each *slot* is ONE permission slip rendered large (one card per page = one permission). Page A4. Card: ~120mm × 160mm, large title, 2-3 short paragraphs of body, signature line at bottom.
>
> **Important nuance.** The mockup `12-interlude-permission.html` shows 6 permissions on one page — that mockup is the *sticker source*. The 30 read-between permission *pages* are 30 separate pages, one permission each, with much more lung-room.

### Theme 1 — Avoidance (slots 1–5, color: clay)

| Slot | Title (Fraunces italic, large) | Body (≤60 words) | Provenance |
|---|---|---|---|
| 01 | **you may close the laptop** | The unanswered emails will still be unanswered tomorrow. The closed laptop is not a failure; it is a boundary. The discomfort of unfinished is real and not a debt. | synthesis (after Russ Harris, *The Happiness Trap*) |
| 02 | **you may admit you didn't start** | "I didn't do the thing today." Saying it out loud — to Ria, to the journal, to no one — is not the same as failing. It is the receipt; the receipt is not the bill. | synthesis (after Brown) |
| 03 | **you may say "I'm avoiding"** | The word for what you are doing is *avoiding*. Naming it doesn't fix it. Naming it stops it from running in the background. | after Brach (RAIN: Recognize) |
| 04 | **you may stop researching the right way to study** | The research is the avoidance. There is no perfect method. There is only the next thirty minutes. | synthesis (after Pressfield) |
| 05 | **you may have a wasted day and not contaminate tomorrow** | A wasted Tuesday is a Tuesday. Wednesday begins at 6am whether or not you "earned" it. There is no carry-over debt. | after Pema Chödrön |

### Theme 2 — Restlessness (slots 6–10, color: amber)

| Slot | Title | Body | Provenance |
|---|---|---|---|
| 06 | **you may sit with the urge** | The order can wait. The tab can wait. The text can wait. The body wants you to *act now* — and the body is not always right. Sit. Sixty seconds. The urge moves through. | after Linehan, *DBT Skills Manual* (urge-surfing) |
| 07 | **you may put the phone in another room** | This is not deprivation. This is geography. The phone in the kitchen is the phone you don't reach for. | after Cal Newport, *Digital Minimalism*, 2019 |
| 08 | **you may be physically still** | Restlessness will tell you motion is the answer. Sometimes stillness is. Hands in lap. Feet on floor. Three breaths. The body learns slowly. | after Kabat-Zinn |
| 09 | **you may not order the thing right now** | "I cannot wait" is a sentence. Sentences can be edited. Wait fifteen minutes and ask the body again — see if it still cannot wait. | synthesis (S4 reference) |
| 10 | **you may notice and not act** | Noticing is the practice; acting is the habit. They are not the same thing. The first one is enough today. | after Brach (RAIN: Allow) |

### Theme 3 — Identity (slots 11–15, color: lavender)

| Slot | Title | Body | Provenance |
|---|---|---|---|
| 11 | **you may not have an answer for "what do you do"** | The question is rude. You don't owe anyone a tidy job title. "I'm figuring it out" is a complete sentence. | after Sasha Hamdani |
| 12 | **you may have been someone else at 18** | The version of you that loved this for free is still inside. He is not gone. He is buried. The work is excavation, not construction. | synthesis (after Schwartz, IFS) |
| 13 | **you may want different things on different days** | Identity is not a constant. The you that wants quiet today is the same person as the you who wanted to lead a team last Tuesday. Both count. | after Carl Rogers, *On Becoming a Person* |
| 14 | **you may be becoming someone you can't yet name** | The identity statement does not have to be ready. *I am someone who…* with a blank after it is also a sentence. | after the Prax PDF + Clear |
| 15 | **you may pick the small life** | Not every life has to be a story worth telling. Some lives are quiet, kind, well-fed, well-rested. That is also enough. | synthesis (after Cheryl Strayed) |

### Theme 4 — Ria / Relationship (slots 16–20, color: clay)

| Slot | Title | Body | Provenance |
|---|---|---|---|
| 16 | **you may not be in a good mood for Ria tonight** | She married a person, not a mood. Tell her the day was hard with yourself. That is not a complaint about her; it is a report on the day. | synthesis |
| 17 | **you may be quiet on the couch** | Being together is not always being talkative. Side-by-side counts. Hand on the leg counts. | after Brown, *Atlas of the Heart*, 2021 |
| 18 | **you may be the one who needs reassurance tonight** | She is allowed to give it. You are allowed to receive it. The score is not being kept. | after Schwartz |
| 19 | **you may not be the partner you want to be every day** | The good marriage is not the one where you are at your best. It is the one where you keep showing up at your average, and sometimes at your worst, and she does too. | synthesis (after Esther Perel) |
| 20 | **you may interrupt the night-shame to text "I'm here"** | Two words sent at 11pm beat a long apology at 8am. Don't draft the perfect line; send the imperfect one. | after Gollwitzer (implementation intentions) |

### Theme 5 — Break-discipline (slots 21–25, color: amber)

| Slot | Title | Body | Provenance |
|---|---|---|---|
| 21 | **you may set a real timer and trust it** | Thirty minutes is real time, not aspirational time. Begin now. Stop at thirty. The next thirty starts after the analog break. | after the Shreya 30/break protocol |
| 22 | **you may walk to the kitchen and back** | This is the entire break. Drink water. Look at the wall. Return. Do not check the phone. | after Newport, *Deep Work*, 2016 |
| 23 | **you may have done five minutes and called it work** | Five minutes is a session. Three minutes is a session. The rule is: *you sat down*. The duration is the duration. | after BJ Fogg, *Tiny Habits* |
| 24 | **you may bail in the middle and start the next 30 today** | The streak was a story. Drop it. The next 30 minutes start now, not tomorrow. | synthesis |
| 25 | **you may have one bad break and not lose the day** | One reel turned into ten reels turned into an hour. Notice it. The next 30 starts when you decide it does — which can be now. | after Brach (RAIN: Investigate) |

### Theme 6 — Self-Compassion (slots 26–30, color: sage)

| Slot | Title | Body | Provenance |
|---|---|---|---|
| 26 | **you may speak to yourself the way you'd speak to Ria's brother** | If a person you love made the same mistake you made today, what would you say to them? Say that to yourself. Out loud if needed. | after Neff, *Self-Compassion*, 2011 |
| 27 | **you may be tired without earning the rest** | The bed is not a moral institution. You don't owe productivity to anyone, including yourself. The 4pm crash is a body, not a verdict. | after Hersey, *Rest is Resistance*, 2022 |
| 28 | **you may have started small enough to feel embarrassed** | If your tomorrow's to-do list does not feel slightly silly, it's too ambitious. Cut it in half. Then cut it in half again. | after Fogg + S4 prescription |
| 29 | **you may forgive yourself before bedtime** | You don't have to wait for it to feel deserved. Forgiveness is not a verdict; it is a choice you make so you can sleep. | after Edith Eger, *The Choice*, 2017 |
| 30 | **you may do this again tomorrow** | None of this is a one-time fix. Permission renews on its own. The slip is yours to re-sign as many times as you need to. | synthesis (the closing motif) |

---

## 13. The 12 Letters (full content brief)

> Each letter is 250–450 words, hand-authored, presented as a single A4 page in letter format. Layout: stamped letter style like mockup `11-interlude-letter.html`. Each letter has a stamp/circle in top-right with sender + delivery note, a greeting in Fraunces italic large, body in Fraunces 13pt with em-italic accents in clay, and a sign-off.
>
> Letter content is NOT given here in full word count — the spec defines: title, sender archetype, narrative arc, key beats, signature, attribution. Claude (during build) writes the actual prose against these specs. Approximate length and tone are locked here.

### Letter sequence — the 12-month narrative arc

#### Letter 01 — From your 18-yr-old self (foundational)

**Sender:** "the version that loved it for free" · 18-yr-old you · ~2018  
**Stamp text:** "a letter from / 18-yr-old you / delivered late"  
**Length:** ~400 words  
**Greeting:** "Hey, future me."  
**Beats to hit:**
- I am writing on a Sunday afternoon with no destination
- I love this — sitting at the keyboard, the small breakable thing on screen, ideas working the first time
- I love it without anyone watching, no marks, no job offer
- I am not afraid of being bad at things yet. Mistakes are rent, not debt
- I have hours of daylight and no shame about how I'll spend them
- I don't know who Ria is yet. Tell her I said hi
- The discomfort isn't the work. Someone smart told you that
- Be small. Be slow. Be quiet. Make a tiny thing today
**Sign-off:** "— me, the version that loved it for free / p.s. you are still that version. just buried."  
**Provenance:** synthesis (after PDF question C "before everything got heavy" + IFS-Self exiling)  
**Layout reference:** `11-interlude-letter.html` (already drafted; this is letter 01 verbatim).

#### Letter 02 — From your future self (orientation)

**Sender:** "you, in 2031" · 5 years out · the version who got out  
**Stamp text:** "from 2031 / on a Tuesday morning / postmarked late"  
**Length:** ~350 words  
**Greeting:** "Listen."  
**Beats:**
- I am writing on a Tuesday in 2031. The morning starts at 6:30, slow, with Ria still asleep
- The first hour belongs to me. Tea. Window. One thirty-minute block before I open anything else
- I will tell you what surprised me: the work that mattered most was the slowest
- Not the AI/ML/DSA debate — neither won. What won was choosing one thing for 90 days
- I am not a different person. I am the same person who took fewer detours
- The boring middle years are when the compound happens
- You don't have to be inspired to keep going. You just have to not quit while bored
**Sign-off:** "— you, in 2031, on a quiet Tuesday morning."  
**Provenance:** synthesis (after PDF question A "Tuesday morning two years from now")

#### Letter 03 — From your shame, on a quiet day (RAIN-style)

**Sender:** "Shame, when she's not yelling" · the internal voice on a calm day  
**Stamp text:** "from Shame · in her quietest voice / posted from the 4 a.m. wake-up"  
**Length:** ~300 words  
**Greeting:** "I won't take long."  
**Beats:**
- I'm not the villain I sound like at 11pm
- My job is to keep you safe. I do it badly, but I'm trying
- When I yell, it's because I am scared. Old fears, mostly. Your father's voice. The Amazon room
- I don't actually believe you are a failure. I am trying to keep you from looking foolish
- You can let me sit at the table without giving me the wheel
- Thank you for not silencing me with reels last night. I noticed
**Sign-off:** "— Shame, in her quietest voice."  
**Provenance:** synthesis (after Brach RAIN + Schwartz IFS — letting parts speak in their best voice)

#### Letter 04 — From Ria, on a good night (relational mirror)

**Sender:** Ria, on a Saturday she felt safe  
**Stamp text:** "from Ria / on a good Saturday / not the version of me that's tired"  
**Length:** ~300 words  
**Greeting:** "Praxie."  
**Beats:**
- Tonight I want to tell you what I see when you're not looking
- You don't believe me when I say it in person, so here it is on paper
- The way you came home and asked about my day before opening your phone — I noticed
- The night you didn't have a good day with yourself and you told me — that was the marriage we wanted
- I don't need you to be impressive. I need you to be here. You are mostly here
- The shame you carry at night about not being enough — I can't talk you out of it. But I can tell you, for a fact, you are not who you think you are at 11pm
- Be kinder to him. He's mine.
**Sign-off:** "— me, on a good Saturday."  
**Provenance:** synthesis (after Brown's "show up" + the v6 borrow-line)

#### Letter 05 — From a part of you that loves the work (IFS-Self)

**Sender:** "the part of you that came alive at the keyboard at 19"  
**Stamp text:** "from the maker / archived 2018 / un-archived 2026"  
**Length:** ~280 words  
**Greeting:** "I'm still here."  
**Beats:**
- You have not heard from me in a while. I've been quiet, not gone
- The version of you that fell in love with making things — I am that part. Not your manager, not your title, not Amazon. Just the maker
- I light up when you build a thing nobody asked for. A sticker. A weekend tool. A small clean function
- The shame doesn't reach me — I work below where it lives. Send me down once a day, even for ten minutes, and I will return the favor
- Stop asking permission to make things
- The only audience that matters is the version of me writing this letter
**Sign-off:** "— the maker."  
**Provenance:** after Schwartz, *No Bad Parts*, 2021

#### Letter 06 — From your therapist (Shreya frame)

**Sender:** Shreya, between sessions  
**Stamp text:** "between sessions / not session 5 / a thing I forgot to say"  
**Length:** ~300 words  
**Greeting:** "Prakhar."  
**Beats:**
- I'm writing this between sessions because there's a thing I keep forgetting to say in the room
- The pseudo-discomfort being restlessness — that was the diagnostic. But here is the prognosis: you can build a relationship with restlessness instead of fighting it
- It's been with you since childhood. It is going to be with you in 2031. The question is not "how do I get rid of it" — it's "how do I not let it run my Tuesday"
- The work between sessions is small. Most of it is me doing nothing while you discover that the urge passes when you don't respond to it
- Bring me data, not stories. The number of times the urge came up. The number of times you didn't act. That's all
- See you Friday
**Sign-off:** "— Shreya."  
**Provenance:** synthesis (in the spirit of Shreya's S4 voice; not a real letter from Shreya)

#### Letter 07 — From your brother (sibling witness)

**Sender:** your brother, the one who saw you grow up  
**Stamp text:** "from your brother / not the family WhatsApp version / the actual one"  
**Length:** ~320 words  
**Greeting:** "Bhai."  
**Beats:**
- I have known you for thirty years. I am writing because I think you need to be reminded of something only siblings remember
- You were the one who couldn't sit through homework at age nine and our mother would yell — and you were the one who built that working calculator out of paper at age eleven
- You were not lazy. You were never lazy. You were paying attention to the wrong things — which is also a kind of paying attention
- The Amazon thing — I was there in the kitchen the day you came home. I saw it. The shame doesn't change what I saw
- You were trying to do something hard. The thing did not work. That is not the same as "you do not work"
- Come home for Diwali. We'll talk about this in person if you want, or not at all
**Sign-off:** "— your brother / p.s. ma's roti is the same."  
**Provenance:** synthesis (sibling witness archetype; relational anchor that pre-dates the trauma)

#### Letter 08 — From the version of you that lived through this (post-arrival)

**Sender:** future-Prax, 2032  
**Stamp text:** "from the year after / written in retrospect / the survivor's note"  
**Length:** ~340 words  
**Greeting:** "Hi."  
**Beats:**
- I'm the version of you who got through 2026
- I want to tell you something specific so you know it's real
- The day you decided to ship v6 of the journal — that wasn't the day things changed. The day was three weeks later, on a Wednesday at 2pm, when you sat down for thirty minutes and didn't reach for the phone, and didn't even notice you didn't
- That moment didn't feel like a turning point. It felt like a Wednesday. That's the secret — the turning point doesn't feel like one
- The marriage with Ria — much better. Not because either of you changed dramatically. Because you stopped withdrawing at night. You stopped paying the relationship cost
- The work — you did fine. Not famously. Fine. Fine is enough
- Be patient with him. He thinks 2026 is the worst year. It's not.
**Sign-off:** "— me, in 2032, who survived the year you're in."  
**Provenance:** synthesis (the post-arrival voice; durable hope without bypassing)

#### Letter 09 — From a former Amazon colleague (career-trauma reframe)

**Sender:** Maya / "M" — a former Amazon colleague who left around the same time  
**Stamp text:** "from M · who also left / not on LinkedIn anymore / postmarked Bangalore"  
**Length:** ~290 words  
**Greeting:** "Prax."  
**Beats:**
- We don't talk much, but I think about that team often
- I was there when the org chart changed. I saw what happened to you. I want you to know: I left six months after, on my own terms, partly because what I saw happen was not a meritocracy
- The story your manager told about you was a story. Stories have authors. The author wasn't your future
- I am writing because I went through three years of believing I was the problem. I built a small thing on the side. Eventually that became my life. Eventually I stopped checking the email of the people who let me go
- The career shame is a holdover. It does not have a future. It only has a past. Stop feeding it the present
- I'm building a thing now. We could talk if you want
**Sign-off:** "— M."  
**Provenance:** synthesis (career-trauma reframe; common pattern, ungeneralizable specifics)

#### Letter 10 — From the body (somatic)

**Sender:** Your body, after a quiet weekend  
**Stamp text:** "from your body / on a sunday night / between tea and bed"  
**Length:** ~270 words  
**Greeting:** "I have something to say."  
**Beats:**
- I have been trying to talk to you for a while. The chest weight. The bedtime sigh. The shoulder you keep cracking
- I am not punishing you. I am the messenger
- The 4pm crash is real. Sleep is the answer. Not coffee. Not "powering through." Sleep
- The smoking — I will not nag you. But the third cigarette of a Tuesday is a body lying to itself
- The breathing in shallow fast pattern when you open the laptop — that is anxiety in the lungs. Three slow breaths. That's all I'm asking
- I will keep showing up even when you don't listen. I am not going anywhere. But it would be kinder to both of us if you stopped treating me as the obstacle. I am the data
**Sign-off:** "— your body / p.s. drink water."  
**Provenance:** synthesis (after van der Kolk, *The Body Keeps the Score*, 2014; somatic letter form)

#### Letter 11 — From the version of you who said no (boundary)

**Sender:** the rare past version of Prax who set a hard boundary and held it  
**Stamp text:** "from the day you said no / a real day / look it up if you forgot"  
**Length:** ~280 words  
**Greeting:** "Remember the day."  
**Beats:**
- Remember the day you said no — to that consulting gig in 2024, to the cousin's wedding speech in 2023, to the WhatsApp group at 11pm last March
- Each of those was hard. Each was the right call. None of them ended in disaster
- You think you can't say no because something will fall apart. The data says: things mostly don't fall apart. The asker is mildly disappointed for an hour. That's it
- You are allowed to say no without a reason. "No" is a complete sentence
- Practice saying it in the smallest places first. To the optional meeting. To the third tab. To the urge to order
- The yes you have available comes from the no you said yesterday
**Sign-off:** "— the version of me that knew."  
**Provenance:** after Strayed, *Tiny Beautiful Things* (boundary-as-self-respect)

#### Letter 12 — From the dead (Pema Chödrön / mortality lens)

**Sender:** anonymous · "from the threshold"  
**Stamp text:** "from the threshold / the year does not matter"  
**Length:** ~310 words  
**Greeting:** "Friend."  
**Beats:**
- This is not as dark as the title suggests
- I am writing as the person you will become eventually — not in 2032, but in the long view. The version of you that will not exist anymore
- I want you to do something simple. Tomorrow morning, before opening the phone, sit on the edge of the bed for one minute and notice that you are still alive
- The day you do this consistently is the day the calculus changes. Most of the things you fear are *future-loss* problems. They evaporate when you remember today is the only day that has actually arrived
- The Amazon termination, the wasted afternoons, the YouTube binges, the night you were short with Ria — these will not be on the list of regrets. The regrets are subtler: not seeing how loved you were, not feeling the morning, not being curious about what was actually going on
- Be curious. Be small. Be present. Be alive in the day you are in. That is the entire instruction
**Sign-off:** "— from the threshold."  
**Provenance:** after Pema Chödrön, *When Things Fall Apart*, 1997 (impermanence as compassion); also Padmasambhava's bardo teachings (mortality as clarity)

---

## 14. Build Pipeline & Reference Algorithms

### 14.1 Build flow (pseudocode)

```
function build_v6():
  # Phase 1 — pages
  for each page in pages/*.html:
    validate_meta_tags(page)
    render_pdf(page) -> pages/<id>.pdf via Playwright (A4, 0 margin)
    render_png(page) -> pages/<id>.png at 1240x1754 (A4 @ 150dpi)

  # Phase 2 — read-between
  for each rb in read-between/{quotes,letters,permissions}/*.html:
    validate_meta_tags(rb)
    render_pdf(rb) -> rb.pdf
    render_png(rb) -> rb.png at 1240x1754

  # Phase 3 — stickers
  for each sticker in stickers/svg/*.svg:
    validate_svg(sticker)  # transparent bg, no external refs, mm dimensions
    export_png(sticker, max_edge=1024) -> stickers/png/<id>.png

  # Phase 4 — sticker sheets
  for each sheet in sticker_sheet_definitions:
    layout_grid(sheet.stickers, sheet.grid)
    render_pdf(sheet) -> stickers/sheets/<sheet-id>.pdf

  # Phase 5 — manifests
  emit_manifest(pages/, pages/manifest.json)
  emit_manifest(stickers/, stickers/manifest.json)
  emit_manifest(read-between/, read-between/manifest.json)

  # Phase 6 — top-level pack manifest
  emit_pack_manifest(versions/v6/, versions/v6/manifest.json)
```

### 14.2 Sticker sheet layout algorithm

```
function layout_grid(stickers, grid_def):
  # grid_def: { cols: int, rows: int, cell_w_mm: number, cell_h_mm: number }
  page = create_a4_page()
  margin_x = (page.width - grid_def.cols * grid_def.cell_w_mm) / 2
  margin_y = (page.height - grid_def.rows * grid_def.cell_h_mm) / 2
  for i, sticker in enumerate(stickers):
    col = i % grid_def.cols
    row = i // grid_def.cols
    x = margin_x + col * grid_def.cell_w_mm
    y = margin_y + row * grid_def.cell_h_mm
    place_sticker(page, sticker, x, y)
    if i > 0 and col > 0:
      draw_cut_line_vertical(page, margin_x + col * grid_def.cell_w_mm)
    if i > 0 and row > 0 and col == 0:
      draw_cut_line_horizontal(page, margin_y + row * grid_def.cell_h_mm)
  return page
```

### 14.3 PNG export from HTML

```
function render_png(html_path, w=1240, h=1754):
  # Uses Playwright headless Chromium
  browser = playwright.launch(headless=true)
  page = browser.new_page(viewport={width: w, height: h, deviceScaleFactor: 2})
  page.goto(file_url(html_path))
  page.wait_for_load_state('networkidle')
  png_bytes = page.screenshot(omit_background=false, full_page=false)
  browser.close()
  return png_bytes
```

### 14.4 PDF export from HTML

```
function render_pdf(html_path):
  browser = playwright.launch(headless=true)
  page = browser.new_page()
  page.emulate_media(media='print')
  page.goto(file_url(html_path))
  page.wait_for_load_state('networkidle')
  pdf_bytes = page.pdf(format='A4', margin={top:0, bottom:0, left:0, right:0}, print_background=true)
  browser.close()
  return pdf_bytes
```

### 14.5 Build commands

Add to `packages/packs-prax-journal/package.json`:

```json
{
  "scripts": {
    "build:v6": "tsx ../../scripts/build-v6.ts",
    "build:v6:pages": "tsx ../../scripts/build-v6.ts --only=pages",
    "build:v6:stickers": "tsx ../../scripts/build-v6.ts --only=stickers",
    "build:v6:read-between": "tsx ../../scripts/build-v6.ts --only=read-between",
    "validate:v6": "tsx ../../scripts/validate-v6.ts",
    "preview:v6": "python3 -m http.server 8765 --directory versions/v6"
  }
}
```

---

## 15. Logging, Status, and Observability

### 15.1 Build-time observability

The build pipeline MUST emit a structured log per artefact:

```json
{
  "ts": "2026-05-27T18:30:12.123Z",
  "phase": "pages|read-between|stickers|sheets|manifests",
  "id": "<artefact-id>",
  "status": "ok|warn|fail",
  "duration_ms": 120,
  "outputs": ["pages/identity-doorway.html", "pages/identity-doorway.pdf", "pages/identity-doorway.png"],
  "issues": []
}
```

Emit to stdout AND to `versions/v6/.build-log.jsonl`. Append-only.

### 15.2 Manifest fields

Each `manifest.json` includes:

```json
{
  "version": "v6.0.0",
  "generated_at": "2026-05-27T18:30:00Z",
  "artefacts": [
    {
      "id": "identity-doorway",
      "kind": "writing",
      "cadence": "weekly",
      "files": {
        "html": "pages/identity-doorway.html",
        "pdf": "pages/identity-doorway.pdf",
        "png": "pages/identity-doorway.png"
      },
      "size_bytes": { "html": 84021, "pdf": 24812, "png": 92341 },
      "provenance": ["..."]
    }
  ]
}
```

### 15.3 Validation report

After build, `scripts/validate-v6.ts` MUST emit `versions/v6/.validation-report.md` with:

- Count of artefacts by kind
- Any pages exceeding A4 dimensions (must be 0)
- Any stickers without transparent background (must be 0)
- Any read-between page with content over the spec word count (must be 0)
- Any artefact missing provenance (must be 0)
- Any unfulfilled meta-tag (must be 0)
- Sample sticker dimensions (mm) for visual confirmation

---

## 16. Failure Model and Recovery Strategy

### 16.1 Named failure categories

| Category | Recovery |
|---|---|
| `font_load_fail` | Build fails; print missing font CDN URL; user must verify network or vendor fonts locally |
| `page_too_long` | Page renders but PDF has 2 pages; build emits `warn`; manual inspection required |
| `sticker_dimension_oob` | Sticker > 80mm or < 15mm on any edge; build fails; spec requires re-author |
| `meta_tag_missing` | Page lacks required `<meta name="prax-journal:*">` tag; build fails; auto-fix script available (TBD) |
| `provenance_missing` | Spec violation; build fails; must add to source |
| `playwright_browser_unavailable` | Build fails with explicit "run `pnpm exec playwright install chromium`" |
| `manifest_drift` | Manifest entry exists but file does not (or vice versa); build emits `warn`; manual reconciliation |
| `theme_color_drift` | Read-between page declares theme but uses wrong color chip; build emits `warn` (visual issue, not blocking) |

### 16.2 Idempotency

- `pnpm build:v6` MUST be idempotent — running twice produces byte-identical outputs (modulo timestamps in manifest, which use a `SOURCE_DATE_EPOCH` env var if set for reproducibility).
- Outputs go to `versions/v6/` directly (no separate `dist/`). The HTML files are also the deliverables.

### 16.3 Partial-build resilience

- If only `pages/` source changed, `build:v6:pages` rebuilds only that bucket.
- If a single sticker SVG fails to parse, the build emits the failure for that sticker AND CONTINUES with the rest. Final exit code is non-zero only if any failure occurred.

---

## 17. Security and Operational Safety

### 17.1 PII boundary

The pack contains real names of real people:

- `Prax` (the user — first name)
- `Ria` (the user's partner — first name)
- `Shreya` (the therapist — first name)
- `Amazon` (a former employer)
- "Maya" / "M" (composite invented colleague in letter 09)
- The user's brother (no first name written; just "your brother")

**Required handling:**

- These names are committed to source. The repo is the user's own; he controls what's pushed.
- `.gitignore` MUST ensure `*.local.json` and `profile*.json` aren't tracked (matches existing `.gitignore` pattern in `packages/packs-prax-journal/`).
- The README MUST advise: "this pack is personalized; if forking for someone else, replace names in `config.json` and re-run `pnpm build:v6`."
- The PHQ-9 Q9 cue and the crisis card MUST be included; they are not optional. Even self-personalized journals carry safety nets.

### 17.2 Crisis-content invariants

These are non-negotiable in every build:

- The crisis card (page or sticker) MUST appear at least once in the deliverable bundle.
- The crisis helpline numbers MUST be the verified numbers as of build date:
  - iCall (TISS): 9152987821 (M-Sat 9am-9pm IST)
  - Vandrevala Foundation: 1860 266 2345 (24/7)
  - AASRA: 9820466726 (24/7)
  - NIMHANS: 080 4611 0007 (24/7)
- The PHQ-9 Q9 reminder strip ("If Q9 is anything other than 'not at all'…") MUST appear on the screener-phq9 page.
- The validation step MUST grep for these strings and fail the build if missing.

### 17.3 Trust boundaries

| Surface | Trust |
|---|---|
| `versions/v6/*.html` source | trusted (committed) |
| `versions/v6/_shared.css` | trusted |
| Inlined fonts (base64) | trusted (vendor-pinned to v5's font versions) |
| External CDN URLs (build-time preview only) | un-trusted (only used in dev, never in shipped artefact) |
| Goodnotes import path | un-trusted (Goodnotes app sees PNG/PDF only; cannot exfil) |

### 17.4 Privacy-respecting build

The build MUST NOT:

- Make any network request at runtime (post font-vendor step)
- Phone home to any analytics
- Embed any tracking pixel in PDFs/PNGs
- Include any external font loader or remote script reference in the shipped HTML

---

## 18. Test and Validation Matrix

### 18.1 Validation profiles

#### Profile A — "Core Conformance" (must-pass before merge)

| ID | Test | Pass criteria |
|---|---|---|
| C1 | Every page renders to A4 (210×297mm) without overflow | `validate:v6` passes |
| C2 | Every page has all required `<meta name="prax-journal:*">` tags | grep + count match expected |
| C3 | Every page has provenance footer | grep on each `.html` |
| C4 | Riya does not appear anywhere — only Ria | `grep -r "Riya" versions/v6/` returns 0 |
| C5 | All 41 stickers have both SVG + PNG outputs | `ls versions/v6/stickers/svg/*.svg \| wc -l == 41` and same for PNG |
| C6 | All 8 sticker sheets exist | `ls versions/v6/stickers/sheets/*.pdf \| wc -l == 8` |
| C7 | All 30 quotes + 12 letters + 30 permissions exist | counted match |
| C8 | Every read-between page declares a theme | grep meta theme |
| C9 | Crisis card content matches spec helplines | string grep on the 4 numbers |
| C10 | Build is idempotent under `SOURCE_DATE_EPOCH` | run twice, diff outputs (modulo timestamp) |
| C11 | All HTML pages pass W3C nu validator | external validator |
| C12 | All PDFs are 1-page, A4, no scroll | playwright PDF inspection |

#### Profile B — "Extension Conformance" (if-you-ship-it-test-it)

| ID | Test | Pass criteria |
|---|---|---|
| E1 | Visual regression vs. baseline screenshots | Playwright + pixelmatch with 1% threshold |
| E2 | All sticker PNGs have transparent bg (alpha < 0xFF in corner pixels) | python PIL check |
| E3 | All Hindi/Devanagari renders correctly (no `[?]` glyphs) | render PNG, OCR back, compare |
| E4 | Letter word counts within ±20% of spec | wc + diff |
| E5 | Quote word counts ≤25 words | wc on extracted quote text |
| E6 | Permission word counts ≤60 words | wc on extracted permission text |

#### Profile C — "Integration Profile" (manual on Goodnotes)

| ID | Test | Pass criteria |
|---|---|---|
| I1 | Import 1 sticker sheet PDF into Goodnotes; sticker can be peeled | manual on iPad |
| I2 | Import 1 individual sticker PNG into Goodnotes Elements | manual on iPad |
| I3 | Import 1 page PDF as a Goodnotes notebook page | manual on iPad |
| I4 | Stamp a permission-tired sticker onto an arbitrary page | manual; verify scale and transparency |
| I5 | Read a quote page side-by-side with a v5 page | manual visual comparison; family look holds |

### 18.2 Conformance checklist (mapped to spec sections)

| Spec § | Test IDs |
|---|---|
| §3 System Overview | C5, C6, C7 |
| §4 Domain Model | C2, C3, C8 |
| §5 Contracts | C1, C2, C8, C12 |
| §6 Configuration | C7 (counts) |
| §7 Themes | C8 |
| §8 Pages | C1, C2, C3, C12 |
| §9 Stickers | C5, C6, E2 |
| §11 Quotes | C7, E5 |
| §12 Permissions | C7, E6 |
| §13 Letters | C7, E4 |
| §14 Build pipeline | C10 |
| §15 Observability | C5, C7 (manifest counts) |
| §16 Failure Model | (covered by build runs) |
| §17 Security | C4, C9 |

---

## 19. Implementation Checklist (Definition of Done)

> Mark complete only when all items in the relevant profile pass.

### Profile A — Core (required for merge)

- [ ] `versions/v6/_shared.css` exists, inherits v5 DNA verbatim, byte-equivalent for tokens
- [ ] All 7 pages exist in `versions/v6/pages/` and render on A4
- [ ] All 41 stickers exist in `versions/v6/stickers/svg/` AND `.../png/`
- [ ] All 8 sticker sheets exist in `.../sheets/`
- [ ] All 30 quotes exist in `versions/v6/read-between/quotes/`
- [ ] All 12 letters exist in `versions/v6/read-between/letters/`
- [ ] All 30 permissions exist in `versions/v6/read-between/permissions/`
- [ ] Every page has 5 required `<meta name="prax-journal:*">` tags
- [ ] Every page footer carries provenance
- [ ] `grep -r "Riya" versions/v6/` returns 0 lines
- [ ] Crisis card / helpline page contains all 4 verified Indian helpline numbers
- [ ] PHQ-9 page contains the Q9 reminder strip
- [ ] `pnpm build:v6` exits 0 on clean clone
- [ ] `pnpm validate:v6` exits 0
- [ ] `versions/v6/manifest.json`, `.../pages/manifest.json`, `.../stickers/manifest.json`, `.../read-between/manifest.json` all exist
- [ ] `versions/v6/README.md` documents: how to import to Goodnotes (pages, stickers, sheets), the 6-theme rotation, the 12-letter narrative arc, the crisis card placement
- [ ] CHANGELOG.md root file has a `## v6 (unreleased)` section listing the additions
- [ ] No new lint warnings introduced (`pnpm lint`)
- [ ] All existing v5 tests still pass

### Profile B — Extension (recommended)

- [ ] Visual regression baselines committed at `tests/visual/baselines/v6/*.png`
- [ ] Sticker PNG transparency verified by alpha-channel test
- [ ] Hindi/Devanagari OCR roundtrip test passes
- [ ] All read-between word counts validated (quote ≤25, permission ≤60, letter 250-450)

### Profile C — Integration (post-ship; manual)

- [ ] Verified on physical iPad Goodnotes by Prax
- [ ] One sticker sheet successfully imported and peeled
- [ ] One page used as a Goodnotes background
- [ ] Stickers stamp cleanly with no visible bg artifacts
- [ ] v5 + v6 side-by-side passes the family-look test

### Documentation

- [ ] Top-level `README.md` notes v6 availability
- [ ] `docs/CUSTOMISATION.md` (if exists) updated for the v6 customization path (replacing names in `config.json`)
- [ ] `docs/NORTH-STAR.md` updated if v6 redirects the project trajectory

---

## 20. Open Questions and Deferred Decisions

These were considered and deliberately deferred to v6.1:

1. **Hindi-only edition.** Some users would benefit from quotes/permissions translated fully to Hindi. v6.0 keeps bilingual where Shreya's transcript is bilingual; full translation is v6.1.
2. **Audio versions.** Letters could ship as audio files for read-between. Deferred — text-first.
3. **A different partner name workflow.** v6.0 hard-codes Ria. A `personalize.ts` script that swaps names is v6.1.
4. **Per-day suggested stamp count.** "Stamp at most 2 if-then stickers per day" — this is guidance, not enforcement. Deferred to documentation.
5. **Workspace package SKU split.** v6 ships in one package; future v6.1+ may offer SKUs (pages-only / stickers-only / read-between-only).
6. **Crisis card numbers internationalization.** v6.0 ships India-only helplines. International users need different numbers — v6.1.
7. **Therapist-edition.** A version Shreya could give other clients. Deferred to v7 — would need de-personalization and licensing review.

---

## 21. References

### Primary sources (project-specific)

- Shreya Banerjee Therapist Session 4 transcript — `~/Documents/🖼️ScreenShots/transcription-pipeline/output/shreya-2026-05-01-20260505-204026775062/`
  - `transcript.notes.md`, `transcript.insights.md`, `ACTIONS.md`, `chart.md`, `transcript.english.md`
- `piiPrax/Shreya 1 May 2026 Session/Identity Questions Action Experiment.pdf` (Prax-authored)
- `piiPrax/Shreya 1 May 2026 Session/Shreya - Questions and Answers Needed.pdf` (Prax-authored, near-identical export)
- `piiPrax/Shreya 1 May 2026 Session/3 - AI Master Therapeutic Agent - MDD & Adult ADHD Specialist (v2.1 - WITH VALIDATED SCREENERS).md` (Prax-authored persona doc, "Dr. Alex Morgan v3.0")
- `packages/packs-prax-journal/versions/v5/*.html` — v5 source pages (visual DNA inheritance)
- `.superpowers/brainstorm/v6-mockups/*.html` — 14 already-built v6 mockups (review-grade), at `http://127.0.0.1:8765/`

### Secondary sources (frameworks, books, papers)

See §10 ("Frameworks used (the citation pool)") for the full author/work list. Key scientific instruments:

- **PHQ-9** — Spitzer RL, Kroenke K, Williams JBW. *JAMA*, 1999. Public domain.
- **GAD-7** — Spitzer RL, Kroenke K, Williams JBW, Löwe B. *Arch Intern Med*, 2006. Public domain.
- **ASRS v1.1** — Kessler RC et al. *Psychol Med*, 2005. WHO/Harvard. Public domain.
- **DBT skills training** — Linehan MM. *DBT Skills Training Manual*, 2nd ed., Guilford, 2014.
- **MSC** — Neff K. *Self-Compassion: The Proven Power of Being Kind to Yourself*, William Morrow, 2011.
- **CFT** — Gilbert P. *The Compassionate Mind*, Constable, 2009.
- **ACT** — Harris R. *The Happiness Trap*, Trumpeter, 2008. *The Confidence Gap*, Shambhala, 2010.
- **RAIN** — Brach T. *Radical Compassion*, Viking, 2019.
- **Implementation intentions** — Gollwitzer PM. *American Psychologist*, 1999.
- **Tiny Habits** — Fogg BJ. *Tiny Habits: The Small Changes That Change Everything*, Houghton Mifflin Harcourt, 2019.
- **Atomic Habits (identity-based)** — Clear J. *Atomic Habits*, Avery, 2018.

---

## 22. Spec Self-Review (Phase 4)

Self-review run on this spec:

| Check | Status | Notes |
|---|---|---|
| Every entity field has a type | ✓ | §4 tables |
| Every default has a value | ✓ | §6.2 cheat sheet |
| Every error has a name + recovery | ✓ | §16.1 |
| Every state transition has a trigger | ✓ | rotation algorithm §7.2; build phases §14.1 |
| Boundaries say in-scope AND out-of-scope | ✓ | §2 (G* + NG*), §3.3 |
| Reference pseudocode for complex logic | ✓ | §14.1, 14.2, 14.3, 14.4 |
| Configuration cheat-sheet exists | ✓ | §6.2 |
| Test/validation matrix maps back to sections | ✓ | §18.2 |
| Forward compatibility addressed | ✓ | §20 deferred decisions; §17.1 personalize note |
| Self-contained | ✓ | reads-only references this file or files in repo |
| Vague defaults eliminated | ✓ | reviewed; no "reasonable", "appropriate" |
| Missing error handling eliminated | ✓ | §16 |
| Implicit state transitions eliminated | ✓ | rotation + build phases explicit |
| Unbounded behavior capped | ✓ | sticker dimensions bounded; letter lengths bounded |
| All hand-wavy sections enumerated | ✓ | letter "beats to hit" + permission "body" specified per slot |

### Review Summary

- **Total sections:** 22
- **Total lines:** ~1900 (estimated post-append)
- **Gaps fixed during self-review:**
  - Added §17.2 invariants on crisis content (was ambiguous)
  - Added §16.2 idempotency note (was implicit)
  - Added §18.1 Profile B and C tests (was sparse)
  - Added §22 self-review section (this one)
- **Remaining `[TBD]` markers:** 1 — §16.1 mentions an "auto-fix script (TBD)" for missing meta tags. Acceptable; the failure case is well-defined; auto-fix is convenience.
- **Confidence assessment:** **Ready for implementation**, pending user review and the requested plan-design-review + plan-eng-review passes (§ next steps).

---

## 23. Next Steps After Spec Approval

1. **plan-design-review** — visual/UX critique of the 14 mockups + the 72 read-between layouts
2. **plan-eng-review** — architecture critique of the build pipeline, manifest format, sticker export
3. **plan-ceo-review** — scope challenge: is this the right level of ambition, or should we cut/expand?
4. **plan-devex-review** — does someone forking this for themselves have a clean path?
5. After all four reviews and any spec amendments, hand off to `writing-plans` skill for the implementation plan.
6. Implementation in phases: shared CSS → 7 pages → 41 stickers → 8 sheets → 72 read-between → manifests → validation tests.

---

*End of SPEC.md — prax-journal v6.*
*Authored: 27 May 2026.*
*Total content briefs: 7 pages + 41 stickers + 30 quotes + 12 letters + 30 permissions = 120 individual artefacts.*
