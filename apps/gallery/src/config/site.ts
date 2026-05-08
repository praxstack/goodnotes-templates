/**
 * Site-level constants for the gallery.
 *
 * Single source of truth for the values that previously appeared hardcoded
 * across Layout + pack detail pages. Address: code-review P2 #2
 * (2026-04-30 post-W4 review).
 */

export const SITE = {
  name: 'pretext-templates',
  // Current live home (Vercel). `pretext-templates.dev` is the future
  // custom domain — swap these two lines once DNS is pointed. Everything
  // else in this config keeps referencing `domain` so one edit does it.
  domain: 'pretext-templates.vercel.app',
  repoUrl: 'https://github.com/praxstack/goodnotes-templates',
  license: 'MIT',
  // Kept in step with root package.json; tracked manually until we wire an
  // import from the workspace root (deferred — see README Deferred list).
  version: '1.0.0',
} as const;
