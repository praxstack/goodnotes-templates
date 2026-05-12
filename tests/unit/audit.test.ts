/**
 * Iter-6 Phase 3 — audit CLI framework contract tests.
 *
 * Covers:
 *   · manifest-valid rule (missing file, malformed JSON, schema error, clean)
 *   · entry-exists rule (missing entry field, entry file missing, clean)
 *   · tokens-used rule (missing tokens → warn, all tokens present → clean)
 *   · auditPack orchestrator (exit code routing across severities)
 *   · formatAuditPretty (smoke)
 *   · real pack audit against packages/packs-habit-tracker (sanity check
 *     that the existing packs are clean under the Phase 3 rule set)
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  auditPack,
  formatAuditPretty,
  checkManifestValid,
  checkEntryExists,
  checkTokensUsed,
  AUDIT_RULES,
} from '../../packages/core/src/audit.js';

/**
 * Helper — create a throwaway pack directory with the given files, run
 * the block, then remove it. Keeps tests hermetic from real repo state.
 */
async function withPackDir(
  files: Record<string, string>,
  fn: (dir: string) => Promise<void>,
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pretext-audit-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const full = path.join(dir, name);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content, 'utf-8');
    }
    await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

const MINIMAL_VALID_MANIFEST = JSON.stringify({
  schema_version: 1,
  id: 'test-pack',
  version: '0.1.0',
  name: 'Test Pack',
  description: 'A test pack.',
  category: 'worksheet',
  author: 'test',
  entry: 'test-pack.html',
  tags: ['test'],
  repository: 'https://github.com/praxstack/goodnotes-templates',
  license: 'MIT',
});

const HTML_ALL_TOKENS = `<!DOCTYPE html>
<style>
:root {
  --background: #fff;
  --foreground: #000;
  --primary: #333;
  --accent: #666;
  --border: #ccc;
}
</style>
<body></body>`;

describe('checkManifestValid', () => {
  it('returns an error when manifest.json is missing', async () => {
    await withPackDir({}, async (dir) => {
      const findings = await checkManifestValid(dir);
      expect(findings).toHaveLength(1);
      expect(findings[0].rule).toBe('manifest-valid');
      expect(findings[0].severity).toBe('error');
      expect(findings[0].message).toMatch(/missing/);
    });
  });

  it('returns an error when manifest.json is malformed JSON', async () => {
    await withPackDir({ 'manifest.json': 'not { valid json' }, async (dir) => {
      const findings = await checkManifestValid(dir);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('error');
      expect(findings[0].message).toMatch(/not valid JSON/);
    });
  });

  it('returns an error when manifest fails schema validation', async () => {
    await withPackDir(
      {
        'manifest.json': JSON.stringify({
          schema_version: 1,
          id: 'test',
          // missing required fields: version, name, description, etc.
        }),
      },
      async (dir) => {
        const findings = await checkManifestValid(dir);
        expect(findings.length).toBeGreaterThan(0);
        expect(findings.every((f) => f.rule === 'manifest-valid')).toBe(true);
        expect(findings.every((f) => f.severity === 'error')).toBe(true);
      },
    );
  });

  it('returns no findings when manifest is valid', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': HTML_ALL_TOKENS,
      },
      async (dir) => {
        const findings = await checkManifestValid(dir);
        expect(findings).toEqual([]);
      },
    );
  });
});

describe('checkEntryExists', () => {
  it('returns no findings when entry file exists', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': HTML_ALL_TOKENS,
      },
      async (dir) => {
        const findings = await checkEntryExists(dir);
        expect(findings).toEqual([]);
      },
    );
  });

  it('returns an error when entry file is missing', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        // no test-pack.html
      },
      async (dir) => {
        const findings = await checkEntryExists(dir);
        expect(findings).toHaveLength(1);
        expect(findings[0].severity).toBe('error');
        expect(findings[0].message).toMatch(/does not exist/);
      },
    );
  });

  it('returns empty when manifest is unreadable (other rule catches it)', async () => {
    await withPackDir({}, async (dir) => {
      const findings = await checkEntryExists(dir);
      expect(findings).toEqual([]);
    });
  });
});

describe('checkTokensUsed', () => {
  it('returns no findings when all shared tokens are present', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': HTML_ALL_TOKENS,
      },
      async (dir) => {
        const findings = await checkTokensUsed(dir);
        expect(findings).toEqual([]);
      },
    );
  });

  it('returns a warning when shared tokens are missing', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': '<!DOCTYPE html><body>no tokens here</body>',
      },
      async (dir) => {
        const findings = await checkTokensUsed(dir);
        expect(findings).toHaveLength(1);
        expect(findings[0].severity).toBe('warn');
        expect(findings[0].message).toMatch(/missing --background/);
        expect(findings[0].message).toMatch(/Tier 2 theming/);
      },
    );
  });

  it('reports only the subset of tokens actually missing', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': '<style>:root{--background:#fff;--foreground:#000;}</style>',
      },
      async (dir) => {
        const findings = await checkTokensUsed(dir);
        expect(findings).toHaveLength(1);
        // --primary, --accent, --border are missing
        expect(findings[0].message).toMatch(/--primary/);
        expect(findings[0].message).toMatch(/--accent/);
        expect(findings[0].message).toMatch(/--border/);
        // --background, --foreground are present; shouldn't be named
        expect(findings[0].message).not.toMatch(/--background/);
      },
    );
  });
});

describe('auditPack orchestrator', () => {
  it('exitCode 0 for a clean pack', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': HTML_ALL_TOKENS,
      },
      async (dir) => {
        const result = await auditPack('test-pack', dir);
        expect(result.exitCode).toBe(0);
        expect(result.findings).toEqual([]);
      },
    );
  });

  it('exitCode 1 when only warnings', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': '<!DOCTYPE html><body>no tokens</body>',
      },
      async (dir) => {
        const result = await auditPack('test-pack', dir);
        expect(result.exitCode).toBe(1);
        expect(result.findings.every((f) => f.severity === 'warn')).toBe(true);
      },
    );
  });

  it('exitCode 2 when any error', async () => {
    await withPackDir(
      {
        // manifest valid but entry html missing → error
        'manifest.json': MINIMAL_VALID_MANIFEST,
      },
      async (dir) => {
        const result = await auditPack('test-pack', dir);
        expect(result.exitCode).toBe(2);
        expect(result.findings.some((f) => f.severity === 'error')).toBe(true);
      },
    );
  });

  it('exitCode 2 when pack directory is missing', async () => {
    const result = await auditPack('nonexistent', '/tmp/pretext-nonexistent-path-xyz');
    expect(result.exitCode).toBe(2);
    expect(result.findings[0].rule).toBe('pack-exists');
  });

  it('reports rulesRun = all registered rules', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': HTML_ALL_TOKENS,
      },
      async (dir) => {
        const result = await auditPack('test-pack', dir);
        expect(result.rulesRun).toBe(Object.keys(AUDIT_RULES).length);
      },
    );
  });
});

describe('formatAuditPretty', () => {
  it('prints "clean" line for a clean result', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        'test-pack.html': HTML_ALL_TOKENS,
      },
      async (dir) => {
        const result = await auditPack('test-pack', dir);
        const output = formatAuditPretty(result);
        expect(output).toContain('✓ clean');
      },
    );
  });

  it('prints severity icons per finding', async () => {
    await withPackDir(
      {
        'manifest.json': MINIMAL_VALID_MANIFEST,
        // missing HTML → entry-exists error
      },
      async (dir) => {
        const result = await auditPack('test-pack', dir);
        const output = formatAuditPretty(result);
        expect(output).toContain('✗');
      },
    );
  });
});

describe('real-world audit: habit-tracker', () => {
  it('existing habit-tracker pack passes the Phase 3 rules (or documents its gaps)', async () => {
    const result = await auditPack(
      'habit-tracker',
      'packages/packs-habit-tracker',
    );
    // We allow warnings (tokens-used may fire because the pack was authored
    // before the shared token vocabulary was finalized) but no errors —
    // manifest must be valid and entry must exist.
    const errors = result.findings.filter((f) => f.severity === 'error');
    expect(errors).toEqual([]);
  });
});
