/**
 * tests/unit/standalone-builder.test.ts
 *
 * Covers `buildStandaloneHtml()` in
 * `packages/core/src/standalone-builder.ts`:
 *   - empty pages → StandaloneCompileError stage 'stitch-pages'
 *   - missing <body> → StandaloneCompileError stage 'extract-body'
 *     with htmlPath surfaced
 *   - dedupe: identical <style> blocks collapse to one
 *   - data-label uses page.label with attribute escaping
 *   - output contains the harness .ledger-page class (collision-safe)
 *   - body class propagates as data-body-class attribute
 */

import { describe, expect, it } from 'vitest';
import {
  buildStandaloneHtml,
  type StandalonePageInput,
} from '../../packages/core/src/standalone-builder.js';
import { StandaloneCompileError } from '../../packages/core/src/errors.js';

const makePage = (
  overrides: Partial<StandalonePageInput> & { body?: string; style?: string; bodyClass?: string },
): StandalonePageInput => {
  const bodyClass = overrides.bodyClass ?? '';
  const classAttr = bodyClass ? ` class="${bodyClass}"` : '';
  const style = overrides.style ?? 'body { margin: 0 }';
  const body = overrides.body ?? '<div class="page">content</div>';
  return {
    html: `<!doctype html><html><head><style>${style}</style></head><body${classAttr}>${body}</body></html>`,
    label: overrides.label ?? 'daily:today',
    sourcePath: overrides.sourcePath,
  };
};

describe('buildStandaloneHtml()', () => {
  it('throws StandaloneCompileError on empty pages', () => {
    try {
      buildStandaloneHtml({ title: 'test', pages: [] });
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(StandaloneCompileError);
      expect((err as StandaloneCompileError).details.stage).toBe('stitch-pages');
    }
  });

  it('throws extract-body with htmlPath when <body> is missing', () => {
    const bad: StandalonePageInput = {
      html: '<!doctype html><html><head><style>x</style></head>no body tag</html>',
      label: 'daily:broken',
      sourcePath: '/abs/path/broken.html',
    };
    try {
      buildStandaloneHtml({ title: 'test', pages: [bad] });
      throw new Error('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(StandaloneCompileError);
      const sce = err as StandaloneCompileError;
      expect(sce.details.stage).toBe('extract-body');
      expect(sce.details.htmlPath).toBe('/abs/path/broken.html');
    }
  });

  it('stitches N pages into one document with the harness CSS', () => {
    const out = buildStandaloneHtml({
      title: 'May 2026',
      pages: [makePage({ label: 'daily:today' }), makePage({ label: 'daily:midday' })],
    });
    expect(out).toMatch(/<!DOCTYPE html>/u);
    expect(out).toContain('<title>May 2026</title>');
    expect(out).toContain('section.ledger-page'); // harness class
    expect(out).toContain('data-label="daily:today"');
    expect(out).toContain('data-label="daily:midday"');
    // Two sections emitted
    expect(out.match(/<section class="ledger-page"/gu)?.length).toBe(2);
  });

  it('dedupes identical <style> blocks across pages', () => {
    const shared = 'body { margin: 0 }';
    const p1 = makePage({ style: shared, label: 'p1' });
    const p2 = makePage({ style: shared, label: 'p2' });
    const p3 = makePage({ style: shared, label: 'p3' });
    const out = buildStandaloneHtml({ title: 't', pages: [p1, p2, p3] });
    // Source style should appear in the merged head exactly once.
    const matches = out.match(new RegExp(`body \\{ margin: 0 \\}`, 'gu'));
    expect(matches?.length).toBe(1);
  });

  it('keeps distinct <style> blocks', () => {
    const p1 = makePage({ style: '.a {}', label: 'p1' });
    const p2 = makePage({ style: '.b {}', label: 'p2' });
    const out = buildStandaloneHtml({ title: 't', pages: [p1, p2] });
    expect(out).toContain('.a {}');
    expect(out).toContain('.b {}');
  });

  it('extracts only the body innerHTML (not the wrapper tag)', () => {
    const p = makePage({
      body: '<article data-test="yes">hello</article>',
      label: 'p',
    });
    const out = buildStandaloneHtml({ title: 't', pages: [p] });
    expect(out).toContain('<article data-test="yes">hello</article>');
    // The inner wrapper should be `section.ledger-page`, not a second <body>.
    const bodyTags = out.match(/<body\b/gu);
    expect(bodyTags?.length).toBe(1);
  });

  it('propagates body class via data-body-class', () => {
    const p = makePage({ bodyClass: 'daily theme-caffeine', label: 'p' });
    const out = buildStandaloneHtml({ title: 't', pages: [p] });
    expect(out).toContain('data-body-class="daily theme-caffeine"');
  });

  it('omits data-body-class when body has no class', () => {
    const p = makePage({ bodyClass: '', label: 'p' });
    const out = buildStandaloneHtml({ title: 't', pages: [p] });
    expect(out).not.toContain('data-body-class');
  });

  it('escapes " and < in label attribute', () => {
    const p = makePage({ label: 'evil"<script>' });
    const out = buildStandaloneHtml({ title: 't', pages: [p] });
    expect(out).toContain('data-label="evil&quot;&lt;script>"');
    // And it should not inject a raw <script>:
    expect(out).not.toContain('<script>');
  });

  it('escapes title for safety', () => {
    const out = buildStandaloneHtml({
      title: 'May "2026"',
      pages: [makePage({ label: 'p' })],
    });
    expect(out).toContain('<title>May &quot;2026&quot;</title>');
  });
});
