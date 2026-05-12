# NORTH-STAR · pretext-templates 12-month ideal

**Purpose.** This doc survives any single session. It is the 100x vision — the
cathedral — so future agents + humans can decide whether the current cycle
still points at it.

**Provenance.** Authored 2026-05-12 in CEO Plan v5 Phase 0 (P0.6).
Read alongside `docs/plan-ceo-review-v5-10x-100x-expansion.md` for rationale.

**Horizon.** 12 months from 2026-05-12 → 2027-05-12.

---

## One-paragraph pitch (the whole cathedral)

`pretext-templates` becomes the category-defining open-source **personalisation
engine** for digital planning: a library where every pack is both a downloadable
PDF *and* a parameterised generator, served by a gallery that learns from every
download, gated by a design-system lint CLI that makes community contribution a
one-command loop, and a private flagship (Prax Journal) that demonstrates the
ceiling of the art. Free, MIT + CC BY 4.0, no SaaS, no account, runs offline.
The product differentiator is **taste, codified into tooling** — not features.

---

## The five capabilities (in priority order)

### 1 · Every pack is a generator

**State at horizon.** All 27 packs (+ any added in-year) expose a
`generate.ts` that accepts a `GeneratorInput` (date range · year · locale ·
profile · output) and emits a parameterised PDF. `pretext generate
<pack-id>` is the one-command entrypoint.

**Why it matters.** Static templates stop at "I want it in my year / my
locale / with my field names." Generators scale to 1000 users without 1000
manual exports. It also unlocks i18n, year rollovers, and per-user field
injection (habit names, goal labels) as configuration, not bespoke work.

**What "done" looks like.** A new user can run
`pretext generate habit-tracker --year 2027 --habits "lift,walk,read"`
and get a PDF tailored to them, in ≤ 5 seconds, without reading the
codebase.

### 2 · Gallery is a feedback loop

**State at horizon.** Every download fires a beacon to a Cloudflare Worker
writing `{pack, theme, ts, country, locale_hint}` to D1 — zero PII. The
gallery offers an opt-in "tell me in 7 days how it went" email via Resend.
`npm run stats` shows top packs + themes + feedback summary. The data
decides what lands in future cycles.

**Why it matters.** A catalog cannot learn. Without a signal we are guessing
which packs to double down on, which themes to cut, what the real unmet
demand is. One cheap Worker fixes that for the whole project, forever.

**What "done" looks like.** After 3 months of live data: a top-10 most-
downloaded surface on the gallery home page; clear signal on which packs +
themes pair naturally; a pruned theme list based on actual usage; feedback
loop confirming 1+ pack is a net-positive tool for real users.

### 3 · Design-system lint CLI gates contribution

**State at horizon.** `pretext audit <pack>` enforces: manifest schema,
entry-exists, shared-token vocabulary usage, WCAG AA contrast under every
theme, zero-overflow on A4 + Letter + iPad-landscape, sticker-has-evidence
(Prax Journal only). CI blocks any PR that breaks a rule. Runs on every
push. Community contributors get actionable JSON findings with fix hints.

**Why it matters.** The taste is currently in Prax's head + `docs/`. That
doesn't scale to community contribution. Codifying the rules into a lint
CLI turns taste into a **pull request** — contributors know what good looks
like before they submit; maintainers triage with a machine gate instead of
a 2-hour review per PR.

**What "done" looks like.** 3 community-contributed packs merged in the
horizon. All 27 existing packs pass the lint clean. New-contributor-to-
first-merged-pack loop is under 60 minutes.

### 4 · Tier 3 static editor lights up

**State at horizon.** `/customise/<pack-id>` route in gallery lets the user
pick theme, fill declared fields (year, start-date, habit names, etc.) via
a form, and export a personalised PDF. Implementation is **client-only** —
pdf-lib text overlay on top of the fetched themed PDF. No server, no
account. Works offline once loaded.

**Why it matters.** This is the moment a visitor goes from "I like this
idea" to "I have this thing." Without it, the gallery is a showroom. With
it, the gallery is a tool.

**What "done" looks like.** At least one flagship pack (habit-tracker or
yearly-overview) ships with Tier 3 customise; A4 + iPad-landscape output
verified across Safari/Chrome/Firefox desktop + iOS Safari. 10%+ of gallery
downloads go through the customise flow.

### 5 · Prax Journal as the ceiling demonstration

**State at horizon.** Prax Journal is still the flagship. It adds: 100+
curated stickers (E7 gate passed), practice-of-week curator (E4 graduated
from localStorage to per-user profile), i18n on narrative pages (E6 gate
passed), therapist-share PHI-redacted export (from v2 plan T-007), crisis
card pocket PDF (T-006). It is publicly visible and documented as "this is
what the engine can do when one person invests a year of taste."

**Why it matters.** The private flagship is the **aspiration scaffold** for
the public library. Every feature that lands in Prax Journal becomes
template fuel for the generalised product. It is our proof that the
engine's ceiling is higher than any competitor's.

**What "done" looks like.** Prax has used the journal daily for 12 months
(adherence proven). At least 2 patterns from Prax Journal have been
generalised into public packs.

---

## What is explicitly NOT in the North Star

- SaaS / hosted customisation service (offline-first · no account is the DNA)
- Mobile app (GoodNotes is the mobile surface)
- Handwriting recognition / AI layout (out of scope per v1 spec)
- Real-time collaboration (anti-pattern for a single-user planner)
- Pop-culture / licensed content (stays MIT + CC BY 4.0 clean)
- Marketplace revenue (free · MIT · donations only if anyone ever asks)

---

## Signal → gate map (how we know to pull each lever)

| Capability | Gate | Source of signal | Blocker action |
|---|---|---|---|
| i18n on generators | 5%+ of Phase 2 events have non-en locale_hint | D1 `locale_hint` column | Add locales starting with highest signal first |
| Tier 3 customise route | 100+ downloads/week on at least one pack | D1 `downloads` count | Build customise for that pack first |
| 100+ sticker library | Practice-of-week used by ≥ 3 users for ≥ 4 weeks | Prax direct report + any community signal | Add next 10 stickers; iterate |
| Community contribution | Audit CLI v0 lands + 1 external "how do I contribute?" issue | GH issues + audit JSON | Unlock `/contribute` form |
| Prax Journal expansion | Prax still using daily at week 12 | Direct self-report | Ship next layer of depth |

---

## Anti-goals that would invalidate the North Star

- Ship a SaaS before ever shipping static. Undermines offline-first DNA.
- Add a theme without WCAG AA passing on every pack in that theme.
- Accept a community PR that fails audit CLI, even with a "minor" pass.
- Grow sticker count past 100 without evidence of practice-of-week adoption.
- Let dependency updates drift past a quarter. Stale deps erode trust in the
  "it always works offline" claim.

---

## Update protocol

This doc is **not** a roadmap. It is the **vision**. Roadmap lives in CEO plans
per cycle (v5 now, v6 next, etc). Update here only when:

1. A capability ships and stops being a future state (move to "shipped" log)
2. A gate is hit and a deferred capability becomes active
3. A new capability is proposed and survives a CEO-review cycle

Keep this doc **short**. If it crosses 300 lines, something is wrong.

---

## Shipped log (update as capabilities land)

_(empty at authoring · append as each capability in §1-5 reaches the "done"
criterion)_
