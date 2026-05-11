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

export async function startPreviewServer(outputDir: string, port: number): Promise<http.Server> {
  const absDir = path.resolve(outputDir);
  // SECURITY: bind to 127.0.0.1 by default — do not expose gallery to LAN.
  // Override with PREVIEW_HOST=0.0.0.0 if you really want it.
  // See audit finding FIND-0001 (CVSS 5.3, CWE-200).
  const host = process.env.PREVIEW_HOST || '127.0.0.1';

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${host}:${port}`);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const html = await generateGalleryHTML(absDir);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // Decode the request path. Strip leading slashes.
    let decoded: string;
    try {
      decoded = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    } catch {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    // SECURITY: reject NUL bytes (CWE-158) + backslashes (Windows path split).
    // See FIND-0023 (downgraded Informational in iter-3, kept as defense-in-depth).
    if (decoded.indexOf('\0') !== -1 || decoded.indexOf('\\') !== -1) {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const filePath = path.resolve(absDir, decoded);

    // SECURITY: path.resolve does NOT dereference symlinks — fs.readFile does.
    // Use fs.realpath to detect symlink escapes, then re-check the prefix.
    // We also reject if the literal path itself is a symlink (belt + suspenders).
    // See FIND-0022 (CVSS 7.1, CWE-59, POC executed in audit/_runtime/tool-outputs/symlink-poc.log).
    let realPath: string;
    let lstat: import('node:fs').Stats;
    try {
      lstat = await fs.lstat(filePath);
      if (lstat.isSymbolicLink()) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      realPath = await fs.realpath(filePath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      res.writeHead(code === 'ENOENT' ? 404 : 403);
      res.end(code === 'ENOENT' ? 'Not found' : 'Forbidden');
      return;
    }

    if (!realPath.startsWith(absDir + path.sep) && realPath !== absDir) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    try {
      const stat = await fs.stat(realPath);
      if (!stat.isFile()) throw new Error('Not a file');

      const ext = path.extname(realPath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';

      // Cheap freshness: ETag from mtime+size. Send 304 on match. (FIND-0021)
      const etag = `"${stat.mtimeMs.toString(36)}-${stat.size.toString(36)}"`;
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, { ETag: etag });
        res.end();
        return;
      }

      const content = await fs.readFile(realPath);
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': content.length,
        'Cache-Control': 'public, max-age=60, must-revalidate',
        ETag: etag,
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(port, host, () => {
      console.log(`  Preview server running at http://${host}:${port}`);
      console.log(`  Press Ctrl+C to stop.\n`);
      if (host === '127.0.0.1') {
        console.log(`  (localhost only. Set PREVIEW_HOST=0.0.0.0 to expose to LAN.)\n`);
      }
      resolve();
    });
  });
  return server;
}

/**
 * Generate the dev-only local preview gallery HTML.
 *
 * NOTE (FIND-I4-008): This is the *local dev* gallery served by
 * `npm run preview` from the CLI — NOT the public gallery at
 * apps/gallery (that's a full Astro static site deployed to Vercel).
 *
 * The two exist on purpose:
 *   - This function renders whatever PDFs/PNGs/SVGs already exist on
 *     disk under `output/`. Zero-framework, no build step, starts in
 *     ~20ms. Perfect for iterating on templates.
 *   - apps/gallery reads registry.json + pack manifests to render a
 *     curated, searchable public site with pack metadata, previews,
 *     MDX detail pages, theme preview grids, and a contribution guide.
 *
 * Do NOT try to unify them. They serve different audiences and the
 * shape of "whatever's in output/" is deliberately schemaless.
 */
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

  // HTML-escape to prevent XSS from filenames (FIND-0002). Includes ' escape
  // so switching to single-quoted attributes in the future does not silently
  // reintroduce the injection primitive.
  const esc = (s: string): string =>
    s.replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c),
    );

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
