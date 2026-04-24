/**
 * Visual-regression baselines for the Prax Journal v4 and v5 pages.
 *
 * How this works:
 *  1. First run (or `UPDATE_BASELINES=1`): records a PNG per template
 *     under `tests/visual/baselines/`.
 *  2. Subsequent runs: re-renders each template and compares to the
 *     baseline with a small per-pixel tolerance. A red overlay is
 *     written to `tests/visual/diffs/<name>.diff.png` whenever the
 *     ratio exceeds the per-spec budget.
 *
 * The budget is intentionally forgiving (0.5% of pixels) — we want to
 * catch structural drift (missing card, wrong column, shifted heading)
 * without failing on sub-pixel font anti-aliasing noise.
 */

import { afterAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderToPng, closeBrowser } from './helpers/render.js';
import { compareToBaseline } from './helpers/diff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HTML_DIR = path.join(REPO_ROOT, 'src', 'templates', 'html');
const BASELINE_DIR = path.join(__dirname, 'baselines');
const DIFF_DIR = path.join(__dirname, 'diffs');

// Pages under active design — any pixel drift deserves a look.
const TEMPLATES = [
  // v5 — current production journal (Prax journal, 4-page spread).
  'adhd-v5-today',
  'adhd-v5-midday',
  'adhd-v5-reflect',
  'adhd-v5-brain-dump',
  // v4 — predecessor, still referenced by /v4-all.
  'adhd-v4-today',
  'adhd-v4-reflect',
  'adhd-v4-brain-dump',
  // Design-system reference page — regressions here usually signal a
  // broken token in `prax-journal-design.md`.
  'prax-journal-design-system',
] as const;

// 0.5% of pixels (~4,463 on an A4 canvas). Tight enough to catch a
// missing card; loose enough to tolerate font-hinting jitter.
const MAX_DIFF_RATIO = 0.005;
const PIXEL_THRESHOLD = 10;

describe('Prax journal — visual baselines', () => {
  afterAll(async () => {
    await closeBrowser();
  });

  for (const name of TEMPLATES) {
    it(`${name} matches its baseline`, async () => {
      const htmlPath = path.join(HTML_DIR, `${name}.html`);
      const actual = await renderToPng({ htmlPath });

      const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
      const diffPath = path.join(DIFF_DIR, `${name}.diff.png`);

      const result = await compareToBaseline(actual, baselinePath, {
        threshold: PIXEL_THRESHOLD,
        diffPath,
      });

      if (result.created) {
        // eslint-disable-next-line no-console
        console.log(`  📸 baseline created: ${path.relative(REPO_ROOT, baselinePath)}`);
        return;
      }
      if (result.updated) {
        // eslint-disable-next-line no-console
        console.log(`  ♻️  baseline updated: ${path.relative(REPO_ROOT, baselinePath)}`);
        return;
      }

      if (result.ratio > MAX_DIFF_RATIO) {
        throw new Error(
          `Visual drift on ${name}: ${(result.ratio * 100).toFixed(3)}% of pixels differ ` +
            `(${result.diffPixels} / ${result.pixels}). ` +
            `See ${path.relative(REPO_ROOT, diffPath)}. ` +
            `If this change is intentional, regenerate baselines with ` +
            `UPDATE_BASELINES=1 npm run test:visual`,
        );
      }
      expect(result.ratio).toBeLessThanOrEqual(MAX_DIFF_RATIO);
    });
  }
});
