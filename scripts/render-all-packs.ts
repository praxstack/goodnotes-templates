/**
 * render-all-packs — render every registry pack to PDF for a release artifact.
 *
 * Why this exists
 * ---------------
 * GitHub Releases / Etsy-style downloads expect a single `pretext-templates-
 * v<ver>-packs.zip` that non-technical users can drop into GoodNotes. This
 * script walks every `packages/packs-<id>/manifest.json`, resolves `entry`, and
 * renders it to `dist/packs/<id>.pdf` via the same Puppeteer pipeline that
 * ships inside `@pretext-templates/core`.
 *
 * Design notes
 * ------------
 * - Sequential by default. Parallelism-via-multiple-browsers sounds attractive
 *   but each Chromium instance is ~200-400 MB resident, and the whole point
 *   of this script is to run once per release on any laptop. 26 packs × 3 s
 *   ≈ 80 s total is fine.
 * - We use `closeBrowser()` at the end so the Node process actually exits;
 *   Puppeteer otherwise leaves its child alive.
 * - Errors don't abort the whole run — we collect them and print a summary.
 *   A single broken pack shouldn't block a release.
 * - Output size is reported so we can diff against prior releases.
 */

import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  closeBrowser,
  renderHTMLToPDFFile,
} from '../packages/core/src/puppeteer-renderer.js';
import { getPageDimensions } from '../packages/core/src/dimensions.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const PACKAGES = path.join(REPO_ROOT, 'packages');
const OUT = path.join(REPO_ROOT, 'dist', 'packs');

type ManifestLite = {
  id: string;
  name: string;
  entry: string;
  version: string;
};

type Result =
  | { id: string; kind: 'ok'; outPath: string; bytes: number; ms: number }
  | { id: string; kind: 'err'; error: string };

async function loadManifests(): Promise<ManifestLite[]> {
  const dirs = (await readdir(PACKAGES)).filter((n) => n.startsWith('packs-'));
  const out: ManifestLite[] = [];
  for (const d of dirs.sort()) {
    const file = path.join(PACKAGES, d, 'manifest.json');
    try {
      const raw = await readFile(file, 'utf8');
      const m = JSON.parse(raw) as ManifestLite;
      out.push(m);
    } catch {
      // Skip silently — not every packs-* dir is a pack (defensive).
    }
  }
  return out;
}

async function main(): Promise<void> {
  const start = Date.now();
  const manifests = await loadManifests();
  await mkdir(OUT, { recursive: true });

  console.log(
    `[render-all-packs] rendering ${manifests.length} packs → ${path.relative(REPO_ROOT, OUT)}/`,
  );

  const results: Result[] = [];
  const dims = getPageDimensions('a4', 'portrait');

  for (let i = 0; i < manifests.length; i++) {
    const m = manifests[i];
    const entryPath = path.join(PACKAGES, `packs-${m.id}`, m.entry);
    const outPath = path.join(OUT, `${m.id}.pdf`);
    const t0 = Date.now();
    try {
      await renderHTMLToPDFFile(
        { htmlPath: entryPath, dimensions: dims },
        outPath,
      );
      const s = await stat(outPath);
      const ms = Date.now() - t0;
      results.push({
        id: m.id,
        kind: 'ok',
        outPath,
        bytes: s.size,
        ms,
      });
      console.log(
        `  [${String(i + 1).padStart(2)}/${manifests.length}] ${m.id.padEnd(26)} ${(s.size / 1024).toFixed(0).padStart(5)} KB · ${ms} ms`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: m.id, kind: 'err', error: msg });
      console.log(
        `  [${String(i + 1).padStart(2)}/${manifests.length}] ${m.id.padEnd(26)} ✗ ${msg}`,
      );
    }
  }

  await closeBrowser();

  const ok = results.filter((r) => r.kind === 'ok');
  const errs = results.filter((r) => r.kind === 'err');
  const totalBytes = ok.reduce(
    (acc, r) => acc + (r.kind === 'ok' ? r.bytes : 0),
    0,
  );
  const ms = Date.now() - start;

  console.log('');
  console.log(
    `[render-all-packs] done · ${ok.length} ok · ${errs.length} failed · ${(totalBytes / 1024).toFixed(0)} KB total · ${(ms / 1000).toFixed(1)} s`,
  );
  if (errs.length > 0) {
    console.log('[render-all-packs] failures:');
    for (const e of errs) {
      if (e.kind === 'err') console.log(`  - ${e.id}: ${e.error}`);
    }
    process.exit(1);
  }
}

await main();
