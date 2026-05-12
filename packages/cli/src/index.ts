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

// ─── generate command (CEO v5 Phase 1 · E1) ────────────────────
// Dispatch to a per-pack generator function that emits parameterised HTML.
// The list of generator-enabled packs lives in
// @praxlannister/pretext-core/generator as `GENERATOR_PACKS`. New packs
// opt in by (a) adding a `generate.ts` sibling of their HTML, and (b)
// adding their id to that list.

program
  .command('generate')
  .description('Generate a parameterised PDF from a pack (Phase 1 · flagship packs only)')
  .argument('<pack-id>', 'Pack identifier (run `pretext list` for available ids)')
  .option('--from <date>', 'ISO date range start (for calendar-based packs)')
  .option('--to <date>', 'ISO date range end (for calendar-based packs)')
  .option('--year <n>', 'Year for dated planners', (v) => Number.parseInt(v, 10))
  .option('--month <n>', 'Month 1-12 for monthly templates', (v) => Number.parseInt(v, 10))
  .option('--weeks <n>', 'Number of weeks 1-52', (v) => Number.parseInt(v, 10))
  .option('--habits <list>', 'Comma-separated habit labels (max 12, ≤40 chars each)')
  .option('--locale <tag>', 'Locale tag (default: en-US)', 'en-US')
  .option('--theme <id>', 'Theme id (default: pack default)')
  .option('--week-start <n>', '0 = Sunday, 1 = Monday (default)', (v) => Number.parseInt(v, 10))
  .option('--profile <path>', 'Profile JSON path (Prax Journal only)')
  .option('-o, --output <path>', 'Output PDF path (default: output/<pack-id>.pdf)')
  .option('--paper-size <size>', 'Paper size', 'a4')
  .option('--orientation <dir>', 'portrait or landscape', 'portrait')
  .option('-v, --verbose', 'Verbose logging')
  .action(async (packId, opts) => {
    const {
      isGeneratorPack,
      GENERATOR_PACKS,
      validateGeneratorInput,
      InvalidGeneratorInputError,
    } = await import('@praxlannister/pretext-core/generator');

    if (!isGeneratorPack(packId)) {
      console.error(
        `Error: pack "${packId}" does not have a generator.\n\n` +
          `Generator-enabled packs:\n` +
          GENERATOR_PACKS.map((p) => `  • ${p}`).join('\n') +
          `\n\nFor static packs, use: pretext render <template-path>\n`,
      );
      process.exit(1);
    }

    const habits = opts.habits
      ? String(opts.habits).split(',').map((s) => s.trim()).filter((s) => s.length > 0)
      : undefined;

    try {
      validateGeneratorInput({
        from: opts.from,
        to: opts.to,
        year: opts.year,
        month: opts.month,
        weeks: opts.weeks,
        habits,
        locale: opts.locale,
        theme: opts.theme,
        weekStart: opts.weekStart,
        profilePath: opts.profile,
      });
    } catch (err) {
      if (err instanceof InvalidGeneratorInputError) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
      throw err;
    }

    console.log(`\n📝 Generating ${packId}...\n`);
    if (opts.verbose) {
      console.log(`  Flags: ${JSON.stringify({ year: opts.year, month: opts.month, habits, locale: opts.locale })}\n`);
    }

    // Dynamic import of the per-pack generator. Keeps the CLI cold-start
    // below 200ms for non-generate commands.
    let generateFn: (input: unknown) => Promise<{ html: string; suggestedFilename?: string; metadata?: unknown }>;
    try {
      const mod = (await import(
        `../../packs-${packId}/generate.ts`
      )) as { default: typeof generateFn };
      generateFn = mod.default;
    } catch (err) {
      console.error(
        `Error: could not load generator for ${packId}: ${(err as Error).message}\n` +
          `(Expected packages/packs-${packId}/generate.ts)`,
      );
      process.exit(2);
    }

    const output = await generateFn({
      from: opts.from,
      to: opts.to,
      year: opts.year,
      month: opts.month,
      weeks: opts.weeks,
      habits,
      locale: opts.locale,
      theme: opts.theme,
      weekStart: opts.weekStart,
      profilePath: opts.profile,
    });

    const outputPath = opts.output
      ?? `output/${output.suggestedFilename ?? packId}.pdf`;

    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const { renderHTMLToPDFFile, closeBrowser } = await import(
      '@praxlannister/pretext-core/puppeteer-renderer'
    );
    const { getPageDimensions } = await import('@praxlannister/pretext-core/dimensions');

    const dims = getPageDimensions(opts.paperSize, opts.orientation);

    try {
      // Write the parameterised HTML to a temp file so we reuse the
      // existing file-based renderer (which handles font loading, etc).
      const tmpHtml = path.join(path.dirname(outputPath), `.tmp-${packId}.html`);
      await fs.writeFile(tmpHtml, output.html, 'utf-8');
      await renderHTMLToPDFFile(
        {
          htmlPath: tmpHtml,
          dimensions: dims,
        },
        outputPath,
      );
      await fs.unlink(tmpHtml).catch(() => { /* best-effort */ });
      console.log(`✓ ${outputPath}\n`);
    } finally {
      await closeBrowser();
    }
  });

program.parse();
