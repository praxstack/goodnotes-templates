// ESLint 9 flat config — no .eslintrc.
// Keep it minimal. The audit already runs tsc (strict) + vitest + npm-audit;
// eslint here just catches the easy stuff that tsc misses (unused vars with
// side effects, stylistic slip-ups) without re-implementing them.

import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'dist/**',
      '**/dist/**',
      'node_modules/**',
      '**/node_modules/**',
      'output/**',
      'audit/**',
      'assets/**',
      'apps/gallery/.astro/**', // Astro build cache
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  {
    // Post-W5 monorepo: TS sources live under packages/, apps/, and scripts/.
    // Root-level config files (vitest/playwright configs) are intentionally
    // excluded — they parse fine with tsc but don't need eslint coverage.
    files: [
      'packages/**/*.ts',
      'apps/**/*.ts',
      'scripts/**/*.ts',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: null, // don't require tsconfig for lint — we have tsc --noEmit for that
      },
      globals: {
        // Node globals
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        NodeJS: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly', // Node 18+ global
        // Browser realm (for the page.evaluate callback in puppeteer-renderer)
        document: 'readonly',
        Document: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TS rules take over for TS. Turn off the core ones they replace.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // tsc strict already catches `any`; keep eslint signal-only.
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-constant-condition': ['error', { checkLoops: false }],
    },
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      globals: {
        // Node
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        NodeJS: 'readonly',
        require: 'readonly', // CommonJS interop inside test files
        fetch: 'readonly', // Node 18+ global
        Headers: 'readonly',
        // Browser realm (Playwright page.evaluate callbacks + Puppeteer)
        document: 'readonly',
        HTMLElement: 'readonly',
        URL: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // The base rule doesn't understand argsIgnorePattern, so it fires on
      // legitimately-ignored callback params like `_req`. Turn it off and
      // let the TS plugin handle unused-var detection (it honors `^_`
      // prefix via the config below). Mirrors the TS block above.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
