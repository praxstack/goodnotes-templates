/**
 * Playwright smoke-test runner config.
 *
 * W7.5 · pulled forward from W14 per the big-W7 plan.
 *
 * Scope is intentionally tight: a 5-case smoke suite that boots the
 * Astro preview server, hits the gallery, and asserts the surfaces
 * we've been claiming work actually work in a real headless browser.
 *
 * Full a11y / visual / Lighthouse suites still arrive in W14; this
 * just closes the "zero browser has ever opened this thing" gap so
 * every future week inherits a regression gate.
 *
 * Heads-up: the preview server needs a fresh build — the config
 * calls `astro build` first, then `astro preview` on port 4322
 * (kept off 4321 so it doesn't clash with local `astro dev`).
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = 4322;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts$/,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      // D-12 mobile layout is the one mobile-specific commitment in
      // the sprint — iPhone 13 at 390 × 844 sits inside our
      // <600px breakpoint.
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run build -w @pretext-templates/gallery && npx astro preview --port ' + PORT + ' --host 127.0.0.1 --root apps/gallery',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
