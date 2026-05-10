/**
 * render-all-pack-themes — render every pack × theme combination to PDF.
 *
 * Why this exists
 * ---------------
 * v1.0.0 shipped with a single canonical PDF per pack (27 PDFs, one palette
 * each, matching the pack author's design choice). Users who liked a pack's
 * layout but wanted a different color story had no recourse except forking.
 *
 * Smoke test (scripts/smoke-theme-injection.ts) proved that appending a
 * theme CSS file inside the pack's <head> — AFTER the pack's own `:root`
 * block — recolors the pack without touching its layout tokens, fonts, or
 * shadows, because all 14 themes + 25/27 packs share the same CSS custom
 * property vocabulary (--background, --foreground, --primary, --accent,
 * --border, --muted-foreground, etc.).
 *
 * This script walks that matrix: 27 packs × 14 themes = 378 PDFs, rendered
 * into `dist/packs-themed/<id>/<theme>.pdf`. The gallery's theme picker
 * then links to these files same-origin.
 *
 * Design notes
 * ------------
 * - Sequential by default. Same reasoning as render-all-packs: parallel
 *   Chromium instances eat RAM. 378 × ~1.1 s ≈ 7 minutes total, acceptable
 *   for a release artifact.
 * - In-memory HTML injection via `htmlContent`. No temp files, no risk of
 *   leaking a modified HTML back into the repo. Original pack HTML on disk
 *   is never touched — self-contained invariant preserved at the source.
 * - Layout tokens (--page-w, --s1..--s5, --font-sans, --shadow-card) are
 *   defined in the pack but NOT in the theme files. CSS cascade = pack
 *   sets them once, theme overrides only the color tokens.
 * - Failures collected, not aborted. One broken pack shouldn't block the
 *   other 377. Summary at the end reports failures + exits non-zero.
 * - Output is gitignored (.gitignore already has dist/). Regenerable.
 *
 * Wiring: `apps/gallery/scripts/copy-pack-themed-pdfs.ts` will stage these
 * PDFs into `apps/gallery/public/packs/<id>/<theme>.pdf` for same-origin
 * serving, same pattern as the existing `copy-pack-pdfs.ts`.
 */

import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  closeBrowser,
  renderHTMLToPDF,
} from '../packages/core/src/puppeteer-renderer.js';
import { getPageDimensions } from '../packages/core/src/dimensions.js';
import { writeFile } from 'node:fs/promises';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const PACKAGES = path.join(REPO_ROOT, 'packages');
const THEMES_DIR = path.join(REPO_ROOT, 'packages/core/assets/themes');
const OUT = path.join(REPO_ROOT, 'dist', 'packs-themed');

type ManifestLite = {
  id: string;
  name: string;
  entry: string;
  version: string;
};

type Result =
  | { kind: 'ok'; packId: string; themeId: string; bytes: number; ms: number }
  | { kind: 'err'; packId: string; themeId: string; error: string };

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
      // Not a pack dir — skip (defensive, matches render-all-packs).
    }
  }
  return out;
}

async function loadThemeIds(): Promise<string[]> {
  const files = await readdir(THEMES_DIR);
  // Return "<name>" for each <name>.css (including dark variants).
  // Sort by family (light before dark within the same family).
  const ids = files
    .filter((f) => f.endsWith('.css'))
    .map((f) => f.replace(/\.css$/, ''));
  ids.sort((a, b) => {
    const aFamily = a.replace(/-dark$/, '');
    const bFamily = b.replace(/-dark$/, '');
    if (aFamily !== bFamily) return aFamily.localeCompare(bFamily);
    // Same family: light first, then dark.
    return a.endsWith('-dark') ? 1 : -1;
  });
  return ids;
}

/**
 * Inject a theme CSS block at end of <head>. Returns the modified HTML, or
 * null if we can't find </head> (defensive — all our packs have it, but if
 * a future pack doesn't we surface it as a skip, not a crash).
 */
async function applyTheme(
  packHtml: string,
  themeCss: string,
  themeId: string,
): Promise<string | null> {
  if (!packHtml.includes('</head>')) return null;
  return packHtml.replace(
    '</head>',
    `<style id="theme-override" data-theme="${themeId}">\n${themeCss}\n</style>\n</head>`,
  );
}

async function main(): Promise<void> {
  const start = Date.now();
  const manifests = await loadManifests();
  const themeIds = await loadThemeIds();

  await mkdir(OUT, { recursive: true });

  const total = manifests.length * themeIds.length;
  console.log(
    `[render-all-pack-themes] ${manifests.length} packs × ${themeIds.length} themes = ${total} PDFs → ${path.relative(REPO_ROOT, OUT)}/<pack>/<theme>.pdf`,
  );
  console.log('');

  const dims = getPageDimensions('a4', 'portrait');
  const results: Result[] = [];

  // Pre-load all theme CSS strings (tiny — 14 × ~1 KB).
  const themeCss: Record<string, string> = {};
  for (const id of themeIds) {
    themeCss[id] = await readFile(path.join(THEMES_DIR, `${id}.css`), 'utf8');
  }

  let done = 0;
  for (const m of manifests) {
    const packHtmlPath = path.join(PACKAGES, `packs-${m.id}`, m.entry);
    if (!existsSync(packHtmlPath)) {
      // Pack listed in directory but entry missing — skip the whole row.
      for (const t of themeIds) {
        results.push({ kind: 'err', packId: m.id, themeId: t, error: `entry missing: ${m.entry}` });
        done++;
      }
      continue;
    }
    const packHtml = await readFile(packHtmlPath, 'utf8');
    const packDir = path.join(OUT, m.id);
    await mkdir(packDir, { recursive: true });

    for (const themeId of themeIds) {
      done++;
      const outPath = path.join(packDir, `${themeId}.pdf`);
      const t0 = Date.now();
      try {
        const injected = await applyTheme(packHtml, themeCss[themeId], themeId);
        if (!injected) throw new Error('no </head> in pack HTML — cannot inject theme');

        const buf = await renderHTMLToPDF({
          htmlPath: packHtmlPath, // for relative URL resolution
          dimensions: dims,
          htmlContent: injected,
        });
        await writeFile(outPath, buf);
        const s = await stat(outPath);
        const ms = Date.now() - t0;
        results.push({ kind: 'ok', packId: m.id, themeId, bytes: s.size, ms });
        if (done % 20 === 0 || done === total) {
          console.log(
            `  [${String(done).padStart(3)}/${total}] ${m.id.padEnd(26)} × ${themeId.padEnd(16)} ${(s.size / 1024).toFixed(0).padStart(4)} KB · ${ms} ms`,
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ kind: 'err', packId: m.id, themeId, error: msg });
        console.log(
          `  [${String(done).padStart(3)}/${total}] ${m.id.padEnd(26)} × ${themeId.padEnd(16)} ✗ ${msg}`,
        );
      }
    }
  }

  await closeBrowser();

  const ok = results.filter((r) => r.kind === 'ok');
  const errs = results.filter((r) => r.kind === 'err');
  const totalBytes = ok.reduce((acc, r) => acc + (r.kind === 'ok' ? r.bytes : 0), 0);
  const ms = Date.now() - start;

  console.log('');
  console.log(
    `[render-all-pack-themes] ${ok.length}/${total} ok · ${errs.length} failed · ${(totalBytes / 1024 / 1024).toFixed(1)} MB total · ${(ms / 1000).toFixed(1)} s`,
  );
  if (errs.length > 0) {
    console.log('[render-all-pack-themes] failures (first 10):');
    for (const e of errs.slice(0, 10)) {
      if (e.kind === 'err') console.log(`  - ${e.packId} × ${e.themeId}: ${e.error}`);
    }
    if (errs.length > 10) console.log(`  … ${errs.length - 10} more`);
    process.exit(1);
  }
}

await main();
