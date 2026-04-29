# Wins Jar

**Kind:** data-capturing
**Captures:** up to 10 short lines of small wins. One sticker lasts a notebook cycle.
**Aggregation rule (month-end):** AI counts wins logged, tags them (body / work / connection / self-care), and produces a monthly wins list for the retro page.
**Size class:** expanded (800×600)
**Primary accent:** amber (warmth accumulation)

## Why this shape

Ten numbered lines on the left — invites the accumulation. Hand-drawn glass jar on the right with amber warmth at half-fill — the visual "this is where the wins go". The jar has two floaty specks to suggest it's already in motion, not empty.

## Grammar

- 8px amber rail, clipped to squircle
- Kicker `§ WINS JAR` · hero `wins jar` · subtitle `even the tiniest counts · drop it in`
- 10 numbered rows (01-10), solid 1px lines, 460px writing width
- Jar ornament: 150×320 hand-drawn SVG, amber-rail stroke, half-filled with amber-rail at 0.18 opacity
- Whisper: `put a small one in the jar · especially on the hard days`

## Build

```bash
npx tsx scripts/build-wins-jar.ts
```
