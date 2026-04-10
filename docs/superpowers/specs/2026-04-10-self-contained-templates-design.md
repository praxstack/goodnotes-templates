# SPEC: Self-Contained Template Architecture

**Date:** 2026-04-10  
**Status:** Approved  
**Scope:** Remove external theme injection; templates own all visual styling  

---

## 1. Problem Statement

The current PDF generation pipeline has an architectural flaw: a `Theme` system forcefully
overrides template CSS variables, destroying self-contained designs.

**How it breaks:**

1. Template defines `--bg: #FAF5FF` (lavender), `--ink: #4C1D95` (purple), `--font-display: 'Lora'`
2. `puppeteer-renderer.ts` injects `<style id="theme-override">` with ~40 CSS variable overrides
3. Theme sets `--bg: #FAF7F4` (warm beige), `--ink: #3D3229` (brown), `--font-display: 'Montserrat'`
4. Template's entire palette, typography, and visual identity are destroyed
5. The PDF looks nothing like the HTML preview

The theme system was designed for "dumb shell" templates that rely on external theming. All current
templates (v2, v3, gentle, standalone) already define their own complete CSS. The theme system is
fighting against every template.

## 2. Goals and Non-Goals

### Goals

- Templates are WYSIWYG: HTML opened in a browser looks identical to the generated PDF
- Each template file is the single source of truth for its visual design
- Color variants (light/dark) are owned and defined by the template author
- The renderer is a transparent pass-through: `HTML → PDF` with zero CSS modifications
- Existing v2, v3, gentle, and standalone templates continue to work
- Dark mode variants are supported via template-owned CSS snippet files

### Non-Goals

- Creating new templates (out of scope for this change)
- Changing any template's visual design (only the plumbing changes)
- Supporting runtime theme switching or user-customizable themes
- PDF post-processing changes (bookmarks, metadata — unaffected)

## 3. System Overview

### Current Architecture (BEFORE)

```
Template HTML → Generator → puppeteer-renderer.ts → PDF
                              ↑
                         Theme System
                         (injects ~40 CSS var overrides)
                         (injects Google Font link)
                         (SEMANTIC_DEFAULTS object)
```

**Files involved:**
- `src/core/themes.ts` (329 lines) — 8 theme definitions, helpers, custom theme loader
- `src/core/puppeteer-renderer.ts` (271 lines) — `generateThemeCSS()`, `SEMANTIC_DEFAULTS`, font injection
- `src/types/index.ts` — `Theme`, `ColorPalette`, `ThemeFonts`, `FontConfig` types
- Generators (`scripts/generate-*.ts`) — import `getTheme()`, pass theme to renderer

### New Architecture (AFTER)

```
Template HTML → Generator → puppeteer-renderer.ts → PDF
                              ↑
                         Optional: color-mode .css snippet
                         (template-owned, ~20 lines)
```

**Key change:** The renderer does NOT inject any CSS. It optionally prepends a color-mode CSS
snippet that the template author wrote and placed alongside their HTML file.

## 4. Core Domain Model

### Template

A template is a self-contained HTML file with:

| Property | Location | Description |
|----------|----------|-------------|
| Structure | `<body>` | HTML markup with `.page` containers |
| Design tokens | `<style> :root { }` | CSS variables for colors, fonts, spacing, shadows |
| Layout CSS | `<style>` | All class definitions, grid/flex, responsive rules |
| Print CSS | `<style> @media print` | Print-specific overrides (`box-shadow: none`, etc.) |
| Page rules | `<style> @page` | `size: A4 portrait; margin: 0;` |
| Fonts | `<link>` | Google Fonts preconnect + font link |
| Data slots | `data-inject="..."` attributes | Replaceable content: date, page-num, week-date, month-name |

**File path convention:** `src/templates/html/{name}.html`

### Color Mode Snippet

A color-mode snippet is a minimal CSS file containing ONLY `:root` variable overrides.

| Property | Type | Description |
|----------|------|-------------|
| File path | `src/templates/html/{template-name}.{mode}.css` | Lives next to the HTML file |
| Content | CSS `:root { }` block | ~15-25 lines of variable overrides |
| Scope | Colors + opacity only | Never overrides fonts, spacing, layout, or structure |

**File path convention:** `src/templates/html/{name}.{mode}.css`

**Example:** `adhd-v3-today.dark.css`
```css
/* Dark mode for adhd-v3-today — overrides default light palette */
:root {
  --bg: #1A1028;
  --surface: #2D2440;
  --ink: #EDE5F5;
  --ink-2: #C4B5FD;
  --ink-3: #7C3AED;
  --muted: #6D28D9;
  --muted-bg: #2D2440;
  --border: #3D2E5C;
  --rule: #4C3672;
  --dots: #6D28D9;
  --primary: #A78BFA;
  --primary-light: #C4B5FD;
  --accent: #34D399;
  --accent-soft: rgba(52, 211, 153, 0.12);
  --amber: #FBBF24;
  --amber-soft: rgba(251, 191, 36, 0.12);
}
```

**Important boundary:** A color-mode snippet MUST NOT contain:
- Font family overrides (`--font-display`, `--font-body`)
- Spacing overrides (`--s1` through `--s6`, `--margin`)
- Layout properties (`display`, `grid-template`, `flex-direction`)
- Class definitions or selectors other than `:root`
- `@media`, `@page`, or `@font-face` rules

### Renderer Options

```typescript
interface PuppeteerRenderOptions {
  /** Path to source HTML template (used for color-mode CSS discovery) */
  htmlPath?: string;
  /** Inline HTML content (if provided, used instead of reading htmlPath) */
  htmlContent?: string;
  /** Page dimensions for single-page mode */
  dimensions: PageDimensions;
  /** 
   * Color mode name. If provided, renderer looks for 
   * {htmlPath without .html}.{colorMode}.css and injects it.
   * Omit for the template's default (light) mode.
   */
  colorMode?: string;
  /**
   * Multi-page mode: let CSS @page rules control page breaks.
   * Required for documents with multiple .page divs.
   */
  multiPage?: boolean;
}
```

## 5. Renderer Contract

### `renderHTMLToPDF(options: PuppeteerRenderOptions): Promise<Buffer>`

**Input resolution:**

```
function resolveHTML(options):
  if options.htmlContent exists:
    html = options.htmlContent
  else:
    html = readFile(options.htmlPath)
  
  if options.colorMode AND options.htmlPath:
    cssPath = options.htmlPath.replace('.html', `.${options.colorMode}.css`)
    if fileExists(cssPath):
      modeCSS = readFile(cssPath)
      inject `<style id="color-mode">${modeCSS}</style>` before </head>
    else:
      log warning: `Color mode "${options.colorMode}" not found at ${cssPath}`
      // Continue with default — do NOT throw
  
  return html  // No other modifications
```

**Important nuance:** When `htmlContent` is provided AND `colorMode` is set, the `htmlPath` is
still used to discover the `.{mode}.css` file. The `htmlPath` serves dual purpose: source file path
(when no htmlContent) and CSS discovery base path (always).

**Puppeteer rendering (unchanged):**

```
function renderToBuffer(html, options):
  browser = getBrowser()
  page = browser.newPage()
  timeout = options.multiPage ? 120000 : 30000
  page.setContent(html, waitUntil: 'networkidle0', timeout)
  page.evaluate(() => document.fonts.ready)
  
  if options.multiPage:
    return page.pdf(preferCSSPageSize: true, printBackground: true, margin: 0)
  else:
    widthIn = options.dimensions.width / 72
    heightIn = options.dimensions.height / 72
    return page.pdf(width: widthIn + 'in', height: heightIn + 'in', 
                     printBackground: true, preferCSSPageSize: true, margin: 0)
```

### What the renderer does NOT do (DELETED behaviors):

| Deleted Behavior | Was in | Line(s) |
|------------------|--------|---------|
| `generateThemeCSS(theme)` function | puppeteer-renderer.ts | 82-125 |
| `SEMANTIC_DEFAULTS` object | puppeteer-renderer.ts | 67-80 |
| Theme CSS `<style>` injection | puppeteer-renderer.ts | 159-164 |
| Google Fonts `<link>` injection for theme fonts | puppeteer-renderer.ts | 167-177 |
| `Theme` parameter in options | puppeteer-renderer.ts | 129 |
| `theme` import and usage | all generators | various |

## 6. Generator Contract

Generators build multi-page HTML documents by:

1. Reading individual template HTML files
2. Extracting `<style>` blocks and `<body>` content
3. Assembling into one HTML document with merged styles
4. Calling `renderHTMLToPDF()` with optional `colorMode`

### CSS Merge Strategy for Multi-Template Documents

When multiple templates are combined (e.g., today + reflect + weekly + monthly):

```
function buildCombinedHTML(templatePaths, colorMode):
  allStyles = []
  allBodies = []
  fontLink = null
  
  for each path in templatePaths:
    html = readFile(path)
    allStyles.push(extractStyles(html))  // regex: /<style[^>]*>([\s\S]*?)<\/style>/g
    allBodies.push(extractBody(html))     // content between <body> and </body>
    if not fontLink:
      fontLink = extractFontLink(html)    // first template's <link> for Google Fonts
  
  // If colorMode specified, load the snippet from the FIRST template's path
  modeCSS = ''
  if colorMode:
    cssPath = templatePaths[0].replace('.html', `.${colorMode}.css`)
    if fileExists(cssPath):
      modeCSS = readFile(cssPath)

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      ${fontLink}
      <style id="template-css">${allStyles.join('\n')}</style>
      ${modeCSS ? `<style id="color-mode">${modeCSS}</style>` : ''}
      <style id="print">
        @page { size: A4 portrait; margin: 0; }
        body { background: white; margin: 0; padding: 0; }
        .page { margin: 0; box-shadow: none; page-break-after: always; }
        .page:last-child { page-break-after: auto; }
      </style>
    </head>
    <body>${allBodies.join('\n')}</body>
    </html>`
```

**Important boundary:** All templates in a combined document MUST share the same design system
(same `:root` variable names and compatible values). You cannot combine v2 and v3 templates in one
document — they have different palettes and variable names.

**Important nuance:** The color-mode CSS is loaded from the FIRST template's directory. All
templates in a set (e.g., all v3 templates) should use the same color variable names, so one
dark.css snippet works for the entire set.

## 7. Files Changed

### DELETE (5 files)

| File | Reason |
|------|--------|
| `src/core/themes.ts` (329 lines) | Entire theme system — no longer needed |
| `tests/unit/themes.test.ts` | Tests for deleted theme system |
| `examples/custom-theme.json` | Example for deleted custom theme feature |
| `docs/superpowers/specs/2026-04-10-adhd-planner-v2-design.md` | Superseded by this spec |
| `docs/superpowers/plans/2026-04-10-adhd-planner-v2.md` | Superseded |

### MODIFY (major changes)

| File | Change |
|------|--------|
| `src/core/puppeteer-renderer.ts` | Remove `generateThemeCSS()`, `SEMANTIC_DEFAULTS`, theme injection, font injection. Add `colorMode` option with CSS file discovery. Net: ~60 lines removed, ~15 added |
| `src/types/index.ts` | Remove `Theme`, `ColorPalette`, `ThemeFonts`, `FontConfig` types. Keep `PageDimensions`, `PDFBookmark`, etc. |
| `scripts/generate-4week.ts` | Remove `getTheme()` import, `theme` param. Add `colorMode` option. |
| `scripts/generate-v3-year.ts` | Same treatment |
| `scripts/generate-v2-year.ts` | Same treatment |
| `scripts/render-v3.ts` | Remove theme references |
| `scripts/test-adhd-v2-jan.ts` | Remove theme, use colorMode |
| `scripts/test-adhd-v2-render.ts` | Remove theme, use colorMode |
| `scripts/test-puppeteer.ts` | Remove theme |
| `scripts/render-missing.ts` | Remove theme |
| `src/cli/index.ts` | Remove `--theme` flag, add `--color-mode` flag |
| `src/templates/registry.ts` | Remove theme references |
| `package.json` | No change (no theme-related deps) |
| `README.md` | Update to reflect new architecture |
| `CLAUDE.md` | Update architecture description |

### CREATE (11 dark-mode CSS files)

| File | Base Template | Content |
|------|---------------|---------|
| `src/templates/html/adhd-v3-today.dark.css` | adhd-v3-today.html | Dark lavender palette (~20 lines) |
| `src/templates/html/adhd-v3-reflect.dark.css` | adhd-v3-reflect.html | Same palette as v3-today |
| `src/templates/html/adhd-v3-weekly.dark.css` | adhd-v3-weekly.html | Same palette |
| `src/templates/html/adhd-v3-monthly.dark.css` | adhd-v3-monthly.html | Same palette |
| `src/templates/html/adhd-v2-today.dark.css` | adhd-v2-today.html | Midnight palette from themes.ts |
| `src/templates/html/adhd-v2-reflect.dark.css` | adhd-v2-reflect.html | Same midnight palette |
| `src/templates/html/adhd-v2-weekly.dark.css` | adhd-v2-weekly.html | Same midnight palette |
| `src/templates/html/adhd-v2-monthly.dark.css` | adhd-v2-monthly.html | Same midnight palette |
| `src/templates/html/adhd-gentle-daily.dark.css` | adhd-gentle-daily.html | Midnight palette |
| `src/templates/html/adhd-gentle-weekly.dark.css` | adhd-gentle-weekly.html | Same midnight palette |
| `src/templates/html/adhd-gentle-monthly.dark.css` | adhd-gentle-monthly.html | Same midnight palette |

### V2 Dark Mode Palette (from `themes.ts` midnight theme)

```css
:root {
  --bg: #1E2228;
  --surface: #2D3340;
  --surface-alt: #3A4A5C;
  --ink: #E8ECF0;
  --ink-2: #E8ECF0CC;
  --ink-3: #4A5568;
  --rule: #3A4A5C;
  --rule-light: #3A4A5C80;
  --accent: #8AB4E8;
  --accent-soft: rgba(138, 180, 232, 0.15);
  --green: #6AAF7E;
  --green-soft: rgba(106, 175, 126, 0.15);
  --blue: #6CA0D4;
  --blue-soft: rgba(108, 160, 212, 0.15);
  --amber: #D4A94F;
  --amber-soft: rgba(212, 169, 79, 0.15);
  --dark: #E8ECF0;
  --cream: #1E2228;
}
```

### V3 Dark Mode Palette (dark variant of lavender design)

```css
:root {
  --primary: #A78BFA;
  --primary-light: #7C3AED;
  --accent: #34D399;
  --accent-soft: rgba(52, 211, 153, 0.12);
  --amber: #FBBF24;
  --amber-soft: rgba(251, 191, 36, 0.12);
  --bg: #1A1028;
  --surface: #2D2440;
  --ink: #EDE5F5;
  --ink-2: #C4B5FD;
  --ink-3: #7C3AED;
  --muted: #6D28D9;
  --muted-bg: #2D2440;
  --border: #3D2E5C;
  --rule: #4C3672;
  --dots: #6D28D9;
}
```

## 8. Failure Model

| Failure | Cause | Recovery |
|---------|-------|----------|
| Color mode CSS file not found | Typo in `colorMode` or file doesn't exist | Log warning, continue with default palette. Do NOT throw. |
| CSS variable collision in combined document | Two templates define same variable differently | Prevented by convention: only combine templates from same design set. Not runtime-checked. |
| Google Fonts fail to load | Network timeout | Puppeteer `networkidle0` waits up to 30s. Font falls back to system font stack defined in template. |
| Template HTML malformed | Missing `</head>` tag | Color-mode injection appends to end of HTML. Degraded but functional. |

## 9. Testing and Validation

### Core Conformance (must-pass)

| Test | Validates |
|------|-----------|
| Render adhd-v3-today.html → PDF, verify file exists and size > 0 | Basic rendering works without theme |
| Render adhd-v3-today.html with `colorMode: 'dark'` → PDF | Dark mode injection works |
| Render adhd-v2-today.html → PDF | V2 backward compatibility |
| Generate 4-week planner (60 pages) → verify page count | Multi-page combined rendering |
| Render with invalid `colorMode: 'nonexistent'` → verify no crash, warning logged | Graceful fallback |
| Verify no `generateThemeCSS` or `SEMANTIC_DEFAULTS` in codebase | Clean deletion |

### Visual Validation (manual)

| Test | Validates |
|------|-----------|
| Open adhd-v3-today.html in browser, compare to generated PDF | WYSIWYG fidelity — the core goal |
| Open adhd-v3-today.html with dark.css manually applied, compare to dark PDF | Dark mode fidelity |
| Open adhd-v2-today.html in browser, compare to generated PDF | V2 fidelity |

## 10. Implementation Checklist (Definition of Done)

### Phase 1: Renderer Surgery
- [ ] Remove `generateThemeCSS()` function from `puppeteer-renderer.ts`
- [ ] Remove `SEMANTIC_DEFAULTS` object from `puppeteer-renderer.ts`
- [ ] Remove theme CSS `<style>` injection from `renderHTMLToPDF()`
- [ ] Remove Google Fonts `<link>` injection from `renderHTMLToPDF()`
- [ ] Remove `theme` from `PuppeteerRenderOptions` interface
- [ ] Add `colorMode?: string` to `PuppeteerRenderOptions` interface
- [ ] Implement color-mode CSS file discovery and injection
- [ ] Remove `Theme` type from `PuppeteerRenderOptions`

### Phase 2: Type Cleanup
- [ ] Remove `Theme`, `ColorPalette`, `ThemeFonts`, `FontConfig` from `src/types/index.ts`
- [ ] Keep `PageDimensions`, `PDFBookmark`, and all other types

### Phase 3: Create Dark Mode CSS Files
- [ ] Create 4 v3 dark.css files (lavender dark palette)
- [ ] Create 4 v2 dark.css files (midnight palette from themes.ts)
- [ ] Create 3 gentle dark.css files (midnight palette)

### Phase 4: Update Generators
- [ ] Update `scripts/generate-4week.ts` — remove theme, add colorMode
- [ ] Update `scripts/generate-v3-year.ts` — same
- [ ] Update `scripts/generate-v2-year.ts` — same
- [ ] Update all other scripts in `scripts/` — remove theme references

### Phase 5: Delete Theme System
- [ ] Delete `src/core/themes.ts`
- [ ] Delete `tests/unit/themes.test.ts`
- [ ] Delete `examples/custom-theme.json`

### Phase 6: Update CLI and Docs
- [ ] Update `src/cli/index.ts` — replace `--theme` with `--color-mode`
- [ ] Update `README.md` — new architecture description
- [ ] Update `CLAUDE.md` — reflect new system

### Phase 7: Verification
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] Generate adhd-v3-today PDF — visually compare to HTML in browser
- [ ] Generate adhd-v3-today dark PDF — verify dark palette applied
- [ ] Generate 4-week planner — verify 60 pages, correct styling
- [ ] No references to `getTheme`, `themes.ts`, or `Theme` type in codebase
