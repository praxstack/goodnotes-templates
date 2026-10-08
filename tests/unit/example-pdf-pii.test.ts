/**
 * GNT-019 — public example PDFs must not contain real health data.
 *
 * The deny-list holds SHA-256 hashes of lowercase tokens so the real values are
 * not re-published in the repo by the very test that guards them.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const DENY_SHA256 = new Set([
  '3ee62bcac62bc05a3ae82db65b3d7b15dbc9d5e3533a01b463206d6a2ef1141c',
  'ead7fd8aec5ed41adcc0898a60f5acb0d86c997707250940bd8cd0d4ff070bba',
  '1d6ddded77ccebe66d1cf0cb98bf1d18f29415995a735150da586993103124db',
  'fcc68692865e6b40f80d0dd1eaa86a4528bae11ec22528fc463f975427e002b5',
  'c3f34a79c9bc27e6979ebbf0a564d559b2393d248e6c3ae87799bb2ca8d90f7e',
  'c48b1f773456fde18ba13960988ff2623921528b63d6188eb1bc62e8a7f858cc',
  'fc1a8fc81824ab1600eda9dd118c6550b281ed3eedb2f9254df1f39c7d57caae',
]);

function ascii85(s: string): Buffer {
  const body = s.replace(/\s+/g, '').replace(/^<~/, '').replace(/~>.*$/, '');
  const out: number[] = [];
  let group: number[] = [];
  const flush = (n: number) => {
    let v = 0;
    for (let i = 0; i < 5; i++) v = v * 85 + (group[i] ?? 84);
    const bytes = [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
    out.push(...bytes.slice(0, n));
  };
  for (const ch of body) {
    if (ch === 'z' && group.length === 0) { out.push(0, 0, 0, 0); continue; }
    group.push(ch.charCodeAt(0) - 33);
    if (group.length === 5) { flush(4); group = []; }
  }
  if (group.length > 1) flush(group.length - 1);
  return Buffer.from(out);
}

/** Best-effort text recovery from raw / Flate / ASCII85+Flate PDF streams. */
function pdfText(file: string): string {
  const raw = fs.readFileSync(file);
  const latin = raw.toString('latin1');
  let text = latin;
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  for (const m of latin.matchAll(re)) {
    const dictStart = latin.lastIndexOf('<<', m.index);
    const dict = latin.slice(dictStart, m.index);
    let buf: Buffer = Buffer.from(m[1], 'latin1');
    try {
      if (/ASCII85Decode/.test(dict)) buf = ascii85(m[1]);
      if (/FlateDecode/.test(dict)) buf = inflateSync(buf);
      text += '\n' + buf.toString('latin1');
    } catch { /* not decodable: ignore */ }
  }
  return text;
}

/** Prefer poppler's pdftotext (handles embedded-font text); fall back to raw stream scan. */
function extractedText(file: string): { text: string; accurate: boolean } {
  const r = spawnSync('pdftotext', ['-q', file, '-'], { encoding: 'utf8' });
  if (r.status === 0 && !r.error) return { text: r.stdout, accurate: true };
  return { text: pdfText(file), accurate: false };
}

function examplePdfs(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...examplePdfs(p));
    else if (e.name.toLowerCase().endsWith('.pdf')) out.push(p);
  }
  return out;
}

describe('example PDFs contain no real health data (GNT-019)', () => {
  const pdfs = examplePdfs(path.join(root, 'examples'));

  it('finds example PDFs', () => {
    expect(pdfs.length).toBeGreaterThan(0);
  });

  it.each(pdfs.map((p) => [path.relative(root, p), p]))('%s', (_rel, file) => {
    const { text, accurate } = extractedText(file);
    const hits = (text.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) =>
      DENY_SHA256.has(createHash('sha256').update(w).digest('hex')),
    );
    expect(hits.length, 'denied token(s) present (values withheld)').toBe(0);
    if (accurate) expect(/\b\d+(?:\.\d+)?\s?mg\b/i.test(text), 'dose pattern present').toBe(false);
  });
});
