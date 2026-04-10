/**
 * Generate full year ADHD v2 planner.
 * Usage: npx tsx scripts/generate-v2-year.ts [colorMode] [year]
 * Example: npx tsx scripts/generate-v2-year.ts        (default light, 2026)
 * Example: npx tsx scripts/generate-v2-year.ts dark    (dark mode, 2026)
 */
import { generateDailyYearPlannerV2 } from '../src/templates/planners/daily-year-v2.js';
import { getPageDimensions } from '../src/core/dimensions.js';

const colorMode = process.argv[2]; // optional: 'dark'
const year = parseInt(process.argv[3] || '2026', 10);

async function main() {
  console.log(`\n📅 Generating ADHD v2 Full Year Planner — ${year}${colorMode ? ` (${colorMode})` : ''}\n`);
  
  const result = await generateDailyYearPlannerV2({
    todayTemplatePath: 'src/templates/html/adhd-v2-today.html',
    reflectTemplatePath: 'src/templates/html/adhd-v2-reflect.html',
    weeklyTemplatePath: 'src/templates/html/adhd-v2-weekly.html',
    monthlyTemplatePath: 'src/templates/html/adhd-v2-monthly.html',
    dimensions: getPageDimensions('a4', 'portrait'),
    year,
    locale: 'en',
    colorMode,
    outputPath: `output/templates/adhd-v2-planner-${year}${colorMode ? `-${colorMode}` : ''}.pdf`,
  });

  console.log(`\n🎉 Done!`);
  console.log(`   ${result.pages} pages, ${(result.size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   ${result.path}\n`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
