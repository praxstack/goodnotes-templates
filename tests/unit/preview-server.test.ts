/**
 * T1 module tests for src/cli/preview-server.ts.
 * Protects FIND-0001 (bind localhost), FIND-0002 (escape single quote),
 * FIND-0021 (ETag), FIND-0022 (symlink traversal), FIND-0023 (NUL byte).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, symlink, mkdir, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { startPreviewServer } from '../../packages/cli/src/preview-server.js';

// Muzzle console.log so the test log stays readable.
const origLog = console.log;
beforeEach(() => {
  console.log = () => {};
});
afterEach(() => {
  console.log = origLog;
});

interface Running {
  server: Server;
  port: number;
  close: () => Promise<void>;
}

async function spawnServer(outputDir: string): Promise<Running> {
  // Try up to 10 random high ports to avoid collisions.
  for (let i = 0; i < 10; i++) {
    const port = 30000 + Math.floor(Math.random() * 20000);
    try {
      const server = await startPreviewServer(outputDir, port);
      return {
        server,
        port,
        close: () =>
          new Promise<void>((resolve) => {
            server.close(() => resolve());
            server.unref();
          }),
      };
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== 'EADDRINUSE') throw err;
    }
  }
  throw new Error('could not find a free port after 10 attempts');
}

async function get(url: string, headers?: Record<string, string>): Promise<{ status: number; headers: Headers; body: string }> {
  const res = await fetch(url, { headers });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body };
}

describe('preview-server', () => {
  let outputDir: string;
  let running: Running | null = null;

  beforeEach(async () => {
    // macOS: $TMPDIR resolves through /var -> /private/var symlink. Our own
    // lstat guard rejects any path component that is a symlink, so call
    // realpath upfront to land in the real canonical directory.
    outputDir = await realpath(await mkdtemp(path.join(tmpdir(), 'preview-server-test-')));
  });

  afterEach(async () => {
    if (running) {
      await running.close();
      running = null;
    }
    await rm(outputDir, { recursive: true, force: true });
  });

  // FIND-0001: bind 127.0.0.1 by default, not 0.0.0.0.
  describe('FIND-0001 · bind localhost by default', () => {
    it('listens on 127.0.0.1 by default', async () => {
      running = await spawnServer(outputDir);
      const addr = running.server.address() as AddressInfo;
      expect(addr.address).toBe('127.0.0.1');
    });

    it('responds on 127.0.0.1', async () => {
      running = await spawnServer(outputDir);
      const res = await get(`http://127.0.0.1:${running.port}/`);
      expect(res.status).toBe(200);
      expect(res.body).toContain('GoodNotes Templates');
    });
  });

  // FIND-0022: the critical POC. Symlink under output/ pointing outside
  // must return 403, not leak the target file.
  describe('FIND-0022 · symlink path-traversal', () => {
    it('returns 403 when the path is a symlink to outside the root', async () => {
      await symlink('/etc', path.join(outputDir, 'pwn'));
      running = await spawnServer(outputDir);

      const res = await get(`http://127.0.0.1:${running.port}/pwn/passwd`);
      expect(res.status).toBe(403);
      expect(res.body).toBe('Forbidden');
    });

    it('still serves files when an intermediate directory is a symlink to inside the root', async () => {
      // Realpath check confirms the file stays inside absDir; lstat only
      // blocks the *leaf*. This is the correct behavior — symlinks that
      // resolve inside the root are legitimate (e.g. `output/current` ->
      // `output/builds/2026-04-18`). The symlink-escape test above covers
      // the actual attack: a symlink to outside the root.
      await mkdir(path.join(outputDir, 'real'));
      await writeFile(path.join(outputDir, 'real', 'ok.txt'), 'hello');
      await symlink(path.join(outputDir, 'real'), path.join(outputDir, 'alias'));
      running = await spawnServer(outputDir);

      const res = await get(`http://127.0.0.1:${running.port}/alias/ok.txt`);
      expect(res.status).toBe(200);
      expect(res.body).toBe('hello');
    });

    it('returns 403 when a directory component is a symlink that escapes the root', async () => {
      // Attacker creates output/escape -> /etc, then asks for a file inside.
      // realpath resolves to /etc/passwd, prefix check rejects it.
      await symlink('/etc', path.join(outputDir, 'escape'));
      running = await spawnServer(outputDir);

      const res = await get(`http://127.0.0.1:${running.port}/escape/hosts`);
      expect(res.status).toBe(403);
    });
  });

  // FIND-0023: reject NUL byte + backslash in decoded path.
  describe('FIND-0023 · rejects NUL + backslash', () => {
    it('returns 400 for %00 in the path', async () => {
      running = await spawnServer(outputDir);
      const res = await get(`http://127.0.0.1:${running.port}/%00`);
      expect(res.status).toBe(400);
      expect(res.body).toBe('Bad Request');
    });

    it('returns 400 for backslash in the path', async () => {
      running = await spawnServer(outputDir);
      const res = await get(`http://127.0.0.1:${running.port}/%5Ctest`);
      expect(res.status).toBe(400);
    });
  });

  // Traversal via `../` is blocked by path.resolve staying inside absDir.
  describe('· parent-dir traversal is blocked', () => {
    it('returns 403 or 404 for ../etc/passwd (the URL normalises to /etc/passwd)', async () => {
      running = await spawnServer(outputDir);
      const res = await get(`http://127.0.0.1:${running.port}/../etc/passwd`);
      expect([403, 404]).toContain(res.status);
    });
  });

  // FIND-0021: caching headers + 304 on revisit.
  describe('FIND-0021 · ETag + 304', () => {
    it('returns ETag on 200 and 304 on matching If-None-Match', async () => {
      const filePath = path.join(outputDir, 'test.png');
      await writeFile(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
      running = await spawnServer(outputDir);

      const first = await get(`http://127.0.0.1:${running.port}/test.png`);
      expect(first.status).toBe(200);
      const etag = first.headers.get('etag');
      expect(etag).toBeTruthy();
      expect(first.headers.get('cache-control')).toContain('max-age=60');

      const second = await get(`http://127.0.0.1:${running.port}/test.png`, {
        'If-None-Match': etag!,
      });
      expect(second.status).toBe(304);
      expect(second.body).toBe('');
    });
  });

  // FIND-0002 — filename that contains a quote must be HTML-escaped.
  describe('FIND-0002 · gallery escapes single quotes in filenames', () => {
    it('HTML-escapes a filename that contains a single quote', async () => {
      await writeFile(path.join(outputDir, "weird'name.pdf"), '%PDF-1.7\n');
      running = await spawnServer(outputDir);

      const res = await get(`http://127.0.0.1:${running.port}/`);
      expect(res.status).toBe(200);
      expect(res.body).toContain('&#39;');
      expect(res.body).not.toMatch(/alt="[^"]*'[^"]*"/);
    });
  });
});
