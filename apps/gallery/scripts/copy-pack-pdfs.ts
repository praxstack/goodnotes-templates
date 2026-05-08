/**
 * copy-pack-pdfs — stage rendered pack PDFs for the gallery's /packs/<id>.pdf routes.
 *
 * Why this exists
 * ---------------
 * `apps/gallery/public/packs/<id>.pdf` is what the in-page "Download PDF"
 * button links to. Those PDFs are generated upstream by
 * `scripts/render-all-packs.ts` (at the repo root, into `dist/packs/`).
 * This script just mirrors them into the gallery's `public/` tree so
 * `astro build` picks them up as static assets.
 *
 * Why not render here
 * -------------------
 * Rendering inside gallery-build would couple the gallery deploy to a
 * Puppeteer install on the deploy host (Vercel build containers work
 * but the cold start and memory blow the free-tier build budget).
 * Upstream render happens once per release (or on demand), and this
 * step is a dumb file copy — fast, offline, predictable.
 *
 * Behaviour
 * ---------
 * - Idempotent. Re-runs cleanly.
 * - Exits 1 if `dist/packs/` is missing or has fewer than 1 PDF.
 * - Logs the pack-count + total MB so CI output has something useful.
 * - Prunes stale PDFs from the target dir that don't correspond to a
 *   current pack (e.g. if a pack was deleted and re-renamed).
 *
 * Usage
 * -----
 *   # from repo root, after `npx tsx scripts/render-all-packs.ts`:
 *   npx tsx apps/gallery/scripts/copy-pack-pdfs.ts
 *
 * Wired into `apps/gallery/package.json` > scripts.build so
 * `npm run build -w @pretext-templates/gallery` picks it up.
 */

import { copyFile, mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(GALLERY_ROOT, '..', '..');
const SRC = path.join(REPO_ROOT, 'dist', 'packs');
const DST = path.join(GALLERY_ROOT, 'public', 'packs');

async function main(): Promise<void> {
  if (!existsSync(SRC)) {
    console.error(
      `[copy-pack-pdfs] source ${path.relative(REPO_ROOT, SRC)} does not exist. ` +
        `Run \`npx tsx scripts/render-all-packs.ts\` first.`,
    );
    process.exit(1);
  }

  const srcFiles = (await readdir(SRC)).filter((f) => f.endsWith('.pdf'));
  if (srcFiles.length === 0) {
    console.error(`[copy-pack-pdfs] source ${path.relative(REPO_ROOT, SRC)} has no PDFs.`);
    process.exit(1);
  }

  await mkdir(DST, { recursive: true });

  // Prune stale: anything in DST/*.pdf that is NOT in srcFiles is dropped.
  const existing = (await readdir(DST)).filter((f) => f.endsWith('.pdf'));
  const srcSet = new Set(srcFiles);
  let pruned = 0;
  for (const stale of existing) {
    if (!srcSet.has(stale)) {
      await unlink(path.join(DST, stale));
      pruned++;
    }
  }

  let bytes = 0;
  for (const f of srcFiles) {
    const s = await stat(path.join(SRC, f));
    bytes += s.size;
    await copyFile(path.join(SRC, f), path.join(DST, f));
  }

  const mb = (bytes / 1024 / 1024).toFixed(2);
  console.log(
    `[copy-pack-pdfs] staged ${srcFiles.length} PDFs · ${mb} MB → ${path.relative(REPO_ROOT, DST)}/` +
      (pruned > 0 ? ` (pruned ${pruned} stale)` : ''),
  );
}

await main();
