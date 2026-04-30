# `apps/gallery` — DESIGN.md

> Design tokens + usage rules for the pretext-templates gallery.
> Inherits palette & typography from `packs/journals/prax-journal/DESIGN.md`.
> Approved direction: [wireframes-v2.html](../../../.gstack/projects/goodnotes-templates/designs/pretext-gallery-homepage-20260430/wireframes-v2.html) (design review v1, 2026-04-30).

Extracted per design-review D-3 (lands before any Astro component ships).

---

## Palette — Warm Analog Editorial

| Token | Hex | Usage |
|---|---|---|
| `--paper` | `#F9F5EC` | Page background (primary) |
| `--paper-dark` | `#F0EAD9` | Card/panel surfaces |
| `--paper-deep` | `#E6DEC6` | Recessed / noted regions |
| `--ink` | `#2A2824` | Body text · headlines |
| `--ink-soft` | `#4A453D` | Secondary body |
| `--ink-quiet` | `#7D7668` | Meta · captions |
| `--ink-whisper` | `#B5AD9F` | Placeholders · decorative rules |
| `--sage` | `#7B9476` | Accent green (buttons · focus ring offset) |
| `--sage-ink` | `#4E6249` | Dark sage for text on pale surfaces |
| `--sage-tint` | `rgba(123, 148, 118, 0.12)` | Sage background wash |
| `--clay` | `#B85A44` | Clay red (tertiary accent) |
| `--clay-deep` | `#8B3E2E` | Clay on darker surfaces |
| `--amber` | `#D4A853` | **Decorative only** — never body text unless on dark ink |
| `--amber-accessible` | `#C69830` | **Body-safe amber** (4.7:1 on paper) — USE FOR TEXT |
| `--washi-blue` | `#B4CDE6` | Tape/sticker accent |
| `--washi-pink` | `#F5C8C2` | Tape/sticker accent |
| `--washi-sage` | `#CFD9C4` | Tape/sticker accent |
| `--highlighter` | `rgba(255, 240, 120, 0.55)` | Marker highlight behind inline text |
| `--hairline` | `#D8D0BE` | 1px rules, dividers |

> **A11Y-1 rule (from design review):** Amber `#D4A853` fails 2.2:1 contrast on cream and **must not** appear as body text on `--paper`. Wherever amber is semantically required on text, use `--amber-accessible` (`#C69830`, 4.7:1+).

---

## Typography

Production target is **3 fonts** (design-review D-1):

| Token | Family | Fallback |
|---|---|---|
| `--serif` | Fraunces | Georgia, serif |
| `--mono` | JetBrains Mono | Menlo, monospace |
| `--hand` | Caveat | cursive |

The wireframes currently load 6 (adds Instrument Sans, Instrument Serif, Reenie Beanie). Those three are **dev-only placeholders** for v2 mockup rendering; the W4 scaffold inherits that set to match the approved look, and D-1 polish cuts the extras in a follow-up commit before ship.

Self-hosted via `shared/fonts/` (see `packs/journals/prax-journal/DESIGN.md` for license details). Google Fonts CDN is the dev fallback with `display=swap`.

---

## Spacing & rhythm

Baseline grid: **8 px**. All margins/padding/gaps use 8 × `{0.5, 1, 1.5, 2, 3, 4, 6, 8, 12}`.

- Section gutters: desktop 96 px · tablet 64 px · mobile 40 px.
- Max content width: 1200 px (hero blocks may bleed).
- Vertical rhythm: multiples of 8 px; never loose values.

---

## Breakpoints (design-review responsive spec)

| Breakpoint | Label | Layout change |
|---|---|---|
| `@media (max-width: 599px)` | Mobile | 1 specimen · vertical pack list · theme swap as `<select>` |
| `@media (min-width: 600px) and (max-width: 1023px)` | Tablet | 2-col shelf · pill-row theme swatches |
| `@media (min-width: 1024px)` | Desktop | Full wireframes-v2 layout · 3-specimen hero stack |

---

## Interaction states (inherits design-review PASS 2 matrix)

Every interactive surface MUST define all five states before ship:

```
LOADING | EMPTY | ERROR | SUCCESS | PARTIAL
```

See design review PASS 2 (§ /plan-design-review) for the full per-feature matrix.

---

## Accessibility (WCAG 2.2 AA)

Locked from design-review PASS 6:

- **A11Y-1** Amber `#D4A853` never body text on paper → use `--amber-accessible`.
- **A11Y-2** All interactive divs → `<button>` with `aria-label`.
- **A11Y-3** Touch targets **≥ 48 × 48 px**.
- **A11Y-4** `:focus-visible { outline: 3px solid var(--sage); outline-offset: 3px }`.
- **A11Y-5** `@media (prefers-reduced-motion: reduce)` disables all transitions & animations.
- **A11Y-6** Toast regions: `role="status" aria-live="polite"`.
- **A11Y-7** Theme selector: `role="radiogroup"` + per-option `aria-pressed`.
- **A11Y-8** Decorative SVG / swatches: `aria-hidden="true"`.
- **A11Y-9** Heading hierarchy lint-clean (no skipped levels).

---

## Motion tokens

| Token | Value | Use |
|---|---|---|
| `--ease-paper` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Default ease (everything unless noted) |
| `--dur-fast` | `160ms` | Hover / press |
| `--dur-base` | `240ms` | Theme swap · toast in/out |
| `--dur-slow` | `420ms` | Route entry · hero reveal |

All motion respects `prefers-reduced-motion`.

---

## Imagery

- **Specimen hero images**: rendered via existing `@pretext-templates/core` Puppeteer pipeline at 1200×1600 at 1.0 render-scale (from W3 T3 `PRAX_RENDER_SCALE`).
- **Blurhash placeholders**: encoded at build-time (W4 T3), 4×3 components, ≤40 chars. Decoded to 32×32 canvas `data:` URL for LCP < 1.5 s on 3G (Finding 4.1).
- **OG cards**: 7 packs × 8 themes = 56 PNG at 1200 × 630 (W10 via `sharp`).

---

## Out of scope (per design-review § 6)

No gallery dark mode · no i18n · no print stylesheet for the gallery itself · no in-browser editor · no A/B testing.

---

## Changelog

- **2026-04-30 · W4 kickoff** — initial DESIGN.md extracted from wireframes-v2 per design-review D-3.
