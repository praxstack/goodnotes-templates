/**
 * Site-level constants for the gallery.
 *
 * Single source of truth for the values that previously appeared hardcoded
 * across Layout + pack detail pages. Address: code-review P2 #2
 * (2026-04-30 post-W4 review).
 */

export const SITE = {
  name: 'pretext-templates',
  domain: 'pretext-templates.dev',
  repoUrl: 'https://github.com/praxstack/pretext-templates',
  license: 'MIT',
  // Kept in step with root package.json; tracked manually until we wire an
  // import from the workspace root (deferred — see README Deferred list).
  version: '0.6.2',
} as const;
