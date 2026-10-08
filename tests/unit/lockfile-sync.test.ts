/**
 * GNT-001 — package-lock.json must stay in sync with package.json so that
 * `npm ci` (used by CI, Dependabot and the monthly audit) succeeds.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');

describe('lockfile sync (GNT-001)', () => {
  it('npm ci --dry-run accepts package-lock.json', () => {
    const r = spawnSync('npm', ['ci', '--dry-run', '--offline', '--ignore-scripts'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(r.stderr).not.toMatch(/can only install packages when your package\.json and package-lock\.json are in sync/);
    expect(r.status).toBe(0);
  }, 60_000);

  it('does not carry a second, divergent package manager lockfile', () => {
    expect(fs.existsSync(path.join(root, 'pnpm-lock.yaml'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'pnpm-workspace.yaml'))).toBe(false);
  });
});
