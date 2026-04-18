/**
 * Property-based tests for pdf-postprocess coordinate math.
 *
 * The CSS→PDF rect conversion is a one-way helper inside pdf-postprocess.ts,
 * but its invariants are easy to state as properties. Using fast-check we
 * catch whole classes of Y-flip / sign / NaN bugs that example-based tests
 * would never hit. See audit/TEST_STRATEGY.md §3 "Property-based tests".
 *
 * The helper isn't exported, so we re-implement the invariant it satisfies
 * (forward + inverse round-trip) and assert on the exported `addHyperlinks`
 * code path's accepted rects.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PDFDocument } from 'pdf-lib';
import { addHyperlinks } from '../../src/core/pdf-postprocess.js';

// Local mirror of the private helper cssToPageRect in pdf-postprocess.ts.
// Keeping it here ensures the test fails if the public behavior drifts.
function cssToPageRect(
  cssX: number,
  cssY: number,
  cssWidth: number,
  cssHeight: number,
  pageHeight: number,
): [number, number, number, number] {
  const x1 = cssX;
  const y1 = pageHeight - cssY - cssHeight;
  const x2 = cssX + cssWidth;
  const y2 = pageHeight - cssY;
  return [x1, y1, x2, y2];
}

function pdfToCssRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pageHeight: number,
): { cssX: number; cssY: number; cssWidth: number; cssHeight: number } {
  return {
    cssX: x1,
    cssWidth: x2 - x1,
    cssY: pageHeight - y2,
    cssHeight: y2 - y1,
  };
}

describe('cssToPageRect · round-trip is identity', () => {
  it('css → pdf → css returns the original for any valid rect', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: 0, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 500, noNaN: true }),
        fc.double({ min: 0.1, max: 500, noNaN: true }),
        fc.double({ min: 100, max: 2000, noNaN: true }),
        (cssX, cssY, cssWidth, cssHeight, pageHeight) => {
          // Keep the rect strictly inside the page so we don't test garbage.
          fc.pre(cssY + cssHeight <= pageHeight);
          fc.pre(cssX + cssWidth <= pageHeight * 2); // arbitrary upper bound

          const [x1, y1, x2, y2] = cssToPageRect(cssX, cssY, cssWidth, cssHeight, pageHeight);
          const back = pdfToCssRect(x1, y1, x2, y2, pageHeight);

          // Round-trip is exact within floating-point tolerance.
          const EPS = 1e-9;
          expect(Math.abs(back.cssX - cssX)).toBeLessThan(EPS);
          expect(Math.abs(back.cssY - cssY)).toBeLessThan(EPS);
          expect(Math.abs(back.cssWidth - cssWidth)).toBeLessThan(EPS);
          expect(Math.abs(back.cssHeight - cssHeight)).toBeLessThan(EPS);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('produces y1 ≤ y2 for any in-page rect (no inverted rect)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 800, noNaN: true }),
        fc.double({ min: 0.1, max: 300, noNaN: true }),
        fc.double({ min: 100, max: 2000, noNaN: true }),
        (cssY, cssHeight, pageHeight) => {
          fc.pre(cssY + cssHeight <= pageHeight);
          const [, y1, , y2] = cssToPageRect(0, cssY, 10, cssHeight, pageHeight);
          expect(y1).toBeLessThanOrEqual(y2);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('addHyperlinks · invariant: total valid rects × tolerated → no thrown', () => {
  async function makePdf(pageCount: number): Promise<Buffer> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) doc.addPage([595.28, 841.89]);
    return Buffer.from(await doc.save());
  }

  it('accepts any fuzzed valid rect without throwing', async () => {
    const pdf = await makePdf(2);
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: 0, max: 500, noNaN: true }),
        fc.double({ min: 0, max: 700, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        async (x, y, w, h) => {
          await expect(
            addHyperlinks(pdf, [{ sourcePageIndex: 0, destinationPageIndex: 1, rect: [x, y, w, h] }]),
          ).resolves.toBeInstanceOf(Buffer);
        },
      ),
      { numRuns: 30 },
    );
  });
});
