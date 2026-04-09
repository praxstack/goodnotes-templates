import { describe, it, expect } from 'vitest';
import { getPageDimensions, pointsToPixels, pixelsToPoints, getContentArea, PAGE_SIZES } from '../../src/core/dimensions.js';

describe('Dimensions', () => {
  it('has 6 paper sizes', () => {
    expect(Object.keys(PAGE_SIZES)).toHaveLength(6);
  });

  it('A4 dimensions are correct', () => {
    const a4 = getPageDimensions('a4');
    expect(a4.width).toBeCloseTo(595.28, 1);
    expect(a4.height).toBeCloseTo(841.89, 1);
  });

  it('landscape swaps width and height', () => {
    const portrait = getPageDimensions('a4', 'portrait');
    const landscape = getPageDimensions('a4', 'landscape');
    expect(landscape.width).toBeCloseTo(portrait.height, 1);
    expect(landscape.height).toBeCloseTo(portrait.width, 1);
  });

  it('converts points to pixels at 150 DPI', () => {
    expect(pointsToPixels(72, 150)).toBe(150);
    expect(pointsToPixels(36, 150)).toBe(75);
  });

  it('converts pixels to points at 150 DPI', () => {
    expect(pixelsToPoints(150, 150)).toBeCloseTo(72, 1);
  });

  it('calculates content area with margins', () => {
    const dims = getPageDimensions('a4');
    const content = getContentArea(dims, { top: 54, right: 54, bottom: 54, left: 54 });
    expect(content.width).toBeCloseTo(dims.width - 108, 1);
    expect(content.height).toBeCloseTo(dims.height - 108, 1);
    expect(content.x).toBe(54);
    expect(content.y).toBe(54);
  });
});
