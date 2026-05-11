#!/usr/bin/env -S npx tsx
/**
 * Compile `registry.json` by walking every `packages/packs-<id>/manifest.json`.
 *
 * Eng-review W2 T3 (Section 8) · Finding 1.2 registry primary + fallback.
 *
 * Contract:
 *   - Scans sibling `packages/packs-*` directories relative to this repo.
 *   - Reads + Zod-validates each `manifest.json` via `parseManifest()`.
 *   - Emits a single `registry.json` at the output path (default:
 *     `registry.json` at repo root) conforming to `RegistrySchema`.
 *   - Fails loud on the FIRST invalid manifest. Reporting-mode `--dry-run`
 *     continues through all packs and prints a summary; useful for CI.
 *
 * Exit codes:
 *   0  — success (registry written OR dry-run with zero issues)
 *   1  — one or more manifests failed parse / IO error
 *
 * W2 reality: `packages/packs-*` doesn't exist yet (packs migrate W4-6).
 * On an empty scan the script emits a valid empty registry and exits 0
 * so the gallery / CLI can consume the schema shape immediately.
 *
 * Usage:
 *   npx tsx scripts/generate-registry.ts
 *   npx tsx scripts/generate-registry.ts --out dist/registry.json
 *   npx tsx scripts/generate-registry.ts --dry-run
 *   npx tsx scripts/generate-registry.ts --frozen   # omit generated_at + source_commit
 *
 * The `--frozen` flag produces a byte-stable registry — `generated_at`
 * is omitted and `source_commit` is not probed. Use in CI / the repo-
 * committed copy so routine rebuilds don't churn history. Local dev
 * and production builds should run without --frozen so the gallery
 * footer can show "registry updated X minutes ago".
 * Addresses post-W5 code-review P2 #2.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import {
  parseManifest,
  REGISTRY_SCHEMA_VERSION,
  type PackManifest,
  type Registry,
} from '../packages/core/src/types/registry.js';
import {
  RegistryParseError,
  isPretextError,
} from '../packages/core/src/errors.js';

// ─── Paths ──────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(REPO_ROOT, 'packages');

// ─── Args ───────────────────────────────────────────────────────────

interface Args {
  outPath: string;
  dryRun: boolean;
  frozen: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const outIdx = argv.indexOf('--out');
  const outPath =
    outIdx >= 0 && outIdx < argv.length - 1
      ? path.resolve(argv[outIdx + 1])
      : path.join(REPO_ROOT, 'registry.json');
  const dryRun = argv.includes('--dry-run');
  const frozen = argv.includes('--frozen');
  return { outPath, dryRun, frozen };
}

// ─── Scanning ───────────────────────────────────────────────────────

/**
 * List every `packages/packs-*` directory that has a manifest.json.
 * Returns absolute manifest paths in deterministic (sorted) order so
 * the emitted registry is byte-stable across runs on the same tree.
 */
async function findManifests(): Promise<string[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(PACKAGES_DIR);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }

  const candidates = entries
    .filter((name) => name.startsWith('packs-'))
    .sort((a, b) => a.localeCompare(b));

  const found: string[] = [];
  for (const name of candidates) {
    const manifest = path.join(PACKAGES_DIR, name, 'manifest.json');
    try {
      const stat = await fs.stat(manifest);
      if (stat.isFile()) found.push(manifest);
    } catch {
      // manifest missing → skip (some scaffolds have the dir before the manifest).
    }
  }
  return found;
}

// ─── Best-effort git SHA for source_commit ──────────────────────────

/**
 * Read the current HEAD SHA without importing a git library. Returns
 * `undefined` when not inside a git checkout (e.g. npm-pack'd tarballs).
 */
function currentGitSha(): string | undefined {
  try {
    // Argv array (not a shell string) — immune to any future refactor
    // that concatenates a variable into the command. See code-review P3-6.
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

// ─── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const manifestPaths = await findManifests();

  console.log(`Scanning:  ${path.relative(REPO_ROOT, PACKAGES_DIR)}/packs-*/manifest.json`);
  console.log(`Found:     ${manifestPaths.length} manifest${manifestPaths.length === 1 ? '' : 's'}`);

  // Parse every manifest. In `--dry-run` mode, collect failures and
  // report at the end. In normal mode, the first failure exits non-zero.
  const packs: PackManifest[] = [];
  const failures: Array<{ path: string; error: unknown }> = [];

  for (const manifestPath of manifestPaths) {
    const relPath = path.relative(REPO_ROOT, manifestPath);
    try {
      const raw = await fs.readFile(manifestPath, 'utf-8');
      const json = JSON.parse(raw) as unknown;
      const manifest = parseManifest(relPath, json);
      // Invariant: the manifest's declared `id` must match its containing
      // directory name (`packages/packs-<id>/manifest.json`). The gallery
      // URL contract and the installer's path resolver both rely on this
      // (code-review P3-7). Zod validates id *shape*; this validates id
      // *identity* against the filesystem.
      const parentDirName = path.basename(path.dirname(manifestPath));
      const expectedDirName = `packs-${manifest.id}`;
      if (parentDirName !== expectedDirName) {
        throw new Error(
          `manifest ${relPath} declares id '${manifest.id}' but lives in ` +
            `directory '${parentDirName}'; expected directory name ` +
            `'${expectedDirName}'. Rename the directory or fix the id so ` +
            `they match.`,
        );
      }
      packs.push(manifest);
      console.log(`  ✓ ${relPath}  · ${manifest.id}@${manifest.version}`);
    } catch (err) {
      failures.push({ path: relPath, error: err });
      if (!args.dryRun) {
        // Re-throw so the caller sees a proper RegistryParseError with
        // the full Zod diagnostic list, not a silent exit.
        throw err;
      }
      console.error(`  ✗ ${relPath}  · ${(err as Error).message.split('\n')[0]}`);
    }
  }

  // Detect duplicate ids (would silently overwrite in the registry).
  // Any duplicate is an error — same-version duplicates are also wrong,
  // since two manifest files cannot both own the same id (fixed per
  // code-review P2-3).
  const seen = new Set<string>();
  for (const p of packs) {
    if (seen.has(p.id)) {
      throw new Error(
        `duplicate pack id '${p.id}' — found in more than one manifest; ` +
          `pack ids must be globally unique`,
      );
    }
    seen.add(p.id);
  }

  // Frozen mode: use an epoch placeholder timestamp and omit the git SHA
  // so the emitted JSON is byte-stable across runs on the same tree. The
  // schema still requires `generated_at` (consumers display it), so we
  // stamp a canonical "not tracked" value that parses but communicates
  // the mode clearly in the footer.
  const FROZEN_TIMESTAMP = '1970-01-01T00:00:00Z';
  const registry: Registry = {
    schema_version: REGISTRY_SCHEMA_VERSION,
    generated_at: args.frozen ? FROZEN_TIMESTAMP : new Date().toISOString(),
    source_commit: args.frozen ? undefined : currentGitSha(),
    packs,
  };

  if (args.dryRun) {
    console.log('');
    console.log(`Dry run — not writing. Would emit ${packs.length} packs.`);
    if (failures.length > 0) {
      console.log(`FAILED: ${failures.length} manifest${failures.length === 1 ? '' : 's'}`);
      for (const f of failures) {
        const msg = isPretextError(f.error)
          ? f.error.message
          : (f.error as Error).message;
        console.error(`\n─── ${f.path} ───\n${msg}`);
      }
      process.exitCode = 1;
    }
    return;
  }

  await fs.mkdir(path.dirname(args.outPath), { recursive: true });
  await fs.writeFile(args.outPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
  const sizeKb = (
    Buffer.byteLength(JSON.stringify(registry)) / 1024
  ).toFixed(2);
  console.log('');
  console.log(`Wrote:     ${path.relative(REPO_ROOT, args.outPath)}`);
  console.log(`Size:      ${sizeKb} KB`);
  console.log(`Packs:     ${packs.length}`);
  if (registry.source_commit !== undefined) {
    console.log(`Commit:    ${registry.source_commit.slice(0, 7)}`);
  }
}

main().catch((err: unknown) => {
  if (err instanceof RegistryParseError) {
    console.error('\n' + err.message);
  } else if (err instanceof Error) {
    console.error('\n' + (err.stack ?? err.message));
  } else {
    console.error('\nUnknown error:', err);
  }
  process.exitCode = 1;
});
