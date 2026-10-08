/**
 * Pure manifest loader for scripts/render-all-packs.ts (no Puppeteer import).
 * A packs-* directory without manifest.json is skipped; one whose manifest
 * cannot be read, parsed or lacks a required field is reported as an error,
 * so the release never ships a ZIP that silently omits a pack.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export type ManifestLite = {
  id: string;
  name: string;
  entry: string;
  version: string;
};

export type ManifestError = { id: string; error: string };

const REQUIRED = ['id', 'name', 'entry', 'version'] as const;

export async function loadPackManifests(
  packagesDir: string,
): Promise<{ manifests: ManifestLite[]; errors: ManifestError[] }> {
  const dirs = (await readdir(packagesDir)).filter((n) => n.startsWith('packs-')).sort();
  const manifests: ManifestLite[] = [];
  const errors: ManifestError[] = [];
  for (const d of dirs) {
    const file = path.join(packagesDir, d, 'manifest.json');
    let raw: string;
    try {
      raw = await readFile(file, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
      errors.push({ id: d, error: `cannot read manifest.json: ${(err as Error).message}` });
      continue;
    }
    try {
      const m = JSON.parse(raw) as Record<string, unknown>;
      const missing = REQUIRED.filter((k) => typeof m[k] !== 'string' || m[k] === '');
      if (missing.length > 0) {
        errors.push({ id: d, error: `manifest.json missing ${missing.join(', ')}` });
        continue;
      }
      manifests.push(m as unknown as ManifestLite);
    } catch (err) {
      errors.push({ id: d, error: `invalid manifest.json: ${(err as Error).message}` });
    }
  }
  return { manifests, errors };
}
