/**
 * copy-pack-themed-pdfs — stage 378 (pack × theme) PDFs for the gallery.
 *
 * Companion to `copy-pack-pdfs.ts`, same idempotent/prune pattern, but for
 * the themed variants rendered by `scripts/render-all-pack-themes.ts`.
 *
 * Source  : dist/packs-themed/<id>/<theme>.pdf
 * Target  : apps/gallery/public/packs/<id>/<theme>.pdf
 * Serves  : /packs/<id>/<theme>.pdf (same-origin anon download)
 *
 * Behaviour
 * ---------
 * - Staleness-pruned: any `<theme>.pdf` in target that doesn't exist in source
 *   is removed. Any pack dir in target that doesn't exist in source is removed.
 * - Missing source dir = soft-exit 0, not 1 — because on a partial build
 *   (e.g. someone ran copy-pack-pdfs but not render-all-pack-themes) we don't
 *   want to fail the gallery build. Report loudly instead.
 * - Byte and count summary for CI logs.
 */

import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(GALLERY_ROOT, '..', '..');
const SRC = path.join(REPO_ROOT, 'dist', 'packs-themed');
const DST = path.join(GALLERY_ROOT, 'public', 'packs');

async function main(): Promise<void> {
  if (!existsSync(SRC)) {
    console.warn(
      `[copy-pack-themed-pdfs] source ${path.relative(REPO_ROOT, SRC)} does not exist. ` +
        `Run \`npx tsx scripts/render-all-pack-themes.ts\` first. Skipping — ` +
        `gallery will ship without themed PDFs.`,
    );
    return;
  }

  const packDirs = (await readdir(SRC, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  if (packDirs.length === 0) {
    console.warn('[copy-pack-themed-pdfs] no pack dirs in source. Skipping.');
    return;
  }

  await mkdir(DST, { recursive: true });

  let totalPdfs = 0;
  let totalBytes = 0;

  for (const pack of packDirs) {
    const srcDir = path.join(SRC, pack);
    const dstDir = path.join(DST, pack);
    await mkdir(dstDir, { recursive: true });

    const srcPdfs = (await readdir(srcDir)).filter((f) => f.endsWith('.pdf'));
    const srcSet = new Set(srcPdfs);

    // Prune stale themed PDFs in dst (theme files can be renamed/dropped between builds).
    const existing = (await readdir(dstDir)).filter((f) => f.endsWith('.pdf'));
    for (const stale of existing) {
      if (!srcSet.has(stale)) {
        await rm(path.join(dstDir, stale));
      }
    }

    for (const f of srcPdfs) {
      const s = await stat(path.join(srcDir, f));
      totalBytes += s.size;
      await copyFile(path.join(srcDir, f), path.join(dstDir, f));
      totalPdfs++;
    }
  }

  const mb = (totalBytes / 1024 / 1024).toFixed(1);
  console.log(
    `[copy-pack-themed-pdfs] staged ${totalPdfs} themed PDFs across ${packDirs.length} packs · ${mb} MB`,
  );
}

await main();
