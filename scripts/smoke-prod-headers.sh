#!/usr/bin/env bash
# scripts/smoke-prod-headers.sh
#
# Live assertion: the T-005 security headers (FIND-I4-005) must be honored
# in production. If they aren't, this script exits non-zero with a clear
# diagnosis so CI (and human eyeballs) can catch the regression.
#
# Why this exists
# ---------------
# The local unit test (tests/unit/vercel-config.test.ts) pins the
# CONFIG SHAPE. This script pins the LIVE DELIVERY. Together they close
# the gap that let `vercel.json` ship in `d8c46dd` without landing in
# prod: the code said "shipped" and the git log agreed, but
# `curl -I` on the live site disagreed.
#
# Usage
# -----
#   scripts/smoke-prod-headers.sh                  # default prod URL
#   scripts/smoke-prod-headers.sh https://preview  # override URL
#
# Exit codes
#   0   — all required headers present
#   1   — at least one required header missing
#   2   — could not reach the target URL
#
# Run-on-deploy recipe (recommended):
#   # after a successful vercel --prod, wait ~5s for edge propagation, then:
#   sleep 5 && scripts/smoke-prod-headers.sh
#
# Maintainability
# ---------------
# Required-header list here mirrors the one in
# tests/unit/vercel-config.test.ts — keep them in sync. If you change
# the CSP directive set, update both.

set -euo pipefail

URL="${1:-https://pretext-templates.vercel.app/}"

# Fetch headers with a 10-second timeout. -s silent; -I HEAD; -L follow.
# 2>&1 + tee lets us capture + show in CI logs.
HEADERS_FILE=$(mktemp)
trap 'rm -f "$HEADERS_FILE"' EXIT

if ! curl -sI -L --max-time 10 "$URL" > "$HEADERS_FILE" 2>&1; then
  echo "[smoke-prod-headers] ERROR: could not reach $URL" >&2
  echo "[smoke-prod-headers] curl output:" >&2
  cat "$HEADERS_FILE" >&2
  exit 2
fi

# Status line — bail early if not 2xx
STATUS=$(head -n1 "$HEADERS_FILE" | awk '{print $2}')
if [[ ! "$STATUS" =~ ^2[0-9][0-9]$ ]]; then
  echo "[smoke-prod-headers] ERROR: $URL returned status $STATUS (expected 2xx)" >&2
  head -n20 "$HEADERS_FILE" >&2
  exit 2
fi

# Case-insensitive header check — curl normalizes to lowercase on HTTP/2.
# We check (header-name, is-present) not values (values get rich content-
# validation in the unit test; here we just assert presence + non-empty).
REQUIRED=(
  "content-security-policy"
  "x-content-type-options"
  "referrer-policy"
  "permissions-policy"
)

FAILED=0
echo "[smoke-prod-headers] checking $URL (status=$STATUS)"
for h in "${REQUIRED[@]}"; do
  # awk '-F: ' parses "header-name: value"; /\S/ filters out empties.
  val=$(awk -F': ' -v k="$h" 'BEGIN{IGNORECASE=1} tolower($1)==k {sub(/\r$/,""); print $2; exit}' "$HEADERS_FILE" || true)
  if [[ -z "$val" ]]; then
    echo "  ✗ MISSING: $h"
    FAILED=$((FAILED+1))
  else
    # Truncate to 80 chars for log readability.
    short="${val:0:80}"
    [[ ${#val} -gt 80 ]] && short="${short}…"
    echo "  ✓ $h: $short"
  fi
done

if [[ "$FAILED" -gt 0 ]]; then
  echo "" >&2
  echo "[smoke-prod-headers] FAILED: $FAILED of ${#REQUIRED[@]} headers missing" >&2
  echo "[smoke-prod-headers] Diagnosis hints:" >&2
  echo "  - Is vercel.json in the deploy surface?" >&2
  echo "    (vercel --cwd=dist only uploads dist/; see stage-vercel-config.ts)" >&2
  echo "  - Has a deploy run SINCE the last vercel.json change?" >&2
  echo "  - Is CDN cache stale? Try --url with ?cache-bust=$(date +%s)" >&2
  exit 1
fi

echo ""
echo "[smoke-prod-headers] ✓ all ${#REQUIRED[@]} required headers present"
exit 0
