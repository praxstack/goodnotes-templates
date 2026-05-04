/**
 * build-og-cards — emit 1200 × 630 OpenGraph cards for every pack × theme.
 *
 * W10 · CEO plan E4 · design-review D-17.
 *
 * Strategy: each card is rendered from an SVG template string → PNG via
 * sharp. Zero Puppeteer (a full browser roundtrip for 154 cards = 2+
 * minutes). SVG is faster (~200 ms per card on an M-series Mac), smaller
 * to diff, and survives font-metric drift because we fall back to
 * system ui-serif + ui-monospace. Cards are pure identity + palette;
 * they don't embed a specimen thumbnail because we don't want to rebuild
 * them every time a template HTML changes.
 *
 * Matrix: 22 packs × 7 themes = 154 cards at public/og/<pack>/<theme>.png
 * Each card ~12-18 KB. Total payload under 3 MB — cached eagerly by
 * Twitter / Discord / Slack / iMessage link unfurlers.
 *
 * Fallback card: public/og/default.png (site-wide OG for home/browse/search).
 *
 * Byte-stability: SVG is deterministic, sharp PNG encoding is
 * reproducible on the same platform+version. Running the script twice
 * in a row produces identical files.
 *
 * Usage:
 *   npm run build:og -w @pretext-templates/gallery
 *
 * This is a build-time emit; the generated PNGs are gitignored and
 * regenerated from the (committed) pack manifests + theme palette.
 * The expected CI wire-up is a separate commit; for W10 we keep the
 * pipeline off the default build path (it's 12-18s on cold cache).
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(GALLERY_ROOT, '..', '..');
const PACKAGES = path.join(REPO_ROOT, 'packages');
const OUT = path.join(GALLERY_ROOT, 'public', 'og');
const PALETTE_FILE = path.join(GALLERY_ROOT, 'src', 'data', 'theme-palette.json');

const W = 1200;
const H = 630;

type Palette = {
  background: string;
  foreground: string;
  primary: string;
  accent: string;
  border: string;
  muted: string;
};

type Theme = { id: string; name: string; palette: Palette };

type Manifest = {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
};

// ── Helpers ──────────────────────────────────────────────────────────

function xmlEscape(s: string): string {
  // Covers the four SVG-critical entities + newline stripping so a
  // multi-line pack name never breaks the <text> tag.
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, ' ');
}

function svgCard(pack: Manifest, theme: Theme): string {
  const p = theme.palette;

  // Title sizing: if the name is short (<= 18 chars) render at the
  // larger 88px, otherwise step down. Avoids overflow on "Eisenhower
  // Matrix" and "Reflection Journal" without needing a full text-layout
  // engine.
  const titleSize = pack.name.length <= 18 ? 88 : 68;

  // Truncate description at 120 chars to fit one line at 28px.
  const descLimit = 120;
  const desc =
    pack.description.length > descLimit
      ? pack.description.slice(0, descLimit - 1) + '…'
      : pack.description;

  // Dot ornament: small chip that mirrors the in-gallery swatch style.
  const dotX = 80;
  const dotY = 80;
  const dotR = 16;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${p.background}"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${p.primary}"/>
  <circle cx="${dotX}" cy="${dotY}" r="${dotR}" fill="${p.primary}" stroke="${p.accent}" stroke-width="4"/>
  <text x="80" y="250" font-family="ui-serif, Georgia, 'Fraunces', serif" font-weight="700" font-size="${titleSize}" fill="${p.foreground}" letter-spacing="-1">${xmlEscape(pack.name)}</text>
  <text x="80" y="330" font-family="ui-serif, Georgia, 'Fraunces', serif" font-size="28" fill="${p.foreground}" opacity="0.82">${xmlEscape(desc)}</text>
  <text x="80" y="${H - 96}" font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="20" fill="${p.primary}" letter-spacing="3">${xmlEscape(pack.category.toUpperCase())} · V${xmlEscape(pack.version.toUpperCase())}</text>
  <text x="${W - 80}" y="${H - 96}" text-anchor="end" font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="20" fill="${p.foreground}" opacity="0.7" letter-spacing="3">PRETEXT-TEMPLATES · ${xmlEscape(theme.name.toUpperCase())}</text>
</svg>`;
}

function svgDefault(): string {
  // Site-wide fallback — used for home / browse / search OG. Keeps the
  // warm-analog palette since chrome never themes (decision #13).
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#F9F5EC"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#2A2824"/>
  <circle cx="80" cy="80" r="16" fill="#7B9476" stroke="#B85A44" stroke-width="4"/>
  <text x="80" y="260" font-family="ui-serif, Georgia, 'Fraunces', serif" font-weight="700" font-size="112" fill="#2A2824" letter-spacing="-1">pretext-templates</text>
  <text x="80" y="340" font-family="ui-serif, Georgia, 'Fraunces', serif" font-size="32" fill="#4A453D">Warm analog planning templates for digital notebooks.</text>
  <text x="80" y="${H - 96}" font-family="ui-monospace, 'JetBrains Mono', Menlo, monospace" font-size="22" fill="#7B9476" letter-spacing="3">22 PACKS · 7 THEMES · MIT</text>
</svg>`;
}

async function loadThemes(): Promise<Theme[]> {
  const raw = await readFile(PALETTE_FILE, 'utf8');
  const parsed = JSON.parse(raw) as { themes: Theme[] };
  return parsed.themes;
}

async function loadManifests(): Promise<Manifest[]> {
  const entries = (await readdir(PACKAGES)).filter((n) => n.startsWith('packs-'));
  const out: Manifest[] = [];
  for (const dir of entries.sort()) {
    const file = path.join(PACKAGES, dir, 'manifest.json');
    if (!existsSync(file)) continue;
    const raw = await readFile(file, 'utf8');
    const m = JSON.parse(raw) as Manifest;
    out.push(m);
  }
  return out;
}

async function renderCard(svg: string, outPath: string): Promise<number> {
  // PNG over WebP for OG compat — Twitter still prefers PNG for unfurls
  // in 2026. sharp's PNG encoder is deterministic at the same version;
  // palette encoding keeps files small without visible quality loss
  // since OG cards use 6-8 flat colors.
  const buf = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true, effort: 10 })
    .toBuffer();
  await writeFile(outPath, buf);
  return buf.byteLength;
}

async function main(): Promise<void> {
  const start = Date.now();
  const themes = await loadThemes();
  const manifests = await loadManifests();
  const total = manifests.length * themes.length + 1; // +1 = default

  await mkdir(OUT, { recursive: true });

  console.log(`[build-og-cards] matrix: ${manifests.length} packs × ${themes.length} themes = ${manifests.length * themes.length} cards + 1 default`);

  let written = 0;
  let bytes = 0;

  // Default site card
  const defaultPath = path.join(OUT, 'default.png');
  bytes += await renderCard(svgDefault(), defaultPath);
  written++;

  for (const pack of manifests) {
    const packDir = path.join(OUT, pack.id);
    await mkdir(packDir, { recursive: true });
    for (const theme of themes) {
      const outPath = path.join(packDir, `${theme.id}.png`);
      const svg = svgCard(pack, theme);
      bytes += await renderCard(svg, outPath);
      written++;
      if (written % 20 === 0 || written === total) {
        console.log(`  rendered ${written}/${total} cards`);
      }
    }
  }

  const ms = Date.now() - start;
  const kb = (bytes / 1024).toFixed(0);
  console.log('');
  console.log(`[build-og-cards] wrote ${written} cards · ${kb} KB total · ${ms} ms`);
  console.log(`  → ${path.relative(REPO_ROOT, OUT)}/<pack>/<theme>.png`);
  console.log(`  → ${path.relative(REPO_ROOT, defaultPath)}`);
}

await main();
