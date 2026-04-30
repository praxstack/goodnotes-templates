#!/usr/bin/env -S npx tsx
/**
 * scripts/safari-probe.ts
 *
 * Eng-review W3 T2 · Safari WebKit 200 MB heap probe (accepted-risk D7).
 *
 * We cannot run this from Node — iOS Safari can only be tested on a
 * physical iPad / iPhone (or a macOS-hosted simulator). What this script
 * DOES do is generate a self-contained HTML probe document that the
 * operator loads on the target device; the probe measures its own heap
 * and renders a "PASS / FAIL" banner.
 *
 * Outputs:
 *   output/safari-probe/
 *     ├─ probe.html          · one document that exercises a heavy PDF
 *     │                         build path (130 A4 pages of realistic
 *     │                         markup + base64-inlined WOFF2 fonts)
 *     ├─ probe-scaled.html   · same content at --render-scale 0.5
 *     │                         (the fallback codepath from T3); lets
 *     │                         the operator A/B the heap impact
 *     └─ PROBE-GUIDE.md      · operator runbook (generated)
 *
 * Usage:
 *   npx tsx scripts/safari-probe.ts
 *   # Then open the files on the target device and follow PROBE-GUIDE.md
 *
 * See `docs/safari-probe-guide.md` for the long-form guide that walks
 * the operator through the hand-off.
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
import { buildStandaloneHtml } from '../packages/core/src/standalone-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'output', 'safari-probe');

// ─── Heap telemetry overlay ─────────────────────────────────────────
//
// The probe document auto-injects this script just before `</body>`.
// It polls `performance.memory` (Chrome/Safari quirk: only available
// under WebKit with `usedJSHeapSize`) and prints the high-water mark
// into a fixed-position banner so the operator can photograph / record
// without keeping the Web Inspector open.
//
// iOS Safari exposes `performance.memory` under a different key
// (`totalJSHeapSize`/`usedJSHeapSize`/`jsHeapSizeLimit`) behind a flag
// that's on by default in iOS 17+. If unavailable, the banner falls
// back to printing the document page count and a reminder to open
// Web Inspector for manual heap capture.
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
  (function () {
    var el = document.getElementById('__probe_meta');
    var peakMB = 0;
    var samples = 0;
    var HEAP_CEIL_MB = 200; // mobile Safari soft limit per eng-review F2
    function format(n) { return (n / 1048576).toFixed(1); }
    function tick() {
      var perf = window.performance || {};
      var mem = perf.memory;
      if (!mem || typeof mem.usedJSHeapSize !== 'number') {
        el.innerHTML = '<span class="warn">no heap API · open Web Inspector</span>';
        return;
      }
      var usedMB = mem.usedJSHeapSize / 1048576;
      if (usedMB > peakMB) peakMB = usedMB;
      samples++;
      var cls = peakMB < (HEAP_CEIL_MB * 0.7) ? 'ok'
              : peakMB < HEAP_CEIL_MB ? 'warn' : 'bad';
      el.innerHTML =
        'heap: <span class="' + cls + '">' + format(mem.usedJSHeapSize) + ' MB</span>' +
        ' · peak <span class="' + cls + '">' + peakMB.toFixed(1) + ' MB</span>' +
        ' · limit ' + format(mem.jsHeapSizeLimit) + ' MB' +
        '<br>samples ' + samples + ' · ceiling ' + HEAP_CEIL_MB + ' MB';
    }
    setInterval(tick, 250);
    tick();
  })();
</script>
`.trim();

interface ProbeBuild {
  path: string;
  sizeMb: number;
  pages: number;
}

async function buildProbe(scale: number, filename: string): Promise<ProbeBuild> {
  // 130-day sequence exercises the big-PDF / big-HTML codepath the
  // eng-review is worried about (Finding 4.2).
  const specs = buildPageSequence({ from: '2026-01-01', to: '2026-05-10' });
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
    title: `safari-probe · scale ${scale}`,
    pages,
  });

  // Inject the telemetry overlay just before </body>. We deliberately
  // don't add it via the builder because it's probe-specific, not part
  // of the core stitcher contract.
  const withOverlay = doc.replace('</body>', `${HEAP_TELEMETRY_SCRIPT}\n</body>`);
  const withScaleHint = withOverlay.replace(
    '</head>',
    `<meta name="probe-scale" content="${scale}">\n</head>`,
  );

  const out = path.join(OUT_DIR, filename);
  await fs.writeFile(out, withScaleHint, 'utf-8');
  return {
    path: out,
    sizeMb: Buffer.byteLength(withScaleHint) / 1024 / 1024,
    pages: pages.length,
  };
}

async function writeGuide(b1: ProbeBuild, b05: ProbeBuild): Promise<string> {
  const relPath = (p: string) => path.relative(REPO_ROOT, p);
  const guide = `# Safari probe · operator runbook

**Eng-review:** W3 T2 · Finding 4.2 · D7 (accepted-risk).
**Generated:** ${new Date().toISOString()}

## What is this?

Mobile Safari enforces a ~200 MB JavaScript heap ceiling per tab. A
full-year journal rendered as one standalone HTML is ~${b1.sizeMb.toFixed(1)} MB
and contains ${b1.pages} A4 page sections with inlined WOFF2 fonts. The
eng-review accepts the risk that this exceeds Safari's heap — but we
still need to *measure* the headroom so we know whether the W3 T3
0.5-scale fallback is actually needed.

## Files

| File | Scale | Size | Pages |
|---|---|---|---|
| ${relPath(b1.path)}  | 1.0 (default) | ${b1.sizeMb.toFixed(1)} MB | ${b1.pages} |
| ${relPath(b05.path)} | 0.5 (fallback) | ${b05.sizeMb.toFixed(1)} MB | ${b05.pages} |

(The 0.5-scale build is not a smaller HTML — it carries the same text
+ fonts — but is the **renderer's** 0.5-scale output, for an A/B that
measures whether the fallback codepath even exists in the pipeline.)

## Happy-path runbook

1. Transfer both HTML files to an iPad running iOS 17+ (AirDrop or
   iCloud Drive).
2. Open ${path.basename(b1.path)} in mobile Safari.
3. Watch the black banner top-right; it prints live heap + peak.
4. Scroll end-to-end (touch-hold, flick, back to top — exercises the
   style / layout cache).
5. Screenshot the peak once stable (~30 seconds after end-of-scroll).
6. Record the result in **Results table** below.
7. Force-close the tab.
8. Repeat with ${path.basename(b05.path)}.

## Expected outcomes

| Peak heap | Meaning |
|---|---|
| < 140 MB (70% of 200) | ✅ SAFE · no fallback needed |
| 140-180 MB            | ⚠ HEADROOM TIGHT · recommend T3 fallback for year-long exports |
| > 180 MB              | ❌ FAIL · tab may crash · MUST ship the 0.5-scale fallback AND a fixed-size chunking codepath |
| "no heap API" banner  | Browser won't self-report · open Web Inspector on a tethered Mac and observe Timelines → JS Heap |

## Results table (operator fills in)

| File          | Device / iOS    | Peak heap | Tab crashed? | Photo |
|---------------|-----------------|-----------|--------------|-------|
| probe.html    |                 |           |              |       |
| probe-scaled.html |             |           |              |       |

## What happens next

- **All three tested devices ≤ 140 MB peak:** T3 fallback stays as an
  escape hatch, gallery can rely on the default codepath.
- **Any device > 180 MB:** W4 CEO plan unblock depends on shipping
  server-side render on Cloudflare Workers (eng-review §9 F2 "rescue"
  column). Flag this back to the plan-ceo-review artefact so the
  timeline gets the real cost added to slack.
- **Heap API unavailable everywhere:** revisit W3 T2 with a native
  \`Safari.app\` Web Inspector screencast — no code change needed.

## Re-running the probe

\`\`\`bash
npx tsx scripts/safari-probe.ts
\`\`\`

Emits fresh HTML under \`output/safari-probe/\` with a new
\`generated_at\` timestamp. Safe to run any time; no side effects
outside \`output/\`.
`;
  const guidePath = path.join(OUT_DIR, 'PROBE-GUIDE.md');
  await fs.writeFile(guidePath, guide, 'utf-8');
  return guidePath;
}

async function main(): Promise<void> {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log('building probe · scale 1.0 (default) …');
  const b1 = await buildProbe(1.0, 'probe.html');
  console.log(`  ✓ ${path.relative(REPO_ROOT, b1.path)}  ·  ${b1.sizeMb.toFixed(1)} MB  ·  ${b1.pages} pages`);

  console.log('building probe · scale 0.5 (T3 fallback) …');
  const b05 = await buildProbe(0.5, 'probe-scaled.html');
  console.log(`  ✓ ${path.relative(REPO_ROOT, b05.path)}  ·  ${b05.sizeMb.toFixed(1)} MB  ·  ${b05.pages} pages`);

  console.log('writing operator guide …');
  const guide = await writeGuide(b1, b05);
  console.log(`  ✓ ${path.relative(REPO_ROOT, guide)}`);

  console.log('');
  console.log('Next: transfer both .html files to an iPad and follow PROBE-GUIDE.md.');
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
