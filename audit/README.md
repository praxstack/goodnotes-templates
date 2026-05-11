# audit/ — CODEX-AUDIT v1.1 artifacts

This directory is the permanent record of a principal-grade code audit run on
HEAD `6603b06` (2026-04-18). It is **not** generated at build time and it is
**not** overwritten by `npm run generate`. Every file here was hand-reviewed
into existence, every metric cites a tool, every finding cites a file:line.

## How to read it, fastest first

| Start here | If you want… |
|---|---|
| `iteration-4/STATUS.md` | **Current-of-record status** (post-iter-4 sprint, 2026-05-11). Start here. |
| `iteration-4/deferred-decisions.md` | Stay-deferred / schedule-now recommendations for iter-1 items |
| `iteration-4/IMPLEMENTATION_ROADMAP.md` | Iter-4 ticket plan (T-001 → T-008) |
| `iteration-4/findings.md` | Iter-4 findings with evidence + remediation |
| `CODEBASE_AUDIT_REPORT.md` | One-page executive summary + full methodology + top-5 risks (iter-1 snapshot) |
| `POST_SPRINT_STATUS.md` | Frozen iter-3 status (superseded by `iteration-4/STATUS.md`) |
| `IMPLEMENTATION_ROADMAP.md` | Iter-1 sprint plan |
| `IMPLEMENTATION_ROADMAP.csv` | Iter-1 Jira / Linear-importable rows (27 tickets) |
| `SLIDE_OUTLINE.md` | 8 stakeholder slides |
| `GAPS.md` | What the audit could not measure + how to close the gap |

## How to verify anything

Every finding in `iteration-1/findings.json` (and `iteration-2/findings.json`)
cites a `location.file` + `location.line_start-line_end` + `evidence_snippet`.
Every numeric claim (coverage %, CVE count, LOC) cites a file under
`_runtime/tool-outputs/`. To verify a specific finding:

```bash
# 1. Open the finding record
jq '.findings[] | select(.id=="FIND-0022")' audit/iteration-1/findings.json
#    -> shows location, evidence, blast radius, remediation

# 2. Open the cited file at the cited line
sed -n '36,62p' src/cli/preview-server.ts

# 3. If the finding cites a tool output, inspect it
jq '.vulnerabilities."basic-ftp"' audit/_runtime/tool-outputs/npm-audit.json
```

## How to re-run the tool surface

`scripts/audit.sh` re-runs every probe into `_runtime/tool-outputs/`:

```bash
bash scripts/audit.sh            # tokei, npm-audit, depcheck, license-checker,
                                 # gitleaks, semgrep, tsc --noEmit → summary.md
bash scripts/audit.sh --no-gitleaks  # skip full-history secret scan
```

`.github/workflows/audit.yml` runs the probe on the first of each month and
uploads outputs as an artifact. If `npm audit --audit-level=high` flags
anything new, the workflow fails and a human gets pinged.

**The full LLM-authored 3-iteration audit** is **not** re-run here — it is a
point-in-time artifact. To refresh it, paste `prompts/CODEX-AUDIT-v1.1.md`
into a capable agent CLI (Claude Code, Codex, Cline) with the kickoff block.

## Directory layout

```
audit/
├── README.md                        # you are here
├── CODEBASE_AUDIT_REPORT.md  .json  # final consolidated report (human + machine)
├── IMPLEMENTATION_ROADMAP.md  .csv  # 27 tickets
├── TEST_STRATEGY.md                 # per-tier coverage floors + new test proposals
├── SLIDE_OUTLINE.md                 # 8 slides for stakeholders
├── GAPS.md                          # 7 gaps with "how to close it" each
├── POST_SPRINT_STATUS.md            # post-implementation outcome record
├── .gitignore                       # excludes _runtime/tool-outputs/
├── _runtime/
│   ├── capabilities.json            # what tools were available at audit time
│   ├── topology.md                  # risk-tiered module map (T1 / T2 / T3 / T4)
│   ├── dependency-graph.mmd         # Mermaid dep graph
│   └── tool-outputs/                # gitignored — raw tool artefacts
├── iteration-1/                     # breadth pass (21 findings)
│   ├── findings.json  .md           # the 21 findings, both formats
│   ├── docs-review.md
│   ├── claims-ledger.md             # every docs-claim → code verification target
│   ├── supply-chain.md
│   ├── architecture.md              # rubric + strengths/weaknesses
│   ├── threat-model.md              # STRIDE, 12 threats
│   ├── tests-and-quality-gates.md
│   ├── performance-and-observability.md
│   ├── privacy-review.md            # not_applicable, short-circuited
│   ├── ui-ux-a11y.md
│   └── GAPS.md                      # iteration-local gap subset
├── iteration-2/findings.json        # T1 depth pass (6 new findings)
└── iteration-3/verification-results.md  # adversarial subagent (26 confirmed, 1 partial)
```

## Why the iterations exist

- **Iteration 1 (breadth):** cover all 9 dimensions at baseline depth.
- **Iteration 2 (depth):** drill into T1 modules (`preview-server.ts`,
  `puppeteer-renderer.ts`, `pdf-postprocess.ts`). This is where the
  symlink-path-traversal POC (FIND-0022) was executed live.
- **Iteration 3 (adversarial):** an LLM subagent with full evidence-pack
  access tried to *disprove* every finding. 26/27 confirmed;
  FIND-0023 was partially refuted and its severity was downgraded from Low
  to Informational.

This three-pass structure is how the audit earns trust: every finding was
independently challenged.

## What's intentionally not here

- **Raw secret values.** Per Rule 7 of the anti-fabrication contract, if
  `gitleaks` or `trufflehog` had found a secret, the evidence snippet would
  use `<REDACTED:first4…last4>` and `secret_fingerprint` (sha256 prefix).
  None were found in this repo, so the question is moot.
- **Training-data memory.** Every CVE / CVSS / license entry comes from a
  tool run captured to `_runtime/tool-outputs/`. Nothing cites from memory.
- **Padded findings.** A 3.5k-LOC repo does not have 100 findings.
  27 is the honest count.

## Contact / follow-up

Fix-sprint history lives in `git log --oneline 53beee8^..HEAD`. Each commit
references the FIND-ID it closes. Open `POST_SPRINT_STATUS.md` for the
closed / deferred breakdown with commit hashes.
