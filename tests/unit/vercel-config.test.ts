/**
 * tests/unit/vercel-config.test.ts
 *
 * Contract test for the repo-root `vercel.json`.
 *
 * Why this exists
 * ---------------
 * T-005 (FIND-I4-005) shipped security headers in `vercel.json` at commit
 * `d8c46dd`, but a live `curl -I https://pretext-templates.vercel.app/`
 * returned none of the four expected headers. Root cause: the deploy flow
 * used `vercel --cwd=dist` (from `apps/gallery/dist/`) which only uploads
 * the gallery output directory — the repo-root `vercel.json` was never part
 * of the deploy surface, so Vercel had no headers config to honor.
 *
 * This test pins the vercel.json CONFIG SHAPE so a future edit that
 * silently breaks it (missing header, wrong source glob, empty value) fails
 * CI instead of silently shipping through.
 *
 * A separate shell smoke test (`scripts/smoke-prod-headers.sh`) asserts the
 * headers actually land in prod after deploy. This test asserts the local
 * config; that test asserts the live delivery. Together they close the
 * "code shipped ≠ prod honors it" gap.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const VERCEL_JSON = path.join(REPO_ROOT, 'vercel.json');

type HeaderRule = {
  source: string;
  headers: Array<{ key: string; value: string }>;
};

type VercelConfig = {
  headers?: HeaderRule[];
};

function loadConfig(): VercelConfig {
  const raw = readFileSync(VERCEL_JSON, 'utf8');
  return JSON.parse(raw) as VercelConfig;
}

function findHeader(rules: HeaderRule[] | undefined, source: string, key: string): string | undefined {
  const rule = (rules ?? []).find((r) => r.source === source);
  if (!rule) return undefined;
  const hdr = rule.headers.find((h) => h.key === key);
  return hdr?.value;
}

describe('vercel.json · T-005 security headers (FIND-I4-005)', () => {
  const REQUIRED_HEADERS = [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ] as const;

  it('file exists at repo root and parses as JSON', () => {
    expect(() => loadConfig()).not.toThrow();
  });

  it('declares a global `/(.*)`  headers rule', () => {
    const cfg = loadConfig();
    const global = (cfg.headers ?? []).find((r) => r.source === '/(.*)');
    expect(global, 'expected a headers rule with source "/(.*)"').toBeDefined();
    expect(Array.isArray(global!.headers)).toBe(true);
    expect(global!.headers.length).toBeGreaterThanOrEqual(4);
  });

  it.each(REQUIRED_HEADERS)('sets %s on the global rule with a non-empty value', (key) => {
    const cfg = loadConfig();
    const val = findHeader(cfg.headers, '/(.*)', key);
    expect(val, `${key} must be set`).toBeDefined();
    expect(val!.length, `${key} must not be empty`).toBeGreaterThan(0);
  });

  it('CSP value names the core directives we rely on (defense-in-depth contract)', () => {
    const cfg = loadConfig();
    const csp = findHeader(cfg.headers, '/(.*)', 'Content-Security-Policy')!;
    // We pin DIRECTIVES — not their exact value — so the test survives sensible
    // tightening (dropping `'unsafe-inline'` on `script-src` in the follow-up).
    for (const directive of [
      'default-src',
      'script-src',
      'style-src',
      'font-src',
      'img-src',
      'frame-ancestors',
      'base-uri',
      'object-src',
    ]) {
      expect(csp, `CSP should name ${directive}`).toContain(directive);
    }
  });

  it('X-Content-Type-Options is exactly "nosniff"', () => {
    const cfg = loadConfig();
    expect(findHeader(cfg.headers, '/(.*)', 'X-Content-Type-Options')).toBe('nosniff');
  });

  it('Referrer-Policy is a known-safe value', () => {
    const cfg = loadConfig();
    const val = findHeader(cfg.headers, '/(.*)', 'Referrer-Policy')!;
    // Safest family: `no-referrer` · `strict-origin` · `strict-origin-when-cross-origin`.
    // We allow any of those; reject `unsafe-url` / `origin` / `origin-when-cross-origin`
    // (those leak the path across schemes).
    expect(['no-referrer', 'strict-origin', 'strict-origin-when-cross-origin']).toContain(val);
  });

  it('Permissions-Policy locks down camera/microphone/geolocation at minimum', () => {
    const cfg = loadConfig();
    const val = findHeader(cfg.headers, '/(.*)', 'Permissions-Policy')!;
    for (const feat of ['camera', 'microphone', 'geolocation']) {
      expect(val).toMatch(new RegExp(`${feat}=\\(\\)`));
    }
  });

  it('PDF-scoped rule forces Content-Type and nosniff', () => {
    // Prevents a misrouted HTML file from being sniffed as a PDF. Matches
    // the rule at source `/(.*)\\.pdf` in the config.
    const cfg = loadConfig();
    expect(findHeader(cfg.headers, '/(.*)\\.pdf', 'Content-Type')).toBe('application/pdf');
    expect(findHeader(cfg.headers, '/(.*)\\.pdf', 'X-Content-Type-Options')).toBe('nosniff');
  });
});
