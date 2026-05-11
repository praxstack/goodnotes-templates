# Machine-readable findings · iteration-4

> `.clineignore` blocks `audit/**/*.json`, so the JSON payload is embedded
> here inside a fenced code block. To extract:
>
> ```bash
> awk '/^```json$/{flag=1;next}/^```$/{flag=0}flag' \
>   audit/iteration-4/CODEBASE_AUDIT_REPORT.json.md \
>   > audit/iteration-4/CODEBASE_AUDIT_REPORT.json
> # Note: that output file will be .clineignore'd from Cline, but commit-able.
> ```
>
> Or via `jq` + a one-liner if you want typed parsing:
>
> ```bash
> sed -n '/^```json$/,/^```$/p' audit/iteration-4/CODEBASE_AUDIT_REPORT.json.md \
>   | sed '1d;$d' | jq .
> ```

```json
{
  "schema_version": 1,
  "audit_metadata": {
    "repo_name": "goodnotes-templates",
    "repo_url": "https://github.com/praxstack/goodnotes-templates",
    "head": "2529d90",
    "head_message": "feat(customisation): Tier 2 themes — 378 pre-rendered themed PDFs + gallery swatch picker",
    "audit_date": "2026-05-11",
    "protocol": "CodeBaseGPT-Pro 9-phase",
    "auditor": "Cline · Claude Sonnet 4.5",
    "iteration": 4,
    "prior_iterations": [
      { "n": 1, "date": "2026-04-18", "purpose": "breadth" },
      { "n": 2, "date": "2026-04-18", "purpose": "depth" },
      { "n": 3, "date": "2026-04-18", "purpose": "adversarial" }
    ],
    "total_files": 3946,
    "ts_loc": 19639,
    "html_pack_templates": 48,
    "workspaces": 3,
    "packages_count": 29,
    "apps_count": 1,
    "tests_passing": 235,
    "coverage": {
      "statements_pct": 67.64,
      "branches_pct": 61.99,
      "functions_pct": 80.89,
      "lines_pct": 68.32,
      "branch_threshold": 75,
      "branch_threshold_met": false
    }
  },
  "health_grade": "B",
  "health_grade_prior": "C+",
  "summary": {
    "critical": 1,
    "high": 0,
    "medium": 4,
    "low": 2,
    "informational": 1,
    "total_new_this_iteration": 8,
    "deferred_from_prior": 4
  },
  "effort_estimate_person_days": {
    "p0": 0.5,
    "p1": 1.75,
    "p2": 0.5,
    "p3": 0.75,
    "total": 3.5
  },
  "findings": [
    {
      "id": "FIND-I4-001",
      "severity": "Critical",
      "priority": "P0",
      "category": "security",
      "subcategory": "privacy",
      "cwe": ["CWE-532", "CWE-200"],
      "title": "profile.local.json with real PII committed to git",
      "file": "packages/packs-prax-journal/profile.local.json",
      "line_range": "1-164",
      "description": "Real patient data (user name, therapist names with registration numbers, medications with dosages) is tracked in a public GitHub repo. The .gitignore still blocks pre-W5 paths (packs/journals/prax-journal/profile*.json); post-W5 paths (packages/packs-prax-journal/profile*.json) are not covered.",
      "evidence": "git ls-files --error-unmatch packages/packs-prax-journal/profile.local.json returns the file; git check-ignore exits 1 (not ignored); head shows PII in cleartext.",
      "impact": "Public exposure of medical PII belonging to the maintainer. Policy violation of Q4 (PII-never-in-repo) and module-level invariant in packages/core/src/types/profile.ts.",
      "recommendation": "Phase A — git rm --cached + update .gitignore with post-W5 paths. Phase B — git-filter-repo the file out of history and force-push. Add CI gate that fails if profile.local.json is tracked.",
      "effort_pd": 0.5,
      "acceptance_criteria": [
        "git ls-files | grep profile.local returns empty",
        "git log --all --full-history for the file returns empty",
        ".gitignore matches post-W5 path",
        "regression test asserts file absent at test time"
      ]
    },
    {
      "id": "FIND-I4-002",
      "severity": "Medium",
      "priority": "P1",
      "category": "security",
      "subcategory": "supply-chain",
      "cves": ["GHSA-q3j6-qgpj-74h6", "GHSA-v39h-62p7-jpjc", "GHSA-48c2-rrv3-qjmp"],
      "title": "npm audit: 1 high + 5 moderate in @astrojs/check transitive chain",
      "file": "apps/gallery/package.json",
      "description": "fast-uri <=3.1.1 (high) + yaml 2.0.0-2.8.2 (moderate x5) flow through @astrojs/check@0.9.4 → yaml-language-server → yaml. All dev-only.",
      "evidence": "npm audit reports 6 vulnerabilities (5 moderate, 1 high).",
      "impact": "Dev-time only; erodes supply-chain confidence; will trip CI audit gate on next run.",
      "recommendation": "npm audit fix --force. Run tests + build. Commit lockfile delta.",
      "effort_pd": 0.25,
      "acceptance_criteria": ["npm audit exits 0", "tests pass", "gallery builds"]
    },
    {
      "id": "FIND-I4-003",
      "severity": "Medium",
      "priority": "P1",
      "category": "quality",
      "subcategory": "tooling-drift",
      "title": "ESLint glob targets pre-W5 src/** path; lints zero source files",
      "file": "eslint.config.js",
      "line_range": "13-20, 24",
      "description": "Flat config matches files: ['src/**/*.ts'] but W5 moved sources under packages/*/src/. Global ignores also exclude scripts/**. Net effect: npm run lint touches zero shipping files.",
      "recommendation": "Update glob to packages/**/*.ts. Add dedicated scripts/**/*.ts stanza with looser rules. Keep apps/** ignored pending .astro plugin decision.",
      "effort_pd": 0.25,
      "acceptance_criteria": [
        "npx eslint packages/ reports real file count",
        "deliberate unused var in packages TS file fails lint"
      ]
    },
    {
      "id": "FIND-I4-004",
      "severity": "Medium",
      "priority": "P1",
      "category": "quality",
      "subcategory": "coverage-gate",
      "title": "vitest branch-coverage threshold 75% vs actual 61.99%",
      "file": "vitest.config.ts",
      "line_range": "14-19",
      "description": "Threshold asserts branches >= 75%; v8 coverage produces 61.99%. Either CI gate is enforced (every PR fails) or decorative. Largest gap is puppeteer-renderer.ts at 33.33% branches.",
      "recommendation": "Option 1 (recommended): add 5 tests exercising error paths in puppeteer-renderer. Option 2: lower threshold to 60 with justifying comment.",
      "effort_pd": 1.0,
      "acceptance_criteria": ["npm test -- --coverage exits 0", "CI gate enforced (not decorative)"]
    },
    {
      "id": "FIND-I4-005",
      "severity": "Low",
      "priority": "P2",
      "category": "security",
      "subcategory": "defense-in-depth",
      "title": "Gallery ships without CSP, X-Content-Type-Options, Referrer-Policy",
      "file": "apps/gallery/src/layouts/Layout.astro",
      "description": "Public Astro SSG gallery on Vercel lacks security headers. No user input / no auth today, so not an exploit path; defense-in-depth future-proofing.",
      "recommendation": "Add vercel.json with CSP, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy minimal.",
      "effort_pd": 0.5,
      "acceptance_criteria": [
        "curl -I on live gallery shows the headers",
        "No CSP console violations across 29 pack pages"
      ]
    },
    {
      "id": "FIND-I4-006",
      "severity": "Low",
      "priority": "P3",
      "category": "correctness",
      "subcategory": "consistency",
      "title": "PRAX_BROWSER_RESTART_EVERY silent-fallback asymmetric with PRAX_RENDER_SCALE",
      "file": "packages/core/src/puppeteer-renderer.ts",
      "line_range": "53-58",
      "description": "render-scale has CLI validator; restart-every has no CLI flag and silently falls back to 50 on any parse error.",
      "recommendation": "On future CLI flag addition, mirror render-scale validation. Optional console.warn on unparseable env var meanwhile.",
      "effort_pd": 0.25,
      "acceptance_criteria": []
    },
    {
      "id": "FIND-I4-007",
      "severity": "Low",
      "priority": "P3",
      "category": "documentation",
      "subcategory": "drift",
      "title": "audit/POST_SPRINT_STATUS.md is stale (dated 2026-04-18, claims 0 vulns)",
      "file": "audit/POST_SPRINT_STATUS.md",
      "recommendation": "Rename to audit/STATUS.md with Last-updated, or add iter-4 doc and link from audit/README.md.",
      "effort_pd": 0.25,
      "acceptance_criteria": [
        "audit/ README points at current-of-record doc",
        "stale claim not shown next to today's date"
      ]
    },
    {
      "id": "FIND-I4-008",
      "severity": "Informational",
      "priority": "P4",
      "category": "quality",
      "subcategory": "duplication",
      "title": "preview-server.ts inline gallery HTML duplicated conceptually with apps/gallery/",
      "file": "packages/cli/src/preview-server.ts",
      "line_range": "128-201",
      "description": "Dev-time gallery generator coexists with Astro public gallery. Deliberate: SSG gallery not available during dev-loop.",
      "recommendation": "Add inline comment explaining deliberate separation. No code change.",
      "effort_pd": 0.25,
      "acceptance_criteria": ["Comment added"]
    }
  ],
  "deferred_from_prior_audits": [
    { "id": "FIND-0012", "from_iteration": 1, "severity": "Medium", "title": "Replace regex HTML parser with cheerio", "status": "deferred, reassess iter-5" },
    { "id": "FIND-0014", "from_iteration": 1, "severity": "High", "title": "Runtime dependency on Google Fonts for non-v5 packs", "status": "partially addressed — 1/27 packs migrated" },
    { "id": "FIND-0018", "from_iteration": 1, "severity": "Medium", "title": "WCAG AA contrast audit across 14 themes", "status": "still open" },
    { "id": "FIND-0028", "from_iteration": 1, "severity": "Low", "title": "pdf-lib unmaintained", "status": "tracked; usage surface narrow" }
  ],
  "tools_run_live": {
    "tsc_noemit": { "version": "5.6.3", "result": "exit 0 clean" },
    "vitest": { "version": "4.1.4", "tests_passing": 235, "tests_total": 235 },
    "vitest_coverage": { "statements": 67.64, "branches": 61.99, "functions": 80.89, "lines": 68.32 },
    "npm_audit": { "high": 1, "moderate": 5, "total": 6 },
    "eslint": { "version": "9.39.4", "files_matched_post_w5_glob": 0 }
  },
  "gaps_not_measured": [
    "Lighthouse / axe-core on live gallery",
    "cosign verify-blob on v1.0.0 artifacts",
    "Visual regression baselines (stale post-v1.0.0)",
    "npm outdated inventory",
    "Cross-app iPad compat (Notability / Noteshelf / CollaNote)"
  ]
}
```
