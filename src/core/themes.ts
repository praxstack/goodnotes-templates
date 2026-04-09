/**
 * Theme system — 8 built-in color palettes with font configurations.
 *
 * Each theme defines colors, fonts, and visual properties that flow
 * through every template and sticker in the system.
 *
 * @see RESEARCH.md §7 — Color Palette Research
 */

import type { Theme, ColorPalette, ThemeFonts, FontConfig } from '../types/index.js';

// ─── Font Configs (Google Fonts) ────────────────────────────────

const FONT_INTER: FontConfig = { family: 'Inter', weight: 400 };
const FONT_INTER_LIGHT: FontConfig = { family: 'Inter', weight: 300 };
const FONT_INTER_BOLD: FontConfig = { family: 'Inter', weight: 700 };
const FONT_POPPINS: FontConfig = { family: 'Poppins', weight: 600 };
const FONT_MONTSERRAT: FontConfig = { family: 'Montserrat', weight: 600 };
const FONT_MONTSERRAT_MED: FontConfig = { family: 'Montserrat', weight: 500 };
const FONT_NUNITO: FontConfig = { family: 'Nunito', weight: 400 };
const FONT_QUICKSAND: FontConfig = { family: 'Quicksand', weight: 400 };
const FONT_DM_SANS: FontConfig = { family: 'DM Sans', weight: 400 };
const FONT_DM_SANS_BOLD: FontConfig = { family: 'DM Sans', weight: 700 };
const FONT_PLAYFAIR: FontConfig = { family: 'Playfair Display', weight: 700 };
const FONT_CORMORANT: FontConfig = { family: 'Cormorant Garamond', weight: 600 };
const FONT_CAVEAT: FontConfig = { family: 'Caveat', weight: 400 };
const FONT_DANCING: FontConfig = { family: 'Dancing Script', weight: 400 };
const FONT_LORA: FontConfig = { family: 'Lora', weight: 400 };
const FONT_KALAM: FontConfig = { family: 'Kalam', weight: 400 };

// ─── Built-in Themes ────────────────────────────────────────────

export const THEMES: Record<string, Theme> = {
  'rose-quartz': {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    description: 'Soft pastel pink with dusty rose accents — feminine, warm, elegant',
    isDark: false,
    borderRadius: 8,
    lineColor: '#E8C4D0',
    lineWeight: 0.5,
    colors: {
      primary: '#F4B4C5',
      secondary: '#F8D7E3',
      accent: '#E8879B',
      background: '#FFF5F7',
      text: '#5C3D4E',
      muted: '#D4A5B5',
    },
    fonts: {
      header: FONT_PLAYFAIR,
      body: FONT_NUNITO,
      accent: FONT_CAVEAT,
    },
  },

  'sage-garden': {
    id: 'sage-garden',
    name: 'Sage Garden',
    description: 'Botanical green cottagecore — earthy, natural, peaceful',
    isDark: false,
    borderRadius: 6,
    lineColor: '#B8D4B0',
    lineWeight: 0.5,
    colors: {
      primary: '#A8C5A0',
      secondary: '#D4E4CF',
      accent: '#6B8F63',
      background: '#F5F8F4',
      text: '#3D5438',
      muted: '#C8D8C4',
    },
    fonts: {
      header: FONT_CORMORANT,
      body: FONT_QUICKSAND,
      accent: FONT_DANCING,
    },
  },

  'lavender-dreams': {
    id: 'lavender-dreams',
    name: 'Lavender Dreams',
    description: 'Gentle purple pastel — dreamy, creative, calming',
    isDark: false,
    borderRadius: 10,
    lineColor: '#C8BDD8',
    lineWeight: 0.5,
    colors: {
      primary: '#B8A9D4',
      secondary: '#DDD4EC',
      accent: '#8B76B5',
      background: '#F7F4FB',
      text: '#4A3D6B',
      muted: '#C5BAD9',
    },
    fonts: {
      header: FONT_POPPINS,
      body: FONT_NUNITO,
      accent: FONT_CAVEAT,
    },
  },

  'ocean-breeze': {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Sky blue calm — fresh, professional, trustworthy',
    isDark: false,
    borderRadius: 6,
    lineColor: '#A8C8D8',
    lineWeight: 0.5,
    colors: {
      primary: '#89B4D4',
      secondary: '#C5DBE8',
      accent: '#4A89AC',
      background: '#F2F7FA',
      text: '#2C4A5C',
      muted: '#A8C8D8',
    },
    fonts: {
      header: FONT_MONTSERRAT,
      body: FONT_INTER,
      accent: { ...FONT_INTER, style: 'italic' as const, weight: 300 },
    },
  },

  'warm-neutral': {
    id: 'warm-neutral',
    name: 'Warm Neutral',
    description: 'Minimalist beige and brown — clean, sophisticated, timeless',
    isDark: false,
    borderRadius: 4,
    lineColor: '#D5C9B8',
    lineWeight: 0.5,
    colors: {
      primary: '#C4A882',
      secondary: '#E8DDD0',
      accent: '#9B7E5E',
      background: '#FAF7F4',
      text: '#3D3229',
      muted: '#D5C9B8',
    },
    fonts: {
      header: FONT_MONTSERRAT,
      body: FONT_INTER,
      accent: FONT_LORA,
    },
  },

  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark mode with steel blue accents — modern, easy on the eyes',
    isDark: true,
    borderRadius: 8,
    lineColor: '#3A4A5C',
    lineWeight: 0.5,
    colors: {
      primary: '#6C8EBF',
      secondary: '#3A4A5C',
      accent: '#8AB4E8',
      background: '#1E2228',
      text: '#E8ECF0',
      muted: '#4A5568',
      surface: '#2D3340',
    },
    fonts: {
      header: FONT_MONTSERRAT_MED,
      body: FONT_INTER_LIGHT,
      accent: { ...FONT_INTER, style: 'italic' as const, weight: 400 },
    },
  },

  'sunset-coral': {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    description: 'Warm aesthetic with terracotta — energetic, creative, bold',
    isDark: false,
    borderRadius: 8,
    lineColor: '#E0B8A8',
    lineWeight: 0.5,
    colors: {
      primary: '#E8937A',
      secondary: '#F5C4B8',
      accent: '#D4654A',
      background: '#FFF8F5',
      text: '#5C3228',
      muted: '#E0B8A8',
    },
    fonts: {
      header: FONT_POPPINS,
      body: FONT_DM_SANS,
      accent: FONT_KALAM,
    },
  },

  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional clean blue — business, structured, trustworthy',
    isDark: false,
    borderRadius: 4,
    lineColor: '#CBD5E1',
    lineWeight: 0.5,
    colors: {
      primary: '#2563EB',
      secondary: '#DBEAFE',
      accent: '#1D4ED8',
      background: '#FFFFFF',
      text: '#1E293B',
      muted: '#94A3B8',
    },
    fonts: {
      header: FONT_DM_SANS_BOLD,
      body: FONT_DM_SANS,
      accent: { ...FONT_DM_SANS, style: 'italic' as const, weight: 500 },
    },
  },
};

// ─── Theme Helpers ──────────────────────────────────────────────

/**
 * Get a theme by ID. Throws if not found.
 */
export function getTheme(id: string): Theme {
  const theme = THEMES[id];
  if (!theme) {
    const available = Object.keys(THEMES).join(', ');
    throw new Error(`Theme "${id}" not found. Available: ${available}`);
  }
  return theme;
}

/**
 * Get all built-in theme IDs.
 */
export function getThemeIds(): string[] {
  return Object.keys(THEMES);
}

/**
 * Get all built-in themes.
 */
export function getAllThemes(): Theme[] {
  return Object.values(THEMES);
}

/**
 * Load a custom theme from a JSON object. Validates required fields.
 */
export function loadCustomTheme(json: Record<string, unknown>): Theme {
  const required = ['id', 'name', 'colors', 'fonts'] as const;
  for (const field of required) {
    if (!(field in json)) {
      throw new Error(`Custom theme missing required field: "${field}"`);
    }
  }

  const colors = json.colors as Record<string, unknown>;
  const colorFields = ['primary', 'secondary', 'accent', 'background', 'text', 'muted'];
  for (const field of colorFields) {
    if (!(field in colors)) {
      throw new Error(`Custom theme colors missing required field: "${field}"`);
    }
    if (typeof colors[field] !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(colors[field] as string)) {
      throw new Error(`Custom theme colors.${field} must be a hex color (e.g., #FF0000)`);
    }
  }

  const fonts = json.fonts as Record<string, unknown>;
  const fontFields = ['header', 'body', 'accent'];
  for (const field of fontFields) {
    if (!(field in fonts)) {
      throw new Error(`Custom theme fonts missing required field: "${field}"`);
    }
    const font = fonts[field] as Record<string, unknown>;
    if (!font.family || typeof font.family !== 'string') {
      throw new Error(`Custom theme fonts.${field}.family must be a string`);
    }
    if (!font.weight || typeof font.weight !== 'number') {
      throw new Error(`Custom theme fonts.${field}.weight must be a number`);
    }
  }

  return {
    id: json.id as string,
    name: json.name as string,
    description: (json.description as string) || 'Custom theme',
    isDark: (json.isDark as boolean) || false,
    borderRadius: (json.borderRadius as number) || 6,
    lineColor: (json.lineColor as string) || (colors.muted as string),
    lineWeight: (json.lineWeight as number) || 0.5,
    colors: colors as unknown as ColorPalette,
    fonts: fonts as unknown as ThemeFonts,
  };
}

/**
 * Load a custom theme from a JSON file path.
 */
export async function loadCustomThemeFromFile(filePath: string): Promise<Theme> {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in theme file "${filePath}": ${(content.slice(0, 100))}...`);
  }

  return loadCustomTheme(json);
}

/**
 * Get all Google Font family names used across all built-in themes.
 * Useful for the font download script.
 */
export function getRequiredFontFamilies(): string[] {
  const families = new Set<string>();
  for (const theme of Object.values(THEMES)) {
    families.add(theme.fonts.header.family);
    families.add(theme.fonts.body.family);
    families.add(theme.fonts.accent.family);
    if (theme.fonts.caption) families.add(theme.fonts.caption.family);
    if (theme.fonts.mono) families.add(theme.fonts.mono.family);
  }
  return [...families].sort();
}
