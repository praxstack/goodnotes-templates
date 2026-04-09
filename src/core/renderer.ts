/**
 * Generation orchestrator — coordinates all renderers to produce templates,
 * stickers, and pages across themes.
 *
 * Pipeline:
 * ┌─────────────┐    ┌──────────┐    ┌───────────┐
 * │ Simple pages │ →  │  PDFKit  │ →  │ output/   │
 * │ Stickers     │ →  │ SVG+Sharp│ →  │ output/   │
 * └─────────────┘    └──────────┘    └───────────┘
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { getTheme, loadCustomThemeFromFile } from './themes.js';
import { getPageDimensions } from './dimensions.js';
import { renderSimplePage, type SimplePageType } from './pdfkit-renderer.js';
import { STICKER_SIZES, type StickerType } from './svg-renderer.js';
import { batchRenderStickers } from './png-renderer.js';
import { getMonthNames, getDayNames } from '../utils/locale.js';
import type { SupportedLocale } from '../utils/locale.js';
import type { Theme, PaperSize, Orientation } from '../types/index.js';

export interface GenerationOptions {
  themes: string[];
  paperSize: PaperSize;
  orientation: Orientation;
  year: number;
  locale: SupportedLocale;
  outputDir: string;
  dpi: number;
  generateTemplates: boolean;
  generatePages: boolean;
  generateStickers: boolean;
  verbose: boolean;
  customThemeFile?: string;
}

interface ManifestEntry {
  file: string;
  category: string;
  type: string;
  theme: string;
  size: number;
  pages?: number;
}

/**
 * Main generation entry point. Called by the CLI.
 */
export async function runGeneration(options: GenerationOptions): Promise<void> {
  const startTime = Date.now();
  const manifest: ManifestEntry[] = [];
  let fileCount = 0;
  let totalSize = 0;

  // Resolve themes
  const themes: Theme[] = [];
  if (options.customThemeFile) {
    const custom = await loadCustomThemeFromFile(options.customThemeFile);
    themes.push(custom);
  } else {
    for (const id of options.themes) {
      themes.push(getTheme(id));
    }
  }

  const dims = getPageDimensions(options.paperSize, options.orientation);

  // Ensure output directories exist
  const dirs = ['templates', 'stickers', 'pages', 'previews'].map(d =>
    path.join(options.outputDir, d)
  );
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  // ─── Generate Simple Pages ──────────────────────────────────
  if (options.generatePages) {
    console.log('📝 Generating simple pages...');

    const pageTypes: Array<{ type: SimplePageType; variants: Array<{ spacing?: number; suffix: string }> }> = [
      { type: 'lined', variants: [
        { spacing: 20, suffix: 'narrow' },
        { spacing: 24, suffix: 'college' },
        { spacing: 30, suffix: 'wide' },
      ]},
      { type: 'grid', variants: [
        { spacing: 14, suffix: '5mm' },
        { spacing: 20, suffix: '7mm' },
        { spacing: 28, suffix: '10mm' },
      ]},
      { type: 'dot-grid', variants: [
        { spacing: 14, suffix: '5mm' },
        { spacing: 20, suffix: '7mm' },
        { spacing: 28, suffix: '10mm' },
      ]},
      { type: 'blank', variants: [{ suffix: 'plain' }] },
      { type: 'isometric', variants: [{ suffix: 'standard' }] },
      { type: 'music', variants: [{ suffix: 'standard' }] },
      { type: 'calligraphy', variants: [{ suffix: 'standard' }] },
    ];

    for (const theme of themes) {
      for (const pageConfig of pageTypes) {
        for (const variant of pageConfig.variants) {
          const filename = `${pageConfig.type}-${variant.suffix}-${theme.id}-${options.paperSize}.pdf`;
          const outputPath = path.join(options.outputDir, 'pages', filename);

          try {
            const buffer = await renderSimplePage({
              pageType: pageConfig.type,
              dimensions: dims,
              theme,
              spacing: variant.spacing,
              title: `${pageConfig.type.charAt(0).toUpperCase() + pageConfig.type.slice(1)} — ${variant.suffix}`,
            });

            await fs.writeFile(outputPath, buffer);
            const size = buffer.length;
            fileCount++;
            totalSize += size;

            manifest.push({
              file: path.relative(options.outputDir, outputPath),
              category: 'pages',
              type: `${pageConfig.type}-${variant.suffix}`,
              theme: theme.id,
              size,
              pages: 1,
            });

            if (options.verbose) {
              console.log(`  ✓ ${filename} (${(size / 1024).toFixed(1)} KB)`);
            }
          } catch (err) {
            console.error(`  ✗ ${filename}: ${err instanceof Error ? err.message : err}`);
          }
        }
      }
    }
    console.log(`  Done: ${fileCount} page PDFs\n`);
  }

  // ─── Generate Stickers ──────────────────────────────────────
  if (options.generateStickers) {
    console.log('🎨 Generating stickers...');
    const stickersBefore = fileCount;

    const monthNames = getMonthNames(options.locale, 'short');
    const dayNames = getDayNames(options.locale, 'short');

    for (const theme of themes) {
      const stickerDir = path.join(options.outputDir, 'stickers', theme.id);
      await fs.mkdir(stickerDir, { recursive: true });

      // Date tabs (Jan-Dec)
      const dateTabVariants = monthNames.map((m, i) => ({ text: m, suffix: m.toLowerCase() }));
      const dateResults = await batchRenderStickers('date-tab', theme, stickerDir, dateTabVariants);
      for (const r of dateResults) {
        fileCount++;
        totalSize += r.size;
        manifest.push({ file: path.relative(options.outputDir, r.path), category: 'stickers', type: 'date-tab', theme: theme.id, size: r.size });
      }

      // Day tabs (Mon-Sun)
      const dayTabVariants = dayNames.map(d => ({ text: d, suffix: d.toLowerCase() }));
      const dayResults = await batchRenderStickers('day-tab', theme, stickerDir, dayTabVariants);
      for (const r of dayResults) {
        fileCount++;
        totalSize += r.size;
        manifest.push({ file: path.relative(options.outputDir, r.path), category: 'stickers', type: 'day-tab', theme: theme.id, size: r.size });
      }

      // Number circles (1-31)
      const numberVariants = Array.from({ length: 31 }, (_, i) => ({
        text: String(i + 1),
        suffix: String(i + 1).padStart(2, '0'),
      }));
      const numResults = await batchRenderStickers('number-circle', theme, stickerDir, numberVariants);
      for (const r of numResults) {
        fileCount++;
        totalSize += r.size;
        manifest.push({ file: path.relative(options.outputDir, r.path), category: 'stickers', type: 'number-circle', theme: theme.id, size: r.size });
      }

      // Priority markers
      const priorityResults = await batchRenderStickers('priority-marker', theme, stickerDir, [
        { text: 'P1', suffix: 'p1' }, { text: 'P2', suffix: 'p2' }, { text: 'P3', suffix: 'p3' },
      ]);
      for (const r of priorityResults) { fileCount++; totalSize += r.size; manifest.push({ file: path.relative(options.outputDir, r.path), category: 'stickers', type: 'priority-marker', theme: theme.id, size: r.size }); }

      // Checkboxes (4 states)
      const checkboxResults = await batchRenderStickers('checkbox', theme, stickerDir, [
        { variant: 0, suffix: 'empty' }, { variant: 1, suffix: 'checked' },
        { variant: 2, suffix: 'partial' }, { variant: 3, suffix: 'crossed' },
      ]);
      for (const r of checkboxResults) { fileCount++; totalSize += r.size; manifest.push({ file: path.relative(options.outputDir, r.path), category: 'stickers', type: 'checkbox', theme: theme.id, size: r.size }); }

      // Progress bars (5 levels)
      const progressResults = await batchRenderStickers('progress-bar', theme, stickerDir, [
        { variant: 0, suffix: '0pct' }, { variant: 1, suffix: '25pct' },
        { variant: 2, suffix: '50pct' }, { variant: 3, suffix: '75pct' }, { variant: 4, suffix: '100pct' },
      ]);
      for (const r of progressResults) { fileCount++; totalSize += r.size; manifest.push({ file: path.relative(options.outputDir, r.path), category: 'stickers', type: 'progress-bar', theme: theme.id, size: r.size }); }

      // Sticky notes, washi, banners, dividers, frames, weather, stars, arrows
      const multiVariantTypes: Array<{ type: StickerType; count: number; namePrefix: string }> = [
        { type: 'sticky-note', count: 4, namePrefix: 'style' },
        { type: 'washi-tape', count: 5, namePrefix: 'pattern' },
        { type: 'banner', count: 1, namePrefix: 'style' },
        { type: 'divider', count: 3, namePrefix: 'style' },
        { type: 'frame', count: 3, namePrefix: 'style' },
        { type: 'weather-icon', count: 5, namePrefix: 'type' },
        { type: 'star-rating', count: 5, namePrefix: 'stars' },
        { type: 'arrow', count: 4, namePrefix: 'dir' },
      ];

      for (const { type, count, namePrefix } of multiVariantTypes) {
        const variants = Array.from({ length: count }, (_, i) => ({
          variant: i,
          suffix: `${namePrefix}-${i + 1}`,
        }));
        const results = await batchRenderStickers(type, theme, stickerDir, variants);
        for (const r of results) {
          fileCount++;
          totalSize += r.size;
          manifest.push({ file: path.relative(options.outputDir, r.path), category: 'stickers', type, theme: theme.id, size: r.size });
        }
      }

      if (options.verbose) {
        console.log(`  ✓ ${theme.id}: ${fileCount - stickersBefore} stickers`);
      }
    }
    console.log(`  Done: ${fileCount - stickersBefore} sticker PNGs\n`);
  }

  // ─── Write Manifest ─────────────────────────────────────────
  const manifestPath = path.join(options.outputDir, 'manifest.json');
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const manifestData = {
    generated: new Date().toISOString(),
    version: '1.0.0',
    duration: `${duration}s`,
    totalFiles: fileCount,
    totalSize: totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    options: {
      themes: options.themes,
      paperSize: options.paperSize,
      orientation: options.orientation,
      year: options.year,
      locale: options.locale,
      dpi: options.dpi,
    },
    files: manifest,
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifestData, null, 2));

  // ─── Summary ────────────────────────────────────────────────
  console.log('┌──────────────────────────────────────────┐');
  console.log('│       Generation Complete! 🎉             │');
  console.log('├──────────────────────────────────────────┤');
  console.log(`│  Files generated: ${String(fileCount).padStart(6)}               │`);
  console.log(`│  Total size:      ${(totalSize / 1024 / 1024).toFixed(2).padStart(6)} MB            │`);
  console.log(`│  Duration:        ${duration.padStart(6)}s               │`);
  console.log(`│  Manifest:        manifest.json           │`);
  console.log('└──────────────────────────────────────────┘');
  console.log(`\nOutput: ${path.resolve(options.outputDir)}/\n`);
}
