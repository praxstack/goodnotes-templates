/**
 * Build-all-stickers orchestrator.
 *
 * Invokes every sticker build script in parallel. The shared
 * sticker-renderer memoizes font encoding so running 12 in parallel
 * is effectively 12× one build's font-read cost.
 *
 * Replaces the manual "run 5 separate tsx commands" workflow that
 * was error-prone and guaranteed to drift after an aesthetic tweak.
 *
 * Usage: npm run build:stickers
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Script list — kept explicit so adding a new sticker requires
// exactly one line here. Ordered by size class (cheapest first) so
// quick feedback comes through early.
const SCRIPTS = [
  'build-mood-dot.ts',
  'build-thought-flip.ts',
  'build-wins-jar.ts',
  'build-friend-letter.ts',
  'build-stickers-remaining.ts', // contains the 8 compact/standard variants
];

function runOne(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['tsx', path.join(__dirname, script)], {
      stdio: 'inherit',
    });
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

const started = Date.now();
console.log(`\nBuilding all 12 stickers (${SCRIPTS.length} scripts, parallel)…\n`);

await Promise.all(SCRIPTS.map(runOne));

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\n✓ all stickers built in ${elapsed}s`);
