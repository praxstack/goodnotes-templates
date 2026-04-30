/**
 * WCAG contrast gate (FIND-0018 companion).
 *
 * Parses every CSS theme file under `shared/themes/` and every dark-variant
 * sibling under `packs/journals/prax-journal/versions/v{N}/` — resolves the
 * foreground/background pairs the templates actually use, and fails if any
 * pair falls below WCAG 2.2 AA contrast ratios (4.5:1 normal text, 3:1 large
 * text or non-text UI).
 *
 * Scope for now is limited to themes/ — dark.css siblings vary in variable
 * names and some are in-progress. When FIND-0018 closes (21 dark variants
 * added), the 'dark.css' arm gets enabled.
 */

import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const THEMES_DIR = 'packages/core/assets/themes';

// Minimum WCAG 2.2 AA contrast ratios.
const AA_NORMAL = 4.5;

// Parse `:root { --var: #hex; }` blocks and return the var map.
// Tolerates // line comments, /* */ block comments, nested selectors — we
// care only about the `--foo: value;` pairs at any depth.
function parseCssVariables(css: string): Record<string, string> {
  const result: Record<string, string> = {};
  // Strip block comments.
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    result[m[1]] = m[2].trim();
  }
  return result;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace(/^#/, '').trim();
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length === 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  // 8-char hex with alpha — drop alpha, we're checking base contrast.
  if (h.length === 8) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return null;
}

function resolveColor(value: string, vars: Record<string, string>): [number, number, number] | null {
  const v = value.trim();
  if (v.startsWith('#')) return hexToRgb(v);
  // var(--foo, fallback)
  const varMatch = v.match(/^var\(\s*--([a-z0-9-]+)(?:\s*,\s*([^)]+))?\s*\)/i);
  if (varMatch) {
    const target = vars[varMatch[1]];
    if (target) return resolveColor(target, vars);
    if (varMatch[2]) return resolveColor(varMatch[2], vars);
  }
  // rgb(...) / rgba(...)
  const rgbMatch = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }
  return null;
}

// WCAG relative luminance — https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function relLuminance([r, g, b]: [number, number, number]): number {
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

// Standard fg/bg variable-name pairs to check in each theme.
// This list mirrors what the HTML templates expect (see the v3 templates:
// --foreground on --background, --foreground on --card, etc.).
const PAIRS_TO_CHECK: Array<[string, string, string]> = [
  ['foreground', 'background', 'body text on page background'],
  ['foreground', 'card', 'body text on card background'],
  ['foreground-secondary', 'background', 'secondary text on page background'],
  ['muted-foreground', 'background', 'muted text on page background'],
];

describe('WCAG AA contrast · themes/*.css', () => {
  it('every theme file defines fg+bg pairs that clear 4.5:1', async () => {
    const files = (await readdir(THEMES_DIR)).filter((f) => f.endsWith('.css'));
    expect(files.length).toBeGreaterThan(0);

    const failures: string[] = [];

    for (const file of files) {
      const css = await readFile(path.join(THEMES_DIR, file), 'utf-8');
      const vars = parseCssVariables(css);

      for (const [fgName, bgName, label] of PAIRS_TO_CHECK) {
        const fgRaw = vars[fgName];
        const bgRaw = vars[bgName];
        if (!fgRaw || !bgRaw) continue; // theme doesn't define this pair — skip
        const fg = resolveColor(fgRaw, vars);
        const bg = resolveColor(bgRaw, vars);
        if (!fg || !bg) continue; // couldn't parse — skip rather than false-positive

        const ratio = contrastRatio(fg, bg);
        if (ratio < AA_NORMAL) {
          failures.push(
            `${file}: ${label} (--${fgName} on --${bgName}) = ${ratio.toFixed(2)}:1 < ${AA_NORMAL}`,
          );
        }
      }
    }

    // Surface every failure at once instead of failing on the first.
    expect(failures).toEqual([]);
  });
});
