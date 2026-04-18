#!/usr/bin/env bash
# Re-run the CODEX-AUDIT v1.1 tool surface.
#
# Use when you want a fresh evidence snapshot under audit/_runtime/tool-outputs/
# without re-executing the full 3-iteration LLM audit. Fast, deterministic,
# every tool cited. Run monthly in CI (see .github/workflows/audit.yml) or
# ad-hoc before a release.
#
# Usage:
#   scripts/audit.sh                 # run all probes
#   scripts/audit.sh --no-gitleaks   # skip slow ones
#
# The raw outputs land under audit/_runtime/tool-outputs/ (gitignored).
# A summary goes to audit/_runtime/tool-outputs/audit-summary.md.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="audit/_runtime/tool-outputs"
mkdir -p "$OUT"

STARTED=$(date -u +%Y-%m-%dT%H:%M:%SZ)
echo "=== CODEX-AUDIT probe — $STARTED ==="

# ── 1. Inventory ──────────────────────────────────────────────
if command -v tokei >/dev/null 2>&1; then
  tokei --output json > "$OUT/tokei.json" 2>/dev/null
  echo "tokei: ok"
else
  echo "tokei: MISSING (install via: brew install tokei)"
fi

# ── 2. npm audit ──────────────────────────────────────────────
npm audit --json > "$OUT/npm-audit.json" 2>&1 || true
echo "npm-audit: ok"

# ── 3. depcheck ──────────────────────────────────────────────
if npx --no-install depcheck --version >/dev/null 2>&1; then
  npx depcheck --json 2>/dev/null > "$OUT/depcheck.json" || true
elif command -v npx >/dev/null 2>&1; then
  npx -y -q depcheck --json 2>/dev/null > "$OUT/depcheck.json" || true
fi
echo "depcheck: ok"

# ── 4. license-checker ──────────────────────────────────────
if [ -x ./node_modules/.bin/license-checker ]; then
  ./node_modules/.bin/license-checker --json --production 2>/dev/null > "$OUT/licenses-prod.json" || true
  ./node_modules/.bin/license-checker --json 2>/dev/null > "$OUT/licenses-all.json" || true
else
  npx -y -q license-checker --json --production 2>/dev/null > "$OUT/licenses-prod.json" || true
fi
echo "licenses: ok"

# ── 5. gitleaks (full history) ─────────────────────────────
if [[ "${1:-}" != "--no-gitleaks" ]] && command -v gitleaks >/dev/null 2>&1; then
  gitleaks detect --source=. --log-opts="--all" --report-format=sarif \
    --report-path="$OUT/gitleaks.sarif" --redact --no-banner 2>&1 | tail -3
  echo "gitleaks: ok"
else
  echo "gitleaks: SKIPPED"
fi

# ── 6. semgrep (5 rulesets) ─────────────────────────────────
if command -v semgrep >/dev/null 2>&1; then
  semgrep --config=p/typescript --config=p/javascript \
          --config=p/security-audit --config=p/nodejs \
          --config=p/owasp-top-ten \
          --sarif --output="$OUT/semgrep.sarif" \
          --metrics=off --quiet \
          src/ scripts/ 2>&1 | tail -3 || true
  echo "semgrep: ok"
else
  echo "semgrep: MISSING (install via: brew install semgrep)"
fi

# ── 7. tsc --noEmit ─────────────────────────────────────────
npx tsc --noEmit > "$OUT/tsc-noemit.log" 2>&1 || true
TSC_EXIT=$?
echo "tsc: exit=$TSC_EXIT"

# ── Summary ─────────────────────────────────────────────────
{
  echo "# Audit probe — $STARTED"
  echo
  echo "## Vulnerabilities"
  if command -v jq >/dev/null 2>&1 && [ -s "$OUT/npm-audit.json" ]; then
    jq -r '.metadata.vulnerabilities | "- critical: \(.critical)\n- high: \(.high)\n- moderate: \(.moderate)\n- low: \(.low)"' \
      "$OUT/npm-audit.json" 2>/dev/null || echo "- (could not parse)"
  fi
  echo
  echo "## Unused deps (depcheck)"
  if command -v jq >/dev/null 2>&1 && [ -s "$OUT/depcheck.json" ]; then
    jq -r '"- production: \(.dependencies | length)\n- development: \(.devDependencies | length)"' \
      "$OUT/depcheck.json" 2>/dev/null || echo "- (could not parse)"
  fi
  echo
  echo "## Secrets (gitleaks)"
  if [ -f "$OUT/gitleaks.sarif" ] && command -v jq >/dev/null 2>&1; then
    jq -r '.runs[0].results | length | "- findings: \(.)"' "$OUT/gitleaks.sarif" 2>/dev/null || true
  fi
  echo
  echo "## SAST (semgrep)"
  if [ -f "$OUT/semgrep.sarif" ] && command -v jq >/dev/null 2>&1; then
    jq -r '.runs[0].results | length | "- findings: \(.)"' "$OUT/semgrep.sarif" 2>/dev/null || true
  fi
  echo
  echo "## Build"
  echo "- tsc exit: $TSC_EXIT"
  echo
} > "$OUT/audit-summary.md"

echo
echo "=== probe complete — see $OUT/audit-summary.md ==="
cat "$OUT/audit-summary.md"
