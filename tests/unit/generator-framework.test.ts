/**
 * Iter-6 Phase 1 — generator framework contract tests.
 *
 * Covers:
 *   · GeneratorInput validation (all field rules in generator.ts)
 *   · Pack registry lookup (isGeneratorPack / GENERATOR_PACKS)
 *   · habit-tracker generator output shape + HTML substitution
 *
 * This is the proof that the Phase 1 E1 abstraction is coherent. Every
 * future generator-enabled pack will pass the same validation layer, so
 * these tests are load-bearing for the whole CEO v5 Phase 1 design.
 */

import { describe, it, expect } from 'vitest';
import {
  validateGeneratorInput,
  InvalidGeneratorInputError,
  isGeneratorPack,
  GENERATOR_PACKS,
} from '../../packages/core/src/generator.js';

describe('validateGeneratorInput', () => {
  it('accepts empty input', () => {
    expect(validateGeneratorInput({})).toEqual({});
  });

  it('accepts a full valid input', () => {
    const input = {
      from: '2026-06-01',
      to: '2026-06-30',
      year: 2026,
      month: 6,
      weeks: 4,
      habits: ['lift', 'walk', 'read'],
      locale: 'en-US',
      weekStart: 1 as const,
    };
    expect(validateGeneratorInput(input)).toEqual(input);
  });

  describe('date fields', () => {
    it('rejects non-ISO --from', () => {
      expect(() => validateGeneratorInput({ from: 'not-a-date' })).toThrow(
        InvalidGeneratorInputError,
      );
    });

    it('rejects non-ISO --to', () => {
      expect(() => validateGeneratorInput({ to: 'gibberish' })).toThrow(
        InvalidGeneratorInputError,
      );
    });

    it('rejects --from > --to', () => {
      expect(() =>
        validateGeneratorInput({ from: '2026-12-31', to: '2026-01-01' }),
      ).toThrow(/on or before/);
    });

    it('accepts --from === --to', () => {
      const input = { from: '2026-06-15', to: '2026-06-15' };
      expect(validateGeneratorInput(input)).toEqual(input);
    });
  });

  describe('year bounds', () => {
    it('rejects year < 1900', () => {
      expect(() => validateGeneratorInput({ year: 1800 })).toThrow(/1900-2100/);
    });
    it('rejects year > 2100', () => {
      expect(() => validateGeneratorInput({ year: 2500 })).toThrow(/1900-2100/);
    });
    it('rejects non-integer year', () => {
      expect(() => validateGeneratorInput({ year: 2026.5 })).toThrow(
        InvalidGeneratorInputError,
      );
    });
    it('accepts year boundary 1900', () => {
      expect(validateGeneratorInput({ year: 1900 }).year).toBe(1900);
    });
    it('accepts year boundary 2100', () => {
      expect(validateGeneratorInput({ year: 2100 }).year).toBe(2100);
    });
  });

  describe('month bounds', () => {
    it('rejects month 0', () => {
      expect(() => validateGeneratorInput({ month: 0 })).toThrow(/1-12/);
    });
    it('rejects month 13', () => {
      expect(() => validateGeneratorInput({ month: 13 })).toThrow(/1-12/);
    });
    it('accepts month 1 and 12', () => {
      expect(validateGeneratorInput({ month: 1 }).month).toBe(1);
      expect(validateGeneratorInput({ month: 12 }).month).toBe(12);
    });
  });

  describe('weeks bounds', () => {
    it('rejects weeks 0', () => {
      expect(() => validateGeneratorInput({ weeks: 0 })).toThrow(/1-52/);
    });
    it('rejects weeks 53', () => {
      expect(() => validateGeneratorInput({ weeks: 53 })).toThrow(/1-52/);
    });
  });

  describe('habits validation', () => {
    it('rejects >12 entries', () => {
      const habits = Array.from({ length: 13 }, (_, i) => `habit-${i}`);
      expect(() => validateGeneratorInput({ habits })).toThrow(/at most 12/);
    });
    it('accepts exactly 12 entries', () => {
      const habits = Array.from({ length: 12 }, (_, i) => `h${i}`);
      expect(validateGeneratorInput({ habits }).habits).toEqual(habits);
    });
    it('rejects empty string entries', () => {
      expect(() => validateGeneratorInput({ habits: ['ok', ''] })).toThrow(
        /non-empty/,
      );
    });
    it('rejects entries >40 chars', () => {
      const long = 'a'.repeat(41);
      expect(() => validateGeneratorInput({ habits: [long] })).toThrow(
        /40 characters/,
      );
    });
    it('accepts entry exactly 40 chars', () => {
      const boundary = 'a'.repeat(40);
      expect(validateGeneratorInput({ habits: [boundary] }).habits).toEqual([
        boundary,
      ]);
    });
  });

  describe('weekStart', () => {
    it('accepts 0 (Sunday)', () => {
      expect(validateGeneratorInput({ weekStart: 0 }).weekStart).toBe(0);
    });
    it('accepts 1 (Monday)', () => {
      expect(validateGeneratorInput({ weekStart: 1 }).weekStart).toBe(1);
    });
    it('rejects 2', () => {
      expect(() =>
        validateGeneratorInput({ weekStart: 2 as unknown as 0 | 1 }),
      ).toThrow(/0 \(Sunday\) or 1 \(Monday\)/);
    });
  });
});

describe('GENERATOR_PACKS registry', () => {
  it('contains habit-tracker (the Phase 1 reference impl)', () => {
    expect(GENERATOR_PACKS).toContain('habit-tracker');
  });

  it('isGeneratorPack returns true for listed ids', () => {
    expect(isGeneratorPack('habit-tracker')).toBe(true);
  });

  it('isGeneratorPack returns false for non-generator packs', () => {
    // budget-tracker is a real pack but doesn't have a generator yet.
    expect(isGeneratorPack('budget-tracker')).toBe(false);
  });

  it('isGeneratorPack returns false for made-up ids', () => {
    expect(isGeneratorPack('pack-that-does-not-exist')).toBe(false);
    expect(isGeneratorPack('')).toBe(false);
  });
});

describe('habit-tracker generator (reference impl)', () => {
  it('returns valid HTML + metadata with year + habits', async () => {
    // Dynamic import because the generator resolves paths via import.meta.url
    // and the test runner needs the file to actually exist on disk, which it does.
    const mod = await import(
      '../../packages/packs-habit-tracker/generate.js'
    );
    const generate = mod.default as (input: unknown) => Promise<{
      html: string;
      suggestedFilename?: string;
      metadata?: { title?: string };
    }>;

    const out = await generate({
      year: 2027,
      month: 6,
      habits: ['lift', 'walk', 'read'],
      locale: 'en-US',
    });

    expect(out.html).toContain('<!DOCTYPE html>');
    // Year + month should be substituted into the date-field spans.
    expect(out.html).toContain('>June<');
    expect(out.html).toContain('>2027<');
    // Habit labels should land inside habit-name-line spans.
    expect(out.html).toContain('>lift<');
    expect(out.html).toContain('>walk<');
    expect(out.html).toContain('>read<');
    // Filename should reflect parameters.
    expect(out.suggestedFilename).toBe('habit-tracker-2027-06');
    expect(out.metadata?.title).toContain('June');
    expect(out.metadata?.title).toContain('2027');
  });

  it('leaves template unchanged when no flags provided', async () => {
    const mod = await import(
      '../../packages/packs-habit-tracker/generate.js'
    );
    const generate = mod.default as (input: unknown) => Promise<{ html: string; suggestedFilename?: string }>;

    const out = await generate({});
    // Unfilled date-field spans should remain empty.
    expect(out.html).toMatch(/<span class="date-field"><\/span>/);
    // Unfilled habit-name-line spans should remain empty.
    expect(out.html).toMatch(/<span class="habit-name-line"><\/span>/);
    expect(out.suggestedFilename).toBe('habit-tracker');
  });

  it('escapes HTML in habit labels to prevent injection', async () => {
    const mod = await import(
      '../../packages/packs-habit-tracker/generate.js'
    );
    const generate = mod.default as (input: unknown) => Promise<{ html: string }>;

    const out = await generate({
      habits: ['<script>alert(1)</script>', 'normal & safe'],
    });
    // The <script> tag must be escaped.
    expect(out.html).not.toContain('<script>alert(1)</script>');
    expect(out.html).toContain('&lt;script&gt;');
    expect(out.html).toContain('normal &amp; safe');
  });

  it('produces stable output for identical input', async () => {
    const mod = await import(
      '../../packages/packs-habit-tracker/generate.js'
    );
    const generate = mod.default as (input: unknown) => Promise<{ html: string }>;

    const input = { year: 2026, month: 11, habits: ['sleep', 'meditate'] };
    const a = await generate(input);
    const b = await generate(input);
    // Byte-equal HTML. Important for golden-file testing in future phases.
    expect(a.html).toBe(b.html);
  });
});
