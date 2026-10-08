// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// pretext-templates gallery — Astro 7 config.
// Static site output. MDX enabled for pack detail pages.
// Site URL is a placeholder for now; lands in W13 (MIGRATION.md + domain).

export default defineConfig({
  site: 'https://pretext-templates.dev',
  output: 'static',
  integrations: [mdx()],
  trailingSlash: 'never',
  // Astro 7 defaults compressHTML to 'jsx', which drops whitespace between
  // elements on separate source lines ("Built with the@scope/cli"). `true`
  // keeps the Astro 6 behaviour: collapse whitespace, keep one space.
  compressHTML: true,
  build: {
    format: 'directory',
  },
});
