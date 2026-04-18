#!/usr/bin/env tsx
/**
 * Downloads the Google Fonts woff2 files the templates use into
 * `assets/fonts/` so rendering works offline (FIND-0014).
 *
 * This script is the first half of FIND-0014. The second half — rewriting
 * every `<link>` in `src/templates/html/*.html` to reference the local
 * `@font-face` file — is left as a follow-up because it's visual and should
 * be diffed template-by-template before shipping.
 *
 * Usage:
 *   npx tsx scripts/download-fonts.ts
 *
 * The downloader:
 *   1. Lists the 7 unique Google Fonts CSS URLs used across templates.
 *   2. Fetches each CSS with a modern User-Agent so Google serves woff2.
 *   3. Parses `src: url(...)` entries, dedupes by URL, downloads each woff2.
 *   4. Writes `assets/fonts/<family>/<variant>.woff2` + a fonts.css aggregator.
 *
 * Safety:
 *   - Only writes under assets/fonts/. No other filesystem touches.
 *   - Network allow-list: fetches only fonts.googleapis.com + fonts.gstatic.com.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'fonts');

// The 7 distinct Google Fonts stylesheet URLs used across src/templates/html/.
// Update this list if templates reference new font combinations.
const STYLESHEET_URLS: string[] = [
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap',
  'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Raleway:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Fira+Code:wght@400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Fira+Code:wght@400;500&display=swap',
];

// Modern UA so Google serves woff2 (default UA gets ttf).
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/17.6 Safari/605.1.15';

const ALLOW_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

function assertAllowedHost(url: string) {
  const host = new URL(url).hostname;
  if (!ALLOW_HOSTS.has(host)) {
    throw new Error(`Refusing to fetch non-allow-listed host: ${host}`);
  }
}

async function fetchText(url: string): Promise<string> {
  assertAllowedHost(url);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function fetchBuffer(url: string): Promise<Buffer> {
  assertAllowedHost(url);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

interface FaceRule {
  family: string;
  style: string;
  weight: string;
  unicodeRange: string;
  srcUrl: string;
}

/** Parse the @font-face rules out of a Google Fonts CSS document. */
function parseFontFaces(css: string): FaceRule[] {
  const rules: FaceRule[] = [];
  const blockRe = /@font-face\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(css)) !== null) {
    const body = m[1];
    const family = body.match(/font-family:\s*'([^']+)'/)?.[1] ?? '';
    const style = body.match(/font-style:\s*([a-z]+)/)?.[1] ?? 'normal';
    const weight = body.match(/font-weight:\s*([^;]+)/)?.[1].trim() ?? '400';
    const unicodeRange = body.match(/unicode-range:\s*([^;]+)/)?.[1].trim() ?? '';
    const srcUrl = body.match(/src:\s*url\(([^)]+)\)/)?.[1] ?? '';
    if (family && srcUrl) {
      rules.push({ family, style, weight, unicodeRange, srcUrl });
    }
  }
  return rules;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log(`→ Writing fonts under ${OUT_DIR}`);
  await fs.mkdir(OUT_DIR, { recursive: true });

  const seen = new Set<string>();
  const allRules: FaceRule[] = [];

  for (const css_url of STYLESHEET_URLS) {
    const css = await fetchText(css_url);
    const rules = parseFontFaces(css);
    console.log(`  CSS ${css_url.slice(0, 60)}… → ${rules.length} @font-face rules`);
    for (const rule of rules) {
      if (seen.has(rule.srcUrl)) continue;
      seen.add(rule.srcUrl);
      allRules.push(rule);
    }
  }

  console.log(`→ ${allRules.length} unique woff2 files to fetch`);

  const aggregated: string[] = [];
  aggregated.push('/* Auto-generated by scripts/download-fonts.ts. Do not edit. */');
  aggregated.push('/* Regenerate: npx tsx scripts/download-fonts.ts */');
  aggregated.push('');

  for (const rule of allRules) {
    const familyDir = path.join(OUT_DIR, slug(rule.family));
    await fs.mkdir(familyDir, { recursive: true });
    const filename = `${slug(rule.family)}-${rule.style}-${rule.weight.replace(/\s+/g, '')}-${
      slug(rule.unicodeRange || 'base').slice(0, 16)
    }.woff2`;
    const outFile = path.join(familyDir, filename);

    try {
      await fs.access(outFile);
      console.log(`  · cached ${path.relative(ROOT, outFile)}`);
    } catch {
      const buf = await fetchBuffer(rule.srcUrl);
      await fs.writeFile(outFile, buf);
      console.log(`  ✓ ${path.relative(ROOT, outFile)} (${(buf.length / 1024).toFixed(1)} KB)`);
    }

    const relUrl = `./${slug(rule.family)}/${filename}`;
    aggregated.push(`@font-face {`);
    aggregated.push(`  font-family: '${rule.family}';`);
    aggregated.push(`  font-style: ${rule.style};`);
    aggregated.push(`  font-weight: ${rule.weight};`);
    aggregated.push(`  font-display: swap;`);
    if (rule.unicodeRange) aggregated.push(`  unicode-range: ${rule.unicodeRange};`);
    aggregated.push(`  src: url('${relUrl}') format('woff2');`);
    aggregated.push(`}`);
  }

  const aggPath = path.join(OUT_DIR, 'fonts.css');
  await fs.writeFile(aggPath, aggregated.join('\n'));
  console.log(`→ Wrote aggregator ${path.relative(ROOT, aggPath)}`);

  console.log('');
  console.log('Next step: rewrite every `<link href="https://fonts.googleapis.com/…">`');
  console.log('in src/templates/html/*.html to:');
  console.log('  <link href="../../../assets/fonts/fonts.css" rel="stylesheet">');
  console.log('This half is deliberately not automated — diff each template visually before merging.');
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
