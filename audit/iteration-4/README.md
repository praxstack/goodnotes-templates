# Iteration-4 audit · index

> **Date:** 2026-05-11 · **HEAD:** `2529d90` — "feat(customisation): Tier 2 themes — 378 pre-rendered themed PDFs + gallery swatch picker"
> **Auditor:** CodeBaseGPT-Pro (9-phase protocol) via Cline
> **Scope:** Full repository re-audit after the W5 monorepo migration, the
> `apps/gallery` addition, and the v1.0.0 npm ship.
>
> Previous audits: iteration-1 (2026-04-18 breadth), iteration-2 (depth),
> iteration-3 (adversarial). 23 of 27 original findings were closed; post-sprint
> status documented in `audit/POST_SPRINT_STATUS.md`.

## What's in this folder

| File | What it is |
|---|---|
| [`CODEBASE_AUDIT_REPORT.md`](./CODEBASE_AUDIT_REPORT.md) | The main report — executive summary, findings by dimension, roadmap summary. Start here. |
| [`CODEBASE_AUDIT_REPORT.json`](./CODEBASE_AUDIT_REPORT.json) | Machine-readable version of the same findings. |
| [`findings.md`](./findings.md) | Full finding detail — file·line, evidence, recommendation, effort per item. |
| [`architecture.md`](./architecture.md) | Current monorepo topology, dependency graph, what changed since iter-1. |
| [`IMPLEMENTATION_ROADMAP.md`](./IMPLEMENTATION_ROADMAP.md) · [`.csv`](./IMPLEMENTATION_ROADMAP.csv) | Sprint-sized backlog with priorities + effort estimates. |
| [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) | Coverage-gap analysis and pyramid plan. |
| [`SLIDE_OUTLINE.md`](./SLIDE_OUTLINE.md) | Stakeholder-facing deck outline. |
| [`phase-validation.md`](./phase-validation.md) | The 9-phase validation checklist as prescribed by the audit protocol. |

## TL;DR

The 9-day-old tool audited in iteration-1 has matured into a three-workspace
monorepo (~19.6k TS LOC, 29 pack packages, 48 HTML templates, published
`@praxlannister/pretext-*` v1.0.0 on npm, live gallery at
`pretext-templates.vercel.app`, 235 passing unit tests). Iter-1/2/3 findings
are well-addressed: CI gates, Chromium sandbox, symlink traversal, signed
releases, PII schema — all closed and covered by regression tests.

Iteration-4 finds **1 new critical** (PII committed to git via stale
`.gitignore` after monorepo migration) and **4 medium-severity regressions**
that were introduced by subsequent growth (npm-audit drift from the gallery,
ESLint globbing no longer matches post-W5 paths, coverage threshold failure,
gallery lacks CSP). All are cheap to close: ~1 P0 day + ~3 P1 days.

## Health grade · **B**

Up from C+ at iter-1 thanks to the closed findings. Held below A by the one
P0 (PII in repo is a policy violation, not a bug), and the creeping drift
in tool gates that should have caught the regressions automatically.

## Quick links

- [Executive dashboard](./CODEBASE_AUDIT_REPORT.md#1-executive-dashboard)
- [New critical finding (FIND-I4-001)](./findings.md#find-i4-001--pii-committed-to-git-critical)
- [Roadmap Sprint 1 (P0 day)](./IMPLEMENTATION_ROADMAP.md#sprint-1--1-day--p0-only)
