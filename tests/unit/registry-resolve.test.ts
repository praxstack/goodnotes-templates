/**
 * W11 · semver range resolver tests.
 *
 * Covers the CEO-plan E5 contract:
 *   - Exact version match
 *   - Caret / tilde range
 *   - Wildcard '*' → latest
 *   - Unknown id → PackNotFoundError with available ids
 *   - Known id but range unsatisfiable → PackNotFoundError with available versions
 *   - Garbage range → Error
 *   - Multiple versions of the same id (forward-compat assertion)
 */

import { describe, expect, it } from 'vitest';
import {
  resolvePackVersion,
  listPackIds,
  PackVersionNotFoundError,
} from '../../packages/core/src/registry-resolve.js';
import type { PackManifest, Registry } from '../../packages/core/src/types/registry.js';
import { PackNotFoundError } from '../../packages/core/src/errors.js';

const pack = (id: string, version: string): PackManifest => ({
  schema_version: 1 as const,
  id,
  version,
  name: id.replace(/-/g, ' '),
  description: `Test pack ${id}@${version}.`,
  category: 'worksheet',
  author: 'test',
  entry: `${id}.html`,
});

const registry = (packs: PackManifest[]): Registry => ({
  schema_version: 1 as const,
  generated_at: '2026-01-01T00:00:00Z',
  packs,
});

describe('resolvePackVersion', () => {
  it('returns the only matching manifest for an exact version', () => {
    const r = registry([pack('prax-journal', '5.3.0')]);
    const m = resolvePackVersion(r, 'prax-journal', '5.3.0');
    expect(m.id).toBe('prax-journal');
    expect(m.version).toBe('5.3.0');
  });

  it('handles caret range (^5.0.0 matches 5.3.0)', () => {
    const r = registry([pack('prax-journal', '5.3.0')]);
    expect(resolvePackVersion(r, 'prax-journal', '^5.0.0').version).toBe('5.3.0');
  });

  it('handles tilde range (~5.3 matches 5.3.0 but not 5.4.0)', () => {
    const r = registry([pack('prax-journal', '5.3.0')]);
    expect(resolvePackVersion(r, 'prax-journal', '~5.3').version).toBe('5.3.0');
  });

  it("'*' picks the highest version for the id", () => {
    const r = registry([
      pack('prax-journal', '5.3.0'),
      pack('prax-journal', '6.0.0'),
      pack('prax-journal', '5.0.0'),
    ]);
    expect(resolvePackVersion(r, 'prax-journal', '*').version).toBe('6.0.0');
  });

  it('picks the max satisfying when multiple versions exist', () => {
    const r = registry([
      pack('prax-journal', '5.0.0'),
      pack('prax-journal', '5.3.0'),
      pack('prax-journal', '6.0.0'),
    ]);
    expect(resolvePackVersion(r, 'prax-journal', '^5.0.0').version).toBe('5.3.0');
    expect(resolvePackVersion(r, 'prax-journal', '>=5').version).toBe('6.0.0');
  });

  it('throws PackNotFoundError with available ids on unknown id', () => {
    const r = registry([pack('prax-journal', '5.3.0'), pack('cornell-notes', '0.1.0')]);
    try {
      resolvePackVersion(r, 'ghost-pack', '*');
      throw new Error('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(PackNotFoundError);
      const err = e as PackNotFoundError;
      expect(err.message).toContain('ghost-pack');
      expect(err.message).toContain('cornell-notes');
      expect(err.message).toContain('prax-journal');
    }
  });

  it('throws PackVersionNotFoundError when id exists but range is unsatisfiable', () => {
    const r = registry([pack('prax-journal', '5.3.0')]);
    try {
      resolvePackVersion(r, 'prax-journal', '^6.0.0');
      throw new Error('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(PackVersionNotFoundError);
      expect((e as Error).message).toMatch(/no version satisfies range '\^6\.0\.0'/);
      expect((e as Error).message).toContain('5.3.0');
    }
  });

  it('throws a clear Error for a garbage range string', () => {
    const r = registry([pack('prax-journal', '5.3.0')]);
    expect(() => resolvePackVersion(r, 'prax-journal', 'not-a-range')).toThrow(
      /is not a valid semver range/,
    );
  });

  it('range with spaces works (>=5 <6)', () => {
    const r = registry([
      pack('prax-journal', '5.3.0'),
      pack('prax-journal', '6.0.0'),
    ]);
    expect(resolvePackVersion(r, 'prax-journal', '>=5 <6').version).toBe('5.3.0');
  });
});

describe('listPackIds', () => {
  it('returns unique sorted ids', () => {
    const r = registry([
      pack('prax-journal', '5.3.0'),
      pack('cornell-notes', '0.1.0'),
      pack('prax-journal', '6.0.0'), // dupe id (future multi-version registry)
    ]);
    expect(listPackIds(r)).toEqual(['cornell-notes', 'prax-journal']);
  });

  it('returns [] for empty registry', () => {
    expect(listPackIds(registry([]))).toEqual([]);
  });
});
