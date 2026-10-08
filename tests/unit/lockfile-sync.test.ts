/**
 * GNT-001 — package-lock.json must stay in sync with package.json so that
 * `npm ci` (used by CI, Dependabot and the monthly audit) succeeds.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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

/** GNT-003 — floor versions that clear the `npm audit --audit-level=high` gate. */
describe('vulnerable direct dependencies (GNT-003)', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const ver = (name: string): number[] => {
    const hits = Object.entries<{ version: string }>(lock.packages)
      .filter(([k]) => k === `node_modules/${name}` || k.endsWith(`/node_modules/${name}`))
      .map(([, v]) => v.version);
    expect(hits.length).toBeGreaterThan(0);
    return hits.map((v) => v.split('.').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])[0];
  };
  const atLeast = (have: number[], min: number[]) =>
    have[0] !== min[0] ? have[0] > min[0] : have[1] !== min[1] ? have[1] > min[1] : have[2] >= min[2];

  it.each([
    ['astro', [7, 2, 8]],
    ['sharp', [0, 35, 4]],
    ['puppeteer', [25, 0, 0]],
  ])('%s is locked at or above the patched version', (name, min) => {
    expect(atLeast(ver(name as string), min as number[])).toBe(true);
  });
});
