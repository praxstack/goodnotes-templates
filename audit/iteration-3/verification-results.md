# CODEX-AUDIT v1.1 — Iteration 3 Adversarial Verification

**Generated:** 2026-04-18
**Repo HEAD:** 6603b06c6d70c800deeab58b40185f5e51fe9750
**Scope:** Try to disprove all 27 findings from iteration-1 (21) + iteration-2 (6). Classification: `confirmed | refuted | inconclusive`.

Summary table first; evidence per finding below.

| ID | Title (truncated) | Severity | Verdict | Confidence |
|---|---|---|---|---|
| FIND-0001 | Preview server binds 0.0.0.0 | Medium | **confirmed** | high |
| FIND-0002 | esc() misses single-quote | Medium | **confirmed (severity overstated)** | high |
| FIND-0003 | Chromium --no-sandbox unconditional | Medium | **confirmed** | high |
| FIND-0004 | networkidle0 + no URL allow-list | Low | **confirmed** | high |
| FIND-0005 | basic-ftp HIGH CVE | High | **confirmed (not reachable; sev overstated)** | high |
| FIND-0006 | vitest 2.x moderate CVEs | Medium | **confirmed** | high |
| FIND-0007 | 8 unused prod deps | Medium | **confirmed** | high |
| FIND-0008 | CI does not gate merges | High | **confirmed** | high |
| FIND-0009 | GH Actions pinned by tag | Medium | **confirmed** | high |
| FIND-0010 | Release artifacts unsigned | Low | **confirmed** | high |
| FIND-0011 | tsc --noEmit fails | High | **confirmed** | high |
| FIND-0012 | Bespoke HTML parser fragile | Medium | **confirmed** | high |
| FIND-0013 | Doc drift to deleted files | Medium | **confirmed** | high |
| FIND-0014 | Google Fonts claim mismatch | Medium | **confirmed** | high |
| FIND-0015 | Color-mode resolver duplicated | Low | **confirmed** | high |
| FIND-0016 | Zero tests on T1 modules | Medium | **confirmed** | high |
| FIND-0017 | batchRenderHTML silent failures | Low | **confirmed** | high |
| FIND-0018 | Dark-mode parity 11/32 templates | Medium | **confirmed** | high |
| FIND-0019 | package.json repository.url stub | Low | **confirmed** | high |
| FIND-0020 | Missing THIRD_PARTY_LICENSES for libvips LGPL | Low | **confirmed** | high |
| FIND-0021 | preview server no Cache-Control / ETag | Low | **confirmed** | high |
| FIND-0022 | Symlink path-traversal POC | High | **confirmed (POC reproduced)** | high |
| FIND-0023 | NUL/backslash unfiltered | Low | **partially refuted (sev downgraded)** | medium |
| FIND-0024 | addHyperlinks no rect validation | Low | **confirmed** | high |
| FIND-0025 | Puppeteer browser singleton race | Low | **confirmed (latent; not exercised today)** | high |
| FIND-0026 | addBookmarks silent pageIndex clamp | Low | **confirmed** | high |
| FIND-0027 | SVG text interpolation unescaped (dormant) | Low | **confirmed (dormant / not reachable today)** | high |

**Totals:** confirmed=26 · partially refuted=1 · refuted=0 · inconclusive=0.
No finding fully refuted. Two findings (FIND-0005, FIND-0023) had severity/impact overstated relative to in-context exploitability; annotations below.

---

## FIND-0001 — Preview server binds 0.0.0.0 (Medium) — **confirmed**

**Evidence (src/cli/preview-server.ts:65):**
```ts
server.listen(port, () => {
  console.log(`  Preview server running at http://localhost:${port}`);
```
`http.Server.listen(port, cb)` (no `host` arg) binds to all interfaces per Node docs. Citation accurate. Console message says `localhost` — misleading. No mitigating control elsewhere (no firewall / loopback bind). **Verdict confirmed.**

## FIND-0002 — Bespoke HTML escape misses single-quote (Medium) — **confirmed (severity slightly overstated)**

**Evidence (src/cli/preview-server.ts:95):**
```ts
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
```
No `'` replacement — citation accurate.

**Adversarial check — is there a mitigating control?** Yes, partially. All current sinks use double-quoted attributes (`alt="${name}"`, `src="${href}"`, `href="${href}"`) and `href` is wrapped in `encodeURI()` on line 101. Also the `esc()` output is placed inside `<img alt=...>` and `<span>...`, `<a>...` text contexts. With double-quoted attributes, a lone `'` is not weaponizable today. The reproduction in the finding (breaking out of `src=""` via `'`) is **not** achievable because `src` uses `${href}` which is `encodeURI`'d, not the raw `${name}`.

Still — the underlying bug (incomplete escape) is real, and a future edit that switches to single-quoted attributes would make it exploitable. Finding stands as defensive-programming fix; severity Medium is on the high side for in-context exploitability (Low would be more calibrated), but the Medium rating is defensible for a library context and PR-fragility risk. **Verdict confirmed with severity caveat.**

## FIND-0003 — Chromium --no-sandbox unconditional (Medium) — **confirmed**

**Evidence (src/core/puppeteer-renderer.ts:28-40):** literal `'--no-sandbox'` and `'--disable-setuid-sandbox'` in the args array with no `process.env.CI`/Docker gate. **Verdict confirmed.**

## FIND-0004 — networkidle0 + no URL allow-list (Low) — **confirmed**

**Evidence:** `src/core/puppeteer-renderer.ts:123-126` literal `waitUntil: 'networkidle0'`. `grep -c fonts.googleapis.com src/templates/html/*.html` — all 32 HTML templates match (output sampled: `adhd-gentle-daily.html:7`, `adhd-gentle-daily.html:8`, `adhd-gentle-monthly.html:7,8`, `adhd-gentle-weekly.html:8`, …). No `page.setRequestInterception` or allow-list anywhere in codebase. **Verdict confirmed.**

## FIND-0005 — basic-ftp HIGH CVE (High) — **confirmed (severity overstated for in-context exploitability)**

**Evidence:** `audit/_runtime/tool-outputs/npm-audit.json` → `$.vulnerabilities."basic-ftp"` lists GHSA-6v7q-wjvx-w8wg (CVSS 8.2) and GHSA-rp42-5vxx-qpwr (CVSS 7.5), both fix available. Confirmed present.

**Adversarial check — reachability?** `basic-ftp` is transitive only via `puppeteer@23 → extract-zip → basic-ftp`, which is used only if Puppeteer downloads Chromium over FTP — not exercised by this project. The finding itself acknowledges in-context exploitability is near-zero (confidence="medium"). Severity tag "High" inherits from upstream advisory; real in-context severity is Low. **Verdict confirmed** (vulnerability exists in tree and should be fixed via `npm audit fix`); the severity inheritance is correctly flagged.

## FIND-0006 — vitest 2.x moderate CVEs (Medium) — **confirmed**

**Evidence:** npm-audit.json lists 5 moderate advisories (`@vitest/mocker`, `esbuild`, `vite`, `vite-node`, `vitest`), all resolving to `fixAvailable: { name: "vitest", version: "4.1.4", isSemVerMajor: true }`. `package.json:69` pins `"vitest": "^2.1.8"`. **Verdict confirmed.**

## FIND-0007 — 8 unused prod deps (Medium) — **confirmed**

**Evidence:** `depcheck.json.dependencies` = `["pdfkit","@svgdotjs/svg.js","svgdom","chalk","ora","glob","handlebars","fontkit"]` — exactly 8 prod deps.

**Adversarial check — did depcheck miss dynamic requires / re-exports?** Ran `rg "from ['\"](chalk|ora|glob|handlebars|pdfkit|fontkit|svgdom|@svgdotjs/svg.js)['\"]" src/ scripts/` → **0 results** (import-form hits).

**Extra check for `require()`/dynamic import:** `rg -c "(handlebars|pdfkit|@svgdotjs|svgdom|chalk|ora|glob|fontkit)" src/ scripts/` — the matches that did appear were all in string literals (e.g. README/source references in CSS `font-family: "JetBrains Mono"` or the word "fontkit" in no context). No import/require statements. depcheck result stands. **Verdict confirmed.**

## FIND-0008 — CI does not gate merges (High) — **confirmed**

**Evidence:** `.github/workflows/` contains one file (`generate.yml`) with `on: push:branches:[main], workflow_dispatch` — no `pull_request` trigger; no `test`/`lint`/`audit`/`build` step. The single job runs `npm ci` then `npx tsx src/cli/index.ts generate --pages --stickers --verbose`. No branch-protection workflow detected. **Verdict confirmed.**

## FIND-0009 — GH Actions pinned by tag (Medium) — **confirmed**

**Evidence:** `.github/workflows/generate.yml` — literal uses:
- `actions/checkout@v4` (line 20, line 60)
- `actions/setup-node@v4` (line 22)
- `actions/upload-artifact@v4` (line 43)
- `actions/download-artifact@v4` (line 62)
- `softprops/action-gh-release@v2` (line 77)

All tag-pinned; no full-SHA pins. **Verdict confirmed.**

## FIND-0010 — Release artifacts unsigned (Low) — **confirmed**

**Evidence:** `.github/workflows/generate.yml:76-96` — the release step uploads `goodnotes-templates-assets.zip` via `softprops/action-gh-release@v2` with no accompanying cosign/sigstore/gpg/intoto/SLSA step. `rg -n "cosign|sigstore|intoto|slsa-framework|gpg " .github/workflows/` → 0 hits. **Verdict confirmed.**

## FIND-0011 — tsc --noEmit fails (High) — **confirmed**

**Evidence (audit/_runtime/tool-outputs/tsc-noemit.log, re-run locally):**
```
src/core/puppeteer-renderer.ts(129,31): error TS2584: Cannot find name 'document'. Do you need to change your target library? Try changing the 'lib' compiler option to include 'dom'.
src/templates/registry.ts(12,46): error TS1470: The 'import.meta' meta-property is not allowed in files which will build into CommonJS output.
```
Exactly as claimed. `npm run build` therefore fails. **Verdict confirmed.**

## FIND-0012 — Bespoke HTML parser fragile (Medium) — **confirmed**

**Evidence (src/templates/planners/daily-year-v2.ts:119-152):** literal regex `/<body[^>]*>/`, `/<div\s+class="page"[^>]*>/`, then hand-rolled depth-counting loop (`<div` +1, `</div>` -1). No handling of `<!--`, `<DIV`, CDATA, `<div class='page'>` (single-quoted attribute), or inline `<style>div {…}</style>`. Citation exact. **Verdict confirmed.**

## FIND-0013 — Doc drift to deleted files (Medium) — **confirmed**

**Evidence:** `ls src/core/` → `dimensions.ts`, `pdf-postprocess.ts`, `png-renderer.ts`, `puppeteer-renderer.ts`, `svg-renderer.ts`. No `themes.ts`, `renderer.ts`, `pdfkit-renderer.ts`. `grep -n 'themes\.ts\|pdfkit-renderer\.ts\|renderer\.ts' README.md CONTRIBUTING.md`:
- README.md:153-157 references `themes.ts`, `renderer.ts`, `pdfkit-renderer.ts` in the Architecture block
- CONTRIBUTING.md:20, 29, 33, 36, 41 references `themes.ts`, `pdfkit-renderer.ts`, `renderer.ts`

All five documentation references point to files that do not exist on disk. **Verdict confirmed.**

## FIND-0014 — Google Fonts claim mismatch (Medium) — **confirmed**

**Evidence:** `grep -c 'fonts.googleapis.com' src/templates/html/*.html` — positive matches across the HTML templates. Combined with `page.setContent(…, { waitUntil: 'networkidle0' })` in `puppeteer-renderer.ts:123-126`, renderer requires outbound network. `package.json:25` declares `"fonts:download": "tsx scripts/download-fonts.ts"`, but `scripts/download-fonts.ts` **does not exist** on disk — so the self-hosting path is not implemented. **Verdict confirmed** (strengthens the finding — the alleged escape hatch is vaporware).

## FIND-0015 — Color-mode resolver duplicated (Low) — **confirmed**

**Evidence:** `src/core/puppeteer-renderer.ts:92-107` and `scripts/generate-4week.ts:81-93` both implement the "preset theme CSS → sibling CSS fallback" two-step resolution for `colorMode`. Literal duplication of the pattern. **Verdict confirmed.**

## FIND-0016 — Zero tests on T1 modules (Medium) — **confirmed**

**Evidence:** `ls tests/unit/` → exactly 3 files: `daily-year-v2.test.ts`, `dimensions.test.ts`, `locale.test.ts`. `tests/visual/` is empty. No test file targets `preview-server.ts`, `puppeteer-renderer.ts`, or `pdf-postprocess.ts`. **Verdict confirmed.**

## FIND-0017 — batchRenderHTML silent failures (Low) — **confirmed**

**Evidence (src/core/puppeteer-renderer.ts:195-204):**
```ts
try {
  const result = await renderHTMLToPDFFile(…);
  results.push({ ...result, name: t.name });
} catch (err) {
  console.error(`  ✗ ${t.name}: ${err instanceof Error ? err.message : err}`);
}
return results;
```
Errors are logged and discarded; return shape does not include failure array or counter. Caller has no programmatic way to see partial success. **Verdict confirmed.**

## FIND-0018 — Dark-mode parity 11/32 (Medium) — **confirmed**

**Evidence:** `ls src/templates/html/*.html | wc -l` → **32**. `ls src/templates/html/*.dark.css | wc -l` → **11**. Ratio matches finding exactly (34% dark-mode parity). **Verdict confirmed.** Contrast itself was not measured in iteration 3 either; the recommendation to audit remains valid.

## FIND-0019 — package.json repository.url stub (Low) — **confirmed**

**Evidence:** `package.json:45-48`:
```
"repository": { "type": "git", "url": "https://github.com/yourusername/goodnotes-templates" }
```
`README.md:76` likewise: `git clone https://github.com/yourusername/goodnotes-templates.git`. `CONTRIBUTING.md:8` same. Actual origin per workspace metadata is `https://github.com/praxstack/goodnotes-templates.git`. **Verdict confirmed.**

## FIND-0020 — Missing THIRD_PARTY_LICENSES for libvips LGPL (Low) — **confirmed**

**Evidence:** `grep sharp-libvips audit/_runtime/tool-outputs/licenses-prod.json` → match at key `@img/sharp-libvips-darwin-arm64@1.0.4`. Repo root `ls NOTICE THIRD_PARTY_LICENSES licenses.md 2>&1` → all three missing. Only `LICENSE` (MIT) present. **Verdict confirmed.**

## FIND-0021 — preview server no Cache-Control / ETag (Low) — **confirmed**

**Evidence (src/cli/preview-server.ts:53-57):** `'Cache-Control': 'no-cache'` for valid responses; 404 path (lines 59-62) emits no Cache-Control or ETag at all. No `ETag`, `Last-Modified`, or `If-None-Match` handling anywhere in file. **Verdict confirmed.**

## FIND-0022 — Symlink path-traversal POC (High) — **confirmed (reproduced)**

**Evidence:** POC log at `audit/_runtime/tool-outputs/symlink-poc.log`:
```
resolved: /tmp/sym-poc/pwn/passwd
guard passes: true
reads: ##  | # User Database | #
```
POC confirms `path.resolve` does not follow symlinks; the `startsWith` guard at `preview-server.ts:39` is bypassed; `fs.stat`+`fs.readFile` do follow the symlink. No mitigating control (no `fs.realpath`, no `fs.lstat`). **Verdict confirmed — exploit primitive reproduced.**

## FIND-0023 — NUL/backslash unfiltered (Low) — **partially refuted, severity downgrade**

**Evidence:** `decodeURIComponent(url.pathname)` at preview-server.ts:37 will decode `%00` to a literal NUL byte. No filter applied before `path.resolve(absDir, decoded)` on line 38.

**Adversarial check — is there a mitigating control?** Yes: the critical operations (`fs.stat`, `fs.readFile`) are inside a try/catch block (lines 45-62). Modern Node (`ERR_INVALID_ARG_VALUE` on NUL in paths, see Node ≥ 10) throws synchronously *before* touching the filesystem, and the `catch {}` (empty-binding catch) returns `404 Not found`. No crash, no information leak, no read primitive.

The finding's stated repro ("promise rejection in the handler") is wrong — there is **no unhandled rejection** because the try/catch swallows the thrown error and returns 404.

**Real residual risk:** (a) defense-in-depth — explicit 400 is more correct than a 404 masquerade, and (b) on ancient Node (<10) NULs truncated paths, which was a CVE class. No one targets Node 8 today.

**Verdict: partially refuted.** The behavioral claim ("request handler crashes / promise rejection") is incorrect on any supported Node version (package.json `engines.node: >=18.0.0`). The defensive-programming recommendation is still valid but severity should be **Informational/Hardening**, not Low-with-C:L. Backslash claim: on POSIX, `\\` in pathnames is legal character and `path.sep` = `/`, so backslash in decoded path is harmless; on Windows `\\` could alter path semantics but the server is used on dev macOS/Linux per topology.md.

## FIND-0024 — addHyperlinks no rect validation (Low) — **confirmed**

**Evidence (src/core/pdf-postprocess.ts:82-107):** after `cssToPageRect`, only out-of-range checks are the `minSize = 44` growth logic (lines 91-94). No `Number.isFinite`, `w>0`, `h>0` guard. A negative/zero/NaN/Infinity rect flows through into `doc.context.obj({ Rect: [adjX1, adjY1, adjX2, adjY2], … })` unchecked. **Verdict confirmed.**

## FIND-0025 — Puppeteer browser singleton race (Low) — **confirmed (latent)**

**Evidence (src/core/puppeteer-renderer.ts:22-41):** classic async check-then-act on the module-level `browserInstance`. Between `if (!browserInstance…)` (line 29) and `puppeteer.launch(…)` await (line 30), an interleaved second call sees null and launches again.

**Adversarial check — is the race actually exercised?** `batchRenderHTML` iterates templates in a `for` loop with `await` (line 191) — **sequential**, not `Promise.all`. So today the race cannot fire from the in-tree caller set. But `renderHTMLToPDF` is an exported function and nothing at the type or runtime level prevents a new caller (`scripts/*.ts`) from wrapping two calls in `Promise.all`. Finding is correctly marked Low (dormant) with CWE-362. **Verdict confirmed as latent.**

## FIND-0026 — addBookmarks silent pageIndex clamp (Low) — **confirmed**

**Evidence (src/core/pdf-postprocess.ts:154-158):** literal `Math.max(0, Math.min(bookmark.pageIndex, pages.length - 1))` + `console.warn(…)` + continues. No throw, no failure-count in return. Matches finding exactly. **Verdict confirmed.**

## FIND-0027 — SVG text interpolation unescaped (dormant) (Low) — **confirmed**

**Evidence (src/core/svg-renderer.ts:125-163):** `generateDateTab`/`generateMonthTab`/`generateDayTab`/`generateNumberCircle`/`generatePriorityMarker` all build SVG via template literal `…>${text}</text>` with no escape.

**Adversarial check — callsites?** `svg-renderer.ts:100-106` — callers use hard-coded strings (`text || '1'`, `text || 'P1'`, `text || 'Notes'`). `rg "generateStickerSVG" src/ scripts/` shows no caller that currently pipes user-controlled text in. Today this is **not reachable** — correctly marked `severity: Low` / `category: svg-injection-unused-today`. Remains a latent primitive. **Verdict confirmed (dormant).**

---

## Aggregate notes

- Citations (file/line) are accurate for all 27 findings; no finding points at the wrong line.
- Reproductions check out for FIND-0001/0002/0003/0004/0007/0008/0011/0013/0018/0019/0022.
- Only FIND-0023's behavioral claim ("promise rejection / crash") is actually **wrong** on Node ≥18; severity should be reduced.
- FIND-0005 and FIND-0027 are explicitly annotated as "not reachable today" in their own text; they survive verification as valid hygiene/supply-chain findings even if runtime risk is near-zero.
- **No finding is fully refuted.** The audit is calibrated to a high standard.

