/**
 * Review M1 (audit 2026-10): Astro 7 changed the compressHTML default to
 * 'jsx', which strips whitespace between elements written on separate source
 * lines. On the gallery that glued words together on every pack page,
 * /remix and /contribute ("Built with the@scope/cli"). The config must opt
 * back into the Astro 6 behaviour (collapse runs of whitespace to one space).
 */
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('gallery astro config', () => {
  it('keeps inter-element whitespace (compressHTML: true, not the Astro 7 "jsx" default)', async () => {
    const url = pathToFileURL(path.join(root, 'apps', 'gallery', 'astro.config.mjs')).href;
    const { default: config } = (await import(url)) as { default: { compressHTML?: unknown } };
    expect(config.compressHTML).toBe(true);
  });
});
