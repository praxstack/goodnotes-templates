#!/usr/bin/env python3
"""Enrich the assembled graph with semantic edges that the deterministic
phase-2 driver would not produce by itself: configures, documents, deploys,
triggers, tested_by, defines_schema, related.

Reads .understand-anything/intermediate/assembled-graph.json and writes back
the same file with extra edges appended (deduplicated).
"""
import json
import os
import sys
import re
from pathlib import Path

PROJECT_ROOT = Path(sys.argv[1]).resolve()
INTER = PROJECT_ROOT / '.understand-anything' / 'intermediate'
ASSEMBLED = INTER / 'assembled-graph.json'

graph = json.loads(ASSEMBLED.read_text())
nodes = graph['nodes']
edges = graph['edges']
node_by_id = {n['id']: n for n in nodes}
node_by_path = {n['filePath']: n for n in nodes if n.get('filePath')}

W = {
    'contains': 1.0, 'inherits': 0.9, 'implements': 0.9,
    'calls': 0.8, 'exports': 0.8, 'defines_schema': 0.8,
    'imports': 0.7, 'deploys': 0.7, 'migrates': 0.7,
    'serves': 0.7, 'provisions': 0.7,
    'depends_on': 0.6, 'configures': 0.6, 'triggers': 0.6, 'routes': 0.6,
    'tested_by': 0.5, 'documents': 0.5, 'related': 0.5,
}

existing = set((e['source'], e['target'], e['type']) for e in edges)
def add_edge(src, tgt, etype):
    if src == tgt: return False
    if src not in node_by_id or tgt not in node_by_id: return False
    key = (src, tgt, etype)
    if key in existing: return False
    edges.append({'source': src, 'target': tgt, 'type': etype, 'direction': 'forward', 'weight': W[etype]})
    existing.add(key)
    return True

# ---------- 1. configures: tsconfig.json → all .ts/.tsx in same package ----------
configures_added = 0
for n in [x for x in nodes if x['type'] == 'config' and x.get('filePath')]:
    fp = n['filePath']
    base = os.path.basename(fp)
    pkg_dir = os.path.dirname(fp)
    if base.startswith('tsconfig') and base.endswith('.json'):
        # Configures all TS/TSX in same package
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if not tp: continue
            if tgt['type'] != 'file': continue
            if not (tp.endswith(('.ts', '.tsx', '.mts', '.cts')) or tp.endswith('.astro')): continue
            # Same package: tp is in or under pkg_dir
            if pkg_dir == '' or tp.startswith(pkg_dir + '/') or tp == pkg_dir:
                if add_edge(n['id'], tgt['id'], 'configures'):
                    configures_added += 1
    elif base == 'package.json':
        # Configures the package's entry point if present
        pkg_json_path = PROJECT_ROOT / fp
        try:
            pkg = json.loads(pkg_json_path.read_text())
            entries = []
            if pkg.get('main'): entries.append(pkg['main'])
            if pkg.get('module'): entries.append(pkg['module'])
            if pkg.get('bin'):
                if isinstance(pkg['bin'], dict): entries.extend(pkg['bin'].values())
                else: entries.append(pkg['bin'])
            for entry in entries:
                # entry may be 'dist/index.js' — map to src/index.ts
                if not isinstance(entry, str): continue
                stem = entry.replace('./dist/', './src/').replace('.js', '')
                stem = stem.lstrip('./')
                candidate_paths = [
                    f'{pkg_dir}/{stem}.ts'.lstrip('/'),
                    f'{pkg_dir}/{stem}.tsx'.lstrip('/'),
                    f'{pkg_dir}/{stem}/index.ts'.lstrip('/'),
                ]
                for cp in candidate_paths:
                    if cp in node_by_path:
                        tgt = node_by_path[cp]
                        if add_edge(n['id'], tgt['id'], 'configures'):
                            configures_added += 1
                        break
        except Exception: pass
    elif base in ('vitest.config.ts', 'vitest.visual.config.ts'):
        # Configures test files
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if tp.startswith('tests/') and tp.endswith(('.test.ts', '.spec.ts')):
                if add_edge(n['id'], tgt['id'], 'configures'):
                    configures_added += 1
    elif base == 'playwright.config.ts':
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if tp.startswith('tests/e2e/') and tp.endswith('.ts'):
                if add_edge(n['id'], tgt['id'], 'configures'):
                    configures_added += 1
    elif base == 'eslint.config.js':
        # Configures all source code
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if tp.endswith(('.ts', '.tsx', '.mjs')) and not tp.startswith(('audit/', 'docs/', 'tests/visual/baselines/')):
                if add_edge(n['id'], tgt['id'], 'configures'):
                    configures_added += 1
    elif base == 'astro.config.mjs':
        # Configures all .astro files
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if tp.startswith('apps/gallery/') and (tp.endswith('.astro') or tp.endswith('.ts')):
                if add_edge(n['id'], tgt['id'], 'configures'):
                    configures_added += 1
    elif base == 'vercel.json':
        # Configures the gallery app
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if tp == 'apps/gallery/astro.config.mjs' or tp == 'apps/gallery/package.json':
                if add_edge(n['id'], tgt['id'], 'configures'):
                    configures_added += 1

# ---------- 2. documents: README.md → package; CHANGELOG → package ----------
documents_added = 0
for n in [x for x in nodes if x['type'] == 'document' and x.get('filePath')]:
    fp = n['filePath']
    base = os.path.basename(fp).lower()
    pkg_dir = os.path.dirname(fp)
    if base in ('readme.md', 'readme.rst'):
        # Document the package's pkg.json + entry
        for cand in [f'{pkg_dir}/package.json'.lstrip('/'),
                     f'{pkg_dir}/src/index.ts'.lstrip('/'),
                     f'{pkg_dir}/src/index.tsx'.lstrip('/')]:
            if cand in node_by_path:
                if add_edge(n['id'], node_by_path[cand]['id'], 'documents'):
                    documents_added += 1
        # Document files under the same dir
        if pkg_dir:
            for tgt in nodes:
                tp = tgt.get('filePath', '')
                if tp.startswith(pkg_dir + '/') and tp != fp and tgt['type'] in ('file', 'config'):
                    if 'src/' in tp[len(pkg_dir)+1:][:5] or pkg_dir.startswith('packages/packs-'):
                        # only document the immediate package, not deep src files (cap by depth)
                        depth = tp.count('/') - pkg_dir.count('/')
                        if depth <= 2:
                            if add_edge(n['id'], tgt['id'], 'documents'):
                                documents_added += 1
    elif 'changelog' in base:
        # Document the package's index file
        for cand in [f'{pkg_dir}/package.json'.lstrip('/')]:
            if cand in node_by_path:
                if add_edge(n['id'], node_by_path[cand]['id'], 'documents'):
                    documents_added += 1
    elif fp.startswith('docs/'):
        # Top-level docs documenting the project README/main configs
        if 'package.json' in node_by_path:
            if add_edge(n['id'], node_by_path['package.json']['id'], 'documents'):
                documents_added += 1
    elif fp.startswith('audit/'):
        # Audit docs document the codebase (link to root README)
        if 'README.md' in node_by_path:
            if add_edge(n['id'], node_by_path['README.md']['id'], 'documents'):
                documents_added += 1

# ---------- 3. CI pipelines: triggers + deploys ----------
triggers_added = 0
deploys_added = 0
for n in [x for x in nodes if x['type'] == 'pipeline' and x.get('filePath')]:
    fp = n['filePath']
    try:
        content = (PROJECT_ROOT / fp).read_text()
    except: content = ''
    base = os.path.basename(fp).lower()
    # ci.yml runs tests
    if base == 'ci.yml':
        # triggers vitest configs and playwright config
        for cfg in ['vitest.config.ts', 'vitest.visual.config.ts', 'playwright.config.ts']:
            if cfg in node_by_path:
                if add_edge(n['id'], node_by_path[cfg]['id'], 'triggers'):
                    triggers_added += 1
        # triggers test directories
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if tp.startswith('tests/') and tp.endswith('.ts'):
                if add_edge(n['id'], tgt['id'], 'triggers'):
                    triggers_added += 1
    elif base == 'audit.yml':
        if 'scripts/audit.sh' in node_by_path:
            if add_edge(n['id'], node_by_path['scripts/audit.sh']['id'], 'triggers'):
                triggers_added += 1
        # And every audit doc
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if tp.startswith('audit/') and tgt['type'] == 'document':
                if add_edge(n['id'], tgt['id'], 'triggers'):
                    triggers_added += 1
    elif base == 'generate.yml':
        # Triggers all build scripts
        for tgt in nodes:
            tp = tgt.get('filePath', '')
            if tp.startswith('scripts/') and tp.endswith(('.ts', '.sh')):
                if add_edge(n['id'], tgt['id'], 'triggers'):
                    triggers_added += 1

# ---------- 4. service: Dev container deploys/configures ----------
service_added = 0
for n in [x for x in nodes if x['type'] == 'service' and x.get('filePath')]:
    fp = n['filePath']
    if fp.startswith('.devcontainer/'):
        # configures the package.json
        for cand in ['package.json']:
            if cand in node_by_path:
                if add_edge(n['id'], node_by_path[cand]['id'], 'deploys'):
                    service_added += 1

# ---------- 5. tested_by: production file → test file by name pattern ----------
tested_by_added = 0
test_files = [n for n in nodes if n['type'] == 'file' and n.get('filePath', '').startswith('tests/') and n['filePath'].endswith(('.test.ts', '.spec.ts'))]
for tn in test_files:
    tp = tn['filePath']
    base = os.path.basename(tp)
    # Strip .test.ts or .spec.ts to find the production file stem
    stem = base.replace('.test.ts', '').replace('.spec.ts', '')
    # search for a production file whose basename matches stem
    candidates = []
    for n in nodes:
        if n['type'] != 'file': continue
        np = n.get('filePath', '')
        if np.startswith('tests/'): continue
        if np.endswith(('.test.ts', '.spec.ts')): continue
        nbase = os.path.basename(np)
        nstem = nbase.replace('.ts', '').replace('.tsx', '').replace('.js', '')
        if nstem == stem:
            candidates.append(n)
    # Use first match
    if candidates:
        if add_edge(candidates[0]['id'], tn['id'], 'tested_by'):
            tested_by_added += 1

# ---------- 6. registry.json + manifest.json define_schema for packs ----------
defines_schema_added = 0
for n in [x for x in nodes if x['type'] == 'config' and os.path.basename(x.get('filePath', '')) == 'manifest.json']:
    fp = n['filePath']
    pkg_dir = os.path.dirname(fp)
    # If there's a generate.ts in the same dir, manifest defines its schema
    cand = f'{pkg_dir}/generate.ts'
    if cand in node_by_path:
        if add_edge(n['id'], node_by_path[cand]['id'], 'defines_schema'):
            defines_schema_added += 1

# ---------- 7. related: pack manifests in same series (tactile, packs-*) ----------
related_added = 0
tactile_packs = [n for n in nodes if n.get('filePath', '').startswith('packages/packs-tactile-') and os.path.basename(n['filePath']) == 'manifest.json']
for i, a in enumerate(tactile_packs):
    for b in tactile_packs[i+1:]:
        if add_edge(a['id'], b['id'], 'related'):
            related_added += 1

# ---------- Save ----------
graph['edges'] = edges
ASSEMBLED.write_text(json.dumps(graph, indent=2))
print(f"[edge-enrich] +configures: {configures_added}", file=sys.stderr)
print(f"[edge-enrich] +documents: {documents_added}", file=sys.stderr)
print(f"[edge-enrich] +triggers: {triggers_added}", file=sys.stderr)
print(f"[edge-enrich] +deploys: {service_added}", file=sys.stderr)
print(f"[edge-enrich] +tested_by: {tested_by_added}", file=sys.stderr)
print(f"[edge-enrich] +defines_schema: {defines_schema_added}", file=sys.stderr)
print(f"[edge-enrich] +related: {related_added}", file=sys.stderr)
print(f"[edge-enrich] total edges: {len(edges)}", file=sys.stderr)
