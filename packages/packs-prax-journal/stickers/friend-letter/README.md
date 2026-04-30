# Friend Letter

**Kind:** data-capturing
**Captures:** a salutation (`Dear __`), 6 prose lines, a signoff (`— love, __`).
**Aggregation rule (month-end):** AI extracts the top-3 recurring self-criticisms across the month's letters and the first-name Prax uses when writing to himself (signals tone).
**Size class:** expanded (800×600)
**Primary accent:** sage (gentle growth)

## Why this shape

Neff's core self-compassion exercise: write to yourself as you'd write to a friend. The 2-line prose hero ("write to yourself / as you'd write to a friend") keeps it softer than a headline. Six dotted lines give room to actually finish the letter.

## Grammar

- 8px sage rail, clipped to squircle
- Kicker `§ FRIEND LETTER` · subtitle `about the thing you're ashamed of`
- `Dear __,` primary solid line
- 6 dotted prose lines at 44px gap each
- `— love, __` signoff on one short line
- Whisper: `be the friend you wish had shown up · Neff`

## Build

```bash
npx tsx scripts/build-friend-letter.ts
```
