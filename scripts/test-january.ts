/**
 * Quick test: generate full year 2026 to validate
 * the daily-year generator with month-by-month rendering.
 */

import path from 'node:path';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';
import { generateDailyYearPlanner } from '../src/templates/planners/daily-year.js';

async function main() {
  const theme = getTheme('warm-neutral');
  const dims = getPageDimensions('a4', 'portrait');

  console.log('🧪 Testing: Full Year 2026 — warm-neutral theme\n');

  const result = await generateDailyYearPlanner({
    templatePath: path.resolve('examples/prax-journal/prax_adhd_planner.html'),
    theme,
    dimensions: dims,
    year: 2026,
    locale: 'en',
    outputPath: path.resolve('output/test-year-2026-warm-neutral.pdf'),
  });

  console.log('\n📊 Result:');
  console.log(`  Pages: ${result.totalPages}`);
  console.log(`  Size: ${(result.fileSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Time: ${(result.generationTime / 1000).toFixed(1)}s`);
  console.log('\n  Month breakdown:');
  for (const m of result.monthBreakdown) {
    console.log(`    ${m.month.padEnd(12)} ${m.pages} pages`);
  }
  console.log(`\n  Output: ${result.outputPath}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
