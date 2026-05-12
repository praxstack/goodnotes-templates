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
    parsed = JSON.parse(raw);
  } catch (err) {
    return [{
      rule: 'manifest-valid',
      severity: 'error',
      message: `manifest.json is not valid JSON: ${(err as Error).message}`,
      file: manifestPath,
    }];
  }

  try {
    parseManifest(manifestPath, parsed);
    return []; // clean
  } catch (err) {
    if (err instanceof RegistryParseError) {
      // RegistryParseError carries issues under `.details.issues` —
      // ReadonlyArray<{ path, message }> preserved verbatim from Zod.
      return err.details.issues.map((issue) => ({
        rule: 'manifest-valid',
        severity: 'error' as const,
        message: `${issue.path.length ? issue.path.join('.') : '(root)'}: ${issue.message}`,
        file: manifestPath,
      }));
    }
    return [{
      rule: 'manifest-valid',
      severity: 'error',
      message: `manifest.json failed validation: ${(err as Error).message}`,
      file: manifestPath,
    }];
  }
}

/**
 * Rule 2: `entry-exists`
 *
 * Reads the manifest's `entry` field and verifies the file exists on disk.
 * If manifest is missing (caught by Rule 1), this rule is skipped silently
 * — no point doubling-up the error.
 */
export async function checkEntryExists(packDir: string): Promise<Finding[]> {
  const manifestPath = path.join(packDir, 'manifest.json');
  let entry: string | undefined;
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    const parsed = JSON.parse(raw) as { entry?: string };
    entry = parsed.entry;
  } catch {
    return []; // manifest issue already caught by rule 1
  }

  if (entry === undefined) {
    return [{
      rule: 'entry-exists',
      severity: 'error',
      message: `manifest.entry is missing — cannot verify entry HTML exists.`,
      file: manifestPath,
    }];
  }

  const entryPath = path.join(packDir, entry);
  try {
    await fs.access(entryPath);
    return [];
  } catch {
    return [{
      rule: 'entry-exists',
      severity: 'error',
      message: `Entry HTML "${entry}" does not exist. Expected at ${entryPath}`,
      file: manifestPath,
    }];
  }
}

/**
 * Rule 3: `tokens-used`
 *
 * Scans the pack's entry HTML for the shared CSS custom-property vocabulary.
 * A pack that doesn't use any shared tokens opts out of Tier 2 theming —
 * possibly intentional, so this rule is severity=warn (not error). The
 * message tells contributors exactly which tokens they're missing so the
 * fix is obvious.
 *
 * Shared token vocabulary (from docs/CUSTOMISATION.md §0):
 *   --background · --foreground · --primary · --accent · --border
 */
export async function checkTokensUsed(packDir: string): Promise<Finding[]> {
  const SHARED_TOKENS = [
    '--background',
    '--foreground',
    '--primary',
    '--accent',
    '--border',
  ] as const;

  // Read manifest to locate entry.
  const manifestPath = path.join(packDir, 'manifest.json');
  let entry: string | undefined;
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    entry = (JSON.parse(raw) as { entry?: string }).entry;
  } catch {
    return [];
  }
  if (entry === undefined) return [];

  const entryPath = path.join(packDir, entry);
  let html: string;
  try {
    html = await fs.readFile(entryPath, 'utf-8');
  } catch {
    return []; // entry-exists will catch this
  }

  const missing = SHARED_TOKENS.filter((tok) => !html.includes(tok));
  if (missing.length === 0) return [];

  return [{
    rule: 'tokens-used',
    severity: 'warn',
    message:
      `Pack does not use all shared CSS tokens: missing ${missing.join(', ')}. ` +
      `Tier 2 theming (14-palette swatch picker) relies on this vocabulary. ` +
      `See docs/CUSTOMISATION.md §0 for details.`,
    file: entryPath,
  }];
}

// ─── Orchestrator ──────────────────────────────────────────────

export type RuleFn = (packDir: string) => Promise<Finding[]>;

/**
 * Ordered list of the rules we run for every audit. New rules append here.
 * Order matters: manifest-valid runs first because downstream rules assume
 * the manifest is parseable.
 */
export const AUDIT_RULES: Record<string, RuleFn> = {
  'manifest-valid': checkManifestValid,
  'entry-exists': checkEntryExists,
  'tokens-used': checkTokensUsed,
};

/**
 * Run every rule against the given pack directory and return a consolidated
 * AuditResult. The CLI wraps this with pretty-printing + exit-code plumbing.
 *
 * Exit code semantics:
 *   0 → no findings (or only 'info')
 *   1 → at least one 'warn' finding
 *   2 → at least one 'error' finding (blocks CI)
 *
 * Note: if the pack directory itself is missing, we return exit 2 with a
 * single synthetic finding — not a thrown error — so CLI error formatting
 * is uniform.
 */
export async function auditPack(packId: string, packDir: string): Promise<AuditResult> {
  // Bail early if packDir doesn't exist; every rule would fail the same way.
  try {
    await fs.access(packDir);
  } catch {
    return {
      packId,
      packDir,
      rulesRun: 0,
      findings: [{
        rule: 'pack-exists',
        severity: 'error',
        message: `Pack directory does not exist: ${packDir}`,
      }],
      exitCode: 2,
    };
  }

  const findings: Finding[] = [];
  const ruleFns = Object.values(AUDIT_RULES);
  for (const rule of ruleFns) {
    const out = await rule(packDir);
    findings.push(...out);
  }

  const hasError = findings.some((f) => f.severity === 'error');
  const hasWarn = findings.some((f) => f.severity === 'warn');
  const exitCode: 0 | 1 | 2 = hasError ? 2 : hasWarn ? 1 : 0;

  return {
    packId,
    packDir,
    rulesRun: ruleFns.length,
    findings,
    exitCode,
  };
}

/**
 * Format an AuditResult as a pretty-printed string for stdout.
 * JSON output is better for CI; pretty is better for humans — the CLI
 * picks based on a flag.
 */
export function formatAuditPretty(result: AuditResult): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(`📋 pretext audit ${result.packId}`);
  lines.push('');
  lines.push(`  Rules: ${result.rulesRun}`);
  lines.push(`  Findings: ${result.findings.length}`);
  lines.push('');

  if (result.findings.length === 0) {
    lines.push('  ✓ clean');
    lines.push('');
    return lines.join('\n');
  }

  const byRule = new Map<string, Finding[]>();
  for (const f of result.findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule)!.push(f);
  }

  for (const [rule, group] of byRule) {
    for (const f of group) {
      const icon = f.severity === 'error' ? '✗' : f.severity === 'warn' ? '⚠' : 'ℹ';
      const loc = f.file ? `\n      ${f.file}${f.line !== undefined ? `:${f.line}` : ''}` : '';
      lines.push(`  ${icon} ${rule}: ${f.message}${loc}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
