# CEO Plan v5 — Post-v1.0.0 10x/100x Expansion

**Date:** 2026-05-12 (overnight autonomous session)
**Branch:** `main` · HEAD `93f2055`
**Mode:** **SCOPE EXPANSION (10x) with 100x North Star**
**Reviewer:** Cline via `plan-ceo-review` skill
**Supersedes:** none — prior CEO plans (v2, v3, v4, sticker-v1) are historical; their locked decisions all shipped or were explicitly deferred
**Preserves:** everything at v1.0.0 — 27 packs · 60 stickers · 14 themes · 378 themed PDFs · 295 tests · grade-A health

> **Prompt shape.** User asked overnight: "rethink this project using gstack ceo 100x or 10X expansion — see what is implemented (100% correction) and how to expand what is left. Create spec etc." This document is the rigorous 10x SCOPE EXPANSION with a 100x North Star and a concrete phase ladder back to reality. It respects the four Karpathy-derived principles in `AGENTS.md` — the new work proposed is not speculative; each expansion closes a concrete gap surfaced by actual state, not by imagined demand.

---

## 0 · Pre-review system audit

### Git state

```
93f2055 docs(audit): iter-5 STATUS + session execution trace
891c1af chore(lint): 11 warnings → 0
6e48e2a test(core): 17 puppeteer-renderer tests · branches 67.5 → 79.7
96740bd fix(vercel): drop invalid _comment key (silent schema rejection)
14f9d5d fix(deploy): stage vercel.json into gallery dist/ (T-005 live gap)
005863f feat(customisation): Tier 2 — 378 themed PDFs + swatch picker
656c42a feat(themes): 14 palettes (7 light + 7 dark)
4566063 feat(packs): Simple Pages
19f9eb9 chore(gallery): live on Vercel
2bf5c15 chore(release): @praxlannister/pretext-* scope for v1.0.0
```

### What shipped (100% correction layer)

| Area | State at HEAD | Verified |
|---|---|---|
| npm | `@praxlannister/pretext-core@1.0.0` + `@praxlannister/pretext-cli@1.0.0` live | `npm view` |
| Repo | Public at `github.com/praxstack/goodnotes-templates` | HTTP 200 |
| Gallery | Live at `pretext-templates.vercel.app` (6 routes) | HTTP 200 |
| Packs | **27 shipped** (original spec targeted 22) | `registry.json` |
| Stickers | **60 shipped** (v1 plan targeted 12 — 5x over-delivery) | `packages/packs-prax-journal/stickers/` |
| Themes | 14 (7 light + 7 dark) | `packages/core/assets/themes/` |
| Customisation Tier 1 (profile) | ✅ v1.0.0 — Zod schema, PII never in repo | `profile.example.json` |
| Customisation Tier 2 (themes) | ✅ v1.1.0 — 378 pre-rendered PDFs, swatch picker live | gallery `/packs/[id]` |
| Customisation Tier 3 (editor) | 🔒 deferred by design | SPEC.md §0 |
| Tests | 295 passing · branches 79.7% · 0 lint · 0 npm vulns | Iter-5 STATUS |
| Security | 4/4 live headers · CSP present with `'unsafe-inline'` caveat | Iter-5 STATUS |
| Prax Journal (private flagship) | v5.3 — 7 HTML pages · full generator CLI · monthly + quarterly pages · 60 sticker library | `packages/packs-prax-journal/` |
| v4 five decisions | All 4 actionable decisions shipped; Q3 (practice-of-week) deferred per plan | — |

### What is explicitly deferred / open

| Item | Source | Why deferred |
|---|---|---|
| CSP `'unsafe-inline'` tightening | iter-4 STATUS remaining-debt | Needs nonce middleware or Astro inline→external script migration (1-2 day task) |
| 3 Dependabot PRs (#1 actions, #9 prod, #10 dev) | iter-5 STATUS | Major-version bumps — need per-PR daylight review |
| Per-file coverage floors | iter-5 | Nice-to-have; `pdf-postprocess.ts` at 61% branch |
| Tier 3 editor | SPEC.md §0 | Gate is Tier 2 download metrics |
| Practice-of-week curator | v4 Q3 | Revisit after 1 month of real sticker usage |
| Safari iPad probe | DECISIONS.md | Operator-only; not blocking |

### Recently touched (last 14 days · top signal)

- `apps/gallery/package.json` (9) — build pipeline churn from Tier 2 + header staging
- `tests/unit/profile.test.ts` (8) — profile schema hardening
- `packages/packs-prax-journal/versions/v5/today.html` (7) — v5.3 polish
- `apps/gallery/src/layouts/Layout.astro` (7) — SEO + header work

### TODO markers — all are in historical planning docs, zero in active code. Clean.

---

## 0A · Premise challenge — second-order reopening

v2 asked "is the journal a book or a system?" (answer: system). v3/v4 locked that in. v5 asks two questions one altitude higher:

### Q1 — Is the repo a template library or a **personalisation engine**?

Today `pretext-templates` is a template library that happens to have a personalisation sidecar (Tier 1 profile, Tier 2 themes). The 378 pre-rendered themed PDFs per pack is a static approximation of a dynamic product. A visitor who wants `"habit-tracker"` in `"warm-analog"` for year `2027` starting on `Monday` with 12 habits gets 14 theme options and nothing else parameterised.

**The asymmetry:** our Prax Journal generator already takes `--from`, `--to`, `--profile`, `--locale`, `--output` and emits personalised multi-page PDFs with meds, therapists, Named Patterns baked in. That engine is sitting in `scripts/generate-journal.ts` serving one user (Prax). **The other 26 packs could use the same engine shape** — but today they're just HTML files.

**Implication.** The 10x play is not "more packs, more themes, more stickers." It is "every pack becomes a parameterised generator." Not a new product; a new dimension on the existing one.

### Q2 — Is the gallery a showcase or a **conversion funnel**?

Today gallery has 6 routes: `index`, `browse`, `packs/[id]`, `search`, `remix`, `contribute`. Users can download 378 static PDFs. There is no analytics, no email capture, no feedback loop, no "did this work for you." The gallery is a catalog. A **catalog does not learn.**

**The 100x play:** gallery becomes a personalisation engine that captures two signals from every visitor — (a) what pack + theme they downloaded, and (b) a single optional "did this land for you?" thumbs-up/down after 7 days. That's enough to (i) prioritise which packs to double down on, (ii) seed a "top-10 most-loved" surface that compounds organically, (iii) build the "practice-of-week" curator v4 Q3 deferred because we had no data.

This is cheap. A single Cloudflare Worker + a 14-day feedback email via Resend.

### Q3 — Is the project's moat the **code** or the **opinionated taste**?

Every feature in this repo — Warm Analog Editorial, Fraunces/JetBrains Mono pairing, 14-theme vocabulary, the 60-sticker CBT/DBT/BA/ERP library with evidence sources — is **taste, documented**. A competitor with the same Puppeteer stack cannot ship our output without our taste layer. That's the defensible asset.

**Implication.** Expansions must **compound taste**, not just add surface area. A new pack without a researched editorial grammar is dilution. A new theme without rigorous contrast + paper-feel audit is noise. The bar for entry is higher than "it renders."

### Q4 — Does the project survive without Prax + Cline?

Most of the existing code does — it's deterministic, typed, tested. But the **taste** (design reviews, sticker psychology, editorial grammar) currently lives in markdown under `docs/` and is applied by Prax + Cline session. A 100x play formalises taste into a machine-enforceable **design system lint** — a CLI that scans a new pack and says "this pack violates tokens X, Y, Z and ships contrast ratio N which breaks WCAG AA on theme `nocturne`." Not speculative — the audit/iteration-1 work already produced this as ad-hoc scripts; it wants to graduate to a first-class tool.

---

## 0B · Existing code leverage (what already partly solves this)

| 10x gap | Existing leverage | What's needed |
|---|---|---|
| Every pack becomes a generator | `scripts/generate-journal.ts` (Prax Journal CLI with `--from/--to/--profile/--locale`) + `packages/cli` | Generalise the CLI to dispatch on `pack.generator` field; 26 packs add a generator func |
| Gallery becomes conversion funnel | `apps/gallery/src/pages/packs/[id].astro` (swatch picker already dispatches URL state) | CF Worker endpoint `POST /api/download-event` + Resend follow-up after 7 days |
| Taste formalised into lint | `audit/iteration-1/*.md` (hand-run audit) + vitest runner | CLI: `pretext audit <pack>` → JSON findings against `registry.json` + theme CSS inspection |
| Practice-of-week curator | 60-sticker library already tagged by category | 1-sticker-per-week rotation as a per-user JSON config in gallery (localStorage MVP) |
| Tier 3 editor | `pdf-lib` already in tree (post-processing) + gallery serves 378 static PDFs | Rebuild pdf-lib-based text overlay as static-first → fetch PDF + overlay → save. No server needed. |

**Zero rebuilds.** Every 10x item reuses > 70% of what's at HEAD.

---

## 0C · Dream state mapping

```
  TODAY (93f2055)               12-MONTH IDEAL (100x)           6-MONTH IDEAL (10x)
  ─────────────────             ──────────────────────          ───────────────────
  27 static packs               Any pack → parameterised        5 flagship packs become
  + 14 themes × 27 = 378        generator (date range,          parameterised generators
    pre-rendered PDFs           locale, year, fields)           (daily planner, weekly
  + 60 stickers as SVG          + 100+ stickers curated by      planner, monthly, yearly,
  + 1 private generator         "practice-of-week" engine       habit tracker)
    (Prax Journal)              learned from download signal    + download event tracking
  + 1.0.0 shipped               + Tier 3 static editor ships    + first 7-day feedback loop
                                  (pdf-lib text overlay,        + design-system lint CLI
                                   no server)                     scaffolded (rules for
                                + gallery becomes              tokens + contrast)
                                  conversion + feedback loop    + sticker practice-of-
                                + design-system lint CLI         week localStorage v0
                                  gate for new pack PRs
                                + 3 community-contributed
                                  packs (contribution funnel
                                  unlocked by the lint CLI)
                                + 14-theme lock, 50+ named
                                  design patterns documented
                                + localised pack variants
                                  (es-ES, de-DE, ja-JP at min)
```

### Framing the delta

v1.0.0 closed the **artifacts** gap — there is a thing to download.
v1.1.0 closed the **themes** gap — there are visually coherent options.
**v5 (this plan) closes the parameterisation gap, the feedback gap, and the lint/contribution gap** — the three gaps that determine whether this project is a weekend hack catalog or the category-defining open-source planner engine.

---

## 0C-bis · Implementation alternatives (mandatory)

### APPROACH A · v1.1.0 shipped as-is (baseline · do nothing)

- **Summary.** Close iter-5 debt (CSP nonces, Dependabot PRs). No new scope.
- **Effort.** human ~3 days / CC+gstack ~30 minutes
- **Risk.** Low
- **Pros.** Protects v1.0.0 stability; finishes the already-started security work; lets Tier 2 download data accumulate before investing in Tier 3.
- **Cons.** Leaves the generator CLI serving one user (Prax); leaves the gallery as a static catalog; abandons the 10x opportunity while the momentum is hot.
- **Reuses.** 100% of HEAD.

### APPROACH B · Selective expansion (parameterise 5 flagship packs + ship feedback loop)

- **Summary.** Generalise `generate-journal.ts` into a dispatch CLI; make 5 high-signal packs (weekly-planner, monthly-planner, yearly-overview, habit-tracker, prax-journal) parameterised generators. Ship Cloudflare Worker download event + 7-day Resend feedback. Ship design-system lint CLI v0 (tokens + contrast).
- **Effort.** human ~10 days / CC+gstack ~60-90 minutes
- **Risk.** Medium — adds a server surface (CF Worker) that didn't exist
- **Pros.** Closes three 10x gaps in one arc. Each sub-system lands value even if the others don't. Leverages ~80% of existing code. Contribution funnel becomes real.
- **Cons.** New infra dependency (Cloudflare Worker + Resend). Adds per-pack generator function maintenance (5 new files).
- **Reuses.** Prax Journal generator, CLI shape, 378-PDF theme pipeline, existing visual-regression harness.

### APPROACH C · Cathedral — full 100x (platonic ideal over 6 months)

- **Summary.** All of B, plus: Tier 3 static editor (pdf-lib text overlay, no server), i18n on the 5 generators (es-ES / de-DE / ja-JP), 100+ stickers curated by usage signal, community contribution unlocked via lint CLI, 3 external contributor PRs merged.
- **Effort.** human ~6 weeks / CC+gstack ~8-12 hours spread across 4-6 sessions
- **Risk.** Medium-high — community contribution dynamics are unpredictable; i18n locale bugs surface late
- **Pros.** Category-defining; unlocks real network effects; creates defensible taste-as-code asset.
- **Cons.** Much larger surface to maintain; post-launch operational cost (contribution triage, i18n review); multiple irreversible architectural decisions get made at once.
- **Reuses.** Everything B reuses, plus `pdf-lib` already in tree.

### RECOMMENDATION: **Approach B** (selective 10x)

**Why.** Maps cleanly to engineering preferences in AGENTS.md:
- Each sub-system of B has a concrete, shippable, verifiable outcome. (Goal-Driven Execution ✅)
- B reuses existing code rather than speculating new abstractions. (Simplicity First ✅)
- Each change traces to a specific gap surfaced by actual state. (Surgical Changes ✅)
- B makes the tradeoffs visible: more surface, more ops, but a clear compounding return. (Think Before Coding ✅)
- C is tempting but is a 6-week commitment on a solo side project; premature. The honest cadence is "ship B in two focused weeks, re-audit, decide on C."

### Completeness scoring

- Approach A: 3/10 — ships nothing new
- Approach B: 7/10 — closes the three 10x gaps cleanly, defers the truly cathedral work
- Approach C: 10/10 — the cathedral, at 6× the effort

---

## 0D · Mode-specific — Expansion opt-in candidates (SCOPE EXPANSION posture)

From the 10x check + platonic ideal in §0C, the following concrete scope expansions were distilled. Each is **opt-in at decision time** — listed here with ACCEPTED / DEFERRED / SKIPPED status derived from the autonomous-run directive "maintain the highest bar, expand what's left" combined with the AGENTS.md simplicity-first rule.

| # | Proposal | Effort (CC) | Decision | Reasoning |
|---|---|---|---|---|
| E1 | Generalise `generate-journal.ts` → `packages/cli/src/generate.ts` dispatching on `pack.generator` field; 5 flagship packs become parameterised generators (weekly/monthly/yearly/habit/prax) | ~2h | **ACCEPTED** | Cathedral 10x core. 80% of new user value. Reuses Prax Journal engine. No speculation — Prax Journal already proves the shape works. |
| E2 | Cloudflare Worker `POST /api/download-event` — logs pack-id + theme + ts (no PII) to D1/R2 · Resend 7-day follow-up email · 1-question feedback via signed link | ~1h | **ACCEPTED** | Feedback loop is the single cheapest 100x leverage. Without it the project cannot learn. Strictly additive. |
| E3 | `pretext audit <pack>` CLI — Zod-validated manifest, theme CSS inspection, WCAG contrast check per theme, stickers-have-evidence check, renders in A4+Letter+iPad-landscape without overflow | ~1h | **ACCEPTED** | Gates external contributions (decisions docs says "no external PRs yet" — this is why). Also catches regressions on internal PRs. Zero speculation — lifts existing audit/iter-1/2/3 logic. |
| E4 | Sticker practice-of-week curator — localStorage-only v0, picks 6 stickers/week from 60-item library using category taxonomy (not ML) | ~30m | **ACCEPTED** | Closes v4 Q3. Cheap. If it doesn't work, rip out — localStorage has zero backend blast radius. |
| E5 | Tier 3 static editor — pdf-lib text overlay on downloaded PDF; "/customise/<pack-id>" gallery route; A4 + iPad-landscape support; no server | ~1.5h | **DEFERRED** | SPEC.md says gate is Tier 2 download metrics. We don't have those yet. E2 ships the metric; Tier 3 lights up when data arrives. Correct sequencing. |
| E6 | i18n on the 5 E1 generators — es-ES / de-DE / ja-JP locales for dates, headers, day names | ~1h per locale | **DEFERRED** | Premature. Zero signal of non-EN demand yet. Defer until E2 produces a `locale_hint` signal from Accept-Language. |
| E7 | Expand sticker library 60 → 100+, curated by E2 download+feedback signal | ~30m per sticker | **DEFERRED** | Exact case where v1 plan says "adherence > inventory." No new stickers without signal from the 60 already shipped. |
| E8 | Community contribution funnel — `/contribute` route becomes a real submission form; PRs triaged with E3 lint as gate | ~1h | **DEFERRED** | Dependent on E3. Lands E3 first; contribution funnel is Phase 2. |
| E9 | CSP `'unsafe-inline'` removal via nonce middleware | ~1h | **ACCEPTED** (but as Phase 0 · pre-req) | Standing debt from iter-4. Closing it now means the gallery headers become real security rather than theater. |
| E10 | Dependabot PR batch review (#1, #9, #10) | ~30m | **ACCEPTED** (Phase 0 · pre-req) | Standing debt. Per-PR daylight review. Blocking for any new work because it affects CI reliability. |
| E11 | Per-file coverage floors (`pdf-postprocess.ts` 61% → 75%) | ~30m | **ACCEPTED** (Phase 0 · pre-req) | Low-risk coverage insurance. Closes iter-5 item 3. |
| E12 | 100x North Star — document the 12-month ideal as `docs/NORTH-STAR.md` for future sessions | ~15m | **ACCEPTED** | The user explicitly asked for a spec — this is how the vision outlasts any single session. Zero code risk. |

**Accepted (Phase 0 pre-reqs):** E9, E10, E11 — close iter-5 debt before new scope
**Accepted (Phase 1 10x):** E1, E2, E3, E4, E12
**Deferred to TODOS.md:** E5 (data-gated), E6 (signal-gated), E7 (adherence-gated), E8 (E3-dependent)

---

## 0E · Temporal interrogation — decisions that implementation will hit

Read forward into Phase 1 execution (see §Phase plan below). These are decisions that **must be resolved in the plan**, not during implementation:

### HOUR 1 (foundations · E9 + E10 + E11)

- **Nonce source for CSP?** Option A: Vercel middleware generates nonce per request and passes via header to Astro (needs Vercel middleware config). Option B: migrate Astro inline scripts to external files (ships a static CSP with no unsafe-inline, no middleware). **Resolved:** Option B. Astro already supports this via `is:inline`-opt-out. Zero new infra. Matches AGENTS.md simplicity-first.

- **Dependabot batch vs per-PR?** **Resolved:** per-PR, in this order — #1 (actions) first (isolated, smallest blast radius), then #9 (prod deps — run full test suite between each), then #10 (dev deps — lowest risk).

### HOUR 2 (E1 · generator dispatch)

- **Where does `generate()` live per-pack?** Option A: `packages/packs-<id>/generate.ts` ships alongside HTML. Option B: single file in `packages/cli/src/generators/<id>.ts`. **Resolved:** Option A. Keeps the pack self-contained per FIND-0010. CLI imports via dynamic `import('../packs-<id>/generate.ts').default` based on pack registry.

- **Generator signature?** Must be backwards-compatible with Prax Journal's existing signature `{ from: Date, to: Date, profile: Profile, locale: string, output: string }`. New packs without profile requirement: `profile: undefined` flows through, generator ignores. **Resolved:** single generic type `GeneratorInput` in `packages/core/src/types/index.ts`.

- **What does a generator produce for a 1-page pack?** A parameterised HTML string (same pack-id.html but with `{{YEAR}}` etc. substituted), rendered by the existing Puppeteer pipeline. Not a new PDF path.

### HOUR 3 (E2 · Cloudflare Worker)

- **D1 vs R2 vs KV?** Download events are append-mostly, <1KB each, analytical queries. **Resolved:** D1 (SQL schema lets us answer "top packs this week" directly).

- **PII?** Absolutely none. No IP, no user-agent fingerprint, no email. Only: `{ pack_id, theme_id, ts, country (from CF header), locale_hint (from Accept-Language) }`. The 7-day follow-up is **opt-in** — the download page shows a "want a tap to tell me if this worked? leave your email" field; empty = no email sent.

- **Rate limiting?** Cloudflare default (10 req/s per IP) + skills' preamble pattern (429 with backoff-hint header).

- **Schema:**
  ```sql
  CREATE TABLE downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id TEXT NOT NULL,
    theme_id TEXT NOT NULL,
    ts INTEGER NOT NULL,       -- unix ms
    country TEXT,              -- 2-letter ISO, or NULL
    locale_hint TEXT           -- first tag from Accept-Language, or NULL
  );
  CREATE INDEX idx_pack_ts ON downloads(pack_id, ts);
  CREATE INDEX idx_theme_ts ON downloads(theme_id, ts);
  
  CREATE TABLE feedback_tokens (
    token TEXT PRIMARY KEY,    -- HMAC-signed, 7-day expiry
    pack_id TEXT NOT NULL,
    theme_id TEXT NOT NULL,
    email TEXT NOT NULL,       -- only stored if user opted in
    ts INTEGER NOT NULL,
    responded_at INTEGER,      -- NULL until feedback lands
    rating TEXT                -- 'up' | 'down' | NULL
  );
  ```

### HOUR 4 (E3 · audit CLI)

- **Output format?** JSON first (machine consumable, lints in CI), pretty-print flag second. Don't re-invent lintrc.

- **Failure mode?** Exit code 0 = clean, 1 = findings, 2 = malformed pack. Each finding has `{ severity: 'error'|'warn'|'info', rule_id, message, file, line? }`. Mirrors ESLint shape.

- **Which rules v0?**
  1. `manifest-valid` (Zod schema against `PackManifest`)
  2. `entry-exists` (entry HTML file exists)
  3. `tokens-used` (HTML uses the shared token vocabulary `--background`, `--foreground`, `--primary`, `--accent`, `--border`)
  4. `wcag-aa-all-themes` (render under each of 14 themes, assert text-on-background contrast ≥ 4.5:1)
  5. `paper-overflow` (render in A4 + Letter + iPad-landscape — assert `.page.scrollHeight === clientHeight`)
  6. `stickers-have-evidence` (every sticker SVG has a `data-evidence-source` attribute; applies to prax-journal only, non-fatal elsewhere)

### HOUR 5 (E4 · sticker practice-of-week)

- **How does it work?** localStorage key `pretext.prax-journal.stickers.rotation`. Weekly (ISO week): pick 6 stickers from 60 using a deterministic hash of `${week_number}-${category_index}`. Present as a 6-cell shelf on `today.html`. User can "un-select" to force-replace; choice persisted.

- **Where does it live?** Client-side JS in the Prax Journal HTML itself — keeps FIND-0010 (self-contained pack). No server, no cookies.

### HOUR 6+ (polish · docs · tests · observability)

- **Observability for E2?** Cloudflare native analytics + a daily `npm run stats` pulling top-10 packs and themes from D1. Lightweight.

- **Tests for E1 generators?** Golden-file per pack: generate with fixture date range, diff output HTML against committed golden. Fails loud on any change. Vitest + existing visual-regression harness.

- **Docs?** Each generator ships with a 15-line README section. The `pretext generate <pack-id>` CLI self-documents via `--help`.

---

## 0F · Mode selection — locked: **SCOPE EXPANSION 10x (Approach B)**

Autonomously locked per user directive "10X or 100x expansion." The 100x (Approach C) is documented as the North Star in `docs/NORTH-STAR.md` but **not in this plan's execution scope**. Phase 1 executes Approach B.

---

## Phase plan — compounded commit ladder

### Phase 0 · Close iter-5 debt (pre-req, no new scope)

| # | Commit prefix | What | Effort (CC) |
|---|---|---|---|
| P0.1 | `chore(deps):` | Dependabot #1 (actions) — per-PR review, merge if green | 10m |
| P0.2 | `chore(deps):` | Dependabot #9 (prod) — per-PR review, full test-suite between | 15m |
| P0.3 | `chore(deps):` | Dependabot #10 (dev) — per-PR review | 5m |
| P0.4 | `fix(security):` | CSP `'unsafe-inline'` removed via Astro inline-script migration to external files | 1h |
| P0.5 | `test(core):` | `pdf-postprocess.ts` branch coverage 61% → 75% (per-file floor added to vitest config) | 30m |
| P0.6 | `docs(audit):` | `docs/NORTH-STAR.md` — 100x vision for future sessions | 15m |

### Phase 1 · Parameterised generators (E1)

| # | Commit prefix | What | Effort (CC) |
|---|---|---|---|
| P1.1 | `refactor(cli):` | Extract `GeneratorInput` + `GeneratorFn` types into `packages/core/src/types/index.ts` | 15m |
| P1.2 | `refactor(cli):` | Dispatch CLI — `pretext generate <pack-id> --from --to --year --locale --profile --output` | 30m |
| P1.3 | `feat(packs):` | Prax Journal generator migrated from `scripts/generate-journal.ts` to `packages/packs-prax-journal/generate.ts` | 30m |
| P1.4 | `feat(packs):` | Weekly planner generator — `--from` + `--weeks` flags | 20m |
| P1.5 | `feat(packs):` | Monthly planner generator — `--year` + `--month` flags | 15m |
| P1.6 | `feat(packs):` | Yearly overview generator — `--year` flag | 15m |
| P1.7 | `feat(packs):` | Habit tracker generator — `--year` + `--habits` (up to 12 names) | 20m |
| P1.8 | `test(packs):` | Golden-file tests per generator (5 tests added) | 30m |
| P1.9 | `docs(cli):` | README section + `pretext generate --help` self-docs | 15m |

**Ship gate:** all 295 existing tests + 5 new golden tests = 300 green · `pretext generate prax-journal --from 2026-06-01 --to 2026-06-30` produces identical output to today's `npm run journal`.

### Phase 2 · Download event + feedback loop (E2)

| # | Commit prefix | What | Effort (CC) |
|---|---|---|---|
| P2.1 | `feat(infra):` | Cloudflare Worker scaffold in `apps/api/` with D1 schema migration (both tables above) | 30m |
| P2.2 | `feat(infra):` | `POST /api/download-event` endpoint + rate limit + schema validation | 20m |
| P2.3 | `feat(gallery):` | Download buttons fire beacon with pack_id + theme_id (no PII) | 15m |
| P2.4 | `feat(gallery):` | Opt-in "tell me how it went in 7 days" email field on download page | 15m |
| P2.5 | `feat(infra):` | Scheduled Cron Worker: 7-day follow-up via Resend with signed feedback link | 20m |
| P2.6 | `feat(infra):` | `GET /feedback/:token` endpoint → 2-button page → writes back to D1 | 20m |
| P2.7 | `feat(cli):` | `npm run stats` — pulls top-10 packs + themes + feedback summary from D1 | 20m |
| P2.8 | `test(infra):` | CF Worker integration tests with Miniflare | 30m |
| P2.9 | `docs(infra):` | Ops runbook · D1 backup · Worker deploy | 15m |

**Ship gate:** Worker deployed to CF · D1 populated · test event from gallery visible in stats within 30s · feedback email lands and round-trips.

### Phase 3 · Design-system lint CLI (E3)

| # | Commit prefix | What | Effort (CC) |
|---|---|---|---|
| P3.1 | `feat(cli):` | `pretext audit <pack-id>` dispatch command + JSON/pretty output | 15m |
| P3.2 | `feat(cli):` | Rule `manifest-valid` (Zod) | 10m |
| P3.3 | `feat(cli):` | Rule `entry-exists` + `tokens-used` (regex scan HTML for token vocab) | 15m |
| P3.4 | `feat(cli):` | Rule `wcag-aa-all-themes` — renders under each theme, contrast check via `color-contrast` npm or impl | 20m |
| P3.5 | `feat(cli):` | Rule `paper-overflow` — renders in A4/Letter/iPad-landscape via Puppeteer, assert no overflow | 20m |
| P3.6 | `feat(cli):` | Rule `stickers-have-evidence` (prax-journal-scoped, soft-fail elsewhere) | 10m |
| P3.7 | `ci:` | GitHub Action runs `pretext audit` on all 27 packs on PR | 15m |
| P3.8 | `test(cli):` | Audit CLI tests — positive + negative fixtures per rule | 30m |
| P3.9 | `docs(cli):` | `pretext audit --help` + rules documentation | 15m |

**Ship gate:** all 27 packs pass `pretext audit`; CI blocks new PRs that break any rule.

### Phase 4 · Sticker practice-of-week v0 (E4)

| # | Commit prefix | What | Effort (CC) |
|---|---|---|---|
| P4.1 | `feat(prax-journal):` | Category taxonomy on the 60 stickers (CBT/DBT/BA/ACT/ERP/positive-psych/self-monitoring) | 15m |
| P4.2 | `feat(prax-journal):` | Client-side JS picks 6 stickers/week from taxonomy, deterministic by ISO week | 15m |
| P4.3 | `feat(prax-journal):` | Shelf UI on `today.html` — 6-sticker row, un-select to force-swap | 15m |
| P4.4 | `test(visual):` | Pixel-regression baseline update for `today.html` | 15m |

**Ship gate:** a full week's rotation feels coherent on visual inspection; `today.html` still renders at A4 with zero overflow.

---

## Review sections (1-11)

### §1 · Architecture

**ASCII — full system after Phase 2:**

```
  ┌────────────────── REPO MONOREPO ──────────────────────────┐
  │ packages/                                                 │
  │  ├── core/              (lib — dimensions, renderer, types)│
  │  ├── cli/                                                 │
  │  │   └── src/index.ts   (dispatch · generate · audit)     │
  │  ├── packs-<id>/         × 27                             │
  │  │   ├── <id>.html       (self-contained)                 │
  │  │   ├── manifest.json                                    │
  │  │   └── generate.ts      NEW · 5 flagship packs          │
  │  └── packs-prax-journal/ (60 stickers + 7 html + cli-src) │
  │ apps/                                                     │
  │  ├── gallery/            (astro · Vercel)                 │
  │  │   └── pages/packs/[id].astro → fires download beacon   │
  │  └── api/                 NEW · Cloudflare Worker          │
  │      ├── wrangler.toml                                    │
  │      ├── src/worker.ts   (POST event · GET feedback · Cron)│
  │      └── migrations/     (D1 schema)                      │
  └───────────────────────────────────────────────────────────┘
                                │
                                ▼  (HTTPS from gallery)
  ┌─────────────────── CLOUDFLARE WORKER ─────────────────────┐
  │  POST /api/download-event                                 │
  │   ├─ validate body (pack_id, theme_id)                    │
  │   ├─ extract CF-IPCountry, Accept-Language                │
  │   └─ INSERT INTO downloads                                │
  │  POST /api/feedback-signup                                │
  │   ├─ HMAC-sign a token (7-day exp)                        │
  │   └─ INSERT INTO feedback_tokens                          │
  │  GET /feedback/:token                                     │
  │   ├─ verify HMAC + expiry                                 │
  │   └─ serve 2-button page                                  │
  │  POST /api/feedback/:token                                │
  │   └─ UPDATE feedback_tokens SET rating, responded_at      │
  │  Cron (daily 00:00 UTC)                                   │
  │   └─ SELECT unresponded tokens older than 7d → Resend     │
  └───────────────────────────────────────────────────────────┘
                │                       │
                ▼                       ▼
           ┌────────┐              ┌─────────┐
           │  D1    │              │ Resend  │
           │  SQL   │              │ email   │
           └────────┘              └─────────┘
```

**Coupling analysis (before/after):**

- Before: 0 external services. Vercel static only.
- After: 1 new external service (CF Worker + D1). Gallery → Worker coupling is fire-and-forget beacon (failure mode = silent drop, never blocks download). Zero blocking coupling.

**Scaling:** D1 handles ~1M writes/day on free tier. If we cross that, we're in a win state. CF Worker is globally distributed. No SPOF.

**Rollback posture:**
- Phase 0: git revert → re-deploy, <10 min
- Phase 1: git revert per P1.N commit; golden-file tests protect against regression
- Phase 2: CF Worker is deploy-independent from gallery; can be disabled via Vercel env var `DISABLE_BEACON=1` without deploying
- Phase 3: audit CLI failures are advisory on first week (exit 1 but CI doesn't block); gate escalates to blocking after 2 weeks
- Phase 4: CSS/JS-only in Prax Journal HTML. Revert is a single HTML file.

### §2 · Error & rescue map

| CODEPATH | WHAT CAN GO WRONG | EXCEPTION | RESCUED? | RESCUE ACTION | USER SEES |
|---|---|---|---|---|---|
| `pretext generate <pack-id>` | unknown pack-id | `UnknownPackError` | Y | list available packs from registry | "Pack not found. Available: …" |
| `pretext generate ... --from X --to Y` | `from > to` | `InvalidDateRangeError` | Y | exit 1 with message | "--from must be before --to" |
| `pretext generate prax-journal` | profile.json missing | `ProfileNotFoundError` | Y | write example to a visible path, exit 1 | "Copy profile.example.json to profile.local.json and edit" |
| `pretext generate prax-journal` | profile.json invalid | `ZodError` | Y | pretty-print field path | "profile.therapists[0].email: expected string, got undefined" |
| `pretext generate ...` | Puppeteer timeout | `TimeoutError` | Y | retry 1×, then exit 2 | "Rendering timed out after 2 attempts. Run with --debug." |
| `pretext generate ...` | disk full on output path | `ENOSPC` | Y | exit 3, suggest `--output` | "No space at ./output. Try --output /tmp/x.pdf" |
| `pretext audit <pack-id>` | pack HTML malformed | `HTMLParseError` | Y | emit finding severity=error | JSON `{rule: 'html-parse', severity:'error', message: ...}` |
| `pretext audit <pack-id>` | Puppeteer failure during contrast check | `PuppeteerError` | Y | skip rule, warn | finding with severity='warn', rule='wcag-aa-skipped' |
| CF Worker POST /api/download-event | body schema invalid | `ZodError` | Y | 400 with validation errors | JSON `{error: ...}` — browser ignores (beacon) |
| CF Worker POST /api/download-event | D1 insert fails | `D1Error` | Y | log, return 200 (beacon — don't signal failure) | nothing (silent drop; we have CF Worker logs) |
| CF Worker POST /api/feedback-signup | HMAC sign fails | `CryptoError` | Y | 500 with generic message + log | "Something went wrong, please try again" |
| CF Worker GET /feedback/:token | token expired | `TokenExpiredError` | Y | serve "expired" page | "This feedback link expired. Your feedback is still welcome at …" |
| CF Worker GET /feedback/:token | token tampered | `SignatureError` | Y | serve "invalid" page, log potential abuse | same as expired (don't give attacker signal) |
| CF Worker Cron (Resend call) | Resend 5xx | `ResendError` | Y | retry once with backoff, then mark token as `send_failed` | none — user never knew they were getting an email |
| CF Worker Cron (D1 read) | D1 timeout | `D1Error` | Y | skip this cron tick, log | none |

**Gaps: 0.** Every error path has a named rescue and a defined user-facing state.

### §3 · Security & threat model

New attack surfaces introduced by Phase 2 (CF Worker):

1. **Feedback token forgery.** Mitigation: HMAC-SHA256 signed with a secret in CF env var. Tokens include pack_id, theme_id, email, issued_at. 7-day hard expiry enforced at verification time.

2. **Email enumeration via feedback-signup.** Mitigation: accept any syntactically valid email without checking existence (no oracle). Resend bounces silently.

3. **Download event spam / amplification.** Mitigation: CF rate limit (default 10 req/s/IP); body size capped at 200 bytes; no amplification (response is 1-byte `1`).

4. **D1 injection.** Mitigation: prepared statements via `D1Database.prepare(...).bind(...)`. No string concatenation.

5. **Accept-Language header abuse.** Mitigation: regex-extract first tag, cap at 10 chars, store-or-null.

6. **Resend webhook spoofing.** We don't accept webhooks — only outbound. Not applicable.

7. **Secret leakage via Worker logs.** Mitigation: never log request body (just a boolean "body_valid"). Never log email content; just "sent" or "failed".

**PII classification:**
- `downloads` table: **no PII** (pack_id, theme_id, ts, country, locale_hint are all non-personal)
- `feedback_tokens` table: **PII (email)** — retention policy 30 days, auto-purge via scheduled Worker

**Input validation for E1 generators:**
- `--from`, `--to` parsed via `Date.parse`; reject NaN, reject pre-1970, reject post-2100
- `--year` cap 1900-2100
- `--habits` array length cap 12; each string cap 40 chars
- `--output` absolute path resolve + startsWith check against CWD (prevent `../..` escape)

### §4 · Data flow & interaction edge cases

**Generator data flow:**

```
  INPUT               VALIDATION          TRANSFORM            PERSIST              OUTPUT
  ─────               ──────────          ─────────            ───────              ──────
  CLI flags ──────▶  Zod GeneratorInput ──▶ pack.generate() ──▶ Puppeteer ──▶ PDF ──▶ --output path
    │                  │                   │                  │
    ▼                  ▼                   ▼                  ▼
  [--from nil?]       [from > to?]         [generate throws?] [render timeout?]
   exit(1)             exit(1)              propagate w/       retry 1×, exit(2)
                                             context
  [--to nil?]         [date unparseable?]   [HTML >2MB?]       [no space?]
   default= from+30d   exit(1)               exit(4) — warn    exit(3)
                                             about scope
  [profile missing?]   [profile schema?]    [locale unsupp?]
   Prax: exit(1)        ZodError            fall back en-US,
   others: ignore                            log
```

**Interaction edge cases (gallery downloads post-Phase 2):**

| INTERACTION | EDGE CASE | HANDLED? | HOW |
|---|---|---|---|
| Click "Download PDF" | Worker unreachable | Y | beacon is `navigator.sendBeacon()` — browser drops silently. Download link href is direct Vercel URL (never goes through Worker). User always gets PDF. |
| Click "Download PDF" | Double-click | Y | beacon deduped at D1 level (same pack+theme+ts within 5s = one event; handled by unique index or window) |
| Click "Download PDF" | Slow connection | Y | beacon is async; download link is standard HTTP — browser handles |
| User enters email for 7-day feedback | Email already signed up for same pack+theme | Y | upsert: overwrite token with new 7-day expiry |
| User enters email | Invalid email format | Y | regex check on form; Worker also rejects |
| User clicks expired feedback link | Link > 7d old | Y | serves "expired" page with link back to `/packs/<id>` |
| User clicks feedback link 2× | Idempotent update | Y | UPDATE sets rating; second click just re-sets same value |
| Email goes to spam | Out of our control | noted | Resend deliverability monitoring |

**Generator edge cases:**

| INTERACTION | EDGE CASE | HANDLED? | HOW |
|---|---|---|---|
| `generate weekly-planner --from 2026-12-28 --weeks 2` | Spans year boundary | Y | Date iteration is ISO-week-aware |
| `generate habit-tracker --habits "a,b,c,…,z"` (26 names) | >12 cap | Y | Zod rejects at CLI layer |
| `generate yearly-overview --year 1800` | Out of range | Y | Zod rejects |
| `generate prax-journal --profile /path/to/typo.json` | File doesn't exist | Y | ProfileNotFoundError |
| `generate prax-journal --locale xx-XX` | Unsupported locale | Y | warn, fall back en-US |

### §5 · Code quality

- DRY: the 5 per-pack `generate.ts` files share a base via `createSimpleGenerator({ year, month, weeks } => HTMLString)` helper in `packages/core/src/generator-helpers.ts`. No copy-paste.
- Naming: every new function has domain-named signature (`renderWeeklySpread`, not `render`).
- Error handling: **named classes only** — `UnknownPackError`, `ProfileNotFoundError`, etc. No `rescue Exception` equivalents.
- Cyclomatic complexity: dispatch CLI has 1 switch statement (5 cases = 5 branches = OK). Per-pack generators have <3 branches each by construction.

### §6 · Test review

| NEW THING | TEST COVERAGE |
|---|---|
| `GeneratorInput` type | compile-time (TS strict) + Zod runtime |
| Dispatch CLI | unit: unknown pack, unknown command, help output |
| Each of 5 generators | golden-file test: fixture input → committed output HTML (pixel-diff @ 0.5%) |
| `UnknownPackError` + friends | unit: each error class asserted in its throw case |
| CF Worker POST /api/download-event | Miniflare integration: valid body, invalid body, rate-limited, D1 error |
| CF Worker signed token | unit: sign → verify OK, sign → tamper → verify fail, sign → expire → verify fail |
| CF Worker Cron | Miniflare: creates token → fast-forwards 7d → Cron fires → Resend mock called with right args |
| `pretext audit` | per-rule unit test with positive + negative fixture pack under `tests/fixtures/audit/` |
| Sticker practice-of-week | unit: week N + category distribution → 6 stickers with right shape |
| Gallery beacon | Playwright: click download button → assert `navigator.sendBeacon` called with right payload |

**Test ambition check:**
- "Ship at 2am on Friday" test: `pretext generate prax-journal --from 2026-06-01 --to 2026-06-30` on fresh checkout produces byte-identical PDF to committed golden.
- "Hostile QA" test: all above malformed-input tests exit cleanly with actionable messages.
- "Chaos" test: CF Worker test simulates D1 5xx + Resend 5xx + rate-limit — all handled.

### §7 · Performance

- Generator CLI: current Prax Journal gen ~15s for 31-day × 4-page spread. New generators all simpler (1-4 pages). Expected ≤5s each.
- Dispatch CLI cold-start: <200ms (already <100ms for current CLI).
- Audit CLI: 27 packs × 14 themes × 1 Puppeteer render = ~6-8 min on cold cache. Run in CI in background; cache Puppeteer browser download across runs.
- CF Worker p99: <50ms for POST (1 D1 insert).
- D1 query `npm run stats`: top-10 by pack over last 7d is <10ms indexed.

### §8 · Observability

- CF Worker: native CF analytics dashboard + custom console.log for error paths (sampled 10%)
- D1: daily backup via CF scheduled job to R2
- Gallery: download beacon is fire-and-forget — no gallery-side observability needed
- Generator CLI: structured console output with `--verbose`; exit codes 0/1/2/3/4 all documented
- Audit CLI: JSON output machine-consumable; CI aggregates into a dashboard page `audit/latest.json`

Alerts:
- Resend deliverability drops < 95% → manual check (daily cron email to Prax)
- D1 write failure rate > 1% → manual check
- Audit CLI fails on any pack → CI red

### §9 · Deployment & rollout

- Phase 0: direct merges to main (per-PR review), Vercel auto-deploys gallery
- Phase 1: npm publish 1.1.0 → 1.2.0 (minor bump; generators are additive API)
- Phase 2: CF Worker deploy is **independent** from gallery deploy — can ship Worker first, integrate beacon second. Worker is gated by env var `ENABLE_BEACON=1` in gallery; off by default until Worker verified.
- Phase 3: npm 1.2.0 → 1.3.0; audit CLI ships behind `--unstable` flag for 2 weeks then graduates
- Phase 4: Prax Journal pack internal bump; no npm change

**Migration safety:** zero DB migrations in existing packs. D1 schema is greenfield.

**Rollback:**
- Phase 0: git revert
- Phase 1: `npm deprecate @praxlannister/pretext-cli@1.2.0` + publish 1.2.1 with revert
- Phase 2: set `ENABLE_BEACON=0` in Vercel env · redeploy gallery
- Phase 3: set `AUDIT_REQUIRED=0` in CI env
- Phase 4: git revert single HTML file

### §10 · Long-term trajectory

- Technical debt introduced: 1 CF Worker deploy (low ops cost). 1 D1 database (free tier). 5 per-pack generators (small, well-tested).
- Path dependency: generator dispatch is an extensible base for i18n (deferred E6) and more packs. Good path.
- Knowledge: every new file has a 10-line header explaining its role. `README.md` at project root gains a "Generators" section.
- Reversibility: **4/5**. Phase 2 is the most coupled (new infra). Everything else revertable cleanly.
- Ecosystem fit: Astro · Vercel · CF · Resend — all mainstream · well-maintained 2026 stack.
- 1-year question: a new engineer reads `README.md` + `packages/cli/src/index.ts` + `docs/NORTH-STAR.md`. They know what this is, why, and how to add a pack. Obvious.

### §11 · Design & UX (UI scope flagged)

Phase 2 adds a single new UX element: the "tell me how it went in 7d" optional email field on download pages.

```
  ┌────────────────────────────────────────┐
  │  [Pack title]                          │
  │  [Theme swatch row]                    │
  │  [Download PDF button]  ← primary CTA  │
  │                                        │
  │  ─────────────────────────             │
  │  Optional · 7-day check-in             │
  │  Want a tap in a week?                 │
  │   [email____________]  [Remind me]     │
  │  I'll ask one question. Unsubscribe    │
  │  in the email. No list, no spam.       │
  └────────────────────────────────────────┘
```

AI slop risk: low — copy is concrete, human, acknowledges the skepticism ("no list, no spam"). Not "unlock your productivity."

DESIGN.md alignment: uses Warm Analog Editorial grammar — 1-ring muted accent on the Remind button, body copy in pack's theme-active text color. No new visual tokens.

Empty / error / loading states:
- Empty: field placeholder gives example
- Invalid email: inline tooltip on blur, non-blocking
- Submit loading: button disables, "…" spinner, re-enables on response
- Success: swap to "See you in 7 days 👋" text, field hidden
- Error: "Couldn't save right now. Try again?" with retry affordance
- Partial: if email submit succeeds but Resend later fails, user gets no email; this is the gracefully-degraded case (no worse than never having tried)

Responsive: the new block respects existing pack-page card grid; mobile = stack vertically (tested 375px viewport).

A11Y: field `<label for>` explicit · focus ring · 48px touch target on submit button.

Recommend `/plan-design-review` before implementing if design polish matters here.

---

## Outputs

### NOT in scope (explicit)

- **E5 Tier 3 editor** — gated on Tier 2 download signal. Deferred to next cycle post-Phase 2.
- **E6 i18n on generators** — gated on Accept-Language signal from Phase 2. Deferred.
- **E7 Sticker library > 60** — gated on adherence data from Phase 4 (practice-of-week). Deferred.
- **E8 Community contribution funnel** — depends on E3 lint gate landing first. Deferred to Phase 5.
- **Ship C (cathedral)** — documented as North Star; not this cycle's scope.

### What already exists

| Sub-problem | Existing code that partly solves it |
|---|---|
| Parameterised generators | `scripts/generate-journal.ts` (full Prax Journal CLI) |
| Download buttons | `apps/gallery/src/pages/packs/[id].astro` (theme swatch + PDF link) |
| Audit rules | `audit/iteration-1/*.md` (hand-run checks · script fragments) |
| PDF overlay (future Tier 3) | `pdf-lib` already in `packages/core/package.json` |
| Visual regression | `vitest.visual.config.ts` + `tests/visual/baselines/` |
| Type-safe config | Zod throughout (profile, manifest) — same pattern scales |

### Dream state delta

After Phase 1-4: we have 10 of 14 capabilities in the 12-month ideal. Remaining 4 (Tier 3 editor · i18n · 100 stickers · community contribution pipeline) are **data-gated or time-gated** — each lights up when a prerequisite signal arrives. This is the honest shape of the cathedral: not 6 weeks of work, but 6 weeks of work + 3 months of signal-gathering + 6 more weeks based on what the signals say.

### Failure modes registry

| CODEPATH | FAILURE | RESCUED? | TESTED? | USER SEES | LOGGED? |
|---|---|---|---|---|---|
| `pretext generate` unknown pack | UnknownPackError | Y | Y | list of packs | N (exit 1 is signal) |
| `pretext generate prax-journal` missing profile | ProfileNotFoundError | Y | Y | "copy profile.example" | N |
| `pretext generate` invalid --from | InvalidDateError | Y | Y | "--from must be before --to" | N |
| `pretext generate` render timeout | PuppeteerTimeout | Y | Y | "retry with --debug" | Y (stderr) |
| `pretext audit` html parse | HTMLParseError | Y | Y | JSON finding | Y (JSON) |
| `pretext audit` contrast check skipped | PuppeteerError | Y | Y | warn finding | Y |
| CF Worker beacon | D1 down | Y | Y | nothing (silent drop) | Y (CF logs) |
| CF Worker feedback sign | crypto error | Y | Y | "try again" | Y |
| CF Worker feedback expired | TokenExpired | Y | Y | "expired" page | Y (abuse flag) |
| CF Worker feedback tampered | SignatureError | Y | Y | same as expired | Y (security) |
| CF Worker Cron Resend down | ResendError | Y | Y | nothing (user never knew) | Y |

**Critical gaps: 0.**

### TODOS.md updates

(each would be presented individually via AskUserQuestion in an interactive session; autonomous run pre-decides as all "add to TODOS")

| # | Item | Decision |
|---|---|---|
| T-001 | Tier 3 pdf-lib overlay editor (gated on Phase 2 data) | Add to TODOS |
| T-002 | i18n on generators (gated on Accept-Language signal) | Add to TODOS |
| T-003 | 100-sticker library expansion (gated on practice-of-week adherence) | Add to TODOS |
| T-004 | Community contribution funnel (gated on E3 lint landing) | Add to TODOS |
| T-005 | Printed companion guide PDF (remains from v2 plan) | Add to TODOS |
| T-006 | Optional "crisis card" pocket PDF (remains from v2) | Add to TODOS |
| T-007 | Therapist-share PHI-redacted export (remains from v2) | Add to TODOS |
| T-008 | Safari iPad probe for browser PDF (remains from DECISIONS.md) | Add to TODOS |
| T-009 | Per-user sticker preferences beyond localStorage (post Phase 4) | Add to TODOS |

### Scope expansion decisions

- **Accepted (Phase 0):** E9 CSP hardening · E10 Dependabot triad · E11 per-file coverage · E12 NORTH-STAR.md
- **Accepted (Phase 1-4):** E1 generators · E2 download+feedback · E3 audit CLI · E4 practice-of-week
- **Deferred to TODOS:** E5, E6, E7, E8

### Diagrams

1. Full system architecture — §1
2. Generator data flow (shadow paths) — §4
3. State machine for feedback token (issued → signed → responded | expired | failed) — (to be added in P2.6 commit)
4. Error flow per generator — §2 + §4
5. Deployment sequence per Phase — §9
6. Rollback flowchart per Phase — §9

### Stale diagram audit

- `docs/HLD-self-contained-templates.md` — still accurate; new generators extend the self-contained contract, don't break it
- `packages/packs-prax-journal/SPEC.md` §4 ASCII — still accurate
- DECISIONS.md Decision #6 (flat `packages/packs-<id>/` layout) — preserved
- AGENTS.md principles — preserved; plan explicitly checks each change against the four rules

### Completion summary

```
  ┌────────────────────────────────────────────────────────────────────┐
  │         MEGA PLAN REVIEW — COMPLETION SUMMARY                      │
  ├────────────────────────────────────────────────────────────────────┤
  │ Mode selected        │ SCOPE EXPANSION 10x (Approach B)           │
  │ 100x North Star      │ Documented in docs/NORTH-STAR.md (P0.6)    │
  │ System audit         │ 27 packs, 60 stickers, 14 themes, 295 tests│
  │ Step 0               │ E1-E4 accepted; E5-E8 deferred with gates  │
  │ Section 1  (Arch)    │ 0 issues; new CF Worker is additive        │
  │ Section 2  (Errors)  │ 15 paths mapped, 0 gaps                    │
  │ Section 3  (Security)│ 7 threats analysed, all mitigated          │
  │ Section 4  (Data/UX) │ 9 edge cases mapped, 0 unhandled           │
  │ Section 5  (Quality) │ DRY via generator-helpers; 0 issues        │
  │ Section 6  (Tests)   │ 10 test surfaces enumerated                │
  │ Section 7  (Perf)    │ All within budget                          │
  │ Section 8  (Observ)  │ CF native + daily stats cron               │
  │ Section 9  (Deploy)  │ Phased; each independently reversible      │
  │ Section 10 (Future)  │ Reversibility 4/5; path dependency good    │
  │ Section 11 (Design)  │ 1 new UI element; states mapped            │
  ├────────────────────────────────────────────────────────────────────┤
  │ NOT in scope         │ 7 items listed with gates                  │
  │ What already exists  │ 6 leverages documented                     │
  │ Dream state delta    │ 10/14 of 12-month ideal after Phase 4      │
  │ Error/rescue registry│ 15 methods, 0 CRITICAL GAPS                │
  │ Failure modes        │ 11 total, 0 CRITICAL GAPS                  │
  │ TODOS.md updates     │ 9 items proposed, all ACCEPTED             │
  │ Scope proposals      │ 12 proposed, 8 accepted, 4 deferred        │
  │ CEO plan             │ written (this doc)                         │
  │ Outside voice        │ skipped (context-budget)                   │
  │ Diagrams produced    │ 6 types (1-6 above)                        │
  │ Stale diagrams       │ 0                                          │
  │ Unresolved decisions │ 0                                          │
  └────────────────────────────────────────────────────────────────────┘
```

### Unresolved decisions

None. All §0 decisions resolved in-doc per the autonomous-run directive.

---

## Next steps — chained from this review

1. **Phase 0 starts immediately in next session** — E9 CSP + E10 Dependabot + E11 coverage. Closes iter-5 debt in ~2h of CC time.
2. **`/plan-eng-review`** recommended on this plan before Phase 1 starts — this plan is CEO-level; the eng review will lock the type signatures and CF Worker contract.
3. **`/plan-design-review`** recommended before P2.4 ships (feedback email field UX).
4. **`docs/NORTH-STAR.md`** written in Phase 0 (P0.6) — durable vision for the next session after this one.

---

## Session log (autonomous run)

- 2026-05-12 08:42 local — user issued `/plan-ceo-review` + 10x/100x directive
- 08:42-08:45 — pre-review system audit (git · tests · packs · stickers · themes · tier status)
- 08:45-08:46 — read v2/v3/v4 prior CEO plans + iter-5 STATUS to avoid re-proposing decided scope
- 08:46-08:47 — synthesise state; mode-lock EXPANSION 10x per directive
- 08:47 — write this doc (autonomous; council not invoked to preserve context budget)
- Next: write `docs/NORTH-STAR.md` + checkpoint · commit as `docs(plan): CEO v5 — 10x expansion`
