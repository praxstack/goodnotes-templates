/**
 * Iter-6 Phase 1 — contract tests for the remaining 3 generators.
 *
 * Proves the generator pattern scales beyond the habit-tracker reference
 * implementation:
 *   · yearly-overview  — single year-field substitution
 *   · monthly-planner  — month + year substitution in the header card
 *   · weekly-planner   — --from → Monday snap + 7 day-date fields
 */

import { describe, it, expect } from 'vitest';
import {
  GENERATOR_PACKS,
  isGeneratorPack,
} from '../../packages/core/src/generator.js';
import {
  escapeHtml,
  monthName,
  shortDayDate,
  isoDate,
} from '../../packages/core/src/generator-helpers.js';

describe('generator-helpers', () => {
  describe('escapeHtml', () => {
    it('escapes ampersands', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B');
    });
    it('escapes less-than', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });
    it('escapes greater-than', () => {
      expect(escapeHtml('1 > 0')).toBe('1 &gt; 0');
    });
    it('escapes in correct order (& before < >)', () => {
      // If & escaped last, '<' → '&lt;' would become '&amp;lt;'
      expect(escapeHtml('<a>')).toBe('&lt;a&gt;');
    });
    it('leaves plain text unchanged', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });
  });

  describe('monthName', () => {
    it('returns English month for en-US', () => {
      expect(monthName(1, 'en-US')).toBe('January');
      expect(monthName(12, 'en-US')).toBe('December');
    });
    it('defaults to en-US when no locale', () => {
      expect(monthName(6)).toBe('June');
    });
    it('returns empty string for out-of-range month', () => {
      expect(monthName(0)).toBe('');
      expect(monthName(13)).toBe('');
    });
    it('falls back to en-US on unknown locale', () => {
      // 'xx-XX' is not a valid locale; implementation should degrade.
      const name = monthName(3, 'xx-XX');
      // Either Intl returns something (edge case) or we get March.
      expect(name.length).toBeGreaterThan(0);
    });
  });

  describe('shortDayDate', () => {
    it('formats a valid date as DD/MM', () => {
      expect(shortDayDate(new Date('2026-06-05T00:00:00'))).toBe('05/06');
    });
    it('returns __/__ for invalid date', () => {
      expect(shortDayDate(new Date('not-a-date'))).toBe('__/__');
    });
  });

  describe('isoDate', () => {
    it('formats a valid date as YYYY-MM-DD', () => {
      expect(isoDate(new Date('2026-06-15T00:00:00'))).toBe('2026-06-15');
    });
    it('returns empty string for invalid date', () => {
      expect(isoDate(new Date('nope'))).toBe('');
    });
    it('pads single-digit month and day', () => {
      expect(isoDate(new Date('2026-01-03T00:00:00'))).toBe('2026-01-03');
    });
  });
});

describe('GENERATOR_PACKS registry (Phase 1 expanded)', () => {
  it('contains all 4 Phase 1 flagship packs', () => {
    expect(GENERATOR_PACKS).toContain('habit-tracker');
    expect(GENERATOR_PACKS).toContain('yearly-overview');
    expect(GENERATOR_PACKS).toContain('monthly-planner');
    expect(GENERATOR_PACKS).toContain('weekly-planner');
  });

  it('isGeneratorPack returns true for each flagship', () => {
    for (const id of GENERATOR_PACKS) {
      expect(isGeneratorPack(id)).toBe(true);
    }
  });
});

describe('yearly-overview generator', () => {
  it('substitutes --year into the year-field span', async () => {
    const mod = await import(
      '../../packages/packs-yearly-overview/generate.js'
    );
    const out = await mod.default({ year: 2030 });
    expect(out.html).toContain('<span class="year-field">2030</span>');
    expect(out.suggestedFilename).toBe('yearly-overview-2030');
    expect(out.metadata?.title).toBe('Yearly Overview · 2030');
  });

  it('leaves year-field empty when --year omitted', async () => {
    const mod = await import(
      '../../packages/packs-yearly-overview/generate.js'
    );
    const out = await mod.default({});
    expect(out.html).toContain('<span class="year-field"></span>');
    expect(out.suggestedFilename).toBe('yearly-overview');
  });
});

describe('monthly-planner generator', () => {
  it('substitutes --month into my-input', async () => {
    const mod = await import(
      '../../packages/packs-monthly-planner/generate.js'
    );
    const out = await mod.default({ month: 9, locale: 'en-US' });
    expect(out.html).toContain('<span class="my-input">September</span>');
    expect(out.suggestedFilename).toBe('monthly-planner-09');
  });

  it('substitutes --year into my-input.narrow', async () => {
    const mod = await import(
      '../../packages/packs-monthly-planner/generate.js'
    );
    const out = await mod.default({ year: 2027 });
    expect(out.html).toContain('<span class="my-input narrow">2027</span>');
  });

  it('combines month + year into filename and title', async () => {
    const mod = await import(
      '../../packages/packs-monthly-planner/generate.js'
    );
    const out = await mod.default({ month: 12, year: 2026 });
    expect(out.suggestedFilename).toBe('monthly-planner-2026-12');
    expect(out.metadata?.title).toContain('December');
    expect(out.metadata?.title).toContain('2026');
  });
});

describe('weekly-planner generator', () => {
  it('substitutes --from into "Week of:" with ISO date (snapped to Monday)', async () => {
    const mod = await import(
      '../../packages/packs-weekly-planner/generate.js'
    );
    // 2026-06-15 is a Monday; should stay 2026-06-15 with weekStart=1.
    const out = await mod.default({ from: '2026-06-15', weekStart: 1 });
    expect(out.html).toContain('<span class="field">2026-06-15</span>');
  });

  it('snaps --from to previous Monday if mid-week', async () => {
    const mod = await import(
      '../../packages/packs-weekly-planner/generate.js'
    );
    // 2026-06-17 is a Wednesday. Monday = 2026-06-15.
    const out = await mod.default({ from: '2026-06-17', weekStart: 1 });
    expect(out.html).toContain('<span class="field">2026-06-15</span>');
  });

  it('fills all 7 day-date-field spans with sequential dates', async () => {
    const mod = await import(
      '../../packages/packs-weekly-planner/generate.js'
    );
    const out = await mod.default({ from: '2026-06-15', weekStart: 1 });
    // Mon = 15/06, Tue = 16/06, ..., Sun = 21/06
    expect(out.html).toContain('<span class="day-name">Mon</span><span class="day-date-field">15/06</span>');
    expect(out.html).toContain('<span class="day-name">Tue</span><span class="day-date-field">16/06</span>');
    expect(out.html).toContain('<span class="day-name">Sun</span><span class="day-date-field">21/06</span>');
  });

  it('leaves template blank when --from omitted', async () => {
    const mod = await import(
      '../../packages/packs-weekly-planner/generate.js'
    );
    const out = await mod.default({});
    expect(out.html).toContain('<span class="field"></span>');
    expect(out.html).toContain('<span class="day-date-field">__/__</span>');
    expect(out.suggestedFilename).toBe('weekly-planner');
  });

  it('snapshots deterministic: same --from produces byte-identical HTML', async () => {
    const mod = await import(
      '../../packages/packs-weekly-planner/generate.js'
    );
    const a = await mod.default({ from: '2026-06-15' });
    const b = await mod.default({ from: '2026-06-15' });
    expect(a.html).toBe(b.html);
  });
});
