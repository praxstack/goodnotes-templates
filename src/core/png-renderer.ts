/**
 * PNG renderer — converts SVG stickers to transparent PNGs at 300 DPI using Sharp.
 */

import sharp from 'sharp';
import type { Theme } from '../types/index.js';
import { generateStickerSVG, STICKER_SIZES, type StickerType } from './svg-renderer.js';

const TARGET_DPI = 300;

/**
 * Render a single sticker SVG to a transparent PNG buffer.
 */
export async function renderStickerPNG(
  type: StickerType,
  theme: Theme,
  options: { text?: string; variant?: number; dpi?: number } = {}
): Promise<Buffer> {
  const { text, variant, dpi = TARGET_DPI } = options;
  const svg = generateStickerSVG(type, theme, { text, variant });
  const size = STICKER_SIZES[type];

  // Scale based on DPI (SVG dimensions are at 72 DPI baseline)
  const scale = dpi / 72;
  const width = Math.round(size.width * scale);
  const height = Math.round(size.height * scale);

  return sharp(Buffer.from(svg))
    .resize(width, height)
    .png({ compressionLevel: 6 })
    .toBuffer();
}

/**
 * Render a sticker and save to disk.
 */
export async function renderStickerToFile(
  type: StickerType,
  theme: Theme,
  outputPath: string,
  options: { text?: string; variant?: number; dpi?: number } = {}
): Promise<{ path: string; size: number }> {
  const buffer = await renderStickerPNG(type, theme, options);
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buffer);

  return { path: outputPath, size: buffer.length };
}

/**
 * Batch render all variants of a sticker type for a theme.
 */
export async function batchRenderStickers(
  type: StickerType,
  theme: Theme,
  outputDir: string,
  variants: Array<{ text?: string; variant?: number; suffix: string }>
): Promise<Array<{ path: string; size: number }>> {
  const path = await import('node:path');
  const results: Array<{ path: string; size: number }> = [];

  for (const v of variants) {
    const filename = `${type}-${theme.id}-${v.suffix}.png`;
    const outputPath = path.join(outputDir, filename);
    const result = await renderStickerToFile(type, theme, outputPath, {
      text: v.text,
      variant: v.variant,
    });
    results.push(result);
  }

  return results;
}
