# Eng Review — Weekly · Monthly · Sticker Library

**Date:** 2026-04-28
**Branch:** main
**Reviews:** `docs/plan-weekly-monthly-stickers.md` (CEO plan locked at `441c8aa`)
**Reviewer:** Cline (inline eng-review, context-budget-constrained)
**Verdict target:** CLEAR-to-implement or block-with-findings

---

## 0 · Pre-review audit

Plan scope locked per CEO review:
- 2 templates · 12 stickers · 2 scripts · visual-regression extension · contract update
- 5 sequenced commits defined
- Digital-only (GoodNotes), SVG + PNG (300/600/1200), 48 artifacts for 12 stickers

Existing foundation (verified at HEAD `441c8aa`):
- `src/core/puppeteer-renderer.ts` renders HTML → PDF (works, v5-5page + v5-4page both shipped)
- `src/core/svg-renderer.ts` + `src/core/png-renderer.ts` handle SVG + PNG (tested in `tests/unit/svg-renderer.test.ts`)
- `sharp` is in `dependencies` — no new deps needed for PNG export
- `tests/visual/v5-snapshots.test.ts` covers 8 HTML pages; pattern is straight-copy for weekly + monthly
- `prax-journal-design.md` § 5 card archetype + § 3 palette already contract what sticker layouts must follow

Retrospective flag: v5-midday.html has 1 remaining leftover inline style (the `caps` class was added but I notice SVG color fallbacks may come back). The eng review shouldn't re-introduce inline styles in new files.

---

## 1 · Architecture review

### System context

```
  HTML TEMPLATES              SVG SOURCES                   PDF/PNG OUTPUTS
  ─────────────               ───────────                   ───────────────
  adhd-v5-today.html          stickers/functional/          output/
  adhd-v5-midday.html         ├── thought-flip.svg          ├── prax-journal-v5-*.pdf
  adhd-v5-reflect.html        ├── if-then-plan.svg          └── stickers/
  adhd-v5-brain-dump.html     ├── craving-surf.svg              ├── thought-flip/
  adhd-v5-weekly.html ◄ NEW   ├── wins-jar.svg                  │   ├── thought-flip.svg
  adhd-v5-monthly.html ◄ NEW  ├── three-good-things.svg         │   ├── thought-flip-300.png
                              ├── friend-letter.svg             │   ├── thought-flip-600.png
  scripts/                    ├── grateful-for.svg              │   └── thought-flip-1200.png
  ├── generate-v5-{4,5}page   ├── win-today.svg                 └── [11 more]
  ├── render-stickers.ts ◄NEW ├── mood-dot.svg
  └── generate-v5-full-       ├── named-patterns.svg
      spread.ts ◄ NEW         ├── shame-baggage.svg
                              └── phq-2-lite.svg
```

### Architectural concerns + resolution

**A1 · SVG authoring vs rendered SVG split.**
Plan says "SVG source + standalone shippable SVG". Are these one file or two? **Resolution:** One source file, validated via `src/core/svg-renderer.ts`. "Standalone shippable" means `sharp` copies it to `output/stickers/<name>/<name>.svg` with no transform. Same pixels, different path. No two-file split needed.

**A2 · Sticker aspect ratio conflict with design contract § 1 "A4 portrait only".**
Stickers aren't A4 pages — they're cards of varying aspect ratios. The contract is about page templates, not stickers. **Resolution:** New § 13 Sticker format should declare: square (1:1) for numeric stickers like Mood Dot, landscape (3:2) for 3-row CBT patterns, portrait (2:3) for longer worksheets. Each sticker declares its viewBox; `render-stickers.ts` preserves ratio when rasterizing.

**A3 · Weekly vs Monthly template sharing.**
Both pages aggregate data from dailies: Weekly pulls 7 days, Monthly pulls 30. **Risk:** copy-paste leading to drift between them. **Resolution:** Extract shared CSS tokens (both use `--shadow-card`, `--r-card`, `--s3`, etc. from the contract). HTML structure differs enough that a third "shared CSS file" imported via `<link>` would break self-contained template invariant (FIND-0010 in audit). Keep them as 2 independent files but reference the same contract § tokens. Flag drift at design-review time, not structurally.

**A4 · Dependency graph.**
No new runtime deps. `sharp` already imports. `pdf-lib` already imports. The new `render-stickers.ts` adds ~80 LOC of I/O glue. No npm audit risk.

**Verdict:** Architecture is sound. No refactor required before shipping.

---

## 2 · Error & rescue map

`render-stickers.ts` failure modes:

| Failure | Exception | Rescue | User sees |
|---|---|---|---|
| SVG file missing | `ENOENT` from `fs.readFile` | Skip + log "missing, skipping" | Warning in stdout, continue with others |
| SVG malformed | `sharp` throws parse error | `console.warn` with filename + re-raise | Exit non-zero, `output/stickers/<failed>/` absent |
| PNG write fails (disk full, perms) | `ENOSPC` / `EACCES` | Bubble up; fail fast | Process exits 1 with clear message |
| Sharp version mismatch after npm install | Runtime error on import | N/A (CI would catch) | n/a |
| Sticker with no explicit viewBox | `sharp` uses defaults (may distort) | Validation step: check for viewBox in every SVG before rendering | Script fails early with "adhd-v5/…/foo.svg missing viewBox" |

`generate-v5-full-spread.ts` — same shape as existing 4-page / 5-page scripts. Copy-pastes the known-working pattern. No new error surfaces.

**Gaps:** None blocking. The viewBox validation is a nice-to-have and trivially adds.

---

## 3 · Security & threat model

**Attack surface delta:** Zero. No new endpoints, no user input, no network calls. Stickers are static SVG + PNG artifacts built at dev time. GoodNotes reads them as image assets.

**Supply chain:** `sharp` is already pinned. `pdf-lib` already pinned. No new transitive deps introduced.

**Data classification:** SVGs may contain Prax's therapist names (Shreya, Dr Joshi) and med names. This is already in the repo (see v5-today Rx card). Per design contract, this is personal-use; no PII concern.

**LLM/prompt injection:** N/A. No LLM surface.

**Verdict:** No security findings.

---

## 4 · Data flow + interaction edge cases

### Data flow: render-stickers.ts

```
  src/stickers/functional/*.svg
            │
            ▼
  ┌─────────────────┐
  │ readFile()      │──► ENOENT ──► skip + warn
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ validate viewBox│──► missing ──► fail fast
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ sharp.toPng(300)│──► 3× parallel
  │ sharp.toPng(600)│
  │ sharp.toPng(1200│
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ copyFile SVG    │──► EACCES ──► fail
  └────────┬────────┘
           │
           ▼
  output/stickers/<name>/{<name>.svg,<name>-{300,600,1200}.png}
```

**Shadow paths checked:**
- Empty stickers folder → script exits 0, writes nothing, logs "0 stickers found"
- Single malformed SVG → the other 11 still render
- Partial run (Ctrl-C mid-batch) → idempotent re-run (overwrites)

**Interaction edge cases (for end users — Prax):**
- Opens stickers folder in Finder — only sees `output/stickers/`, sources are under `src/` (as designed)
- Drag sticker onto GoodNotes page → file-format handled by GoodNotes (confirmed working for PNG; SVG may or may not work depending on version)
- Sticker appears huge (1200px) but GoodNotes auto-scales → acceptable

**Verdict:** Data flow sound. Bugs would be localized to the render pipeline.

---

## 5 · Code quality review

### Sticker SVG authoring standards (proposed for new § 13)

1. `viewBox` required on every `<svg>`. Enforced at render-time.
2. No embedded raster fallback. SVGs must be all-vector.
3. No external font references (`font-family: 'Fraunces'`). GoodNotes would fall back; must embed glyphs as paths OR use system serif fallback + accept the swap.
4. Color palette: only tokens from `prax-journal-design.md` § 3. Hardcoded hex allowed (SVGs can't use CSS variables when rendered by sharp).
5. Stroke-width: 1.3–1.8 per design contract § 5.7 to match frog icon character.
6. Transparent background: no `<rect fill="...">` covering full viewBox as first child.
7. `<title>` element for accessibility, matches the sticker's semantic name.

### DRY concerns

Each sticker HTML would rebuild the squircle + shadow + header pattern from § 5.4 of the contract. **Mitigation:** Stickers are SVG, not HTML — they don't reuse the card CSS. They reuse the *aesthetic* (stroke width, color palette, hand-drawn character). No CSS duplication.

### Over/under-engineering check

**Over:** 48 artifacts for 12 stickers. Could we skip 300px and only ship 600 + 1200? 300 is small for a printed sticker but fine for inline in GoodNotes. Keep all 3 — the marginal cost of generating PNG sizes is ~50 ms each.
**Under:** What if GoodNotes doesn't support SVG? Backup plan: PNG covers all cases. No blocker.

---

## 6 · Test review

New test coverage required:

| Unit | What it tests |
|---|---|
| `render-stickers.test.ts` | **NEW.** Mock sharp; verify 3 PNG sizes written per SVG, SVG copied, folder structure correct. |
| `tests/visual/v5-snapshots.test.ts` | **EXTEND.** Add weekly + monthly HTML to the existing 8-spec suite. Baselines for sticker SVGs not needed — SVG is deterministic source. |
| `tests/unit/contrast.test.ts` | **CHECK.** Existing test reads `src/templates/themes/*.css`. Weekly + monthly use v5 tokens inline; should pass automatically if `sage-ink` + `clay-ink` + `amber-ink` are verified (they are from prior commit `9f1af41`). |

**Test ambition:**
- **Confidence-at-2am test:** If one sticker SVG is malformed, does `render-stickers.ts` fail the whole batch or keep going? Must keep going for the other 11 — asserted.
- **Hostile-QA test:** What if a sticker has no `viewBox`? Script must refuse to render (silent distortion is worse than failure).
- **Chaos test:** What if `output/stickers/` already has stale files from a deleted sticker? Clean-up pass optional; stale files would confuse Prax. Script should `rm -rf output/stickers/<name>` before writing fresh.

**Gap — recommend adding:** a `rm -rf output/stickers` at start of `render-stickers.ts` to guarantee clean state.

---

## 7 · Performance review

- 12 SVGs × 3 PNG sizes = 36 sharp invocations. ~50 ms each = ~2 s total.
- `generate-v5-full-spread.ts` renders 6 pages × ~600 KB each. ~7–10 s total (same as existing 5-page script).
- No DB, no network, no async concurrency issues.
- Memory: 1200 px × 1200 px × 4 bytes = ~5.7 MB per buffer; 3 in flight = 17 MB peak. Trivial.

**No perf findings.**

---

## 8 · Observability & debuggability

`render-stickers.ts` logging:

```
📔 Rendering 12 stickers from src/stickers/functional/ …
  [1/12] thought-flip        … SVG valid · 300 ✓ 600 ✓ 1200 ✓
  [2/12] if-then-plan        … SVG valid · 300 ✓ 600 ✓ 1200 ✓
  ...
  [12/12] phq-2-lite         … ERROR: missing viewBox → skipped
✅ 11 stickers rendered · 1 error · output/stickers/
```

`generate-v5-full-spread.ts` logging: same shape as existing 4-page script.

**No dashboards / no alerts** — this is dev-side code, not prod service. OK.

**Runbook:** If stickers come out wrong, check `output/stickers/<name>/` — compare to source SVG in `src/stickers/functional/<name>.svg`. Fix source, re-run script.

---

## 9 · Deployment & rollout

- **No DB migration** (no DB).
- **No feature flag** (no server code).
- **Deployment unit** = a git push. `.gitignore` already excludes `output/`.
- **Rollback** = `git revert` the commit. Each of the 5 commits is independently revertable.
- **Environment parity** = same HTML → PDF pipeline already proven on 4-page + 5-page scripts.
- **Smoke test post-ship:** run `npx tsx scripts/render-stickers.ts` then `open output/stickers/index.html`. If stickers look sane, ship.

**Risk:** If CI runs `render-stickers.ts` (it shouldn't — outputs are dev artifacts), CI needs sharp available. CI already uses sharp for v5-snapshots visual tests → works.

**No deploy findings.**

---

## 10 · Long-term trajectory

- **Technical debt introduced:** 12 new SVG files. Each is a design dependency. Future aesthetic pivots (v6, v7) would need all 12 re-authored. **Mitigation:** Design contract § 3 palette is stable; only stroke width, viewBox, and composition change between aesthetic pivots.
- **Path dependency:** Adding a 13th sticker later is 1 SVG + 0 infra. Low cost.
- **Knowledge concentration:** A new engineer reads `docs/plan-weekly-monthly-stickers.md` + `prax-journal-design.md` § 13 and can ship a new sticker in ~30 min. Acceptable.
- **Reversibility:** 5/5. `git revert` any of the 5 commits individually.

**Ecosystem fit:** Aligns with the "self-contained HTML templates" design principle (FIND-0010 in audit). No external CSS, no shared JS. Each sticker is a standalone SVG.

**The 1-year question:** "This sticker is called 'Thought Flip' — what does it do?" → the SVG's `<title>` tag + the sticker source commit message (research citation) explains it.

---

## 11 · Design & UX review

(Full visual audit deferred to `/plan-design-review` or `/design-review`. This is structural only.)

**Information architecture of the 12 stickers:**
- **Core CBT (frequent):** Thought Flip · If-Then Plan · Friend Letter
- **Urge & craving (situational):** Craving Surf · Shame + Baggage
- **Wins & gratitude (daily boost):** Three Good Things · Grateful for · Win Today · Wins Jar
- **Metrics (quick):** Mood Dot · PHQ-2 Lite
- **Meta-awareness:** Named Patterns

Well-clustered. No duplicates.

**Interaction state coverage:**

| Feature | Empty | Loading | Error | Success |
|---|---|---|---|---|
| Sticker drag onto daily page | N/A (static) | N/A | N/A | Sticker appears, Prax writes on it |
| Weekly page | 7 empty recap slots | N/A | N/A | 7 slots filled at week-end |
| Monthly page | 30 empty trend bars | N/A | N/A | 30 bars drawn from daily Chest-kg |

**AI slop risk:** Low. Each sticker is hand-authored SVG, not AI-generated aesthetic. Design contract enforces the cream + sage + clay palette.

**Accessibility:**
- Weekly/monthly: screen-reader-friendly via `<h1>`, `<h2>`, `<section aria-labelledby>` — same pattern as existing v5 pages.
- Stickers: `<title>` element required in every SVG per § 13.

---

## 12 · Findings summary

### Critical gaps: **0**

### Warnings: **2**

**W1 · § 13 Sticker format spec not written yet.**
Plan assumes stickers follow a set of conventions (viewBox · no embedded fonts · token palette · 1.3–1.8 stroke · `<title>` tag) but these aren't in the contract. **Fix:** Section § 13 must be written in commit 5 BEFORE stickers are authored in commits 2-3. Otherwise authoring drift is likely.

**W2 · `render-stickers.ts` lacks viewBox validation.**
Without this check, a malformed sticker silently renders distorted PNGs. **Fix:** Add a viewBox-required check at the top of the script. ~5 lines of code.

### Nice-to-haves: **1**

**N1 · Clean-stale-output pass.**
`rm -rf output/stickers/<name>/` before writing fresh prevents orphan files from deleted stickers. ~3 lines.

---

## 13 · Sequenced commit plan — engineering adjustments

Original CEO plan had 5 commits. **Eng review says: swap order of 2 ⇄ 5 so contract is written BEFORE stickers.**

**New order:**
1. `feat(journal): weekly + monthly spread pages (v5)` — no dependency on sticker spec
2. **`docs(journal): contract § 10 + new § 13 sticker format`** ← was commit 5, now 2
3. `feat(stickers): 12-sticker library SVG sources` — now has a spec to follow
4. `feat(stickers): render-stickers.ts pipeline + viewBox validation + PNG exports + clean-stale pass`
5. `feat(journal): full-spread PDF generator with weekly/monthly splice`

This reorders the last two steps of the CEO plan but preserves the intent. Commit 2 (§13 spec) unblocks stickers with a clear authoring contract.

---

## 14 · Gates after all 5 commits

Expected:
- `tsc --noEmit` → 0 errors
- `npm run lint` → 0/0
- `npm test` → 75/75 unit (existing) + N new for `render-stickers.test.ts`
- `npm run test:visual` → 10/10 (8 existing + 2 new: weekly, monthly; baselines committed)
- `npm audit` → 0 (no new deps)
- `npx tsx scripts/render-stickers.ts` → 12 stickers rendered, 0 errors
- `npx tsx scripts/generate-v5-full-spread.ts` → 6 pages, ~3 MB PDF, bookmarked

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 3/3 decisions locked (441c8aa) |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | **CLEAR_WITH_WARNINGS** | 0 critical · 2 warnings · 1 nice-to-have |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | run post-implementation |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | N/A | personal journal |

**VERDICT:** **CLEARED to implement** with two adjustments from W1 + W2:
1. Promote commit order: § 13 spec writes BEFORE stickers are authored (swap commits 2 ⇄ 5).
2. `render-stickers.ts` must validate viewBox + clean stale output.

**UNRESOLVED:** 0. Both warnings have clear fixes baked into the revised commit plan.
