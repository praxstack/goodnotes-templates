# Explain: `index.ts`

> Barrel/entry-point file re-exporting public symbols of its directory (0 exports, 0 fns, 0 classes).

| | |
|---|---|
| **ID** | `file:packages/cli/src/index.ts` |
| **Type** | `file` |
| **Path** | `packages/cli/src/index.ts` (487 lines) |
| **Complexity** | `complex` |
| **Tags** | `entry-point`, `cli`, `source` |
| **Layer** | **CLI Package** — Command-line interface package exposing the goodnotes-templates CLI entry points. |

## Role in the Architecture

This file lives in the **CLI Package** layer.

> Command-line interface package exposing the goodnotes-templates CLI entry points.

The file's stated purpose: Barrel/entry-point file re-exporting public symbols of its directory (0 exports, 0 fns, 0 classes).

## External Connections

### Imports (`7`)

- `file:packages/core/src/dimensions.ts` — Typescript module exposing 5 functions and 9 exports (156 lines).
- `file:packages/core/src/utils/locale.ts` — Typescript module exposing 10 functions and 11 exports (213 lines).
- `file:packages/cli/src/scaffold.ts` — Typescript module exposing 5 functions and 3 exports (210 lines).
- `file:packages/core/src/puppeteer-renderer.ts` — Typescript module exposing 12 functions and 9 exports (448 lines).
- `file:packages/cli/src/preview-server.ts` — Typescript module exposing 2 functions and 1 export (220 lines).
- `file:packages/core/src/generator.ts` — Typescript module exposing 2 functions and 4 exports (205 lines).
- `file:packages/core/src/audit.ts` — Typescript module exposing 5 functions and 6 exports (311 lines).

### Imported by (`0`)

_No project-internal consumers detected._

## Source Code (head, first 80 lines)

```ts
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
```

## How To Modify Safely

- Small blast radius (~7 import-level connections). Run `pnpm vitest` and visual regression to catch regressions.
- Marked **complex**. Consider breaking changes into smaller PRs.

---
Generated by `/understand-explain` from `.understand-anything/knowledge-graph.json` at d170d3b098033dd66c62ce61da990f38bde316dd.