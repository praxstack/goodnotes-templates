/**
 * Generate full year ADHD v2 planner (794 pages).
 * Usage: npx tsx scripts/generate-v2-year.ts [theme] [year]
 */
import { generateDailyYearPlannerV2 } from '../src/templates/planners/daily-year-v2.js';
import { getTheme } from '../src/core/themes.js';
import { getPageDimensions } from '../src/core/dimensions.js';

const themeName = process.argv[2] || 'warm-neutral';
const year = parseInt(process.argv[3] || '2026', 10);

async function main() {
  console.log(`\n📅 Generating ADHD v2 Full Year Planner — ${year} (${themeName})\n`);
  
  const result = await generateDailyYearPlannerV2({
    todayTemplatePath: 'src/templates/html/adhd-v2-today.html',
    reflectTemplatePath: 'src/templates/html/adhd-v2-reflect.html',
    weeklyTemplatePath: 'src/templates/html/adhd-v2-weekly.html',
    monthlyTemplatePath: 'src/templates/html/adhd-v2-monthly.html',
    theme: getTheme(themeName),
    dimensions: getPageDimensions('a4', 'portrait'),
    year,
    locale: 'en',
    outputPath: `output/templates/adhd-v2-planner-${year}-${themeName}.pdf`,
  });

  console.log(`\n🎉 Done!`);
  console.log(`   ${result.totalPages} pages`);
  console.log(`   ${(result.fileSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   ${(result.generationTime / 1000).toFixed(1)}s`);
  console.log(`   ${result.outputPath}\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
