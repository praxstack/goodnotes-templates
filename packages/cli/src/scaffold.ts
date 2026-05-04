/**
 * Pure scaffold logic for `pretext init` and `pretext remix`.
 *
 * Per DECISIONS.md rows 32–33:
 *   - `init`   — inline-template pack scaffold (no `git clone` of monorepo).
 *   - `remix`  — prints commands, does NOT execute (reversibility first).
 *
 * These functions are *pure* (no fs, no process.*) so they unit-test in
 * milliseconds. The Commander action layer in `index.ts` wires them up to
 * real filesystem writes / stdout.
 */

export interface ScaffoldFile {
  /** Repo-relative path, forward slashes. */
  path: string;
  /** File contents as a UTF-8 string. */
  content: string;
}

export interface InitOptions {
  /** Human-readable title for the pack, e.g. "My Pack". */
  title: string;
}

export interface RemixInput {
  sourceId: string;
  targetId: string;
}

export interface RemixOutput {
  preamble: string;
  steps: string[];
}

// ────────────────────────────────────────────────────────────────
// Pack id validation — shell-safe, filesystem-safe, npm-safe.
// ────────────────────────────────────────────────────────────────

const PACK_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_PACK_ID_LEN = 64;

/**
 * Pack ids must be kebab-case ASCII with no shell metacharacters.
 *
 * This is the only user-controlled string that flows into the generated
 * shell commands in `buildRemixCommands`. We lock it down hard rather
 * than trying to quote-escape in N shells. Also keeps ids usable as
 * npm package names + URL segments.
 */
export function isValidPackId(id: string): boolean {
  if (typeof id !== 'string') return false;
  if (id.length === 0 || id.length > MAX_PACK_ID_LEN) return false;
  if (id === '.' || id === '..') return false;
  return PACK_ID_RE.test(id);
}

function assertValidPackId(id: string, label: string): void {
  if (!isValidPackId(id)) {
    throw new Error(
      `invalid pack id for ${label}: "${id}" — must be kebab-case ASCII ` +
        `(a-z, 0-9, hyphen), 1–${MAX_PACK_ID_LEN} chars, no dots or shell chars.`,
    );
  }
}

// ────────────────────────────────────────────────────────────────
// `pretext init` — build a minimal pack skeleton.
// ────────────────────────────────────────────────────────────────

/**
 * Return the file set for a new pack scaffold. The caller is responsible
 * for writing these to disk (keeps this function trivially testable).
 *
 * Inline templates intentionally tiny — contributors flesh them out. See
 * DECISIONS.md row 32 for why we don't clone the monorepo here.
 */
export function buildInitTemplate(id: string, opts: InitOptions): ScaffoldFile[] {
  assertValidPackId(id, 'init');
  const title = (opts.title ?? '').trim() || id;

  const dir = `packages/packs-${id}`;
  const htmlName = `${id}.html`;

  const manifest = {
    id,
    title,
    version: '0.1.0',
    description: `${title} — pretext-templates pack.`,
    files: [htmlName],
    themes: ['bold-tech'],
  };

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 48rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.55; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>Edit <code>${htmlName}</code> to build your pack.</p>
  </body>
</html>
`;

  const readme = `# ${title}

A pretext-templates pack.

- **id**: \`${id}\`
- **html**: \`${htmlName}\`

## Develop

\`\`\`bash
npm run dev
# open http://localhost:4321/packs/${id}
\`\`\`

## Publish

1. Bump \`version\` in \`manifest.json\` (semver).
2. Open a PR — the registry rebuilds on merge.
`;

  return [
    { path: `${dir}/manifest.json`, content: JSON.stringify(manifest, null, 2) + '\n' },
    { path: `${dir}/${htmlName}`, content: html },
    { path: `${dir}/README.md`, content: readme },
  ];
}

// ────────────────────────────────────────────────────────────────
// `pretext remix` — emit a printed, review-first command block.
// ────────────────────────────────────────────────────────────────

/**
 * Return the shell commands a user would run to fork an existing pack
 * and rebrand it. We do NOT execute anything here — the CLI prints
 * these, the user reads them, then copy-pastes what they trust.
 *
 * Mirrors the gallery `/remix` route so there is exactly one place
 * authoritative for the rebrand recipe.
 */
export function buildRemixCommands(input: RemixInput): RemixOutput {
  assertValidPackId(input.sourceId, 'remix source');
  assertValidPackId(input.targetId, 'remix target');
  if (input.sourceId === input.targetId) {
    throw new Error(
      `remix source and target cannot be the same pack id ("${input.sourceId}").`,
    );
  }

  const src = input.sourceId;
  const dst = input.targetId;

  const preamble =
    '# Review these commands, then copy-paste the ones you want to run.\n' +
    '# `pretext remix` is intentionally non-destructive: it prints, never executes.';

  const steps: string[] = [
    // 1. Clone + enter the repo.
    [
      '# 1. Clone the monorepo (skip if you already have a checkout)',
      'git clone https://github.com/praxstack/pretext-templates.git',
      'cd pretext-templates',
    ].join('\n'),

    // 2. Duplicate the source pack.
    [
      `# 2. Duplicate packages/packs-${src}/ → packages/packs-${dst}/`,
      `cp -R packages/packs-${src} packages/packs-${dst}`,
      `mv packages/packs-${dst}/${src}.html packages/packs-${dst}/${dst}.html 2>/dev/null || true`,
    ].join('\n'),

    // 3. Rebrand ids + file references with sed.
    [
      `# 3. Rewrite ids inside the copy (macOS BSD sed; drop the '' on Linux)`,
      `find packages/packs-${dst} -type f \\( -name '*.json' -o -name '*.html' -o -name '*.md' \\) \\\n` +
        `  -exec sed -i '' 's/${src}/${dst}/g' {} +`,
    ].join('\n'),

    // 4. Commit.
    [
      '# 4. Commit your new pack',
      `git checkout -b remix/${dst}`,
      'git add packages/packs-' + dst,
      `git commit -m "feat(packs): fork ${src} → ${dst}"`,
    ].join('\n'),
  ];

  return { preamble, steps };
}

// ────────────────────────────────────────────────────────────────
// tiny helpers (local, intentionally not exported)
// ────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
