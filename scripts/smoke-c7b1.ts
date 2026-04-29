/**
 * C7b.1 smoke test — renders one daily PageSpec end-to-end.
 *
 * Writes 4 PDFs to `output/c7b1-smoke/` (today / midday / reflect /
 * brain-dump). Not a committed test; just proof the renderer wires up.
 *
 *   npx tsx scripts/smoke-c7b1.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  renderPageSpec,
  DAILY_HTML_FILES,
} from '../src/core/prax-journal-renderer.js';
import { closeBrowser } from '../src/core/puppeteer-renderer.js';
import { parseProfile, type Profile } from '../src/types/profile.js';

/**
 * Load `profile.local.json` from the pack if present. Missing file ⇒
 * return undefined and the renderer falls back to printed-blanks, so
 * the smoke script still works on a fresh clone with no local PII.
 */
async function loadLocalProfile(): Promise<Profile | undefined> {
  const p = path.resolve(
    'packs/journals/prax-journal/profile.local.json',
  );
  try {
    const raw = await fs.readFile(p, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    return parseProfile(parsed);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
}

async function main(): Promise<void> {
  const outDir = path.resolve('output/c7b1-smoke');
  await fs.mkdir(outDir, { recursive: true });

  const profile = await loadLocalProfile();
  console.log(
    profile
      ? 'profile.local.json loaded → Rx card will be populated'
      : 'no profile.local.json → Rx card falls back to printed blanks',
  );

  const t0 = Date.now();
  const buffers = await renderPageSpec(
    { kind: 'daily', date: '2026-05-01' },
    { profile },
  );
  const dt = Date.now() - t0;


  console.log(`renderPageSpec(daily 2026-05-01) → ${buffers.length} buffers in ${dt} ms`);
  if (buffers.length !== DAILY_HTML_FILES.length) {
    throw new Error(`expected ${DAILY_HTML_FILES.length} buffers, got ${buffers.length}`);
  }

  for (let i = 0; i < buffers.length; i++) {
    const base = DAILY_HTML_FILES[i].replace('.html', '');
    const file = path.join(outDir, `${String(i + 1).padStart(2, '0')}-${base}.pdf`);
    await fs.writeFile(file, buffers[i]);
    console.log(`  ✓ ${file}  (${(buffers[i].length / 1024).toFixed(1)} KB)`);
  }

  await closeBrowser();
  console.log(`\nDone. Open with: open ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
