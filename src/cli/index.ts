#!/usr/bin/env node
/**
 * CLI for goodnotes-templates generation engine.
 *
 * Commands:
 *   generate  — Generate templates, stickers, and/or pages
 *   list      — List available templates, themes, and paper sizes
 *   preview   — Start local preview server
 */

import { Command } from 'commander';
import { getThemeIds, getTheme, getAllThemes } from '../core/themes.js';
import { PAGE_SIZES } from '../core/dimensions.js';
import { SUPPORTED_LOCALES } from '../utils/locale.js';
import type { SupportedLocale } from '../utils/locale.js';

const program = new Command();

program
  .name('goodnotes-templates')
  .description('Generate high-quality digital planning templates, stickers, and page assets for GoodNotes')
  .version('1.0.0');

// ─── generate command ───────────────────────────────────────────

program
  .command('generate')
  .description('Generate templates, stickers, and/or pages')
  .option('-a, --all', 'Generate everything (templates + stickers + pages)')
  .option('-t, --templates', 'Generate only templates')
  .option('-s, --stickers', 'Generate only stickers')
  .option('-p, --pages', 'Generate only simple pages (lined, grid, dot-grid, etc.)')
  .option('--theme <id>', 'Generate only for a specific theme (e.g., rose-quartz)')
  .option('--theme-file <path>', 'Load a custom theme from a JSON file')
  .option('--paper-size <size>', 'Paper size: a4, letter, ipad-landscape, ipad-pro-landscape, ipad-wide', 'a4')
  .option('--orientation <dir>', 'portrait or landscape', 'portrait')
  .option('--year <year>', 'Year for dated planners (default: current year)', String(new Date().getFullYear()))
  .option('--locale <code>', 'Locale for date formatting: en, es, fr, de, ja, ko', 'en')
  .option('-o, --output <dir>', 'Output directory', 'output')
  .option('--dpi <dpi>', 'DPI for sticker rasterization', '300')
  .option('--dry-run', 'List what would be generated without producing files')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (opts) => {
    // Validate inputs
    const year = parseInt(opts.year, 10);
    if (isNaN(year) || year < 1970 || year > 2100) {
      console.error(`Error: Year must be between 1970 and 2100. Got: ${opts.year}`);
      process.exit(1);
    }

    if (opts.theme && !getThemeIds().includes(opts.theme)) {
      console.error(`Error: Theme "${opts.theme}" not found. Available: ${getThemeIds().join(', ')}`);
      process.exit(1);
    }

    if (!SUPPORTED_LOCALES.includes(opts.locale as SupportedLocale)) {
      console.error(`Error: Locale "${opts.locale}" not supported. Available: ${SUPPORTED_LOCALES.join(', ')}`);
      process.exit(1);
    }

    const generateAll = opts.all || (!opts.templates && !opts.stickers && !opts.pages);

    if (opts.dryRun) {
      console.log('\n🔍 Dry run — listing what would be generated:\n');
      const themes = opts.theme ? [opts.theme] : getThemeIds();
      console.log(`  Themes: ${themes.join(', ')}`);
      console.log(`  Paper size: ${opts.paperSize}`);
      console.log(`  Orientation: ${opts.orientation}`);
      console.log(`  Year: ${year}`);
      console.log(`  Locale: ${opts.locale}`);
      console.log(`  Output: ${opts.output}/`);
      if (generateAll || opts.templates) console.log('  📄 Templates: 24 types × ' + themes.length + ' themes');
      if (generateAll || opts.pages) console.log('  📝 Pages: 7 types × ' + themes.length + ' themes × 3 variants');
      if (generateAll || opts.stickers) console.log('  🎨 Stickers: ~94 per theme × ' + themes.length + ' themes');
      console.log('');
      return;
    }

    console.log('\n🚀 goodnotes-templates generator\n');
    console.log(`  Theme(s): ${opts.theme || 'all (' + getThemeIds().length + ')'}`);
    console.log(`  Paper: ${opts.paperSize} ${opts.orientation}`);
    console.log(`  Year: ${year} | Locale: ${opts.locale}`);
    console.log(`  Output: ${opts.output}/\n`);

    // Dynamic import to avoid loading heavy deps (Puppeteer) for --help/--dry-run
    const { runGeneration } = await import('../core/renderer.js');

    await runGeneration({
      themes: opts.theme ? [opts.theme] : getThemeIds(),
      paperSize: opts.paperSize,
      orientation: opts.orientation,
      year,
      locale: opts.locale as SupportedLocale,
      outputDir: opts.output,
      dpi: parseInt(opts.dpi, 10),
      generateTemplates: generateAll || !!opts.templates,
      generatePages: generateAll || !!opts.pages,
      generateStickers: generateAll || !!opts.stickers,
      verbose: !!opts.verbose,
      customThemeFile: opts.themeFile,
    });
  });

// ─── list command ───────────────────────────────────────────────

program
  .command('list')
  .description('List available templates, themes, and paper sizes')
  .option('--themes', 'List themes')
  .option('--sizes', 'List paper sizes')
  .option('--templates', 'List template types')
  .option('--locales', 'List supported locales')
  .action((opts) => {
    const showAll = !opts.themes && !opts.sizes && !opts.templates && !opts.locales;

    if (showAll || opts.themes) {
      console.log('\n🎨 Available Themes:\n');
      for (const theme of getAllThemes()) {
        const dark = theme.isDark ? ' (dark)' : '';
        console.log(`  ${theme.id.padEnd(20)} ${theme.name}${dark} — ${theme.description}`);
      }
    }

    if (showAll || opts.sizes) {
      console.log('\n📐 Paper Sizes:\n');
      for (const [key, dims] of Object.entries(PAGE_SIZES)) {
        if (key === 'custom') continue;
        console.log(`  ${key.padEnd(22)} ${dims.width}×${dims.height}pt — ${dims.description}`);
      }
    }

    if (showAll || opts.templates) {
      console.log('\n📄 Template Types:\n');
      const types = [
        ['Planners', 'daily, weekly, monthly, yearly (dated + undated)'],
        ['Journals', 'gratitude, morning-pages, reflection, prompted, diary'],
        ['Trackers', 'habit, mood, fitness, meal, budget, reading, goals'],
        ['Notes', 'cornell, meeting'],
        ['Pages', 'lined, grid, dot-grid, blank, isometric, music, calligraphy'],
        ['Worksheets', 'eisenhower, goal-setting, project, recipe, travel'],
      ];
      for (const [cat, items] of types) {
        console.log(`  ${cat.padEnd(14)} ${items}`);
      }
    }

    if (showAll || opts.locales) {
      console.log('\n🌍 Supported Locales:\n');
      const localeNames: Record<string, string> = {
        en: 'English', es: 'Spanish', fr: 'French',
        de: 'German', ja: 'Japanese', ko: 'Korean'
      };
      for (const loc of SUPPORTED_LOCALES) {
        console.log(`  ${loc}  ${localeNames[loc]}`);
      }
    }

    console.log('');
  });

// ─── preview command ────────────────────────────────────────────

program
  .command('preview')
  .description('Start local preview server to browse generated assets')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-d, --dir <dir>', 'Output directory to serve', 'output')
  .action(async (opts) => {
    console.log(`\n🖥️  Starting preview server...\n`);
    console.log(`  Serving: ${opts.dir}/`);
    console.log(`  URL: http://localhost:${opts.port}\n`);

    // Dynamic import for Express (only needed for preview)
    const { startPreviewServer } = await import('./preview-server.js');
    await startPreviewServer(opts.dir, parseInt(opts.port, 10));
  });

program.parse();
