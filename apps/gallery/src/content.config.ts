// Astro 6 Content Layer config for pack MDX pages.
// One collection ("packs") backed by local MDX files under src/content/packs/.

// Astro re-exports `z` from `astro:content`; the deprecation advisory is noise
// — this is still the supported schema builder through Astro 6.
// eslint-disable-next-line @typescript-eslint/no-deprecated
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const packs = defineCollection({
  loader: glob({ base: './src/content/packs', pattern: '**/*.mdx' }),
  schema: z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'kebab-case id required'),
    title: z.string(),
    // Aligned with packages/core/src/types/registry.ts PACK_CATEGORIES
    // (singular where English allows). Schema is immutable without a
    // `schema_version` bump on the registry side.
    category: z.enum(['journal', 'notes', 'tracker', 'worksheet', 'cover', 'planner']),
    oneLiner: z.string().min(8).max(140),
    version: z.string(),
    heroImage: z.string().optional(), // path relative to /public (e.g. /specimens/prax-journal.png)
    heroBlurhash: z.string().optional(), // encoded at build-time (W4 T3)
    heroWidth: z.number().int().positive().optional(),
    heroHeight: z.number().int().positive().optional(),
    accent: z.enum(['sage', 'clay', 'amber', 'ink']).default('ink'),
    status: z.enum(['stable', 'beta', 'stub']).default('stub'),
    bylineYear: z.number().int(),
  }),
});

export const collections = { packs };
