# Iteration 1 — Findings (human-readable)

**21 findings · 0 critical · 3 high · 8 medium · 10 low · 0 informational**
**Machine-readable:** `iteration-1/findings.json` (same facts, schema-compliant).
**Adversarial verdicts:** `iteration-3/verification-results.md`.

Findings below follow the schema in the prompt: severity, priority, confidence, file:line, code evidence, blast radius, attacker profile, reproduction, recommendation (summary + sketch + rollout), test-to-add, effort (t-shirt), rollback plan, verification method. Severities reflect iteration-1 as-authored; iteration-3 downgraded **FIND-0023** only (Low → Informational — see §23 below when you reach iteration-2 continuation).

---

## FIND-0001 — Preview HTTP server binds to all interfaces by default

- **Severity:** Medium · **CVSS 3.1:** 5.3 (CVSS:3.1/AV:A/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N) · **Priority:** P1 · **Confidence:** high
- **Dimension:** security · **OWASP 2021:** A05 · **CWE:** CWE-200
- **Location:** `src/cli/preview-server.ts:65-68`, function `startPreviewServer`

**Evidence:**
```ts
server.listen(port, () => {
  console.log(`  Preview server running at http://localhost:${port}`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
```

**Blast radius.** On a shared network (coffee shop, conference, shared office Wi-Fi) anyone on-LAN can browse `/output` files. The gallery lists every file under `output/` — unreleased template drafts, personal journal PDFs, or anything else the developer has placed there.

**Attacker profile.** Unauthenticated LAN-adjacent attacker.

**Reproduction.**
1. `npm run preview`
2. Console prints `http://localhost:3000` — misleading; Node actually binds `0.0.0.0:3000`.
3. From another host on the same LAN: `curl http://<dev-laptop-ip>:3000/` — full gallery returned.

**Recommendation (XS).** Default-bind `127.0.0.1`; add `--host` flag for opt-in exposure.
```ts
const host = process.env.PREVIEW_HOST || '127.0.0.1';
server.listen(port, host, () => { console.log(`  Preview server running at http://${host}:${port}`); });
```

**Test-to-add.** `preview_server_binds_localhost_by_default` (integration).
**Verification.** `lsof -iTCP:3000 -sTCP:LISTEN` after start shows `127.0.0.1:3000`.
**Rollback.** Revert commit; no data migration.

---

## FIND-0002 — Bespoke HTML escape in preview gallery misses `'`

- **Severity:** Medium · **CVSS 3.1:** 5.4 (CVSS:3.1/AV:L/AC:L/PR:L/UI:R/S:U/C:L/I:L/A:N) · **Priority:** P2 · **Confidence:** medium
- **Dimension:** security · **OWASP 2021:** A03 · **CWE:** CWE-79
- **Location:** `src/cli/preview-server.ts:94-109`, function `generateGalleryHTML`
- **Iter-3 note.** Confirmed as a bug; in-context severity sits at Low because today all HTML attributes use double quotes and `href` is `encodeURI`'d, so the `'` isn't currently weaponizable.

**Evidence:**
```ts
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// ... <img src="${href}" alt="${name}" />
```

**Blast radius.** Local-origin JS execution in the developer's browser scoped to `localhost:3000`. Low blast in isolation; material as defensive programming.

**Recommendation (XS).** Replace with a complete escape or allow-list filenames to `[A-Za-z0-9._-]` at scan time.

---

## FIND-0003 — Chromium launched with `--no-sandbox` unconditionally

- **Severity:** Medium · **CVSS 3.1:** 4.4 (CVSS:3.1/AV:L/AC:H/PR:L/UI:R/S:U/C:L/I:L/A:L) · **Priority:** P2 · **Confidence:** high
- **Dimension:** security · **OWASP 2021:** A05 · **CWE:** CWE-16
- **Location:** `src/core/puppeteer-renderer.ts:29-39`, function `getBrowser`

**Evidence.**
```ts
browserInstance = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
});
```

**Recommendation (S).** Gate `--no-sandbox` to `process.env.CI || process.env.DOCKER_CONTAINER`. Rationale in architecture review.

---

## FIND-0004 — Puppeteer waits on arbitrary outbound requests (`networkidle0`), no URL allow-list

- **Severity:** Low · **CVSS 3.1:** 3.1 · **Priority:** P2 · **Confidence:** high
- **Dimension:** security · **OWASP 2021:** A10 · **CWE:** CWE-918
- **Location:** `src/core/puppeteer-renderer.ts:123-127`

**Pairs with FIND-0014** — self-hosted fonts close both findings.

---

## FIND-0005 — `basic-ftp` transitive HIGH-CVSS

- **Severity:** High · **CVSS 3.1:** 8.2 (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:L) · **Priority:** P1 · **Confidence:** medium (advisory-generic; in-context exploitability near-zero)
- **Dimension:** security · **OWASP 2021:** A06 · **CWE:** CWE-93
- **Advisories:** GHSA-6v7q-wjvx-w8wg, GHSA-rp42-5vxx-qpwr
- **Evidence:** `audit/_runtime/tool-outputs/npm-audit.json` → `$.vulnerabilities."basic-ftp"`

**Recommendation (XS).** `npm audit fix` — non-major fix is available.

---

## FIND-0006 — vitest 2.1.x pulls moderate vite/esbuild advisories

- **Severity:** Medium · **CVSS 3.1:** 5.3 · **Priority:** P2 · **Confidence:** high
- **Fix:** bump to `vitest@^4.1.4` (semver-major).
- **Effort.** S (expect test-runner API churn).

---

## FIND-0007 — 8 of 12 prod deps are unused

- **Severity:** Medium · **RICE:** 4.5 · **Priority:** P1 · **Confidence:** high
- **Dimension:** maintainability
- **Evidence:** `audit/_runtime/tool-outputs/depcheck.json` — `pdfkit, @svgdotjs/svg.js, svgdom, chalk, ora, glob, handlebars, fontkit` and 4 devDeps.
- **Effort.** S (coupled with FIND-0013 doc-drift fix).

---

## FIND-0008 — CI workflow does not gate PRs

- **Severity:** High · **RICE:** 10.0 · **Priority:** P0 · **Confidence:** high
- **Dimension:** operability · **OWASP 2021:** A04 · **CWE:** CWE-1357
- **Location:** `.github/workflows/generate.yml` — `on: push.branches: [main]` + `workflow_dispatch` only. No `pull_request` trigger. No `test`/`lint`/`audit`/`build` step.

**Blast radius.** Broken TypeScript (FIND-0011), failing tests, high-severity CVEs, style regressions land on main silently.

**Recommendation (S).** New `.github/workflows/ci.yml` with `pull_request` trigger running build + test + audit. Full YAML in `TEST_STRATEGY.md §4`.

---

## FIND-0009 — GitHub Actions pinned by tag not SHA

- **Severity:** Medium · **RICE:** 4.8 · **Priority:** P1 · **Confidence:** high
- **Dimension:** security · **OWASP 2021:** A08 · **CWE:** CWE-494
- **Evidence:** 5 actions (`checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, `download-artifact@v4`, `softprops/action-gh-release@v2`).

---

## FIND-0010 — Release artifacts unsigned

- **Severity:** Low · **RICE:** 2.4 · **Priority:** P2 · **Confidence:** high
- **Dimension:** security · **OWASP 2021:** A08 · **CWE:** CWE-353
- **Recommendation (S).** Add cosign keyless signing + SLSA provenance.

---

## FIND-0011 — `tsc --noEmit` fails: DOM lib missing + `import.meta` in CommonJS

- **Severity:** High · **RICE:** 20.0 · **Priority:** P0 · **Confidence:** high
- **Dimension:** correctness · **CWE:** CWE-1120
- **Evidence:** `audit/_runtime/tool-outputs/tsc-noemit.log`
  ```
  src/core/puppeteer-renderer.ts(129,31): error TS2584: Cannot find name 'document'…
  src/templates/registry.ts(12,46): error TS1470: The 'import.meta' meta-property is not allowed in files which will build into CommonJS output.
  ```
- **Recommendation (XS).** Add `"lib": ["ES2022", "DOM"]` to `tsconfig.json` + `"type": "module"` to `package.json`.
- **Blast radius.** `npm run build` exits 2. `prepublishOnly` fails. Vitest masks this via tsx JIT, so tests pass while build is broken.

---

## FIND-0012 — Bespoke HTML regex parser in `daily-year-v2.ts` is fragile

- **Severity:** Medium · **RICE:** 1.92 · **Priority:** P2 · **Confidence:** high
- **Dimension:** correctness · **CWE:** CWE-1336
- **Location:** `src/templates/planners/daily-year-v2.ts:119-152`, function `parseSinglePageTemplate`
- **Recommendation (M).** Replace regex/depth-counting with `cheerio` (Apache-2.0).

---

## FIND-0013 — README / CONTRIBUTING / CLAUDE.md reference deleted files

- **Severity:** Medium · **RICE:** 7.5 · **Priority:** P1 · **Confidence:** high
- **Evidence:** docs reference `themes.ts`, `renderer.ts`, `pdfkit-renderer.ts` — all three deleted in the self-contained refactor (HLD / LLD 2026-04-10).
- **Recommendation (S).** One pass to rewrite arch diagrams + CONTRIBUTING §New Themes + roadmap checkboxes. Pair with FIND-0019 repo URL fix.

---

## FIND-0014 — "No external APIs at runtime" claim is false (Google Fonts)

- **Severity:** Medium · **RICE:** 3.0 · **Priority:** P1 · **Confidence:** high
- **Dimension:** correctness (doc-behavior mismatch)
- **Evidence:** every HTML template includes `<link href="https://fonts.googleapis.com/…">`. `PROBLEM_STATEMENT.md §8` claims "No external APIs at runtime; everything generates offline."
- **Iter-3 note.** The `scripts/download-fonts.ts` referenced in `package.json.scripts["fonts:download"]` does not exist on disk. The self-hosting escape hatch is vaporware.
- **Recommendation (M).** Self-host fonts under `assets/fonts/`. Closes FIND-0004 as a side effect.

---

## FIND-0015 — Color-mode CSS discovery logic duplicated

- **Severity:** Low · **RICE:** 1.6 · **Priority:** P2 · **Confidence:** high
- **Location:** `src/core/puppeteer-renderer.ts:92-107` + `scripts/generate-4week.ts:80-95`
- **Recommendation (XS).** Extract `resolveColorModeCSS` helper; consume from both.

---

## FIND-0016 — Zero tests on T1 modules

- **Severity:** Medium · **RICE:** 3.2 · **Priority:** P1 · **Confidence:** high
- **Dimension:** testability
- **Evidence:** `tests/unit/*.test.ts` — 3 files; none target `preview-server`, `puppeteer-renderer`, or `pdf-postprocess`.
- **Recommendation (M).** Add the 8 targeted test files listed in `TEST_STRATEGY.md §2`.

---

## FIND-0017 — `batchRenderHTML` swallows per-template errors

- **Severity:** Low · **RICE:** 3.0 · **Priority:** P2 · **Confidence:** high
- **Dimension:** maintainability · **CWE:** CWE-703
- **Location:** `src/core/puppeteer-renderer.ts:190-206`
- **Recommendation (S).** Return `{ results, failures }`; caller exits non-zero unless `--best-effort`.

---

## FIND-0018 — Dark-mode parity 11/32 templates, contrast unmeasured

- **Severity:** Medium · **RICE:** 1.92 · **Priority:** P2 · **Confidence:** medium
- **Dimension:** uxa11y
- **Evidence:** `ls src/templates/html/*.html | wc -l = 32`; `*.dark.css = 11`. `PROBLEM_STATEMENT.md FR-04.2` requires every light template has a dark variant.
- **Recommendation (M).** Either (a) scope PROBLEM_STATEMENT to 11 named templates or (b) add the missing 21 dark variants; run a contrast script.

---

## FIND-0019 — `package.json` repository.url stub + README clone URL 404

- **Severity:** Low · **RICE:** 5.0 · **Priority:** P2 · **Confidence:** high
- **Evidence:** `package.json:repository.url = https://github.com/yourusername/goodnotes-templates`; actual origin `https://github.com/praxstack/goodnotes-templates`.
- **Recommendation (XS).** Fix package.json + README + CONTRIBUTING paths.

---

## FIND-0020 — Missing THIRD_PARTY_LICENSES for LGPL-3.0 libvips binary

- **Severity:** Low · **RICE:** 6.0 · **Priority:** P2 · **Confidence:** high
- **Evidence:** `@img/sharp-libvips-darwin-arm64@1.0.4` is LGPL-3.0-or-later; only `LICENSE` (MIT) exists at repo root.
- **Recommendation (XS).** Generate `THIRD_PARTY_LICENSES.md` via `license-checker --production --markdown`.

---

## FIND-0021 — Preview server 404 path has no Cache-Control; valid responses use `no-cache`

- **Severity:** Low · **RICE:** 1.0 · **Priority:** P3 · **Confidence:** high
- **Location:** `src/cli/preview-server.ts:53-62`
- **Recommendation (XS).** Add ETag from mtime + `Cache-Control: public, max-age=60`.

---

## Notes

- All severity + CVSS + RICE values are recorded in the machine-readable `findings.json`.
- Iteration-3 adversarial verification (`iteration-3/verification-results.md`) confirmed 21/21 of the above, with **FIND-0002** flagged as "severity slightly overstated in-context (defensible as Medium defensive-programming)" and no full refutations at this iteration.
- FIND-0022…FIND-0027 (iter-2 depth pass) are in `iteration-2/findings.json` — not re-listed here.
