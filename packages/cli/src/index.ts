#!/usr/bin/env node
/**
 * CLI for pretext-templates (née goodnotes-templates).
 *
 * Commands:
 *   render    — Render HTML templates to PDF
 *   list      — List available templates and paper sizes
 *   preview   — Start local preview server
 *   init      — Scaffold a new pack skeleton (W15.5)
 *   remix     — Print fork-and-rebrand commands for an existing pack (W15.5)
 */

import { Command } from 'commander';
import { PAGE_SIZES } from '@praxlannister/pretext-core/dimensions';
import { SUPPORTED_LOCALES } from '@praxlannister/pretext-core/utils/locale';
import { buildInitTemplate, buildRemixCommands } from './scaffold.js';

const program = new Command();

program
  .name('goodnotes-templates')
  .description('Generate high-quality digital planning templates for GoodNotes')
  .version('1.0.0');

// ─── render command ─────────────────────────────────────────────

program
  .command('render')
  .description('Render HTML templates to PDF')
  .argument('[template]', 'Template HTML path (e.g., packages/packs-prax-journal/versions/v5/today.html)')
  .option('--color-mode <mode>', 'Color mode (e.g., dark). Omit for default.')
  .option('--paper-size <size>', 'Paper size: a4, letter, ipad-landscape, etc.', 'a4')
  .option('--orientation <dir>', 'portrait or landscape', 'portrait')
  .option(
    '--render-scale <n>',
    'Render scale 0.1–2.0 (default 1.0). Lowers resolution to survive ' +
      'Safari WebKit 200 MB heap ceiling on long renders. Also respects ' +
      'PRAX_RENDER_SCALE env var. See W3 T3 of the eng review for context.',
  )
  .option('-o, --output <path>', 'Output PDF path')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (template, opts) => {
    if (!template) {
      console.error('Error: Template path required. Example: packages/packs-prax-journal/versions/v5/today.html');
      process.exit(1);
    }

    const fs = await import('node:fs/promises');
    try {
      await fs.access(template);
    } catch {
      console.error(`Error: Template not found: ${template}`);
      process.exit(1);
    }

    const outputPath = opts.output || template
      .replace(/^packs\//, 'output/')
      .replace('.html', `${opts.colorMode ? `-${opts.colorMode}` : ''}.pdf`);

    console.log(`\n🖨  Rendering template to PDF\n`);
    console.log(`  Template: ${template}`);
    if (opts.colorMode) console.log(`  Color mode: ${opts.colorMode}`);
    console.log(`  Paper: ${opts.paperSize} ${opts.orientation}`);
    console.log(`  Output: ${outputPath}\n`);

    // Dynamic import to avoid loading Puppeteer for --help
    const { renderHTMLToPDFFile, closeBrowser } = await import(
      '@praxlannister/pretext-core/puppeteer-renderer'
    );
    const { getPageDimensions } = await import('@praxlannister/pretext-core/dimensions');

    const dims = getPageDimensions(opts.paperSize, opts.orientation);

    // Validate --render-scale loudly when the user passed the flag explicitly.
    // Note: core's resolveRenderScale() silently falls back to 1.0 on bad input
    // (a design choice so a typo'd env var can't brick a year-long run), but
    // that would silently accept `--render-scale 5.0` on the CLI — which is
    // worse than erroring. So we bounds-check here before delegating.
    const MIN_SCALE = 0.1;
    const MAX_SCALE = 2.0;
    let renderScale: number | undefined;
    if (opts.renderScale !== undefined) {
      const parsed = Number(opts.renderScale);
      if (!Number.isFinite(parsed) || parsed < MIN_SCALE || parsed > MAX_SCALE) {
        console.error(
          `Error: --render-scale must be a finite number in [${MIN_SCALE}, ${MAX_SCALE}] ` +
            `(got '${opts.renderScale}').`,
        );
        process.exit(1);
      }
      renderScale = parsed;
      if (renderScale !== 1.0) {
        console.log(`  Render scale: ${renderScale}×`);
      }
    }

    try {
      const result = await renderHTMLToPDFFile(
        {
          htmlPath: template,
          dimensions: dims,
          colorMode: opts.colorMode,
          renderScale,
        },
        outputPath,
      );
      console.log(`  ✅ ${(result.size / 1024).toFixed(0)} KB → ${outputPath}\n`);
    } finally {
      await closeBrowser();
    }
  });

// ─── list command ───────────────────────────────────────────────

program
  .command('list')
  .description('List available templates, paper sizes, and color modes')
  .option('--sizes', 'List paper sizes')
  .option('--templates', 'List template types')
  .option('--locales', 'List supported locales')
  .action(async (opts) => {
    const showAll = !opts.sizes && !opts.templates && !opts.locales;

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
        ['Worksheets', 'eisenhower, goal-setting, project, recipe, travel'],
      ];
      for (const [cat, items] of types) {
        console.log(`  ${cat.padEnd(14)} ${items}`);
      }

      console.log('\n🎨 Color Modes:\n');
      console.log('  Templates are self-contained (WYSIWYG).');
      console.log('  Optional color modes: --color-mode dark');
      console.log('  Dark mode CSS snippets live next to each template:');
      console.log('    packages/packs-prax-journal/versions/v3/today.html → today.dark.css\n');

      // List available dark.css files across packs/
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      async function* walkDark(dir: string): AsyncGenerator<string> {
        let entries: Array<import('node:fs').Dirent>;
        try {
          entries = (await fs.readdir(dir, { withFileTypes: true })) as Array<
            import('node:fs').Dirent
          >;
        } catch {
          return;
        }
        for (const e of entries) {
          const full = path.join(dir, String(e.name));
          if (e.isDirectory()) yield* walkDark(full);
          else if (e.isFile() && String(e.name).endsWith('.dark.css')) yield full;
        }
      }
      const darkFiles: string[] = [];
      for await (const f of walkDark('packs')) darkFiles.push(f);
      if (darkFiles.length > 0) {
        console.log('  Available dark mode templates:');
        for (const f of darkFiles) {
          console.log(`    ${f} → ${f.replace('.dark.css', '.html')}`);
        }
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

    const { startPreviewServer } = await import('./preview-server.js');
    await startPreviewServer(opts.dir, parseInt(opts.port, 10));
  });

// ─── init command (W15.5) ───────────────────────────────────────

program
  .command('init')
  .description('Scaffold a new pack (packages/packs-<id>/)')
  .argument('<id>', 'Pack id in kebab-case (e.g., my-pack)')
  .option('-t, --title <title>', 'Human-readable title (defaults to id)')
  .option('--dry-run', 'Print what would be written, do not touch disk')
  .action(async (id, opts) => {
    const title = opts.title ?? id;
    let files;
    try {
      files = buildInitTemplate(id, { title });
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }

    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    // Refuse to clobber — reversibility rule.
    const dir = `packages/packs-${id}`;
    try {
      await fs.access(dir);
      console.error(`Error: ${dir} already exists. Pick a different id or delete it first.`);
      process.exit(1);
    } catch {
      // good — does not exist
    }

    console.log(`\n📦 pretext init ${id}\n`);
    for (const f of files) {
      console.log(`  ${opts.dryRun ? '[dry-run] ' : ''}${f.path}  (${f.content.length} B)`);
      if (!opts.dryRun) {
        await fs.mkdir(path.dirname(f.path), { recursive: true });
        await fs.writeFile(f.path, f.content, 'utf8');
      }
    }
    console.log(`\n✓ ${opts.dryRun ? 'would create' : 'created'} ${files.length} files in ${dir}/\n`);
  });

// ─── remix command (W15.5) ──────────────────────────────────────

program
  .command('remix')
  .description('Print the commands to fork an existing pack into a new id (non-destructive)')
  .argument('<source>', 'Existing pack id (e.g., prax-journal)')
  .argument('<target>', 'New pack id (e.g., my-journal)')
  .action((source, target) => {
    let out;
    try {
      out = buildRemixCommands({ sourceId: source, targetId: target });
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }
    console.log(`\n${out.preamble}\n`);
    for (const step of out.steps) {
      console.log(step);
      console.log('');
    }
  });

program.parse();
