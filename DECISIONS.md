# DECISIONS · pretext-templates sprint log

> Per `<autonomous-run>` §ambiguity-protocol — every non-trivial decision
> made during autonomous execution is logged here with rationale. Older
> decisions live in the commit messages + planning artefacts under
> `~/.gstack/projects/goodnotes-templates/`; this file is the durable
> index.

---

## Sprint decisions (W1 → W14-extras)

### Repo + architecture

| # | Decision | Rationale | Commit |
|---|---|---|---|
| 1 | `.clineignore` expanded (~80% tree drop per turn) | Root-cause fix for context saturation | Session start |
| 2 | Monorepo · npm workspaces · `packages/{core,cli}` + `apps/gallery` | Eng-review F1.1 · big-bang W1 per D6 | `1a359d7` |
| 3 | TS composite refs (`tsc -b`) | Faster rebuilds on solo dev | `1a359d7` |
| 4 | `@pretext-templates/*` rebrand | CEO-plan scope expansion | `1a359d7` |
| 5 | Zod `.strict()` on every schema | Typo protection · mirrors profile.ts | W2 `002a2be` |
| 6 | Flat `packages/packs-<id>/` layout (not `packs/<category>/<id>/`) | URL stability · filesystem glob clarity | W5 `dcf13a7` |
| 7 | 22 packs migrated (plan said 7) | Repo reality · user directive for full scope | W5 `dcf13a7` |

### Gallery

| # | Decision | Rationale | Commit |
|---|---|---|---|
| 8 | Astro 6.2.1 (not 5.x) | Latest stable at W4; Content Layer API | W4 `a7748f5` |
| 9 | Home + /browse + /packs/[id] routes only in W4 | Simplicity-first · other routes per week | W4 `a7748f5` |
| 10 | Production fonts cut 6 → 3 (Fraunces + JetBrains Mono + Caveat) | D-1 polish · LCP cost | W6 `388e230` |
| 11 | 48 px touch-target applies to `.touch-target` class, not every `<a>` | A11Y-3 targets primary interactions, not inline text-flow links | W6 `9d4d04f` |

### Theme swap (W7 + W8)

| # | Decision | Rationale | Commit |
|---|---|---|---|
| 12 | 7 light themes only (not 14) | Dark variants deferred to W9 browser-PDF | W7 `e26442a` |
| 13 | Build-time palette extraction (Option A) | `:root` in core themes would repaint gallery chrome (decision #13 below enforced) | W7 `e26442a` |
| 14 | `data-theme-target` wrapper · scoped `--theme-*` vars | Gallery chrome stays warm-analog per design-review decision 13 | W7 `e26442a` |
| 15 | `?theme=<id>` + `replaceState` (not pushState) | Back-button shouldn't cycle theme picks — treat as filter | W8 `3ef864f` |
| 16 | Paint/apply path split · load-from-URL never focuses | Decision #4 · click-to-select only | W8 `3ef864f` |
| 17 | Unknown `?theme=<id>` scrubbed from URL on load | Share-link hygiene | W8 `827deac` |

### Search (W8)

| # | Decision | Rationale | Commit |
|---|---|---|---|
| 18 | Client-side filter · no `fuse.js`/`minisearch` | 22 rows · O(n) substring beats index build | W8 `3ef864f` |
| 19 | Multi-token AND semantics | Matches D-11's "fuzzy" intent without scoring complexity | W8 `3ef864f` |
| 20 | `?q=` capped at 200 chars | Defend shared links against URL length limits | W8 `827deac` |

### OG cards (W10)

| # | Decision | Rationale | Commit |
|---|---|---|---|
| 21 | 22 × 7 = 154 cards + 1 default (not plan's stale 7 × 8 = 56) | Reality-aligned · user directive · under CI budget | W10 `61cb734` |
| 22 | SVG template → sharp PNG (not Puppeteer) | 8× faster · deterministic · no browser roundtrip | W10 `61cb734` |
| 23 | Identity-only cards (no specimen thumb) | Decouple rebuild from pack-HTML churn | W10 `61cb734` |
| 24 | Default OG theme per pack = `bold-tech` | Simplicity · could be URL-driven in a later pass | W10 `61cb734` |

### Tests

| # | Decision | Rationale | Commit |
|---|---|---|---|
| 25 | Playwright pulled forward from W14 to W7.5 | Close "zero browser has ever opened this" gap before more W-weeks ship | W7.5 `ccd7a38` |
| 26 | Dual project · Desktop Chrome + iPhone 13 | Lightweight enough for per-commit run · covers D-12 responsive | W7.5 `ccd7a38` |
| 27 | Mobile clipboard test skipped | Playwright iPhone Chromium rejects `clipboard-write` permission | W14 `96c6029` |

---

## Active blockers

| Block | Who decides | Impact if ignored |
|---|---|---|
| Safari iPad probe (D7) | Operator on physical device | W9 E3 browser-PDF ships blind; F2 rescue (CF Workers) burns slack |
| Semver schema-version bump (W11) | llm-council-plus ideally | Registry v1 consumers break if we bump without deprecation window |

---

## Unblocked items in the queue

- W13 MIGRATION.md (needs registry domain live)
- W15 Docker integration (user declined this turn)
- D-13 mobile `<select>` fallback for theme swap (only if radiogroup fails on <375 px)
- Mobile iOS clipboard test (physical device)

---

## How to read this file

Each row references a commit; the commit body has full technical detail.
Rows are appended, never rewritten. If a decision is reversed, a new
entry is added with a link back to the superseded row.
