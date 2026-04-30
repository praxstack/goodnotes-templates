# Mood Dot

**Kind:** data-capturing
**Captures:** a 1-10 mood reading at a specific moment, plus two prose fields ("one word" · "why").
**Aggregation rule (month-end):** AI sums mood readings into a daily mean + weekly trend + monthly mean. The "one word" field is aggregated as a simple frequency count. The "why" field is summarized narratively.
**Size class:** compact (400 × 600)
**Primary accent:** lavender

## What it's for

A peel-and-place mood-capture card. Stick onto any daily/brain-dump page in GoodNotes when you want to log how you're feeling in the moment. The scale is deliberately numeric (1-10 per user decision) rather than emoji or labeled words — less judgment, more data density for month-end aggregation.

## Grammar (matches design review §3 rubric)

| Element | Spec |
|---------|------|
| Canvas | 400 × 600 (compact size class) |
| Corner rx | 24 (squircle) |
| Top rail | 8px lavender, 0.72 opacity, clip-path to card shape |
| Paper | cream `#FBF7EE → #F4EFE0` gradient + fractalNoise grain overlay (0.12 alpha) |
| Kicker | JetBrains Mono 600, 11px, 0.18em, "§ MOOD DOT" |
| Hero | Fraunces 44px, opsz 72, SOFT 60, "how I'm feeling" |
| Subtitle | Fraunces italic 14px, lavender-ink @0.8 opacity |
| Scale | 10 dots, 13px radius, evenly spaced, numbers 1-10 underneath (monospace 10pt @0.7) |
| Anchors | "low · · · high" in Fraunces italic above the scale, with a dashed hairline |
| Separator | dotted hairline at y=320 isolating data (top) from prose (bottom) |
| Primary line | "§ ONE WORD" kicker + solid 1.4px line |
| Secondary lines | "§ WHY" kicker + two dotted 0.9px lines |
| Whisper | "an observation · not a verdict" in Fraunces italic, muted |
| Footer | "PRAX JOURNAL · STICKER" in mono, muted |
| a11y | `<title>` + `<desc>` + `role="img"` |

## Data extraction (for the AI month-end aggregator)

When reading a filled PDF that contains Mood Dot stickers, the AI should:

1. Detect filled-in dots by pixel-density analysis at each of the 10 positions (`x ∈ [scaleX0 .. scaleX1]` at `y = 245 ± 13`).
2. Read the "one word" text via OCR on the 36mm line at y=388.
3. Read the "why" text via OCR on the two dotted lines at y=468 and y=502.
4. Record the date from the parent page, the sticker identity (`mood-dot`), and the three captured values.

Output row for the CSV extract:
```
date,sticker,mood_1to10,one_word,why
2026-05-12,mood-dot,7,steady,"walked 20 minutes at lunch and ate something green"
```

## Build

```bash
npx tsx scripts/build-mood-dot.ts
```

Outputs:
- `mood-dot.svg` — self-contained, fonts inlined as base64 WOFF2 (330 KB; ~11 KB is geometry)
- `mood-dot.png` — @1× raster at 400×600 (~230 KB)

The SVG is imported directly into GoodNotes. The PNG exists for documentation previews + visual regression.

## Pipeline provenance

This sticker proves the base64-Fraunces pipeline for the entire C5 library:
- `scripts/probe-sharp-fraunces.ts` confirmed librsvg (inside sharp) honors `@font-face` with `data:font/woff2` URIs. The proof PNG lives at `output/probe-compare.png`.
- `src/core/sticker-renderer.ts` provides the memoized `fontsDefs()` helper, the `SIZE_CLASSES` + `PALETTE` tokens, and the `rasterize()` raster pipeline.
- The remaining 11 stickers follow this same shape.

## References

- Design contract: [`../../DESIGN.md`](../../DESIGN.md)
- Rubric: `docs/plan-design-review-v4-five-decisions.md` §3
- Sticker backlog: [`../README.md`](../README.md)
- svg-principal-engineer skill: `clarify → wireframe → build` workflow, paper-grain filter recipe from `filters-cookbook.md`.
