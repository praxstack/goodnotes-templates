#!/usr/bin/env node
// Project scanner — implements project-scanner agent contract deterministically.
// Usage: node ua-project-scan.mjs <projectRoot> <outputJsonPath>

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ROOT = process.argv[2];
const OUT_PATH = process.argv[3];
if (!PROJECT_ROOT || !OUT_PATH) {
  console.error('Usage: ua-project-scan.mjs <projectRoot> <outputJsonPath>');
  process.exit(1);
}

// ---------- Step 1: file discovery (git ls-files preferred) ----------
function discoverFiles(root) {
  try {
    const out = execSync('git ls-files', { cwd: root, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
    return out.split('\n').map(s => s.trim()).filter(Boolean);
  } catch {
    // fallback to recursive listing
    const out = [];
    function walk(dir, rel) {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (e.name === '.git' || e.name === 'node_modules') continue;
        const full = path.join(dir, e.name);
        const r = rel ? path.join(rel, e.name) : e.name;
        if (e.isDirectory()) walk(full, r);
        else if (e.isFile()) out.push(r);
      }
    }
    walk(root, '');
    return out;
  }
}

// ---------- Step 2: hardcoded default exclusions ----------
const DEFAULT_DIR_SEGMENTS = new Set([
  'node_modules', '.git', 'vendor', 'venv', '.venv', '__pycache__',
  'dist', 'build', 'out', 'coverage', '.next', '.cache', '.turbo', 'target', 'obj',
  '.idea', '.vscode'
]);
const DEFAULT_FILE_SUFFIX_EXCLUDES = [
  '.lock', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.pdf',
  '.zip', '.tar', '.gz', '.min.js', '.min.css', '.map', '.log'
];
const DEFAULT_FILE_NAME_EXCLUDES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.gitignore',
  '.editorconfig', '.prettierrc', '.DS_Store', 'Thumbs.db'
]);
function defaultExcluded(rel) {
  const segs = rel.split('/');
  for (const s of segs.slice(0, -1)) {
    if (DEFAULT_DIR_SEGMENTS.has(s)) return true;
  }
  const base = segs[segs.length - 1];
  if (DEFAULT_FILE_NAME_EXCLUDES.has(base)) return true;
  if (base === 'LICENSE') return true;
  if (base.startsWith('.eslintrc')) return true;
  if (base.startsWith('npm-debug.log')) return true;
  if (base.endsWith('.generated.json') || base.includes('.generated.')) return true;
  for (const sfx of DEFAULT_FILE_SUFFIX_EXCLUDES) {
    if (base.endsWith(sfx)) return true;
  }
  return false;
}

// ---------- Step 2.5: .understandignore (basic gitignore-style matcher) ----------
// Minimal matcher: support glob patterns relative to root, trailing-slash directory patterns,
// and `!` negation override. Ordered: later rules override earlier ones.
function loadIgnorePatterns(root) {
  const files = [
    path.join(root, '.understand-anything', '.understandignore'),
    path.join(root, '.understandignore'),
  ];
  const patterns = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const lines = fs.readFileSync(f, 'utf-8').split('\n');
    for (const raw of lines) {
      const line = raw.replace(/\r$/, '').trim();
      if (!line || line.startsWith('#')) continue;
      patterns.push(line);
    }
  }
  return patterns;
}
function patternToRegex(p) {
  // strip leading '/'
  let neg = false;
  if (p.startsWith('!')) { neg = true; p = p.slice(1); }
  let dirOnly = false;
  if (p.endsWith('/')) { dirOnly = true; p = p.slice(0, -1); }
  let anchored = false;
  if (p.startsWith('/')) { anchored = true; p = p.slice(1); }
  // escape regex
  let re = '';
  let i = 0;
  while (i < p.length) {
    const c = p[i];
    if (c === '*') {
      if (p[i + 1] === '*') { re += '.*'; i += 2; if (p[i] === '/') { i++; } }
      else { re += '[^/]*'; i++; }
    } else if (c === '?') { re += '[^/]'; i++; }
    else if ('.+^$(){}|\\'.includes(c)) { re += '\\' + c; i++; }
    else { re += c; i++; }
  }
  if (anchored) re = '^' + re;
  else re = '(^|.*/)' + re;
  re += dirOnly ? '/' : '($|/.*)';
  return { regex: new RegExp(re), neg };
}
function appliesPatterns(patterns, rel) {
  let included = true; // start as included; defaults already handled
  for (const p of patterns) {
    const { regex, neg } = patternToRegex(p);
    const target = rel + (rel.endsWith('/') ? '' : '');
    if (regex.test(target) || regex.test(target + '/')) {
      included = neg ? true : false;
    }
  }
  return included;
}

// ---------- Step 3: language detection ----------
const LANG_BY_EXT = {
  '.ts': 'typescript', '.tsx': 'typescript',
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.py': 'python',
  '.go': 'go', '.rs': 'rust', '.java': 'java', '.rb': 'ruby',
  '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.h': 'cpp', '.hpp': 'cpp',
  '.c': 'c', '.cs': 'csharp',
  '.swift': 'swift', '.kt': 'kotlin', '.php': 'php',
  '.vue': 'vue', '.svelte': 'svelte', '.astro': 'astro',
  '.sh': 'shell', '.bash': 'shell', '.ps1': 'powershell', '.bat': 'batch', '.cmd': 'batch',
  '.md': 'markdown', '.rst': 'markdown',
  '.yaml': 'yaml', '.yml': 'yaml',
  '.json': 'json', '.jsonc': 'jsonc',
  '.toml': 'toml', '.sql': 'sql',
  '.graphql': 'graphql', '.gql': 'graphql',
  '.proto': 'protobuf',
  '.tf': 'terraform', '.tfvars': 'terraform',
  '.html': 'html', '.htm': 'html',
  '.css': 'css', '.scss': 'css', '.sass': 'css', '.less': 'css',
  '.xml': 'xml',
  '.cfg': 'config', '.ini': 'config', '.env': 'config',
};
function detectLanguage(rel) {
  const base = path.basename(rel);
  if (base === 'Dockerfile' || base.startsWith('Dockerfile.')) return 'dockerfile';
  if (base === 'Makefile') return 'makefile';
  if (base === 'Jenkinsfile') return 'jenkinsfile';
  const ext = path.extname(base).toLowerCase();
  if (LANG_BY_EXT[ext]) return LANG_BY_EXT[ext];
  if (!ext) return 'unknown';
  return ext.slice(1).toLowerCase();
}

// ---------- Step 4: file category ----------
function detectCategory(rel) {
  const base = path.basename(rel);
  const ext = path.extname(base).toLowerCase();

  // infra (priority before config)
  if (base === 'Dockerfile' || base.startsWith('Dockerfile.')) return 'infra';
  if (base.startsWith('docker-compose.')) return 'infra';
  if (ext === '.tf' || ext === '.tfvars') return 'infra';
  if (base === 'Makefile' || base === 'Jenkinsfile' || base === 'Procfile' || base === 'Vagrantfile') return 'infra';
  if (rel.startsWith('.github/workflows/')) return 'infra';
  if (rel === '.gitlab-ci.yml' || rel.startsWith('.circleci/')) return 'infra';
  if (rel.includes('/k8s/') || rel.includes('/kubernetes/') || base.endsWith('.k8s.yaml') || base.endsWith('.k8s.yml')) return 'infra';
  if (rel.startsWith('.devcontainer/')) return 'infra';

  // data
  if (['.sql', '.graphql', '.gql', '.proto', '.prisma', '.csv'].includes(ext)) return 'data';
  if (base.endsWith('.schema.json')) return 'data';

  // script
  if (['.sh', '.bash', '.ps1', '.bat', '.cmd'].includes(ext)) return 'script';

  // markup
  if (['.html', '.htm', '.css', '.scss', '.sass', '.less'].includes(ext)) return 'markup';

  // docs
  if (['.md', '.rst', '.txt'].includes(ext) && base !== 'LICENSE') return 'docs';

  // config
  if (['.yaml', '.yml', '.json', '.jsonc', '.toml', '.xml', '.cfg', '.ini'].includes(ext)) return 'config';
  if (base === '.env' || base.startsWith('.env.')) return 'config';
  if (['package.json', 'tsconfig.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'go.sum'].includes(base)) return 'config';
  if (base === '.npmrc' || base === '.nvmrc' || base === '.node-version') return 'config';

  // default code
  return 'code';
}

// ---------- Step 5: line counting ----------
function countLines(absPath) {
  try {
    const buf = fs.readFileSync(absPath);
    let n = 0;
    for (let i = 0; i < buf.length; i++) if (buf[i] === 0x0a) n++;
    if (buf.length > 0 && buf[buf.length - 1] !== 0x0a) n++;
    return n;
  } catch {
    return 0;
  }
}

// ---------- Step 6: framework detection ----------
const JS_FRAMEWORKS = {
  'react': 'React', 'vue': 'Vue', 'svelte': 'Svelte', '@angular/core': 'Angular',
  'next': 'Next.js', 'nuxt': 'Nuxt', 'astro': 'Astro',
  'express': 'Express', 'fastify': 'Fastify', 'koa': 'Koa', 'hono': 'Hono',
  'vite': 'Vite', 'vitest': 'Vitest', 'jest': 'Jest', 'mocha': 'Mocha',
  'tailwindcss': 'Tailwind CSS', 'prisma': 'Prisma',
  'typeorm': 'TypeORM', 'sequelize': 'Sequelize', 'mongoose': 'Mongoose',
  'redux': 'Redux', 'zustand': 'Zustand', 'mobx': 'MobX',
  '@playwright/test': 'Playwright', 'playwright': 'Playwright',
  'puppeteer': 'Puppeteer', 'storybook': 'Storybook',
};
function detectFrameworks(root, files) {
  const frameworks = new Set();
  // Read package.json (root + workspaces)
  const pkgPaths = files.filter(f => path.basename(f) === 'package.json');
  for (const rel of pkgPaths) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf-8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}), ...(pkg.peerDependencies || {}) };
      for (const dep of Object.keys(deps)) {
        if (JS_FRAMEWORKS[dep]) frameworks.add(JS_FRAMEWORKS[dep]);
      }
    } catch {}
  }
  if (files.some(f => path.basename(f) === 'tsconfig.json' || f === 'tsconfig.base.json')) frameworks.add('TypeScript');
  if (files.some(f => path.basename(f) === 'pnpm-workspace.yaml' || path.basename(f) === 'pnpm-lock.yaml')) frameworks.add('pnpm');
  if (files.some(f => path.basename(f) === 'Dockerfile' || path.basename(f).startsWith('Dockerfile.'))) frameworks.add('Docker');
  if (files.some(f => path.basename(f).startsWith('docker-compose.'))) frameworks.add('Docker Compose');
  if (files.some(f => f.endsWith('.tf') || f.endsWith('.tfvars'))) frameworks.add('Terraform');
  if (files.some(f => f.startsWith('.github/workflows/') && (f.endsWith('.yml') || f.endsWith('.yaml')))) frameworks.add('GitHub Actions');
  if (files.some(f => f === '.gitlab-ci.yml')) frameworks.add('GitLab CI');
  if (files.some(f => path.basename(f) === 'Jenkinsfile')) frameworks.add('Jenkins');
  if (files.some(f => path.basename(f) === 'vercel.json')) frameworks.add('Vercel');
  if (files.some(f => path.basename(f) === 'netlify.toml')) frameworks.add('Netlify');
  return [...frameworks].sort();
}

// ---------- Step 8: project name ----------
function detectName(root, files) {
  const rootPkg = path.join(root, 'package.json');
  if (fs.existsSync(rootPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(rootPkg, 'utf-8'));
      if (pkg.name) return pkg.name;
    } catch {}
  }
  return path.basename(root);
}
function readRawDescription(root) {
  const rootPkg = path.join(root, 'package.json');
  if (fs.existsSync(rootPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(rootPkg, 'utf-8'));
      return pkg.description || '';
    } catch {}
  }
  return '';
}
function readReadmeHead(root) {
  for (const name of ['README.md', 'readme.md', 'README.rst']) {
    const p = path.join(root, name);
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf-8').split('\n').slice(0, 10).join('\n');
      return lines;
    }
  }
  return '';
}

// ---------- Step 9: import resolution ----------
const TS_EXT_PROBES = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
function resolveTsImport(fromFile, spec, fileSet, aliasMap, baseUrl) {
  // alias paths
  for (const [prefix, targets] of aliasMap) {
    if (spec.startsWith(prefix)) {
      const rest = spec.slice(prefix.length);
      for (const t of targets) {
        const candidate = path.posix.join(t, rest);
        for (const ext of TS_EXT_PROBES) {
          const probe = (candidate + ext).replace(/^\.\//, '');
          if (fileSet.has(probe)) return probe;
        }
      }
    }
  }
  if (!spec.startsWith('.')) return null; // external
  const baseDir = path.posix.dirname(fromFile);
  const joined = path.posix.normalize(path.posix.join(baseDir, spec));
  for (const ext of TS_EXT_PROBES) {
    const probe = joined + ext;
    if (fileSet.has(probe)) return probe;
  }
  return null;
}
function extractTsImports(src) {
  const out = new Set();
  const reImport = /\bimport\s+(?:[^'"`;]+\s+from\s+)?['"]([^'"]+)['"]/g;
  const reRequire = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
  const reDynamic = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const re of [reImport, reRequire, reDynamic]) {
    let m;
    while ((m = re.exec(src)) !== null) out.add(m[1]);
  }
  return [...out];
}
function loadAliases(root, files) {
  const map = new Map();
  let baseUrl = '.';
  for (const rel of files) {
    if (path.basename(rel) === 'tsconfig.json' || rel === 'tsconfig.base.json' || rel === 'tsconfig.json') {
      try {
        let raw = fs.readFileSync(path.join(root, rel), 'utf-8');
        // strip // line comments and /* */ block comments
        raw = raw.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const cfg = JSON.parse(raw);
        const co = cfg.compilerOptions || {};
        if (co.baseUrl) baseUrl = co.baseUrl;
        const paths = co.paths || {};
        const dir = path.posix.dirname(rel);
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
  }
  return { aliasMap: map, baseUrl };
}

// ---------- Main ----------
console.error('[scanner] discovering files...');
const allFiles = discoverFiles(PROJECT_ROOT);
console.error(`[scanner] git ls-files returned ${allFiles.length} entries`);

// step 2 default exclusions
const afterDefaults = allFiles.filter(f => !defaultExcluded(f));
console.error(`[scanner] after default exclusions: ${afterDefaults.length}`);

// step 2.5 user .understandignore
const userPatterns = loadIgnorePatterns(PROJECT_ROOT);
console.error(`[scanner] user .understandignore patterns: ${userPatterns.length}`);
const afterUser = userPatterns.length > 0
  ? afterDefaults.filter(f => appliesPatterns(userPatterns, f))
  : afterDefaults;
const filteredByIgnore = afterDefaults.length - afterUser.length;
console.error(`[scanner] after user ignore: ${afterUser.length} (filteredByIgnore=${filteredByIgnore})`);

// Filter: exists on disk
const finalFiles = afterUser.filter(f => {
  try { return fs.statSync(path.join(PROJECT_ROOT, f)).isFile(); } catch { return false; }
});
console.error(`[scanner] existing on disk: ${finalFiles.length}`);

// languages + categories + line counts
const languages = new Set();
const fileEntries = [];
for (const rel of finalFiles) {
  const lang = detectLanguage(rel);
  const cat = detectCategory(rel);
  const sizeLines = countLines(path.join(PROJECT_ROOT, rel));
  languages.add(lang);
  fileEntries.push({ path: rel, language: lang, sizeLines, fileCategory: cat });
}
fileEntries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

// frameworks
const frameworks = detectFrameworks(PROJECT_ROOT, finalFiles);

// complexity
let complexity;
const total = fileEntries.length;
if (total <= 30) complexity = 'small';
else if (total <= 150) complexity = 'moderate';
else if (total <= 500) complexity = 'large';
else complexity = 'very-large';

// imports (TS/JS only for this project)
const fileSet = new Set(fileEntries.map(e => e.path));
const { aliasMap, baseUrl } = loadAliases(PROJECT_ROOT, finalFiles);
const importMap = {};
for (const e of fileEntries) {
  if (e.fileCategory !== 'code') { importMap[e.path] = []; continue; }
  if (!['typescript', 'javascript'].includes(e.language)) { importMap[e.path] = []; continue; }
  let src;
  try { src = fs.readFileSync(path.join(PROJECT_ROOT, e.path), 'utf-8'); } catch { importMap[e.path] = []; continue; }
  const specs = extractTsImports(src);
  const resolved = new Set();
  for (const s of specs) {
    const r = resolveTsImport(e.path, s, fileSet, aliasMap, baseUrl);
    if (r) resolved.add(r);
  }
  importMap[e.path] = [...resolved];
}

// final
const result = {
  scriptCompleted: true,
  name: detectName(PROJECT_ROOT, finalFiles),
  rawDescription: readRawDescription(PROJECT_ROOT),
  readmeHead: readReadmeHead(PROJECT_ROOT),
  languages: [...languages].sort(),
  frameworks,
  files: fileEntries,
  totalFiles: fileEntries.length,
  filteredByIgnore,
  estimatedComplexity: complexity,
  importMap,
};
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
console.error(`[scanner] wrote ${OUT_PATH}`);
console.error(`[scanner] languages: ${result.languages.join(', ')}`);
console.error(`[scanner] frameworks: ${result.frameworks.join(', ')}`);
console.error(`[scanner] complexity: ${result.estimatedComplexity}`);
process.exit(0);
