# Prax Journal — Design System

> The shared design language for every page of Prax's personal journal (daily, weekly, monthly, brain-dump, stickers).
> Locked on the **v4 "Warm Analog Editorial"** direction that shipped as `adhd-v4-today`, `adhd-v4-reflect`, `adhd-v4-brain-dump`.
> Every new page in this journal **must** reference this file. No exceptions, no one-off palettes.

---

## 0 · North Star

> *"A calm, warm, grown-up notebook. Cream paper. Serif masthead. Quiet mono metadata. Soft sage for the good. One clay-red horror metric for the truth. Nothing shouts. Everything breathes."*

- **Mood:** Kinfolk editorial × Code&Quill field notes × Papier London stationery × Hobonichi Techo.
- **Not:** Notion sterile · Goodnotes-marketplace bubblegum · generic "ADHD planner" noise · emoji.
- **Primary feeling goal:** *permission*. The user should feel allowed to leave things blank.
- **Core pedagogy:** Barkley Rule-of-3, Tracy's Frog, Ramsay & Rostain CBT, Neff self-compassion, Marlatt urge-surfing, Newport shutdown, Martell Behavioral Activation, Sonuga-Barke delay aversion.

---

## 1 · Page Geometry

| Token | Value | Notes |
|---|---|---|
| `--page-w` | `210mm` | A4 portrait |
| `--page-h` | `297mm` | A4 portrait |
| `--margin` | `13mm` | All four sides. Tight enough for density, loose enough to feel editorial. |
| `gap` between page sections | `var(--s3)` (4mm) | Page 2 (Reflect) drops to `2.8mm` to fit A4 — **only** exception |
| Root layout | `flex-direction: column` + `flex-shrink: 0` per section | Guarantees no A4 overflow |
| Printing | `@page { size: A4 portrait; margin: 0 }` + `print-color-adjust: exact` | All pages honor this |

**Rule:** every section is `flex-shrink: 0`. The *only* flexible region is the dot-grid canvas on Brain Dump and the `notes-strip` on Today.

---

## 2 · Spacing Scale

5mm dot-grid aligned. Use the token, never a raw mm value.

| Token | Value | Use |
|---|---|---|
| `--s1` | `1.5mm` | Hair-line gaps inside a row |
| `--s2` | `2.5mm` | Padding inside tight cells, masthead bottom |
| `--s3` | `4mm`   | Default block padding, default page gap |
| `--s4` | `6mm`   | Two-column gutters, frog internal padding |
| `--s5` | `9mm`   | Rarely — big breathing room between stacks |
| `--s6` | `13mm`  | Matches page margin, outer spacing |

---

## 3 · Color Palette — Warm Analog

Seven semantic families. Never introduce an eighth without updating this file.

### 3.1 Paper + Ink (neutral)

| Token | Hex | Role |
|---|---|---|
| `--paper`        | `#F9F5EC` | Page background. Warm cream, not sterile white. |
| `--paper-dark`   | `#F0EAD9` | Page-edge deeper cream (for shadows / cut marks) |
| `--ink`          | `#2A2824` | Primary text, hard rules, title color. Contrast on paper = **13.2 : 1**. |
| `--ink-soft`     | `#4A453D` | Body copy |
| `--ink-quiet`    | `#7D7668` | Metadata, hints, kicker text |
| `--ink-whisper`  | `#B5AD9F` | Dotted lines, subtle rules, field underlines |

### 3.2 Sage — the "good" accent (Frog, Done, Self-Care wins, Tomorrow)

| Token | Hex |
|---|---|
| `--sage`       | `#7B9476` |
| `--sage-ink`   | `#4E6249` (AA-compliant on cream) |
| `--sage-tint`  | `rgba(123, 148, 118, 0.08)` |
| `--sage-edge`  | `rgba(123, 148, 118, 0.22)` |

### 3.3 Clay — the **horror metric** (Cigs, Craving log)

One block per page, max. Designed to be *confrontational without shouting.*

| Token | Hex |
|---|---|
| `--clay`       | `#B85A44` |
| `--clay-ink`   | `#8A3E2E` |
| `--clay-tint`  | `rgba(184, 90, 68, 0.07)` |
| `--clay-edge`  | `rgba(184, 90, 68, 0.25)` |

### 3.4 Amber — CBT thought-check

| Token | Hex |
|---|---|
| `--amber`      | `#C9884A` |
| `--amber-ink`  | `#8F5D28` |
| `--amber-tint` | `rgba(201, 136, 74, 0.08)` |
| `--amber-edge` | `rgba(201, 136, 74, 0.22)` |

### 3.5 Lavender — self-care / moved-to-tomorrow (anti-shame)

| Token | Hex |
|---|---|
| `--lavender`      | `#B6A9CB` |
| `--lavender-ink`  | `#6B5D86` |
| `--lavender-tint` | `rgba(182, 169, 203, 0.10)` |
| `--lavender-edge` | `rgba(182, 169, 203, 0.28)` |

### 3.6 Contrast & Accessibility

All text ≥ **4.5 : 1** on `--paper`. Verified:
- `--ink` 13.2 : 1
- `--ink-soft` 8.7 : 1
- `--sage-ink` 5.1 : 1
- `--clay-ink` 5.3 : 1
- `--amber-ink` 4.8 : 1
- `--lavender-ink` 4.7 : 1

**Never** use a raw accent color (`--sage`, `--clay`, `--amber`, `--lavender`) for body text on cream. Always the `-ink` variant.

---

## 4 · Typography Stack

Three fonts, three jobs. Loaded once from Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

| Role | Family | Tokens |
|---|---|---|
| Serif display & editorial italics | **Fraunces** (variable: `opsz` 9–144, `SOFT` 0–100) | `--font-serif` |
| Humanist sans — body, labels | **Instrument Sans** | `--font-sans` |
| Dates, numbers, cost, metadata | **JetBrains Mono** | `--font-mono` |

### 4.1 Fraunces opsz + SOFT — how to pick

| Context | `opsz` | `SOFT` | Example |
|---|---|---|---|
| Masthead title (≥ 26pt) | **144** | **100** | "Today" page title |
| Section titles (9–14pt) | **72** | **60** | "The Frog", "Done today", "Thought flip" |
| Italic body / hints | **14** | **100** | permission banner, signoffs, hints |

### 4.2 Type Scale

| Element | Size | Font | Weight | Notes |
|---|---|---|---|---|
| Page title (masthead) | 26 – 30pt | serif | 400 | Page 1 = 30pt, Page 2 = 26pt, Page 3 = 28pt |
| Subtitle (masthead) | 8.5 – 9pt | serif italic | 400 | opsz 14 SOFT 100 |
| Section `.title` | 10 – 14pt | serif | 500 | opsz 72 SOFT 60 |
| `.kicker` | 5.5 – 6pt | mono | 500–600 | UPPERCASE · `letter-spacing: 0.12–0.18em` |
| Body / labels | 8 – 8.5pt | sans | 400–600 |  |
| `.hint` | 7pt | serif italic | 400 | opsz 14 SOFT 100 |
| `.micro-label` (inside cards) | 5 – 5.5pt | mono | 500 | uppercase · 0.1–0.12em |
| Date field / numbers | 8 – 10pt | mono | 500–600 |  |
| `.explainer` (card subtitle) | 7pt | serif italic | 400 | opsz 14 SOFT 100 · 0.75 opacity |

### 4.3 Iron rules

- **Never** bold Fraunces below 500 weight.
- **Never** italic Instrument Sans — use Fraunces italic for *that* voice.
- **Never** give mono anything but numbers, dates, acronyms, and micro-labels.
- Tracking: serif = `letter-spacing: -0.005em to -0.02em`. Sans = `-0.005em`. Mono uppercase = `0.08em–0.2em`.

---

## 5 · Core Primitives

### 5.1 `.page` — every template uses this

```css
.page {
  width: var(--page-w);
  height: var(--page-h);
  background: var(--paper);
  margin: 10mm auto;
  padding: var(--margin);
  overflow: hidden;
  box-shadow: var(--shadow-page);
  display: flex; flex-direction: column;
  gap: var(--s3);
  page-break-after: always;
}
```

### 5.2 `.masthead` — the cross-page identity

A thin hairline rule under every page. Same structure on Today, Reflect, Brain Dump, and any future page.

**Left:** `kicker (mono uppercase)` → `title (serif 26–30pt)` → `subtitle (serif italic)`.
**Right:** `Date ___________` → `day X / 365 counter` → `M T W T F S S circles` → (optional) `Filled at ___`.

### 5.3 `.permission` — the Neff banner

> *"✳ It's okay to leave parts blank. Showing up is the win. ✳"*

Every page has one. Never skip it.

- Background: `--sage-tint`, 2-px left border `--sage`
- Font: Fraunces italic 8pt, color `--sage-ink`
- Glyph `✳` in sage 0.6 opacity

### 5.4 Color-tagged cards (Frog / Thought-Flip / Self-Care / Craving / Cigs / Tomorrow)

A reusable pattern:

```
╔═ 2px solid accent-color ═══════════════╗
║                                        ║
║  [icon] KICKER (mono 5.5pt)            ║
║  Card title (Fraunces 10–13pt)         ║
║  Explainer italic 7pt                  ║
║                                        ║
║  [body grid / rows / field lines]      ║
║                                        ║
╚════════════════════════════════════════╝
  background: var(--COLOR-tint)
  border: 0.8px solid var(--COLOR-edge)
```

| Card | Color family |
|---|---|
| Frog (today) · Tomorrow's Frog · Done column | **sage** |
| Thought flip (CBT) | **amber** |
| Self-care · Moved-to-tomorrow | **lavender** |
| Cigs (horror) · Craving log | **clay** |

### 5.5 Dotted / underlined writable lines

| Class | Border | Height | Use |
|---|---|---|---|
| `.dotline` | `1.2px dotted var(--dot)` | 5mm min | Generic fill-in lines |
| `.tf-prompt .p-line` | `1.2px dotted var(--amber-edge)` | 5.5mm | Thought-flip prompts |
| `.triad-line` | `1.2px dotted var(--dot)` | 6mm | Wins / Grateful / Proud |
| `.line-row .line` | `1px solid var(--*-edge)` | 6mm | Done / Moved rows |
| `.task-line` | `1.5px solid var(--ink-whisper)` | 7mm | Top-3 task rows |
| `.frog-line` | `1.5px solid var(--sage)` | 8mm | Hero line for The Frog |

**Rule:** hero fields use a solid line (stronger ink). Secondary fields use dotted.

### 5.6 Checkboxes + radios

| Element | Shape | Border | Size |
|---|---|---|---|
| Task checkbox `.task-check` | square 1px radius | `1.2px solid var(--ink)` | 4.2mm |
| BA / tomorrow check | square 1px | `1.2px solid var(--sage)` | 4.2mm |
| Radio dot (mood, movement) | circle | `0.9px solid --ink-quiet` (or `1px solid --sage`) | 3 – 4.2mm |
| Water drops / DOW circles | circle | `0.6–0.9px solid --ink-whisper` | 3.4 – 4.4mm |
| Quality dots (1-5) | circle, numbered | `0.9px solid --ink-quiet` | 3.2mm |

**Never a red X.** Never strike-through. The v4 design *refuses* to signal failure.

### 5.7 Icons

- SVG only. **No emoji**, anywhere.
- Line weight: `1.1–1.8` (rarely `2.0`).
- `stroke: currentColor` — inherits the surrounding `-ink` color.
- Style: **hand-drawn warmth** — simple, rounded caps/joins. Frog uses the planner's signature SVG.
- Icon size inside kickers: **12–18px**. Inside hero cards: **up to 22px**.

### 5.8 Shadows

Two shadows total. That's it.

```css
/* Page — richer 3-layer stack so A4 sheets feel like printed paper */
--shadow-page: 0 1px 2px rgba(42,40,36,0.04),
               0 16px 48px rgba(42,40,36,0.10),
               0 2px 8px rgba(42,40,36,0.04);

/* Card — contact + lift + inset top highlight (hint of 3D, never loud) */
--shadow-card: 0 0.4mm 0.8mm rgba(42,40,36,0.035),
               0 2mm 5mm rgba(42,40,36,0.045),
               inset 0 0.5mm 0 rgba(255,255,255,0.6);
```

No colored shadows. No neon glow. No `filter: drop-shadow`.
Every squircle card (`.pause`, `.frog`, `.rx`, `.card`, `.chest-block`, `.nutri`) must also set `overflow: hidden;` so the `::before` 2px accent rail clips to the rounded corners — otherwise the rail bleeds past the radius and draws a flat rectangle above the card.

### 5.9 Page overflow & debug affordance

The `.page` container uses **`overflow: clip`** (not `hidden`). `clip` gives the same visual clipping for print without creating a scroll container or a new formatting context, which keeps the page a simple flow box for layout authoring.

```css
.page { overflow: clip; }
html[data-debug~="overflow"] .page {
  overflow: visible;
  outline: 2px dashed var(--ink-quiet);
  outline-offset: -2px;
}
```

Add `data-debug="overflow"` to the root `<html>` element in devtools to reveal any section that has spilled past the 297mm cutline. This is a dev-time affordance only — `@media print` always clips.

---

## 6 · Component Library (v4 blocks, reusable)

Every block below is **already shipped** in `adhd-v4-today.html`, `adhd-v4-reflect.html`, or `adhd-v4-brain-dump.html`. New pages compose from this library.

| # | Block | Color | Research | Lives on |
|---|---|---|---|---|
| B-01 | Masthead | neutral | Hobonichi day counter | All pages |
| B-02 | Permission banner | sage | Neff self-compassion | All pages |
| B-03 | The Frog card | sage | Tracy + Sonuga-Barke | Today |
| B-04 | Top 3 Today | neutral | Barkley Rule of 3 | Today |
| B-05 | Body row (Meds / Sleep / Water) | neutral | Clever Fox time-of-day | Today |
| B-06 | Movement row | sage | — | Today |
| B-07 | Cigs horror metric | clay | NHS cost calc + Allen Carr | Today |
| B-08 | Notes strip (dot grid 5mm) | neutral | — | Today bottom |
| B-09 | Done / Moved two-col | sage / lavender | Newport + Neff | Reflect |
| B-10 | Mood + Energy row | neutral | PHQ-2 Lite | Reflect |
| B-11 | Thought Flip (3-prompt CBT) | amber | Ramsay & Rostain 2015 | Reflect |
| B-12 | Self-care + BA anchor | lavender + sage | Martell BA | Reflect |
| B-13 | Wins · Grateful · Proud triad | neutral | Clever Fox wins | Reflect |
| B-14 | Craving log (urge surfing) | clay | Marlatt | Reflect |
| B-15 | Tomorrow's Frog pre-commit | sage | Newport shutdown | Reflect |
| B-16 | Dot-grid canvas (ruler ticks) | neutral | — | Brain Dump |
| B-17 | Corner cut marks | neutral | Editorial signature | Brain Dump |
| B-18 | Footer (signoff + page marker) | neutral | — | All pages |

Footer always has: italic serif signoff (left) + mono page marker `Today · 1 / 3` (right).

---

## 7 · Voice & Copy

**Rule:** the journal talks *to* you, never *at* you. Gentle imperative. Second person allowed only in hints. No exclamation marks. No CTA language.

| Context | ✅ Say | ❌ Don't |
|---|---|---|
| Permission banner | "It's okay to leave parts blank." | "Fill in every field!" |
| Frog hint | "Do this FIRST. Everything else is bonus." | "Top priority task:" |
| Moved column | "no shame · no red X" | "Failed · Undone" |
| Footer signoff | "You showed up. That counts." | "Goal achieved!" |
| Cigs micro-label | "Today's total" · "Projected / month" | "Damage report" |
| Craving prompt | "Next time I'll try…" | "Why did you relapse?" |
| Brain dump hint | "No rules here. Say anything, or leave it all blank." | "Write your thoughts here" |

Kickers use lowercase mono (`the daily · morning edition`, `evidence log`, `behavioral activation`). Titles use sentence case in Fraunces. Acronyms (CBT, BA, PHQ, NHS) stay uppercase in mono.

---

## 8 · Motion, Ornament, Restraint

- **No animations.** These are print-first A4 pages.
- **No gradients.** Tints only (rgba with low alpha).
- **No emoji.** SVG icons only.
- **No rounded corners** above `2px` on cards. Use `1px` or `2px` only.
- **One accent per block.** If a section has sage, nothing else in that section gets amber/clay/lavender.
- **Kicker + serif + mono metadata** is the signature rhythm — use it on every new block.

---

## 9 · Patterns for New Pages

When adding a new daily/weekly/monthly page, follow this order:

1. **Start with `.page` + `.masthead` + `.permission` + `.footer`.** Never skip these four.
2. **Pick 1 clay block** (max). If the page doesn't need a horror metric, skip clay entirely.
3. **Pick 1–2 sage blocks** (Frog-analogue, commitment, evidence log).
4. **Pick at most 1 amber block** (CBT thought-flip or equivalent).
5. **Pick at most 1 lavender block** (self-care, soft handoff).
6. **Leave breathing room** — minimum 20–25mm total vertical whitespace.
7. **Include hints** — every card has a 1-line italic explainer.
8. **Signoff in voice** — italic serif left of footer.

Weekly reflection, monthly reflection, and brain-dump will all follow this pattern.

---

## 10 · File Naming Convention

### v4 — Generic (3-page)
| Type | Filename | Template ID |
|---|---|---|
| Daily — morning | `src/templates/html/adhd-v4-today.html` | `adhd-v4-today` |
| Daily — evening | `src/templates/html/adhd-v4-reflect.html` | `adhd-v4-reflect` |
| Daily — brain dump | `src/templates/html/adhd-v4-brain-dump.html` | `adhd-v4-brain-dump` |

### v5 — Prax-personal (4-page, therapist-integrated)
| Type | Filename | Template ID |
|---|---|---|
| Daily — morning | `src/templates/html/adhd-v5-today.html` | `adhd-v5-today` |
| Daily — midday (2 PM) | `src/templates/html/adhd-v5-midday.html` | `adhd-v5-midday` |
| Daily — evening | `src/templates/html/adhd-v5-reflect.html` | `adhd-v5-reflect` |
| Daily — brain dump | `src/templates/html/adhd-v5-brain-dump.html` | `adhd-v5-brain-dump` |

### Future (same contract)
| Type | Filename | Template ID |
|---|---|---|
| Weekly — reflection | `src/templates/html/adhd-v4-weekly-reflect.html` | `adhd-v4-weekly-reflect` |
| Monthly — reflection | `src/templates/html/adhd-v4-monthly-reflect.html` | `adhd-v4-monthly-reflect` |
| Stickers | `src/stickers/<family>/<name>.html` | — |

**v4 vs v5:** Both share this design contract 1:1 — same tokens, same fonts, same component library, same voice. v5 adds therapist-guided blocks (2-Sec Pause, Jar+Body, Chest-kg, blank Rx card, Named Patterns, Nutritional meds). v4 stays as the generic/shippable product line.

---

## 11 · Design System Reference Page

A single, living HTML page renders every token / primitive / block visually at 1:1 A4 scale:

- **File:** `src/templates/html/prax-journal-design-system.html`
- **URL (dev server):** `http://127.0.0.1:4040/template/prax-journal-design-system.html`

Anyone building a new page should open this first — it's the design system in picture form.

---

## 12 · Source of Truth

If the Markdown here and the CSS in v4 templates ever disagree, **the shipped v4 templates win** — update this file to match. This document is a descriptive contract, not a spec that drives code generation.

**Last synced from:** `src/templates/html/adhd-v4-today.html`, `adhd-v4-reflect.html`, `adhd-v4-brain-dump.html`.
