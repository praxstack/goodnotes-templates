/**
 * GNT-002 — generate.yml must reference files/paths that exist.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const wf = fs.readFileSync(path.join(root, '.github/workflows/generate.yml'), 'utf8');

describe('generate.yml (GNT-002)', () => {
  it('does not call the removed src/cli entry point', () => {
    expect(wf).not.toMatch(/src\/cli\/index\.ts/);
  });

  it('every `tsx <script>` it runs exists', () => {
    const scripts = [...wf.matchAll(/npx tsx (\S+)/g)].map((m) => m[1]);
    expect(scripts.length).toBeGreaterThan(0);
    for (const s of scripts) expect(fs.existsSync(path.join(root, s)), s).toBe(true);
  });

  it('push path filters point at directories that exist', () => {
    const block = wf.split('paths:')[1].split('workflow_dispatch')[0];
    const paths = [...block.matchAll(/- '([^']+)'/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      const base = p.replace(/\/\*\*$/, '');
      expect(fs.existsSync(path.join(root, base)), p).toBe(true);
    }
  });

  it('artifact path matches the renderer output dir', () => {
    expect(wf).toContain('dist/packs/');
    expect(fs.readFileSync(path.join(root, 'scripts/render-all-packs.ts'), 'utf8')).toContain('dist/packs');
  });
});
