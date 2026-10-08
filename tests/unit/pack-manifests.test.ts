/**
 * render-all-packs must not silently drop a pack whose manifest cannot be loaded:
 * the release ZIP promises one PDF per pack.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPackManifests } from '../../scripts/pack-manifests.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function fixture(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goodnotes-templates-manifests-'));
  for (const [rel, body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), body);
  }
  return dir;
}

describe('loadPackManifests', () => {
  it('reports a malformed or incomplete manifest as an error instead of skipping it', async () => {
    const dir = fixture({
      'packs-good/manifest.json': JSON.stringify({ id: 'good', name: 'Good', entry: 'good.html', version: '1.0.0' }),
      'packs-broken/manifest.json': '{ not json',
      'packs-partial/manifest.json': JSON.stringify({ id: 'partial', name: 'Partial' }),
      'core/manifest.json': '{ not json',
    });
    try {
      const { manifests, errors } = await loadPackManifests(dir);
      expect(manifests.map((m) => m.id)).toEqual(['good']);
      expect(errors.map((e) => e.id).sort()).toEqual(['packs-broken', 'packs-partial']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('skips a packs-* directory that has no manifest.json', async () => {
    const dir = fixture({ 'packs-empty/README.md': 'x' });
    try {
      expect(await loadPackManifests(dir)).toEqual({ manifests: [], errors: [] });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('loads every repository pack manifest without error', async () => {
    const { manifests, errors } = await loadPackManifests(path.join(root, 'packages'));
    expect(errors).toEqual([]);
    expect(manifests.length).toBe(
      fs.readdirSync(path.join(root, 'packages')).filter((d) => d.startsWith('packs-')).length,
    );
  });
});

describe('render-all-packs', () => {
  it('counts manifest load errors as render failures', () => {
    const src = fs.readFileSync(path.join(root, 'scripts/render-all-packs.ts'), 'utf8');
    expect(src).toMatch(/loadPackManifests\(/);
    expect(src).toMatch(/for \(const e of manifestErrors\) results\.push\(\{ id: e\.id, kind: 'err'/);
  });
});
