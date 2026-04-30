#!/usr/bin/env -S npx tsx
/**
 * Prax Journal · end-to-end generator (C7b.4).
 *
 *   npx tsx scripts/generate-journal.ts \
 *     --from 2026-04-30 --to 2026-05-31 \
 *     --out output/journal-2026-05.pdf
 *
 * Wires the four layers built in C7a → C7b.2:
 *
 *   1. `buildPageSequence({ from, to })`           (src/core/splice.ts)
 *      Pure calendar math → ordered PageSpec[].
 *   2. `renderPageSpec(page, { profile })`         (src/core/prax-journal-renderer.ts)
 *      Puppeteer → one PDF buffer per HTML file
 *      (4 for a daily, 1 for a review).
 *   3. `splicePdfBuffers(renders)`                 (src/core/pdf-splice.ts)
 *      Concatenate + attach a flat bookmark outline.
 *   4. Write to disk, print the ledger.
 *
 * Optional `--profile <path>` lets you point at a non-default profile
 * JSON. Default is `packages/packs-prax-journal/profile.local.json`
 * (gitignored; falls back to printed-blanks if absent).
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { buildPageSequence } from '../packages/core/src/splice.js';
import { renderPageSpec } from '../packages/core/src/prax-journal-renderer.js';
import { splicePdfBuffers, bookmarkTitle, type SpecRender } from '../packages/core/src/pdf-splice.js';
import { closeBrowser } from '../packages/core/src/puppeteer-renderer.js';
import { parseProfile, type Profile } from '../packages/core/src/types/profile.js';

// ─── Args ───────────────────────────────────────────────────────
interface Args {
  from: string;
  to: string;
  out: string;
  profilePath: string;
}

/**
 * Minimal flag parser. Kept tiny + explicit rather than pulling in
 * yargs/commander — this CLI has 4 flags, all documented at the top
 * of the file.
 */
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
    profilePath: get(
      '--profile',
      'packages/packs-prax-journal/profile.local.json',
    ),
  };
}

/** ENOENT-tolerant profile loader. Missing file ⇒ printed-blank fallback. */
async function loadProfile(profilePath: string): Promise<Profile | undefined> {
  try {
    const raw = await fs.readFile(path.resolve(profilePath), 'utf-8');
    return parseProfile(JSON.parse(raw) as unknown);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
}

/** Format seconds with one decimal for runtime totals. */
function fmtSec(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Deterministic absolute path for the output so the ledger is unambiguous.
  const outPath = path.resolve(args.out);
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  // ── 1 · Calendar math ───────────────────────────────────────
  const specs = buildPageSequence({ from: args.from, to: args.to });
  if (specs.length === 0) {
    throw new Error(
      `buildPageSequence(${args.from} → ${args.to}) returned 0 specs — ` +
        'inverted range? Nothing to render.',
    );
  }

  // Tally by kind for the ledger.
  const counts = specs.reduce<Record<string, number>>((acc, s) => {
    acc[s.kind] = (acc[s.kind] ?? 0) + 1;
    return acc;
  }, {});
  const tally = Object.entries(counts)
    .map(([k, n]) => `${n}×${k}`)
    .join('  ');

  const profile = await loadProfile(args.profilePath);
  console.log(
    `Profile: ${profile ? args.profilePath + ' (loaded)' : 'none — Rx card falls back to printed blanks'}`,
  );
  console.log(`Range:   ${args.from} → ${args.to}`);
  console.log(`Specs:   ${specs.length}  (${tally})`);
  console.log('');

  // ── 2 · Render each spec, log progress ───────────────────────
  // Progress-logged because a ~40-spec render takes ~90s and silent
  // CLIs are miserable. We log one line per spec with elapsed ms so a
  // slow run is diagnosable at-a-glance.
  const renderT0 = Date.now();
  const renders: SpecRender[] = [];
  for (let i = 0; i < specs.length; i++) {
    const page = specs[i];
    const t0 = Date.now();
    const buffers = await renderPageSpec(page, { profile });
    const dt = Date.now() - t0;
    const pageCountSuffix = buffers.length > 1 ? ` (${buffers.length}p)` : '';
    console.log(
      `  [${String(i + 1).padStart(3)}/${specs.length}] ${bookmarkTitle(page).padEnd(22)}  ${String(dt).padStart(5)} ms${pageCountSuffix}`,
    );
    renders.push({ page, buffers });
  }
  const renderMs = Date.now() - renderT0;

  // ── 3 · Splice + bookmark outline ────────────────────────────
  const spliceT0 = Date.now();
  const finalPdf = await splicePdfBuffers(renders);
  const spliceMs = Date.now() - spliceT0;

  // ── 4 · Write + ledger ───────────────────────────────────────
  await fs.writeFile(outPath, finalPdf);
  const totalPages = renders.reduce(
    (n, r) => n + r.buffers.length, // one page per buffer today
    0,
  );

  console.log('');
  console.log(`Render:  ${fmtSec(renderMs)}  (${specs.length} specs)`);
  console.log(`Splice:  ${fmtSec(spliceMs)}  (${totalPages} pages, ${renders.length} bookmarks)`);
  console.log(`Wrote:   ${outPath}  (${(finalPdf.byteLength / 1024).toFixed(1)} KB)`);

  await closeBrowser();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
