import { defineConfig } from 'vitest/config';

/**
 * Visual-regression config — separate from the unit suite because these
 * tests spawn Chromium and take seconds per case. Run explicitly via
 * `npm run test:visual`, not as part of the default `npm test` gate.
 *
 * Baselines live under `tests/visual/baselines/`. Regenerate them
 * intentionally with `UPDATE_BASELINES=1 npm run test:visual`.
 */
// Vitest 4 promoted `poolOptions` to top-level — `forks.singleFork` is the
// canonical way to share one worker across every spec in the file set.
export default defineConfig({
  pool: 'forks',
  forks: { singleFork: true },
  test: {
    include: ['tests/visual/**/*.test.ts'],
    // A single Chromium launch is shared across all specs (see render.ts);
    // forcing single-thread execution avoids Puppeteer contention and keeps
    // font-rendering determinism consistent from one spec to the next.
    fileParallelism: false,
    // Rendering + diffing a handful of A4 pages takes a few seconds each.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
