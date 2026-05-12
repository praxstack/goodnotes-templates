/**
 * Parameterised generator for the Monthly Planner pack (CEO v5 · E1).
 *
 * Fills the Month/Year fields in the header (lines 371-378 of the template).
 * The calendar grid is month-agnostic — users fill in dates by hand — so
 * we don't attempt to render 30/31-day positioning. That would break
 * FIND-0010 (self-contained templates) by requiring JS in the output.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  GeneratorFn,
  GeneratorInput,
  GeneratorOutput,
} from '@praxlannister/pretext-core/generator';
import { monthName } from '@praxlannister/pretext-core/generator-helpers';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(HERE, 'monthly-planner.html');

const generate: GeneratorFn = async (input: GeneratorInput): Promise<GeneratorOutput> => {
  const raw = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  const locale = input.locale ?? 'en-US';
  let html = raw;

  if (input.month !== undefined) {
    // Template DOM (lines 371-374):
    //   <div class="my-field">
    //     <span class="my-label">Month</span>
    //     <span class="my-input"></span>
    //   </div>
    html = html.replace(
      /<span class="my-label">Month<\/span>\s*<span class="my-input"><\/span>/,
      `<span class="my-label">Month</span><span class="my-input">${monthName(input.month, locale)}</span>`,
    );
  }

  if (input.year !== undefined) {
    html = html.replace(
      /<span class="my-label">Year<\/span>\s*<span class="my-input narrow"><\/span>/,
      `<span class="my-label">Year</span><span class="my-input narrow">${input.year}</span>`,
    );
  }

  const parts: string[] = ['monthly-planner'];
  if (input.year !== undefined) parts.push(String(input.year));
  if (input.month !== undefined) parts.push(String(input.month).padStart(2, '0'));

  const titleParts = ['Monthly Planner'];
  if (input.month !== undefined) titleParts.push(monthName(input.month, locale));
  if (input.year !== undefined) titleParts.push(String(input.year));

  return {
    html,
    suggestedFilename: parts.join('-'),
    metadata: {
      title: titleParts.join(' · '),
      author: 'pretext-templates',
      subject: 'Monthly calendar grid with goals and notes',
      keywords: ['monthly', 'planner', 'calendar', 'goals', 'goodnotes'],
    },
  };
};

export default generate;
