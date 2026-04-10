# High-Level Design (HLD): Self-Contained Template Architecture

**Date:** 2026-04-10  
**Author:** Eng Review  
**Status:** Approved  
**Spec:** `docs/superpowers/specs/2026-04-10-self-contained-templates-design.md`

---

## 1. Executive Summary

Remove the external theme injection system. Templates and stickers become fully self-contained —
each owns its complete visual design (colors, fonts, spacing, shadows). The PDF renderer becomes a
transparent pass-through that converts HTML to PDF without modifying CSS.

**Before:** `Template + Theme → Modified HTML → PDF` (theme destroys template CSS)  
**After:** `Template → PDF` (WYSIWYG — what you see in browser = what you get in PDF)

## 2. System Architecture

### 2.1 Current Architecture (BEFORE)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI / Scripts                             │
│  (generate-4week.ts, generate-v3-year.ts, etc.)                 │
│  Selects theme by name → getTheme('warm-neutral')               │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│   renderer.ts        │    │   puppeteer-renderer.ts          │
│   (orchestrator)     │    │                                  │
│   Resolves themes    │    │   1. Read HTML template          │
│   Loops over them    │    │   2. generateThemeCSS(theme)     │
│   Calls sub-renderers│    │   3. Inject <style> overrides    │
│                      │    │   4. Inject Google Fonts <link>  │
│   ┌───────────────┐  │    │   5. Puppeteer → PDF             │
│   │ pdfkit-render │  │    │                                  │
│   │ (simple pages)│  │    │   Theme DESTROYS template CSS:   │
│   │ lined, grid,  │  │    │   --bg, --ink, --font-display    │
│   │ dot-grid, etc.│  │    │   all overwritten                │
│   └───────────────┘  │    └──────────────────────────────────┘
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│   svg-renderer.ts    │    │   themes.ts (329 lines)          │
│   Uses theme.colors  │    │   8 theme definitions            │
│   for sticker fills  │    │   getTheme(), loadCustomTheme()  │
│   and gradients      │    │   Font configs, color palettes   │
└──────────────────────┘    └──────────────────────────────────┘
```

**Problems:**
- Theme injects ~40 CSS variable overrides → destroys template palettes
- Theme injects font `<link>` → overrides template fonts
- Orchestrator exists primarily to loop over themes (unnecessary middleman)
- pdfkit-renderer only accessible through orchestrator (dead weight)
- SVG stickers depend on external theme for colors

### 2.2 New Architecture (AFTER)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI / Scripts                             │
│  (generate-4week.ts, generate-v3-year.ts, etc.)                 │
│  Optional: colorMode='dark'                                     │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│  puppeteer-renderer  │    │   svg-renderer.ts                │
│  (TRANSPARENT)       │    │   (SELF-CONTAINED)               │
│                      │    │                                  │
│  1. Read HTML as-is  │    │   Each sticker type has its      │
│  2. If colorMode:    │    │   own baked-in color palette.    │
│     find .dark.css   │    │   No external dependencies.      │
│     inject 20-line   │    │                                  │
│     :root override   │    │   generateStickerSVG(type) →     │
│  3. Puppeteer → PDF  │    │   SVG string with colors         │
│                      │    │                                  │
│  NO theme injection  │    └──────────────────────────────────┘
│  NO font override    │
│  NO generateThemeCSS │    ┌──────────────────────────────────┐
└──────────────────────┘    │   png-renderer.ts                │
                            │   SVG → Sharp → PNG              │
                            │   No theme needed                │
                            └──────────────────────────────────┘
```

**Key properties:**
- **WYSIWYG fidelity:** HTML in browser = PDF output (zero CSS modification)
- **Self-contained templates:** Each `.html` file is the single source of truth
- **Optional color modes:** `.dark.css` snippet (20 lines) placed next to HTML
- **Self-contained stickers:** Each SVG type bakes in its own palette
- **No orchestrator:** Each generator script is its own entry point

## 3. Component Boundaries

### 3.1 Template (HTML file)
```
Owns: Structure, colors, fonts, spacing, shadows, print rules, font links
Provides: data-inject slots for dynamic content (date, page-num, etc.)
Depends on: Nothing (Google Fonts loaded via its own <link>)
```

### 3.2 Color Mode Snippet (.dark.css)
```
Owns: Color overrides only (~20 lines of :root variables)
Provides: Dark/alternate palette for a template
Depends on: Parent template's CSS variable names
Constraint: MUST NOT override fonts, spacing, layout, or structure
```

### 3.3 Puppeteer Renderer
```
Owns: HTML → PDF conversion, browser management, page sizing
Provides: renderHTMLToPDF(options) → Buffer
Depends on: Puppeteer, optional .dark.css file
Constraint: MUST NOT modify template CSS (zero injection)
```

### 3.4 SVG Sticker Renderer
```
Owns: SVG generation with baked-in palettes per sticker type
Provides: generateStickerSVG(type, size) → string
Depends on: Nothing external
```

### 3.5 PNG Renderer
```
Owns: SVG → PNG conversion via Sharp
Provides: renderStickerPNG(type, size) → Buffer
Depends on: SVG renderer, Sharp
```

### 3.6 PDF Post-Processor
```
Owns: Bookmarks, metadata, hyperlinks (UNCHANGED)
Provides: postProcessPDF(buffer, options) → Buffer
Depends on: pdf-lib
```

## 4. Data Flow

### 4.1 Single Page Render
```
adhd-v3-today.html ──read──→ HTML string
                                │
                                ├── colorMode='dark'?
                                │   YES → read adhd-v3-today.dark.css
                                │         inject <style> before </head>
                                │   NO  → pass through unchanged
                                │
                                ▼
                          Puppeteer loads HTML
                          Waits for fonts (networkidle0)
                          Renders to PDF buffer
                                │
                                ▼
                          postProcessPDF (bookmarks, metadata)
                                │
                                ▼
                          Write to output/
```

### 4.2 Multi-Page Planner (e.g., 4-week, full year)
```
Template HTMLs (today, reflect, weekly, monthly)
     │
     ├── extractStyles() from each ──→ merged <style> block
     ├── extractBody() from each   ──→ .page divs with data-inject replacements
     ├── extractFontLink() from first ──→ Google Fonts <link>
     │
     ▼
Combined HTML document:
  <head>
    <link> fonts
    <style id="template-css"> merged styles </style>
    <style id="color-mode"> optional dark.css </style>
    <style id="print"> @page A4, page-break rules </style>
  </head>
  <body>
    [60+ .page divs]
  </body>
     │
     ▼
Puppeteer (multiPage: true, preferCSSPageSize: true)
     │
     ▼
postProcessPDF (bookmarks per day/week/month)
     │
     ▼
output/templates/adhd-v3-4week.pdf
```

### 4.3 Sticker Render
```
generateStickerSVG('thought-bubble', { width: 200, height: 200 })
     │
     ▼
SVG string with baked-in colors (no theme dependency)
     │
     ├── Save as .svg
     │
     └── Sharp.png({ density: 300 }) → .png at 2x resolution
```

## 5. Files Impact Summary

| Action | Count | Details |
|--------|-------|---------|
| DELETE | 15 | themes.ts, renderer.ts, pdfkit-renderer.ts, 8 test scripts, themes.test.ts, custom-theme.json, 2 superseded docs |
| MODIFY | 13 | puppeteer-renderer, svg-renderer, png-renderer, types, 5 generators/planners, render-v3, render-missing, cli, registry |
| CREATE | 13 | 11 dark.css files + HLD.md + LLD.md |

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Sticker colors change | Medium | Low | Bake in same colors currently used by warm-neutral theme |
| Simple page types lost (lined, grid, etc.) | Low | Low | pdfkit-renderer only used via orchestrator; document as future HTML template opportunity |
| CSS variable name mismatch between template and dark.css | Low | High | Convention: dark.css uses same variable names as its parent template |
| Regression in multi-page PDF CSS merge | Medium | High | Verify 4-week planner visually after change |

## 7. Non-Goals / NOT in Scope

- Creating new templates
- Changing any template's visual design
- Runtime theme switching or user-customizable themes
- Re-implementing simple page types (lined, grid, dot-grid) as HTML templates
- Sticker dark mode variants (stickers keep one palette per type)
