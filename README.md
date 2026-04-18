# 🗒️ GoodNotes Templates

**Free, open-source, programmatically generated digital planning templates, stickers, and page assets for GoodNotes, Notability, Noteshelf, and CollaNote.**

[![License: MIT](https://img.shields.io/badge/Code-MIT-green.svg)](LICENSE)
[![License: CC BY 4.0](https://img.shields.io/badge/Assets-CC%20BY%204.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen.svg)](https://nodejs.org/)

> One command generates 700+ stickers and 100+ page templates across 8 beautiful color themes. No design skills needed. No Photoshop. No InDesign. Just `npm run generate`.

---

## ✨ What's Included

### 📝 Simple Page PDFs (7 types × 3 variants × 8 themes)

| Page Type | Variants | Description |
|-----------|----------|-------------|
| **Lined** | Narrow, College, Wide | Classic ruled paper with margin line |
| **Grid** | 5mm, 7mm, 10mm | Square graph paper |
| **Dot Grid** | 5mm, 7mm, 10mm | Bullet journal dot grid |
| **Blank** | Plain | Clean blank page with themed background |
| **Isometric** | Standard | 3D/technical sketching grid |
| **Music** | Standard | Staff paper for musical notation |
| **Calligraphy** | Standard | Slant lines with baseline guides |

### 🎨 Sticker PNGs (15 types × 8 themes = 700+ individual files)

| Sticker Type | Variants | Description |
|-------------|----------|-------------|
| **Date Tabs** | Jan-Dec | Month labels with themed backgrounds |
| **Day Tabs** | Mon-Sun | Day-of-week labels |
| **Number Circles** | 1-31 | Date markers for calendars |
| **Priority Markers** | P1, P2, P3 | Color-coded priority badges |
| **Checkboxes** | Empty, Checked, Partial, Crossed | Task completion states |
| **Progress Bars** | 0%, 25%, 50%, 75%, 100% | Visual progress indicators |
| **Sticky Notes** | 4 color variants | Note rectangles with shadow |
| **Washi Tape** | 5 patterns | Stripes, dots, grid, chevron, solid |
| **Banners** | Ribbon style | Decorative text containers |
| **Dividers** | Simple, Double, Dotted | Section separators |
| **Frames** | Simple, Double, Dashed | Content borders |
| **Weather Icons** | Sun, Cloud, Rain, Snow, Storm | Geometric weather symbols |
| **Star Ratings** | 1-5 stars | Rating indicators |
| **Arrows** | Up, Right, Down, Left | Directional indicators |

All stickers are **300 DPI, transparent PNG, pre-cropped** — ready to import directly into GoodNotes.

### 🎨 8 Built-in Themes

| Theme | Style | Colors |
|-------|-------|--------|
| 🌸 **Rose Quartz** | Pastel pink | Soft pink, blush, dusty rose |
| 🌿 **Sage Garden** | Cottagecore | Sage green, forest, mint |
| 💜 **Lavender Dreams** | Purple pastel | Lavender, medium purple |
| 🌊 **Ocean Breeze** | Blue calm | Sky blue, ocean, navy |
| 🏜️ **Warm Neutral** | Minimalist | Tan, beige, caramel |
| 🌙 **Midnight** | Dark mode | Steel blue on charcoal |
| 🌅 **Sunset Coral** | Warm aesthetic | Coral, peach, terracotta |
| 💼 **Corporate Blue** | Professional | Clean blue and white |

---

## 🚀 Quick Start

### Option A: Download Pre-built Assets (No coding required)

1. Go to [Releases](../../releases)
2. Download `goodnotes-templates-assets.zip`
3. Unzip and AirDrop PDFs/PNGs to your iPad
4. Open in GoodNotes, Notability, Noteshelf, or CollaNote

### Option B: Generate Custom Assets

```bash
# Clone and install
git clone https://github.com/praxstack/goodnotes-templates.git
cd goodnotes-templates
npm install

# Generate everything (all themes, all types)
npm run generate

# Generate for a specific theme
npx tsx src/cli/index.ts generate --theme rose-quartz

# Generate only stickers
npx tsx src/cli/index.ts generate --stickers

# Generate only pages
npx tsx src/cli/index.ts generate --pages

# Custom paper size
npx tsx src/cli/index.ts generate --paper-size letter --orientation landscape

# Different locale (Spanish month/day names)
npx tsx src/cli/index.ts generate --locale es

# Use a custom theme
npx tsx src/cli/index.ts generate --theme-file examples/custom-theme.json

# Preview generated assets in browser
npx tsx src/cli/index.ts preview

# List all available options
npx tsx src/cli/index.ts list

# Dry run (see what would be generated)
npx tsx src/cli/index.ts generate --dry-run
```

---

## 📐 Technical Specifications

### GoodNotes Compatibility

| Spec | Value |
|------|-------|
| PDF Version | 1.7 |
| Color Space | sRGB |
| Font Embedding | Full subset embedding |
| Hyperlinks | /GoTo page destinations |
| Tap Targets | 44×44pt minimum (Apple HIG) |
| Bookmarks | PDF outline tree |

### Paper Sizes

| Size | Dimensions (pts) | Best For |
|------|-----------------|----------|
| A4 | 595 × 842 | Most compatible (default) |
| US Letter | 612 × 792 | North America |
| iPad Landscape | 1024 × 768 | iPad standard/Air 13" (4:3) |
| iPad Pro Landscape | 1366 × 1024 | iPad Pro 12.9"/Air 13" |
| iPad Wide | 1194 × 834 | iPad Pro 11"/Air 11" (~3:2) |

### Sticker Specs

| Spec | Value |
|------|-------|
| DPI | 300 (Retina-quality) |
| Format | PNG with alpha transparency |
| Color Space | sRGB |
| Compression | Level 6 (balance of size/quality) |

---

## 🏗️ Architecture

Templates are **self-contained** — each HTML file owns its colors, fonts, and
layout. The renderer is a transparent pass-through (see
`docs/HLD-self-contained-templates.md`). No theme injection; what you see in
the browser is what you get in the PDF.

```
src/
├── core/
│   ├── dimensions.ts        # Paper sizes, margins, DPI conversion
│   ├── puppeteer-renderer.ts # HTML → PDF via headless Chromium
│   ├── pdf-postprocess.ts   # pdf-lib: hyperlinks, bookmarks, metadata, merge
│   ├── svg-renderer.ts      # SVG generation for 19 sticker types (baked-in palettes)
│   └── png-renderer.ts      # Sharp: SVG → PNG rasterization at 300 DPI
├── cli/
│   ├── index.ts             # Commander.js CLI (render, list, preview)
│   └── preview-server.ts    # Local gallery server (binds 127.0.0.1 by default)
├── templates/
│   ├── registry.ts          # Template metadata (id, name, category, htmlPath)
│   ├── html/                # 32 self-contained HTML templates + 11 .dark.css siblings
│   ├── themes/              # 8 optional color themes (light + dark pairs)
│   └── planners/            # Programmatic generators (full-year planner)
├── types/
│   └── index.ts             # TypeScript type definitions
└── utils/
    └── locale.ts            # Date formatting for 6 languages
```

### Rendering Pipeline

| Asset Type | Renderer | Output | File Size |
|-----------|----------|--------|-----------|
| HTML templates (all 32)   | Puppeteer → pdf-lib | PDF | <500 KB |
| Full-year planners | Puppeteer (monthly batches) → pdf-lib merge | PDF | ~150 MB |
| Stickers (19 types) | SVG markup → Sharp | PNG (300 DPI) | <200 KB |

Puppeteer is used for every HTML → PDF path. pdf-lib post-processes to add
hyperlinks, bookmarks, and metadata.

---

## 🌍 Locale Support

Generate templates with localized month and day names:

| Locale | Flag | Month Example | Day Example |
|--------|------|---------------|-------------|
| `en` | 🇺🇸 | January | Mon |
| `es` | 🇪🇸 | Enero | Lun |
| `fr` | 🇫🇷 | Janvier | Lun |
| `de` | 🇩🇪 | Januar | Mo |
| `ja` | 🇯🇵 | 1月 | 月 |
| `ko` | 🇰🇷 | 1월 | 월 |

```bash
npx tsx src/cli/index.ts generate --stickers --locale ja --theme midnight
```

---

## 🎨 Custom Themes

Create your own theme with a JSON file:

```json
{
  "id": "forest-night",
  "name": "Forest Night",
  "isDark": true,
  "colors": {
    "primary": "#4A7C59",
    "secondary": "#2D4A3E",
    "accent": "#D4A854",
    "background": "#1A2E23",
    "text": "#E8F0EA",
    "muted": "#3D6B50"
  },
  "fonts": {
    "header": { "family": "Montserrat", "weight": 600 },
    "body": { "family": "Inter", "weight": 300 },
    "accent": { "family": "Lora", "weight": 400, "style": "italic" }
  }
}
```

```bash
npx tsx src/cli/index.ts generate --theme-file my-theme.json
```

See `examples/custom-theme.json` for a complete example.

---

## 🧪 Testing

```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
```

Tests cover:
- Theme system (8 built-in + custom theme validation)
- Page dimensions (6 sizes × 2 orientations)
- Locale formatting (6 languages, leap years, ISO weeks)
- Sticker SVG generation (output validation)

---

## 📦 CI/CD

GitHub Actions automatically:
1. Regenerates all assets when `src/` changes
2. Uploads assets as build artifacts
3. Creates a GitHub Release with a downloadable ZIP

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to add new themes
- How to add new page types
- How to add new sticker types
- Code style and testing requirements

---

## 📋 Project Documents

| Document | Description |
|----------|-------------|
| [RESEARCH.md](RESEARCH.md) | Deep market analysis: GoodNotes Marketplace, Etsy ecosystem, iPad specs, font/color research |
| [PROBLEM_STATEMENT.md](PROBLEM_STATEMENT.md) | Functional/non-functional requirements, target users, technical constraints |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute templates, themes, and stickers |

---

## 📄 License

- **Code:** [MIT License](LICENSE)
- **Generated Assets:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — free to use, modify, and share with attribution
- **Fonts:** All fonts are from [Google Fonts](https://fonts.google.com/) under OFL or Apache 2.0 licenses

---

## 🗺️ Roadmap

Shipped:
- [x] Core generation engine (Puppeteer + pdf-lib + SVG + Sharp)
- [x] 32 self-contained HTML templates (planners, journals, trackers, worksheets, notes)
- [x] 8 color themes + 11 dark-mode variants
- [x] 19 sticker types (700+ PNGs when batched × themes)
- [x] CLI (`render`, `list`, `preview`)
- [x] 6-language locale support (en, es, fr, de, ja, ko)
- [x] Full-year ADHD planner (daily-year-v2) with hyperlinked monthly tabs + bookmarks
- [x] CI/CD with GitHub Actions + Releases (release artifacts signed with cosign/sigstore)

Next:
- [ ] Self-host Google Fonts under `assets/fonts/` (drop the online `<link>`)
- [ ] Dark-mode parity for all 32 HTML templates (currently 11/32)
- [ ] Web-based template customizer
- [ ] Plugin system for community templates

---

Built with TypeScript, PDFKit, Sharp, and pdf-lib. Inspired by the incredible digital planning community on r/GoodNotes and r/digitalplanning.
