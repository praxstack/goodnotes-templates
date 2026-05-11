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
      //
      // FIND-I4-004 / TICKET-I4-004 follow-up (iter-5):
      //   Iter-4 lowered branches 75 → 65 with an explicit "raise when
      //   puppeteer-renderer error-path tests land" callout. Iter-5 landed
      //   those tests (`tests/unit/puppeteer-renderer-mock.test.ts`, 17
      //   tests mocking puppeteer.launch + request interception + pdf()
      //   throw paths + fs write + batch partition). Result:
      //     puppeteer-renderer.ts branches: 33% → 91%
      //     overall branches: 67.5% → 79.7%
      //
      //   Raising the gate to reflect the new floor. Delta is deliberately
      //   just below current-actual so the gate catches genuine regression
      //   without flapping on unrelated coverage noise. Line/statement
      //   floors raised in lock-step.
      //
      //   To raise further: add tests for `pdf-postprocess.ts` link-rewrite
      //   branches (currently 61% branch) and `dimensions.ts` `custom`
      //   paper-size logic (currently 55% stmts). Each is ~1 pd.
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 80,
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
