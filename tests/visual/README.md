# Visual-regression baselines

Pixel-level snapshot tests for the Prax Journal pages. Run separately from
the main unit suite because they need Chromium + a few seconds per page.

## Run the suite

```bash
npm run test:visual
```

- **First run:** creates a PNG baseline per template under `baselines/`.
- **Subsequent runs:** re-renders each page, compares to its baseline with
  a small per-pixel tolerance, and fails if more than **0.5%** of pixels
  drift beyond the channel threshold. Red overlays are written to
  `diffs/<name>.diff.png` for any page that tripped the budget.

## Regenerate baselines (intentionally)

```bash
UPDATE_BASELINES=1 npm run test:visual
```

Do this when a design change is deliberate. Review the new PNGs in
`baselines/` before committing so you know exactly what you froze.

## What's covered

- `adhd-v5-today`, `adhd-v5-midday`, `adhd-v5-reflect`, `adhd-v5-brain-dump`
  — the live 4-page journal spread.
- `adhd-v4-today`, `adhd-v4-reflect`, `adhd-v4-brain-dump` — previous gen,
  still served at `/v4-all`.
- `prax-journal-design-system` — the design-token reference page.

## Determinism notes

- All network requests are blocked at the Puppeteer level, so baselines
  only depend on the HTML + system fonts. If a template starts pulling
  a remote asset, the baseline will drift to the fallback-font rendering
  — which is what we want CI to tell us.
- Animations and caret blinking are force-disabled via injected CSS.
- `deviceScaleFactor: 1` + `--force-device-scale-factor=1` keeps the
  output at a single 794×1123 px A4 canvas.

## Why `sharp` for diffing?

Because it's already a dependency (`puppeteer-renderer` uses it to produce
PNGs from SVGs). Adding `pixelmatch` or `looks-same` would have been a new
supply-chain line item for a ~40-line diff kernel we can write ourselves.
