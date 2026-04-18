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
      'node_modules/**',
      'output/**',
      'audit/**',
      'assets/**',
      'scripts/**', // ad-hoc dev scripts; out of scope for now
      '**/*.d.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
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
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
