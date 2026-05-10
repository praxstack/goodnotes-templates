/**
 * smoke-theme-injection — prove theme CSS injection actually recolors a pack.
 *
 * Why this exists
 * ---------------
 * Before committing to pre-rendering 378 PDFs (27 packs × 14 themes), we need
 * to verify the mechanism: does injecting a theme CSS file after the pack's
 * own `:root` actually override its colors? Previous discovery showed 25/27
 * packs use matching CSS custom property names (--background, --foreground,
 * --primary, etc.), so a last-wins cascade SHOULD work. This script proves it.
 *
 * Output: 3 PDFs in dist/smoke/
 *   - cornell-notes.unthemed.pdf    (baseline, pack's own bubblegum palette)
 *   - cornell-notes.claude.pdf      (claude terracotta palette)
 *   - cornell-notes.cyberpunk.pdf   (cyberpunk palette — visual extreme)
 *
 * Manual verify: open the 3 PDFs, confirm the non-baseline ones look recolored
 * without broken layout, fonts still render, shadows still work.
 *
 * If this passes → build render-all-pack-themes.ts. If it fails → stop and
 * surface why (likely a pack hardcoded hex instead of var()).
 */

import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  closeBrowser,
  renderHTMLToPDFFile,
} from '../packages/core/src/puppeteer-renderer.js';
import { getPageDimensions } from '../packages/core/src/dimensions.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const OUT = path.join(REPO_ROOT, 'dist', 'smoke');

/**
 * Inject theme CSS into a self-contained pack HTML. Strategy:
 * - Read the pack HTML as a string
 * - Append a <style id="theme-override"> block at the end of <head>
 * - CSS cascade: last-defined :root {} wins, so theme colors override pack colors
 * - Theme CSS only touches color tokens (--background, --foreground, --primary,
 *   --accent, --border, etc.), NOT layout tokens (--page-w, --s1, --font-sans,
 *   --shadow-card), so the pack's identity (fonts, spacing, shadow recipe)
 *   survives the recolor.
 *
 * Returns the modified HTML string or null if <head> isn't findable.
 */
async function applyTheme(
  packHtmlPath: string,
  themeCssPath: string,
): Promise<string | null> {
  const [html, themeCss] = await Promise.all([
    readFile(packHtmlPath, 'utf8'),
    readFile(themeCssPath, 'utf8'),
  ]);
  if (!html.includes('</head>')) return null;
  return html.replace(
    '</head>',
    `<style id="theme-override" data-theme="${path.basename(themeCssPath, '.css')}">\n${themeCss}\n</style>\n</head>`,
  );
}

async function renderOne(
  label: string,
  packHtmlPath: string,
  themeCssPath: string | null,
  outPath: string,
): Promise<void> {
  const dims = getPageDimensions('a4', 'portrait');
  const t0 = Date.now();

  let htmlContent: string | undefined;
  if (themeCssPath) {
    const injected = await applyTheme(packHtmlPath, themeCssPath);
    if (!injected) {
      throw new Error(`[smoke] could not inject theme into ${packHtmlPath} — no </head>`);
    }
    htmlContent = injected;
  }

  await renderHTMLToPDFFile(
    {
      htmlPath: packHtmlPath, // still needed for base-URL resolution
      dimensions: dims,
      htmlContent,
    },
    outPath,
  );
  const s = await stat(outPath);
  const ms = Date.now() - t0;
  console.log(
    `  ${label.padEnd(24)} ${(s.size / 1024).toFixed(0).padStart(4)} KB · ${ms} ms → ${path.relative(REPO_ROOT, outPath)}`,
  );
}

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });

  const pack = path.join(REPO_ROOT, 'packages/packs-cornell-notes/cornell-notes.html');
  const claudeTheme = path.join(REPO_ROOT, 'packages/core/assets/themes/claude.css');
  const cyberpunkTheme = path.join(REPO_ROOT, 'packages/core/assets/themes/cyberpunk.css');

  console.log('[smoke-theme-injection] rendering cornell-notes × {unthemed, claude, cyberpunk}\n');

  await renderOne('unthemed (baseline)', pack, null, path.join(OUT, 'cornell-notes.unthemed.pdf'));
  await renderOne('claude theme', pack, claudeTheme, path.join(OUT, 'cornell-notes.claude.pdf'));
  await renderOne('cyberpunk theme', pack, cyberpunkTheme, path.join(OUT, 'cornell-notes.cyberpunk.pdf'));

  await closeBrowser();

  console.log('\n[smoke-theme-injection] done.');
  console.log('Inspect the 3 PDFs visually. If claude looks warm-terracotta and');
  console.log('cyberpunk looks neon-dark, the mechanism works → proceed to render');
  console.log('all 378 (pack × theme) combinations.');
}

await main();
