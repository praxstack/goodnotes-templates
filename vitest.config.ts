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
        'src/core/dimensions.ts',
        'src/core/pdf-postprocess.ts',
        'src/core/puppeteer-renderer.ts',
        'src/core/svg-renderer.ts',
        'src/cli/preview-server.ts',
        'src/utils/locale.ts',
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        'output/**',
        'tests/**',
        'scripts/**',
        'src/cli/index.ts', // thin Commander wrapper, tested via integration
        'src/core/png-renderer.ts', // wraps sharp; tested via svg-renderer
        'src/packs.ts', // static pack registry (was src/templates/registry.ts)
        'src/types/**',
        'src/utils/**/*.d.ts',
      ],
    },
  },
});
