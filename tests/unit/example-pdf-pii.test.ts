/**
 * GNT-019 — public example PDFs must not contain real health data.
 *
 * The checks are structural, so the test never needs the real values in the
 * repo (not even hashed: short tokens are trivially dictionary-reversible):
 *   - no medication dose pattern (mg, mcg, µg, ml, IU),
 *   - "Dr." / "Doctor" (any case) may only be followed by an allow-listed placeholder
 *     that ends the name (no capitalised surname after it),
 *   - a medication-log entry ("<name>: [ ] AM") must name a placeholder medication,
 *   - no Author / XMP creator metadata.
 *
 * Text comes from two independent extractors and every check runs on both:
 *   - a built-in stream scanner (raw, Flate, ASCII85+Flate; literal and hex
 *     strings), which needs no external tool, and
 *   - poppler's pdftotext, which also handles embedded-font (CID) text.
 * pdftotext is mandatory on CI (ci.yml installs poppler-utils); locally the
 * built-in scanner still runs when it is missing.
 */
import { describe, it, expect } from 'vitest';
import { deflateSync, inflateSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The only names allowed after a clinician title in example PDFs. */
const PLACEHOLDER_CLINICIANS = new Set(['example', 'placeholder']);

/** A medication-log entry: "<name>: [ ] AM|PM|Taken". The name must be a placeholder. */
const MED_ENTRY = /^[ \t]*([^:\n]+?)[ \t]*:[ \t]*\[[ \t]?\][ \t]*(?:AM|PM|Taken|Noon|Night)\b/gim;
const PLACEHOLDER_MEDICATION = /^Example Medication [A-Z]$/;

function ascii85Decode(s: string): Buffer {
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

function ascii85Encode(buf: Buffer): string {
  let out = '';
  for (let i = 0; i < buf.length; i += 4) {
    const chunk = [0, 1, 2, 3].map((k) => buf[i + k] ?? 0);
    const n = Math.min(4, buf.length - i);
    let v = ((chunk[0] << 24) | (chunk[1] << 16) | (chunk[2] << 8) | chunk[3]) >>> 0;
    if (v === 0 && n === 4) { out += 'z'; continue; }
    const digits: string[] = [];
    for (let k = 0; k < 5; k++) { digits.unshift(String.fromCharCode((v % 85) + 33)); v = Math.floor(v / 85); }
    out += digits.slice(0, n + 1).join('');
  }
  return out + '~>';
}

/** Decode a PDF hex string body (UTF-16BE when it has a BOM, else single-byte). */
function hexText(hex: string): string {
  const clean = hex.replace(/\s+/g, '');
  const buf = Buffer.from(clean.length % 2 ? clean + '0' : clean, 'hex');
  if (buf[0] === 0xfe && buf[1] === 0xff) return buf.subarray(2).swap16().toString('utf16le');
  return buf.toString('latin1');
}

/** Unescape a PDF literal string body. */
function literalText(s: string): string {
  return s.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_m, e: string) => {
    if (/^[0-7]+$/.test(e)) return String.fromCharCode(parseInt(e, 8));
    return ({ n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' } as Record<string, string>)[e] ?? e;
  });
}

const STR = String.raw`<[0-9A-Fa-f\s]*>|\((?:\\.|[^\\)])*\)`;

function decodeString(tok: string): string {
  return tok.startsWith('<') ? hexText(tok.slice(1, -1)) : literalText(tok.slice(1, -1));
}

/** Text shown by Tj / ' / " / TJ operators in a content stream, one string per line. */
function shownText(content: string): string[] {
  const out: string[] = [];
  const show = new RegExp(String.raw`(${STR})\s*(?:Tj|'|")|\[((?:${STR}|[^\]<(])*)\]\s*TJ`, 'g');
  for (const m of content.matchAll(show)) {
    if (m[1]) out.push(decodeString(m[1]));
    else out.push([...m[2].matchAll(new RegExp(STR, 'g'))].map((t) => decodeString(t[0])).join(''));
  }
  return out;
}

/**
 * Built-in extractor, needs no external tool. `text` is the shown text of
 * every content stream; `meta` is the raw file plus every decoded stream
 * (object streams, XMP), used only for metadata keys.
 */
function scanPdf(raw: Buffer): { text: string; meta: string } {
  const latin = raw.toString('latin1');
  const meta: string[] = [latin];
  const text: string[] = [];
  // ReportLab ends ASCII85 streams with `~>endstream` (no EOL), so allow none.
  for (const m of latin.matchAll(/stream\r?\n([\s\S]*?)\s*endstream/g)) {
    const dict = latin.slice(latin.lastIndexOf('<<', m.index), m.index);
    // Images and embedded font programs carry no text; scanning them is slow and noisy.
    if (/\/Subtype\s*\/(?:Image|Type1C|CIDFontType0C|OpenType)\b|\/Length[123]\b/.test(dict)) continue;
    let decoded: string;
    try {
      let buf: Buffer = Buffer.from(m[1], 'latin1');
      if (/ASCII85Decode/.test(dict)) buf = ascii85Decode(m[1]);
      if (/FlateDecode/.test(dict)) buf = inflateSync(buf);
      decoded = buf.toString('latin1');
    } catch { continue; /* not decodable: ignore */ }
    meta.push(decoded);
    text.push(...shownText(decoded));
  }
  return { text: text.join('\n'), meta: meta.join('\n') };
}

/** Categories of problems found; never the matched values. */
function violations(text: string, meta = ''): string[] {
  const found = new Set<string>();
  if (/\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|ug|ml|iu)\b/i.test(text)) found.add('dose');
  for (const m of text.matchAll(/\b(?:Dr|Doctor)\.?[ \t]+([A-Za-z][\w'-]*)(?:[ \t]+([A-Za-z][\w'-]*))?/gi)) {
    // The placeholder must end the name: a capitalised next word is a surname.
    if (!PLACEHOLDER_CLINICIANS.has(m[1].toLowerCase()) || /^[A-Z]/.test(m[2] ?? '')) {
      found.add('clinician-name');
    }
  }
  for (const m of text.matchAll(MED_ENTRY)) {
    if (!PLACEHOLDER_MEDICATION.test(m[1].trim())) found.add('medication-name');
  }
  if (/\/Author\b|<dc:creator[\s>]/.test(meta)) found.add('author-metadata');
  return [...found].sort();
}

const pdftotextAvailable = !spawnSync('pdftotext', ['-v']).error;

function pdftotext(file: string): string {
  const r = spawnSync('pdftotext', ['-q', file, '-'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`pdftotext failed on ${path.basename(file)} (status ${r.status})`);
  return r.stdout;
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

describe('PII scanner self-test (no external tools)', () => {
  const FAKE = 'Fakedrug 10 mg at night, ask Dr. Notreal';

  it('flags dose, clinician and author in a pdf-lib PDF (hex strings, object streams)', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    page.drawText(FAKE, { x: 40, y: 700, font: await doc.embedFont(StandardFonts.Helvetica), size: 12 });
    doc.setAuthor('Someone');
    const bytes = Buffer.from(await doc.save());
    const { text, meta } = scanPdf(bytes);
    expect(text).toContain(FAKE);
    expect(violations(text, meta)).toEqual(['author-metadata', 'clinician-name', 'dose']);
  });

  it('flags text in a ReportLab-style ASCII85+Flate stream ending in "~>endstream"', () => {
    const content = ascii85Encode(deflateSync(Buffer.from(`BT /F1 12 Tf 40 700 Td (${FAKE}) Tj ET`, 'latin1')));
    const pdf = `%PDF-1.4\n4 0 obj\n<< /Filter [ /ASCII85Decode /FlateDecode ] /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n%%EOF\n`;
    expect(pdf).toContain('~>endstream');
    const { text, meta } = scanPdf(Buffer.from(pdf, 'latin1'));
    expect(text).toContain(FAKE);
    expect(violations(text, meta)).toEqual(['clinician-name', 'dose']);
  });

  it('matches clinician titles in any case', () => {
    expect(violations('ask dr. Notreal')).toEqual(['clinician-name']);
    expect(violations('ASK DOCTOR NOTREAL')).toEqual(['clinician-name']);
    expect(violations('ask doctor example')).toEqual([]);
  });

  it('flags a surname after a placeholder clinician name', () => {
    expect(violations('ask Dr. Example Notreal')).toEqual(['clinician-name']);
    expect(violations('DOCTOR PLACEHOLDER NOTREAL')).toEqual(['clinician-name']);
    expect(violations('ask Dr. Example about it')).toEqual([]);
  });

  it('flags an XMP dc:creator element that carries attributes', () => {
    const xmp = '<dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Seq><rdf:li>Someone</rdf:li></rdf:Seq></dc:creator>';
    expect(violations('', xmp)).toEqual(['author-metadata']);
    expect(violations('', '<dc:creator\n><rdf:Seq/></dc:creator>')).toEqual(['author-metadata']);
  });

  it('flags a non-placeholder medication entry without a dose', () => {
    expect(violations('Fakedrugname: [ ] AM  [ ] PM')).toEqual(['medication-name']);
    expect(violations('Morning\n  fakedrugname : [] taken')).toEqual(['medication-name']);
  });

  it('allows the placeholder vocabulary', () => {
    expect(violations('Example Medication A: [ ] AM  (clinician advice placeholder: Dr. Example)')).toEqual([]);
    expect(violations('Example Medication C: [ ] Taken\nTarget bedtime: __:__   [ ] Screen off')).toEqual([]);
    expect(violations('Walk 200 steps/hour; 4+ glasses of water; 10 min break')).toEqual([]);
  });
});

describe('example PDFs contain no real health data (GNT-019)', () => {
  const pdfs = examplePdfs(path.join(root, 'examples'));

  it('finds example PDFs', () => {
    expect(pdfs.length).toBeGreaterThan(0);
  });

  it('pdftotext is installed on CI (no silent fallback)', () => {
    if (process.env.CI) expect(pdftotextAvailable, 'install poppler-utils').toBe(true);
  });

  it.each(pdfs.map((p) => [path.relative(root, p), p]))('%s', (_rel, file) => {
    const raw = fs.readFileSync(file);
    // Values are withheld from failure output on purpose: only categories are reported.
    const { text, meta } = scanPdf(raw);
    expect(violations(text, meta), 'built-in scanner').toEqual([]);
    if (pdftotextAvailable) expect(violations(pdftotext(file)), 'pdftotext').toEqual([]);
  });
});
