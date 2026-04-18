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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(chooserHtml());
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
