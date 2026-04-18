# Claims Ledger — doc claims vs code reality (for verification in Phases 5–8)

Each claim has an ID. Phase 5/6/7 will confirm (`✓`), contradict (`✗`), or mark unverifiable (`?`).

| ID | Claim | Source | Verification target | Status |
|---|---|---|---|---|
| C-01 | "8 color themes with font pairings" | README §✨, Roadmap | `src/templates/themes/*.css` (light + dark pairs) | *pending* — 8 themes × 2 modes observed in `ls src/templates/themes/`; partially true — themes live in CSS now, not `themes.ts` |
| C-02 | "PDFKit: lined, grid, dot-grid, blank, isometric, music, calligraphy" | README §Arch | `src/core/pdfkit-renderer.ts` | *likely ✗* — file not found; HLD/LLD describe its deletion |
| C-03 | "15 sticker types × 8 themes = 700+ PNGs" | README §Stickers | `src/core/svg-renderer.ts` STICKER_SIZES + `output/stickers/` | Code exposes 19 keys in STICKER_SIZES (`svg-renderer.ts:44-64`). Count vs "15" to check. |
| C-04 | "All PDFs MUST open correctly in GoodNotes 5/6, Notability, Noteshelf, CollaNote" | PROBLEM_STATEMENT NFR-01.1/.2 | Requires manual testing — not measurable here | Mark `NOT MEASURED — requires physical iPad + app install` |
| C-05 | "PDF version MUST be 1.7" | PROBLEM_STATEMENT NFR-01.3 | Puppeteer default + `pdf-lib` behavior | Check via `pdfinfo`/`pdf-lib` on a generated PDF |
| C-06 | "Color space MUST be sRGB" | PROBLEM_STATEMENT NFR-01.4 | Same as C-05 | Same |
| C-07 | "Full asset regeneration SHOULD complete within 15 minutes" | PROBLEM_STATEMENT NFR-02.2 | Run `npm run generate` | Mark `NOT MEASURED` unless run |
| C-08 | "Node.js ≥18" | README + `engines` | `package.json engines.node=">=18.0.0"` | ✓ |
| C-09 | "CI/CD with GitHub Actions + Releases" | README Roadmap ✅ | `.github/workflows/generate.yml` | ✓ — workflow present; Phase 6 will evaluate whether it is a **gate** or just a **builder** |
| C-10 | "27 tests passing" | CHECKPOINT.md | `tests/unit/*.test.ts` | Likely ✗ — only 3 test files visible. Re-count via `npm test -- --run` in Phase 6 |
| C-11 | "Coverage SHOULD be >70% for core generation logic" | PROBLEM_STATEMENT NFR-05.5 | `npm test -- --coverage` | Measure in Phase 6 |
| C-12 | "All color pairings MUST meet WCAG AA (4.5:1 text, 3:1 large text)" | PROBLEM_STATEMENT NFR-06.1 | Contrast check on 8 themes × light/dark | Measure in Phase 8 |
| C-13 | "Tap targets minimum 44×44pt" | README + PROBLEM_STATEMENT FR-02.2 | `src/core/pdf-postprocess.ts:88` enforces `minSize = 44` | ✓ in code; Phase 5 will verify hyperlinks actually land where expected |
| C-14 | "All public functions MUST have JSDoc" | PROBLEM_STATEMENT NFR-05.2 | `rg '^export (async )?(function|const|class)' src` vs JSDoc prefix | Spot-check in Phase 5 |
| C-15 | "TypeScript strict mode" | PROBLEM_STATEMENT NFR-05.1 | `tsconfig.json` | Check in Phase 5 |
| C-16 | "Every light theme MUST have a corresponding dark mode variant" | PROBLEM_STATEMENT FR-04.2 | `src/templates/themes/` light + dark .css pairs | Check in Phase 5 |
| C-17 | Puppeteer-rendered planners with hyperlinked tabs — "[ ]" unchecked | README Roadmap | `src/core/pdf-postprocess.ts addHyperlinks` + `daily-year-v2.ts` | ✗ for the checkbox — feature DOES ship; roadmap is stale |
| C-18 | "Generated assets MUST be CC BY 4.0" | PROBLEM_STATEMENT NFR-07.2 | `LICENSE` file — single MIT file present; no CC BY 4.0 declaration on assets | Possibly ✗ — Phase 9 doc finding |
| C-19 | "All fonts used MUST be open-source (OFL / Apache)" | PROBLEM_STATEMENT NFR-07.3 | Inspect `<link href="fonts.googleapis.com…">` in templates + `assets/fonts/` | Phase 5 sweep |
| C-20 | "Hyperlinks use /GoTo page destinations" | PROBLEM_STATEMENT FR-02.4 | `src/core/pdf-postprocess.ts:99-108` | ✓ — `S: 'GoTo'`, `D: [pageRef, Fit]` literally |
| C-21 | "PDFs MUST include bookmark outlines" | PROBLEM_STATEMENT FR-02.3 | `src/core/pdf-postprocess.ts addBookmarks` | ✓ — implementation present; Phase 5 to validate for off-by-ones |
| C-22 | "No external APIs at runtime; everything generates offline" | PROBLEM_STATEMENT §8 | Runtime dependency surface | **✗ likely** — `waitUntil: 'networkidle0'` + Google Fonts `<link>` in templates → Puppeteer fetches fonts online. Note as Phase 3/5 finding. |
| C-23 | "840 files (104 PDFs + 736 PNGs) in 9.5 seconds" | CHECKPOINT.md | Runtime measurement | `NOT MEASURED` unless generate is run |
| C-24 | Dark mode templates "MUST use text colors with sufficient contrast" | PROBLEM_STATEMENT NFR-06.3 | WCAG contrast on the 11 `.dark.css` files | Phase 8 |
| C-25 | "Fonts downloaded once" / `assets/fonts/` local cache | PROBLEM_STATEMENT §Risk / §8 | `assets/fonts/` directory listing | Check — dir exists but is empty-looking in FS tree |
