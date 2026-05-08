#!/usr/bin/env -S npx tsx
/**
 * Build a single standalone HTML of the whole month's journal.
 *
 * The Puppeteer pipeline writes directly to PDF. But users also asked for
 * an HTML they can open in a browser. This script replays the same page
 * sequence (`buildPageSequence` → `resolvePageSpecFiles` →
 * `substituteProfile`) and hands the per-page HTML to
 * `buildStandaloneHtml()` (from `@praxlannister/pretext-core`) for stitching.
 *
 * As of W2 T1 the stitching logic lives in
 * `packages/core/src/standalone-builder.ts` so the CLI and gallery can
 * reuse it (eng-review Finding 1.3 · 1 real callsite today, 3 planned).
 * This script is now a thin IO wrapper: read files → stitch → write.
 *
 * Output
 * ──────
 *   output/The Praxis Ledger — <Month YYYY>.html     (single file, ~10-20 MB)
 *
 * Usage
 * ─────
 *   npx tsx scripts/build-standalone-html.ts \
 *     --from 2026-04-30 --to 2026-05-31 \
 *     --out "output/The Praxis Ledger — May 2026.html"
 *
 * Optional `--profile <path>` to match scripts/generate-journal.ts.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { buildPageSequence } from '../packages/core/src/splice.js';
import {
  resolvePageSpecFiles,
  substituteProfile,
  V5_PACK_DIR,
} from '../packages/core/src/prax-journal-renderer.js';
import { parseProfile, type Profile } from '../packages/core/src/types/profile.js';
import {
  buildStandaloneHtml,
  type StandalonePageInput,
} from '../packages/core/src/standalone-builder.js';

// ─── Args ───────────────────────────────────────────────────────

interface Args {
  from: string;
  to: string;
  out: string;
  profilePath: string;
  versionDir: string;
}

function parseArgs(argv: readonly string[]): Args {
  const get = (flag: string, fallback?: string): string => {
    const idx = argv.indexOf(flag);
    if (idx === -1 || idx === argv.length - 1) {
      if (fallback !== undefined) return fallback;
      throw new Error(`missing required flag: ${flag}`);
    }
    return argv[idx + 1];
  };
  return {
    from: get('--from'),
    to:   get('--to'),
    out:  get('--out'),
    profilePath: get('--profile', 'packages/packs-prax-journal/profile.local.json'),
    versionDir:  get('--pack', V5_PACK_DIR),
  };
}

async function loadProfile(p: string): Promise<Profile | undefined> {
  try {
    const raw = await fs.readFile(path.resolve(p), 'utf-8');
    return parseProfile(JSON.parse(raw) as unknown);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
}

// ─── Main ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const outPath = path.resolve(args.out);
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const specs = buildPageSequence({ from: args.from, to: args.to });
  if (specs.length === 0) {
    throw new Error(`buildPageSequence(${args.from} → ${args.to}) returned 0 specs`);
  }

  const profile = await loadProfile(args.profilePath);
  console.log(`Profile: ${profile ? args.profilePath + ' (loaded)' : 'none — printed-blank fallback'}`);
  console.log(`Range:   ${args.from} → ${args.to}`);
  console.log(`Specs:   ${specs.length}`);
  console.log('');

  // ── Walk + read each file into a StandalonePageInput ──
  const pages: StandalonePageInput[] = [];
  for (let i = 0; i < specs.length; i++) {
    const page = specs[i];
    const files = resolvePageSpecFiles(page, args.versionDir);
    for (const f of files) {
      const raw = await fs.readFile(f, 'utf-8');
      const html = substituteProfile(raw, profile, page);
      pages.push({
        html,
        label: `${page.kind}:${path.basename(f, '.html')}`,
        sourcePath: f,
      });
    }
    if ((i + 1) % 25 === 0 || i === specs.length - 1) {
      console.log(`  walked ${String(i + 1).padStart(3)}/${specs.length} specs`);
    }
  }

  // ── Hand off to the core stitcher ──
  const doc = buildStandaloneHtml({
    title: path.basename(outPath, '.html'),
    pages,
  });

  await fs.writeFile(outPath, doc, 'utf-8');
  const sizeMB = (Buffer.byteLength(doc) / 1024 / 1024).toFixed(2);
  console.log(``);
  console.log(`Wrote:   ${outPath}`);
  console.log(`Size:    ${sizeMB} MB`);
  console.log(`Pages:   ${pages.length} (from ${specs.length} specs)`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
