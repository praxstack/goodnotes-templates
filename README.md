<!--
  ╔══════════════════════════════════════════════════════════════════════╗
  ║ goodnotes-templates · root README                                    ║
  ║ Hand-authored — do not regenerate. Inline SVG by design.             ║
  ║ Keep "Future" sections empty-but-present (see AGENTS.md).            ║
  ╚══════════════════════════════════════════════════════════════════════╝
-->

<div align="center">

<!-- Hero · inline SVG, 880×220, SMIL animation for GitHub render -->
<picture>
<source media="(prefers-color-scheme: dark)" srcset="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 880 220'><rect width='880' height='220' fill='%230e0f12'/></svg>">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 220" width="880" height="220" role="img" aria-label="goodnotes-templates hero">
  <defs>
    <linearGradient id="paper" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f3ecdc"/>
      <stop offset="1" stop-color="#e8dec8"/>
    </linearGradient>
    <linearGradient id="sage" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#8a9a7b"/>
      <stop offset="1" stop-color="#5e6f53"/>
    </linearGradient>
    <linearGradient id="clay" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#b87d5a"/>
      <stop offset="1" stop-color="#8a5b42"/>
    </linearGradient>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.4"/>
    </filter>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0 L0 0 0 24" fill="none" stroke="#d8cdb6" stroke-width="0.6"/>
    </pattern>
  </defs>

  <!-- paper -->
  <rect width="880" height="220" fill="url(#paper)"/>
  <rect width="880" height="220" fill="url(#grid)" opacity="0.55"/>

  <!-- three pages fanning out with a gentle bob -->
  <g transform="translate(70 34)" filter="url(#soft)">
    <g transform="rotate(-6 60 80)">
      <rect x="0" y="0" width="120" height="160" rx="3" fill="#fff" stroke="#c9be9d" stroke-width="0.8"/>
      <rect x="12" y="16" width="80" height="6" rx="1" fill="#8a5b42"/>
      <rect x="12" y="30" width="96" height="2" rx="1" fill="#c9be9d"/>
      <rect x="12" y="36" width="60" height="2" rx="1" fill="#c9be9d"/>
      <rect x="12" y="42" width="88" height="2" rx="1" fill="#c9be9d"/>
      <rect x="12" y="54" width="96" height="90" rx="1" fill="none" stroke="#c9be9d" stroke-dasharray="1 2"/>
      <animateTransform attributeName="transform" type="rotate" from="-6 60 80" to="-4 60 80" dur="6s" repeatCount="indefinite" values="-6 60 80;-4 60 80;-6 60 80" keyTimes="0;0.5;1"/>
    </g>
  </g>

  <g transform="translate(160 18)" filter="url(#soft)">
    <rect x="0" y="0" width="120" height="160" rx="3" fill="#fff" stroke="#c9be9d" stroke-width="0.8"/>
    <rect x="12" y="16" width="50" height="6" rx="1" fill="#5e6f53"/>
    <circle cx="100" cy="20" r="6" fill="url(#sage)"/>
    <rect x="12" y="32" width="96" height="2" rx="1" fill="#c9be9d"/>
    <rect x="12" y="38" width="72" height="2" rx="1" fill="#c9be9d"/>
    <rect x="12" y="50" width="96" height="90" rx="1" fill="none" stroke="#c9be9d"/>
    <rect x="16" y="56" width="40" height="8" rx="1" fill="#e8dec8"/>
    <rect x="16" y="70" width="64" height="8" rx="1" fill="#e8dec8"/>
    <rect x="16" y="84" width="32" height="8" rx="1" fill="#e8dec8"/>
    <animateTransform attributeName="transform" type="translate" from="160 18" to="160 14" dur="4s" repeatCount="indefinite" values="160 18;160 14;160 18" keyTimes="0;0.5;1"/>
  </g>

  <g transform="translate(250 34)" filter="url(#soft)">
    <g transform="rotate(5 60 80)">
      <rect x="0" y="0" width="120" height="160" rx="3" fill="#fff" stroke="#c9be9d" stroke-width="0.8"/>
      <rect x="12" y="16" width="70" height="6" rx="1" fill="#8a5b42"/>
      <rect x="12" y="30" width="96" height="2" rx="1" fill="#c9be9d"/>
      <rect x="12" y="36" width="48" height="2" rx="1" fill="#c9be9d"/>
      <g transform="translate(12 52)">
        <rect width="12" height="12" rx="1" fill="none" stroke="#8a9a7b" stroke-width="1.2"/>
        <path d="M2 6 L5 9 L10 3" fill="none" stroke="#8a9a7b" stroke-width="1.6" stroke-linecap="round"/>
        <rect x="18" y="3" width="40" height="6" rx="1" fill="#c9be9d"/>
      </g>
      <g transform="translate(12 68)">
        <rect width="12" height="12" rx="1" fill="none" stroke="#8a9a7b" stroke-width="1.2"/>
        <rect x="18" y="3" width="32" height="6" rx="1" fill="#c9be9d"/>
      </g>
      <animateTransform attributeName="transform" type="rotate" from="5 60 80" to="7 60 80" dur="6s" repeatCount="indefinite" values="5 60 80;7 60 80;5 60 80" keyTimes="0;0.5;1"/>
    </g>
  </g>

  <!-- wordmark -->
  <g transform="translate(420 60)" font-family="Georgia, 'Times New Roman', serif" fill="#1b1815">
    <text font-size="44" font-weight="400" letter-spacing="-0.5">goodnotes</text>
    <text y="46" font-size="44" font-weight="400" letter-spacing="-0.5" font-style="italic">templates</text>
    <text y="76" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#6b5d3f" letter-spacing="0.12em">PROGRAMMATIC · SELF-CONTAINED · GOODNOTES-READY</text>
    <g transform="translate(0 96)">
      <rect width="18" height="18" rx="2" fill="url(#sage)"/>
      <rect x="26" width="18" height="18" rx="2" fill="url(#clay)"/>
      <rect x="52" width="18" height="18" rx="2" fill="#d4a656"/>
      <rect x="78" width="18" height="18" rx="2" fill="#b7a3c7"/>
      <text x="108" y="14" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#6b5d3f">sage · clay · amber · lavender</text>
    </g>
  </g>

  <!-- three-dot pulse -->
  <g transform="translate(825 192)">
    <circle r="3" fill="#8a9a7b">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="12" r="3" fill="#b87d5a">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" begin="0.3s" repeatCount="indefinite"/>
    </circle>
    <circle cx="24" r="3" fill="#d4a656">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="1.8s" begin="0.6s" repeatCount="indefinite"/>
    </circle>
  </g>
</svg>
</picture>

# goodnotes-templates

**Programmatically generated, self-contained digital planning templates, stickers, and multi-page journals for GoodNotes, Notability, Noteshelf, and CollaNote.**

[![License: MIT](https://img.shields.io/badge/code-MIT-1b1815?style=flat-square)](LICENSE)
[![License: CC BY 4.0](https://img.shields.io/badge/assets-CC%20BY%204.0-8a9a7b?style=flat-square)](LICENSE)
[![Node.js ≥ 18](https://img.shields.io/badge/node-%E2%89%A518-b87d5a?style=flat-square)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-d4a656?style=flat-square)](tsconfig.json)
[![Live gallery](https://img.shields.io/badge/gallery-pretext--templates.vercel.app-7c3aed?style=flat-square)](https://pretext-templates.vercel.app)
[![npm: cli](https://img.shields.io/npm/v/%40praxlannister%2Fpretext-cli?label=npm%20%7C%20cli&style=flat-square&color=8a9a7b)](https://www.npmjs.com/package/@praxlannister/pretext-cli)
[![npm: core](https://img.shields.io/npm/v/%40praxlannister%2Fpretext-core?label=npm%20%7C%20core&style=flat-square&color=b87d5a)](https://www.npmjs.com/package/@praxlannister/pretext-core)

One repo. One generator. Two shippable surfaces:

1. A **pack library** — 26 GoodNotes-ready HTML templates across journals, planners, trackers, notes, and worksheets.
2. **The Praxis Ledger** — a monthly release of a personal ADHD + depression journal (bookmarked PDF · standalone HTML · 60-sticker pack · fonts + CSS + source templates), assembled in one command.

</div>

---

## Why this exists

Most digital planning templates are Photoshop files that look identical to the 400 others on Etsy. **This repo treats templates as code:** each one is a self-contained HTML file, rendered through a single Puppeteer pipeline, post-processed by `pdf-lib` for bookmarks and hyperlinks, and shippable alongside a matching sticker pack.

If you ever want to generate a year of planners in every locale, swap the base font across 32 templates, or ship a monthly release with a matching SVG sticker set, you want code. Not Photoshop.

---

## Repo at a glance

```
goodnotes-templates/
├── AGENTS.md                  ← read first if you're an AI agent
├── CLAUDE.md                  ← local project context
├── packs/                     ← 26 shippable templates (journals · planners · trackers · notes · worksheets)
│   ├── journals/prax-journal/ ← The Praxis Ledger — v5 daily/midday/reflect/brain-dump + weekly/monthly/quarterly
│   │   ├── versions/v5/       ← 8 source HTML templates (fonts base64-inlined)
│   │   └── stickers/          ← 60 skeuomorphic stickers (4 archetypes × 3 sizes × 4 accents)
│   └── …                      ← gratitude · morning-pages · cornell · eisenhower · frog · habit · mood · …
├── shared/
│   ├── fonts/                 ← Fraunces · Instrument Sans · JetBrains Mono
│   ├── themes/                ← 14 light + dark CSS swaps
│   └── base.css               ← shared tokens
├── src/
│   ├── core/                  ← puppeteer-renderer · pdf-postprocess · pdf-splice · png-renderer · sticker-renderer · prax-journal-renderer
│   ├── cli/                   ← Commander.js CLI (render, list, preview)
│   └── types/                 ← profile schema (Zod)
├── scripts/                   ← generators + release builders (see table below)
├── tests/                     ← unit + visual (sharp pixel-diff, 0.5% drift budget)
└── docs/                      ← CEO / eng / design review records · HLD / LLD · plan-*
```

---

## Pipeline · daily → weekly → monthly → release

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 180" width="100%" role="img" aria-label="generation pipeline">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#6b5d3f"/>
    </marker>
  </defs>
  <rect width="880" height="180" fill="#f8f3e6"/>
  <!-- step boxes -->
  <g font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#1b1815">
    <g transform="translate(30 40)">
      <rect width="150" height="96" rx="4" fill="#fff" stroke="#8a9a7b" stroke-width="1.5"/>
      <text x="12" y="22" font-weight="700" fill="#5e6f53">1 · SOURCE HTML</text>
      <text x="12" y="42">today.html</text>
      <text x="12" y="56">midday.html</text>
      <text x="12" y="70">reflect.html</text>
      <text x="12" y="84">brain-dump.html …</text>
    </g>
    <g transform="translate(210 40)">
      <rect width="150" height="96" rx="4" fill="#fff" stroke="#b87d5a" stroke-width="1.5"/>
      <text x="12" y="22" font-weight="700" fill="#8a5b42">2 · SPLICE</text>
      <text x="12" y="42">buildPageSequence</text>
      <text x="12" y="56">{from, to}</text>
      <text x="12" y="72">→ 37 PageSpec[]</text>
      <text x="12" y="86">(daily × 31 + reviews)</text>
    </g>
    <g transform="translate(390 40)">
      <rect width="150" height="96" rx="4" fill="#fff" stroke="#d4a656" stroke-width="1.5"/>
      <text x="12" y="22" font-weight="700" fill="#8a6a1e">3 · RENDER</text>
      <text x="12" y="42">substituteProfile</text>
      <text x="12" y="56">DR_* · RX_* · DAY_*</text>
      <text x="12" y="72">Puppeteer → PDF</text>
      <text x="12" y="86">pdf-lib bookmarks</text>
    </g>
    <g transform="translate(570 40)">
      <rect width="150" height="96" rx="4" fill="#fff" stroke="#8a9a7b" stroke-width="1.5"/>
      <text x="12" y="22" font-weight="700" fill="#5e6f53">4 · BUNDLE</text>
      <text x="12" y="42">bundle-release.ts</text>
      <text x="12" y="56">pdf + html + fonts</text>
      <text x="12" y="72">+ css + templates</text>
      <text x="12" y="86">+ 60-sticker pack</text>
    </g>
    <g transform="translate(750 40)">
      <rect width="110" height="96" rx="4" fill="#fff" stroke="#1b1815" stroke-width="1.5"/>
      <text x="12" y="22" font-weight="700">5 · SHIP</text>
      <text x="12" y="42">AirDrop</text>
      <text x="12" y="56">GoodNotes</text>
      <text x="12" y="72">drag-drop</text>
      <text x="12" y="86">stickers</text>
    </g>
  </g>
  <!-- arrows with flowing dash animation -->
  <g stroke="#6b5d3f" stroke-width="1.5" fill="none" marker-end="url(#arrow)">
    <path d="M180 88 L210 88" stroke-dasharray="4 3">
      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.2s" repeatCount="indefinite"/>
    </path>
    <path d="M360 88 L390 88" stroke-dasharray="4 3">
      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.2s" repeatCount="indefinite" begin="0.2s"/>
    </path>
    <path d="M540 88 L570 88" stroke-dasharray="4 3">
      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.2s" repeatCount="indefinite" begin="0.4s"/>
    </path>
    <path d="M720 88 L750 88" stroke-dasharray="4 3">
      <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
    </path>
  </g>
</svg>
</div>

Every step is pure, idempotent, and commit-safe. The same range + profile always yields the same PDF.

---

## Quick start

```bash
# Clone & install
git clone https://github.com/praxstack/goodnotes-templates.git
cd goodnotes-templates
npm install

# 1 · Render any single pack to PDF
npx tsx src/cli/index.ts render packs/worksheets/eat-the-frog/eat-the-frog.html \
  -o output/frog.pdf

# 2 · Build a month of The Praxis Ledger (PDF)
npx tsx scripts/generate-journal.ts \
  --from 2026-06-01 --to 2026-06-30 \
  --out output/journal-jun-2026.pdf

# 3 · Assemble the full monthly release bundle
npx tsx scripts/bundle-release.ts \
  --pdf output/journal-jun-2026.pdf \
  --month "June 2026" \
  --from 2026-06-01 --to 2026-06-30
# → output/The Praxis Ledger — June 2026/  (PDF + HTML + fonts + CSS + source templates + 60 stickers)
```

---

## Feature matrix

| What | Where | How many |
|---|---|---|
| **Journals** | `packs/journals/` | 5 packs (Prax Journal v5 + gratitude, morning pages, prompted, reflection) |
| **Planners** | `packs/planners/` | weekly · monthly · yearly |
| **Trackers** | `packs/trackers/` | habit · mood · budget · fitness · reading |
| **Notes** | `packs/notes/` | Cornell · meeting |
| **Worksheets** | `packs/worksheets/` | eat-the-frog · eisenhower · goal-setting · meal-planning · project-planning · recipe-card · travel-planner |
| **Prax Journal stickers** | `packs/journals/prax-journal/stickers/` | 60 skeuomorphic (field-note · ledger · herbarium · clinic) |
| **Themes** | `shared/themes/` | 14 light + dark pairs |
| **Fonts** | `shared/fonts/` | Fraunces · Instrument Sans · JetBrains Mono (self-hosted + base64-inlined) |
| **Locales** | `src/utils/locale.ts` | en · es · fr · de · ja · ko |

---

## Engineering invariants

- **Self-contained templates.** Every HTML in `packs/**/*.html` owns its colors, fonts, and layout. The renderer is a transparent pass-through. No theme injection.
- **A4-first geometry.** Every template is designed at 210mm × 297mm @ 96dpi = 794×1123 px. Visual tests hold a 0.5% drift budget against baseline screenshots.
- **Network-blocked rendering.** Puppeteer intercepts every outbound request and only allows `data:`, `file:`, `fonts.googleapis.com`, and `fonts.gstatic.com` (FIND-0004 / CWE-918).
- **Sandbox-respecting.** Chromium `--no-sandbox` is gated to CI / Docker / GitHub Actions only. Developer machines use the native sandbox.
- **Signed releases.** Release artifacts are signed with `sigstore/cosign` keyless OIDC. Verify with `cosign verify-blob`.
- **Type-safe profile data.** `src/types/profile.ts` exports a Zod schema. `substituteProfile` only writes whitelisted placeholders (`DR_*`, `RX_*_*`, `DAY_*`).
- **PII never in repo.** `profile.json` is gitignored. Only `profile.example.json` ships.

---

## The Praxis Ledger · monthly release

<div align="center">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 200" width="100%" role="img" aria-label="praxis ledger assets">
  <rect width="880" height="200" fill="#faf6ec"/>
  <g font-family="Georgia,serif" font-size="12" fill="#1b1815">
    <!-- PDF -->
    <g transform="translate(40 30)">
      <rect width="130" height="140" rx="3" fill="#fff" stroke="#1b1815" stroke-width="1.2"/>
      <rect x="108" y="0" width="22" height="22" fill="#1b1815"/>
      <polygon points="108,0 130,0 130,22" fill="#fff"/>
      <text x="10" y="22" font-weight="700">PDF</text>
      <text x="10" y="40" font-size="10" fill="#6b5d3f">135 pp</text>
      <text x="10" y="54" font-size="10" fill="#6b5d3f">39 bookmarks</text>
      <rect x="10" y="68" width="110" height="2" fill="#c9be9d"/>
      <rect x="10" y="76" width="96" height="2" fill="#c9be9d"/>
      <rect x="10" y="84" width="80" height="2" fill="#c9be9d"/>
      <rect x="10" y="92" width="110" height="2" fill="#c9be9d"/>
      <text x="10" y="130" font-family="ui-monospace,Menlo,monospace" font-size="9" fill="#8a5b42">54 MB</text>
    </g>
    <!-- HTML -->
    <g transform="translate(200 30)">
      <rect width="130" height="140" rx="3" fill="#fff" stroke="#8a9a7b" stroke-width="1.2"/>
      <text x="10" y="22" font-weight="700" fill="#5e6f53">HTML</text>
      <text x="10" y="40" font-size="10" fill="#6b5d3f">135 pp · framed</text>
      <text x="10" y="54" font-size="10" fill="#6b5d3f">base64 fonts</text>
      <g transform="translate(10 70)">
        <rect width="42" height="54" rx="1" fill="#faf6ec" stroke="#c9be9d"/>
        <rect x="46" width="42" height="54" rx="1" fill="#faf6ec" stroke="#c9be9d"/>
        <rect x="92" width="20" height="54" rx="1" fill="#faf6ec" stroke="#c9be9d"/>
      </g>
      <text x="10" y="138" font-family="ui-monospace,Menlo,monospace" font-size="9" fill="#5e6f53">1.5 MB · dedupe</text>
    </g>
    <!-- stickers -->
    <g transform="translate(360 30)">
      <rect width="200" height="140" rx="3" fill="#fff" stroke="#b87d5a" stroke-width="1.2"/>
      <text x="10" y="22" font-weight="700" fill="#8a5b42">STICKER PACK</text>
      <text x="10" y="38" font-size="10" fill="#6b5d3f">60 PNG + 60 SVG</text>
      <g transform="translate(10 48)">
        <rect width="28" height="30" rx="2" fill="#e8dec8" stroke="#8a9a7b"/>
        <rect x="34" width="28" height="30" rx="2" fill="#e8dec8" stroke="#b87d5a"/>
        <rect x="68" width="28" height="30" rx="2" fill="#e8dec8" stroke="#d4a656"/>
        <rect x="102" width="28" height="30" rx="2" fill="#e8dec8" stroke="#b7a3c7"/>
        <rect x="136" width="28" height="30" rx="2" fill="#e8dec8" stroke="#8a9a7b"/>
        <rect x="0" y="36" width="28" height="30" rx="2" fill="#e8dec8" stroke="#b87d5a"/>
        <rect x="34" y="36" width="28" height="30" rx="2" fill="#e8dec8" stroke="#d4a656"/>
        <rect x="68" y="36" width="28" height="30" rx="2" fill="#e8dec8" stroke="#b7a3c7"/>
        <rect x="102" y="36" width="28" height="30" rx="2" fill="#e8dec8" stroke="#8a9a7b"/>
        <rect x="136" y="36" width="28" height="30" rx="2" fill="#e8dec8" stroke="#b87d5a"/>
      </g>
      <text x="10" y="128" font-family="ui-monospace,Menlo,monospace" font-size="9" fill="#8a5b42">4 archetypes · 3 sizes · 4 accents</text>
    </g>
    <!-- assets -->
    <g transform="translate(590 30)">
      <rect width="260" height="140" rx="3" fill="#fff" stroke="#d4a656" stroke-width="1.2"/>
      <text x="10" y="22" font-weight="700" fill="#8a6a1e">ASSETS</text>
      <text x="10" y="44" font-size="11">• fonts/      ← Fraunces · Instrument Sans · JetBrains Mono</text>
      <text x="10" y="64" font-size="11">• css/        ← base.css + 14 themes (light + dark pairs)</text>
      <text x="10" y="84" font-size="11">• source-html/ ← 7 v5 templates + design-system.html</text>
      <text x="10" y="114" font-size="10" fill="#6b5d3f">Real copies — no symlinks.</text>
      <text x="10" y="128" font-size="10" fill="#6b5d3f">Zips, AirDrops, drags into GoodNotes.</text>
    </g>
  </g>
</svg>
</div>

Deep-dive: [`packs/journals/prax-journal/README.md`](packs/journals/prax-journal/README.md)

---

## Verified compatibility

| Spec | Value |
|---|---|
| PDF Version | 1.7 |
| Color Space | sRGB |
| Font Embedding | Full subset embedding |
| Hyperlinks | `/GoTo` page destinations |
| Bookmarks | PDF outline tree |
| Tap targets | ≥ 44×44 pt (Apple HIG) |
| Paper sizes | A4, US Letter, iPad, iPad Pro, iPad Wide |
| Sticker DPI | 300 (Retina-quality) |
| Sticker format | PNG with alpha · sRGB · compression 6 |
| Tested on | GoodNotes 6 · Notability · Noteshelf · CollaNote |

---

## Testing & gates

```bash
npm test                           # vitest unit + property tests
npm run test:visual                # sharp pixel-diff against baselines (0.5% drift)
npx tsc --noEmit                   # type-check everything
npx eslint src/                    # 0 errors, 0 warnings
```

CI runs on every PR. Monthly audit probe (`.github/workflows/audit.yml`) re-runs npm-audit + license-checker + gitleaks + semgrep on the 1st of each month.

---

## Scripts you will actually use

| Script | Purpose |
|---|---|
| `src/cli/index.ts` | General-purpose CLI — `render <html> -o <pdf>`, `list`, `preview` |
| `scripts/generate-journal.ts` | Render a date range of Prax Journal to a bookmarked PDF |
| `scripts/build-standalone-html.ts` | Stitch a month into one self-contained HTML (135 pp typically ≤ 2 MB) |
| `scripts/bundle-release.ts` | Assemble `output/The Praxis Ledger — <Month YYYY>/` (PDF + HTML + fonts + CSS + source templates + 60 stickers) |
| `scripts/build-stickers.ts` | Render all 60 skeuomorphic stickers from SVG source |
| `scripts/rebuild-all-stickers-index.ts` | Gallery `output/all-stickers/` classifies PNGs by dimension (real copies, not symlinks) |
| `scripts/download-fonts.ts` | Offline-font bootstrap into `assets/fonts/` |
| `scripts/inline-v5-fonts.ts` | Base64-inline font files into every v5 template's `@font-face` |
| `scripts/audit.sh` | Re-run the CODEX-AUDIT tool surface (tokei, npm-audit, gitleaks, semgrep) |

---

## Documentation ladder

| Doc | What you get |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Four Karpathy-derived coding principles for any AI agent |
| [`CLAUDE.md`](CLAUDE.md) | Local project context · render pipeline · gstack `browse` cheat sheet |
| [`CHANGELOG.md`](CHANGELOG.md) | Every change that landed, with Keep-a-Changelog discipline |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to add themes, page types, or sticker types |
| [`RESEARCH.md`](RESEARCH.md) | Market analysis · Etsy/GoodNotes ecosystem · iPad specs · typography |
| [`PROBLEM_STATEMENT.md`](PROBLEM_STATEMENT.md) | Functional/non-functional requirements, target users |
| [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) | License matrix for every transitive dep |
| `packs/<category>/README.md` | Category overview |
| `packs/<category>/<pack>/README.md` | Per-pack spec, render instructions, compatibility notes |
| `docs/plan-*.md` | CEO / eng / design review records (never deleted) |
| `docs/HLD-*.md`, `docs/LLD-*.md` | High-level & low-level design |

---

## Credits

Built with TypeScript, Puppeteer, pdf-lib, Sharp, Zod, Vitest.
Inspired by the digital planning community on r/GoodNotes and r/digitalplanning, by Andrej Karpathy's thinking on LLM coding pitfalls (see `AGENTS.md`), and by the analog editorial tradition that treats paper as a first-class medium.

---

## Future

<!--
  Deliberately empty for now. Roadmap planning happens in docs/plan-* files.
  Add items here only after they're scheduled, not aspirational.
  See AGENTS.md · Simplicity First.
-->

_Not planning too far ahead. Roadmap lives in `docs/plan-*.md` when items are actually scheduled._

---

## License

- **Code:** [MIT](LICENSE)
- **Generated assets:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- **Fonts:** OFL / Apache 2.0 (Google Fonts)
