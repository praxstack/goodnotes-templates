/**
 * enrich-pack-mdx — W6 pack documentation enrichment.
 *
 * Reads each pack's manifest.json + README.md and emits a real MDX body
 * for the gallery detail page. Preserves hand-curated bodies (skips any
 * MDX that isn't the W5 seed stub).
 *
 * Heuristic for "seed stub": contains the sentinel line
 *   > Manifest-seeded stub — the full MDX lands in W6 …
 * That marker was inserted by migrate-packs-w5.ts. prax-journal never
 * had it (hand-curated since W4), so it's safe.
 *
 * One-shot script. Safe to delete after the W6 enrichment commit lands.
 *
 * Usage:
 *   tsx apps/gallery/scripts/enrich-pack-mdx.ts          # dry-run
 *   tsx apps/gallery/scripts/enrich-pack-mdx.ts --apply
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(GALLERY_ROOT, '..', '..');
const PACKAGES = path.join(REPO_ROOT, 'packages');
const MDX_DIR = path.join(GALLERY_ROOT, 'src', 'content', 'packs');

const APPLY = process.argv.includes('--apply');
// The W4 scaffold left an ad-hoc stub marker; W5's migrate script used a
// different wording. Both are "please enrich me" flags. Treat any file
// containing EITHER as enrichable.
const STUB_MARKERS = [
  'Manifest-seeded stub',                        // W5 migrate-packs-w5.ts
  'Stub documentation — full copy lands',        // W4 scaffold
] as const;

type ManifestLite = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  version: string;
  entry: string;
  author: string;
  license?: string;
};

function readmeLede(readme: string): string {
  // First paragraph after the h1 line. Strip markdown emphasis so the
  // gallery doesn't have to re-parse it; keep em dashes + links verbatim
  // (MDX handles them). Max ~3 lines so cards stay readable.
  const lines = readme.split('\n');
  const afterH1: string[] = [];
  let sawH1 = false;
  for (const line of lines) {
    if (!sawH1) {
      if (line.startsWith('# ')) sawH1 = true;
      continue;
    }
    if (line.trim() === '') {
      if (afterH1.length === 0) continue;
      break;
    }
    if (line.startsWith('|') || line.startsWith('#')) break;
    afterH1.push(line);
  }
  return afterH1.join(' ').replace(/\s+/g, ' ').trim();
}

function readmeUseBullet(readme: string): string | null {
  // The README templates use a metadata table with a "Use" row. We mine
  // it here so the MDX can show "How to use" concretely without
  // duplicating it from the README.
  const m = readme.match(/\|\s*\*\*Use\*\*\s*\|\s*([^|]+?)\s*\|/u);
  return m ? m[1].trim() : null;
}

function mdxBody(m: ManifestLite, readme: string | null): string {
  const lede = readme ? readmeLede(readme) : m.description;
  const use = readme ? readmeUseBullet(readme) : null;
  const renderCmd = `npx @praxlannister/pretext-cli render \\
  packages/packs-${m.id}/${m.entry} \\
  -o output/${m.id}.pdf`;

  const useBlock = use
    ? `\n## How to use\n\n${use}\n`
    : '';

  const tagsLine = m.tags && m.tags.length > 0
    ? m.tags.map((t) => `\`${t}\``).join(' · ')
    : '';
  const tagsBlock = tagsLine ? `\n## Tags\n\n${tagsLine}\n` : '';

  return `${lede || m.description}

## At a glance

- **Format** · A4 portrait · self-contained styles
- **Category** · ${m.category}
- **License** · ${m.license ?? 'MIT'}
- **Version** · v${m.version}

## Render locally

\`\`\`bash
${renderCmd}
\`\`\`

## Compatibility

GoodNotes 6 · Notability · Noteshelf · CollaNote.
${useBlock}${tagsBlock}`;
}

type Action =
  | { kind: 'enrich'; file: string; id: string }
  | { kind: 'skip-hand-curated'; file: string }
  | { kind: 'skip-no-manifest'; file: string };

async function main(): Promise<void> {
  const mdxFiles = (await readdir(MDX_DIR))
    .filter((f) => f.endsWith('.mdx'))
    .sort();

  const actions: Action[] = [];

  for (const mdx of mdxFiles) {
    const id = mdx.replace(/\.mdx$/, '');
    const mdxPath = path.join(MDX_DIR, mdx);
    const raw = await readFile(mdxPath, 'utf8');

    // Skip anything that doesn't carry ANY stub marker — that's
    // genuinely hand-curated copy and must not be overwritten.
    if (!STUB_MARKERS.some((m) => raw.includes(m))) {
      actions.push({ kind: 'skip-hand-curated', file: mdx });
      continue;
    }

    const manifestPath = path.join(PACKAGES, `packs-${id}`, 'manifest.json');
    let manifest: ManifestLite;
    try {
      manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ManifestLite;
    } catch {
      actions.push({ kind: 'skip-no-manifest', file: mdx });
      continue;
    }

    const readmePath = path.join(PACKAGES, `packs-${id}`, 'README.md');
    let readme: string | null = null;
    try {
      readme = await readFile(readmePath, 'utf8');
    } catch {
      readme = null;
    }

    if (!APPLY) {
      actions.push({ kind: 'enrich', file: mdx, id });
      continue;
    }

    // Preserve the frontmatter block exactly; swap the body.
    const fmMatch = raw.match(/^(---\n[\s\S]*?\n---\n)/);
    if (!fmMatch) {
      actions.push({ kind: 'skip-no-manifest', file: mdx });
      continue;
    }
    const nextBody = mdxBody(manifest, readme);
    const next = fmMatch[1] + '\n' + nextBody + '\n';
    await writeFile(mdxPath, next, 'utf8');
    actions.push({ kind: 'enrich', file: mdx, id });
  }

  const enriched = actions.filter((a) => a.kind === 'enrich');
  const handCurated = actions.filter((a) => a.kind === 'skip-hand-curated');
  const noManifest = actions.filter((a) => a.kind === 'skip-no-manifest');

  console.log(`[enrich-pack-mdx] ${APPLY ? 'applied' : 'dry-run'}:`);
  console.log(`  • ${enriched.length} MDX file(s) enriched`);
  console.log(`  • ${handCurated.length} hand-curated · preserved`);
  console.log(`  • ${noManifest.length} skipped (missing manifest or bad shape)`);
  if (!APPLY) {
    for (const a of enriched) console.log(`    enrich  ${a.file}`);
    for (const a of handCurated) console.log(`    keep    ${a.file}`);
    for (const a of noManifest) console.log(`    skip    ${a.file}`);
    console.log('\n  re-run with --apply to write changes.');
  }
}

await main();
