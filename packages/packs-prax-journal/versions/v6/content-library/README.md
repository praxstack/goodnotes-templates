# Content Library — v6 wave 14

Static, build-time pool of micro-content that rotates into the **header** and **footer** slots of 15 form-shaped pages of the v6 journal. 200 items, 4 categories, 50 items per category.

The pool is read by `build-v6-pdf.ts` at build time. A seeded PRNG (mulberry32, seed = `SOURCE_DATE_EPOCH` or default `20260529`) picks one header item and one footer item per page, drawn from **different categories** so a page never shows two ADHD tips or two quotes.

## What this pool is

- Therapeutic micro-content. Not motivational. Not gamified. No emoji.
- Written to honor the wave-7 therapist-tone briefing.
- Designed to be *read in passing*, not engaged with as a prompt. The user sees a line at the top of the page, a line at the bottom. No interaction required.

## Schema

```jsonc
{
  "version": 1,
  "generated_for": "v6 wave 14",
  "tone_rubric_version": "wave-7-therapist-briefing",
  "categories": {
    "adhd-cope":         [ { "id": "adhd-001",    "text": "...", "max_chars": 180 }, ... ],
    "anxiety-ground":    [ { "id": "anxiety-001", "text": "...", "max_chars": 180 }, ... ],
    "cbt-microlesson":   [ { "id": "cbt-001",     "text": "...", "max_chars": 180 }, ... ],
    "therapeutic-quote": [ { "id": "quote-001",   "text": "...", "attribution": "rumi", "max_chars": 180 }, ... ]
  }
}
```

For `therapeutic-quote`, `text` and `attribution` are stored separately. The build pipeline concatenates `"{text} — {attribution}"` at render time. The combined string is also ≤ 180 chars.

## Categories

| Category | Voice |
|---|---|
| `adhd-cope` | A friend who actually has ADHD telling you what works for them. Practical micro-techniques. |
| `anxiety-ground` | Clinical-soft. Body-first, not thought-first. Grounding and somatic cues. |
| `cbt-microlesson` | One-sentence cognitive-distortion notes. Burns/Beck-rooted. No jargon. |
| `therapeutic-quote` | Brief attributed quotes from therapists, philosophers, poets, contemplatives. Honest, never hopeful-by-default. |

## How to add an item

Append to the right category array. Pick the next free ID (e.g. `adhd-051`). Keep `text` ≤ 180 chars (or, for quotes, `text + " — " + attribution` ≤ 180 chars). Re-run the build.

## 8-line tone rubric (every item must pass)

1. **No motivation required** — the reader doesn't have to feel anything to use the item.
2. **No false empathy** — no "I know how hard this is."
3. **No shame** — no "you should" / "if only" / "stop doing X."
4. **No jargon** — no "cognitive distortion", "exposure therapy", "DBT", "thought record" in user-facing text.
5. **No gamification** — no streaks, points, scores, levels.
6. **No wellness-app voice** — no "you got this", "you're amazing", no hashtags, no emoji, no exclamations.
7. **No false promises** — never "and you'll feel better."
8. **No lying** — never imply control where there isn't any.

## Anti-pattern list (drop the item if it has any of these)

- "today is a new day"
- "remember to be kind to yourself"
- "you got this"
- "everything happens for a reason"
- "you are enough" (meta)
- "trust the process"
- emoji, exclamation marks, ALL CAPS
- pushing forward / "let's go" / "you can do this"
- toxic positivity

## Format conventions

- Lowercase preferred (matches v5/v6 voice register). Exception: proper nouns + author names.
- Curly quotes `'` `"` preferred over straight `'` `"`.
- Em-dashes `—` preferred over hyphens. En-dashes `–` also fine.
- One sentence or two. Short. Read in two seconds.

## How to refresh the kit

The build pipeline is deterministic — same seed = same PDF, byte-for-byte. To roll a fresh selection across all 30 placements:

```bash
SOURCE_DATE_EPOCH=$(date +%s) npx tsx build-v6-pdf.ts
```

To pin a specific roll for reproducibility, set `SOURCE_DATE_EPOCH` to a fixed value and check it into the build invocation.

## Distribution rules (from CONTRACT.md)

15 pages get rotating content × 2 slots = **30 placements per build**. Pages 02, 09, 10, 11, 13, 15, 21, 22, 23 do NOT get rotating content (archetype-locked from wave 13). See wave 14 CONTRACT.md for the full list.
