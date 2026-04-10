# Low-Level Design (LLD): Self-Contained Template Architecture

**Date:** 2026-04-10  
**Author:** Eng Review  
**HLD:** `docs/HLD-self-contained-templates.md`  
**Spec:** `docs/superpowers/specs/2026-04-10-self-contained-templates-design.md`

---

## 1. Implementation Phases

Execute in this exact order. Each phase is independently verifiable.

```
Phase 1: Renderer Surgery          ──→ tsc passes, render still works
Phase 2: SVG Sticker Self-Contain  ──→ stickers render without theme
Phase 3: PNG Renderer Simplify     ──→ PNG generation works without theme
Phase 4: Type Cleanup              ──→ no Theme type anywhere
Phase 5: Create Dark CSS Files     ──→ 11 files created
Phase 6: Update Generators         ──→ all generators use colorMode
Phase 7: Delete Dead Code          ──→ 15 files removed
Phase 8: CLI + Registry Update     ──→ CLI works with --color-mode
Phase 9: Docs Update               ──→ README + CLAUDE.md updated
Phase 10: Verification             ──→ tsc, visual check, no theme refs
```

---

## 2. Phase 1: Renderer Surgery (`src/core/puppeteer-renderer.ts`)

### 2.1 Lines to DELETE

```
Lines 10:    import type { Theme, PageDimensions } from '../types/index.js';
             → change to: import type { PageDimensions } from '../types/index.js';

Lines 56-80: SEMANTIC_DEFAULTS object (entire block)
             → DELETE entirely

Lines 82-125: generateThemeCSS() function (entire block)
              → DELETE entirely

Lines 128-129: theme: Theme in PuppeteerRenderOptions
               → REMOVE theme property

Lines 158-164: Theme CSS <style> injection
               → REPLACE with color-mode CSS injection

Lines 166-177: Google Fonts <link> injection for theme fonts
               → DELETE entirely
```

### 2.2 New PuppeteerRenderOptions Interface

```typescript
export interface PuppeteerRenderOptions {
  /** Path to HTML template file (also used for color-mode CSS discovery) */
  htmlPath: string;
  /** Page dimensions */
  dimensions: PageDimensions;
  /** Optional: inline HTML string instead of file path */
  htmlContent?: string;
  /**
   * Color mode name (e.g., 'dark'). If set, renderer looks for
   * {htmlPath}.replace('.html', `.${colorMode}.css`) and injects it.
   * Omit for the template's default mode.
   */
  colorMode?: string;
  /**
   * Multi-page mode: let CSS @page rules control page breaks.
   */
  multiPage?: boolean;
}
```

### 2.3 New renderHTMLToPDF Logic

```typescript
export async function renderHTMLToPDF(options: PuppeteerRenderOptions): Promise<Buffer> {
  const { htmlPath, dimensions, htmlContent, colorMode } = options;

  let html: string;
  if (htmlContent) {
    html = htmlContent;
  } else {
    html = await fs.readFile(htmlPath, 'utf-8');
  }

  // Optional: inject color-mode CSS snippet
  if (colorMode && htmlPath) {
    const cssPath = htmlPath.replace('.html', `.${colorMode}.css`);
    try {
      const modeCSS = await fs.readFile(cssPath, 'utf-8');
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style id="color-mode">\n${modeCSS}\n</style>\n</head>`);
      }
    } catch {
      console.warn(`  ⚠ Color mode "${colorMode}" not found: ${cssPath}`);
    }
  }

  // NO theme injection. NO font override. Template CSS is preserved.

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const timeout = options.multiPage ? 120000 : 30000;
    await page.setContent(html, { waitUntil: 'networkidle0', timeout });
    await page.evaluate(() => document.fonts.ready);

    let pdfBuffer: Uint8Array;
    if (options.multiPage) {
      pdfBuffer = await page.pdf({
        preferCSSPageSize: true,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    } else {
      const widthInches = dimensions.width / 72;
      const heightInches = dimensions.height / 72;
      pdfBuffer = await page.pdf({
        width: `${widthInches}in`,
        height: `${heightInches}in`,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
    }

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}
```

### 2.4 renderHTMLToPDFFile — Remove theme from signature

Same function, but update the options type (already handled by interface change).

### 2.5 batchRenderHTML — Remove theme parameter

```typescript
// BEFORE:
export async function batchRenderHTML(
  templates: Array<{ htmlPath: string; outputPath: string; name: string }>,
  theme: Theme,
  dimensions: PageDimensions,
  onProgress?: (name: string, index: number, total: number) => void
)

// AFTER:
export async function batchRenderHTML(
  templates: Array<{ htmlPath: string; outputPath: string; name: string }>,
  dimensions: PageDimensions,
  colorMode?: string,
  onProgress?: (name: string, index: number, total: number) => void
)
```

---

## 3. Phase 2: SVG Sticker Self-Containment (`src/core/svg-renderer.ts`)

### 3.1 Current Pattern (uses theme.colors)

Each sticker function currently receives a `theme: Theme` param and uses:
- `theme.colors.primary` → fill colors
- `theme.colors.secondary` → backgrounds
- `theme.colors.accent` → highlights
- `theme.colors.text` → text fill
- `theme.colors.background` → backgrounds
- `theme.colors.muted` → subtle elements

### 3.2 New Pattern (baked-in palettes)

Define a `StickerPalette` type and a default palette per sticker category:

```typescript
interface StickerPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  muted: string;
}

// Baked from warm-neutral theme (the most commonly used)
const DEFAULT_PALETTE: StickerPalette = {
  primary: '#C4A882',
  secondary: '#E8DDD0',
  accent: '#9B7E5E',
  text: '#3D3229',
  background: '#FAF7F4',
  muted: '#D5C9B8',
};

// CBT stickers use the v2 warm palette
const CBT_PALETTE: StickerPalette = {
  primary: '#C45D3E',
  secondary: '#F3F0EB',
  accent: '#5E8B6A',
  text: '#1A1A1A',
  background: '#FAF8F5',
  muted: '#8A8580',
};
```

### 3.3 Function Signature Changes

```typescript
// BEFORE:
export function generateStickerSVG(
  type: StickerType,
  theme: Theme,
  size?: { width: number; height: number }
): string

// AFTER:
export function generateStickerSVG(
  type: StickerType,
  size?: { width: number; height: number },
  palette?: Partial<StickerPalette>  // optional override
): string
```

Inside the function, replace all `theme.colors.X` with `palette.X` using the appropriate default:

```typescript
const p = { ...DEFAULT_PALETTE, ...palette };
// then use p.primary, p.secondary, p.accent, etc.
```

For CBT sticker types, use `CBT_PALETTE` as the base instead of `DEFAULT_PALETTE`.

---

## 4. Phase 3: PNG Renderer (`src/core/png-renderer.ts`)

### 4.1 Changes

Remove `Theme` from function signatures. Pass through to SVG renderer without theme:

```typescript
// BEFORE:
export async function renderStickerPNG(type, theme: Theme, size, dpi)
// AFTER:
export async function renderStickerPNG(type, size, dpi, palette?)

// BEFORE:
export async function renderStickerToFile(type, theme: Theme, ...)
// AFTER:
export async function renderStickerToFile(type, ...)

// BEFORE:
export async function batchRenderStickers(types, theme: Theme, ...)
// AFTER:
export async function batchRenderStickers(types, ...)
```

Remove `theme.id` from filename generation — use a fixed prefix or let the caller specify output paths.

---

## 5. Phase 4: Type Cleanup (`src/types/index.ts`)

### 5.1 Types to DELETE

```typescript
// DELETE all of these:
export interface FontConfig { ... }
export interface ThemeFonts { ... }
export interface ColorPalette { ... }
export interface Theme { ... }
```

### 5.2 Types to KEEP (unchanged)

```typescript
export interface PageDimensions { ... }
export interface Margins { ... }
export interface PDFBookmark { ... }
export interface PDFHyperlink { ... }
export interface PostProcessOptions { ... }
// Any other non-theme types
```

### 5.3 New Type to ADD

```typescript
export interface StickerPalette {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  muted: string;
}
```

---

## 6. Phase 5: Create Dark CSS Files

### 6.1 V2 + Gentle Dark Palette (7 files)

All share the same palette (from midnight theme in themes.ts):

**Files:**
- `src/templates/html/adhd-v2-today.dark.css`
- `src/templates/html/adhd-v2-reflect.dark.css`
- `src/templates/html/adhd-v2-weekly.dark.css`
- `src/templates/html/adhd-v2-monthly.dark.css`
- `src/templates/html/adhd-gentle-daily.dark.css`
- `src/templates/html/adhd-gentle-weekly.dark.css`
- `src/templates/html/adhd-gentle-monthly.dark.css`

**Content (identical for all 7):**

```css
/* Midnight dark mode — overrides default warm-neutral palette */
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

### 6.2 V3 Dark Palette (4 files)

**Files:**
- `src/templates/html/adhd-v3-today.dark.css`
- `src/templates/html/adhd-v3-reflect.dark.css`
- `src/templates/html/adhd-v3-weekly.dark.css`
- `src/templates/html/adhd-v3-monthly.dark.css`

**Content (identical for all 4):**

```css
/* Dark lavender mode — overrides default light lavender palette */
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

---

## 7. Phase 6: Update Generators

### 7.1 `scripts/generate-4week.ts`

```typescript
// DELETE these imports:
import { getTheme } from '../src/core/themes.js';

// DELETE these lines:
const theme = getTheme(themeName);

// CHANGE renderHTMLToPDF call:
// BEFORE:
pdfBuffer = await renderHTMLToPDF({
  htmlPath: `${prefix}-today.html`,
  theme,
  dimensions: dims,
  htmlContent: fullHTML,
  multiPage: true,
});

// AFTER:
const colorMode = process.argv[3]; // optional: 'dark'
pdfBuffer = await renderHTMLToPDF({
  htmlPath: `${prefix}-today.html`,
  dimensions: dims,
  htmlContent: fullHTML,
  colorMode,
  multiPage: true,
});
```

**CLI change:** `npx tsx scripts/generate-4week.ts v3 dark` instead of `npx tsx scripts/generate-4week.ts v3 warm-neutral`

### 7.2 `scripts/generate-v3-year.ts`

Same pattern — remove `getTheme`, replace `theme` with optional `colorMode`.

### 7.3 `scripts/generate-v2-year.ts`

Same pattern.

### 7.4 `src/templates/planners/daily-year-v2.ts`

This is the year planner library function (not a script). Remove `Theme` from its interface:

```typescript
// BEFORE:
export async function generateDailyYearPlanner(options: {
  year: number;
  theme: Theme;
  dimensions: PageDimensions;
  ...
})

// AFTER:
export async function generateDailyYearPlanner(options: {
  year: number;
  dimensions: PageDimensions;
  colorMode?: string;
  ...
})
```

### 7.5 `src/templates/planners/daily-year.ts`

Same treatment as daily-year-v2.ts — remove Theme dependency.

---

## 8. Phase 7: Delete Dead Code

### 8.1 Files to DELETE

```
src/core/themes.ts                    # Theme system (329 lines)
src/core/renderer.ts                  # Central orchestrator (only consumer of pdfkit-renderer)
src/core/pdfkit-renderer.ts           # Simple page renderer (only used by renderer.ts)
tests/unit/themes.test.ts             # Theme tests
examples/custom-theme.json            # Custom theme example
scripts/test-3month.ts                # Test script using orchestrator
scripts/test-cbt-stickers.ts          # Test script using themes
scripts/test-gentle.ts                # Test script using themes
scripts/test-january.ts               # Test script using themes
scripts/test-v2-render.ts             # Test script using themes
scripts/test-adhd-v2-jan.ts           # Test script using themes
scripts/test-adhd-v2-render.ts        # Test script using themes
scripts/test-puppeteer.ts             # Test script using themes
scripts/test-links-pdfkit.ts          # Test script (depends on pdfkit-renderer)
docs/superpowers/specs/2026-04-10-adhd-planner-v2-design.md   # Superseded
docs/superpowers/plans/2026-04-10-adhd-planner-v2.md          # Superseded
```

### 8.2 Verification After Delete

```bash
# Must pass:
npx tsc --noEmit

# Must return 0 results:
grep -rn "getTheme\|themes\.ts\|Theme " src/ scripts/ --include="*.ts" | grep -v "node_modules" | grep -v ".dark.css"

# Must return 0 results:
grep -rn "import.*themes" src/ scripts/ --include="*.ts" | grep -v "node_modules"
```

---

## 9. Phase 8: CLI + Registry

### 9.1 `src/cli/index.ts`

```typescript
// REMOVE:
.option('--theme <id>', 'Theme ID (warm-neutral, midnight, etc.)')
import { getTheme } from '../core/themes.js'

// ADD:
.option('--color-mode <mode>', 'Color mode (dark, etc.). Omit for default.')

// Usage becomes:
// npx goodnotes-templates render adhd-v3-today --color-mode dark
// npx goodnotes-templates render adhd-v3-today  (default light)
```

### 9.2 `src/templates/registry.ts`

Remove any theme-related imports and references. The registry should list available templates
and their color mode variants (discovered by scanning for `.{mode}.css` files).

---

## 10. Phase 9: Documentation

### 10.1 `README.md`

Update the "Themes" section → "Color Modes" section. Show:

```bash
# Default (light mode — uses template's built-in palette):
npx tsx scripts/generate-4week.ts v3

# Dark mode:
npx tsx scripts/generate-4week.ts v3 dark
```

Remove the 8-theme table. Replace with:
- Templates are self-contained (WYSIWYG)
- Color modes: optional `.dark.css` snippets
- How to create a custom color mode

### 10.2 `CLAUDE.md`

Update architecture description to match HLD.

---

## 11. Phase 10: Verification Checklist

```
[ ] npx tsc --noEmit → zero errors
[ ] grep -r "getTheme\|themes\.\|Theme " src/ scripts/ → zero results
[ ] Generate v3-today PDF → opens, matches HTML in browser
[ ] Generate v3-today dark PDF → dark palette applied
[ ] Generate 4-week planner → 60 pages, correct styling
[ ] Generate sticker PNGs → render without errors
[ ] All existing output/*.pdf files can be regenerated
```

---

## 12. Dependency Graph (execution order)

```
Phase 1: puppeteer-renderer.ts ─┐
Phase 2: svg-renderer.ts       ─┤── Can be parallelized (independent)
Phase 3: png-renderer.ts       ─┘   (but png depends on svg phase 2)
                                │
Phase 4: types/index.ts ────────┘── After phases 1-3 (removes types they used)
                                │
Phase 5: dark.css files ────────── Independent, can do anytime
                                │
Phase 6: generators ────────────── After phases 1 + 4 (uses new renderer API)
                                │
Phase 7: delete dead code ──────── After phase 6 (ensure nothing references deleted files)
                                │
Phase 8: CLI + registry ────────── After phase 7
                                │
Phase 9: docs ──────────────────── After phase 8
                                │
Phase 10: verification ─────────── After all phases
```
