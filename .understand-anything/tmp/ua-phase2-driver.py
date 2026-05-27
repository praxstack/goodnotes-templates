#!/usr/bin/env python3
"""
Phase 2 driver — runs extract-structure.mjs over every batch and emits
batch-<N>.json files matching the file-analyzer agent contract:
deterministic nodes/edges with template-generated summaries/tags.

Usage: python3 ua-phase2-driver.py <projectRoot>
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(sys.argv[1]).resolve()
PLUGIN_ROOT = Path(os.environ.get('PLUGIN_ROOT', '/Users/praxlannister/.understand-anything-plugin'))
SKILL_DIR = PLUGIN_ROOT / 'skills' / 'understand'
EXTRACT_SCRIPT = SKILL_DIR / 'extract-structure.mjs'
INTER = PROJECT_ROOT / '.understand-anything' / 'intermediate'
TMP = PROJECT_ROOT / '.understand-anything' / 'tmp'

# Edge weights per file-analyzer.md
W = {
    'contains': 1.0, 'inherits': 0.9, 'implements': 0.9,
    'calls': 0.8, 'exports': 0.8, 'defines_schema': 0.8,
    'imports': 0.7, 'deploys': 0.7, 'migrates': 0.7,
    'serves': 0.7, 'provisions': 0.7,
    'depends_on': 0.6, 'configures': 0.6, 'triggers': 0.6, 'routes': 0.6,
    'tested_by': 0.5, 'documents': 0.5, 'related': 0.5,
}

# Node-type prefix per the schema
def file_node_type(rel: str, lang: str, cat: str) -> tuple[str, str]:
    """Returns (nodeType, idPrefix)."""
    base = os.path.basename(rel)
    if cat == 'code': return ('file', 'file')
    if cat == 'docs': return ('document', 'document')
    if cat == 'config': return ('config', 'config')
    if cat == 'script': return ('file', 'file')
    if cat == 'markup': return ('file', 'file')
    if cat == 'data':
        if base.endswith('.sql'): return ('table', 'table')
        if base.endswith(('.graphql', '.gql')): return ('schema', 'schema')
        if base.endswith('.proto'): return ('schema', 'schema')
        if base.endswith('.prisma'): return ('schema', 'schema')
        if 'openapi' in base.lower() or 'swagger' in base.lower():
            return ('endpoint', 'endpoint')
        return ('schema', 'schema')
    if cat == 'infra':
        if base == 'Dockerfile' or base.startswith('Dockerfile.'): return ('service', 'service')
        if base.startswith('docker-compose.'): return ('service', 'service')
        if rel.startswith('.github/workflows/'): return ('pipeline', 'pipeline')
        if rel == '.gitlab-ci.yml' or rel.startswith('.circleci/'): return ('pipeline', 'pipeline')
        if base == 'Jenkinsfile': return ('pipeline', 'pipeline')
        if base.endswith(('.tf', '.tfvars')): return ('resource', 'resource')
        if '/k8s/' in rel or '/kubernetes/' in rel or base.endswith(('.k8s.yaml', '.k8s.yml')):
            return ('service', 'service')
        if rel.startswith('.devcontainer/'): return ('service', 'service')
        return ('service', 'service')
    return ('file', 'file')


def complexity_for(non_empty_lines: int, fn_count: int = 0, class_count: int = 0) -> str:
    if non_empty_lines is None: non_empty_lines = 0
    if non_empty_lines < 50 and fn_count + class_count < 3: return 'simple'
    if non_empty_lines <= 200: return 'moderate'
    return 'complex'


def summary_for_code_file(rel: str, lang: str, fn_count: int, class_count: int,
                          export_count: int, lines: int) -> str:
    base = os.path.basename(rel)
    if base in ('index.ts', 'index.tsx', 'index.js', 'index.jsx'):
        return (f"Barrel/entry-point file re-exporting public symbols of its directory "
                f"({export_count} exports, {fn_count} fns, {class_count} classes).")
    if base in ('main.ts', 'main.tsx', 'main.js'):
        return f"Application entry point that bootstraps the {lang} app ({lines} lines)."
    if '.test.' in base or '.spec.' in base or base.startswith('test_') or base.endswith(('_test.go', '_spec.rb')):
        return f"Test file containing {fn_count} test functions and {class_count} test fixtures."
    if 'config' in base.lower():
        return f"Configuration module exposing settings and tunables ({export_count} exports)."
    if class_count > fn_count and class_count > 0:
        return (f"{lang.capitalize()} module defining {class_count} class"
                f"{'es' if class_count != 1 else ''} (~{lines} lines).")
    if fn_count > 0:
        return (f"{lang.capitalize()} module exposing {fn_count} function"
                f"{'s' if fn_count != 1 else ''} and {export_count} export"
                f"{'s' if export_count != 1 else ''} ({lines} lines).")
    return f"{lang.capitalize()} source file ({lines} lines)."


def summary_for_doc(rel: str, sections: list, lines: int) -> str:
    n = len(sections or [])
    base = os.path.basename(rel)
    if base.lower() == 'readme.md':
        return f"Project README with {n} sections ({lines} lines) — primary entry-point documentation."
    if 'changelog' in base.lower():
        return f"Changelog tracking releases and notable changes ({n} sections, {lines} lines)."
    if 'contributing' in base.lower():
        return f"Contributor guide with {n} sections covering development workflow and conventions."
    return f"Documentation: {n} sections, {lines} lines."


def summary_for_config(rel: str, lines: int) -> str:
    base = os.path.basename(rel)
    if base == 'package.json':
        return f"Package manifest declaring dependencies, scripts, and metadata ({lines} lines)."
    if base.startswith('tsconfig'):
        return f"TypeScript compiler configuration ({lines} lines)."
    if base == 'vercel.json':
        return f"Vercel deployment configuration ({lines} lines)."
    if base == '.npmrc':
        return f"npm/pnpm registry and behavior configuration."
    return f"{base} configuration file ({lines} lines)."


def summary_for_infra(rel: str, lang: str, lines: int, sections=None) -> str:
    base = os.path.basename(rel)
    if rel.startswith('.github/workflows/'):
        return f"GitHub Actions workflow ({base}) defining CI/CD jobs ({lines} lines)."
    if base.startswith('Dockerfile'):
        return f"Container image definition ({lines} lines)."
    if rel.startswith('.devcontainer/'):
        return f"Dev container definition for reproducible development environments."
    return f"Infrastructure file ({base}, {lines} lines)."


def summary_for_data(rel: str, lines: int) -> str:
    base = os.path.basename(rel)
    if base.endswith('.sql'):
        return f"SQL schema or migration ({lines} lines)."
    if base.endswith(('.graphql', '.gql')):
        return f"GraphQL schema definition ({lines} lines)."
    if base.endswith('.proto'):
        return f"Protocol Buffer schema ({lines} lines)."
    if base.endswith('.csv'):
        return f"CSV data file ({lines} rows)."
    return f"Data file ({base}, {lines} lines)."


def summary_for_markup(rel: str, lang: str, lines: int) -> str:
    base = os.path.basename(rel)
    if lang == 'css' or base.endswith(('.css', '.scss', '.sass', '.less')):
        return f"Stylesheet ({base}, {lines} lines)."
    if lang == 'html':
        return f"HTML template ({base}, {lines} lines)."
    return f"Markup ({base}, {lines} lines)."


def summary_for_script(rel: str, lines: int) -> str:
    return f"Shell script ({os.path.basename(rel)}, {lines} lines)."


# Tagging
def tags_for_code(rel: str, fn_count: int, class_count: int, export_count: int) -> list[str]:
    tags = []
    base = os.path.basename(rel)
    if '.test.' in base or '.spec.' in base or base.startswith('test_') or base.endswith(('_test.go', '_spec.rb')):
        tags.append('test')
    if base in ('index.ts', 'index.tsx', 'index.js', 'index.jsx', 'main.ts', 'main.tsx', 'main.js'):
        tags.append('entry-point')
    if export_count > 5 and fn_count == 0 and class_count == 0:
        tags.append('barrel')
    if 'util' in rel.lower(): tags.append('utility')
    if 'component' in rel.lower(): tags.append('component')
    if 'hook' in rel.lower(): tags.append('hook')
    if 'service' in rel.lower(): tags.append('service')
    if 'config' in rel.lower(): tags.append('config')
    if 'type' in rel.lower(): tags.append('type-definition')
    if 'middleware' in rel.lower(): tags.append('middleware')
    if rel.startswith('packages/cli/'): tags.append('cli')
    if rel.startswith('packages/core/'): tags.append('core-engine')
    if rel.startswith('packages/packs-'): tags.append('pack')
    if rel.startswith('apps/gallery/'): tags.append('gallery')
    if rel.startswith('scripts/'): tags.append('build-script')
    if rel.startswith('tests/'): tags.append('test')
    if not tags: tags = ['source']
    # dedupe and pad to 3
    out = []
    seen = set()
    for t in tags:
        if t not in seen: out.append(t); seen.add(t)
    if len(out) < 3:
        for fb in ['source', 'module', 'typescript' if rel.endswith(('.ts', '.tsx')) else 'javascript']:
            if fb not in seen: out.append(fb); seen.add(fb)
            if len(out) >= 3: break
    return out[:5]


def tags_for_doc(rel: str) -> list[str]:
    base = os.path.basename(rel).lower()
    out = ['documentation']
    if base == 'readme.md': out += ['entry-point', 'overview']
    elif 'changelog' in base: out += ['release-notes', 'history']
    elif 'contributing' in base: out += ['development', 'contributor-guide']
    elif 'license' in base: out += ['legal']
    elif rel.startswith('audit/'): out += ['audit', 'review']
    elif rel.startswith('docs/'): out += ['design-doc', 'architecture']
    else: out += ['notes']
    return out[:5]


def tags_for_config(rel: str) -> list[str]:
    base = os.path.basename(rel).lower()
    out = ['configuration']
    if base == 'package.json': out += ['npm', 'manifest']
    elif base.startswith('tsconfig'): out += ['typescript', 'build-system']
    elif base == 'vercel.json': out += ['deployment', 'vercel']
    elif base == 'eslint.config.js' or 'eslint' in base: out += ['linting', 'eslint']
    elif 'vitest' in base: out += ['testing', 'vitest']
    elif 'playwright' in base: out += ['e2e-testing', 'playwright']
    elif base == 'pnpm-workspace.yaml': out += ['monorepo', 'pnpm']
    elif base == '.npmrc': out += ['npm', 'registry']
    elif base.endswith('.json'): out += ['data']
    else: out += ['settings']
    return out[:5]


def tags_for_infra(rel: str) -> list[str]:
    out = ['infrastructure']
    if rel.startswith('.github/workflows/'): out += ['ci-cd', 'github-actions', 'deployment']
    elif rel.startswith('.devcontainer/'): out += ['containerization', 'dev-environment']
    elif 'Dockerfile' in rel: out += ['containerization', 'docker']
    return out[:5]


def tags_for_data(rel: str) -> list[str]:
    out = ['data']
    if rel.endswith('.csv'): out += ['dataset', 'tabular']
    elif rel.endswith('.sql'): out += ['database', 'sql']
    elif rel.endswith(('.graphql', '.gql')): out += ['api-schema', 'graphql']
    elif rel.endswith('.proto'): out += ['schema-definition', 'protobuf']
    return out[:5]


def tags_for_markup(rel: str) -> list[str]:
    out = []
    base = os.path.basename(rel).lower()
    if base.endswith(('.css', '.scss', '.sass', '.less')):
        out = ['stylesheet', 'css']
    elif base.endswith(('.html', '.htm')):
        out = ['html', 'template']
    if 'design' in rel.lower(): out.append('design-system')
    out.append('frontend')
    return out[:5]


def tags_for_script(rel: str) -> list[str]:
    out = ['script', 'shell']
    if rel.startswith('scripts/'): out.append('build-script')
    return out


# ---------- node + edge construction ----------
def build_nodes_and_edges(project_root: Path, batch_index: int, files: list,
                          extract_results: dict, batch_imports: dict) -> dict:
    nodes = []
    edges = []
    seen_node_ids = set()

    def add_node(n):
        if n['id'] in seen_node_ids: return
        seen_node_ids.add(n['id'])
        nodes.append(n)

    def add_edge(src, tgt, etype):
        if src == tgt: return
        edges.append({
            'source': src, 'target': tgt, 'type': etype,
            'direction': 'forward', 'weight': W[etype]
        })

    # Build a quick map: path -> structural result
    res_by_path = {r['path']: r for r in extract_results.get('results', [])}
    skipped = set(extract_results.get('filesSkipped', []))

    for f in files:
        rel = f['path']
        lang = f.get('language', 'unknown')
        cat = f.get('fileCategory', 'code')
        size_lines = f.get('sizeLines', 0)
        struct = res_by_path.get(rel)

        # --- File-level node ---
        node_type, prefix = file_node_type(rel, lang, cat)
        node_id = f"{prefix}:{rel}"
        name = os.path.basename(rel)
        non_empty = struct.get('nonEmptyLines', size_lines) if struct else size_lines
        fns = struct.get('functions', []) if struct else []
        classes = struct.get('classes', []) if struct else []
        exports = struct.get('exports', []) if struct else []

        # summary by category
        if cat == 'code' or cat == 'script':
            summary = summary_for_code_file(rel, lang, len(fns), len(classes), len(exports), size_lines)
            tags = tags_for_code(rel, len(fns), len(classes), len(exports))
        elif cat == 'docs':
            summary = summary_for_doc(rel, struct.get('sections', []) if struct else [], size_lines)
            tags = tags_for_doc(rel)
        elif cat == 'config':
            summary = summary_for_config(rel, size_lines)
            tags = tags_for_config(rel)
        elif cat == 'infra':
            summary = summary_for_infra(rel, lang, size_lines, struct.get('sections') if struct else None)
            tags = tags_for_infra(rel)
        elif cat == 'data':
            summary = summary_for_data(rel, size_lines)
            tags = tags_for_data(rel)
        elif cat == 'markup':
            summary = summary_for_markup(rel, lang, size_lines)
            tags = tags_for_markup(rel)
        else:
            summary = f"{name} ({lang}, {size_lines} lines)."
            tags = ['source', cat]

        complexity = complexity_for(non_empty, len(fns), len(classes))

        node = {
            'id': node_id,
            'type': node_type,
            'name': name,
            'filePath': rel,
            'summary': summary,
            'tags': tags,
            'complexity': complexity,
        }
        add_node(node)

        # --- Function nodes (significance filter) ---
        if cat in ('code', 'script') and struct:
            exported_names = {e.get('name') for e in exports if e.get('name')}
            for fn in fns:
                fn_name = fn.get('name')
                if not fn_name: continue
                start = fn.get('startLine', 0)
                end = fn.get('endLine', start)
                fn_lines = max(0, end - start + 1)
                # significance: 10+ lines OR exported
                if fn_lines < 10 and fn_name not in exported_names:
                    continue
                fn_id = f"function:{rel}:{fn_name}"
                if fn_id in seen_node_ids: continue
                fn_summary = f"Function `{fn_name}` ({fn_lines} lines) in {name}."
                fn_tags = ['function']
                if fn_name in exported_names: fn_tags.append('exported')
                if 'test' in fn_name.lower() or 'spec' in fn_name.lower(): fn_tags.append('test')
                if fn_name.startswith(('use', 'is', 'has', 'get', 'set')): fn_tags.append('helper')
                fn_tags = fn_tags[:5]
                if len(fn_tags) < 3: fn_tags += ['source', 'module'][:3 - len(fn_tags)]
                add_node({
                    'id': fn_id,
                    'type': 'function',
                    'name': fn_name,
                    'filePath': rel,
                    'lineRange': [start, end],
                    'summary': fn_summary,
                    'tags': fn_tags,
                    'complexity': 'simple' if fn_lines < 30 else ('moderate' if fn_lines < 100 else 'complex'),
                })
                add_edge(node_id, fn_id, 'contains')
                if fn_name in exported_names:
                    add_edge(node_id, fn_id, 'exports')

            # --- Class nodes (significance filter) ---
            for cls in classes:
                cls_name = cls.get('name')
                if not cls_name: continue
                start = cls.get('startLine', 0)
                end = cls.get('endLine', start)
                cls_lines = max(0, end - start + 1)
                methods = cls.get('methods', []) or []
                # significance: 2+ methods, 20+ lines, or exported
                if len(methods) < 2 and cls_lines < 20 and cls_name not in exported_names:
                    continue
                cls_id = f"class:{rel}:{cls_name}"
                if cls_id in seen_node_ids: continue
                cls_summary = (f"Class `{cls_name}` with {len(methods)} method"
                               f"{'s' if len(methods) != 1 else ''} ({cls_lines} lines).")
                cls_tags = ['class']
                if cls_name in exported_names: cls_tags.append('exported')
                if 'Service' in cls_name or 'Controller' in cls_name or 'Handler' in cls_name:
                    cls_tags.append('api-handler')
                if 'Test' in cls_name or 'Spec' in cls_name: cls_tags.append('test')
                cls_tags = cls_tags[:5]
                if len(cls_tags) < 3: cls_tags += ['data-model', 'oop'][:3 - len(cls_tags)]
                add_node({
                    'id': cls_id,
                    'type': 'class',
                    'name': cls_name,
                    'filePath': rel,
                    'lineRange': [start, end],
                    'summary': cls_summary,
                    'tags': cls_tags,
                    'complexity': 'simple' if cls_lines < 50 else ('moderate' if cls_lines < 200 else 'complex'),
                })
                add_edge(node_id, cls_id, 'contains')
                if cls_name in exported_names:
                    add_edge(node_id, cls_id, 'exports')

        # --- Import edges (1:1 from batchImportData) ---
        for imp_path in batch_imports.get(rel, []):
            # we don't know the target's category; use 'file:' prefix for code (default)
            # However the import map only contains code paths (per scanner contract)
            tgt_id = f"file:{imp_path}"
            add_edge(node_id, tgt_id, 'imports')

    return {'nodes': nodes, 'edges': edges}


def main():
    batches_data = json.loads((INTER / 'batches.json').read_text())
    batches = batches_data.get('batches', [])
    print(f"[phase2] {len(batches)} batches to analyze", file=sys.stderr)

    total_files = 0
    total_nodes = 0
    total_edges = 0
    failures = []

    for b in batches:
        bi = b['batchIndex']
        files = b['files']
        batch_imports = b['batchImportData']
        # Write input
        input_path = TMP / f"ua-file-analyzer-input-{bi}.json"
        result_path = TMP / f"ua-file-extract-results-{bi}.json"
        out_path = INTER / f"batch-{bi}.json"
        input_path.write_text(json.dumps({
            'projectRoot': str(PROJECT_ROOT),
            'batchFiles': files,
            'batchImportData': batch_imports,
        }, indent=2))

        # Run extract-structure
        try:
            r = subprocess.run(
                ['node', str(EXTRACT_SCRIPT), str(input_path), str(result_path)],
                capture_output=True, text=True, timeout=120,
                cwd=str(PROJECT_ROOT),
            )
            if r.returncode != 0:
                failures.append((bi, f"extract-structure exit={r.returncode}: {r.stderr[:300]}"))
                # Build minimal nodes from files alone
                extract_results = {'scriptCompleted': False, 'results': [], 'filesSkipped': [f['path'] for f in files]}
            else:
                extract_results = json.loads(result_path.read_text())
        except Exception as e:
            failures.append((bi, f"extract-structure exception: {e}"))
            extract_results = {'scriptCompleted': False, 'results': [], 'filesSkipped': [f['path'] for f in files]}

        # Build nodes + edges
        try:
            graph = build_nodes_and_edges(PROJECT_ROOT, bi, files, extract_results, batch_imports)
        except Exception as e:
            failures.append((bi, f"build_nodes exception: {e}"))
            continue

        out_path.write_text(json.dumps(graph, indent=2))
        total_files += len(files)
        total_nodes += len(graph['nodes'])
        total_edges += len(graph['edges'])
        if bi % 10 == 0 or bi <= 2 or bi == len(batches):
            print(f"[phase2] batch {bi}/{len(batches)}: {len(files)} files → {len(graph['nodes'])} nodes, {len(graph['edges'])} edges", file=sys.stderr)

    print(f"\n[phase2] DONE — {total_files} files, {total_nodes} nodes, {total_edges} edges across {len(batches)} batches", file=sys.stderr)
    if failures:
        print(f"[phase2] {len(failures)} failures:", file=sys.stderr)
        for bi, err in failures[:10]:
            print(f"  batch {bi}: {err}", file=sys.stderr)


if __name__ == '__main__':
    main()
