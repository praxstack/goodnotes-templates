/**
 * Pure helpers for scripts/bundle-release.ts (GNT-025).
 * The release bundle is deleted and recreated, so the target directory must be
 * proven to live strictly inside <repo>/output/ before anything is removed.
 */
import path from 'node:path';

/** "May 2026" — a month name plus a four-digit year, nothing else. */
const MONTH_RE = /^[A-Za-z]{3,9} \d{4}$/;

export function validateMonth(month: string): string {
  if (!MONTH_RE.test(month)) {
    throw new Error(`invalid --month ${JSON.stringify(month)}; expected "<Month YYYY>" e.g. "May 2026"`);
  }
  return month;
}

export function resolveBundleDir(repo: string, month: string): { name: string; dir: string } {
  validateMonth(month);
  const name = `The Praxis Ledger — ${month}`;
  const outRoot = path.resolve(repo, 'output');
  const dir = path.resolve(outRoot, name);
  const rel = path.relative(outRoot, dir);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel) || rel.includes(path.sep)) {
    throw new Error(`refusing bundle dir outside ${outRoot}: ${dir}`);
  }
  return { name, dir };
}
