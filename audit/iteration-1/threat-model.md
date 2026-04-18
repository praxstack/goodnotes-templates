# Phase 4 — Threat Model (STRIDE)

## Scoping

Attacker profiles considered:

- **P1 — Internet attacker on the same Wi-Fi as a developer running `npm run preview`** (preview HTTP server)
- **P2 — Malicious PR contributor** who adds a crafted HTML template
- **P3 — Compromised upstream npm package** (supply chain)
- **P4 — Local low-priv user on the developer machine** (file access via the HTTP server)

LINDDUN is **not applicable** (no PII / user data flows).

## Trust boundaries (from Phase 0 §4)

- TB-1: CLI flags → file I/O
- TB-2: HTTP `GET /*` → local filesystem (`output/` dir)
- TB-3: HTML-on-disk → Chromium process (`--no-sandbox`)
- TB-4: npm registry → local `node_modules`

## Threat catalogue

| # | STRIDE | Threat | Where | Attacker | Preconditions | Existing mitigation | Residual |
|---|---|---|---|---|---|---|---|
| T-01 | **I**nfo disclosure | Path traversal via HTTP GET exfiltrates files outside `output/` | `preview-server.ts:25-62` | P1 | Preview server running, P1 on same LAN | `path.resolve` + `startsWith(absDir + path.sep)` check at line 39 | **Low** — guard looks correct; Iteration 2 will re-inspect symlink edge cases |
| T-02 | **T**ampering | XSS via filename in generated gallery HTML | `preview-server.ts:95-106` | P4 (writes a file `<svg onerror=…>.pdf` to `output/`) | Preview server running + served from a dir where P4 can write | Bespoke `esc()` at line 95 replaces `& < > "`. Does NOT escape `'`. Path is URL-encoded via `encodeURI`, not encodeURIComponent, so `?#` can truncate the path attribute | **Medium** — unescaped `'` in HTML-attribute context can break out with a crafted filename on certain renderers. Fix: use a real escape or restrict filename chars to `[A-Za-z0-9._-]` on ingest |
| T-03 | **D**oS | HTTP server has no rate-limit, no connection cap | `preview-server.ts:25` | P1 | Preview running | None; Node's default max listeners | **Low** — impact = developer's local machine; attacker gains nothing lasting |
| T-04 | **I**nfo disclosure | Preview server binds to `0.0.0.0` (Node default for `server.listen(port)` without host arg) | `preview-server.ts:65` | P1 (same LAN) | `npm run preview` invoked | **None** — host arg is missing | **Medium** — on shared networks (coffee shops, conferences) the gallery is browsable by anyone on-LAN. Fix: bind `127.0.0.1` by default; add `--host` flag to opt out |
| T-05 | **E**levation | Crafted HTML template exercises Chromium browser bug while `--no-sandbox` is set | `puppeteer-renderer.ts:32-38` → `--no-sandbox` | P2 or P3 (malicious template or compromised dep that writes one) | Malicious HTML rendered via Puppeteer; Chromium bug exists | Nothing; sandbox is explicitly off | **Low-Medium** — today all templates are in-repo and reviewed. Future: once this supports 3rd-party templates (roadmap item), raise to High. Fix: drop `--no-sandbox` outside CI/Docker |
| T-06 | **T**ampering | SSRF via Puppeteer `waitUntil: 'networkidle0'` — rendered HTML loads arbitrary URLs | `puppeteer-renderer.ts:124` | P2 (malicious template) or P3 | Template `<link href="http://attacker/...">` added | None; no URL allow-list | **Low** — the HTML rendered is in-repo, reviewed. Escalates if rendering ever accepts external HTML via CLI. Fix: intercept `page.on('request')` and allow-list `fonts.googleapis.com` / `fonts.gstatic.com` / `data:` |
| T-07 | **T**ampering | PDF post-processor crashes on hostile input PDF | `pdf-postprocess.ts:64` (`PDFDocument.load`) | P3 (malicious PDF dropped in output/ via compromised script) | Script reads arbitrary PDF | Inputs are only Puppeteer outputs today, not user-supplied | **Low** |
| T-08 | **I**nfo disclosure | Puppeteer launches with default user data dir; cache persists between runs | `puppeteer-renderer.ts:30` | P4 | Multi-user machine | Default is `/tmp/puppeteer_dev_chrome_profile-*` per Puppeteer docs | **Low** |
| T-09 | **S**poofing | CI actions pinned by tag (`@v4`), not by commit SHA | `.github/workflows/generate.yml` | P3 (action maintainer publishes a bad `v4` tag) | Any release | None | **Medium** — industry-standard drive-by risk. Fix: pin by commit SHA + dependabot to update |
| T-10 | **T**ampering | Release artifacts unsigned (no cosign/sigstore/PGP) | Workflow `release` job | P3 (GH token compromise) | GH account takeover | None | **Medium** — escalates as the project gains adopters. Fix: add `cosign sign-blob` step |
| T-11 | **E**levation | npm supply-chain — `basic-ftp` transitive (SC-V-01) has CRLF→FTP cmd injection | Phase 2 §2.2 | P3 | Exploit requires `basic-ftp` to be exercised with attacker-controlled URIs — this repo never does | Not exercised by this code path | **Very Low** — track for general hygiene; `npm audit fix` closes |
| T-12 | **R**epudiation | No action log for `npm run generate` runs that land on disk | — | — | — | None — not applicable; build output is diff-visible in git. | **Very Low** |

## Priority-ranked threats

Ordered by likelihood × impact (rough ranking, not a formal CVSS):

| Rank | ID | Rationale |
|---|---|---|
| 1 | **T-04** | Preview server on 0.0.0.0 — immediate, common, fix is 1 line |
| 2 | **T-02** | XSS via filename in gallery — fix is small, concrete, path exists today |
| 3 | **T-05** | `--no-sandbox` Chromium — low probability today, but severity grows as project opens to 3rd-party templates |
| 4 | **T-09** | Unpinned CI actions — standard supply-chain hygiene |
| 5 | **T-10** | Unsigned releases — relevant once the repo publishes outside its own org |
| 6 | **T-06** | SSRF via `networkidle0` — contingent on (2) and on external HTML becoming a real input |

## What this feeds Phase 5 & Phase 6

- Phase 5 will line-by-line `preview-server.ts`, `puppeteer-renderer.ts`, `pdf-postprocess.ts` for **T-01 / T-02 / T-04 / T-05 / T-06 / T-07** in the form of concrete findings with file:line citations and code snippets.
- Phase 6 will score the CI workflow against **T-09 / T-10** and against the missing quality-gate dimension (no `npm test` on PR).
