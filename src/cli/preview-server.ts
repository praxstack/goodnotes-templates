/**
 * Local preview server — serves generated assets as a browsable gallery.
 * Used during development to preview templates and stickers without GoodNotes.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

export async function startPreviewServer(outputDir: string, port: number): Promise<void> {
  const absDir = path.resolve(outputDir);

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${port}`);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await generateGalleryHTML(absDir);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // Serve static files from output dir
    // Use path.resolve to normalize any '..' segments, then check prefix
    const decoded = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const filePath = path.resolve(absDir, decoded);
    if (!filePath.startsWith(absDir + path.sep) && filePath !== absDir) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) throw new Error('Not a file');

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      const content = await fs.readFile(filePath);

      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': content.length,
        'Cache-Control': 'no-cache',
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    console.log(`  Preview server running at http://localhost:${port}`);
    console.log(`  Press Ctrl+C to stop.\n`);
  });
}

async function generateGalleryHTML(outputDir: string): Promise<string> {
  const categories: Record<string, string[]> = {};

  async function scan(dir: string, prefix: string = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          await scan(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.pdf', '.png', '.svg'].includes(ext)) {
            const category = prefix.split('/')[0] || 'other';
            if (!categories[category]) categories[category] = [];
            categories[category].push(prefix ? `${prefix}/${entry.name}` : entry.name);
          }
        }
      }
    } catch { /* empty dir */ }
  }

  await scan(outputDir);

  // HTML-escape to prevent XSS from filenames
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const sections = Object.entries(categories).sort().map(([cat, files]) => {
    const items = files.sort().map(f => {
      const ext = path.extname(f).toLowerCase();
      const name = esc(path.basename(f));
      const href = encodeURI(`/${f}`);
      if (ext === '.png' || ext === '.svg') {
        return `<div class="card"><img src="${href}" alt="${name}" loading="lazy" /><span>${name}</span></div>`;
      }
      return `<div class="card pdf"><a href="${href}" target="_blank">📄 ${name}</a></div>`;
    }).join('\n');

    return `<section><h2>${esc(cat)} (${files.length})</h2><div class="grid">${items}</div></section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GoodNotes Templates — Preview Gallery</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; padding: 2rem; }
    h1 { text-align: center; margin-bottom: 0.5rem; font-size: 1.8rem; }
    .subtitle { text-align: center; color: #888; margin-bottom: 2rem; }
    section { margin-bottom: 2.5rem; }
    h2 { margin-bottom: 1rem; font-size: 1.2rem; color: #555; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
    .card { background: white; border-radius: 8px; padding: 0.75rem; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card img { max-width: 100%; height: 120px; object-fit: contain; margin-bottom: 0.5rem; }
    .card span, .card a { display: block; font-size: 0.75rem; color: #666; word-break: break-all; text-decoration: none; }
    .card a:hover { color: #2563eb; }
    .card.pdf { display: flex; align-items: center; justify-content: center; min-height: 80px; }
    .stats { text-align: center; color: #aaa; font-size: 0.85rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>🗒️ GoodNotes Templates</h1>
  <p class="subtitle">Preview Gallery — generated assets</p>
  ${sections || '<p style="text-align:center;color:#999;">No assets found. Run <code>npm run generate</code> first.</p>'}
  <p class="stats">Total: ${Object.values(categories).flat().length} files across ${Object.keys(categories).length} categories</p>
</body>
</html>`;
}
