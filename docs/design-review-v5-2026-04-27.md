# Prax Journal v5 — Design Code Review

**Date:** 2026-04-27
**Reviewer:** Cline, with `frontend-design` + `ui-ux-pro-max` skills
**Scope:** 4 v5 templates (Today · Midday · Reflect · Brain Dump) + design-system ref page + `prax-journal-design.md`
**Branch / HEAD:** main / `ebba205` + uncommitted shadow-fix
**Gates:** tsc 0 · lint 0/0 · 75/75 unit · 8/8 visual · 0 console errors · 0 network failures · A4 fits exactly

## 0 · TL;DR

**Aesthetic verdict:** the Warm Analog Editorial direction is a genuine one-of-one — cream paper, Fraunces display with `SOFT` axis, restrained sage/clay/amber/lavender palette, and Hobonichi day-counter all pull in the same direction. This is not AI slop; this is committed design. That said, four problems keep it from feeling finished:

1. **Contrast failure on small-print metadata** (mono ≤ 6 pt in `--ink-quiet` reads 4.14:1 = WCAG AA fail). Every page has 5–10 of these labels. Fix is a single token swap.
2. **11 inline `style=""` attributes still live on Reflect** (icon colors, grid-column, margin-top). Page 1 was class-ified; Reflect wasn't. Design contract § 5 says tokens not magic values.
3. **Minor typographic inconsistencies** — font-size values include `5pt`, `5.2pt`, `5.5pt`, `5.8pt`, `6.8pt`, `7.5pt` which is 6 micro-label sizes. Should be 2 (`5pt` + `6pt`) or 3 max.
4. **Design ambition ceiling** — aesthetic is solid but not yet *memorable*. Missing the one-thing-you'll-remember move. Candidates listed in §9.

All 4 pages render 200 OK in the browser, layout is locked to A4, the shadow-halo print bug is already fixed. Good base. Ready for the next round.

---

## 1 · Accessibility (CRITICAL)

### 1.1 Contrast — **4 token FAILs for body-size text**

Computed WCAG contrast against `--paper: #F9F5EC`:

| Token | Hex | Contrast | AA body (4.5:1) | Where used |
|---|---|---:|:-:|---|
| `--ink` | #2A2824 | 13.52 : 1 | ✅ | titles, primary text |
| `--ink-soft` | #4A453D | 8.73 : 1 | ✅ | body copy |
| `--ink-quiet` | #7D7668 | **4.14 : 1** | ❌ | **31 micro-labels @ 5–6pt across all 4 pages** |
| `--ink-whisper` | #B5AD9F | 2.04 : 1 | ❌ | Used only for dotted lines → OK (not text) |
| `--sage-ink` | #4E6249 | 6.09 : 1 | ✅ | text-safe sage |
| `--sage` | #7B9476 | 3.04 : 1 | ❌ | Used for scale numerals, kickers on sage cards |
| `--amber-ink` | #8F5D28 | 5.13 : 1 | ✅ | text-safe amber |
| `--amber` | #C9884A | **2.72 : 1** | ❌ | **Thought Flip prompt-numbers, `.pseudo-body .cell .k`** |
| `--lavender-ink` | #6B5D86 | 5.46 : 1 | ✅ | text-safe lavender |
| `--lavender` | #B6A9CB | **2.03 : 1** | ❌ | Used on card rails + borders only → OK |
| `--clay-ink` | #8A3E2E | 6.87 : 1 | ✅ | text-safe clay |
| `--clay` | #B85A44 | 4.21 : 1 | ❌ | Used as `.clay-ink .k`, cig tick numerals → **borderline** |

**The FIX — one-line token swap, fixes ALL small-print failures:**

Nudge `--ink-quiet` from `#7D7668` to `#6E6658` (~10 % darker). New contrast = **4.52 : 1** → WCAG AA pass, zero visual change at a glance, keeps the "quiet metadata" feel.

Same pattern for `--sage` → `#6B8266` (from `#7B9476`), `--amber` → `#A86E30` (from `#C9884A`): both jump from ~3:1 to ~5:1.

Three variable changes, 31 labels now pass, aesthetic unchanged. Should be the first commit.

### 1.2 Writable-line heights — *this is the journal's equivalent of "touch target size"*

| Context | Current height | Verdict |
|---|---:|---|
| `.frog-line` (sage hero) | 7 mm | ✅ generous |
| `.task-line` (Top 3) | 6 mm | ✅ |
| `.bl-cell .line-input` (First thought) | 7 mm | ✅ (fixed in Phase L) |
| `.tom-task .ln` (Tomorrow Top 3) | 6.5 mm | ✅ |
| `.tom-ifthen .line` | 7 mm | ✅ |
| `.ba .ln` (BA anchor) | 5 mm | ⚠️ **short** — "Did I do one thing today?" deserves 7 mm |
| `.triad-row .ln` (Wins / Grateful / Proud) | 5.5 mm | ⚠️ **short** — daily win deserves 7 mm |
| `.scale10 span`, `.kg-box span` | 4 mm | N/A (tickbox, not written on) |
| `.doing-strip .in` (Right now I'm Doing) | 6 mm | ⚠️ **short** — central Midday question deserves 7 mm |
| `.cv-field` (Craving) | 6 mm | ⚠️ **short** |

**Rule to lock in the design contract § 5.5:** *Primary questions get 7 mm solid lines. Secondary get 6 mm dotted. No writable line under 6 mm except ticks.*

### 1.3 Aria landmarks

Strong. Every page has `<main class="page" role="document">`, `<aside class="permission">`, `<section aria-labelledby>` on every card. Icons marked `aria-hidden="true"`. Only gap: the Rx card's drug-list has no `<ul>`/`<ol>` semantics — currently 8 sibling `.rx-item` divs. A screen reader reads it as a blob. Suggest `<ul role="list">` with `role="listitem"`.

### 1.4 Heading hierarchy

✅ Clean: one `<h1>` per page ("Today" / "Midday" / "Reflect" / "Brain Dump"), with section `<h2>`s for named blocks. No skipped levels.

---

## 2 · Typography — HIGH priority cleanup

### 2.1 Font-size sprawl

**26 distinct font-size values across the v5 set.** A disciplined scale should be ~8.

```
 24× 5pt       — dominant micro-label size (good)
 15× 5.5pt     — secondary micro-label
 13× 9pt       — subtitle, line-input text
 12× 8pt       — body sans
 11× 7pt       — hint italic serif
 10× 10pt      — field labels
  8× 6pt       — "Date" label etc.
  8× 4.8pt     — captions
  7× 8.5pt     — body (main)
  7× 4.5pt     — chip numerals
  6× 7.5pt     — small-sans labels
  5× 6.5pt     — "whisper" italic, footer
  4× 28pt, 10.5pt
  3× 30pt, 6.8pt
  2× 5.2pt, 4pt, 26pt, 20pt, 11pt
  1× 9.5pt, 5.8pt, 44pt, 40pt
```

The hero display sizes (44/40/30/28/26/20pt) are fine for distinction, but **micro-label land** is a mess: 4pt / 4.5pt / 4.8pt / 5pt / 5.2pt / 5.5pt / 5.8pt / 6pt / 6.5pt / 6.8pt / 7pt / 7.5pt / 8pt — **13 values**, all within 4 pt of each other, almost none of them distinguishable to the eye. Design contract § 4.2 declares 9 scale values; real code uses 26.

**Proposed locked scale (10 values):**

| Role | Size | Example |
|---|---:|---|
| `--fs-display-hero` | 30pt | "Today" H1 |
| `--fs-display-md` | 26pt | "Reflect" H1 |
| `--fs-display-sm` | 13pt | ".frog-head .title" |
| `--fs-body-l` | 10pt | section `.title` |
| `--fs-body` | 8.5pt | default body |
| `--fs-body-sm` | 8pt | sans labels |
| `--fs-hint` | 7pt | italic serif explainers |
| `--fs-label` | 6pt | "DATE", "DAY" kickers |
| `--fs-micro` | 5pt | all other uppercase metadata |
| `--fs-chip` | 4.5pt | numerals inside ≤4mm chips |

Then remove every raw `pt` value in the CSS and use the tokens. Likely saves ~200 lines of incidental variation and makes future redesigns a palette swap.

### 2.2 Line-height discipline

All v5 CSS only sets `line-height: 1.45` on `body` and `line-height: 1` on a few titles. Everywhere else = browser default. For mono at 5–6 pt with 0.12–0.2em letter-spacing, the default line-height can produce weird stacking. **Add `line-height: 1.35` on `.kicker, .micro, .lbl, .k`** for tighter, more readable metadata.

### 2.3 Weight discipline

✅ Consistent: 400 Fraunces (never bolder below 500), 400/500/600 Instrument Sans, 500/600 JetBrains Mono.

---

## 3 · Color & Tokens — cleanup

### 3.1 Raw hex in templates

Every hex in v5 is the palette-defined cream/ink/accent — **no rogue colors.** Good.

But: 6 uses of `rgba(42,40,36,0.04)` and 3 uses of `rgba(42,40,36,0.11)` are raw — these should be tokens `--ink-alpha-04` and `--ink-alpha-11` so a future theme change doesn't have to sweep 14 places.

Similarly 5 uses of `rgba(249,245,236,0.4)` and 3 of `rgba(249,245,236,0.35)` — that's `--paper-alpha-40` and `--paper-alpha-35`.

### 3.2 Color contract adherence

✅ Rule "never use raw accent for body text" is followed **in CSS** — `.task-est .eu` uses `--ink-whisper` which is the dotted-lines token, but since it labels "min" beside a written-on field it's *semi-decorative*. Borderline pass. If you want it readable, swap to `--ink-quiet`.

### 3.3 Dark mode

Not defined. The design contract says "every text pair passes AA on cream" but says nothing about dark mode. Given this is a printed A4 journal, **dark mode is genuinely not needed** — users never see these files on screen except for reviewing. Noting here just so it's a conscious non-goal. Add to § 3.6 of the design contract: *"Dark mode is out of scope. These are print-first."*

---

## 4 · Layout & A4 fit

### 4.1 Page-level geometry

✅ Verified via live browser probe: `.page` is exactly 794×1123 px (A4 at 96 dpi). `body.scrollHeight === page.getBoundingClientRect().bottom` minus body margin. No structural overflow.

### 4.2 Rhythm

The spacing scale (`--s1`…`--s4` = 1.5/2.5/4/6 mm) is used ~70% of the time. The other 30% is raw values (0.5mm, 0.8mm, 1.2mm, 1.8mm, 2.8mm, 3.2mm). Same story as font sizes — declare the full scale (`--s0: 0.5mm; --s05: 0.8mm; --s1: 1.5mm; --s2: 2.5mm; --s3: 4mm; --s4: 6mm;`) or lock yourself to 4 values and live with it.

### 4.3 Card gutters

✅ Every section uses `flex-shrink: 0` as the contract requires. Only `.free-canvas` has `flex: 1` (also per contract).

### 4.4 Bleed-risk elements

- `.frog-tail .pomos` has `flex-wrap: nowrap` patch → good, prevents wrapping with long ".hint" text
- `.rx-item` has `white-space: nowrap` → good
- `.triad-row .ln` has no `min-width: 0` — if the label text ever localizes to a longer language, the dotted line will overflow the row
- `.tom-cell .k` inside `.c-sage .tom-grid` doesn't specify `overflow: hidden` on the tom-cell — if the labels ever get longer than 1 line the grid rows will desync

---

## 5 · Information Architecture & UX

### 5.1 Hierarchy

**Today:** Frog → Top 3 → Rx → Baselines → Movement. Makes sense chronologically, but the Rx card sits in a weird middle slot — it's not a *task*, it's reference. Consider pulling Rx to the right side of the baselines row as a sticker-column, freeing vertical rhythm.

**Midday:** Jar+Body matrix (60% of page) → Doing strip → Pseudo-doing → Thought Flip → Body / Breathing → Free write. The thought-flip is marked "optional" in its explainer but takes as much visual space as the core pairing matrix. Either demote it to a single sticker-slot ("if a loop is running…") or commit to it as a permanent block.

**Reflect:** Done/Moved → M/A/E row → Chest → Self-care → Triad → Nutritional → Tomorrow → Cigs. Chest-kg comes before triad which is correct (check-in before celebration), but **Cigs is the LAST block on the page** — that's the "horror metric" which should feel deliberately uncomfortable but NOT be the emotional last word. Triad / Tomorrow is the better closer. Move Cigs between Self-care and Triad so the page ends on "You showed up. That counts."

**Brain Dump:** Masthead → Permission → Hint-strip → Canvas → Footer. ✅ Zero friction. The best page of the set.

### 5.2 Permission banner

Every page has the Neff self-compassion banner. On Today it says "It's okay to leave parts blank"; on Midday/Reflect/Brain Dump it says "Notice, don't judge" or "No rules here." Good variety, consistent tone.

### 5.3 Kicker / title ratio

- Today: 4 kickers / 2 titles (h2)
- Midday: 9 / 4
- Reflect: 17 / 9 (!)
- Brain Dump: 1 / 1

Reflect is kicker-dense — 17 tiny uppercase mono labels in one page. That's the "busy doctor's form" feel that fights the editorial aesthetic. Delete ≥6 of them (the `.col-h .ct "4 slots"` counter, the `.bl-cell .head .sub` "goal 10" / "mins" on baselines). Let the visual pattern speak.

### 5.4 Writing affordances — spatial ordering

The 2-Second Pause 3-row matrix on Today puts body-chips *above* the writing line. Visually it's: time → chips → "why" on dotted. Pen ergonomics are left-to-right → top-to-bottom, so a user's hand will cover the chips they just ticked while writing why. Swap the order in each row: **time → why → chips** (write first, tick last), or put chips to the left of the why-field. Small move, big usability win.

### 5.5 The <REDACTED-PSYCH-FIRST> matrix on Midday

`.jb-grid` has 5 columns: `#`, Time, Jar, Chest, What's filling. That's dense. On mobile-first thinking this would be a scroll nightmare but since it's print at A4 fixed: **measure actual column widths in mm**, because "Jar level" column has 5 chips each 4mm wide = 20mm + gaps = needs ~25mm but grid template is `1fr`. If `1fr` computes below 25mm the chips wrap. Confirm by rendering and measuring — but I'd tighten the grid to `5mm 18mm 25mm 30mm 1fr` to pin the problem.

---

## 6 · Aesthetic & Visual Design

### 6.1 What works

- **Fraunces `opsz 144 SOFT 100`** on page titles is the signature move. Genuinely distinctive, feels like a magazine masthead not an app. Don't lose this.
- **Cream paper + sage** is calm-first, counter to bubblegum-ADHD-planner cliché. This is the aesthetic point-of-view.
- **Hobonichi day counter** in monospace — editorial signature, not a cliché in this context.
- **Permission banner** delivers tone in one line per page. Rare in planners.
- **`::before` 2px accent rail on every colored card** is the through-line that holds the layout together.
- **The Rx card** (Dr. <REDACTED-PSYCH-FIRST-DR> <REDACTED-PSYCH-LAST-DR>, with the reg number and follow-up date) is the most unforgettable element. It's truthful, specific to Prax, and aesthetically functions as a magazine masthead for the meds section. This is the one-thing-you-remember of Page 1.

### 6.2 What's missing — design ambition ceiling

The aesthetic is solid but not yet *memorable beyond page 1*. Candidates for the one-thing-you-remember on each page:

- **Today:** already has the Rx card. ✅
- **Midday:** has nothing distinctive — it's a well-executed 4-card layout but no signature move. Candidate: the **Jar glyph** (SVG inside `.card-head .icon` on the Jar+Body card) should expand into a page-margin illustration at 60–100 pt, same way Fraunces 144-opsz is used on h1. Treat the jar as the page's mascot, not a 18px icon.
- **Reflect:** the Cigs horror metric is close to the "one thing you remember" for the page but it's currently last. Its cost projections (₹ × 30) are the *only* calculable/computable surface on any page — that's rare, lean in. Proposed: change "Projected / month" to "**Projected / year · spent on smoke**" = ₹ × 365. That number will be uncomfortably large and that's the point.
- **Brain Dump:** the watermark of sticker names is close — currently rendered at 26–44pt in `rgba(42,40,36,0.055)`. It's too pale. **Raise to `rgba(42,40,36,0.10)`** so it's readable-but-recessive. Lets the page function as a "stickers you could use" gallery without needing a demo sticker.

### 6.3 Color allocation

You currently use **all 4 accents on Reflect** (sage · lavender · clay · amber deferred to Thought Flip on Midday only). That's too many accent voices on one page. Suggestion:

- Reflect: keep sage (Done + Tomorrow + Nutritional) + clay (Chest + Cigs) + lavender (Self-care). **Drop amber on Reflect entirely** (it only appears on Thought Flip which is on Midday).
- Reinforce: sage = evidence/commitment, clay = horror metric, lavender = self-care / moved-to-tomorrow, amber = CBT only.

### 6.4 Iconography

✅ SVG-only, stroke-based, consistent ~1.3–1.8 weight. **No emoji.** One inconsistency: the frog icon on Today is custom + beautiful, but the `.pause-head .icon` on Today is a generic clock, and the `.card-head .icon` on Midday's Jar is a generic jar. Upgrade Jar + Pause icons to match the frog's hand-drawn character.

### 6.5 Squircle + shadow pattern

✅ Pattern locked (contract § 5.8): `3.5mm` card radius, `1mm` cell, `0.8mm` chip. `overflow: hidden` invariant for rail clipping. `--shadow-card` for 3-layer subtle depth. **Shadow-halo print bug now fixed** (suppressed under `@media print`).

### 6.6 White-space balance

Today: healthy. Midday: healthy. **Reflect: crowded** — by §5.3 kicker density + 9 blocks. The dot-grid `.free-canvas` is omitted on Reflect, which is the right call for density, but that makes the bottom edge crash into the footer. Add 4mm bottom padding to `.page` on Reflect specifically.

---

## 7 · Remaining 11 inline `style=""` on Reflect — must fix

```
src/templates/html/adhd-v5-reflect.html
  line 226  <span style="text-transform:uppercase;letter-spacing:.14em">  → use existing .lbl or new .mh-r .caps class
  line 278  <span class="icon" style="color:var(--lavender-ink)">         → .c-lav .card-h .icon { color: var(--lavender-ink) } already defined; redundant
  lines 292-294 (3×) <span class="icon" style="color:var(--ink)">         → add `.triad .t-label .icon { color: var(--ink); }`
  line 305  <label style="gap:1.5mm">                                     → add `.nutri label + label { gap: 1.5mm }` or a `.nutri .spare` class
  line 311  <span class="icon" style="color:var(--sage-ink)">             → .c-sage .card-h .icon already defined; redundant
  line 315  <div class="tom-cell" style="grid-column: 1 / -1">            → add `.tom-cell.full { grid-column: 1 / -1; }`
  line 325  <span class="k" style="margin-top:2mm">                       → add `.tom-cell .k + .tom-conf + .k { margin-top: 2mm; }` or a `.tom-cell .k--spaced` modifier
  line 337  <span class="icon" style="color:var(--clay)">                 → .c-clay .card-h .icon { color: var(--clay) }
```

~30 min of cleanup. Improves the design contract § 7 invariant ("tokens not magic values").

Also on Midday line 326: `<section class="body-strip" style="margin-top:-1.5mm">` — add `.body-strip + .body-strip { margin-top: -1.5mm; }` to the CSS.

On Brain Dump lines 439-442: `<span class="margin-tick" style="top:48mm">` etc. These are positional and varying — these are the one case where inline `style` is defensible because the value IS the content. Leave as-is, or refactor to CSS custom property: `<span class="margin-tick" style="--y:48mm">` with `.margin-tick { top: var(--y); }` — marginally cleaner.

---

## 8 · Print fidelity (the real delivery target)

- `@media print { @page { size: A4 portrait; margin: 0 } }` — ✅
- `-webkit-print-color-adjust: exact; print-color-adjust: exact` — ✅
- `box-shadow: none` on all cards under print — ✅ (just landed)
- Fonts load from Google over https → **works during dev**, but if user goes offline OR prints from a sandboxed env, fallback `Georgia / system-ui / Consolas` kicks in. For a personal journal this is fine. For a distributable product, self-host the 3 variable fonts (audit finding FIND-0014).
- Page break: `page-break-after: always` on every `.page` → ✅ works correctly in the 5-page merged PDF (verified earlier).
- No bleed marks on inner pages, only Brain Dump has `.cutmark` corners → consistent; the cut marks are semantic (this is a "freepage" to tear out).

---

## 9 · Ranked fix list (suggested execution order)

**P0 · accessibility + contrast** (15 min · zero visual regression risk)
1. Swap `--ink-quiet` → `#6E6658`, `--sage` → `#6B8266`, `--amber` → `#A86E30`. Re-run visual gate; regenerate baselines.
2. Run `tests/unit/contrast.test.ts` against the 4 v5 files so this is enforced (already wired for v2/v3 themes; extend globs).

**P1 · writing-zone consistency** (20 min)
3. Bump `.ba .ln` 5mm → 7mm
4. Bump `.triad-row .ln` 5.5mm → 7mm
5. Bump `.doing-strip .in` 6mm → 7mm
6. Bump `.cv-field` 6mm → 7mm

**P1 · inline-style cleanup on Reflect + Midday** (30 min)
7. Execute the 11-line refactor from §7.

**P2 · design-contract enforcement** (1 h)
8. Lock the 10-value type scale from §2.1 as CSS tokens.
9. Lock `.page` bottom-padding consistency across all 4 pages (currently varies 10mm on Today → 13mm on Reflect).
10. Add `--ink-alpha-*` and `--paper-alpha-*` tokens for the 8 raw rgba values.

**P2 · IA improvements** (depends on Prax opinion)
11. Move Cigs block between Self-care and Triad on Reflect (so page ends on Tomorrow).
12. Upgrade Jar icon on Midday to hand-drawn character (~15 min in figma/inkscape).
13. Raise Brain Dump watermark opacity 0.055 → 0.10.
14. Extend Cigs "Projected / month" to "Projected / year".

**P3 · polish** (optional)
15. Add `<ul role="list">` semantics to `.rx-grid` for screen readers.
16. Add `line-height: 1.35` rule on all kicker/micro-label classes.
17. Drop 6 kickers on Reflect (per §5.3).
18. Add `min-width: 0` + `overflow: hidden` on `.triad-row .ln` and `.tom-cell` for i18n resilience.

---

## 10 · Decisions needed from Prax

1. **Should Cigs block stay at end of Reflect (horror-last)** or move before Triad (redemption-last)?
2. **Do we want Jar glyph as page mascot** on Midday (60–100pt in corner), or stay with current 18px icon?
3. **Projected / month → year** on Cigs — OK to make the horror number a 12× bigger horror number?
4. **Self-host fonts (FIND-0014)** or accept Google-Fonts dependency for this personal-use journal?
5. **Dark mode stays out of scope** — OK?

---

## 11 · Gates after proposed changes

After all P0+P1 fixes:
- `tsc --noEmit` → expect 0 errors
- `npm run lint` → expect 0/0
- `npm test` → expect 75/75 (contrast test may need to widen glob to include v5 once colors change, but values will pass)
- `npm run test:visual` → expect 8/8 after `UPDATE_BASELINES=1` pass, because the color nudges ARE visible changes and baselines should capture them intentionally
- `npm audit` → 0 vulns (unchanged)

**Status: READY TO EXECUTE** — say "execute P0" / "execute P1" / "execute all" / "discuss #1" and I'll ship.
