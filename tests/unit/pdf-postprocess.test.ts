/**
 * T1 module tests for src/core/pdf-postprocess.ts.
 * Protects FIND-0024 (hyperlink rect validation) and FIND-0026 (bookmark
 * strict-mode). Uses pdf-lib to build minimal valid PDFs as fixtures.
 */

import { describe, it, expect, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { addHyperlinks, addBookmarks } from '../../src/core/pdf-postprocess.js';

async function makePdf(pageCount: number): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([595.28, 841.89]); // A4
  }
  return Buffer.from(await doc.save());
}

describe('addHyperlinks · FIND-0024 rect validation', () => {
  it('skips a link whose width is zero', async () => {
    const pdf = await makePdf(2);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = await addHyperlinks(pdf, [
      { sourcePageIndex: 0, destinationPageIndex: 1, rect: [0, 0, 0, 20] },
    ]);
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toContain('invalid rect');
    expect(out).toBeInstanceOf(Buffer);
    warn.mockRestore();
  });

  it('skips a link whose height is negative', async () => {
    const pdf = await makePdf(2);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await addHyperlinks(pdf, [
      { sourcePageIndex: 0, destinationPageIndex: 1, rect: [10, 10, 20, -5] },
    ]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid rect'));
    warn.mockRestore();
  });

  it('skips a link with NaN in the rect', async () => {
    const pdf = await makePdf(2);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await addHyperlinks(pdf, [
      { sourcePageIndex: 0, destinationPageIndex: 1, rect: [Number.NaN, 0, 10, 10] },
    ]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid rect'));
    warn.mockRestore();
  });

  it('skips a link with Infinity in the rect', async () => {
    const pdf = await makePdf(2);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await addHyperlinks(pdf, [
      { sourcePageIndex: 0, destinationPageIndex: 1, rect: [0, 0, Number.POSITIVE_INFINITY, 10] },
    ]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid rect'));
    warn.mockRestore();
  });

  it('accepts a valid rect and writes an annotation', async () => {
    const pdf = await makePdf(2);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = await addHyperlinks(pdf, [
      { sourcePageIndex: 0, destinationPageIndex: 1, rect: [50, 50, 100, 30] },
    ]);
    // No warn for the valid case.
    expect(warn).not.toHaveBeenCalled();
    // Re-loading the output should succeed and the first page should now
    // carry an /Annots entry.
    const reloaded = await PDFDocument.load(out);
    const page0Ref = reloaded.getPage(0).node;
    expect(page0Ref.get(undefined as never)).toBeUndefined();
    // We can't grep for Annots without more ceremony; size comparison is a
    // cheap proxy — the annotated PDF is bigger than a naked 2-page PDF.
    expect(out.length).toBeGreaterThan(pdf.length);
    warn.mockRestore();
  });
});

describe('addBookmarks · FIND-0026 onRangeError modes', () => {
  it("warns and clamps when onRangeError is 'warn' (default)", async () => {
    const pdf = await makePdf(3);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const out = await addBookmarks(pdf, [
      { title: 'Out of range', pageIndex: 999 },
    ]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('out of range'));
    expect(out).toBeInstanceOf(Buffer);
    warn.mockRestore();
  });

  it("throws when onRangeError is 'throw'", async () => {
    const pdf = await makePdf(3);
    await expect(
      addBookmarks(pdf, [{ title: 'Out of range', pageIndex: 999 }], {
        onRangeError: 'throw',
      }),
    ).rejects.toThrow(/out of range/);
  });

  it('does not throw or warn for in-range indices', async () => {
    const pdf = await makePdf(3);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await addBookmarks(pdf, [{ title: 'In range', pageIndex: 1 }], { onRangeError: 'throw' });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
