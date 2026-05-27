#!/usr/bin/env python3
"""Phase 4 — assign file-level nodes to architectural layers based on directory structure."""
import json
import os
import sys
from pathlib import Path
from collections import defaultdict

PROJECT_ROOT = Path(sys.argv[1]).resolve()
INTER = PROJECT_ROOT / '.understand-anything' / 'intermediate'

graph = json.loads((INTER / 'assembled-graph.json').read_text())
nodes = graph['nodes']

# File-level types per the schema
FILE_LEVEL_TYPES = {'file', 'config', 'document', 'service', 'pipeline', 'table', 'schema', 'resource', 'endpoint'}
file_level = [n for n in nodes if n['type'] in FILE_LEVEL_TYPES]

# Layer rules — first match wins.
# (id, name, description, predicate)
def is_in(n, *prefixes): return any(n.get('filePath', '').startswith(p) for p in prefixes)
def name_eq(n, *names): return os.path.basename(n.get('filePath', '')) in names

LAYER_RULES = [
    ('layer:gallery-app',          'Gallery App',           'Astro-based gallery web app that showcases the rendered templates and packs.',
        lambda n: is_in(n, 'apps/gallery/')),
    ('layer:cli-package',          'CLI Package',           'Command-line interface package exposing the goodnotes-templates CLI entry points.',
        lambda n: is_in(n, 'packages/cli/')),
    ('layer:core-package',         'Core Engine',           'Core rendering and template engine shared by all packs and the CLI.',
        lambda n: is_in(n, 'packages/core/')),
    ('layer:packs',                'Template Packs',        'Self-contained template packs (journals, planners, trackers, tactile series, etc.).',
        lambda n: is_in(n, 'packages/packs-')),
    ('layer:build-scripts',        'Build & Generation Scripts', 'TypeScript and shell scripts that render previews, build stickers, generate registries, and bundle releases.',
        lambda n: is_in(n, 'scripts/')),
    ('layer:tests',                'Tests',                 'Unit, end-to-end, and visual regression test suites.',
        lambda n: is_in(n, 'tests/')),
    ('layer:references',           'References',            'Reference designs and inspiration assets used by the design system.',
        lambda n: is_in(n, 'references/')),
    ('layer:audit',                'Audit Reports',         'Multi-iteration audit findings, gap analyses, roadmaps, and verification results.',
        lambda n: is_in(n, 'audit/')),
    ('layer:design-docs',          'Design & Planning Docs', 'High-level design (HLD/LLD), CEO/eng/design plan reviews, and product North-Star documentation.',
        lambda n: is_in(n, 'docs/')),
    ('layer:examples',             'Example Outputs',       'Pre-rendered HTML/PDF example outputs for showcased packs.',
        lambda n: is_in(n, 'examples/')),
    ('layer:shared-assets',        'Shared Assets',         'Shared resources (fonts metadata, common assets) used across packs.',
        lambda n: is_in(n, 'shared/')),
    ('layer:ci-cd',                'CI/CD & Dev Environment', 'GitHub Actions workflows, dev container config, and environment automation.',
        lambda n: is_in(n, '.github/', '.devcontainer/')),
    ('layer:project-config',       'Project Configuration', 'Root-level monorepo configuration, build tooling, lint/test configs, and workspace settings.',
        lambda n: '/' not in n.get('filePath', '') and (n['type'] == 'config' or n.get('filePath', '').endswith(('.config.js', '.config.ts')))),
    ('layer:project-docs',         'Project Documentation', 'Top-level project documentation (README, CHANGELOG, MIGRATION, CONTRIBUTING, status reports).',
        lambda n: '/' not in n.get('filePath', '') and n['type'] == 'document'),
]

assigned = {}
layer_to_ids = defaultdict(list)
for n in file_level:
    matched = False
    for lid, lname, ldesc, pred in LAYER_RULES:
        try:
            if pred(n):
                if n['id'] in assigned:
                    continue
                assigned[n['id']] = lid
                layer_to_ids[lid].append(n['id'])
                matched = True
                break
        except Exception:
            continue
    if not matched:
        # fallback layer based on top-level directory
        fp = n.get('filePath', '')
        top = fp.split('/', 1)[0] if '/' in fp else 'root'
        lid = f"layer:misc-{top}"
        if lid not in [r[0] for r in LAYER_RULES]:
            assigned[n['id']] = lid
            layer_to_ids[lid].append(n['id'])

# Build layers array preserving rule order, then any fallback misc layers
layers = []
for lid, lname, ldesc, _ in LAYER_RULES:
    if layer_to_ids.get(lid):
        layers.append({'id': lid, 'name': lname, 'description': ldesc, 'nodeIds': sorted(layer_to_ids[lid])})

# Append fallback layers
fallback_ids = sorted(set(lid for lid in layer_to_ids if not any(r[0] == lid for r in LAYER_RULES)))
for lid in fallback_ids:
    top = lid.split('layer:misc-', 1)[-1]
    layers.append({
        'id': lid,
        'name': f"Miscellaneous ({top})",
        'description': f"Other files under {top}/.",
        'nodeIds': sorted(layer_to_ids[lid]),
    })

(INTER / 'layers.json').write_text(json.dumps(layers, indent=2))
print(f"Wrote {len(layers)} layers covering {sum(len(l['nodeIds']) for l in layers)} of {len(file_level)} file-level nodes", file=sys.stderr)
unassigned = [n for n in file_level if n['id'] not in assigned]
if unassigned:
    print(f"WARNING: {len(unassigned)} file-level nodes unassigned:", file=sys.stderr)
    for n in unassigned[:10]:
        print(f"  {n['id']}", file=sys.stderr)
for l in layers:
    print(f"  {l['id']:35s} {l['name']:30s} ({len(l['nodeIds'])} nodes)", file=sys.stderr)
