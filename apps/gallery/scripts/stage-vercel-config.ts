/**
 * stage-vercel-config — copy repo-root `vercel.json` into the gallery's
 * public/ directory so the headers travel with the deploy.
 *
 * Background
 * ----------
 * Our deploy flow is:
 *
 *     cd apps/gallery
 *     npm run build          # → apps/gallery/dist/
 *     npx vercel --cwd=dist --prod …
 *
 * `vercel --cwd=dist` ONLY uploads files inside `dist/`. The repo-root
 * `vercel.json` (shipped in commit `d8c46dd` as T-005 / FIND-I4-005) was
 * never in that upload, so the headers config never reached Vercel. Live
 * `curl -I https://pretext-templates.vercel.app/` returned no CSP / no
 * X-Content-Type-Options / no Referrer-Policy / no Permissions-Policy —
 * even though the file was sitting right there in the repo.
 *
 * This script runs during the gallery build (after astro build) and
 * copies `vercel.json` from the repo root into `apps/gallery/public/`.
 * Astro's build pipeline copies `public/` contents into `dist/` verbatim.
 * Net effect: `dist/vercel.json` exists, the `vercel --cwd=dist` upload
 * carries it, Vercel honors the headers.
 *
 * Why not just use `vercel --cwd=..` or change the deploy flow?
 * Because that's a larger blast radius: the Vercel project linking,
 * build-step config, and `.vercel/project.json` would all shift. A one-file
 * copy is atomic, reversible (delete the file in public/), and local to the
 * gallery's build contract.
 *
 * This approach mirrors how Next.js / Astro / Remix projects routinely
 * place `vercel.json` inside their output dir on Vercel's recommendation
 * when deploying prebuilt output. The canonical approach in the Vercel
 * docs is "vercel.json in the output dir or project root". We chose
 * output-dir because of our cross-directory deploy flow.
 *
 * Exits:
 *   0 — copied successfully (happy path)
 *   1 — source vercel.json missing (indicates repo corruption; don't
 *       silently deploy headerless)
 *
 * Companion:
 *   - tests/unit/vercel-config.test.ts (pins the CONFIG SHAPE)
 *   - scripts/smoke-prod-headers.sh (asserts the LIVE DELIVERY)
 */

import { copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(GALLERY_ROOT, '..', '..');
const SRC = path.join(REPO_ROOT, 'vercel.json');
const DST = path.join(GALLERY_ROOT, 'public', 'vercel.json');

function main(): void {
  try {
    // Throws if SRC doesn't exist — we want loud failure, not silent headerless deploy.
    const s = statSync(SRC);
    copyFileSync(SRC, DST);
    const kb = (s.size / 1024).toFixed(1);
    console.log(
      `[stage-vercel-config] copied vercel.json (${kb} KB) → ${path.relative(REPO_ROOT, DST)}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[stage-vercel-config] FATAL: could not stage vercel.json: ${msg}`);
    console.error(
      `[stage-vercel-config] Expected source at: ${path.relative(REPO_ROOT, SRC)}`,
    );
    console.error(
      `[stage-vercel-config] If you intentionally removed it, remove this script from the build pipeline too.`,
    );
    process.exit(1);
  }
}

main();
