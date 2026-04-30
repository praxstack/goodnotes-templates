/**
 * T2 module tests for src/core/svg-renderer.ts.
 * Protects FIND-0027 (escXml in SVG text interpolation) and guards against
 * accidental regression in the 19 STICKER_SIZES entries.
 */

import { describe, it, expect } from 'vitest';
import { generateStickerSVG, STICKER_SIZES, type StickerType } from '../../packages/core/src/svg-renderer.js';

describe('generateStickerSVG', () => {
  it('returns a non-empty SVG for every registered sticker type', () => {
    for (const type of Object.keys(STICKER_SIZES) as StickerType[]) {
      const svg = generateStickerSVG(type);
      expect(svg).toMatch(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
      expect(svg).toContain('</svg>');
    }
  });

  it("escapes XML-sensitive characters in user-supplied text (FIND-0027)", () => {
    const hostile = `</text><script>alert(1)</script><text>`;
    const svg = generateStickerSVG('date-tab', { text: hostile });

    // Nothing in the output should be an un-escaped </text> boundary break.
    // The hostile string before escape contains </text><script> — after escape
    // the < becomes &lt;, so the substring '</text><script>' must not appear.
    expect(svg).not.toContain('</text><script>');
    expect(svg).toContain('&lt;');
    expect(svg).toContain('&gt;');
  });

  it('escapes ampersands correctly', () => {
    const svg = generateStickerSVG('banner', { text: 'A&B' });
    expect(svg).toContain('&amp;B');
    expect(svg).not.toContain('A&B<');
  });

  it('escapes single + double quotes', () => {
    const svg = generateStickerSVG('banner', { text: `it's "A"` });
    expect(svg).toContain('&apos;s');
    expect(svg).toContain('&quot;A&quot;');
  });
});
