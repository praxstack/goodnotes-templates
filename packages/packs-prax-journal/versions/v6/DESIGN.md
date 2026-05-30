<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 -->

# Design — Prax Journal v6

A locked design system for this journal. Every page redesign reads this file
before emitting code. Do not regenerate per page — extend or amend this file
when the system needs to grow.

> **LIVE** — approved 2026-05-30. Single source-of-truth for v6 redesigns.


---

## Genre

**editorial** (locked from v5/v6 visual DNA).

This is a slow-read therapy journal, not a productivity planner, not a wellness
app, not a creative scrapbook. The aesthetic register is editorial-restrained:
italic Fraunces · sage hairlines · warm cream paper · permission strips · 14
distinct page archetypes that signal "different writing surface, different mode."

The genre is NOT modern-minimal (too clinical), atmospheric (too vague), or
playful (too gamified). It's editorial.

---

## Macrostructure family

The journal has **fourteen named archetypes** (locked in wave 13 CONTRACT.md).
Each page belongs to exactly one archetype. Pages within an archetype share its
shape; they vary only in copy and section content.

The 14 archetypes (lifted from `.superpowers/brainstorm/v6-wave13-archetype-system/CONTRACT.md`):

| Archetype | Pages | What it is |
|---|---|---|
| `STRUCTURED-FORM` | 01, 04, 07, 20 | Form-as-anchor: kicker + italic title + 4-8 sections + permission strip. The default. |
| `STRUCTURED-FORM-LITE` | 03, 14 | Half-strength STRUCTURED-FORM. 2-4 prompts, more whitespace per section. |
| `OPEN-PAPER` | 02, 11 | No header, no kicker, no permission strip. One micro-mark in the corner. 95% paper. |
| `LETTER-PAGE` | 09, 13 | 28mm side margins. "Dear ___," top-left. Date stamp top-right. Letter-prose baselines. No kicker. |
| `SPREAD-MAP` | 12L + 12R | Two-page spread. Left = 7-day strip. Right = synthesis grid. No running header. |
| `INVENTORY-LIST` | 06, 24 | 2-column table: domain labels left, status + notes right. Hairline rules between rows. |
| `SNAPSHOT-PAGE` | 08 | One bordered "snapshot frame" (40% of page) + caption baselines below. |
| `DIALOGUE-PAGE` | 05 | Alternating Q/A with zigzag indent — italic question right-indent, baseline answer left-indent. |
| `CARD-PAGE` | 10 | One content card centered. Body-of-page is breathing room. |
| `WORKBOOK` | 16, 17, 18, 19 | 18mm margins (tighter). Upright Fraunces title (NOT italic). Numbered bullets. Footer left-aligned inset. |
| `TITLE-PAGE` | 15 + (NEW) 00 | Vertically-centered big title. No body. No kicker. Tiny mono attribution. |
| `TABLE-OF-CONTENTS` | 22 | 2-column outline with tier-color pills + page ranges + 1-line descriptions. |
| `EMERGENCY-CARD` | 23 | 18mm margins. ALL MONO except title. NO permission strip. NO bleed. Looks unlike rest of journal. |
| `CATALOG-PAGE` | 21 | 14mm margins. Dense card grid (4×11 sticker library). |

**Distribution:** 14 distinct archetypes across 25-26 pages. Max archetype share
17% (4 pages = STRUCTURED-FORM). User flipping thumbnails sees ~14 different
page-shapes.

**Hallmark's diversification rule is INVERTED here:** within a multi-page
project, consistency is the goal. The 14 archetypes already provide the
variation — the visual DNA must NOT vary further beyond what's locked below.

---

## Theme — paper tones (BUMP 2 from wave 14)

Six tier-coded paper tones. All very low chroma. Locked from wave 14
CONTRACT.md.

| Tier | Token | Hex | HSL | Pages |
|---|---|---|---|---|
| SPINE | `--paper-spine` | `#F9F5EC` | 42°·24%·95% (kept v5 anchor) | 01, 02, 03 |
| SHELF | `--paper-shelf` | `#F2F0EC` | 40°·18%·94% | 04-11, 24 |
| WEEKLY | `--paper-weekly` | `#E8EEE6` | 110°·18%·92% (BUMP 2 sage) | 12L, 12R |
| MONTHLY | `--paper-monthly` | `#F1EFED` | 20°·12%·94% | 13, 14 |
| HOMEWORK | `--paper-homework` | `#E9E7ED` | 260°·16%·92% (BUMP 2 lavender) | 15-20, NEW 00 |
| REFERENCE | `--paper-reference` | `#F0F0EF` | 45°·4%·94% | 21, 22, 23 |

> **Wave 15 PROPOSAL — pending user approval:** shift SPINE paper from
> `#F9F5EC` to `#F6EFE2` (slightly warmer). All other tiers stay as-is.

Body fallback (the desk color around the page): `#E4DFD2` — same on every page,
not tier-coded.

## Theme — ink + accent tokens

```
--ink         #1f2126
--ink-soft    rgba(31, 33, 38, 0.7)
--ink-faint   rgba(31, 33, 38, 0.35)
--ink-ghost   rgba(31, 33, 38, 0.18)
--sage        #7e9b85
--clay        #c08866
--amber       #d6a45e
--lavender    #a89bbf
```

Sage is the v5 anchor accent. Clay is for shelf pages. Amber is for monthly.
Lavender is for homework. Crisis card uses ink-only (no chromatic accent).

## Theme — pack-color margin bleed (locked from wave 14)

A 6mm vertical stripe along the bind edge of every page (except 21 + 23):

```
--bleed-spine     rgba(126, 155, 133, 0.22)  /* sage */
--bleed-shelf     rgba(192, 136, 102, 0.22)  /* clay */
--bleed-weekly    rgba(126, 155, 133, 0.30)  /* sage stronger */
--bleed-monthly   rgba(214, 164, 94, 0.22)   /* amber */
--bleed-homework  rgba(168, 155, 191, 0.22)  /* lavender */
--bleed-reference rgba(31, 33, 38, 0.10)     /* faint ink */
```

Pages 21 (catalog) and 23 (emergency card) get NO bleed.

---

## Typography

The 2+1 type system (locked from v5/v6 DNA).

- **Display:** Fraunces, opsz 144 axis, italic by default, weight 400-500.
  Stack: `'Fraunces', 'Iowan Old Style', 'Charter', 'Georgia', serif`.
  Workbook archetype uses `font-style: normal` override (upright Fraunces) at
  weight 500 with warmer ink `#2a2226`.
  Emergency card title uses upright Fraunces at weight 600.
- **Body:** Instrument Sans, weight 400. Body size 8.5pt baseline.
  Stack: `'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif`.
- **Mono / Label:** JetBrains Mono, weight 400. Label size 6.5-8pt.
  Stack: `'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace`.

**Pairing logic:** italic editorial serif display + neutral grotesque body +
monospace labels. The "modern editorial agency" pairing applied to a journal.

**Display tracking:** -0.01em on titles ≥ 22pt. 0em on prompts. +0.02em on mono kickers.

**Type scale anchor:**
- title: 22pt (most form pages) · 64pt (TITLE-PAGE) · 28pt (CARD-PAGE)
- prompt: 13-14pt italic Fraunces
- body / baseline: 8.5pt Instrument Sans
- kicker / mono label: 6.5-7.5pt JetBrains Mono
- permission strip: 8pt italic Fraunces

---

## Spacing

The 4-point named scale used by every page.

```
--space-3xs  1mm
--space-2xs  2mm
--space-xs   4mm
--space-sm   6mm
--space-md   8mm
--space-lg   12mm
--space-xl   18mm
--space-2xl  22mm   (default page margin)
--space-3xl  28mm   (LETTER-PAGE side margin)
```

**Margins per archetype:**
- 22mm (default): STRUCTURED-FORM, STRUCTURED-FORM-LITE, OPEN-PAPER, INVENTORY-LIST, SNAPSHOT-PAGE, DIALOGUE-PAGE, CARD-PAGE, TITLE-PAGE, TABLE-OF-CONTENTS
- 18mm (tight): WORKBOOK, EMERGENCY-CARD, SPREAD-MAP-LEFT
- 28mm side / 22mm top-bottom: LETTER-PAGE
- 14mm (max-use): CATALOG-PAGE

---

## Motion

**N/A — static print PDF.** No transitions, no scroll-driven anything, no
JavaScript. The output is a flat A4 PDF imported into Goodnotes; the only
motion is the user turning pages by gesture.

For the audit trail: when the build pipeline (`build-v6-pdf.ts`) renders pages
via Playwright, it waits for `document.fonts.ready` but otherwise renders the
fully-loaded static state. No animation frames captured.

---

## Microinteractions

**N/A — static print PDF.** No hover states, no focus states, no click handlers,
no checkbox toggles. The Goodnotes nav-chip cluster (`[home]` `[shelf]` `[stickers]` `[crisis]` `[next]`) uses HTML hyperlinks pointing to `#page-NN` anchors, which Goodnotes resolves as in-PDF jumps.

---

## CTA voice

**N/A — journal templates carry no calls-to-action.** Every page is a writing
surface or a reference. There is no "subscribe", no "buy now", no "get
started." The closest thing to a CTA is the permission strip ("blank is also a
complete entry") which is the OPPOSITE of a CTA — explicit permission to do
nothing.

---

## Per-page allowances

| Tier | Decoration allowed | Sticker affordances | Rotating header/footer |
|---|---|---|---|
| **SPINE** (01, 02, 03) | Sage hairlines + chip rows | Yes (small dashed outlines) | Yes on 01 + 03; NO on 02 (OPEN-PAPER) |
| **SHELF** (04-11, 24) | Sage hairlines + per-archetype chrome | Yes | Yes on form-shaped (04, 05, 06, 07, 24); NO on 08 (SNAPSHOT — has frame instead), 09/10/11 (clean archetypes) |
| **WEEKLY** (12L+12R) | Day-strip dividers + synthesis grid | Yes (one stamp slot per day on 12L) | Yes |
| **MONTHLY** (13, 14) | Per-archetype | NO on 13 (LETTER-PAGE); Yes on 14 (STRUCTURED-LITE) | NO on 13; Yes on 14 |
| **HOMEWORK** (15-20, 00) | Workbook chrome + grounding card on 19 | Yes (workbook pages) | Yes on 16-20; NO on 15 (TITLE-PAGE) and 00 (TITLE-PAGE) |
| **REFERENCE** (21, 22, 23) | Per-archetype rigid | NO | NO (clean register) |

---

## What pages MUST share

These elements are locked across all pages. Hallmark's anti-AI-slop rule:
"locked tokens, no mid-render improvisation."

1. **The wordmark / type signature.** Italic Fraunces (display) + Instrument Sans (body) + JetBrains Mono (labels). No exceptions.
2. **The accent palette and footprint.** Sage / clay / amber / lavender / ink at no more than 22-30% opacity in the margin bleed; no full-saturation token color anywhere on the page surface.
3. **The Goodnotes nav-chip chrome.** Mono 6-7pt corner-cluster anchor links pointing to `#page-NN`. Layout/position varies by archetype (top-right on letter-page, bottom-right on form pages) but the visual treatment is identical.
4. **The 8-line tone rubric.** Every line of copy passes the rubric (see Anti-Patterns below).
5. **The print contract.** A4 portrait 210×297mm, `@page { size: A4 portrait; margin: 0; }`, paper background painted in the body, fonts loaded from Google Fonts CDN with system fallback stacks.

---

## What pages MAY differ on

These elements are the variation knobs. The 14 archetypes ARE the variation
system; pages don't get to invent new variation axes.

1. **Macrostructure** — the page picks one of 14 archetypes; the archetype determines layout, header style, footer placement, body rhythm.
2. **Paper tone** — by tier (6 values).
3. **Margin bleed color** — by tier (6 RGBA values).
4. **Margin width** — 14mm / 18mm / 22mm / 28mm per archetype.
5. **Title register** — italic Fraunces (default), upright Fraunces (workbook + emergency-card), centered + huge (title + card pages), no title (open paper + letter page).

A new page MUST pick its variation from these knobs. It MAY NOT introduce a
new font, a new accent color, a new margin width not in the list, or a new
paper tone outside the 6 tier values.

---

## Anti-patterns specific to v6

These are concrete failure modes. If a page or copy violates any, it is wrong.

### From the wave-7 therapist tone briefing (8-line rubric)

1. **No motivation required** — "today is a beautiful day" is wrong. The reader doesn't have to feel anything to use the page.
2. **No false empathy** — "I know how hard this is" is wrong. Don't perform empathy.
3. **No shame** — "you should" / "if only" / "stop doing X" is wrong.
4. **No jargon** — "cognitive distortion", "DBT", "exposure therapy", "thought record" appear only in CSS class names, NEVER in user-facing copy.
5. **No gamification** — no streaks, points, scores, levels, days-in-a-row, percentages-complete.
6. **No wellness-app voice** — no "you got this", "you're amazing", no hashtags, no emoji, no exclamations.
7. **No false promises** — never "and you'll feel better."
8. **No lying** — never imply control where there isn't any.

### From the Hallmark anti-patterns reference

9. **No fabricated content** — never invent metrics, testimonials, case-study counts, "trusted by N teams." If the user didn't supply a number, don't make one up. (Applies less to a journal but watches for invented affirmations or invented quote attributions.)
10. **No re-drawn UI chrome** — no fake browser bars, no fake phone frames, no fake IDE windows. (Less applicable to a print journal but still: don't invent ipad-mockups or paper-binder skeuomorphism.)
11. **No mid-render token improvisation** — once the theme is locked above, every color and font in any new page must reference a named token, never an inline hex.
12. **No AI-default fonts** — no Inter / Roboto / Arial / system-ui as the body face. v6 uses Instrument Sans + Fraunces + JetBrains Mono.

### From wave-15 source-DNA refusal (this redesign)

13. **No affirmation copy** — "I am worthy of love" / "I am enough" / "stay positive" — never. Direct tone-rubric violation.
14. **No watercolor illustrations as page decoration** — Planner B's signature; not safe to copy + decoration density violates v6 restraint.
15. **No hour-by-hour productivity schedule as a fixed template** — survival-mode is a complete entry; a fixed 6am-9pm grid is harmful on bad days.
16. **No gamified habit/hydration trackers** — 8-out-of-8 drops, 30-day streaks, etc. — direct rule-5 violation.
17. **No bold roman serif for display** — breaks v5/v6 italic-Fraunces anchor.
18. **No embossed/letterpress effects** — signature visual + doesn't print well + adds visual noise on a calm surface.
19. **No hardcover-book skeuomorphism** — this is a digital Goodnotes journal; cover page should be flat, not 3D-mockup.

---

## DNA borrowed from Planner B (selectively, per Hallmark soft-refuse rule)

Five elements cleared for borrow per the diagnosis. Each is structural, not signature.

1. **Cover page macrostructure (NEW page 00).** TITLE-PAGE archetype applied to the journal as a whole. Italic Fraunces "Prax Journal" centered on warm cream, mono attribution "for the harder days" at the bottom. NO embossed effect. NO author byline. NO hardcover-book mockup.

2. **Slightly warmer SPINE paper.** Shift `--paper-spine` from `#F9F5EC` to `#F6EFE2`. Half a step warmer; stays within the wave-14 saturation envelope. Improves the "less clinical" feeling on first opening without breaking v5 DNA. **Pending user approval — A/B/C tests recommended.**

3. **Hairline rule formalization.** v6 already uses sage hairlines between sections; formalize the spec — `border-top: 0.5px solid rgba(126, 155, 133, 0.4)`, padding `var(--space-md)` above and below — and apply consistently across all form-shaped pages.

4. **Date stamp top-right on TIER-1 SPINE pages (01 + 03).** Currently page 02 has a tiny mono date micro-mark (top-right inset 12mm, 6.5pt opacity 0.4). Pages 01 and 03 don't have one. Adding the same mono micro-mark gives spine pages the daily wayfinding context Planner B's daily spread carries — without the productivity baggage.

5. **Month/day strip header on weekly review (page 12L).** A tiny mono wayfinding strip "JAN FEB MAR · APR · MAY JUN JUL ... DEC" + "1 2 ... 14 ... 30" with current week highlighted. Already partially exists as "← week of __ · ___ · ____" — formalize as a proper strip at the very top of 12L, mono 6.5pt opacity 0.4.

## Refused for borrow (signature elements + tone violations)

1. All affirmation/intention copy
2. Hour-by-hour productivity schedule as fixed template
3. Watercolor illustrations
4. Gamified habit/hydration trackers
5. Bold roman serif display
6. Embossed/letterpress cover treatment
7. Sticky-note collage callouts
8. Hardcover-book metaphor

---

## tokens.css export

```css
:root {
  /* paper — tier-coded (wave 14) */
  --paper-spine:     #F9F5EC;  /* PROPOSAL: shift to #F6EFE2 (wave 15) */
  --paper-shelf:     #F2F0EC;
  --paper-weekly:    #E8EEE6;
  --paper-monthly:   #F1EFED;
  --paper-homework:  #E9E7ED;
  --paper-reference: #F0F0EF;
  --paper:           var(--paper-spine);  /* per-page override in the page's :root */

  /* desk — same on every page */
  --desk: #E4DFD2;

  /* ink */
  --ink:       #1f2126;
  --ink-soft:  rgba(31, 33, 38, 0.7);
  --ink-faint: rgba(31, 33, 38, 0.35);
  --ink-ghost: rgba(31, 33, 38, 0.18);

  /* token colors (accents) */
  --sage:     #7e9b85;
  --clay:     #c08866;
  --amber:    #d6a45e;
  --lavender: #a89bbf;

  /* margin bleed — tier-coded (wave 14) */
  --bleed-spine:     rgba(126, 155, 133, 0.22);
  --bleed-shelf:     rgba(192, 136, 102, 0.22);
  --bleed-weekly:    rgba(126, 155, 133, 0.30);
  --bleed-monthly:   rgba(214, 164, 94, 0.22);
  --bleed-homework:  rgba(168, 155, 191, 0.22);
  --bleed-reference: rgba(31, 33, 38, 0.10);
  --bleed:           var(--bleed-spine);  /* per-page override */

  /* fonts */
  --font-display: 'Fraunces', 'Iowan Old Style', 'Charter', 'Georgia', serif;
  --font-body:    'Instrument Sans', -apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif;
  --font-mono:    'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace;

  /* spacing */
  --space-3xs: 1mm;
  --space-2xs: 2mm;
  --space-xs:  4mm;
  --space-sm:  6mm;
  --space-md:  8mm;
  --space-lg:  12mm;
  --space-xl:  18mm;
  --space-2xl: 22mm;
  --space-3xl: 28mm;

  /* hairline rule (formalized in wave 15) */
  --rule-color:   rgba(126, 155, 133, 0.4);
  --rule-stroke:  0.5px;
}

@page { size: A4 portrait; margin: 0; }
```

---

## Hallmark pre-emit critique stamp

```
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
```

- **Philosophy 5/5** — clear genre, clear refusal/borrow split, all decisions traceable to wave-7 tone rubric and wave-13/14 contracts
- **Hierarchy 5/5** — sections in canonical Hallmark order, locked-vs-may-differ explicit
- **Execution 5/5** — every token, every archetype, every page assignment is concrete
- **Specificity 5/5** — exact hex values, exact HSL specs, exact margin widths, exact font stacks
- **Restraint 5/5** — anti-pattern list is longer than borrow list (correct for therapy journal)
- **Variety 4/5** — only 5 wave-15 borrow moves; could be more if user wants more change

All axes ≥ 4 — no revision pass needed.

---

## How to extend this file

When the system needs to grow:
1. Edit this file ONCE. Update the relevant section + bump the date below.
2. Run the build pipeline. The pipeline reads token values from page CSS (not from this file directly), so any token change must be propagated to all 25-26 pages via subagent dispatch.
3. Re-render thumbnail grid for visual verification.
4. Document the change in `.superpowers/brainstorm/v6-wave-NN/CONTRACT.md`.

NEVER:
- Add a new font face without writing to this file first
- Invent a new accent color outside the 5 token colors
- Override `--paper` to a hex outside the 6 tier values
- Add motion to a page (the journal is static print)
- Add a CTA voice to a page (the journal has no CTAs)
- Violate the 8-line tone rubric in any line of new copy

---

## Status

Draft. Pending user approval for:
- The 5 borrow moves listed above (cover page, warmer spine paper, hairline formalization, date stamps on 01+03, month/day strip on 12L)
- The 19-item anti-pattern list (additions from wave 7 + Hallmark + wave 15)
- The proposed paper-spine shift to `#F6EFE2`

Once approved, this file moves to `packages/packs-prax-journal/versions/v6/DESIGN.md`
and becomes the single source-of-truth for all future page edits and waves.

Date drafted: 2026-05-29.
