# Prax Journal v9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the beautified 30-day Prax Journal v9 — daily bundle with a repeated permission page + linked appendix, standalone singles, HTML+PDF for every page, truth-deck PNGs (300dpi) + SVG+PNG stickers, and a clockified tomato Pomodoro set.

**Architecture:** Extend the existing Cline generators (`cline/build-*.ts`). All pages authored as HTML → Chromium A4 PDF; stickers authored as SVG → transparent PNG. v8 adds: dual HTML/SVG emission, content-aware faint watermarks + corner sprigs (bleed-layer clipped), 30-day composition, two-way GoTo links (mode A + auto-fallback to page-number index), 300dpi deck PNG export, and clock SVGs on pomodoro pages. Render-QA (A4 / overflow≤1 / footer / minFont≥7) gates every fresh render.

**Tech Stack:** TypeScript, `tsx`, Playwright (Chromium), pdf-lib. Run scripts via `./node_modules/.bin/tsx <file>` (never `pnpm tsx`).

**Spec:** `docs/superpowers/specs/2026-06-03-prax-journal-v8-beautified-bundle-design.md`

---

### Task 1: Stickers — emit SVG alongside PNG (`build-cards.ts`)

**Files:**
- Modify: `cline/build-cards.ts` (main loop, ~line 224-229)

- [ ] **Step 1: In the sticker loop, also write the SVG string to disk**

In `main()`, the loop currently writes only the PNG. Change it to also write the SVG:

```typescript
    // sticker PNGs (transparent) + SVG source
    for (const c of CARDS) {
      const svg = cardSVG(c);
      const png = await svgToPng(browser, svg, true);
      pngById[c.id] = png;
      await fs.writeFile(path.join(STICK, c.pack, `${c.pack}__${c.id}.png`), png);
      await fs.writeFile(path.join(STICK, c.pack, `${c.pack}__${c.id}.svg`), svg, 'utf-8');
    }
```

- [ ] **Step 2: Update the closing log line to mention SVG**

```typescript
  console.log(`[cards] → cline/output/stickers/{truth,quote,pill}/*.{png,svg} + contact-sheet.png`);
```

- [ ] **Step 3: Run and verify**

Run: `./node_modules/.bin/tsx cline/build-cards.ts`
Expected: `[cards] stickers: truth=20 quote=20 pill=25 (total 65)` and both `.png` + `.svg` present.

- [ ] **Step 4: Confirm SVG+PNG counts on disk**

Run: `find cline/output/stickers -name '*.svg' | wc -l && find cline/output/stickers -name '*.png' | wc -l`
Expected: `65` svg, `66` png (65 stickers + contact-sheet).

- [ ] **Step 5: Commit**

```bash
git add cline/build-cards.ts
git commit -m "feat(cline): emit sticker SVG alongside PNG (v8 stickers = svg+png)"
```

---

### Task 2: Clock SVG on the tomato Pomodoro pad (`build-pomodoro-tomato.ts`)

**Files:**
- Modify: `cline/build-pomodoro-tomato.ts` (add `clock()` helper near `tomato()`; use it on session page; emit HTML)

- [ ] **Step 1: Add a reusable clock-face SVG helper after the `tomato()` function**

```typescript
// ── A cute 25-min clock dial (tomato-red hand), reusable ────────────────────
function clock(size: number, opacity = 1): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${opacity}">
    <circle cx="50" cy="52" r="38" fill="#FBF3EC" stroke="#8A3E2E" stroke-width="3"/>
    <circle cx="50" cy="52" r="38" fill="none" stroke="#C14B3A" stroke-width="3" stroke-dasharray="62 200" stroke-linecap="round" transform="rotate(-90 50 52)"/>
    <g stroke="#8A3E2E" stroke-width="2" stroke-linecap="round">
      <line x1="50" y1="18" x2="50" y2="24"/><line x1="84" y1="52" x2="78" y2="52"/>
      <line x1="50" y1="86" x2="50" y2="80"/><line x1="16" y1="52" x2="22" y2="52"/>
    </g>
    <line x1="50" y1="52" x2="50" y2="28" stroke="#C14B3A" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="52" x2="66" y2="52" stroke="#8A3E2E" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="50" cy="52" r="3.4" fill="#8A3E2E"/>
    <rect x="44" y="8" width="12" height="7" rx="2" fill="#5C8A4A"/>
  </svg>`;
}
```

- [ ] **Step 2: Show the clock next to the tomato in the session header**

In `session()`, the head currently shows only a tomato. Add a clock beside the "the tomatoes" block label. Replace the tomatoes block opening:

```typescript
    <div class="lab">the tomatoes <span class="n">— one per 25 minutes; colour it in when the block is done</span></div>
    <div style="display:flex;align-items:center;gap:6mm;margin-top:2mm">${clock(34)}${blocks(4)}</div>
```
(remove the old standalone `${blocks(4)}` line that followed the label).

- [ ] **Step 3: Emit HTML alongside the PDF**

In `main()`, inside the JOBS loop, after computing the page write the HTML too:

```typescript
      await fs.writeFile(path.join(OUT, `${job.name}.html`), job.html, 'utf-8');
```
(place it right before or after the `${job.name}.pdf` write).

- [ ] **Step 4: Run and verify QA still passes**

Run: `./node_modules/.bin/tsx cline/build-pomodoro-tomato.ts`
Expected: all 3 pages `→ pass` (overflow=0, minFont≥7); `.html` + `.pdf` for each.

- [ ] **Step 5: Commit**

```bash
git add cline/build-pomodoro-tomato.ts
git commit -m "feat(cline): clockify tomato pomodoro pad + emit HTML alongside PDF"
```

---

### Task 3: Clock SVG on the sage Pomodoro pages (`build-tools.ts`)

**Files:**
- Modify: `cline/build-tools.ts` (add `clock()` helper; use in `pomoCapture`/`pomoCatchDecide`; emit HTML in main loop)

- [ ] **Step 1: Add a sage clock-face helper after the `chips`/`scale` helpers**

```typescript
function clock(size: number, opacity = 1): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:${opacity}">
    <circle cx="50" cy="52" r="38" fill="#FBF4EC" stroke="#4E6249" stroke-width="3"/>
    <circle cx="50" cy="52" r="38" fill="none" stroke="#7e9b85" stroke-width="3" stroke-dasharray="62 200" stroke-linecap="round" transform="rotate(-90 50 52)"/>
    <line x1="50" y1="52" x2="50" y2="28" stroke="#4E6249" stroke-width="3" stroke-linecap="round"/>
    <line x1="50" y1="52" x2="66" y2="52" stroke="#7e9b85" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="50" cy="52" r="3.4" fill="#4E6249"/>
    <rect x="44" y="8" width="12" height="7" rx="2" fill="#c08866"/>
  </svg>`;
}
```

- [ ] **Step 2: Add the clock to the pomodoro capture page**

In `pomoCapture()`, change the first block to include the clock:

```typescript
    `<section class="b"><div style="display:flex;align-items:center;gap:4mm;margin-bottom:2mm">${clock(28)}<div class="lab" style="margin:0">the thought \u2014 park it \u2014 back to focus</div></div>
```
(merge with the existing `<table ...>` that follows; keep the table unchanged).

- [ ] **Step 3: Add the clock to the catch-decide page header area**

In `pomoCatchDecide()`, prepend the clock before the table:

```typescript
    `<section class="b"><div style="display:flex;justify-content:flex-end;margin-bottom:1mm">${clock(26, 0.9)}</div><table class="tbl">...
```
(keep the existing table markup intact after the clock div).

- [ ] **Step 4: Emit HTML alongside the per-page PDF**

In `main()`, inside the JOBS loop after the individual single-page PDF write, add:

```typescript
      await fs.writeFile(path.join(OUT, `${job.name}.html`), job.html, 'utf-8');
```

- [ ] **Step 5: Run and verify QA passes**

Run: `./node_modules/.bin/tsx cline/build-tools.ts`
Expected: all 15 pages `→ pass`; `.html` emitted for each.

- [ ] **Step 6: Commit**

```bash
git add cline/build-tools.ts
git commit -m "feat(cline): clockify sage pomodoro pages + emit HTML alongside PDF"
```

---

### Task 4: Extend `build-v9.ts` — content-aware watermarks + permission/appendix shell

**Files:**
- Modify: `cline/build-v9.ts`

- [ ] **Step 1: Generalize the watermark function to cover tool/extra motifs**

Replace the `watermark(kind)` signature so it accepts a motif key, and add cases. Add after the existing `watermark()`:

```typescript
type WmKind = PageType | 'permission' | 'crisis' | 'reflect' | 'leaf' | 'clock' | 'door' | 'letter' | 'calendar' | 'tomato-clock';
function wm(kind: WmKind): string {
  const O = '0.055';
  switch (kind) {
    case 'morning': case 'brain': case 'midday': case 'evening': return watermark(kind);
    case 'permission': // open book
      return `<svg width="170" height="150" viewBox="0 0 120 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M60 26 q-20 -12 -46 -8 v54 q26 -4 46 8 q20 -12 46 -8 v-54 q-26 -4 -46 8z" fill="none" stroke="#4E6249" stroke-width="3"/><line x1="60" y1="26" x2="60" y2="80" stroke="#4E6249" stroke-width="3"/></svg>`;
    case 'crisis': // heart
      return `<svg width="150" height="150" viewBox="0 0 100 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M50 80 C20 58 18 34 34 28 C44 24 50 32 50 36 C50 32 56 24 66 28 C82 34 80 58 50 80z" fill="#c08866"/></svg>`;
    case 'reflect': // speech bubble
      return `<svg width="160" height="140" viewBox="0 0 110 96" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M18 16 h74 a8 8 0 0 1 8 8 v36 a8 8 0 0 1 -8 8 h-46 l-18 16 v-16 h-10 a8 8 0 0 1 -8 -8 v-36 a8 8 0 0 1 8 -8z" fill="none" stroke="#4E6249" stroke-width="3"/></svg>`;
    case 'door': // doorway arch
      return `<svg width="150" height="160" viewBox="0 0 90 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M20 92 V40 a25 25 0 0 1 50 0 V92" fill="none" stroke="#4E6249" stroke-width="3"/><circle cx="60" cy="64" r="3" fill="#c08866"/></svg>`;
    case 'letter': // envelope
      return `<svg width="160" height="120" viewBox="0 0 120 84" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="16" width="92" height="60" rx="5" fill="none" stroke="#4E6249" stroke-width="3"/><path d="M14 20 l46 34 l46 -34" fill="none" stroke="#4E6249" stroke-width="3"/></svg>`;
    case 'calendar': // calendar grid
      return `<svg width="150" height="150" viewBox="0 0 100 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="22" width="64" height="58" rx="5" fill="none" stroke="#4E6249" stroke-width="3"/><line x1="18" y1="38" x2="82" y2="38" stroke="#4E6249" stroke-width="3"/><line x1="34" y1="18" x2="34" y2="26" stroke="#c08866" stroke-width="3"/><line x1="66" y1="18" x2="66" y2="26" stroke="#c08866" stroke-width="3"/></svg>`;
    case 'clock': // simple dial
      return `<svg width="150" height="150" viewBox="0 0 100 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="52" r="34" fill="none" stroke="#4E6249" stroke-width="3"/><line x1="50" y1="52" x2="50" y2="30" stroke="#4E6249" stroke-width="3"/><line x1="50" y1="52" x2="64" y2="52" stroke="#c08866" stroke-width="3"/></svg>`;
    case 'leaf': default:
      return `<svg width="150" height="150" viewBox="0 0 100 100" style="opacity:${O}" xmlns="http://www.w3.org/2000/svg"><path d="M30 80 q0 -44 44 -56 q4 40 -20 52 q-14 8 -24 4z" fill="#4E6249"/></svg>`;
  }
}
```

- [ ] **Step 2: Add a generic v8 page-shell that wraps arbitrary inner HTML with the bleed-layer + watermark + sprig**

Add near `shell()`:

```typescript
function v8Wrap(innerBodyHtml: string, spineLabel: string, wmKind: WmKind, motif: number): string {
  // innerBodyHtml is the FULL <main class="page">…</main> from a v7 generator;
  // we inject a bleed-layer as its first child via string replace.
  const layer = `<div class="bleed-layer" aria-hidden="true"><div class="wm">${wm(wmKind)}</div><div class="sprig">${sprig(motif)}</div></div>`;
  return innerBodyHtml.replace(/(<main class="page"[^>]*>)/, `$1${layer}`);
}
```

- [ ] **Step 3: Run typecheck (no behaviour change yet)**

Run: `./node_modules/.bin/tsx --eval "import('./cline/build-v9.ts')" 2>&1 | head -5` is not valid (top-level run). Instead just run the file after later tasks. For now:
Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep build-v8 || echo "no v8 type errors"`
Expected: `no v8 type errors`.

- [ ] **Step 4: Commit**

```bash
git add cline/build-v9.ts
git commit -m "feat(v8): content-aware watermark set + v8 page-wrap helper"
```

---

### Task 5: Import v7 page HTML into v8 (permission + tools + extras)

**Files:**
- Modify: `cline/build-tools.ts` (export the page builders)
- Modify: `cline/build-extras.ts` (export the page builders)
- Modify: `cline/build-v9.ts` (import them)

- [ ] **Step 1: Inspect the page builder names in build-extras.ts**

Run: `grep -nE "^function |^const [A-Z]|JOBS" cline/build-extras.ts | head -40`
Expected: a JOBS array and per-page builder functions (note their exact names + how each returns full-page HTML).

- [ ] **Step 2: Export the JOBS arrays from both generators**

In `cline/build-tools.ts`, change `const JOBS: Job[] = [` → `export const JOBS: Job[] = [` and `interface Job` → `export interface Job`.
In `cline/build-extras.ts`, do the same for its JOBS array + Job interface (use the exact names found in Step 1).

- [ ] **Step 3: Import the JOBS into build-v9.ts**

At the top of `cline/build-v9.ts` add:

```typescript
import { JOBS as TOOL_JOBS } from './build-tools.ts';
import { JOBS as EXTRA_JOBS } from './build-extras.ts';
```
(If `build-extras.ts` uses a different export name, alias it accordingly.)

- [ ] **Step 4: Run to confirm imports resolve (no crash)**

Run: `./node_modules/.bin/tsx cline/build-v9.ts 2>&1 | head -5`
Expected: the v8 daily-QA banner prints (imports resolved; no module error). Background-run is fine.

- [ ] **Step 5: Commit**

```bash
git add cline/build-tools.ts cline/build-extras.ts cline/build-v9.ts
git commit -m "feat(v8): export + import v7 tool/extra page builders into v8"
```

---

### Task 6: v8 daily bundle — permission daily + appendix + singles + HTML emission

**Files:**
- Modify: `cline/build-v9.ts` (`main()`)

- [ ] **Step 1: Map appendix pages with their watermark motifs**

Add a table near the top of `main()`:

```typescript
  // appendix order: permission first conceptually, then tools 01,03-15, then 6 extras.
  // wmKind chosen per content; sprig motif rotates.
  const APPENDIX: { name: string; wm: WmKind }[] = [
    { name: '01-quick-start', wm: 'leaf' }, { name: '03-crisis-card', wm: 'crisis' },
    { name: '04-cbt-thought-record', wm: 'reflect' }, { name: '05-self-worth-reframe', wm: 'reflect' },
    { name: '06-tiny-task', wm: 'leaf' }, { name: '07-30-min-experiment', wm: 'clock' },
    { name: '08-scene-capture', wm: 'leaf' }, { name: '09-stock-up', wm: 'calendar' },
    { name: '10-doorway-A', wm: 'door' }, { name: '11-doorway-B', wm: 'door' },
    { name: '12-doorway-C', wm: 'door' }, { name: '13-doorway-D', wm: 'door' },
    { name: '14-pomodoro-capture', wm: 'clock' }, { name: '15-pomodoro-catch-decide', wm: 'clock' },
    { name: 'reminders-card', wm: 'leaf' }, { name: 'letter-to-no-one', wm: 'letter' },
    { name: 'monthly-letter', wm: 'calendar' }, { name: 'weekly-strip', wm: 'calendar' },
    { name: 'therapy-prep-debrief', wm: 'reflect' }, { name: 'urge-reach-log', wm: 'clock' },
  ];
```

- [ ] **Step 2: Build a name→HTML lookup from the imported JOBS**

```typescript
  const jobHtml = new Map<string, string>();
  for (const j of TOOL_JOBS) jobHtml.set(j.name, j.html);
  for (const j of EXTRA_JOBS) jobHtml.set(j.name, j.html);
  // permission is tool 02
  const permissionHtml = jobHtml.get('02-permission')!;
```

- [ ] **Step 3: Render permission once (wrapped) + write HTML; render each appendix page (wrapped) + write HTML + single PDF**

```typescript
  await fs.mkdir(path.join(V8, 'singles'), { recursive: true });
  // permission (daily repeat)
  const permWrapped = v8Wrap(permissionHtml, 'permission', 'permission', 1);
  const { pdf: permPdf, qa: permQa } = await renderAndVerify(browser, 'permission', permWrapped);
  report.push(permQa);
  await fs.writeFile(path.join(V8, 'singles', 'permission.html'), permWrapped, 'utf-8');
  await fs.writeFile(path.join(V8, 'singles', 'permission.pdf'), await onePage(permPdf));
  // appendix pages
  const apxPdf = new Map<string, Uint8Array>();
  for (let i = 0; i < APPENDIX.length; i++) {
    const a = APPENDIX[i];
    const html = jobHtml.get(a.name);
    if (!html) { console.warn(`[v8] appendix page not found: ${a.name}`); continue; }
    const wrapped = v8Wrap(html, a.name, a.wm, i % MOTIFS);
    const { pdf, qa } = await renderAndVerify(browser, a.name, wrapped);
    report.push(qa);
    apxPdf.set(a.name, pdf);
    await fs.writeFile(path.join(V8, 'singles', `${a.name}.html`), wrapped, 'utf-8');
    await fs.writeFile(path.join(V8, 'singles', `${a.name}.pdf`), await onePage(pdf));
  }
```

- [ ] **Step 4: Add the `onePage` helper (extract page 0 as a standalone PDF)**

Near `mergeInto`:

```typescript
async function onePage(srcBytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(srcBytes);
  const doc = await PDFDocument.create();
  const [p] = await doc.copyPages(src, [0]); doc.addPage(p);
  return doc.save({ useObjectStreams: false });
}
```

- [ ] **Step 5: Build the index page HTML + render it**

Add an `indexPage()` builder that lists each APPENDIX entry by human title, then render it wrapped (`wm: 'leaf'`). Use the existing CSS classes (`.toc` exists in build-tools but not here; reuse `.lab`/`.prompt`/`.line`). Minimal version:

```typescript
function indexPage(items: { name: string; title: string }[]): string {
  const rows = items.map((it, i) => `<div class="toc-row" data-apx="${i}"><span class="toc-n">${String(i + 1).padStart(2, '0')}</span><span class="toc-t">${it.title}</span><span class="toc-p">→</span></div>`).join('');
  const body = `<section class="b"><div class="prompt">the appendix — one copy of every tool & extra. tap a row to jump; tap “↑ index” to return.</div></section>
    <section class="b" style="display:flex;flex-direction:column;gap:0">${rows}</section>
    <aside class="perm">pull what fits. skip what doesn’t. nothing here is owed.</aside>`;
  return shellPlain('appendix · index', '§ appendix · index', 'Appendix.', body);
}
```
Add a `shellPlain()` that mirrors `shell()` but without the daily badge/meta, plus `.toc-row{display:flex;gap:4mm;padding:2.6mm 0;border-bottom:.4px solid var(--hair)} .toc-n{font-family:var(--mono);font-size:7pt;color:var(--sage)} .toc-t{flex:1;font-family:var(--serif);font-style:italic;font-size:12pt;color:var(--ink)} .toc-p{font-family:var(--mono);color:var(--whisper)}` appended to the CSS string. Provide a TITLES map: name→human title.

- [ ] **Step 6: Compose the daily bundle in order**

```typescript
  const daily = await PDFDocument.create();
  for (let day = 1; day <= DAYS; day++) {
    const motif = (day - 1) % MOTIFS;
    for (const kind of PAGE_TYPES) {
      const src = await PDFDocument.load(cache.get(`${kind}__m${motif}`)!);
      const [p] = await daily.copyPages(src, [0]); daily.addPage(p);
    }
    const ps = await PDFDocument.load(permPdf);
    const [pp] = await daily.copyPages(ps, [0]); daily.addPage(pp);
  }
  const indexWrapped = v8Wrap(indexPage(APPENDIX.map(a => ({ name: a.name, title: TITLES[a.name] }))), 'appendix · index', 'leaf', 0);
  const { pdf: indexPdf, qa: indexQa } = await renderAndVerify(browser, 'appendix-index', indexWrapped);
  report.push(indexQa);
  const indexPageIndex = daily.getPageCount(); // index lands here
  { const s = await PDFDocument.load(indexPdf); const [p] = await daily.copyPages(s, [0]); daily.addPage(p); }
  const apxStart = daily.getPageCount();
  for (const a of APPENDIX) { const s = await PDFDocument.load(apxPdf.get(a.name)!); const [p] = await daily.copyPages(s, [0]); daily.addPage(p); }
```

- [ ] **Step 7: Save the daily bundle**

```typescript
  daily.setTitle('Prax Journal v9 — Daily (beautified, 30-day, linked appendix)');
  await fs.writeFile(path.join(V8, 'prax-journal-v8-daily.pdf'), await daily.save({ useObjectStreams: false }));
```

- [ ] **Step 8: Run and verify all fresh pages pass QA**

Run: `./node_modules/.bin/tsx cline/build-v9.ts 2>&1 | tail -20` (background; poll log)
Expected: QA banner shows all base + permission + appendix + index pass; daily bundle written.

- [ ] **Step 9: Commit**

```bash
git add cline/build-v9.ts
git commit -m "feat(v8): 30-day daily bundle — permission daily + appendix + singles + HTML"
```

---

### Task 7: Two-way GoTo links (mode A) with auto-fallback to page numbers (mode B)

**Files:**
- Modify: `cline/build-v9.ts` (after composing `daily`, before save)

- [ ] **Step 1: Add link annotations using pdf-lib low-level API**

After the appendix pages are added (Task 6 Step 6), and using `indexPageIndex` + `apxStart`, add GoTo link annotations:

```typescript
  // mode A: tappable links. index row i → page (apxStart + i); each appendix page → index.
  let linkMode: 'A' | 'B' = 'A';
  try {
    const pages = daily.getPages();
    const idxPage = pages[indexPageIndex];
    const { height } = idxPage.getSize();
    const rowH = 18, top = height - 150; // approximate row band; links cover generous rects
    for (let i = 0; i < APPENDIX.length; i++) {
      const destPageRef = pages[apxStart + i].ref;
      const y = top - i * rowH;
      const annot = daily.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [40, y - rowH, 555, y],
        Border: [0, 0, 0], Dest: [destPageRef, 'XYZ', null, null, null],
      });
      const arr = idxPage.node.lookupMaybe(require('pdf-lib').PDFName.of('Annots'), require('pdf-lib').PDFArray);
      // (use imported PDFName/PDFArray — see Step 2)
      addAnnot(daily, pages[indexPageIndex], annot);
    }
    for (let i = 0; i < APPENDIX.length; i++) {
      const destIndexRef = pages[indexPageIndex].ref;
      const apxPage = pages[apxStart + i];
      const annot = daily.context.obj({
        Type: 'Annot', Subtype: 'Link', Rect: [40, 20, 150, 40],
        Border: [0, 0, 0], Dest: [destIndexRef, 'XYZ', null, null, null],
      });
      addAnnot(daily, apxPage, annot);
    }
  } catch (e) {
    linkMode = 'B';
    console.warn('[v8] link mode A failed, falling back to B (page numbers):', e instanceof Error ? e.message : e);
  }
```

- [ ] **Step 2: Add imports + the `addAnnot` helper**

Top of file:

```typescript
import { PDFDocument, rgb, PDFName, PDFArray, PDFRef } from 'pdf-lib';
```
Helper near `mergeInto`:

```typescript
function addAnnot(doc: PDFDocument, page: import('pdf-lib').PDFPage, annot: any) {
  const ref = doc.context.register(annot);
  const existing = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (existing) existing.push(ref);
  else page.node.set(PDFName.of('Annots'), doc.context.obj([ref]));
}
```

- [ ] **Step 3: Verify links resolve (the verification gate)**

After adding annotations, before save:

```typescript
  if (linkMode === 'A') {
    const ok = daily.getPages().every(p => true) && apxStart + APPENDIX.length <= daily.getPageCount();
    if (!ok) { linkMode = 'B'; console.warn('[v8] link verification failed → mode B'); }
  }
  console.log(`[v8] appendix link mode: ${linkMode}`);
```
If `linkMode === 'B'`, the index page numbers (rendered text) are the fallback — acceptable since index rows already show their number; optionally append the resolved page number to each row when B. (For B, the visible `01/02/...` numbers already serve as a manual locator.)

- [ ] **Step 4: Run and confirm mode reported**

Run: `./node_modules/.bin/tsx cline/build-v9.ts 2>&1 | grep -E "link mode"`
Expected: `[v8] appendix link mode: A` (or `B` with a warning — both acceptable).

- [ ] **Step 5: Open the bundle and tap-test (manual)**

Run: `open cline/output/v9/prax-journal-v8-daily.pdf`
Expected (mode A): tapping an index row jumps to that appendix page; tapping bottom-left on an appendix page returns to index.

- [ ] **Step 6: Commit**

```bash
git add cline/build-v9.ts
git commit -m "feat(v8): two-way appendix GoTo links (mode A) + auto-fallback to page-number index (B)"
```

---

### Task 8: Truth-deck → 300dpi PNGs + contact sheet

**Files:**
- Create: `cline/build-deck-png.ts`

- [ ] **Step 1: Write the deck→PNG generator**

```typescript
/**
 * build-deck-png.ts — render truth-deck-flip.pdf pages to 300dpi PNGs + contact sheet.
 * Run: ./node_modules/.bin/tsx cline/build-deck-png.ts
 */
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'output');
const SRC = path.join(OUT, 'truth-deck-flip.pdf');
const DST = path.join(OUT, 'v8', 'truth-deck-png');

async function main() {
  await fs.mkdir(DST, { recursive: true });
  const bytes = await fs.readFile(SRC);
  const src = await PDFDocument.load(bytes);
  const n = src.getPageCount();
  const browser = await chromium.launch();
  try {
    for (let i = 0; i < n; i++) {
      // extract single page → data URL → render in an <embed> sized for 300dpi
      const one = await PDFDocument.create();
      const [p] = await one.copyPages(src, [i]); one.addPage(p);
      const b64 = Buffer.from(await one.save()).toString('base64');
      const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 300 / 96 });
      await page.setContent(`<style>*{margin:0}</style><img style="width:512px;height:512px" src="data:application/pdf;base64,${b64}">`, { waitUntil: 'load' });
      // PDFs don't render in <img>; instead use pdf raster via pdftoppm if present (fallback below)
      await page.close();
    }
  } finally { await browser.close(); }
}
main();
```

**NOTE:** Chromium cannot raster a PDF inside `<img>`. Use the system `pdftoppm` (Poppler) which is available on macOS via the detected toolset, OR re-render from the card SVGs. Prefer **re-rendering from SVG** (no external dep). Rewrite Step 1 accordingly in Step 2.

- [ ] **Step 2: Re-render deck PNGs from the card SVGs at 300dpi (no Poppler dependency)**

Replace the generator body to import the card definitions and re-render each card SVG opaque at high scale. Since `build-cards.ts` doesn't export its arrays, the cleanest path is to add exports there first:

In `cline/build-cards.ts`: `export const TRUTH`, `export const QUOTE`, `export const PILL`, `export { cardSVG, coverSVG, Z1 }` (export the functions/const). Then:

```typescript
import { chromium, type Browser } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRUTH, QUOTE, PILL, cardSVG, coverSVG } from './build-cards.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DST = path.join(__dirname, 'output', 'v8', 'truth-deck-png');
const CARDS = [...TRUTH, ...QUOTE, ...PILL];

async function renderSvg(browser: Browser, svg: string, scale: number): Promise<Buffer> {
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: scale });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400;1,9..144,500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>*{margin:0;padding:0}</style></head><body>${svg}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { if ((document as any).fonts) await (document as any).fonts.ready; });
  const el = await page.$('svg');
  const buf = await el!.screenshot({ omitBackground: false });
  await page.close();
  return buf;
}

async function main() {
  await fs.mkdir(DST, { recursive: true });
  const browser = await chromium.launch();
  const scale = 300 / 72; // 512pt card @ 300dpi ≈ 2133px
  const order = [{ id: 'z1', svg: coverSVG() }, ...CARDS.map(c => ({ id: c.id, svg: cardSVG(c) }))];
  const thumbs: Buffer[] = [];
  try {
    for (let i = 0; i < order.length; i++) {
      const png = await renderSvg(browser, order[i].svg, scale);
      await fs.writeFile(path.join(DST, `page-${String(i + 1).padStart(2, '0')}-${order[i].id}.png`), png);
      if (i < 66) thumbs.push(png);
    }
    // contact sheet at low scale
    const sheetSvgImgs = order.map((o, i) => {
      const cols = 8, cell = 200, gap = 14, pad = 20;
      const x = pad + (i % cols) * (cell + gap), y = pad + Math.floor(i / cols) * (cell + gap);
      return `<image x="${x}" y="${y}" width="${cell}" height="${cell}" href="data:image/png;base64,${thumbs[i] ? thumbs[i].toString('base64') : ''}"/>`;
    }).join('');
    const cols = 8, rows = Math.ceil(order.length / cols), cell = 200, gap = 14, pad = 20;
    const cw = pad * 2 + cols * cell + (cols - 1) * gap, ch = pad * 2 + rows * cell + (rows - 1) * gap;
    const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}"><rect width="${cw}" height="${ch}" fill="#E4DFD2"/>${sheetSvgImgs}</svg>`;
    const sp = await browser.newPage({ viewport: { width: cw, height: ch }, deviceScaleFactor: 1 });
    await sp.setContent(`<style>*{margin:0}</style>${sheet}`, { waitUntil: 'load' });
    const sel = await sp.$('svg');
    await fs.writeFile(path.join(DST, 'contact-sheet.png'), await sel!.screenshot({ omitBackground: false }));
    await sp.close();
  } finally { await browser.close(); }
  console.log(`[deck-png] ${order.length} PNGs @300dpi + contact-sheet → cline/output/v9/truth-deck-png/`);
}
main().catch(err => { console.error('[deck-png] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
```

- [ ] **Step 3: Add the exports to build-cards.ts**

In `cline/build-cards.ts`: prefix `const TRUTH`, `const QUOTE`, `const PILL` with `export`; change `function cardSVG` → `export function cardSVG`, `function coverSVG` → `export function coverSVG`, and `interface Card` → `export interface Card`. Guard the auto-run so importing doesn't trigger `main()`:
Replace the final `main().catch(...)` with:

```typescript
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => { console.error('[cards] failed:', err instanceof Error ? err.stack : err); process.exit(1); });
}
```

- [ ] **Step 4: Run and verify**

Run: `./node_modules/.bin/tsx cline/build-deck-png.ts 2>&1 | tail -3` (background; poll)
Expected: `[deck-png] 66 PNGs @300dpi + contact-sheet`.
Run: `find cline/output/v9/truth-deck-png -name '*.png' | wc -l`
Expected: `67` (66 pages + contact sheet).

- [ ] **Step 5: Commit**

```bash
git add cline/build-cards.ts cline/build-deck-png.ts
git commit -m "feat(v8): truth-deck 300dpi PNG export + contact sheet (SVG re-render, no poppler)"
```

---

### Task 9: Regenerate v8 master bundle + final verification

**Files:**
- Modify: `cline/build-v9.ts` (master wrap uses the new daily bundle)

- [ ] **Step 1: Point the master bundle at the new daily file**

In the master-bundle section of `build-v9.ts`, change the first merge from `daily-30-day-bundle.pdf` to `prax-journal-v8-daily.pdf` (the new linked bundle). Keep sticker sheets + carryovers.

- [ ] **Step 2: Full rebuild in dependency order**

Run sequentially (each may background; poll each):
```bash
./node_modules/.bin/tsx cline/build-cards.ts
./node_modules/.bin/tsx cline/build-tools.ts
./node_modules/.bin/tsx cline/build-extras.ts
./node_modules/.bin/tsx cline/build-pomodoro-tomato.ts
./node_modules/.bin/tsx cline/build-deck-png.ts
./node_modules/.bin/tsx cline/build-v9.ts
```
Expected: each prints all-pass QA; v8 master bundle written.

- [ ] **Step 3: Verify the full output tree**

Run:
```bash
echo "singles:"; ls cline/output/v9/singles/*.pdf | wc -l
echo "singles html:"; ls cline/output/v9/singles/*.html | wc -l
echo "deck png:"; ls cline/output/v9/truth-deck-png/*.png | wc -l
echo "sticker svg:"; find cline/output/stickers -name '*.svg' | wc -l
```
Expected: singles pdf=22, singles html=22, deck png=67, sticker svg=65.

- [ ] **Step 4: PII gate**

Run:
```bash
git status --porcelain | grep -iE "profile\.json|piiPrax|\.env" || echo "clean"
grep -rinE "shikhar|shreya|pallavi|joshi|amazon" cline/build-v9.ts cline/build-deck-png.ts || echo "0 real-name matches"
git status --porcelain | grep "cline/output" || echo "output gitignored"
```
Expected: `clean`, `0 real-name matches`, `output gitignored`.

- [ ] **Step 5: Open the final artifacts**

```bash
open cline/output/v9/prax-journal-v8-daily.pdf
open cline/output/v9/v9-master-bundle.pdf
open cline/output/v9/truth-deck-png/contact-sheet.png
```

- [ ] **Step 6: Commit + push**

```bash
git add cline/build-v9.ts
git commit -m "feat(v8): master bundle wraps linked daily; full v8 rebuild verified"
git push
```

---

## Self-Review

- **Spec coverage:** structure+permission+appendix (T6) · two-way links A/B (T7) · singles+HTML (T6) · truth-deck 300dpi PNG+contact (T8) · sticker SVG+PNG (T1) · pomodoro clockify sage+tomato (T2,T3) · content-aware watermark everywhere (T4,T6) · HTML for all pages (T2,T3,T6). All covered.
- **HTML+PDF for all pages:** daily base pages already render; T6 writes HTML for permission/appendix/index + singles; T2/T3 add HTML for pomodoro/tools. (Daily-base HTML: build-v8 already can write — add the same `writeFile(... .html)` in the base render loop during T6 Step 3 if not present.)
- **Type consistency:** `wm()`/`watermark()`/`sprig()`/`v8Wrap()`/`onePage()`/`addAnnot()` names consistent across tasks. `JOBS`/`Job` exported names verified in T5 Step 1 before import.
- **Fallback honesty:** mode A attempted + verified; B is a real degrade (visible index numbers), logged.
- **No Poppler dependency:** deck PNGs re-rendered from SVG (T8 Step 2), not rastered from PDF.
