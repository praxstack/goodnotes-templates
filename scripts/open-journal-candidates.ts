#!/usr/bin/env tsx
/**
 * Opens all daily-journal candidates in the browser so a design decision
 * can be made visually side-by-side. Serves them at http://127.0.0.1:4040
 * with a chooser page listing each option + a render preview link.
 *
 * Usage: npx tsx scripts/open-journal-candidates.ts
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';

const ROOT = process.cwd();
const PORT = 4040;

const CANDIDATES = [
  {
    id: '__v4-all__',
    label: '★★★ ADHD v4 · ALL 3 PAGES stacked (NEW, review this)',
    blurb:
      'Today + Reflect + Brain Dump rendered one after another in A4. Warm Analog Editorial: cream + sage + clay. Research-grounded (Barkley Rule of 3, Ramsay & Rostain CBT, Neff self-compassion, NHS cost calc, Marlatt urge-surfing, Hobonichi day counter).',
  },
  {
    id: 'adhd-v4-today',
    label: '  ↳ v4 · Today (Page 1 / 3)',
    blurb:
      'Morning commit — Frog + Top 3 (with AM/MID/EVE bands, Est min, Pomodoro) + Meds/Sleep/Water + Movement (Gym·Walk·Swim) + Cigs horror metric.',
  },
  {
    id: 'adhd-v4-reflect',
    label: '  ↳ v4 · Reflect (Page 2 / 3)',
    blurb:
      'Evening process — Done + Moved-to-Tomorrow, Mood+Energy, CBT Thought Flip, Self-Care check, Wins/Grateful/Proud triad, Craving log, Tomorrow\'s Frog.',
  },
  {
    id: 'adhd-v4-brain-dump',
    label: '  ↳ v4 · Brain Dump (Page 3 / 3)',
    blurb:
      'Free canvas — 4 sticker slots (Three Good Things · What would I tell a friend · If-Then Plan · Craving Surf) + dot-grid writing canvas + printer cut marks.',
  },
  {
    id: 'adhd-v3-today',
    label: 'ADHD v3 · Today',


    blurb:
      'Newest productivity page — paired with Reflect + Weekly + Monthly in the full-year planner. Currently the most polished design.',
  },
  {
    id: 'adhd-v3-reflect',
    label: 'ADHD v3 · Reflect',
    blurb: 'Evening companion to v3-today. CBT-style reflection + self-compassion.',
  },
  {
    id: 'adhd-gentle-daily',
    label: 'ADHD Gentle · Daily',
    blurb:
      'Single-page CBT-informed daily — 5 min to fill. Earlier, minimalist design.',
  },
  {
    id: 'reflection-journal',
    label: 'Reflection Journal',
    blurb: 'End-of-day worksheet: wins, challenges, learnings, intentions.',
  },
  {
    id: 'gratitude-journal',
    label: 'Gratitude Journal',
    blurb: 'Daily gratitude + affirmation + evening reflection.',
  },
  {
    id: 'prompted-journal',
    label: 'Prompted Journal',
    blurb: 'Self-discovery prompts with response space.',
  },
  {
    id: 'adhd-v2-today',
    label: '(reference) ADHD v2 · Today',
    blurb: 'Older v2 design — included for comparison.',
  },
];

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function chooserHtml(): string {
  const cards = CANDIDATES.map(
    (c) => `
    <article>
      <h2><a href="/template/${c.id}.html" target="_blank" rel="noopener">${c.label} ↗</a></h2>
      <p>${c.blurb}</p>
      <code>src/templates/html/${c.id}.html</code>
    </article>`,
  ).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Pick your daily journal</title>
<style>
  :root { color-scheme: light dark; --accent: #2563eb; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 900px; margin: 0 auto; padding: 3rem 2rem;
    color: #111; background: #fafafa;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #f0f0f0; background: #1a1a1a; }
    article { background: #262626; border-color: #333; }
    code { background: #000; color: #9cc; }
  }
  h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
  .subtitle { opacity: 0.75; margin-bottom: 2rem; }
  article {
    background: #fff; border: 1px solid #e5e5e5; border-radius: 10px;
    padding: 1.25rem 1.5rem; margin-bottom: 1rem;
  }
  h2 { font-size: 1.05rem; margin-bottom: 0.4rem; }
  h2 a { color: var(--accent); text-decoration: none; }
  h2 a:hover { text-decoration: underline; }
  p { margin: 0.25rem 0 0.6rem; opacity: 0.85; }
  code {
    display: inline-block; background: #f4f4f4; padding: 2px 8px;
    border-radius: 4px; font: 12px/1.3 ui-monospace, SFMono-Regular, Consolas, monospace;
    color: #666;
  }
  footer { margin-top: 2rem; font-size: 13px; opacity: 0.6; }
</style>
</head>
<body>
<h1>Pick your daily journal to redesign</h1>
<p class="subtitle">Click each to see it full-width in a new tab. Tell me the one you want and what "better" looks like.</p>
${cards}
<footer>Serving <code>src/templates/html/</code> on <code>http://127.0.0.1:${PORT}</code>. Ctrl+C to stop.</footer>
</body>
</html>`;
}

const V4_STACK_IDS = ['adhd-v4-today', 'adhd-v4-reflect', 'adhd-v4-brain-dump'] as const;
const V5_STACK_IDS = ['adhd-v5-today', 'adhd-v5-midday', 'adhd-v5-reflect', 'adhd-v5-brain-dump'] as const;

/** HTML-escape user-facing strings before template interpolation (review P2-5). */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  );
}

function stackHtml(opts: { ids: readonly string[]; version: string; title: string; subtitle: string; stripPrefix: string }): string {
  const { ids, version, title, subtitle, stripPrefix } = opts;
  const iframes = ids.map(
    (id, i) => `
    <section class="sheet" data-page="${i + 1}">
      <div class="sheet-tag">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="name">${id.replace(stripPrefix, '').replace(/-/g, ' ')}</span>
        <span class="format">A4 · 210×297mm</span>
      </div>
      <iframe src="/template/${id}.html" title="Page ${i + 1} of ${ids.length} — ${id}" loading="lazy"></iframe>
    </section>`,
  ).join('\n');
  const openLinks = ids.map((id) => `<a href="/template/${id}.html" target="_blank">open · ${id.replace(stripPrefix, '').replace(/-/g, ' ')} ↗</a>`).join('\n    ');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(version)} · ${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #26241F;
    --paper-edge: #1A1814;
    --ink: #E8DFC9;
    --ink-soft: #B8AE93;
    --ink-quiet: #7D7255;
    --accent: #C9884A;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--ink-soft); min-height: 100vh; }
  body {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 13px;
    padding: 32px 24px 96px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .masthead {
    max-width: 230mm;
    width: 100%;
    padding: 18px 22px;
    margin-bottom: 28px;
    border: 1px solid rgba(232, 223, 201, 0.14);
    background: rgba(232, 223, 201, 0.04);
    display: flex;
    align-items: baseline;
    gap: 18px;
    flex-wrap: wrap;
  }
  .masthead .kicker {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--accent);
  }
  .masthead h1 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-variation-settings: "opsz" 144, "SOFT" 100;
    font-size: 26px;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .masthead .dots { color: var(--ink-quiet); margin: 0 6px; }
  .masthead .sub {
    font-size: 11px;
    color: var(--ink-quiet);
    letter-spacing: 0.06em;
  }
  .masthead .links {
    margin-left: auto;
    display: flex;
    gap: 12px;
    font-size: 11px;
  }
  .masthead .links a {
    color: var(--ink-soft);
    text-decoration: none;
    border-bottom: 1px dotted var(--ink-quiet);
    padding-bottom: 1px;
  }
  .masthead .links a:hover { color: var(--accent); border-bottom-color: var(--accent); }

  .stack {
    display: flex;
    flex-direction: column;
    gap: 36px;
    align-items: center;
    width: 100%;
  }
  .sheet {
    position: relative;
    width: 230mm;               /* 210mm A4 + 10mm bleed each side */
    max-width: 100%;
  }
  .sheet-tag {
    position: absolute;
    top: -18px;
    left: 0;
    display: flex;
    align-items: baseline;
    gap: 14px;
    font-size: 11px;
    color: var(--ink-quiet);
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }
  .sheet-tag .num {
    font-family: 'Fraunces', serif;
    font-variation-settings: "opsz" 72;
    font-size: 22px;
    color: var(--accent);
    letter-spacing: -0.01em;
  }
  .sheet-tag .name { color: var(--ink-soft); }
  .sheet-tag .format { margin-left: auto; color: var(--ink-quiet); opacity: 0.7; }

  iframe {
    display: block;
    width: 100%;
    height: 317mm;              /* 297 + 20mm chrome (page shadow + padding) */
    border: 0;
    border-radius: 2px;
    box-shadow:
      0 0 0 1px rgba(232, 223, 201, 0.06),
      0 24px 60px rgba(0, 0, 0, 0.40),
      0 8px 24px rgba(0, 0, 0, 0.25);
    background: #F9F5EC;
  }

  @media (max-width: 800px) {
    body { padding: 16px 8px 40px; }
    .sheet { width: 100%; }
    iframe { height: 180vw; max-height: 317mm; }
    .masthead { flex-direction: column; gap: 8px; }
    .masthead .links { margin-left: 0; }
  }
</style>
</head>
<body>

<div class="masthead">
  <span class="kicker">${esc(version)}</span>
  <h1>${esc(title)}</h1>
  <span class="dots">·</span>
  <span class="sub">${esc(subtitle)}</span>
  <span class="links">
    ${openLinks}
    <a href="/">← back to chooser</a>
  </span>
</div>

<div class="stack">
${iframes}
</div>

</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(chooserHtml());
      return;
    }
    // /template/__v4-all__.html → serve the stacked 3-page viewer
    if (url.pathname === '/template/__v4-all__.html' || url.pathname === '/v4-all') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(stackHtml({
        ids: V4_STACK_IDS,
        version: 'ADHD Planner v4',
        title: 'Daily Spread',
        subtitle: '3 pages — Today / Reflect / Brain Dump · Warm Analog Editorial',
        stripPrefix: 'adhd-v4-',
      }));
      return;
    }
    // /template/__v5-all__.html → serve the stacked v5 4-page viewer
    if (url.pathname === '/template/__v5-all__.html' || url.pathname === '/v5-all') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(stackHtml({
        ids: V5_STACK_IDS,
        version: 'Prax Journal v5',
        title: 'Daily Spread',
        subtitle: '4 pages — Today / Midday / Reflect / Brain Dump · Warm Analog Editorial + Shreya + Dr Joshi',
        stripPrefix: 'adhd-v5-',
      }));
      return;
    }
    // /template/<id>.html → serve the raw HTML file
    if (url.pathname.startsWith('/template/')) {
      const name = url.pathname.slice('/template/'.length);
      if (!/^[\w-]+\.html$/.test(name)) {

        res.writeHead(400);
        res.end('bad name');
        return;
      }
      const filePath = path.join(ROOT, 'src', 'templates', 'html', name);
      const html = await fs.readFile(filePath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
    // /src/... passthrough for any local .css/.css relative link
    if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/assets/')) {
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const abs = path.resolve(ROOT, rel);
      if (!abs.startsWith(ROOT + path.sep)) {
        res.writeHead(403);
        res.end('nope');
        return;
      }
      try {
        const ext = path.extname(abs).toLowerCase();
        const data = await fs.readFile(abs);
        res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
        res.end(data);
        return;
      } catch {
        res.writeHead(404);
        res.end('not found');
        return;
      }
    }
    res.writeHead(404);
    res.end('not found');
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('error');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${PORT}/`;
  console.log(`\n→ Chooser page: ${url}`);
  console.log(`  Candidates are opened full-width in new tabs from there.`);
  console.log(`  Ctrl+C to stop.\n`);
  exec(`open ${url}`, () => {});
});
