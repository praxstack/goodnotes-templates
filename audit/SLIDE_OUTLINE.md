# Stakeholder Slide Outline — goodnotes-templates audit

Target audience: repo owner + one code reviewer. 8 slides, stay measurable.

---

### Slide 1 — What we audited

- `goodnotes-templates` @ commit `6603b06`
- 9 days old, 32 commits, ~3.5k LOC TS, 96 files total
- Build tool (PDF + PNG generator for GoodNotes) — not a service
- Not a monorepo; no PII; no production traffic
- CODEX-AUDIT v1.1, Balanced; 3 iterations (breadth + depth + adversarial)

### Slide 2 — Headline grade

- **Health grade: C+ today. B+ after Sprint 1 (2 days work).**
- Three things keep it from a B: broken build on HEAD, symlink exploit POC'd, no CI PR gate.
- All three are cheap fixes.

### Slide 3 — What the tools found (cite filenames)

- **npm audit** → 6 transitive vulns. 1 High (`basic-ftp`, not reachable). 5 Moderate (vitest 2.x chain).
- **gitleaks** (full git history) → **0 leaks.**
- **semgrep** (5 rulesets: typescript, javascript, security-audit, nodejs, owasp-top-ten) → 0 findings.
- **depcheck** → **8 of 12 prod deps unused**, 4 dev deps unused.
- **license-checker** → 244 prod packages. 1 LGPL (sharp-libvips, dynamic-link-OK).
- **tsc --noEmit** → **FAILS with 2 errors** on HEAD.
- **vitest** → **25 tests passing** (docs claimed 27).

### Slide 4 — 27 findings, by dimension

| Dim | Count |
|---|---:|
| Security | 11 |
| Correctness | 9 |
| Maintainability | 3 |
| Operability | 1 |
| Testability | 1 |
| UX/A11y | 1 |
| Privacy | 0 (not applicable) |

4 High · 11 Medium · 11 Low · 1 Informational.

### Slide 5 — Top 3 to ship first (Sprint 1, ~2 days)

1. **FIND-0011** — Fix `tsc --noEmit`. One tsconfig+package.json edit. XS.
2. **FIND-0022** — Symlink path-traversal POC in preview server. Use `fs.realpath` + `fs.lstat`. S.
3. **FIND-0008** — Add a PR-gating CI workflow. S.

### Slide 6 — The medium-term batch (Sprints 2–3, ~8 days)

- `npm audit fix` (closes basic-ftp HIGH).
- Remove 8 unused prod deps; fix README/CONTRIBUTING doc drift in the same PR.
- Pin CI Actions by SHA; add dependabot.
- Self-host Google Fonts (kills network dep + privacy leak + FIND-0004).
- Add tests on T1 modules. Move from 0% to target floors (T1 ≥ 80% line).
- Bump vitest to 4.x (semver-major).
- Dark-mode parity + contrast audit (FR-04.2 is only 34% delivered today).

### Slide 7 — What the audit explicitly did NOT find

- **Zero secrets in git history.** gitleaks clean.
- **Zero SAST findings.** Semgrep clean across 5 rulesets.
- **Zero critical CVSS.**
- **Zero privacy liability.** No PII, no GDPR scope.
- **No rewrite recommended.** All remediations are in-place.

### Slide 8 — What we did NOT measure (and why)

- CycloneDX SBOM (syft not installed). Covered by `package-lock.json` for now.
- Test coverage % (tool not wired; inferred by file map).
- Lighthouse / pa11y / Core Web Vitals — out of scope for PDF artifact.
- End-to-end GoodNotes 5/6 + Notability + Noteshelf + CollaNote compatibility — requires physical iPad.

All gaps in `audit/GAPS.md` — with "what would resolve it" for each.
