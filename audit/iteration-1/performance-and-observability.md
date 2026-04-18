# Phase 7 — Performance & Observability

## What can be assessed statically

### Algorithmic complexity

| Module | Hot path | Complexity | Notes |
|---|---|---|---|
| `daily-year-v2.ts` | `generateAllMonths` | O(N) over 365 days × 6 page inject replacements | Fine |
| `daily-year-v2.ts` | `parseSinglePageTemplate` | O(L) over HTML length | Fine, but FIND-0012 flags correctness over perf |
| `pdf-postprocess.ts` | `addHyperlinks` | O(L) over link count, each a PDF obj allocation | Fine |
| `pdf-postprocess.ts` | `mergePDFs` | O(P) over total pages, `pdf-lib copyPages` per doc | Fine |
| `svg-renderer.ts` | `generateStickerSVG` switch | O(1) per sticker | Fine |
| `preview-server.ts` | `scan` (recursive directory walk) | O(N) over output files | Synchronous at HTTP request time — bad if `output/` is large |

### Performance smells found

- **P-01 (`src/cli/preview-server.ts:74-90`) — gallery is re-scanned per page load.** `scan()` walks the entire `output/` tree on every `/` request. With 840+ generated files (per CHECKPOINT), this is several thousand syscalls per page refresh. **Severity: Low.** Fix: cache scan results with a short TTL or fs.watch invalidation.
- **P-02 (`src/core/puppeteer-renderer.ts:123`) — `waitUntil: 'networkidle0'` can hang 30 s or 120 s.** A single slow font fetch extends a full-year run (12 months × multi-page, each timed at 120 s) to potentially 24 minutes idle-wait. FIND-0004 / FIND-0014 address the root cause (remove online fetches).
- **P-03 (`src/core/pdf-postprocess.ts:172`) — each bookmark allocates a fresh PDFDict + PDFString.** For a full-year planner with a bookmark per day (~365) this is fine. For a bookmark-per-page design (~2000) allocations start to matter. Not currently a bottleneck.
- **P-04 (`src/templates/planners/daily-year-v2.ts:529-537`) — `/<style[^>]*>([\\s\\S]*?)<\\/style>/g` uses stateful `re.exec` with non-reset `lastIndex`.** The helper is locally scoped and `let m` + recreated regex per call — **correctly used** here. Not a bug. Logged for awareness.

### What cannot be assessed without profiling

- **Core Web Vitals (LCP / INP / CLS) — NOT MEASURED.** This project produces PDFs for GoodNotes, not a web UI; the only web surface (`preview-server.ts`) is a dev tool. CWV do not apply in the shipping artifact.
- **Actual build time for `npm run generate` — NOT MEASURED.** CHECKPOINT.md claims "9.5 seconds for 840 files" (C-23). Not verified in this audit iteration (would require running generate, 5–15 min compute).
- **Memory use under full-year generation** — `NOT MEASURED`. The monthly-batching strategy in `daily-year-v2.ts` is explicitly the anti-OOM mitigation; effective unless Puppeteer's accumulated Chromium cache balloons.
- **Bundle size / LCP / INP / CLS on `preview-server.ts` gallery** — NOT MEASURED and intentionally out of scope (dev tool).

## Observability

### Logging

| Aspect | Status |
|---|---|
| Log destination | `console.log` / `console.error` / `console.warn` — stdout/stderr |
| Structured logging | None (JSON, ndjson, pino, etc.) |
| Log levels | Implicit (`warn`, `error`) — no debug/verbose level |
| Correlation IDs | Absent (single-process build tool; arguably unnecessary) |
| PII in logs | Spot-check: no PII patterns found (email/phone/SSN/IP) — see Phase 7.5 |

### Metrics / tracing

- **No RED/USE metrics emitted** — acceptable for a build tool.
- **No OpenTelemetry instrumentation** — acceptable.
- **No W3C `traceparent` propagation** — N/A (no distributed traces).
- **No DORA metrics** — this is a build tool, not a deployed service. `NOT APPLICABLE`.

### Alerting

`NOT APPLICABLE` — build tool, no runtime alerts.

### Error visibility

- `batchRenderHTML` silently drops failures (FIND-0017). Other scripts have inconsistent `process.exit(1)` usage on failure.
- `console.warn` on hyperlink / bookmark out-of-range (`pdf-postprocess.ts:69,73,156`). Good — user sees the warning. Not structured.

## Summary

Performance is adequate for the current feature set. The primary latency source is Google Fonts network dependency (P-02 → FIND-0004/14). Observability is minimal but proportionate to a local build tool; only the batch-error silent drop is worth addressing.
