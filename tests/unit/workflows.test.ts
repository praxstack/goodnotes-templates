/**
 * GNT-002 — generate.yml must reference files/paths that exist.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

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

  it('release notes do not promise stickers (no longer produced)', () => {
    expect(wf).not.toMatch(/sticker/i);
  });

  it('artifact path matches the renderer output dir', () => {
    expect(wf).toContain('dist/packs/');
    expect(fs.readFileSync(path.join(root, 'scripts/render-all-packs.ts'), 'utf8')).toContain('dist/packs');
  });
});

describe('generate.yml release gating (codex P1)', () => {
  type Step = { name?: string; run?: string; uses?: string; with?: Record<string, unknown> };
  type Job = { if?: string; steps: Step[] };
  const doc = parse(wf) as {
    on: { push: { tags?: string[] } };
    jobs: { generate: Job; release: Job };
  };
  const { release } = doc.jobs;

  it('publishes a release only from a pushed v* tag, never from a main push', () => {
    expect(doc.on.push.tags).toContain('v*');
    expect(release.if).toMatch(/startsWith\(github\.ref, 'refs\/tags\/v'\)/);
    expect(release.if).not.toMatch(/refs\/heads\/main/);
  });

  it('fails when the tag does not match package.json and never overwrites published assets', () => {
    const check = release.steps.find((s) => s.run?.includes('GITHUB_REF_NAME'));
    expect(check?.run).toMatch(/require\("\.\/package\.json"\)\.version/);
    expect(check?.run).toMatch(/exit 1/);
    const publish = release.steps.find((s) => s.uses?.startsWith('softprops/action-gh-release@'));
    expect(publish?.with?.tag_name).toBe('${{ github.ref_name }}');
    expect(publish?.with?.overwrite_files).toBe(false);
    const checkIdx = release.steps.indexOf(check as Step);
    expect(checkIdx).toBeLessThan(release.steps.indexOf(publish as Step));
  });
});

describe('ci.yml', () => {
  const ci = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');

  it('installs poppler-utils before the unit tests (example PDF PII test needs pdftotext)', () => {
    const install = ci.search(/apt-get install[^\n]*poppler-utils/);
    const tests = ci.indexOf('npm test');
    expect(install).toBeGreaterThan(-1);
    expect(install).toBeLessThan(tests);
  });
});
