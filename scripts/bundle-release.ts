#!/usr/bin/env -S npx tsx
/**
 * Bundle a self-contained release folder for a given month's Praxis Ledger.
 *
 * Output tree
 * ───────────
 *   output/The Praxis Ledger — <Month YYYY>/
 *   ├── README.md
 *   ├── The Praxis Ledger — <Month YYYY>.pdf
 *   ├── The Praxis Ledger — <Month YYYY>.html            (optional; skipped if absent)
 *   ├── assets/                                          (copy of fonts + css + inline assets)
 *   └── sticker-pack/
 *       ├── README.md
 *       ├── pngs/
 *       │   ├── all/               (60 PNGs, mixed dims)
 *       │   ├── compact-400x600/   (34 PNGs)
 *       │   ├── standard-600x600/  (18 PNGs)
 *       │   └── expanded-800x600/  ( 8 PNGs)
 *       └── svgs/                  (60 flat SVGs)
 *
 * Everything is a **real copy** — no symlinks — so the folder zips, AirDrops,
 * and drags into GoodNotes as a self-contained bundle. Lives under output/
 * which is gitignored, so no repo bloat.
 *
 * Usage
 * ─────
 *   npx tsx scripts/bundle-release.ts \
 *     --pdf output/journal-may-2026.pdf \
 *     --month "May 2026"
 *
 *   # optional flags:
 *   #   --html <path>        path to a standalone HTML export to include
 *   #   --remove-source      rm the source PDF/HTML after moving
 *   #   --dry-run            print the plan, write nothing
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  copyFileSync,
  writeFileSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');

// ─── args ───────────────────────────────────────────────────────

interface Args {
  pdf: string;
  html: string | null;
  month: string;
  removeSource: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = { html: null, removeSource: false, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--pdf') args.pdf = argv[++i];
    else if (a === '--html') args.html = argv[++i];
    else if (a === '--month') args.month = argv[++i];
    else if (a === '--remove-source') args.removeSource = true;
    else if (a === '--dry-run') args.dryRun = true;
  }
  if (!args.pdf || !args.month) {
    console.error('usage: bundle-release.ts --pdf <path> --month "<Month YYYY>" [--html <path>] [--remove-source] [--dry-run]');
    process.exit(2);
  }
  return args as Args;
}

// ─── paths ──────────────────────────────────────────────────────

const STICKERS = path.join(REPO, 'packs/journals/prax-journal/stickers');
const SHARED_FONTS = path.join(REPO, 'shared/fonts');
const SHARED_CSS = path.join(REPO, 'shared');

// ─── dimension classifier (borrowed from rebuild-all-stickers-index) ─

interface Bucket { dirName: string; w: number; h: number; }

const BUCKETS: Bucket[] = [
  { dirName: 'compact-400x600',  w: 1600, h: 2400 },
  { dirName: 'standard-600x600', w: 2400, h: 2400 },
  { dirName: 'expanded-800x600', w: 3200, h: 2400 },
];

function pngDims(absPath: string): { w: number; h: number } | null {
  try {
    const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', absPath], {
      encoding: 'utf8',
    });
    const w = Number(/pixelWidth:\s*(\d+)/.exec(out)?.[1] ?? 0);
    const h = Number(/pixelHeight:\s*(\d+)/.exec(out)?.[1] ?? 0);
    if (!w || !h) return null;
    return { w, h };
  } catch { return null; }
}

function bucketFor(w: number, h: number): Bucket | null {
  return BUCKETS.find((b) => b.w === w && b.h === h) ?? null;
}

// ─── helpers ────────────────────────────────────────────────────

function copyTree(src: string, dest: string, dry: boolean): number {
  if (!existsSync(src)) return 0;
  if (statSync(src).isFile()) {
    if (!dry) {
      mkdirSync(path.dirname(dest), { recursive: true });
      copyFileSync(src, dest);
    }
    return 1;
  }
  let n = 0;
  if (!dry) mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    n += copyTree(path.join(src, name), path.join(dest, name), dry);
  }
  return n;
}

function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function dirSize(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  const walk = (d: string): void => {
    for (const name of readdirSync(d)) {
      const full = path.join(d, name);
      const s = statSync(full);
      if (s.isDirectory()) walk(full);
      else total += s.size;
    }
  };
  walk(dir);
  return total;
}

// ─── README generators ──────────────────────────────────────────

function bundleReadme(month: string, counts: { stickers: number; pngCopies: number; svgs: number }): string {
  return `# The Praxis Ledger — ${month}

A therapist-shaped monthly daybook for the unquiet mind.
One month. Dated daily pages. Evidence, not shame.

## What's in this bundle

- **\`The Praxis Ledger — ${month}.pdf\`** — the primary deliverable.
  135-ish pages, bookmarked by section and by day. Dated cover + daily headers.
- **\`The Praxis Ledger — ${month}.html\`** — standalone HTML export of the
  same content. Self-contained; fonts and CSS live in \`assets/\`.
- **\`assets/\`** — fonts (Fraunces / Instrument Sans / JetBrains Mono) and
  shared CSS. Present so the HTML file is portable.
- **\`sticker-pack/\`** — the companion 60-sticker skeuomorphic set.

## Sticker pack at a glance

- **${counts.stickers} stickers** across 4 archetypes (field-note · ledger · herbarium · clinic)
- **${counts.pngCopies} PNG copies** (each sticker mirrored into \`all/\` and its dimension bucket)
- **${counts.svgs} SVGs** (vector sources, one flat folder)

See \`sticker-pack/README.md\` for the full roster, archetype legend, and
the evidence-based rationale behind each sticker.

## Opening the PDF in GoodNotes

1. AirDrop \`The Praxis Ledger — ${month}.pdf\` to your iPad.
2. Open in GoodNotes → **Import as new document**.
3. Drop stickers in from \`sticker-pack/pngs/\` (drag onto canvas, scale with pencil).

## Regenerating this bundle

This folder was built by \`scripts/bundle-release.ts\`. Everything under
\`output/\` is gitignored, so you can safely rm -rf and rebuild.

\`\`\`bash
npx tsx scripts/bundle-release.ts \\
  --pdf output/journal-${month.toLowerCase().replace(' ', '-')}.pdf \\
  --month "${month}"
\`\`\`
`;
}

function stickerPackReadme(counts: Record<string, number>, totalPng: number, totalSvg: number): string {
  const rows = BUCKETS
    .map((b) => `├── pngs/${b.dirName.padEnd(22)} ${String(counts[b.dirName] ?? 0).padStart(2)} PNGs`)
    .join('\n');
  return `# The Praxis Ledger — Skeuo Sticker Pack

60 skeuomorphic stickers for journaling in GoodNotes. Deep-paper shell with
tactile filters (drop shadow + vignette + fiber + edge highlights) on every
sticker, four curated archetypes, therapist-shaped copy grounded in
CBT / DBT / ACT / ERP / positive psychology literature.

## What's here

\`\`\`
sticker-pack/
├── pngs/                      ${totalPng} PNG copies total (real files, not symlinks)
│   ├── pngs/all             60 PNGs, mixed dims — drop-and-forget into GoodNotes
${rows}
└── svgs/                      ${totalSvg} SVGs (vector sources, flat folder)
\`\`\`

## Archetype legend

- **field-note** — tape + pin + date-stamp + pressed leaf
  ADHD, behavioural activation, habit tracking
- **ledger** — wax-seal + thumbprint, ruled lines
  tracking, screeners, quantitative logs
- **herbarium** — pressed-leaf + botanical sprig
  savouring, positive psychology, somatic grounding
- **clinic** — rubber-stamp + date-stamp + thread stitch
  CBT / DBT / OCD / ERP / medication tracking

## Regenerating source PNGs and SVGs

\`\`\`bash
npm run build:stickers                         # renders all 60 from TS source
npx tsx scripts/bundle-release.ts --pdf ... --month ...   # rebuilds this bundle
\`\`\`

See \`docs/plan-ceo-review-sticker-expansion-v1.md\` in the repo for the
full evidence-based rationale per sticker.
`;
}

// ─── main ───────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const BUNDLE_NAME = `The Praxis Ledger — ${args.month}`;
  const BUNDLE_DIR = path.join(REPO, 'output', BUNDLE_NAME);
  const STICKER_DIR = path.join(BUNDLE_DIR, 'sticker-pack');
  const PNG_DIR = path.join(STICKER_DIR, 'pngs');
  const SVG_DIR = path.join(STICKER_DIR, 'svgs');
  const ASSET_DIR = path.join(BUNDLE_DIR, 'assets');

  console.log(`\n▶ Bundle: ${BUNDLE_NAME}`);
  console.log(`  → ${path.relative(REPO, BUNDLE_DIR)}\n`);

  // fresh start
  if (existsSync(BUNDLE_DIR)) {
    console.log(`  · removing existing bundle`);
    if (!args.dryRun) rmSync(BUNDLE_DIR, { recursive: true, force: true });
  }
  if (!args.dryRun) {
    mkdirSync(BUNDLE_DIR, { recursive: true });
    mkdirSync(ASSET_DIR, { recursive: true });
    mkdirSync(PNG_DIR, { recursive: true });
    mkdirSync(SVG_DIR, { recursive: true });
    mkdirSync(path.join(PNG_DIR, 'all'), { recursive: true });
    for (const b of BUCKETS) mkdirSync(path.join(PNG_DIR, b.dirName), { recursive: true });
  }

  // ── PDF ──
  const srcPdf = path.isAbsolute(args.pdf) ? args.pdf : path.join(REPO, args.pdf);
  if (!existsSync(srcPdf)) {
    console.error(`  ✗ PDF not found: ${srcPdf}`);
    process.exit(1);
  }
  const destPdf = path.join(BUNDLE_DIR, `${BUNDLE_NAME}.pdf`);
  console.log(`  · PDF  ${path.relative(REPO, srcPdf)} → ${BUNDLE_NAME}.pdf`);
  if (!args.dryRun) copyFileSync(srcPdf, destPdf);

  // ── HTML (optional) ──
  if (args.html) {
    const srcHtml = path.isAbsolute(args.html) ? args.html : path.join(REPO, args.html);
    if (existsSync(srcHtml)) {
      const destHtml = path.join(BUNDLE_DIR, `${BUNDLE_NAME}.html`);
      console.log(`  · HTML ${path.relative(REPO, srcHtml)} → ${BUNDLE_NAME}.html`);
      if (!args.dryRun) copyFileSync(srcHtml, destHtml);
    } else {
      console.log(`  · HTML requested but not found at ${srcHtml} — skipping`);
    }
  }

  // ── assets (fonts + css) ──
  const fontCount = copyTree(SHARED_FONTS, path.join(ASSET_DIR, 'fonts'), args.dryRun);
  console.log(`  · fonts ${fontCount} files → assets/fonts/`);

  const cssFiles = existsSync(SHARED_CSS)
    ? readdirSync(SHARED_CSS).filter((f) => f.endsWith('.css'))
    : [];
  if (!args.dryRun) mkdirSync(path.join(ASSET_DIR, 'css'), { recursive: true });
  for (const f of cssFiles) {
    if (!args.dryRun) {
      copyFileSync(path.join(SHARED_CSS, f), path.join(ASSET_DIR, 'css', f));
    }
  }
  // themes subfolder
  const themesDir = path.join(SHARED_CSS, 'themes');
  const themesCount = copyTree(themesDir, path.join(ASSET_DIR, 'css', 'themes'), args.dryRun);
  console.log(`  · css  ${cssFiles.length} top-level + ${themesCount} themes → assets/css/`);

  // ── stickers ──
  const stickerSubs = readdirSync(STICKERS).filter((name) => {
    const full = path.join(STICKERS, name);
    try { return statSync(full).isDirectory(); } catch { return false; }
  });

  const counts: Record<string, number> = {};
  let totalPngCopies = 0;
  let totalSvgs = 0;
  const unclassified: string[] = [];

  for (const name of stickerSubs) {
    const pngPath = path.join(STICKERS, name, `${name}.png`);
    const svgPath = path.join(STICKERS, name, `${name}.svg`);

    // PNG → dimension bucket + all/
    if (existsSync(pngPath)) {
      const dims = pngDims(pngPath);
      if (!dims) {
        unclassified.push(`${name} (sips failed)`);
      } else {
        const b = bucketFor(dims.w, dims.h);
        if (!b) {
          unclassified.push(`${name} (${dims.w}×${dims.h})`);
        } else {
          if (!args.dryRun) {
            copyFileSync(pngPath, path.join(PNG_DIR, b.dirName, `${name}.png`));
            copyFileSync(pngPath, path.join(PNG_DIR, 'all', `${name}.png`));
          }
          counts[b.dirName] = (counts[b.dirName] ?? 0) + 1;
          totalPngCopies += 2;
        }
      }
    }

    // SVG → flat svgs/
    if (existsSync(svgPath)) {
      if (!args.dryRun) {
        copyFileSync(svgPath, path.join(SVG_DIR, `${name}.svg`));
      }
      totalSvgs += 1;
    }
  }

  // ── READMEs ──
  if (!args.dryRun) {
    writeFileSync(
      path.join(BUNDLE_DIR, 'README.md'),
      bundleReadme(args.month, { stickers: stickerSubs.length, pngCopies: totalPngCopies, svgs: totalSvgs }),
    );
    writeFileSync(
      path.join(STICKER_DIR, 'README.md'),
      stickerPackReadme(counts, totalPngCopies, totalSvgs),
    );
  }

  // ── optional: remove source ──
  if (args.removeSource && !args.dryRun) {
    if (existsSync(srcPdf)) {
      rmSync(srcPdf);
      console.log(`  · removed source PDF ${path.relative(REPO, srcPdf)}`);
    }
    if (args.html) {
      const srcHtml = path.isAbsolute(args.html) ? args.html : path.join(REPO, args.html);
      if (existsSync(srcHtml)) {
        rmSync(srcHtml);
        console.log(`  · removed source HTML ${path.relative(REPO, srcHtml)}`);
      }
    }
  }

  // ── ledger ──
  console.log(`\n  stickers:`);
  console.log(`    all                    → ${stickerSubs.length} PNGs (flat)`);
  for (const b of BUCKETS) console.log(`    ${b.dirName.padEnd(22)} → ${counts[b.dirName] ?? 0} PNGs`);
  console.log(`    svgs                   → ${totalSvgs} SVGs`);
  if (unclassified.length) {
    console.log(`\n  unclassified PNGs:`);
    for (const u of unclassified) console.log(`    - ${u}`);
  }

  if (!args.dryRun) {
    const size = dirSize(BUNDLE_DIR);
    console.log(`\n  bundle size on disk: ${humanBytes(size)}`);
    console.log(`  location: ${BUNDLE_DIR}`);
  } else {
    console.log(`\n  (dry run — nothing written)`);
  }
}

main();
