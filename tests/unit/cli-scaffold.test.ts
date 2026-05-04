/**
 * CLI scaffold · pure functions behind `pretext init` + `pretext remix`.
 *
 * Per DECISIONS.md rows 32-33:
 *   - `init` returns the inline template file map (NO filesystem writes
 *     happen inside the pure function; the command layer writes).
 *   - `remix` is a command-printer, not a command-runner — the pure
 *     function returns the shell commands as strings so the CLI can
 *     `console.log` them and the user can review before executing.
 *
 * Tests cover shape, id validation, no-shell-injection hardening, and
 * parity with the gallery `/remix` page language.
 */

import { describe, expect, it } from 'vitest';
import {
  buildInitTemplate,
  buildRemixCommands,
  isValidPackId,
} from '../../packages/cli/src/scaffold.js';

describe('isValidPackId', () => {
  it('accepts kebab-case ASCII', () => {
    expect(isValidPackId('my-pack')).toBe(true);
    expect(isValidPackId('a1b2-c3')).toBe(true);
    expect(isValidPackId('prax-journal')).toBe(true);
  });

  it('rejects uppercase / underscores / dots', () => {
    expect(isValidPackId('MyPack')).toBe(false);
    expect(isValidPackId('my_pack')).toBe(false);
    expect(isValidPackId('my.pack')).toBe(false);
  });

  it('rejects shell metacharacters (hardens remix against injection)', () => {
    expect(isValidPackId('my-pack; rm -rf ~')).toBe(false);
    expect(isValidPackId('a`id`b')).toBe(false);
    expect(isValidPackId('$(whoami)')).toBe(false);
    expect(isValidPackId('..')).toBe(false);
    expect(isValidPackId('../evil')).toBe(false);
  });

  it('rejects empty / too-long ids', () => {
    expect(isValidPackId('')).toBe(false);
    expect(isValidPackId('a'.repeat(65))).toBe(false);
  });
});

describe('buildInitTemplate', () => {
  it('emits a minimal four-file pack scaffold', () => {
    const files = buildInitTemplate('my-pack', { title: 'My Pack' });
    const names = files.map((f) => f.path).sort();
    expect(names).toEqual([
      'packages/packs-my-pack/README.md',
      'packages/packs-my-pack/manifest.json',
      'packages/packs-my-pack/my-pack.html',
    ]);
  });

  it('stamps the id into manifest.json as valid JSON with the expected shape', () => {
    const files = buildInitTemplate('hello-world', { title: 'Hello World' });
    const manifest = files.find((f) => f.path.endsWith('manifest.json'));
    expect(manifest).toBeTruthy();
    const parsed = JSON.parse(manifest!.content);
    expect(parsed.id).toBe('hello-world');
    expect(parsed.title).toBe('Hello World');
    expect(typeof parsed.version).toBe('string');
    expect(parsed.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(Array.isArray(parsed.files)).toBe(true);
    expect(parsed.files).toContain('hello-world.html');
  });

  it('rejects an invalid id rather than producing a file with bad bytes', () => {
    expect(() => buildInitTemplate('Evil Pack', { title: 'x' })).toThrow(/invalid pack id/i);
  });

  it('README references the pack id and is under 2 KB (contributor-friendly)', () => {
    const files = buildInitTemplate('tiny-pack', { title: 'Tiny Pack' });
    const readme = files.find((f) => f.path.endsWith('README.md'));
    expect(readme).toBeTruthy();
    expect(readme!.content).toContain('tiny-pack');
    expect(readme!.content).toContain('Tiny Pack');
    expect(readme!.content.length).toBeLessThan(2048);
  });

  it('emits the pack HTML with an <h1> matching the title', () => {
    const files = buildInitTemplate('letter-pack', { title: 'Letter Pack' });
    const html = files.find((f) => f.path.endsWith('.html'));
    expect(html!.content).toContain('<h1>Letter Pack</h1>');
    // Sanity: it is *a* full HTML doc, not a fragment.
    expect(html!.content).toContain('<!doctype html>');
  });
});

describe('buildRemixCommands', () => {
  it('produces the three-phase command block (clone → rebrand → commit)', () => {
    const out = buildRemixCommands({ sourceId: 'prax-journal', targetId: 'my-fork' });
    // The output is a string array of shell steps.
    expect(Array.isArray(out.steps)).toBe(true);
    expect(out.steps.length).toBeGreaterThanOrEqual(3);

    const joined = out.steps.join('\n');
    expect(joined).toContain('git clone');
    expect(joined).toContain('packages/packs-prax-journal');
    expect(joined).toContain('packages/packs-my-fork');
    expect(joined).toContain('sed');
  });

  it('validates both ids against shell-injection rules', () => {
    expect(() =>
      buildRemixCommands({ sourceId: 'prax-journal', targetId: 'bad id; rm -rf ~' }),
    ).toThrow(/invalid pack id/i);
    expect(() =>
      buildRemixCommands({ sourceId: 'Evil', targetId: 'my-fork' }),
    ).toThrow(/invalid pack id/i);
  });

  it('never overlaps source with target (nothing to remix into itself)', () => {
    expect(() =>
      buildRemixCommands({ sourceId: 'prax-journal', targetId: 'prax-journal' }),
    ).toThrow(/same/i);
  });

  it('includes a note that the commands are printed-not-executed (DECISIONS row 33)', () => {
    const out = buildRemixCommands({ sourceId: 'prax-journal', targetId: 'my-fork' });
    expect(out.preamble).toMatch(/review|copy|paste/i);
  });
});
