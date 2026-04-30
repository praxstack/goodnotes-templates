# 🌿 Gratitude Journal

Single-page gratitude-capture sheet. Warm, minimal, no over-prompting — three slots, date line, free space for why.

Distinct from [Prax Journal](../prax-journal/). This is a standalone sheet for anyone who wants a daily gratitude template without the full ADHD scaffolding.

| | |
|---|---|
| **Template** | [`gratitude-journal.html`](gratitude-journal.html) |
| **Format** | A4 portrait · self-contained styles |
| **Render target** | PDF · bookmarked optional · single-page |
| **Tap targets** | ≥ 44×44 pt (Apple HIG) |

## Render

```bash
npx tsx src/cli/index.ts render \
  packages/packs-gratitude-journal/gratitude-journal.html \
  -o output/gratitude-journal.pdf
```

## Compatibility

Tested on GoodNotes 6, Notability, Noteshelf, CollaNote. Renders identically in print preview (Chrome, Safari).

## Future

<!-- Empty on purpose — see AGENTS.md -->
