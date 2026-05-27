# Explain: `audit.ts`

> Typescript module exposing 5 functions and 6 exports (311 lines).

| | |
|---|---|
| **ID** | `file:packages/core/src/audit.ts` |
| **Type** | `file` |
| **Path** | `packages/core/src/audit.ts` (312 lines) |
| **Complexity** | `complex` |
| **Tags** | `core-engine`, `source`, `module` |
| **Layer** | **Core Engine** — Core rendering and template engine shared by all packs and the CLI. |

## Role in the Architecture

This file lives in the **Core Engine** layer.

> Core rendering and template engine shared by all packs and the CLI.

The file's stated purpose: Typescript module exposing 5 functions and 6 exports (311 lines).

## Internal Structure

This file contains **5 functions** and **0 classes** that survived the significance filter (≥10 lines or exported).

### Functions

| Name | Lines | Complexity | Tags | Summary |
|---|---|---|---|---|
| `checkManifestValid` | 65-112 | moderate | function, exported, source | Function `checkManifestValid` (48 lines) in audit.ts. |
| `checkEntryExists` | 121-153 | moderate | function, exported, source | Function `checkEntryExists` (33 lines) in audit.ts. |
| `checkTokensUsed` | 167-207 | moderate | function, exported, source | Function `checkTokensUsed` (41 lines) in audit.ts. |
| `auditPack` | 237-273 | moderate | function, exported, source | Function `auditPack` (37 lines) in audit.ts. |
| `formatAuditPretty` | 280-311 | moderate | function, exported, source | Function `formatAuditPretty` (32 lines) in audit.ts. |

## External Connections

### Imports (`2`)

- `file:packages/core/src/types/registry.ts` — Typescript module exposing 2 functions and 7 exports (240 lines).
- `file:packages/core/src/errors.ts` — Typescript module defining 5 classes (~327 lines).

### Imported by (`2`)

- `file:packages/cli/src/index.ts` — Barrel/entry-point file re-exporting public symbols of its directory (0 exports, 0 fns, 0 classes).
- `file:tests/unit/audit.test.ts` — Test file containing 1 test functions and 0 test fixtures.

## Source Code (head, first 80 lines)

```ts
/**
 * Design-system lint framework (CEO v5 Phase 3 · E3).
 *
 * `pretext audit <pack-id>` runs a series of rules against a pack and emits
 * a JSON report (or pretty-printed summary). The rules codify the "taste"
 * that currently lives in markdown under docs/ — turning them into a
 * PR-gating CI check so community contributions can be triaged with a
 * machine gate instead of a 2-hour human review.
 *
 * Phase 3 ships 3 rules (scaffold):
 *   1. manifest-valid    — Zod validation of manifest.json
 *   2. entry-exists      — the entry HTML file exists on disk
 *   3. tokens-used       — the entry HTML uses the shared CSS token
 *                          vocabulary (--background, --foreground,
 *                          --primary, --accent, --border)
 *
 * Phase 3 stretch (not in this commit, all take Puppeteer):
 *   4. wcag-aa-all-themes  — contrast ratio per theme per text pair
 *   5. paper-overflow      — A4/Letter/iPad-landscape zero-overflow
 *   6. stickers-evidence   — prax-journal sticker SVG data-evidence-source
 *
 * See docs/plan-ceo-review-v5-10x-100x-expansion.md §0E Phase 3 for context.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseManifest } from './types/registry.js';
import { RegistryParseError } from './errors.js';

// ─── Finding shape ─────────────────────────────────────────────

export type FindingSeverity = 'error' | 'warn' | 'info';

export interface Finding {
  /** Machine-readable rule id (kebab-case). */
  rule: string;
  /** Severity — CI gates on 'error' only. */
  severity: FindingSeverity;
  /** Human-readable message with a specific fix hint where possible. */
  message: string;
  /** Relative path to the offending file (if applicable). */
  file?: string;
  /** Line number (1-based) inside the file (if applicable). */
  line?: number;
}

export interface AuditResult {
  packId: string;
  packDir: string;
  rulesRun: number;
  findings: Finding[];
  /** Convenience — exit code the CLI should use. 0/1/2 per contract. */
  exitCode: 0 | 1 | 2;
}

// ─── Rules ─────────────────────────────────────────────────────

/**
 * Rule 1: `manifest-valid`
 *
 * Parses manifest.json via the existing Zod schema. Any ZodError is folded
 * into `error` findings, one per issue path. Missing manifest.json is
 * severity=error so the whole audit fails.
 */
export async function checkManifestValid(packDir: string): Promise<Finding[]> {
  const manifestPath = path.join(packDir, 'manifest.json');
  let raw: string;
  try {
    raw = await fs.readFile(manifestPath, 'utf-8');
  } catch {
    return [{
      rule: 'manifest-valid',
      severity: 'error',
      message: `manifest.json is missing. Run: pretext init <pack-id> to scaffold.`,
      file: manifestPath,
    }];
  }

  let parsed: unknown;
  try {
```

## How To Modify Safely

- Small blast radius (~4 import-level connections). Run `pnpm vitest` and visual regression to catch regressions.
- Marked **complex**. Consider breaking changes into smaller PRs.

---
Generated by `/understand-explain` from `.understand-anything/knowledge-graph.json` at d170d3b098033dd66c62ce61da990f38bde316dd.