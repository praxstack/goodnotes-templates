# Customisation · tiered spec

> **Status (v1.1.0, 2026-05-10):** Tier 1 and Tier 2 ship in v1.1.0.
> Tier 3 is a design commitment, not a shipped artifact.

The original pretext-templates pitch was "programmatic, self-contained templates."
The audit of that pitch exposed a gap: users who liked a pack's layout but
wanted different colors had no recourse except forking the HTML. **Customisation**
is the answer — a three-tier story that makes every pack **personal without
sacrificing self-containment**.

The invariant stays: every HTML file in `packages/packs-*/` is still
self-contained. Customisation is an **additive, overrideable** layer applied
*after* the pack HTML, never by mutating it.

---

## Tier 1 · Profile (CLI-only, ships today)

**Who:** Existing `prax-journal` pack users and future personal-journal packs.
**What:** Fill your real data into placeholders via a `profile.json` file.
**How:** `substituteProfile()` walks the HTML, replaces whitelisted tokens
(`DR_*`, `RX_*`, `DAY_*`, etc.) with values from your profile, and produces a
personalised PDF.
**Status:** Shipped in v1.0.0. Currently scoped to `prax-journal` only.

```bash
npx pretext-templates render packages/packs-prax-journal/versions/v5/today.html \
  --profile ~/my-profile.json \
  -o output/today.pdf
```

Schema: [`packages/packs-prax-journal/profile.example.json`](../packages/packs-prax-journal/profile.example.json)
· Validated by Zod at render time · Untrusted keys ignored · PII is never
written back to disk.

**Future work (v1.2+):** Extend profile support to any pack that declares
`customisation.profile` in its `manifest.json`. Opt-in, per-pack.

---

## Tier 2 · Themes (gallery, ships v1.1.0)

**Who:** Anyone who sees a pack they like on the gallery.
**What:** Pick any of **14 palettes** (7 families · light & dark). Download a
PDF in that palette. No tools to install, no account, no CLI.
**How:** At build time, `scripts/render-all-pack-themes.ts` generates 27 × 14 =
378 PDFs by injecting each theme CSS file into every pack's `<head>` *after*
the pack's own `:root`. The CSS cascade guarantees the theme wins for color
tokens (`--background`, `--foreground`, `--primary`, `--accent`, `--border`,
etc.) while layout tokens (`--page-w`, `--s1`..`--s5`, `--font-sans`,
`--shadow-card`) stay the pack's own.
**Status:** Shipping now (v1.1.0).

**Gallery surface:** A 14-swatch picker on every pack page
(`apps/gallery/src/pages/packs/[id].astro`). Each swatch is a same-origin
download link to `/packs/<pack-id>/<theme-id>.pdf`. Keyboard-accessible,
screen-reader-labelled, works without JavaScript.

**The 14 themes**

| Family | Light | Dark |
|---|---|---|
| Bold Tech | violet on lavender-white | neon violet on deep indigo |
| Bubblegum | magenta on pink paper | coral on teal-slate |
| Caffeine | cocoa on cream | warm amber on espresso |
| Candyland | cherry on lilac-white | pink-candy on plum |
| Claude | terracotta on parchment | terracotta on charcoal |
| Cyberpunk | neon-magenta on cool white | neon-magenta on midnight |
| Doom64 | oxblood on concrete | crimson on graphite |

**Compatibility:** 25 of 27 packs use the shared CSS custom-property
vocabulary and theme cleanly. The 2 outliers (specific legacy packs that
hardcode hex) still produce a valid themed PDF — only the hardcoded
elements keep their original color. No crash, no broken layout.

**Engineering invariant preserved:** The 27 source pack HTMLs are never
modified. The theme layer is composed at render time into a throwaway
in-memory HTML string. A fork of the repo without the theme layer still
produces the canonical 27 PDFs exactly as before.

---

## Tier 3 · In-browser editor (future · shapes v1.x+)

**Who:** Users who want to type their name, adjust dates, or tweak a prompt
before downloading — no CLI, no account.
**What:** A single-page "/customise/<pack-id>" route where users:
1. Pick a theme (Tier 2 swatches, but live-applied).
2. Fill declared fields (text inputs bound to `data-field-id` markers in
   pack HTML).
3. Preview live. Export PDF.
**How:** Options are under active design. Leading candidates:
- **Option A: Cloudflare Worker** — POST filled HTML → Chromium on CF edge →
  PDF. Needs Puppeteer-on-Workers (possible via `@cloudflare/puppeteer` but
  still in preview). One render per click, unbounded cost.
- **Option B: Browser-side CSS Paged Media** — use `paged.js` or native
  `window.print()` to a PDF. Zero server. Limited layout fidelity vs
  Chromium.
- **Option C: Client-side rendering to a chosen pre-rendered PDF** — ship
  the pre-rendered themed PDF unchanged, use client JS + `pdf-lib` to write
  user inputs into form fields on top of it. Cheap, printable, but scoped
  to simple text overlays.

**Decision gate:** Tier 3 is not on the roadmap until Tier 1+2 have
real user demand. The evidence we're waiting for: are themed-PDF download
counts meaningfully higher than canonical-PDF download counts? If yes,
ship Option B or C first (cheap, no infra) and revisit Option A if that
still leaves demand on the table.

---

## Why not just one big theme-picker slider?

The tiered approach maps to **what users can actually do without new skills**:

- **Tier 2 (Themes)** is zero-friction: anyone with a browser can click and
  get a PDF in their preferred palette.
- **Tier 1 (Profile)** needs CLI comfort but gives you real personalisation
  (your name, your dates, your medications) on top of the canonical palette.
- **Tier 3 (Editor)** would need both — your data AND your palette — and is
  the biggest infrastructure lift.

Shipping Tier 2 first unlocks the most impact per engineering hour.

---

## Operational notes

- **Build pipeline:** `scripts/render-all-pack-themes.ts` generates 378 PDFs
  into `dist/packs-themed/<id>/<theme>.pdf` (~70 MB, gitignored). The
  gallery's `copy-pack-themed-pdfs.ts` mirrors them into
  `apps/gallery/public/packs/<id>/<theme>.pdf` for same-origin serving.
- **CI:** Run `npx tsx scripts/render-all-pack-themes.ts` before
  `npm run build -w @pretext-templates/gallery`. Takes ~6–8 min on an M2 Mac.
- **Release artifacts:** The v1.1.0 GitHub Release zip ships 378 themed PDFs
  alongside the canonical 27. See [`CHANGELOG.md`](../CHANGELOG.md).
- **Dark themes are colour dark, not mode dark.** A "dark" theme simply has
  a darker background swatch. The pack's typography still prints clearly and
  is never auto-inverted. GoodNotes users who write on top with Apple Pencil
  will see their strokes cleanly on either.

---

## References

- Smoke test & mechanism proof: [`scripts/smoke-theme-injection.ts`](../scripts/smoke-theme-injection.ts)
- Full-matrix renderer: [`scripts/render-all-pack-themes.ts`](../scripts/render-all-pack-themes.ts)
- Theme source files: [`packages/core/assets/themes/*.css`](../packages/core/assets/themes/)
- Gallery palette metadata: [`apps/gallery/src/data/theme-palette.json`](../apps/gallery/src/data/theme-palette.json)
- Engineering invariant (self-contained templates): [`README.md#engineering-invariants`](../README.md)
