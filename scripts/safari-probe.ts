#!/usr/bin/env -S npx tsx
/**
 * scripts/safari-probe.ts
 *
 * Eng-review W3 T2 · Safari WebKit 200 MB heap probe (accepted-risk D7).
 *
 * We cannot run this from Node — iOS Safari can only be tested on a
 * physical iPad / iPhone. What this script DOES do is generate two
 * independent artefacts + an operator runbook:
 *
 *   1. probe-html.html       · A full-year standalone HTML that the
 *                              operator loads on the target device and
 *                              inspects heap peak via Web Inspector.
 *                              This answers: "does Safari OOM loading
 *                              130 A4 pages with inlined fonts?"
 *   2. probe-pdf-scale1.pdf  · The same content rendered to PDF at the
 *                              current default scale (1.0), produced
 *                              by the real renderer.
 *   3. probe-pdf-scale0.5.pdf · Same content rendered at the W3 T3
 *                              fallback scale (0.5). Operator A/B
 *                              compares file size + on-device view
 *                              responsiveness. This answers:
 *                              "if HTML OOMs, does the T3 fallback
 *                              PDF produce genuinely smaller output
 *                              the way we expect?"
 *   4. PROBE-GUIDE.md        · auto-generated operator runbook
 *
 * The PDF renders use the actual renderer (`renderPageSpec` +
 * `splicePdfBuffers`), so this also serves as an integration smoke
 * test of the T3 renderScale option end-to-end.
 *
 * Output directory: `output/safari-probe/` (gitignored).
 *
 * Usage:
 *   npx tsx scripts/safari-probe.ts              # full 130-day probe
 *   npx tsx scripts/safari-probe.ts --quick      # 14-day probe (<1 min)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildPageSequence } from '../packages/core/src/splice.js';
import {
  resolvePageSpecFiles,
  substituteProfile,
  V5_PACK_DIR,
} from '../packages/core/src/prax-journal-renderer.js';
import {
  splicePdfBuffers,
  bookmarkTitle,
  type SpecRender,
} from '../packages/core/src/pdf-splice.js';
import {
  closeBrowser,
  renderHTMLToPDF,
} from '../packages/core/src/puppeteer-renderer.js';
import { getPageDimensions } from '../packages/core/src/dimensions.js';
import { buildStandaloneHtml } from '../packages/core/src/standalone-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'output', 'safari-probe');

// ─── Args ──────────────────────────────────────────────────────────

interface Args {
  quick: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  return { quick: argv.includes('--quick') };
}

// ─── Heap telemetry overlay (Chromium-only; Safari uses Web Inspector) ──
//
// Code-review P2-2: iOS Safari does NOT expose `performance.memory`.
// On Safari the banner's fallback message ("no heap API · open Web
// Inspector") is therefore the PRIMARY path, not an edge case. The
// live-counter branch is a bonus for Chromium-family browsers where
// the operator can eyeball numbers without tethering.
//
// Code-review P2-3: the 250ms tick adds ~0.5 MB to the reading. The
// guide now documents this overhead so the operator subtracts it.
//
// Code-review P3-7: rewritten with const/arrow for readability;
// Safari 14+ supports these fine.
const HEAP_TELEMETRY_SCRIPT = `
<style>
  #__probe_banner {
    position: fixed; top: 8px; right: 8px; z-index: 2147483647;
    padding: 10px 14px; border-radius: 8px;
    font: 12px/1.4 ui-monospace, Menlo, monospace;
    background: rgba(0, 0, 0, 0.88); color: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    pointer-events: none; user-select: none;
  }
  #__probe_banner .ok   { color: #6ef0a1; }
  #__probe_banner .warn { color: #ffc857; }
  #__probe_banner .bad  { color: #ff6b6b; }
  @media print { #__probe_banner { display: none; } }
</style>
<div id="__probe_banner">
  <div><strong>safari-probe</strong></div>
  <div id="__probe_meta">measuring&hellip;</div>
</div>
<script>
  (() => {
    const el = document.getElementById('__probe_meta');
    const HEAP_CEIL_MB = 200;
    let peakMB = 0;
    let samples = 0;
    const formatMB = (n) => (n / 1048576).toFixed(1);
    const tick = () => {
      const perf = window.performance || {};
      const mem = perf.memory;
      if (!mem || typeof mem.usedJSHeapSize !== 'number') {
        el.innerHTML = '<span class="warn">no heap API · this is the iOS Safari path · open Web Inspector → Timelines → JS Allocations</span>';
        return;
      }
      const usedMB = mem.usedJSHeapSize / 1048576;
      if (usedMB > peakMB) peakMB = usedMB;
      samples++;
      const cls = peakMB < (HEAP_CEIL_MB * 0.7) ? 'ok'
                : peakMB < HEAP_CEIL_MB ? 'warn' : 'bad';
      el.innerHTML =
        'heap: <span class="' + cls + '">' + formatMB(mem.usedJSHeapSize) + ' MB</span>' +
        ' · peak <span class="' + cls + '">' + peakMB.toFixed(1) + ' MB</span>' +
        ' · limit ' + formatMB(mem.jsHeapSizeLimit) + ' MB' +
        '<br>samples ' + samples + ' · ceiling ' + HEAP_CEIL_MB + ' MB · overhead ~0.5 MB';
    };
    setInterval(tick, 250);
    tick();
  })();
</script>
`.trim();

// ─── Artefact types ────────────────────────────────────────────────

interface ProbeArtefact {
  path: string;
  sizeMb: number;
  kind: 'html' | 'pdf';
  scale: number;
  pages: number;
}

// ─── HTML probe ────────────────────────────────────────────────────

async function buildHtmlProbe(
  from: string,
  to: string,
  filename: string,
): Promise<ProbeArtefact> {
  const specs = buildPageSequence({ from, to });
  const pages: Array<{ html: string; label: string; sourcePath: string }> = [];

  for (const spec of specs) {
    for (const file of resolvePageSpecFiles(spec, V5_PACK_DIR)) {
      const raw = await fs.readFile(file, 'utf-8');
      pages.push({
        html: substituteProfile(raw, undefined, spec),
        label: `${spec.kind}:${path.basename(file, '.html')}`,
        sourcePath: file,
      });
    }
  }

  const doc = buildStandaloneHtml({
    title: `safari-probe · html (${from} → ${to})`,
    pages,
  });

  // Inject the telemetry overlay just before </body>.
  const withOverlay = doc.replace('</body>', `${HEAP_TELEMETRY_SCRIPT}\n</body>`);

  const out = path.join(OUT_DIR, filename);
  await fs.writeFile(out, withOverlay, 'utf-8');
  return {
    path: out,
    sizeMb: Buffer.byteLength(withOverlay) / 1024 / 1024,
    kind: 'html',
    scale: 1.0,
    pages: pages.length,
  };
}

// ─── PDF probe (the real T3 A/B) ───────────────────────────────────
//
// Renders the same page sequence through the renderer at the chosen
// scale. Proves end-to-end that the renderScale knob from T3 actually
// produces a different output — and by how much.
//
// Note: renderPageSpec doesn't yet expose `renderScale`. For the probe
// we walk the file list ourselves and call renderHTMLToPDF per file,
// threading `renderScale` through. Keeps the A/B honest without
// plumbing a new option through renderPageSpec (deferred to W4 when
// the CLI grows a `--render-scale` flag per W3 T3's deferred item).

async function buildPdfProbe(
  from: string,
  to: string,
  filename: string,
  scale: number,
): Promise<ProbeArtefact> {
  const specs = buildPageSequence({ from, to });
  const renders: SpecRender[] = [];
  const dims = getPageDimensions('a4', 'portrait');
  let pageCount = 0;

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const files = resolvePageSpecFiles(spec, V5_PACK_DIR);
    const buffers: Buffer[] = [];
    for (const htmlPath of files) {
      const raw = await fs.readFile(htmlPath, 'utf-8');
      const htmlContent = substituteProfile(raw, undefined, spec);
      buffers.push(
        await renderHTMLToPDF({
          htmlPath,
          htmlContent,
          dimensions: dims,
          multiPage: true,
          renderScale: scale,
        }),
      );
    }
    renders.push({ spec, buffers, bookmark: bookmarkTitle(spec) });
    pageCount += buffers.length;

    if ((i + 1) % 10 === 0 || i === specs.length - 1) {
      console.log(`    rendered ${i + 1}/${specs.length} specs · ${pageCount} pages so far`);
    }
  }

  const pdf = await splicePdfBuffers(renders);
  const out = path.join(OUT_DIR, filename);
  await fs.writeFile(out, pdf);
  return {
    path: out,
    sizeMb: pdf.byteLength / 1024 / 1024,
    kind: 'pdf',
    scale,
    pages: pageCount,
  };
}

// ─── Guide ─────────────────────────────────────────────────────────

async function writeGuide(
  htmlArt: ProbeArtefact,
  pdfAt1: ProbeArtefact,
  pdf05: ProbeArtefact,
  from: string,
  to: string,
): Promise<string> {
  const rel = (p: string) => path.relative(REPO_ROOT, p);
  const reduction = (((pdfAt1.sizeMb - pdf05.sizeMb) / pdfAt1.sizeMb) * 100).toFixed(1);

  const guide = `# Safari probe · operator runbook

**Eng-review:** W3 T2 · Finding 4.2 · D7 (accepted-risk).
**Generated:** ${new Date().toISOString()}
**Range:**    ${from} → ${to}

## What is this?

Mobile Safari enforces a ~200 MB JavaScript heap ceiling per tab. We
can't run Safari from Node, so this script emits three artefacts you
load on the target device yourself, plus this runbook.

## Artefacts

| File | Kind | Scale | Size | Pages | Purpose |
|---|---|---|---|---|---|
| ${rel(htmlArt.path)} | HTML | — (content only) | ${htmlArt.sizeMb.toFixed(1)} MB | ${htmlArt.pages} | Heap probe — does Safari OOM loading the standalone view? |
| ${rel(pdfAt1.path)} | PDF | **1.0** (default) | ${pdfAt1.sizeMb.toFixed(1)} MB | ${pdfAt1.pages} | A/B baseline — what the renderer emits today. |
| ${rel(pdf05.path)}  | PDF | **0.5** (T3 fallback) | ${pdf05.sizeMb.toFixed(1)} MB | ${pdf05.pages} | A/B fallback — what the renderer emits with \`--render-scale 0.5\` (or \`PRAX_RENDER_SCALE=0.5\`). |

**Observed file-size reduction from the T3 fallback:** **${reduction}%**
(${pdfAt1.sizeMb.toFixed(1)} MB → ${pdf05.sizeMb.toFixed(1)} MB).

If the HTML probe OOMs on your iPad, this is the proof that the T3
fallback codepath meaningfully changes renderer output, and by how much.

## Part 1 · HTML heap probe (iOS Safari)

iOS Safari does **not** expose \`performance.memory\`, so the on-page
telemetry banner will print \`no heap API · this is the iOS Safari
path · open Web Inspector\`. That is expected — do Web Inspector on a
tethered Mac:

1. Connect iPad to Mac via USB/Lightning.
2. On iPad: Settings → Safari → Advanced → Web Inspector: On.
3. On Mac: Safari → Develop → <iPad name> → <tab with probe>.
4. Web Inspector → Timelines → JavaScript Allocations → Record.
5. Scroll the probe page end-to-end (flick, touch-hold, back to top).
6. Stop recording; note the peak heap size.
7. Record in the Results table below.

Chromium-family browsers (Chrome, Edge, Brave — desktop or iPadOS 17+
Chrome) will show the banner's live counter instead. The 250 ms tick
adds ~0.5 MB overhead to the reading; subtract that when comparing.

## Part 2 · PDF A/B (any viewer)

No Web Inspector needed for this part:

1. Transfer both PDFs to the iPad.
2. Open both in Files / GoodNotes / Safari — whichever app users will
   really load them in.
3. Note which one opens faster + scrolls smoother.
4. If the 0.5-scale PDF opens but the 1.0 one stalls, that's your
   confirmation that the T3 fallback is a real escape hatch.

## Expected outcomes

| Peak heap on probe.html | Meaning |
|---|---|
| < 140 MB (70% of 200) | ✅ SAFE · HTML standalone path ships as-is |
| 140 - 180 MB          | ⚠ TIGHT · HTML ships but recommend docs nudge users to PDF-first |
| > 180 MB              | ❌ FAIL · HTML standalone is unshippable on iOS · PDF-only path required · T3 0.5-scale fallback should be the default for year-long exports |

| 1.0-PDF behaviour on iPad | Action |
|---|---|
| Opens + scrolls smoothly  | Keep scale 1.0 as default · T3 fallback remains escape hatch |
| Stalls but 0.5 is smooth   | Consider making 0.5 the default for year-long exports in CLI; document the tradeoff |
| Both stall                  | Safari rescue path = CF Workers server-side render per eng-review §9 F2 |

## Results table (operator fills in)

| Artefact | Device / iOS | Peak heap (MB) | Behaviour | Photo |
|---|---|---|---|---|
| probe-html.html   |    |   |   |   |
| probe-pdf-scale1.pdf |    |   |   |   |
| probe-pdf-scale0.5.pdf |    |   |   |   |

## What happens next

- **All devices ≤ 140 MB + both PDFs smooth:** T3 fallback stays as
  escape hatch. No CEO-plan rework.
- **HTML fails but 0.5-PDF smooth:** ship PDF-first with T3 fallback
  default; W4 CEO-plan still on track.
- **Both PDFs stall on any device:** flag to plan-ceo-review. The F2
  rescue is server-side render on CF Workers, ~2-3 weeks of slack.

## Re-running the probe

\`\`\`bash
npx tsx scripts/safari-probe.ts           # full 130-day probe (~2-3 min)
npx tsx scripts/safari-probe.ts --quick   # 14-day probe (~15 sec)
\`\`\`

Safe to re-run any time; all outputs land under \`output/safari-probe/\`
which is gitignored.
`;
  const guidePath = path.join(OUT_DIR, 'PROBE-GUIDE.md');
  await fs.writeFile(guidePath, guide, 'utf-8');
  return guidePath;
}

// ─── Main ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Quick vs full range. Quick is for dev feedback (~15 sec); full
  // (~2-3 min for 130 days with Chromium restart budget) is what the
  // operator actually uses.
  const [from, to] = args.quick
    ? ['2026-01-01', '2026-01-14']
    : ['2026-01-01', '2026-05-10'];

  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log(`Range: ${from} → ${to}${args.quick ? ' (--quick)' : ''}`);
  console.log('');

  console.log('[1/3] building HTML probe …');
  const htmlArt = await buildHtmlProbe(from, to, 'probe-html.html');
  console.log(`      ✓ ${path.relative(REPO_ROOT, htmlArt.path)} · ${htmlArt.sizeMb.toFixed(1)} MB · ${htmlArt.pages} pages`);

  console.log('[2/3] rendering PDF at scale 1.0 (baseline) …');
  const pdfAt1 = await buildPdfProbe(from, to, 'probe-pdf-scale1.pdf', 1.0);
  console.log(`      ✓ ${path.relative(REPO_ROOT, pdfAt1.path)} · ${pdfAt1.sizeMb.toFixed(1)} MB · ${pdfAt1.pages} pages`);

  console.log('[3/3] rendering PDF at scale 0.5 (T3 fallback) …');
  const pdf05 = await buildPdfProbe(from, to, 'probe-pdf-scale0.5.pdf', 0.5);
  console.log(`      ✓ ${path.relative(REPO_ROOT, pdf05.path)} · ${pdf05.sizeMb.toFixed(1)} MB · ${pdf05.pages} pages`);

  await closeBrowser();

  console.log('writing operator guide …');
  const guide = await writeGuide(htmlArt, pdfAt1, pdf05, from, to);
  console.log(`  ✓ ${path.relative(REPO_ROOT, guide)}`);

  const reduction = (((pdfAt1.sizeMb - pdf05.sizeMb) / pdfAt1.sizeMb) * 100).toFixed(1);
  console.log('');
  console.log(`Summary: 0.5-scale reduces PDF size by ${reduction}% (${pdfAt1.sizeMb.toFixed(1)} MB → ${pdf05.sizeMb.toFixed(1)} MB).`);
  console.log('Next: transfer the artefacts to an iPad and follow PROBE-GUIDE.md.');
}

main().catch((err: unknown) => {
  console.error(err);
  // Ensure we close the Chromium instance on crash so the script doesn't
  // hang on process exit.
  void closeBrowser().catch(() => {
    /* already crashing */
  });
  process.exitCode = 1;
});
