# Prax Journal — SPEC.md

**Status:** Stub (Phase 1 · restructure). Grows to full portable implementation contract during Phase 2 (Iteration-1).

**Scope:** This is the machine-readable contract for any AI agent or engineer building/extending the Prax Journal pack. Intended level: principal-engineer-portable. See `docs/plan-ceo-review-v3-refined.md` for the CEO-level rationale.

---

## 1 · Problem statement

Prax (one specific user) has ADHD + depression and needs a daily journal that:

- Forces morning/midday/evening check-ins (3 apertures per day)
- Captures structured metrics (mood · chest-kg · cigs · Named Patterns)
- Integrates therapist context (psychology + psychiatry — names live in profile.local.json, never committed)
- Works entirely inside GoodNotes on iPad (no cloud, no account, no apps)
- Can be regenerated at any time on Mac with updated meds/therapists
- Delivers month-end insights via AI reading the filled PDF (not user double-entry)

## 2 · Goals

- A4 portrait PDFs with flat bookmarks, Chromium-printable
- Warm Analog Editorial aesthetic (see DESIGN.md §1-§7)
- Self-contained HTML: one `<style>` block per template, no imports (FIND-0010)
- Visual-regression tested at ≤ 0.5% pixel drift
- WCAG 2.2 AA contrast on every text pair
- `@media print { box-shadow: none }` on every card (shadow-halo fix)

## 3 · Non-goals

- **Not** a multi-tenant product. Single-user (Prax) data baked in.
- **Not** an iPad/phone app. Generator runs on Mac only.
- **Not** paper-first. Digital-first in GoodNotes. No print/ship physical stickers.
- **Not** a GoodNotes plugin (GoodNotes has no plugin API).
- **Not** real-time / live-updating. Regenerated at notebook boundaries (every 1-2 months).

## 4 · System overview

```
  MAC SIDE                              iPAD SIDE
  ────────                              ──────────
  npm run journal --from X --to Y       GoodNotes imports PDF as notebook
    ↓                                     ↓
  reads profile.json                    user writes with Apple Pencil
    ↓                                     ↓
  renders N daily × 4 pages             ~30 days of lived data
    + K weekly pages                     ↓
    (+ maybe monthly / quarterly         export as PDF, AirDrop to Mac
       per per-iteration scope)           ↓
    ↓                                   [back to Mac side]
  merges to bookmarked PDF
    ↓                                   MONTH-END LOOP
  output/prax-journal-*.pdf               AI reads filled PDF
                                          ↓
                                          generates monthly-review-*.pdf
                                          ↓
                                          AirDrop to iPad, import, reflect
```

## 5 · Domain model (Iter-1 minimum)

### `profile.json` — single source of truth

```typescript
{
  schema_version: 1,
  user: { name: string, locale: string, timezone: string },
  therapists: Array<{
    name: string,
    role: 'psychologist' | 'psychiatrist' | string,
    last_session?: string,      // ISO date
    last_consult?: string,      // ISO date
    next_due?: string,          // ISO date
  }>,
  meds: Array<{
    name: string,               // e.g. "Prothiaden 25"
    dose: string,               // e.g. "1-0-0" (morning-afternoon-evening)
    since: string,              // ISO date when started
  }>,
  baselines: {
    cigs_per_day_baseline: number,
    chest_kg_scale: [number, number],   // [min, max]
  },
  named_patterns: string[],     // e.g. ["doomscroll", "prereq trap", "catastrophize"]
}
```

Backward compatibility: unknown top-level keys ignored.

## 6 · Implementation contract (Iter-1 deliverables)

- `versions/v5/weekly.html` — Sunday end-of-week recap, Warm Analog grammar, A4
- `stickers/<name>/{<name>.svg,README.md}` for 12 starting stickers (see `stickers/README.md`)
- `src/generators/prax-journal.ts` — CLI: `--from`, `--to`, `--profile`, `--output`
- Integration tests for the generator: renders 33 days + 5 Sundays = 137 pages
- `docs/monthly-generation-playbook.md` for post-hoc monthly review workflow

## 7 · Validation & tests

- `tests/visual/v5-snapshots.test.ts` — re-baselined against `packages/packs-prax-journal/versions/v5/*`
- `tests/unit/contrast.test.ts` — WCAG AA on every `shared/themes/*.css`
- Integration: `npm run journal -- --from 2026-04-28 --to 2026-05-30` produces 137-page PDF

## 8 · Definition of Done (Iter-1)

- [ ] Weekly page renders in isolation and matches Warm Analog grammar
- [ ] 12 stickers render at 300 · 600 · 1200 PNG + source SVG
- [ ] `npm run journal -- --from X --to Y` produces bookmarked PDF
- [ ] Visual regression: 0 drift on v5 daily pages
- [ ] Contrast test: 14 themes × 4 pairs all ≥ 4.5:1
- [ ] `profile.json` seeded with current meds/therapists/patterns, validated by Zod
- [ ] `docs/monthly-generation-playbook.md` written and tested by dry-running on a partial notebook

---

*This spec grows with each iteration. After Iter-1 ships, sections 9+ will document the lived generator behavior, monthly-review playbook, and sticker-data extraction rules.*
