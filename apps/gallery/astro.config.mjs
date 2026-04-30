// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// pretext-templates gallery — Astro 6 config.
// Static site output. MDX enabled for pack detail pages.
// Site URL is a placeholder for now; lands in W13 (MIGRATION.md + domain).

export default defineConfig({
  site: 'https://pretext-templates.dev',
  output: 'static',
  integrations: [mdx()],
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
