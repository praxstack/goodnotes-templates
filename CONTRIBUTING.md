<!--
  ╔══════════════════════════════════════════════════════════════════════╗
  ║ goodnotes-templates · CONTRIBUTING                                   ║
  ║ Hand-authored — do not regenerate. Inline SVG by design.             ║
  ║ Keep "Future" sections empty-but-present (see AGENTS.md).            ║
  ╚══════════════════════════════════════════════════════════════════════╝
-->

<div align="center">

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 180" width="760" height="180" role="img" aria-label="Contributing to goodnotes-templates">
  <defs>
    <linearGradient id="c-paper" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f3ecdc"/>
      <stop offset="1" stop-color="#e8dec8"/>
    </linearGradient>
    <linearGradient id="c-sage" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#8a9a7b"/>
      <stop offset="1" stop-color="#5e6f53"/>
    </linearGradient>
    <linearGradient id="c-clay" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#b87d5a"/>
      <stop offset="1" stop-color="#8a5b42"/>
    </linearGradient>
    <pattern id="c-grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M20 0 L0 0 0 20" fill="none" stroke="#d8cdb6" stroke-width="0.5"/>
    </pattern>
  </defs>

  <rect width="760" height="180" fill="url(#c-paper)"/>
  <rect width="760" height="180" fill="url(#c-grid)" opacity="0.5"/>

  <!-- left · four rubber-stamps representing the 4 Karpathy principles -->
  <g transform="translate(30 34)" font-family="ui-monospace, Menlo, monospace" font-size="9">
    <g>
      <rect width="120" height="26" rx="2" fill="none" stroke="#8a5b42" stroke-width="1.4"/>
      <text x="8" y="17" fill="#8a5b42">THINK · BEFORE · CODE</text>
      <animate attributeName="opacity" values="0.75;1;0.75" dur="3s" repeatCount="indefinite"/>
    </g>
    <g transform="translate(0 34)">
      <rect width="120" height="26" rx="2" fill="none" stroke="#5e6f53" stroke-width="1.4"/>
      <text x="8" y="17" fill="#5e6f53">SIMPLICITY · FIRST</text>
      <animate attributeName="opacity" values="0.75;1;0.75" dur="3s" begin="0.75s" repeatCount="indefinite"/>
    </g>
    <g transform="translate(0 68)">
      <rect width="120" height="26" rx="2" fill="none" stroke="#d4a656" stroke-width="1.4"/>
      <text x="8" y="17" fill="#8a6a1e">SURGICAL · CHANGES</text>
      <animate attributeName="opacity" values="0.75;1;0.75" dur="3s" begin="1.5s" repeatCount="indefinite"/>
    </g>
    <g transform="translate(0 102)">
      <rect width="120" height="26" rx="2" fill="none" stroke="#6f5c8a" stroke-width="1.4"/>
      <text x="8" y="17" fill="#6f5c8a">GOAL · DRIVEN</text>
      <animate attributeName="opacity" values="0.75;1;0.75" dur="3s" begin="2.25s" repeatCount="indefinite"/>
    </g>
  </g>

  <!-- middle · PR funnel -->
  <g transform="translate(190 28)" font-family="ui-monospace, Menlo, monospace" font-size="10" fill="#1b1815">
    <!-- fork -->
    <circle cx="20" cy="20" r="10" fill="#fff" stroke="#8a5b42" stroke-width="1.2"/>
    <text x="38" y="24">fork · branch</text>
    <!-- commit -->
    <circle cx="20" cy="60" r="10" fill="#fff" stroke="#5e6f53" stroke-width="1.2"/>
    <text x="38" y="64">write · test · lint</text>
    <!-- review -->
    <circle cx="20" cy="100" r="10" fill="#fff" stroke="#d4a656" stroke-width="1.2"/>
    <text x="38" y="104">PR · review</text>
    <!-- merge -->
    <circle cx="20" cy="140" r="10" fill="#fff" stroke="#6f5c8a" stroke-width="1.2"/>
    <text x="38" y="144">squash · merge</text>

    <line x1="20" y1="30" x2="20" y2="50" stroke="#c9be9d" stroke-dasharray="2 2">
      <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.6s" repeatCount="indefinite"/>
    </line>
    <line x1="20" y1="70" x2="20" y2="90" stroke="#c9be9d" stroke-dasharray="2 2">
      <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.6s" begin="0.2s" repeatCount="indefinite"/>
    </line>
    <line x1="20" y1="110" x2="20" y2="130" stroke="#c9be9d" stroke-dasharray="2 2">
      <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.6s" begin="0.4s" repeatCount="indefinite"/>
    </line>
  </g>

  <!-- right · wordmark -->
  <g transform="translate(410 50)" font-family="Georgia, 'Times New Roman', serif" fill="#1b1815">
    <text font-size="30" font-weight="400" letter-spacing="-0.5">contributing</text>
    <text y="36" font-size="30" font-weight="400" letter-spacing="-0.5" font-style="italic">to the repo</text>
    <text y="64" font-family="ui-monospace,Menlo,monospace" font-size="10" fill="#6b5d3f" letter-spacing="0.1em">FOUR · PRINCIPLES · FOUR · LAYERS · ONE · REPO</text>
    <g transform="translate(0 82)">
      <rect width="14" height="14" rx="2" fill="url(#c-sage)"/>
      <rect x="20" width="14" height="14" rx="2" fill="url(#c-clay)"/>
      <rect x="40" width="14" height="14" rx="2" fill="#d4a656"/>
      <rect x="60" width="14" height="14" rx="2" fill="#b7a3c7"/>
      <text x="82" y="11" font-family="ui-monospace,Menlo,monospace" font-size="10" fill="#6b5d3f">sage · clay · amber · lavender</text>
    </g>
  </g>
</svg>

</div>

# Contributing

Thank you for your interest. This repo welcomes **templates, themes, sticker
designs, bug fixes, documentation improvements, and better tests**.

Before you touch any code, **please read [`AGENTS.md`](./AGENTS.md)** — it
contains the four Karpathy-derived principles that govern every edit here.

---

## The four principles, in one line each

| # | Principle | One-line test before you type |
|---|---|---|
| 1 | **Think Before Coding** | Did you write down your assumptions? If any are uncertain, did you **ask** instead of guess? |
| 2 | **Simplicity First** | Could a senior engineer look at this and call it overcomplicated? If yes, simplify. |
| 3 | **Surgical Changes** | Does every changed line trace directly to the request? No drive-by refactors. |
| 4 | **Goal-Driven Execution** | Is there a verifiable success criterion (test, command, output) you can run to confirm "done"? |

Full wrong-vs-right examples live in [`AGENTS.md`](./AGENTS.md).

---

## Quick start

```bash
git clone https://github.com/praxstack/goodnotes-templates.git
cd goodnotes-templates
npm install

# sanity gates (all must pass before you commit)
npx tsc --noEmit                         # TypeScript — strict
npm test                                 # Unit tests
npm run lint                             # ESLint

# render a single template
npm run start -- render \
  packs/journals/prax-journal/versions/v5/today.html

# preview output/ in a local browser
npm run start -- preview                 # http://127.0.0.1:3000

# build a full multi-month Praxis Ledger bundle
npx tsx scripts/generate-journal.ts \
  --from 2026-06-01 --to 2026-06-30 \
  --out output/journal-jun-2026.pdf
npx tsx scripts/bundle-release.ts \
  --pdf output/journal-jun-2026.pdf \
  --month "June 2026" \
  --from 2026-06-01 --to 2026-06-30
```

---

## What you can contribute

### 1 · A new HTML template

Templates are **self-contained** — each HTML file owns its colors, fonts, and
layout (see [`docs/HLD-self-contained-templates.md`](docs/HLD-self-contained-templates.md)).
Adding one is a one-file change, not a multi-module change.

1. Pick a category: `journals`, `planners`, `trackers`, `notes`, `worksheets`,
   or `covers`.
2. Create `packs/<category>/<my-template>/<my-template>.html`:
   - Inline all styles. No external fetches — fonts ship in `shared/fonts/`.
   - Use CSS variables for colors so themes can override via `.dark.css` siblings.
   - Satisfy WCAG AA contrast (4.5:1 text · 3:1 large text) on every background.
3. Register it in `src/packs.ts` (the pack registry).
4. Add a `README.md` next to the template — copy the layout from any
   existing pack README (emoji header · one-liner · metadata table · render
   command · compatibility · empty Future block).
5. Verify visually:
   ```bash
   npm run start -- render packs/<category>/<my-template>/<my-template>.html
   ```

> **Optional:** drop a `<my-template>.dark.css` sibling for the dark variant.
> It's injected when `--color-mode dark` is active.

Multi-version packs (e.g. Prax Journal) keep each version under its own
subdir: `packs/journals/<name>/versions/v<N>/<role>.html`.

### 2 · A new color theme

Add `shared/themes/<my-theme>.css` (and `<my-theme>-dark.css` for the dark
variant). Themes are pure CSS-variable overrides; no code changes needed.
Apply with `--color-mode <my-theme>`.

### 3 · A new sticker type

All stickers are SVG-authored (XML-safe, no binary deps). Two entry points:

- **Quick one-off** → add a generator function in `src/core/svg-renderer.ts`:
  1. Add dimensions to `STICKER_SIZES`.
  2. Add the type key to the `StickerType` union.
  3. Write a `generate*()` function returning SVG markup
     (XML-escape any interpolated text with the `escXml` helper — there's a
     learned gotcha about `&` in `<desc>`).
  4. Add a `case` to the `switch` in `generateStickerSVG()`.
- **Full archetype family** → look at `scripts/build-stickers.ts` +
  `build-stickers-remaining.ts` for the canonical 60-piece pack pattern
  (field-note / ledger / herbarium / clinic × three dim classes × four
  accents). Match the 8-layer skeuomorphic filter stack if you want it to
  feel consistent with the rest.

### 4 · Bug fixes

- Reproduce the bug with a **failing test** first. Write it, watch it fail.
- Fix the code. Watch the test pass.
- Run the full suite to catch regressions.
- Follow AGENTS.md principle 3 — only change lines that fix the bug. No
  drive-by "while I was in there" edits.

### 5 · Documentation

- Every README in this repo has the same shape (see the root `README.md` +
  the per-pack READMEs under `packs/**`).
- Keep `Future` sections **empty but present**. Empty blocks communicate
  "we thought about this, nothing is planned yet" — which is more honest
  than deleting the heading.
- Inline SVG is preferred over bitmap images so GitHub renders clean on
  both light and dark themes.

---

## Engineering invariants (do not break these)

These are locked decisions inherited from the v5.3 audit — never change
without a separate proposal:

1. **Self-contained HTML** — one file per template, owns its CSS.
2. **Theme via override, not injection** — templates define CSS variables; themes override.
3. **GoodNotes-compatible output** — PDF 1.7, sRGB, embedded fonts, internal hyperlinks only.
4. **Small files** — single-page PDFs < 500 KB · stickers < 200 KB each.
5. **Offline-capable** — no runtime network calls from the renderer.
6. **XML-safe SVG** — always escape `&`, `<`, `>`, `"` inside `<desc>`, `<title>`, and data attributes.
7. **UTC-only date math** — all date derivation happens in UTC; see `deriveDateFields()`.

---

## Testing

```bash
npm test                     # all unit tests — must pass
npm run test:watch           # watch mode while iterating
npm run test:visual          # visual-regression (requires baselines)
```

Every **new feature** needs at least one test. Every **bug fix** needs a
regression test that would have caught the bug.

The default sanity gate before any commit:

```bash
npx tsc --noEmit && npm test && npm run lint
```

---

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type      | Example |
|-----------|---------|
| `feat`    | `feat(stickers): add herbarium-lavender archetype` |
| `fix`     | `fix(splice): correct bookmark offset for leap years` |
| `docs`    | `docs(readme): document the source-html asset folder` |
| `test`    | `test(dates): cover DST-boundary derivation` |
| `refactor`| `refactor(renderer): extract profile substitution` |
| `chore`   | `chore(deps): bump puppeteer to 23.x` |

Subject ≤ 72 chars, imperative mood, no trailing period.

---

## Pull-request process

1. **Fork and branch:** `git checkout -b feat/<slug>` or `fix/<slug>`.
2. **Stay surgical.** Every diff line should trace to the stated goal.
3. **Add tests.** Failing → passing for bugs. New for features.
4. **Run gates.** `npx tsc --noEmit && npm test && npm run lint`.
5. **Generate a sample asset** to prove it works end-to-end:
   ```bash
   npm run start -- render <your-template>.html
   ```
6. **Open the PR.** Describe what you added, why, and attach a
   rendered-output screenshot if visual. Link any related issues.
7. **Respond to review.** If feedback seems wrong, push back with evidence
   — but don't paper over reviewer concerns.

---

## Code style

- **TypeScript strict mode** — `strict: true`, no `any` without a written reason.
- **JSDoc** on every exported function — one sentence minimum.
- **Descriptive variable names** — `x`, `y` only for geometric coordinates.
- **Error messages tell the user what to fix** — not just what went wrong.
- **Match existing formatting** — don't reformat quotes, whitespace, or
  imports in files you happen to touch. That's principle 3.

---

## License

By contributing, you agree that your contributions will be licensed under:

- **MIT** — for code (see [`LICENSE`](LICENSE))
- **CC BY 4.0** — for generated assets (PDFs, PNGs, SVGs)

---

## Future

<!-- intentionally left empty; see AGENTS.md -->
