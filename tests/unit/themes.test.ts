import { describe, it, expect } from 'vitest';
import { getTheme, getThemeIds, getAllThemes, loadCustomTheme, getRequiredFontFamilies } from '../../src/core/themes.js';

describe('Theme System', () => {
  it('has 8 built-in themes', () => {
    expect(getThemeIds()).toHaveLength(8);
  });

  it('returns all theme IDs', () => {
    const ids = getThemeIds();
    expect(ids).toContain('rose-quartz');
    expect(ids).toContain('midnight');
    expect(ids).toContain('corporate-blue');
    expect(ids).toContain('warm-neutral');
  });

  it('gets a theme by ID', () => {
    const theme = getTheme('midnight');
    expect(theme.id).toBe('midnight');
    expect(theme.name).toBe('Midnight');
    expect(theme.isDark).toBe(true);
  });

  it('throws for unknown theme ID', () => {
    expect(() => getTheme('nonexistent')).toThrow('not found');
  });

  it('every theme has required color fields', () => {
    for (const theme of getAllThemes()) {
      expect(theme.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.colors.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.colors.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.colors.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.colors.text).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(theme.colors.muted).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('every theme has font configurations', () => {
    for (const theme of getAllThemes()) {
      expect(theme.fonts.header.family).toBeTruthy();
      expect(theme.fonts.body.family).toBeTruthy();
      expect(theme.fonts.accent.family).toBeTruthy();
    }
  });

  it('exactly one dark theme exists', () => {
    const dark = getAllThemes().filter(t => t.isDark);
    expect(dark).toHaveLength(1);
    expect(dark[0].id).toBe('midnight');
  });

  it('lists required font families', () => {
    const families = getRequiredFontFamilies();
    expect(families.length).toBeGreaterThan(5);
    expect(families).toContain('Inter');
    expect(families).toContain('Poppins');
  });

  it('loads a valid custom theme', () => {
    const theme = loadCustomTheme({
      id: 'test-theme',
      name: 'Test Theme',
      colors: {
        primary: '#FF0000', secondary: '#00FF00', accent: '#0000FF',
        background: '#FFFFFF', text: '#000000', muted: '#888888',
      },
      fonts: {
        header: { family: 'Inter', weight: 700 },
        body: { family: 'Inter', weight: 400 },
        accent: { family: 'Inter', weight: 300 },
      },
    });
    expect(theme.id).toBe('test-theme');
    expect(theme.isDark).toBe(false);
  });

  it('rejects custom theme missing colors', () => {
    expect(() => loadCustomTheme({
      id: 'bad', name: 'Bad', colors: { primary: '#FF0000' }, fonts: {},
    } as any)).toThrow('missing required field');
  });

  it('rejects invalid hex color', () => {
    expect(() => loadCustomTheme({
      id: 'bad', name: 'Bad',
      colors: { primary: 'red', secondary: '#00FF00', accent: '#0000FF', background: '#FFFFFF', text: '#000000', muted: '#888888' },
      fonts: { header: { family: 'Inter', weight: 700 }, body: { family: 'Inter', weight: 400 }, accent: { family: 'Inter', weight: 300 } },
    })).toThrow('hex color');
  });
});
