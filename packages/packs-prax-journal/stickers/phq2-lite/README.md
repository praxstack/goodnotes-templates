# PHQ-2 Lite

**Kind:** data-capturing
**Captures:** two PHQ-2 items, each on a 0–3 ordinal scale (not-at-all / several-days / > half / nearly-every-day).
**Aggregation rule (month-end):** AI computes PHQ-2 weekly score (sum of Q1+Q2). Score ≥ 3 flags a potential depression episode for retro discussion. Trend chart across the month.
**Size class:** compact (400×600)
**Primary accent:** lavender (clinical but gentle)

## Why this shape

The standard PHQ-2 depression screen, condensed to sticker size. Circle-choice 0-3 scale keeps it ordinal and tappable. Legend at the bottom reminds of the coding. **Not a diagnosis — a self-check.**

## Build

```bash
npx tsx scripts/build-stickers-remaining.ts
```
