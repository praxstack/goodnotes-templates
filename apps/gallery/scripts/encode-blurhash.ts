/**
 * encode-blurhash — build-time helper that reads a specimen PNG, produces a
 * blurhash string + a tiny 32x32 PNG data-URL, and writes a manifest JSON.
 *
 * Run from the gallery workspace:
 *   npm run generate:specimens  (renders the PNG)
 *   tsx scripts/encode-blurhash.ts  (this file, emits blurhash-manifest.json)
 *
 * The manifest is read by pages at build-time (via Astro's file-loader
 * semantics — a plain dynamic import of JSON).
 */

import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encode } from 'blurhash';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_ROOT = path.resolve(HERE, '..');
const SPECIMENS_DIR = path.join(GALLERY_ROOT, 'public', 'specimens');
const MANIFEST_PATH = path.join(GALLERY_ROOT, 'src', 'data', 'blurhash-manifest.json');

// 4 × 3 components is the recommended default; keeps hash <= 40 chars.
const COMPONENTS_X = 4;
const COMPONENTS_Y = 3;

// Low-res placeholder dimension — small enough to inline as a data-URL,
// big enough that CSS blurs it smoothly at card size.
const PLACEHOLDER_SIZE = 32;

type Entry = {
  file: string;
  width: number;
  height: number;
  blurhash: string;
  dataUrl: string;
};

async function encodeFile(absPath: string): Promise<Entry> {
  const img = sharp(absPath);
  const meta = await img.metadata();
  if (!meta.width || !meta.height) {
    throw new Error(`sharp could not read dimensions for ${absPath}`);
  }

  // blurhash.encode wants raw RGBA. Use a small working copy for speed.
  const { data, info } = await sharp(absPath)
    .resize(64, 64, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const blurhash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    COMPONENTS_X,
    COMPONENTS_Y,
  );

  // Also emit a tiny PNG placeholder as a data-URL — cheaper to render than
  // decoding blurhash client-side, and zero client JS.
  const placeholder = await sharp(absPath)
    .resize(PLACEHOLDER_SIZE, PLACEHOLDER_SIZE, { fit: 'cover' })
    .blur(2)
    .png({ quality: 40, compressionLevel: 9 })
    .toBuffer();
  const dataUrl = `data:image/png;base64,${placeholder.toString('base64')}`;

  return {
    file: path.basename(absPath),
    width: meta.width,
    height: meta.height,
    blurhash,
    dataUrl,
  };
}

async function main(): Promise<void> {
  if (!existsSync(SPECIMENS_DIR)) {
    console.warn(
      `[encode-blurhash] ${SPECIMENS_DIR} does not exist yet — run 'npm run generate:specimens' first.`,
    );
    console.warn('[encode-blurhash] writing empty manifest so build still succeeds.');
    await writeFile(MANIFEST_PATH, JSON.stringify({}, null, 2) + '\n', 'utf8');
    return;
  }

  const { readdir } = await import('node:fs/promises');
  const files = (await readdir(SPECIMENS_DIR)).filter((f) => f.endsWith('.png'));

  const entries: Record<string, Omit<Entry, 'file'>> = {};
  for (const f of files) {
    const entry = await encodeFile(path.join(SPECIMENS_DIR, f));
    // Key by stem so pages can look up by pack id.
    const stem = f.replace(/\.png$/, '');
    entries[stem] = {
      width: entry.width,
      height: entry.height,
      blurhash: entry.blurhash,
      dataUrl: entry.dataUrl,
    };
  }

  // Byte-stable JSON (keys sorted) for reproducible builds.
  const sortedKeys = Object.keys(entries).sort();
  const sorted: typeof entries = {};
  for (const k of sortedKeys) sorted[k] = entries[k];

  await writeFile(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
  console.log(
    `[encode-blurhash] wrote ${sortedKeys.length} entr${sortedKeys.length === 1 ? 'y' : 'ies'} → ${path.relative(GALLERY_ROOT, MANIFEST_PATH)}`,
  );
}

await main();
