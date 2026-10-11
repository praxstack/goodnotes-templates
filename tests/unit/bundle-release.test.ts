/**
 * GNT-025 — bundle-release must validate --month and PDF before deleting anything.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveBundleDir, validateMonth } from '../../scripts/bundle-paths.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('bundle-paths', () => {
  it('accepts a normal month', () => {
    const r = resolveBundleDir('/repo', 'May 2026');
    expect(r.dir).toBe(path.join('/repo', 'output', 'The Praxis Ledger — May 2026'));
  });
  it.each(['..', '../..', '/../x 2026', 'May 2026/..', 'a/b 2026', '', 'May', 'May 2026\n..'])(
    'rejects %j',
    (m) => {
      expect(() => resolveBundleDir('/repo', m)).toThrow();
    },
  );
  it('validateMonth returns the input when valid', () => {
    expect(validateMonth('June 2027')).toBe('June 2027');
  });
});

describe('bundle-release CLI', () => {
  it('missing PDF exits non-zero and does not remove an existing bundle', () => {
    const month = 'Zzz 1999';
    const dir = path.join(root, 'output', `The Praxis Ledger — ${month}`);
    fs.mkdirSync(dir, { recursive: true });
    const sentinel = path.join(dir, 'keep.txt');
    fs.writeFileSync(sentinel, 'x');
    try {
      const r = spawnSync(
        'npx',
        ['tsx', 'scripts/bundle-release.ts', '--pdf', path.join(os.tmpdir(), 'nope-does-not-exist.pdf'), '--month', month],
        { cwd: root, encoding: 'utf8' },
      );
      expect(r.status).not.toBe(0);
      expect(fs.existsSync(sentinel)).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('--month ".." is rejected before touching the filesystem', () => {
    const r = spawnSync(
      'npx',
      ['tsx', 'scripts/bundle-release.ts', '--pdf', 'package.json', '--month', '..', '--dry-run'],
      { cwd: root, encoding: 'utf8' },
    );
    expect(r.status).toBe(2);
    expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true);
  }, 60_000);
});
