/**
 * Parameterised generator for the Yearly Overview pack (CEO v5 · E1).
 *
 * Fills the single `<span class="year-field"></span>` with the requested
 * --year. Everything else in the template is year-agnostic (12 mini-grids,
 * goals section, year-word block) so this is the simplest generator in
 * the Phase 1 set.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  GeneratorFn,
  GeneratorInput,
  GeneratorOutput,
} from '@praxlannister/pretext-core/generator';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(HERE, 'yearly-overview.html');

const generate: GeneratorFn = async (input: GeneratorInput): Promise<GeneratorOutput> => {
  const raw = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  let html = raw;

  if (input.year !== undefined) {
    // Template DOM (line 266-267):
    //   <span class="year-label">Year</span>
    //   <span class="year-field"></span>
    html = html.replace(
      /<span class="year-label">Year<\/span>\s*<span class="year-field"><\/span>/,
      `<span class="year-label">Year</span><span class="year-field">${input.year}</span>`,
    );
  }

  const suggestedFilename = input.year !== undefined
    ? `yearly-overview-${input.year}`
    : 'yearly-overview';

  return {
    html,
    suggestedFilename,
    metadata: {
      title: input.year !== undefined
        ? `Yearly Overview · ${input.year}`
        : 'Yearly Overview',
      author: 'pretext-templates',
      subject: 'Year-at-a-glance overview with goals and theme',
      keywords: ['yearly', 'overview', 'year-at-a-glance', 'planner', 'goodnotes'],
    },
  };
};

export default generate;
