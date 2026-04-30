/**
 * @pretext-templates/core — typed error hierarchy.
 *
 * Five error classes that cover every failure mode the renderer + registry
 * pipeline can surface to callers. Each one:
 *
 *   1. Extends `Error` so `instanceof Error` stays true (DevTools, Node
 *      stack traces, test frameworks all depend on this).
 *   2. Sets a stable `code` string that CLIs and error-handling UIs can
 *      switch on without string-matching the message.
 *   3. Writes a 3-tier "Hall of Fame" message:
 *         — what went wrong (one line)
 *         — why it matters / what this blocks
 *         — how to fix it (concrete next step, or a link to docs)
 *      This pattern mirrors `ProfileParseError` in `./types/profile.ts`
 *      which set the precedent in W0.
 *   4. Carries a `cause` (the original error, if any) so diagnostics
 *      flow up without hiding the root fault.
 *
 * Eng-review ref: `./praxlannister-main-eng-review-20260430-1935.md`
 * Finding 2.4 (class hierarchy) · Section 9 failure modes F2/F6/F8/F10.
 *
 * ## Adding a new error class
 *
 * 1. Extend `PretextError` (never `Error` directly) so the shared
 *    `code` + `cause` plumbing stays uniform.
 * 2. Pick a kebab-case `code` prefixed with the subsystem
 *    (e.g. `registry-fetch-timeout`, not `TIMEOUT`). Easy to grep.
 * 3. Compose the message via `composeMessage()` so the 3-tier shape
 *    is enforced.
 * 4. Add a vitest case to `tests/unit/errors.test.ts` that asserts
 *    the `code`, message tiers, and `cause` propagation.
 */

// ─── Base class ─────────────────────────────────────────────────────

/**
 * Composes the 3-tier message into one readable block.
 * Pure, no IO — safe to call from any error constructor.
 */
function composeMessage(tiers: {
  what: string;
  why: string;
  how: string;
}): string {
  return `${tiers.what}\n  why: ${tiers.why}\n  fix: ${tiers.how}`;
}

/**
 * Base class. Never thrown directly — subclasses tag a specific failure
 * mode. Callers catch `PretextError` if they want to handle any of our
 * errors uniformly (e.g. to render a friendly CLI banner).
 *
 * Uses the ES2022 native `ErrorOptions.cause` (Node 18+ per
 * package.json engines), so `err.cause` is the same field DevTools,
 * Node stack traces, and modern frameworks look for — no custom
 * plumbing on top of the platform.
 */
export abstract class PretextError extends Error {
  /** Stable machine-readable code. Never renamed once shipped. */
  abstract readonly code: string;

  constructor(message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = new.target.name;
    // Keep a clean stack trace in v8 engines (Node, Chromium, Bun).
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
  }
}

// ─── 1 · Registry fetch ─────────────────────────────────────────────

/**
 * Thrown when a call to the registry (`pretext-templates.dev/registry.json`
 * or the `raw.githubusercontent.com` fallback) fails. Finding 1.2 of the
 * eng-review specifies both endpoints + 5-minute cache. This error fires
 * when BOTH endpoints fail after retry exhaustion — single-endpoint
 * failures are transparently retried upstream and never reach the caller.
 *
 * @example
 *   throw new RegistryFetchError({
 *     primaryUrl: 'https://pretext-templates.dev/registry.json',
 *     fallbackUrl: 'https://raw.githubusercontent.com/praxstack/pretext-templates/main/registry.json',
 *     status: 503,
 *   });
 */
export class RegistryFetchError extends PretextError {
  readonly code = 'registry-fetch-failed';

  constructor(
    public readonly details: {
      primaryUrl: string;
      fallbackUrl: string;
      /** HTTP status of the LAST failed attempt (0 = network error / DNS / timeout). */
      status: number;
    },
    cause?: unknown,
  ) {
    const { primaryUrl, fallbackUrl, status } = details;
    const msg = composeMessage({
      what: `Registry fetch failed (both primary and fallback unreachable; last status ${status}).`,
      why:  `Nothing can list, add, or upgrade packs until the registry responds.`,
      how:  `Retry in a minute. If primary <${primaryUrl}> stays 5xx, the fallback <${fallbackUrl}> usually recovers in seconds. Check https://github.com/praxstack/pretext-templates/issues for an ongoing incident.`,
    });
    super(msg, cause);
  }
}

// ─── 2 · Pack not found ─────────────────────────────────────────────

/**
 * Thrown when the CLI or a consumer asks for a pack id that the registry
 * doesn't know about. Includes a `suggestions` array built by a simple
 * edit-distance match so users catch typos immediately.
 *
 * @example
 *   throw new PackNotFoundError({
 *     requested: 'prax-jornal',         // typo
 *     suggestions: ['prax-journal'],
 *     knownCount: 14,
 *   });
 */
export class PackNotFoundError extends PretextError {
  readonly code = 'pack-not-found';

  constructor(
    public readonly details: {
      requested: string;
      /** Up to 3 closest known ids (by Levenshtein), ordered best-match first. */
      suggestions: string[];
      /** Total packs known to the registry, for context in the error. */
      knownCount: number;
    },
  ) {
    const { requested, suggestions, knownCount } = details;
    const suggest =
      suggestions.length > 0
        ? ` Did you mean ${suggestions.map((s) => `'${s}'`).join(' or ')}?`
        : '';
    const msg = composeMessage({
      what: `Pack '${requested}' is not in the registry.${suggest}`,
      why:  `The CLI and gallery only render packs the registry knows about (currently ${knownCount} packs).`,
      how:  `Run \`pretext-templates list\` to see every pack id. If you authored this pack locally, make sure \`packages/packs-${requested}/manifest.json\` exists and re-run \`npm run generate:registry\`.`,
    });
    super(msg);
  }
}

// ─── 3 · Renderer crash ─────────────────────────────────────────────

/**
 * Thrown when Puppeteer crashes mid-render (browser process died, page
 * closed unexpectedly, memory kill). C7b.3 auto-restart already catches
 * the "scheduled restart" case silently — this error is only for
 * unexpected crashes that survive the restart contract.
 *
 * Carries the page spec so the caller can retry just the failing page
 * instead of re-running the whole month.
 *
 * @example
 *   throw new RendererCrashError({
 *     pageIndex: 47,
 *     pageLabel: 'daily:today',
 *     browserState: 'disconnected',
 *   }, originalError);
 */
export class RendererCrashError extends PretextError {
  readonly code = 'renderer-crashed';

  constructor(
    public readonly details: {
      /** Index into the sequence passed to `renderPageSpec()`. */
      pageIndex: number;
      /** Human-readable label, e.g. 'daily:today', 'weekly:weekly'. */
      pageLabel: string;
      /** Browser state at the moment of the crash (for diagnostics). */
      browserState: 'disconnected' | 'crashed' | 'memory-kill' | 'unknown';
    },
    cause?: unknown,
  ) {
    const { pageIndex, pageLabel, browserState } = details;
    const msg = composeMessage({
      what: `Renderer crashed on page ${pageIndex} (${pageLabel}); browser state: ${browserState}.`,
      why:  `The remaining pages in this run didn't render and the output PDF is incomplete.`,
      how:  `Re-run with \`PRAX_BROWSER_RESTART_EVERY=25\` to restart more often (default 50). If the crash is reproducible on one page, isolate it: \`npx tsx scripts/generate-journal.ts --from <that-date> --to <that-date>\`.`,
    });
    super(msg, cause);
  }
}

// ─── 4 · Standalone-HTML compile ────────────────────────────────────

/**
 * Thrown when `buildStandaloneHtml()` can't stitch the v5 source pages
 * into a single HTML — usually because a per-page `<style>` block can't
 * be extracted or a `<body>` tag is malformed in a source template.
 *
 * The extraction logic lives in `scripts/build-standalone-html.ts` today;
 * W2 T1 extracts it to `packages/core/src/standalone-builder.ts` and
 * that module throws this error instead of a plain `Error`.
 *
 * @example
 *   throw new StandaloneCompileError({
 *     stage: 'extract-body',
 *     htmlPath: '/abs/path/today.html',
 *   });
 */
export class StandaloneCompileError extends PretextError {
  readonly code = 'standalone-compile-failed';

  constructor(
    public readonly details: {
      /** Which sub-step failed — keeps the fix advice specific. */
      stage:
        | 'read-source'
        | 'extract-styles'
        | 'extract-body'
        | 'stitch-pages'
        | 'write-output';
      /** The source HTML file being processed (if applicable). */
      htmlPath?: string;
      /** The output path being written (if applicable). */
      outPath?: string;
    },
    cause?: unknown,
  ) {
    const { stage, htmlPath, outPath } = details;
    const target = htmlPath ?? outPath ?? '(unknown)';
    const msg = composeMessage({
      what: `Standalone HTML build failed at stage '${stage}' on ${target}.`,
      why:  `The output HTML won't open correctly in a browser; the PDF pipeline is unaffected.`,
      how:  stage === 'extract-body' || stage === 'extract-styles'
        ? `Open the source file and check that <style> and <body> tags are well-formed. The v5 templates are hand-maintained HTML; a malformed tag here means the source broke.`
        : stage === 'read-source'
        ? `Verify the file exists and is readable. If this is a pack you just added, re-run \`scripts/inline-v5-fonts.ts\` to regenerate the inlined CSS.`
        : stage === 'write-output'
        ? `Check that the output directory exists and is writable. The script tries to \`mkdir -p\` it, so this usually means a permissions issue.`
        : `Check the source templates for structural drift vs the v5 baseline (headless extraction relies on \`<!doctype>\` + one \`<head>\` + one \`<body>\` per file).`,
    });
    super(msg, cause);
  }
}

// ─── 5 · Registry manifest parse ────────────────────────────────────

/**
 * Thrown when a pack's `manifest.json` fails Zod validation during
 * `scripts/generate-registry.ts` (W2 T3) or when the registry served
 * over the wire fails schema validation on the client.
 *
 * Wraps a ZodError so callers can present the full diagnostic list
 * via the same flattening used by `parseProfile()`.
 *
 * @example
 *   throw new RegistryParseError({
 *     source: 'packages/packs-prax-journal/manifest.json',
 *     issues: zodErr.issues,
 *   }, zodErr);
 */
export class RegistryParseError extends PretextError {
  readonly code = 'registry-parse-failed';

  constructor(
    public readonly details: {
      /** What was being parsed — a file path or URL. */
      source: string;
      /**
       * Issues as emitted by `ZodError.issues` — path + message +
       * expected + received per failure. Left typed as `unknown[]`
       * to avoid hard-coupling this module to a Zod version.
       */
      issues: ReadonlyArray<{
        path: ReadonlyArray<string | number>;
        message: string;
      }>;
    },
    cause?: unknown,
  ) {
    const { source, issues } = details;
    const firstThree = issues.slice(0, 3).map((i) => {
      const p = i.path.length ? i.path.join('.') : '(root)';
      return `      at ${p}: ${i.message}`;
    });
    const more = issues.length > 3 ? `\n      …and ${issues.length - 3} more` : '';
    const msg = composeMessage({
      what: `Registry manifest at ${source} failed schema validation (${issues.length} issue${issues.length === 1 ? '' : 's'}).`,
      why:  `A pack with an invalid manifest can't be listed, installed, or remixed safely.`,
      how:  `Fix the issues below, then re-run the consumer (\`npm run generate:registry\` for local authors, \`pretext-templates upgrade\` for end-users).\n${firstThree.join('\n')}${more}`,
    });
    super(msg, cause);
  }
}

// ─── Type-narrowing helpers ─────────────────────────────────────────

/**
 * Tagged union of every error class in this module. Handy for switch()
 * in error-presentation code (CLI banners, gallery error boundaries).
 *
 * ```ts
 * function present(err: PretextError): string {
 *   switch (err.code) {
 *     case 'registry-fetch-failed':   return '…';
 *     case 'pack-not-found':          return '…';
 *     case 'renderer-crashed':        return '…';
 *     case 'standalone-compile-failed': return '…';
 *     case 'registry-parse-failed':   return '…';
 *   }
 * }
 * ```
 */
export type AnyPretextError =
  | RegistryFetchError
  | PackNotFoundError
  | RendererCrashError
  | StandaloneCompileError
  | RegistryParseError;

/**
 * Type guard — narrows an `unknown` catch binding to our error shape
 * so callers get `err.code` autocompletion without casting.
 */
export function isPretextError(err: unknown): err is AnyPretextError {
  return err instanceof PretextError;
}
