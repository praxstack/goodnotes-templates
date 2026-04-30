/**
 * @pretext-templates/core — standalone HTML builder.
 *
 * Takes N pre-substituted HTML documents (one per rendered page) and
 * stitches them into one browser-openable, print-ready combined HTML.
 * Pure composition — no IO; callers hand in HTML strings and get a
 * string back. This keeps the builder reusable across three callsites
 * (eng-review Finding 1.3 → CLI build · gallery PDF · standalone export).
 *
 * ## History
 *
 * Extracted from `scripts/build-standalone-html.ts` in W2 T1. The script
 * is now a thin IO wrapper (read files → call `buildStandaloneHtml()` →
 * write output). Tests + the gallery/CLI will import this module
 * directly; script-only callers are unaffected.
 *
 * ## Why a new-module rather than inline
 *
 * Finding 1.3 of the eng-review: 1 real callsite today, 3 planned.
 * Extracting now (before the 2nd callsite lands) keeps the logic
 * discoverable and the test surface small. The alternative — waiting
 * until the gallery needs it in W9 — invites copy-paste. We pay the
 * extraction tax once, in W2, where slack is cheap.
 *
 * ## Contract
 *
 * Inputs:
 *   - `pages[]` — each page's pre-substituted HTML string + a short
 *     label (e.g. `'daily:today'`) that surfaces in the screen-only
 *     page counter chip and in thrown error messages.
 *   - `title`   — document title for the `<title>` + UI.
 *
 * Output:
 *   - One stitched HTML string with:
 *       · a single `<head>` carrying the union of unique `<style>`
 *         blocks extracted from the inputs (dedupe saves ~5 GB on
 *         a full 135-page month thanks to identical inlined @font-face)
 *       · the CSS harness (`.ledger-page` wrapper + print rules)
 *       · each page wrapped in `<section class="ledger-page">`
 *
 * Errors:
 *   - `StandaloneCompileError` at `stage: 'extract-styles' | 'extract-body' | 'stitch-pages'`
 *     on structural drift from the v5 baseline. IO-level errors
 *     (read-source / write-output) are the caller's job.
 */

import { StandaloneCompileError } from './errors.js';

// ─── Public types ────────────────────────────────────────────────────

/**
 * A single page ready for stitching. The `html` is the complete,
 * pre-substituted HTML document (with its own `<head>`, `<style>`,
 * `<body>`); the builder extracts the pieces it needs.
 */
export interface StandalonePageInput {
  /** Complete HTML document for one rendered page. */
  html: string;
  /** Short label for the page counter chip and error traces. */
  label: string;
  /**
   * Optional source path — surfaced in `StandaloneCompileError.details.htmlPath`
   * if extraction fails on this page. Not used for IO; pure diagnostic.
   */
  sourcePath?: string;
}

export interface BuildStandaloneHtmlOptions {
  /** Document title (shown in `<title>` + fallback for UI). */
  title: string;
  /** Pages to stitch, in render order. Empty array → throws. */
  pages: StandalonePageInput[];
}

// ─── HTML extraction helpers (pure) ─────────────────────────────────
//
// Each one returns the raw inner text of the matching tag or throws
// a StandaloneCompileError if the tag isn't where we expect it. The
// regexes are intentionally loose on whitespace but strict on tag
// name so we catch template drift early.

/**
 * Extract every `<style>…</style>` block from an HTML document. Returns
 * the inner CSS strings in order. Never throws — a page with zero
 * `<style>` blocks is valid (e.g. a quarterly review with no custom
 * per-page CSS). The stitcher will just contribute nothing to the
 * merged style set.
 */
function extractStyles(html: string): string[] {
  const out: string[] = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/giu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

/**
 * Extract the body inner HTML. Throws `StandaloneCompileError` when
 * `<body>` is missing or malformed — the stitcher cannot produce a
 * valid output without exactly one body per page.
 */
function extractBody(
  html: string,
  page: StandalonePageInput,
): string {
  const m = /<body\b[^>]*>([\s\S]*?)<\/body>/iu.exec(html);
  if (!m) {
    throw new StandaloneCompileError({
      stage: 'extract-body',
      htmlPath: page.sourcePath,
    });
  }
  return m[1];
}

/**
 * Extract the `class` attribute of `<body>`. Returns `''` when the
 * body has no class attribute (common for minimal templates) — not
 * an error, just nothing to propagate.
 */
function bodyClass(html: string): string {
  const m = /<body\b([^>]*)>/iu.exec(html);
  if (!m) return '';
  const cm = /class\s*=\s*"([^"]*)"/iu.exec(m[1]);
  return cm ? cm[1] : '';
}

// ─── CSS harness ────────────────────────────────────────────────────
//
// The harness wraps every source page in `<section class="ledger-page">`.
// Named `.ledger-page` (NOT `.page`) to avoid colliding with every v5
// template's own `.page { width: var(--page-w); height: var(--page-h); …}`
// rule — if we used `.page` here, the outer wrapper would inherit A4
// sizing from the templates' own CSS, and each month rendered as two
// stacked A4 cards with ~300px of phantom whitespace between them.
//
// The source templates' own inner `<div class="page">` still renders as
// the true A4 canvas inside our frame, so print stays pixel-identical
// to the PDF pipeline.
const HARNESS_CSS = `
  /* ╔══════════════════════════════════════════════════════════╗
     ║ Standalone combined view · standalone-builder.ts         ║
     ║ Wrapper = .ledger-page (NOT .page) to avoid collision   ║
     ║ with every template's own \`.page { width/height/bg }\`.  ║
     ║ Screen: each month renders framed A4 cards.              ║
     ║ Print : cards unframe, page breaks snap to A4.           ║
     ╚══════════════════════════════════════════════════════════╝ */
  html, body {
    margin: 0;
    padding: 0;
    background: #d7d6d2;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  section.ledger-page {
    display: block;
    width: 210mm;
    min-height: 297mm;
    margin: 32px auto;
    background: #fff;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.12),
      0 8px 24px rgba(0, 0, 0, 0.10),
      0 18px 48px rgba(0, 0, 0, 0.06);
    border-radius: 2px;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
    position: relative;
  }
  /* Page counter chip — bottom-right of each card (screen only) */
  section.ledger-page::after {
    content: attr(data-label);
    position: absolute;
    bottom: 8px;
    right: 12px;
    font: 10px/1 ui-monospace, Menlo, monospace;
    color: rgba(0, 0, 0, 0.28);
    letter-spacing: 0.04em;
    pointer-events: none;
    z-index: 10;
  }
  section.ledger-page:last-child { break-after: auto; page-break-after: auto; }
  /* The source template's inner \`.page\` div already sizes itself to
   * A4 via --page-w / --page-h. Null the extra auto margin it adds so
   * the card doesn't inherit 10mm of padding twice. */
  section.ledger-page > .page { margin: 0 auto; }
  @media print {
    html, body { background: #fff; }
    section.ledger-page {
      margin: 0;
      box-shadow: none;
      border-radius: 0;
      min-height: auto;
    }
    section.ledger-page::after { display: none; }
  }
  @page { size: A4 portrait; margin: 0; }
`.trim();

/**
 * HTML-attribute escape. Handles the four reserved characters that can
 * break an attribute value or leak markup: `&`, `<`, `>`, `"`.
 *
 * `&` MUST be escaped first so the later replacements don't double-encode
 * entities we just introduced. `'` is not escaped because every caller
 * here wraps values in double quotes (see `data-label="${…}"`).
 *
 * Hardened per code-review P2-5: originally only escaped `"` and `<` on
 * the assumption that labels were internally-generated. W4-6 pack
 * migration introduces user-authored titles that can contain `&`, and
 * we don't want to re-audit then.
 */
function escapeAttr(s: string): string {
  return s
    .replace(/&/gu, '&amp;')
    .replace(/"/gu, '&quot;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;');
}

// ─── Main ────────────────────────────────────────────────────────────

/**
 * Stitch pre-substituted page HTML into a single standalone document.
 * Pure — no IO. See module docstring for the full contract.
 */
export function buildStandaloneHtml(opts: BuildStandaloneHtmlOptions): string {
  const { title, pages } = opts;

  if (pages.length === 0) {
    throw new StandaloneCompileError({ stage: 'stitch-pages' });
  }

  // ── Walk + collect unique styles + page bodies ─────────────────────
  const uniqueStyles = new Set<string>();
  const sections: string[] = [];

  for (const page of pages) {
    for (const s of extractStyles(page.html)) uniqueStyles.add(s);
    const body = extractBody(page.html, page);
    const klass = bodyClass(page.html);
    const klassAttr = klass ? ` data-body-class="${escapeAttr(klass)}"` : '';
    sections.push(
      `<section class="ledger-page" data-label="${escapeAttr(page.label)}"${klassAttr}>\n` +
        `${body}\n` +
        `</section>`,
    );
  }

  // ── Stitch into a single doc ───────────────────────────────────────
  const combinedStyles = Array.from(uniqueStyles).join('\n\n/* ─── */\n\n');
  const stitched = sections.join('\n\n');
  const titleEscaped = escapeAttr(title);

  return (
    `<!DOCTYPE html>\n` +
    `<html lang="en">\n` +
    `<head>\n` +
    `<meta charset="UTF-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
    `<title>${titleEscaped}</title>\n` +
    `<style>\n${combinedStyles}\n</style>\n` +
    `<style>\n${HARNESS_CSS}\n</style>\n` +
    `</head>\n` +
    `<body>\n${stitched}\n</body>\n` +
    `</html>\n`
  );
}
