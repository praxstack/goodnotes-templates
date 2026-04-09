# 📋 GoodNotes Templates — Problem Statement & Requirements

> **Status:** DRAFT — Awaiting review and approval before implementation
> **Based on:** [RESEARCH.md](./RESEARCH.md) deep-dive analysis

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users](#2-target-users)
3. [What We Are Providing](#3-what-we-are-providing)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Out of Scope](#6-out-of-scope)
7. [Success Metrics](#7-success-metrics)
8. [Technical Constraints](#8-technical-constraints)
9. [Risk Analysis](#9-risk-analysis)
10. [Open Questions](#10-open-questions)

---

## 1. Problem Statement

### The Gap in the Market

- **Digital planning is exploding** — GoodNotes alone has 30M+ downloads; the digital planner market on Etsy is a $100M+ annual category
- **Quality templates cost $5–$60** — The average "all-in-one" planner costs $12–$25 on Etsy, and sticker mega packs cost $5–$15
- **No high-quality open-source alternative exists** — Free templates found online are typically:
  - Low quality (poor typography, misaligned grids, no hyperlinks)
  - Limited variety (one-off PDFs, not a comprehensive system)
  - Not programmatically generated (can't customize colors, fonts, year, layout)
  - Not optimized for GoodNotes (wrong dimensions, missing bookmarks, no tab navigation)
- **Commercial templates are static** — Once purchased, users cannot:
  - Change the color theme to match their preference
  - Generate planners for future years without repurchasing
  - Modify layouts (grid density, line spacing, margins)
  - Add or remove sections
- **Creators face a high barrier to entry** — Building quality templates requires:
  - Adobe InDesign or Affinity Publisher ($$$)
  - Manual hyperlink placement (tedious for 300+ page planners)
  - No version control or CI/CD for template assets
  - Repetitive work for each color variant and year update

### Core Problem Statement

> **There is no free, open-source, programmatically reproducible system for generating production-quality digital planning templates, stickers, and page assets that rival commercial offerings on Etsy and the GoodNotes Marketplace — optimized for GoodNotes and compatible with Notability, Noteshelf, and CollaNote.**

---

## 2. Target Users

### Primary Users

| User Segment | Need | How We Serve Them |
|-------------|------|-------------------|
| **Digital planner enthusiasts** | Beautiful, functional templates without paying $15–$30 each | Pre-built ready-to-import PDFs and PNGs in output/ directory |
| **Budget-conscious students** | Academic planners, note templates, study tools | Student-focused templates (Cornell notes, study planners, reading logs) |
| **Customization seekers** | Want to tweak colors, fonts, layouts to their exact preference | CLI with --theme, --font, --year, --gridSpacing flags |
| **Template creators/sellers** | Starting point for building their own template business | Fork the repo, modify themes, sell their own variants (MIT license) |
| **Developers/designers** | Want to understand how digital templates are built programmatically | Thoroughly documented codebase, architecture docs, contribution guide |

### Secondary Users

| User Segment | Need | How We Serve Them |
|-------------|------|-------------------|
| **ADHD/neurodivergent planners** | Simple, low-overwhelm layouts with clear structure | Minimalist templates, habit trackers, priority matrices |
| **Dark mode users** | Eye-friendly templates for nighttime use | Every theme has a dark variant built-in |
| **Non-English planners** | Templates that work with different date/language formats | Configurable locale, Unicode font support |
| **Print planners** | Physical versions of digital templates | 300 DPI output, A4/Letter sizes, print-optimized color |

---

## 3. What We Are Providing

### 3.1 Pre-Built Assets (Ready to Download & Import)

Users who just want templates can download from the `output/` directory:

#### Template PDFs
- [ ] **Daily planners** — Dated (any year) and undated, with time blocking
- [ ] **Weekly planners** — 2-page spread, horizontal and vertical layouts
- [ ] **Monthly planners** — Calendar grid + goals/notes section
- [ ] **Yearly planner/overview** — Year-at-a-glance, annual goals
- [ ] **Gratitude journal** — Daily prompts, 3 gratitudes, reflection
- [ ] **Morning pages journal** — Blank/lined for stream-of-consciousness
- [ ] **Reflection journal** — Weekly/monthly review prompts
- [ ] **Prompted journal** — Rotating creative/self-discovery prompts
- [ ] **Diary pages** — Dated and undated, simple entry format
- [ ] **Habit tracker** — Monthly grid, 30/31-day rows, customizable habits
- [ ] **Mood tracker** — Monthly mood grid with color legend
- [ ] **Fitness log** — Workout tracking, sets/reps/weight
- [ ] **Meal planner** — Weekly meal plan + grocery list
- [ ] **Budget tracker** — Income/expenses, categories, monthly summary
- [ ] **Reading log** — Book list, reviews, reading challenges
- [ ] **Goal-setting worksheet** — SMART goals, milestones, progress
- [ ] **Eisenhower matrix** — Urgent/Important 4-quadrant view
- [ ] **Project planning** — Task breakdown, timeline, milestones
- [ ] **Cornell notes** — Classic note-taking layout with cue/summary
- [ ] **Meeting notes** — Attendees, agenda, action items, decisions
- [ ] **Recipe cards** — Ingredients, instructions, notes
- [ ] **Travel planner** — Itinerary, packing list, budget

#### Simple Page PDFs
- [ ] **Lined pages** — Multiple line spacings (narrow, college, wide)
- [ ] **Grid pages** — Square grid at various densities (5mm, 7mm, 10mm)
- [ ] **Dot grid pages** — Dot spacing variants
- [ ] **Blank pages** — Clean blank with optional subtle border
- [ ] **Isometric grid** — For technical/3D sketching
- [ ] **Music staff paper** — Standard notation lines
- [ ] **Calligraphy guide** — Slant lines with baseline

#### Sticker PNGs (Transparent Background, 300 DPI)
- [ ] **Date tabs** — Jan–Dec, Mon–Sun, 1–31
- [ ] **Month tabs** — Decorative month labels
- [ ] **Priority markers** — P1/P2/P3, High/Medium/Low
- [ ] **Checkboxes** — Empty, checked, partial, crossed
- [ ] **Progress bars** — 0% to 100% in 25% increments
- [ ] **Sticky notes** — Multiple colors, with/without lines
- [ ] **Washi tape strips** — Stripes, dots, grid, solid patterns
- [ ] **Banners & ribbons** — Text containers, decorative headers
- [ ] **Dividers** — Horizontal rules with ornamental touches
- [ ] **Frames & borders** — Photo frames, content containers
- [ ] **Weather icons** — Geometric sun, cloud, rain, snow, storm
- [ ] **Star ratings** — 1–5 stars, filled/empty
- [ ] **Color dots** — Category markers in theme colors
- [ ] **Arrows & pointers** — Directional indicators
- [ ] **Number circles** — 1–31 for date marking

### 3.2 Generation Engine (For Customizers & Developers)

- [ ] **CLI tool** — `npx goodnotes-templates generate` with full configuration
- [ ] **Theme system** — 8+ built-in themes, custom theme support via JSON
- [ ] **Font customization** — Any Google Font via configuration
- [ ] **Dimension control** — A4, Letter, iPad landscape, custom sizes
- [ ] **Year/date configuration** — Generate dated planners for any year
- [ ] **Grid density control** — Adjustable spacing for grids, dots, lines
- [ ] **Batch generation** — Generate all assets in one command
- [ ] **Preview server** — Local web preview of generated templates

### 3.3 Developer Resources

- [ ] **Contribution guide** — How to add new templates, themes, stickers
- [ ] **Architecture documentation** — How the generation pipeline works
- [ ] **Template authoring guide** — Creating new template types from scratch
- [ ] **CI/CD pipeline** — GitHub Actions auto-regenerates on changes

---

## 4. Functional Requirements

### FR-01: Template Generation
- **FR-01.1** — System MUST generate multi-page PDF files with correct dimensions for GoodNotes
- **FR-01.2** — System MUST support A4, US Letter, iPad Landscape, iPad Pro Landscape, iPad Wide paper sizes
- **FR-01.3** — System MUST support both portrait and landscape orientations
- **FR-01.4** — System MUST generate dated planners for any specified year (default: current year)
- **FR-01.5** — System MUST generate undated variants of all planner templates
- **FR-01.6** — System MUST embed fonts in all generated PDFs

### FR-02: Hyperlinked Navigation
- **FR-02.1** — Planner PDFs MUST include hyperlinked tab navigation (monthly tabs, section tabs)
- **FR-02.2** — Tap targets for hyperlinks MUST be minimum 44×44 points (Apple HIG compliance)
- **FR-02.3** — PDFs MUST include bookmark outlines for GoodNotes sidebar navigation
- **FR-02.4** — All internal links MUST use /GoTo page destinations (not named destinations)

### FR-03: Sticker Generation
- **FR-03.1** — System MUST generate individual PNG stickers with transparent backgrounds
- **FR-03.2** — Stickers MUST be output at 300 DPI for Retina display clarity
- **FR-03.3** — System MUST generate sticker sets organized by category
- **FR-03.4** — Sticker dimensions MUST be appropriate for GoodNotes import (not too large, not too small)

### FR-04: Theming System
- **FR-04.1** — System MUST include 8+ built-in color themes (see RESEARCH.md §7)
- **FR-04.2** — Every light theme MUST have a corresponding dark mode variant
- **FR-04.3** — Users MUST be able to define custom themes via JSON configuration
- **FR-04.4** — Theme MUST control: colors, fonts (header/body/accent), border radius, line weights

### FR-05: CLI Interface
- **FR-05.1** — System MUST provide a CLI for generating assets: `generate`, `preview`, `list`
- **FR-05.2** — CLI MUST support filtering by: theme, category, template type, paper size
- **FR-05.3** — CLI MUST support `--dry-run` to list what would be generated without producing files
- **FR-05.4** — CLI MUST show progress indicators during generation
- **FR-05.5** — CLI MUST support `--output` to specify custom output directory

### FR-06: Output Organization
- **FR-06.1** — Generated assets MUST be organized in a clear directory structure:
  ```
  output/
  ├── templates/
  │   ├── planners/
  │   ├── journals/
  │   ├── trackers/
  │   ├── notes/
  │   ├── pages/
  │   └── worksheets/
  ├── stickers/
  │   ├── functional/
  │   ├── decorative/
  │   ├── washi/
  │   ├── sticky-notes/
  │   ├── banners/
  │   └── frames/
  └── previews/
  ```
- **FR-06.2** — Each generated asset MUST have a descriptive filename: `{category}-{type}-{theme}-{size}.pdf`
- **FR-06.3** — System MUST generate preview thumbnails (PNG) for each template

---

## 5. Non-Functional Requirements

### NFR-01: Quality & Compatibility
- **NFR-01.1** — All PDFs MUST open correctly in GoodNotes 5 and GoodNotes 6
- **NFR-01.2** — All PDFs MUST open correctly in Notability, Noteshelf, and CollaNote
- **NFR-01.3** — PDF version MUST be 1.7 for maximum compatibility
- **NFR-01.4** — Color space MUST be sRGB (IEC 61966-2-1)
- **NFR-01.5** — Visual quality MUST rival commercial templates priced at $10–$25

### NFR-02: Performance
- **NFR-02.1** — Single template generation SHOULD complete within 30 seconds
- **NFR-02.2** — Full asset regeneration (all templates + stickers) SHOULD complete within 15 minutes
- **NFR-02.3** — Individual sticker PNG generation SHOULD complete within 2 seconds
- **NFR-02.4** — CLI MUST show generation progress (not appear frozen)

### NFR-03: File Size
- **NFR-03.1** — Simple page PDFs (single page) SHOULD be under 500 KB
- **NFR-03.2** — Full planner PDFs (200+ pages) SHOULD be under 50 MB
- **NFR-03.3** — Individual sticker PNGs SHOULD be under 200 KB each
- **NFR-03.4** — Font subsetting MUST be used to minimize embedded font size

### NFR-04: Usability
- **NFR-04.1** — A non-technical user MUST be able to download pre-built assets from output/ without running any code
- **NFR-04.2** — A technical user MUST be able to generate custom assets with `npm run generate` after cloning
- **NFR-04.3** — CLI help text MUST be clear and include examples
- **NFR-04.4** — Error messages MUST be actionable (tell user what to fix)

### NFR-05: Maintainability
- **NFR-05.1** — Codebase MUST use TypeScript with strict mode
- **NFR-05.2** — All public functions MUST have JSDoc documentation
- **NFR-05.3** — Template definitions MUST be declarative (config objects, not imperative code)
- **NFR-05.4** — Adding a new template type SHOULD require only adding a config file + HTML template
- **NFR-05.5** — Test coverage SHOULD be >70% for core generation logic

### NFR-06: Accessibility
- **NFR-06.1** — All color pairings MUST meet WCAG AA contrast ratio (4.5:1 for text, 3:1 for large text)
- **NFR-06.2** — PDFs SHOULD include basic metadata (title, author, subject) for screen readers
- **NFR-06.3** — Dark mode templates MUST use text colors with sufficient contrast against dark backgrounds

### NFR-07: Licensing & Legal
- **NFR-07.1** — All code MUST be MIT licensed
- **NFR-07.2** — Generated assets MUST be CC BY 4.0 licensed (free to use, modify, share with attribution)
- **NFR-07.3** — All fonts used MUST be open-source (Google Fonts with OFL/Apache license)
- **NFR-07.4** — No copyrighted characters, brand names, or trademarked content

---

## 6. Out of Scope

These items are explicitly NOT part of this project (at least for v1.0):

- ❌ **Web application / SaaS** — No hosted web app; CLI + pre-built files only
- ❌ **Hand-drawn illustrations** — Stickers are geometric/programmatic, not illustrated
- ❌ **GoodNotes Marketplace submission** — We provide files; users submit themselves
- ❌ **Mobile app** — No iOS/Android app
- ❌ **Real-time collaboration** — No shared editing
- ❌ **Custom template designer GUI** — No drag-and-drop editor (future possibility)
- ❌ **Animated stickers** — Static PNGs only
- ❌ **Audio/video content** — Templates and stickers only
- ❌ **Calendar API integration** — No syncing with Google Calendar, Apple Calendar, etc.
- ❌ **Pop culture / licensed characters** — No copyrighted content
- ❌ **Handwriting recognition** — That's GoodNotes' job, not ours
- ❌ **Print-on-demand integration** — We output PDFs; printing is the user's concern

---

## 7. Success Metrics

How we'll measure whether this project achieves its goals:

| Metric | Target | How to Measure |
|--------|--------|---------------|
| GitHub stars | 500+ within 6 months | GitHub API |
| Template quality | Indistinguishable from $10 Etsy templates | User survey / visual comparison |
| Template variety | 20+ template types across 6 categories | Count in output/ |
| Sticker variety | 200+ individual stickers across 6 categories | Count in output/stickers/ |
| Theme variety | 8+ complete themes (light + dark) | Count in src/themes/ |
| Build reliability | 100% of assets generate without errors | CI/CD green builds |
| Community contributions | 10+ external PRs within 6 months | GitHub PR count |
| Documentation quality | New contributor can add a template within 1 hour | User testing |
| Cross-app compatibility | Works in GoodNotes, Notability, Noteshelf, CollaNote | Manual testing matrix |
| File size efficiency | Full planner <50MB, single page <500KB | Automated check |

---

## 8. Technical Constraints

### Must Use
- **Node.js ≥18** — Runtime environment
- **TypeScript** — Type safety across the entire codebase
- **PDF 1.7** — For GoodNotes compatibility
- **sRGB color space** — For consistent color across devices
- **Google Fonts only** — For open-source licensing compliance
- **300 DPI stickers** — For Retina display clarity
- **Transparent PNG** — For sticker backgrounds

### Technology Stack (Chosen based on RESEARCH.md §8 evaluation)
- **Puppeteer** — HTML/CSS → PDF for complex layouts (planners, journals)
- **PDFKit** — Direct PDF construction for simple pages (grids, lines, dots)
- **pdf-lib** — PDF post-processing (add hyperlinks, bookmarks, metadata)
- **SVG.js + svgdom** — Server-side SVG generation for stickers
- **Sharp** — SVG → PNG rasterization at target DPI
- **Commander.js** — CLI framework
- **Handlebars** — HTML template engine
- **Vitest** — Test runner

### Infrastructure
- **GitHub Actions** — CI/CD for asset regeneration
- **GitHub Releases** — Distribute pre-built asset bundles
- **No database** — All configuration is file-based
- **No external APIs at runtime** — Everything generates offline (fonts downloaded once)

---

## 9. Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| GoodNotes changes PDF rendering | Low | High | Test against multiple GoodNotes versions; follow PDF spec strictly |
| Puppeteer breaks font rendering | Medium | Medium | Pin Puppeteer version; fallback to PDFKit for critical templates |
| pdf-lib maintenance stalls permanently | High | Medium | Core usage is minimal (post-processing); can replace with pdfkit |
| Generated templates look "too programmatic" | Medium | High | Invest in typography, spacing, color theory; get designer review |
| File sizes too large for mobile download | Low | Medium | Font subsetting, image compression, lazy page generation |
| Google Fonts CDN unavailable | Low | Low | Download fonts locally; cache in assets/fonts/ |
| Community doesn't adopt the project | Medium | Medium | Build excellent docs, share on Reddit/Twitter, make contribution easy |

---

## 10. Open Questions

> **These need to be decided before or during implementation:**

1. **Should we include a web preview server?** — A localhost Express server that renders template previews in-browser. Nice for development but adds complexity.

2. **Should pre-built assets be committed to the repo?** — Pro: users can download without running code. Con: bloats repo size. Alternative: GitHub Releases for binary assets.

3. **How many pages in a "full year" planner?** — Commercial planners range from 200–400+ pages. We need to decide scope vs. file size tradeoff.

4. **Should we support custom paper sizes via CLI?** — E.g., `--width 800 --height 600`. Adds flexibility but complicates validation.

5. **Should sticker sheets be included alongside individual PNGs?** — Many Etsy sellers provide both individual files AND organized sheets. Is the extra format worth maintaining?

6. **What's the minimum viable set for v1.0?** — Should we launch with all 22+ template types, or start with the top 10 most popular and iterate?

7. **Should we support locale/language configuration?** — Month names, day names, date formats change by locale. Important for international users.

8. **How do we handle the "cover page" design?** — Commercial planners have elaborate covers. Our programmatic covers will be simpler — is that acceptable?

---

## Summary

**In one sentence:** We are building a free, open-source, programmatic template generation system that produces professional-quality digital planning PDFs and stickers — customizable via CLI, extensible via code, and ready to import into GoodNotes and similar apps.

**Key differentiators from commercial alternatives:**
1. Free and open-source (MIT + CC BY 4.0)
2. Infinitely customizable (themes, fonts, sizes, years)
3. Programmatically reproducible (change config → regenerate)
4. Community-driven (anyone can contribute templates)
5. Always current (generate dated planners for any year)
6. Cross-app compatible (GoodNotes, Notability, Noteshelf, CollaNote)

---

*Please review this document and confirm/modify before we proceed with implementation.*
