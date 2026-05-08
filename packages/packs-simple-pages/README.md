# Simple Pages

Six utility pages in a single A4 PDF, in one self-contained HTML file. Same
warm-analog aesthetic as the rest of the `pretext-templates` library:

| # | Page | Description |
|---|---|---|
| 1 | **Lined** | 7 mm ruled, 28 lines, with a left margin rule in clay. Stable for long-form prose. |
| 2 | **Grid** | 5 mm Swiss-grid, hairline sage. Good for sketches, tables, and calligraphy layouts. |
| 3 | **Dot grid** | 5 mm dots, muted amber. The bullet-journal standard. |
| 4 | **Blank** | Cream paper with a one-point border + corner brackets. Maximum freedom. |
| 5 | **Isometric** | 30°/60°/90° isometric grid at 5 mm — technical sketching, 3D thumbnails. |
| 6 | **Music staff** | Eight 5-line staves with treble-clef anchor points on the left. Light guide lines between staves. |

## Render locally

```bash
npx @praxlannister/pretext-cli render \
  packages/packs-simple-pages/simple-pages.html \
  -o output/simple-pages.pdf
```

All six pages land in a single 6-page A4 PDF.

## Design notes

- **Cream paper** `#f9f5ec` across every page — matches the warm-analog
  tokens used by `prax-journal` v5.
- **Grid densities** picked to match the iPad Pro @ 264 PPI: lines fall on
  pixel boundaries, so sharp pen strokes read cleanly in GoodNotes.
- **`@page { size: A4 portrait; margin: 0 }`** + `break-after: page` per
  `.page` element is the entire printing contract. No Puppeteer-specific
  tricks; renders identically in Chrome's browser print-preview.
- **Fonts** are limited to Fraunces (display) + JetBrains Mono (page
  labels) and only appear on the footer — every grid/dot/line is pure CSS
  so there's no font download cost for the paper itself.

## Compatibility

GoodNotes 6 · Notability · Noteshelf · CollaNote. Works in any PDF reader
as plain A4.

## License

MIT (code) · CC BY 4.0 (the rendered paper).
