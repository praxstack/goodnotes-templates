/**
 * Pixel diff helper built on `sharp` — no new dependency.
 *
 * For each spec we compare the current render against `tests/visual/baselines/
 * <name>.png` and write a human-readable RED overlay to
 * `tests/visual/diffs/<name>.diff.png` whenever the diff exceeds the
 * per-pixel tolerance. Headline numbers are bubbled up to the caller so the
 * test can assert on them.
 *
 * This isn't a perfect replacement for `pixelmatch`, but it is small,
 * deterministic, and requires zero supply-chain review.
 */

import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface DiffResult {
  /** Total pixels compared (equal on both images). */
  pixels: number;
  /** Pixels whose channel-delta exceeds the tolerance. */
  diffPixels: number;
  /** diffPixels / pixels, in the range [0, 1]. */
  ratio: number;
  /** Path to the overlay PNG, if one was written. */
  diffPath?: string;
}

export interface DiffOptions {
  /**
   * Per-channel delta that counts as "different" — 0..255.
   * Sub-pixel font anti-aliasing drifts by a couple of points between OSes,
   * so we ignore any pixel whose max channel delta is below this threshold.
   */
  threshold?: number;
  /** Where to save the red-overlay diff PNG if pixels differ. */
  diffPath?: string;
}

/**
 * Compare two PNG buffers. Returns per-pixel diff stats and optionally
 * writes an overlay highlighting differing pixels in red.
 */
export async function diffPng(
  actual: Buffer,
  expected: Buffer,
  opts: DiffOptions = {},
): Promise<DiffResult> {
  const threshold = opts.threshold ?? 8;

  // Normalise both images to raw RGBA at the *expected* image's dimensions.
  // If sizes differ we surface that via a 100% diff rather than throwing —
  // catching resize regressions is the whole point of this harness.
  const [expRaw, actMeta] = await Promise.all([
    sharp(expected).raw().toBuffer({ resolveWithObject: true }),
    sharp(actual).metadata(),
  ]);
  const { width, height } = expRaw.info;

  if (actMeta.width !== width || actMeta.height !== height) {
    if (opts.diffPath) {
      await fs.mkdir(path.dirname(opts.diffPath), { recursive: true });
      await fs.writeFile(opts.diffPath, actual);
    }
    return {
      pixels: width * height,
      diffPixels: width * height,
      ratio: 1,
      diffPath: opts.diffPath,
    };
  }

  const actRaw = await sharp(actual)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = expRaw.info.channels; // usually 4 (RGBA)
  const a = actRaw.data;
  const b = expRaw.data;
  const pixels = width * height;
  let diffPixels = 0;

  // Build the overlay lazily so baseline-matching runs stay fast.
  let overlay: Buffer | null = null;
  if (opts.diffPath) {
    // Start from a lightly desaturated copy of the actual image so the red
    // diff pixels pop against the background when a human reviews.
    overlay = Buffer.from(a);
  }

  for (let i = 0; i < pixels; i++) {
    const o = i * channels;
    const dr = Math.abs(a[o] - b[o]);
    const dg = Math.abs(a[o + 1] - b[o + 1]);
    const db = Math.abs(a[o + 2] - b[o + 2]);
    if (dr > threshold || dg > threshold || db > threshold) {
      diffPixels++;
      if (overlay) {
        overlay[o] = 255;
        overlay[o + 1] = 0;
        overlay[o + 2] = 0;
        if (channels === 4) overlay[o + 3] = 255;
      }
    }
  }

  let diffPath: string | undefined;
  if (opts.diffPath && overlay && diffPixels > 0) {
    await fs.mkdir(path.dirname(opts.diffPath), { recursive: true });
    await sharp(overlay, {
      raw: { width, height, channels: channels as 3 | 4 },
    })
      .png()
      .toFile(opts.diffPath);
    diffPath = opts.diffPath;
  }

  return { pixels, diffPixels, ratio: diffPixels / pixels, diffPath };
}

/**
 * High-level helper: compare an `actual` buffer against a baseline on disk.
 * If `UPDATE_BASELINES=1` is set, write the actual as the new baseline and
 * return a perfect-match result (so the test always passes on update runs).
 * If the baseline is missing, also treat that as an "update" run — the very
 * first time the suite runs it just records all the pages.
 */
export async function compareToBaseline(
  actual: Buffer,
  baselinePath: string,
  opts: DiffOptions = {},
): Promise<DiffResult & { updated: boolean; created: boolean }> {
  const forceUpdate = process.env.UPDATE_BASELINES === '1';
  let baselineExists = true;
  try {
    await fs.access(baselinePath);
  } catch {
    baselineExists = false;
  }

  if (!baselineExists || forceUpdate) {
    await fs.mkdir(path.dirname(baselinePath), { recursive: true });
    await fs.writeFile(baselinePath, actual);
    return {
      pixels: 0,
      diffPixels: 0,
      ratio: 0,
      updated: forceUpdate && baselineExists,
      created: !baselineExists,
    };
  }

  const expected = await fs.readFile(baselinePath);
  const diff = await diffPng(actual, expected, opts);
  return { ...diff, updated: false, created: false };
}
