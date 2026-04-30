import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    timeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      // Coverage floors per tier (see audit/TEST_STRATEGY.md §1).
      // Enforced on CI via `npm test -- --coverage`.
      // Thresholds are per-file so new T1 code can't regress; thresholds
      // below are computed over the whole project to keep the gate simple.
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 55,
        branches: 75,
      },
      include: [
        'packages/core/src/dimensions.ts',
        'packages/core/src/pdf-postprocess.ts',
        'packages/core/src/puppeteer-renderer.ts',
        'packages/core/src/svg-renderer.ts',
        'packages/cli/src/preview-server.ts',
        'packages/core/src/utils/locale.ts',
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        'packages/*/dist/**',
        'output/**',
        'tests/**',
        'scripts/**',
        'packages/cli/src/index.ts', // thin Commander wrapper, tested via integration
        'packages/core/src/png-renderer.ts', // wraps sharp; tested via svg-renderer
        'packages/core/src/packs.ts', // static pack registry
        'packages/core/src/types/**',
        'packages/core/src/utils/**/*.d.ts',
      ],
    },
  },
});
