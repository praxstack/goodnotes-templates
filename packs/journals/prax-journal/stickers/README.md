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

## Shipped (v5.2 · Iteration-1 target · 12 stickers)

| # | Sticker | Kind | Source | Status | Size | Accent |
|---|---|---|---|---|---|---|
| 1 | **thought-flip** | data-capturing | CBT 3-col pattern (Reflect) | backlog | expanded | clay |
| 2 | **if-then-plan** | data-capturing | Gollwitzer implementation intentions | backlog | standard | sage |
| 3 | **craving-surf** | data-capturing | Marlatt urge-surfing worksheet | backlog | standard | lavender |
| 4 | **wins-jar** | data-capturing | 30-slot cumulative wins tracker | backlog | expanded | amber |
| 5 | **three-good-things** | data-capturing | Seligman positive-psychology triple | backlog | standard | amber |
| 6 | **friend-letter** | data-capturing | Neff self-compassion rewrite | backlog | expanded | sage |
| 7 | **grateful-for** | data-capturing | Daily gratitude triple | backlog | compact | amber |
| 8 | **win-today** | data-capturing | Single-focus badge + 1 line | backlog | compact | sage |
| 9 | **mood-dot** | data-capturing | 1-10 mood dot with context blank | backlog | compact | lavender |
| 10 | **named-patterns** | data-capturing | Prax-specific patterns + free slot | backlog | standard | clay |
| 11 | **shame-baggage** | data-capturing | <REDACTED-PSYCH-FIRST>: notice, don't force | backlog | standard | clay |
| 12 | **phq2-lite** | data-capturing | 2-question weekly depression screen | backlog | compact | lavender |

**Legend:** *backlog* = planned for next implementation pass · *shipped* = SVG + PNG set exist · *cut* = decided against · *parked* = on-hold for later iteration

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

1. Create directory: `mkdir packs/journals/prax-journal/stickers/<kebab-name>/`
2. Author the SVG: `packs/journals/prax-journal/stickers/<kebab-name>/<kebab-name>.svg`
3. If data-capturing, add `README.md` with the data spec
4. Add a row to the "Shipped" table in this file with status `backlog`
5. When renderer next runs, PNG set is generated automatically

## How to remove a sticker

1. Move its row from **Shipped** to **Cut** with a one-line reason
2. Delete its directory OR keep SVG for archive — the renderer only processes Shipped-listed entries

---

*Last updated:* 2026-04-28 · Phase 1 restructure (v3 plan). Nothing shipped yet; this is the pre-Iteration-1 intent.
