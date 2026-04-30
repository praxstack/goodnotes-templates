# Prax Journal — Sticker Backlog

Living inventory of stickers for the Prax Journal pack. **Fluid.** Add freely, delete freely, reorder freely. This README is the single source of truth for what exists, what's next, and what got cut.

## Conventions

- Each sticker lives in its own subdirectory: `stickers/<kebab-name>/`
- At minimum the dir contains `<kebab-name>.svg` (the source)
- The renderer (`scripts/render-stickers.ts`, built in Phase 2) emits:
  - `<kebab-name>.svg` (GoodNotes-importable vector)
  - `<kebab-name>-300.png` (compact)
  - `<kebab-name>-600.png` (standard)
  - `<kebab-name>-1200.png` (retina / large)
- A sticker that **captures measurable data** (tap-count, scale 1-5, mood dot, etc.) MUST include a `README.md` documenting the data spec so the month-end aggregator knows how to count it.
- Visual grammar matches v5 daily templates: cream `#F9F5EC` background, hand-drawn stroke `1.5-1.8pt`, sage/clay/amber/lavender accents.

### Size classes

| Class | Canvas (px) | Use case |
|-------|-------------|----------|
| Compact | 400 × 600 | quick tap-stamps, mood dots, small checkboxes |
| Standard | 600 × 600 | most functional stickers (single practice card) |
| Expanded | 800 × 600 | multi-field worksheets (Thought Flip, Friend Letter) |

### Data spec format (per-sticker `README.md`)

```markdown
# <Sticker Name>

**Kind:** data-capturing | decorative
**Captures:** (describe what the user writes/fills/taps)
**Aggregation rule (month-end):** (what the AI counts when reading the filled PDF)
**Size class:** compact | standard | expanded
**Primary accent:** sage | clay | amber | lavender
```

---

## Shipped (v5.3 C5 · all 12 stickers)

| # | Sticker | Kind | Source | Status | Size | Accent |
|---|---|---|---|---|---|---|
| 1 | **mood-dot** | data-capturing | 1-10 mood dot + one word + why | **shipped** | compact | lavender |
| 2 | **thought-flip** | data-capturing | CBT 3-col pattern (Reflect) | **shipped** | expanded | clay |
| 3 | **wins-jar** | data-capturing | 10-slot cumulative wins + hand-drawn jar | **shipped** | expanded | amber |
| 4 | **friend-letter** | data-capturing | Neff self-compassion rewrite (Dear __ + 6 lines) | **shipped** | expanded | sage |
| 5 | **if-then-plan** | data-capturing | Gollwitzer implementation intentions | **shipped** | standard | sage |
| 6 | **craving-surf** | data-capturing | Marlatt urge-surfing worksheet | **shipped** | standard | lavender |
| 7 | **three-good-things** | data-capturing | Seligman positive-psychology triple | **shipped** | standard | amber |
| 8 | **named-patterns** | data-capturing | 5 patterns × 5 tick boxes | **shipped** | standard | clay |
| 9 | **shame-baggage** | data-capturing | therapist note · notice, don't force | **shipped** | standard | clay |
| 10 | **grateful-for** | data-capturing | 1 primary + 2 dotted lines | **shipped** | compact | amber |
| 11 | **win-today** | data-capturing | single checkbox + one thing | **shipped** | compact | sage |
| 12 | **phq2-lite** | data-capturing | 2-question weekly depression screen | **shipped** | compact | lavender |

All 12 shipped at @4× native PNG resolution (compact 1600×2400 ≈ 2.9 MB, standard 2400×2400 ≈ 4.2 MB, expanded 3200×2400 ≈ 5.5 MB). SVG source files are ~325 KB each (of which 319 KB is base64 fonts; ~10 KB is actual geometry).

**Legend:** *backlog* = planned · **shipped** = SVG + PNG live in this folder · *cut* = decided against · *parked* = on-hold for later iteration

## Pipeline provenance

Base64 Fraunces pipeline was de-risked first via `scripts/probe-sharp-fraunces.ts` — confirmed librsvg (inside sharp) honors `@font-face` with `data:font/woff2` URIs. `src/core/sticker-renderer.ts` provides the shared `fontsDefs()` / `SIZE_CLASSES` / `PALETTE` / `rasterize()` primitives. Individual sticker authors (`scripts/build-*.ts`) call into this.

Pipeline details live in `packages/packs-prax-journal/stickers/mood-dot/README.md` (the canary).

---

## Parked / candidates (not scheduled)

| Sticker | Why parked | Could revisit |
|---|---|---|
| **crisis-card** | Single-page panic-moment mini-sticker (2s pause + next action) | If Prax flags urgent need |
| **sleep-quality** | 4-emoji scale + bed/wake times | After month-1 if sleep becomes a focus |
| **medication-taken** | Daily tick for each med in profile.meds | If Rx adherence becomes an issue |
| **exercise-log** | 3-row: morning/afternoon/evening movement | If fitness becomes a goal |
| **panic-severity** | 1-5 scale when attack logged | Only if attacks are a tracked metric |

---

## Cut (decided against)

*(empty — nothing cut yet)*

---

## How to add a sticker

1. Create a `scripts/build-<kebab-name>.ts` (copy `build-mood-dot.ts` as a template — simpler — or add a block in `scripts/build-stickers-remaining.ts` if your sticker fits the helper shell).
2. Run `npx tsx scripts/build-<kebab-name>.ts` to generate `stickers/<kebab-name>/<kebab-name>.{svg,png}`.
3. Add a `stickers/<kebab-name>/README.md` with the data spec (Kind / Captures / Aggregation / Size / Accent).
4. Add a row to the "Shipped" table above with status **shipped**.

## How to remove a sticker

1. Move its row from **Shipped** to **Cut** with a one-line reason
2. Delete its directory OR keep SVG for archive — the renderer only processes Shipped-listed entries

---

*Last updated:* 2026-04-29 · C5 shipped all 12 stickers + the base64-Fraunces pipeline.
