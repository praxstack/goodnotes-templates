/**
 * Shared helpers for per-pack generators (CEO v5 Phase 1).
 *
 * Keeps the per-pack generator files tiny and consistent — any escape-HTML,
 * month-name, or week-of-date logic lives here so a bug-fix in one generator
 * doesn't need to be mirrored into the others.
 *
 * Loaded by `packages/packs-<id>/generate.ts` files; not exported from the
 * public `@praxlannister/pretext-core` surface because these are generator
 * internals, not public API.
 */

/**
 * Escape HTML-sensitive characters in user input to prevent injection.
 * The generators substitute user strings into innerText positions, so we
 * need at minimum & < > escape. Quotes aren't needed because we don't
 * write user input into attribute values.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * Return the localised month name for the given month (1-12). Falls back to
 * en-US on any Intl failure (e.g., unknown locale) so the pack always
 * renders something plausible.
 */
export function monthName(month: number, locale: string = 'en-US'): string {
  if (month < 1 || month > 12) return '';
  if (locale.startsWith('en')) {
    return MONTH_NAMES_EN[month - 1];
  }
  try {
    return new Intl.DateTimeFormat(locale, { month: 'long' }).format(
      new Date(2000, month - 1, 1),
    );
  } catch {
    return MONTH_NAMES_EN[month - 1];
  }
}

/**
 * Short day-of-month string for the weekly planner day-date-field spots
 * (e.g., "01/06" for June 1). Returns "__/__" if date is invalid, matching
 * the template's printed-blank default.
 */
export function shortDayDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return '__/__';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/**
 * Replace a single DOM pattern with another. Uses regex anchored on enough
 * surrounding text to survive incidental CSS class changes without being
 * so narrow that a typo in the template breaks the substitution.
 *
 * If the pattern is not found, returns input unchanged — never throws.
 * The generator contract is "fill what you can, leave blanks where you
 * cannot" so missing fields degrade gracefully.
 */
export function replaceOnce(
  html: string,
  pattern: RegExp,
  replacement: string,
): string {
  return html.replace(pattern, replacement);
}

/**
 * Format a Date as ISO YYYY-MM-DD.
 */
export function isoDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
