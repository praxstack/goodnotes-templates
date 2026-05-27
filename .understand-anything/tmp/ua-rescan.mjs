#!/usr/bin/env node
// Scanner v2 — preserves the existing scan-result.json structure but with a
// far more accurate importMap that handles:
//   * workspace package aliases (@praxlannister/pretext-core/foo → packages/core/src/foo.ts)
//   * package.json exports map (./dimensions → packages/core/src/dimensions.ts)
//   * .js → .ts source fallback (TypeScript "type": "module" projects compile .ts → .js)
//   * Astro frontmatter imports (between leading --- delimiters)
//   * MDX imports (top-of-file ESM)
//   * tsconfig path aliases (already supported in v1)
//
// Reads the existing scan-result.json file list (so we keep the same node
// inventory) and rewrites only the importMap field.
//
// Usage: node ua-rescan.mjs <projectRoot>

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ROOT = process.argv[2];
const SCAN_PATH = path.join(PROJECT_ROOT, '.understand-anything', 'intermediate', 'scan-result.json');
const scan = JSON.parse(fs.readFileSync(SCAN_PATH, 'utf-8'));

// ----- Build workspace package map (name → packageDir) -----
const workspaces = new Map();      // name → packageDir
const workspaceExports = new Map(); // name → { subpathPattern → fileTarget }
for (const f of scan.files) {
  if (path.basename(f.path) !== 'package.json') continue;
  if (f.path.includes('node_modules/')) continue;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, f.path), 'utf-8'));
    if (!pkg.name) continue;
    const pkgDir = path.posix.dirname(f.path);
    workspaces.set(pkg.name, pkgDir);
    // Build export map; map dist/* → src/*
    const exp = pkg.exports || {};
    const map = new Map();
    for (const [key, val] of Object.entries(exp)) {
      // Pull the first .js path
      let target;
      if (typeof val === 'string') target = val;
      else if (val && typeof val === 'object') target = val.import || val.default || val.types;
      if (!target || typeof target !== 'string') continue;
      // dist/foo.js → src/foo (we'll probe extensions)
      const srcTarget = target
        .replace(/^\.\/dist\//, './src/')
        .replace(/\.js$/, '');
      map.set(key, srcTarget);
    }
    if (map.size > 0) workspaceExports.set(pkg.name, map);
    else if (pkg.main) {
      // Default to src/index for packages with no exports map
      const srcTarget = pkg.main
        .replace(/^\.?\/?dist\//, './src/')
        .replace(/\.js$/, '');
      workspaceExports.set(pkg.name, new Map([['.', srcTarget]]));
    }
  } catch {}
}

// ----- File set -----
const fileSet = new Set(scan.files.map(f => f.path));
const fileByLowerName = new Map();
for (const p of fileSet) fileByLowerName.set(p.toLowerCase(), p);

const SRC_EXT_PROBES = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
const INDEX_EXT_PROBES = ['/index.ts', '/index.tsx', '/index.mts', '/index.js', '/index.jsx', '/index.mjs'];

function probeFile(basePath) {
  // basePath has no extension; try in order
  if (fileSet.has(basePath)) return basePath;
  for (const ext of SRC_EXT_PROBES) {
    const p = basePath + ext;
    if (fileSet.has(p)) return p;
  }
  for (const ext of INDEX_EXT_PROBES) {
    const p = basePath + ext;
    if (fileSet.has(p)) return p;
  }
  return null;
}

function probeWithJsFallback(basePath) {
  // basePath has an extension. If exact, return. If .js, also try .ts/.tsx.
  if (fileSet.has(basePath)) return basePath;
  const m = basePath.match(/\.(j|c|m)?js$/);
  if (m) {
    const stem = basePath.slice(0, -m[0].length);
    for (const ext of ['.ts', '.tsx', '.mts', '.cts']) {
      const p = stem + ext;
      if (fileSet.has(p)) return p;
    }
  }
  // Also try removing the extension and probing
  const stem = basePath.replace(/\.[^./]+$/, '');
  if (stem !== basePath) {
    const probed = probeFile(stem);
    if (probed) return probed;
  }
  return null;
}

// ----- tsconfig path aliases -----
function loadAliases() {
  const map = new Map();
  for (const f of scan.files) {
    if (path.basename(f.path) !== 'tsconfig.json' && f.path !== 'tsconfig.base.json') continue;
    try {
      let raw = fs.readFileSync(path.join(PROJECT_ROOT, f.path), 'utf-8');
      raw = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/,(\s*[}\]])/g, '$1');
      const cfg = JSON.parse(raw);
      const co = cfg.compilerOptions || {};
      const baseUrl = co.baseUrl || '.';
      const paths = co.paths || {};
      const dir = path.posix.dirname(f.path);
      for (const [alias, targets] of Object.entries(paths)) {
        const prefix = alias.replace(/\*$/, '');
        const resolved = (Array.isArray(targets) ? targets : [targets]).map(t => {
          const cleaned = String(t).replace(/\*$/, '');
          return path.posix.normalize(path.posix.join(dir, baseUrl, cleaned));
        });
        if (!map.has(prefix)) map.set(prefix, resolved);
      }
    } catch {}
  }
  return map;
}
const aliasMap = loadAliases();

// ----- Resolution -----
function resolveSpec(fromFile, spec) {
  // 1. Workspace package
  for (const [pkgName, pkgDir] of workspaces) {
    if (spec === pkgName || spec.startsWith(pkgName + '/')) {
      const subpath = spec === pkgName ? '.' : './' + spec.slice(pkgName.length + 1);
      const exports = workspaceExports.get(pkgName);
      if (exports && exports.has(subpath)) {
        const target = exports.get(subpath);
        // target like './src/dimensions' (no ext); resolve relative to pkgDir
        const resolved = path.posix.normalize(path.posix.join(pkgDir, target));
        const probed = probeWithJsFallback(resolved) || probeFile(resolved);
        if (probed) return probed;
      }
      // Pattern match (e.g. "./assets/themes/*")
      if (exports) {
        for (const [key, target] of exports) {
          if (key.endsWith('/*') && subpath.startsWith(key.slice(0, -2))) {
            const tail = subpath.slice(key.length - 1);
            const fullTarget = target.replace(/\*$/, tail);
            const resolved = path.posix.normalize(path.posix.join(pkgDir, fullTarget));
            const probed = probeWithJsFallback(resolved) || probeFile(resolved);
            if (probed) return probed;
          }
        }
      }
      // Fallback: try src/<subpath>
      const fallback = path.posix.normalize(path.posix.join(pkgDir, 'src', subpath === '.' ? 'index' : subpath));
      const probed = probeWithJsFallback(fallback) || probeFile(fallback);
      if (probed) return probed;
      return null;
    }
  }

  // 2. tsconfig path aliases
  for (const [prefix, targets] of aliasMap) {
    if (spec.startsWith(prefix)) {
      const rest = spec.slice(prefix.length);
      for (const t of targets) {
        const candidate = path.posix.normalize(path.posix.join(t, rest));
        const probed = probeWithJsFallback(candidate) || probeFile(candidate);
        if (probed) return probed;
      }
    }
  }

  // 3. Relative imports
  if (spec.startsWith('.')) {
    const baseDir = path.posix.dirname(fromFile);
    const joined = path.posix.normalize(path.posix.join(baseDir, spec));
    return probeWithJsFallback(joined) || probeFile(joined);
  }

  // 4. External package — drop
  return null;
}

// ----- Extract specs from various languages -----
function extractTsImports(src) {
  const out = new Set();
  // import ... from '…'   |   import '…'   |   import('…')
  const reImport = /\bimport\s+(?:[^'"`;]+\s+from\s+)?['"]([^'"]+)['"]/g;
  const reRequire = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  const reDynamic = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  // export ... from '…'
  const reExportFrom = /\bexport\s+(?:[*{][^'"`;]*?from\s+)?['"]([^'"]+)['"]/g;
  for (const re of [reImport, reRequire, reDynamic, reExportFrom]) {
    let m;
    while ((m = re.exec(src)) !== null) out.add(m[1]);
  }
  return [...out];
}

function extractAstroImports(src) {
  // Astro frontmatter is between leading "---\n" and the next "\n---\n"
  if (!src.startsWith('---')) return [];
  const end = src.indexOf('\n---', 3);
  if (end < 0) return [];
  const fm = src.slice(3, end);
  return extractTsImports(fm);
}

function extractMdxImports(src) {
  // MDX has ESM imports/exports in flat top-of-file blocks
  return extractTsImports(src);
}

// ----- Main -----
const importMap = {};
let totalImports = 0;
let filesWithImports = 0;

for (const f of scan.files) {
  const rel = f.path;
  importMap[rel] = [];

  // Decide which specs to extract by language
  const lang = f.language;
  const ext = path.extname(rel).toLowerCase();
  const lowerName = path.basename(rel).toLowerCase();
  const isAstro = ext === '.astro';
  const isMdx = ext === '.mdx';
  const isCode = ['typescript', 'javascript'].includes(lang) || ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'].includes(ext);

  if (!isAstro && !isMdx && !isCode) continue;

  let src;
  try { src = fs.readFileSync(path.join(PROJECT_ROOT, rel), 'utf-8'); } catch { continue; }

  const specs = isAstro ? extractAstroImports(src) : extractTsImports(src);

  const resolved = new Set();
  for (const s of specs) {
    const r = resolveSpec(rel, s);
    if (r && r !== rel) resolved.add(r);
  }
  importMap[rel] = [...resolved];
  if (resolved.size > 0) filesWithImports++;
  totalImports += resolved.size;
}

scan.importMap = importMap;
fs.writeFileSync(SCAN_PATH, JSON.stringify(scan, null, 2));

console.error(`[rescan] wrote ${SCAN_PATH}`);
console.error(`[rescan] workspaces: ${workspaces.size} (${[...workspaces.keys()].join(', ')})`);
console.error(`[rescan] tsconfig aliases: ${aliasMap.size}`);
console.error(`[rescan] total resolved imports: ${totalImports}`);
console.error(`[rescan] files with at least 1 import: ${filesWithImports}`);
