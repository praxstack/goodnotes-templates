/**
 * validate-pack-ids — scans every MDX file under src/content/packs/ and asserts
 * the frontmatter `id` field is unique and matches the filename stem.
 *
 * Astro's collection schema can validate per-file shape, but it cannot express
 * cross-file invariants. This script fills that gap and exits non-zero on
 * violation so CI / `npm run build` fails loudly.
 *
 * Address: code-review P2 #3 (2026-04-30 post-W4 review).
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKS_DIR = path.resolve(HERE, '..', 'src', 'content', 'packs');

function extractId(frontmatter: string): string | null {
  // Matches `id: foo-bar` (with optional surrounding whitespace). The schema
  // already enforces the kebab-case regex, so we only need the value.
  const m = frontmatter.match(/^id:\s*(\S+)\s*$/m);
  return m ? m[1].replace(/^['"]|['"]$/g, '') : null;
}

async function main(): Promise<void> {
  const files = (await readdir(PACKS_DIR)).filter((f) => f.endsWith('.mdx'));
  const seen = new Map<string, string>(); // id → file
  const problems: string[] = [];

  for (const f of files) {
    const abs = path.join(PACKS_DIR, f);
    const raw = await readFile(abs, 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!m) {
      problems.push(`${f}: missing frontmatter block`);
      continue;
    }
    const id = extractId(m[1]);
    if (!id) {
      problems.push(`${f}: frontmatter has no \`id\` field`);
      continue;
    }
    const stem = f.replace(/\.mdx$/, '');
    if (id !== stem) {
      problems.push(
        `${f}: frontmatter id \`${id}\` does not match filename stem \`${stem}\``,
      );
    }
    if (seen.has(id)) {
      problems.push(
        `${f}: duplicate id \`${id}\` (first seen in ${seen.get(id)})`,
      );
    } else {
      seen.set(id, f);
    }
  }

  if (problems.length > 0) {
    console.error('[validate-pack-ids] invariants violated:');
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }
  console.log(
    `[validate-pack-ids] ok · ${files.length} pack${files.length === 1 ? '' : 's'}, all ids unique and match filename.`,
  );
}

await main();
