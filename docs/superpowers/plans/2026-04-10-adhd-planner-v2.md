# ADHD Planner v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 2-page daily planner (Today + Reflect) + weekly + monthly reviews for the ADHD + depression + anxiety triad, with CBT sticker cards, year generation, and dark mode support.

**Architecture:** 4 HTML templates rendered via Puppeteer with theme CSS injection. Year generator (`daily-year-v2.ts`) loops 365 days, produces 2 daily pages per day + 1 weekly every Sunday + 1 monthly at month end. CBT stickers added to SVG renderer.

**Tech Stack:** HTML/CSS templates, Puppeteer (multiPage mode), pdf-lib (merge + hyperlinks + bookmarks), SVG + Sharp (stickers), TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/templates/html/adhd-v2-today.html` | Create | Page 1 "Today" — productivity page |
| `src/templates/html/adhd-v2-reflect.html` | Create | Page 2 "Reflect" — feelings page |
| `src/templates/html/adhd-v2-weekly.html` | Create | Weekly review page |
| `src/templates/html/adhd-v2-monthly.html` | Create | Monthly review page |
| `src/templates/planners/daily-year-v2.ts` | Create | Year generator for v2 format (2 daily + weekly + monthly) |
| `src/templates/registry.ts` | Modify | Add 4 new template entries |
| `src/core/svg-renderer.ts` | Modify | Add CBT sticker types |
| `tests/unit/daily-year-v2.test.ts` | Create | Unit tests for v2 year generator |

---

### Task 1: Page 1 "Today" HTML Template

**Files:**
- Create: `src/templates/html/adhd-v2-today.html`

- [ ] **Step 1: Create the Today page HTML**

Full A4 page (210mm × 297mm, 14mm margins) with all CSS variables. Sections in order:
1. Header (green top-border, "Today", date field with `data-inject="date"`)
2. Permission banner
3. Quick checks row (Meds/Sleep/Water)
4. Mood + Anxiety row (side by side cards)
5. 🐸 The Frog (green-soft card)
6. 🎯 Focus (inline)
7. Just Three Things (3 task rows with checkboxes + "when?")
8. 🍅 Pomodoro (6 circles)
9. 🧹 Brain Dump (5 lines)
10. Footer with `data-inject="page-num"`

Use `data-inject` attributes for all dynamic fields. All colors via `var(--*)`. Include Google Fonts link, @page print rules, page-break-after: always.

- [ ] **Step 2: Test render with Puppeteer**

```bash
npx tsx -e "
import { renderHTMLToPDF, closeBrowser } from './src/core/puppeteer-renderer.js';
import { getTheme } from './src/core/themes.js';
import { getPageDimensions } from './src/core/dimensions.js';
import fs from 'fs/promises';
(async () => {
  const buf = await renderHTMLToPDF({
    htmlPath: 'src/templates/html/adhd-v2-today.html',
    theme: getTheme('warm-neutral'),
    dimensions: getPageDimensions('a4', 'portrait'),
  });
  await fs.writeFile('output/test-adhd-v2-today.pdf', buf);
  console.log('OK', (buf.length/1024).toFixed(0), 'KB');
  await closeBrowser();
})();
"
```

- [ ] **Step 3: Test with midnight (dark) theme**

Same render but with `getTheme('midnight')`. Verify dark bg renders correctly.

- [ ] **Step 4: Commit**

```bash
git add src/templates/html/adhd-v2-today.html
git commit -m "feat(adhd-v2): Page 1 Today — productivity page with frog, tasks, pomodoro"
```

---

### Task 2: Page 2 "Reflect" HTML Template

**Files:**
- Create: `src/templates/html/adhd-v2-reflect.html`

- [ ] **Step 1: Create the Reflect page HTML**

Sections:
1. Header (blue top-border, "Reflect", `data-inject="page-num"`)
2. ⚡ Energy (5 shading bars)
3. 🏃 Movement (circle options: Walk/Run/Gym/Yoga/Other + "How I feel after" field)
4. 🧠 Thought Check (amber-soft card, 3 prompts + lines)
5. 🌱 Self-Care Check (green-soft card, 4 circle items)
6. Gratitude / Win / Proud (3 inline rows)
7. → Tomorrow's priority (accent-soft card)
8. ✍️ Free Write (hint + 8 lines)
9. Footer ("You showed up. That counts." + page num)

- [ ] **Step 2: Test render warm-neutral + midnight**
- [ ] **Step 3: Commit**

```bash
git add src/templates/html/adhd-v2-reflect.html
git commit -m "feat(adhd-v2): Page 2 Reflect — CBT thought check, self-care, gratitude"
```

---

### Task 3: Weekly Review HTML Template

**Files:**
- Create: `src/templates/html/adhd-v2-weekly.html`

- [ ] **Step 1: Create weekly review HTML**

Sections: Header (blue), permission banner, mood map (7 circles), win counter (7 dots /7), two columns (wins + keep doing / patterns + one change), self-compassion card, next week intention, footer.

- [ ] **Step 2: Test render**
- [ ] **Step 3: Commit**

```bash
git add src/templates/html/adhd-v2-weekly.html
git commit -m "feat(adhd-v2): Weekly review — mood map, win counter, self-compassion"
```

---

### Task 4: Monthly Review HTML Template

**Files:**
- Create: `src/templates/html/adhd-v2-monthly.html`

- [ ] **Step 1: Create monthly review HTML**

Sections: Header (accent), permission banner, quick stats (4 cards), mood trend (4 week bars), biggest win celebration, two columns (pattern + meds notes), next month focus, footer.

- [ ] **Step 2: Test render**
- [ ] **Step 3: Commit**

```bash
git add src/templates/html/adhd-v2-monthly.html
git commit -m "feat(adhd-v2): Monthly review — stats, mood trend, biggest win"
```

---

### Task 5: Year Generator v2

**Files:**
- Create: `src/templates/planners/daily-year-v2.ts`
- Create: `tests/unit/daily-year-v2.test.ts`

- [ ] **Step 1: Write failing test for day entry builder**

```typescript
// tests/unit/daily-year-v2.test.ts
import { describe, it, expect } from 'vitest';

describe('ADHD v2 year generator', () => {
  it('builds correct day entries for 2026', async () => {
    const { buildDayEntries } = await import('../../src/templates/planners/daily-year-v2.js');
    const days = buildDayEntries(2026, 'en');
    expect(days).toHaveLength(365);
    expect(days[0].dateLabel).toBe('1 Jan');
    expect(days[0].dayOfWeek).toBe(4); // Thursday
    expect(days[364].dateLabel).toBe('31 Dec');
  });

  it('generates 2 pages per day + weekly on Sundays', async () => {
    const { computePageCounts } = await import('../../src/templates/planners/daily-year-v2.js');
    const counts = computePageCounts(2026);
    expect(counts.dailyPages).toBe(365 * 2); // 730
    expect(counts.weeklyPages).toBe(52);
    expect(counts.monthlyPages).toBe(12);
    expect(counts.totalPages).toBe(730 + 52 + 12); // 794
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npx vitest run tests/unit/daily-year-v2.test.ts
```

- [ ] **Step 3: Implement daily-year-v2.ts**

Key differences from v1:
- 2 daily pages per day (Today + Reflect) instead of 4
- Weekly review on Sundays (same as v1)
- Monthly review on last day of each month (NEW)
- Uses `data-inject` attributes for date injection
- Parses 4 separate HTML files instead of splitting one file
- Month tab bar on every page

Export: `generateDailyYearPlannerV2()`, `buildDayEntries()`, `computePageCounts()`

- [ ] **Step 4: Run tests — expect PASS**
- [ ] **Step 5: Commit**

```bash
git add src/templates/planners/daily-year-v2.ts tests/unit/daily-year-v2.test.ts
git commit -m "feat(adhd-v2): year generator — 2 daily + weekly + monthly, 794 pages/year"
```

---

### Task 6: CBT Sticker Cards

**Files:**
- Modify: `src/core/svg-renderer.ts` (add 4 sticker types)

- [ ] **Step 1: Add CBT sticker SVG generators**

Add to `generateStickerSVG()`:
- `cbt-thought-check`: 3-prompt card (80×50mm)
- `cbt-reframe`: compact 1-line (80×20mm)
- `self-compassion-card`: "too hard on myself" (80×25mm)
- `permission-card`: "it's okay to leave blank" (80×20mm)

- [ ] **Step 2: Test render one sticker per type**
- [ ] **Step 3: Commit**

```bash
git add src/core/svg-renderer.ts
git commit -m "feat(adhd-v2): CBT sticker cards — thought check, reframe, compassion, permission"
```

---

### Task 7: Wire into Registry + Renderer

**Files:**
- Modify: `src/templates/registry.ts`
- Modify: `src/core/renderer.ts`

- [ ] **Step 1: Add 4 v2 templates to registry**

```typescript
{
  id: 'adhd-v2-today', name: 'ADHD v2 Today',
  category: 'planner', description: 'Productivity page with Frog, Rule of 3, Pomodoro',
  htmlPath: path.join(HTML_DIR, 'adhd-v2-today.html'),
  multiPage: false, pageCount: 1,
},
// ... + reflect, weekly, monthly
```

- [ ] **Step 2: Add v2 year planner option to renderer**

Add alongside existing ADHD year planner call.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

- [ ] **Step 4: Commit**

```bash
git add src/templates/registry.ts src/core/renderer.ts
git commit -m "feat(adhd-v2): wire into registry and renderer pipeline"
```

---

### Task 8: Integration Test — Full Year Generation

- [ ] **Step 1: Generate January only (quick test)**

```bash
npx tsx scripts/test-adhd-v2-jan.ts
```

Verify: ~68 pages for January (31×2 + ~4 weekly + 1 monthly = 67)

- [ ] **Step 2: Generate full year with warm-neutral theme**

Verify: 794 pages, proper date injection, hyperlinks, bookmarks

- [ ] **Step 3: Generate with midnight theme**

Verify: dark mode renders correctly

- [ ] **Step 4: Commit**

```bash
git commit -m "test(adhd-v2): verified full year generation — 794 pages, warm-neutral + midnight"
```
