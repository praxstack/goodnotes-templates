#!/usr/bin/env python3
"""Phase 5 — produce a guided tour through the codebase."""
import json
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(sys.argv[1]).resolve()
INTER = PROJECT_ROOT / '.understand-anything' / 'intermediate'

graph = json.loads((INTER / 'assembled-graph.json').read_text())
node_ids = {n['id'] for n in graph['nodes']}

def existing(*ids):
    return [i for i in ids if i in node_ids]

# We pick anchor file IDs that should exist
tour = [
    {
        'order': 1,
        'title': 'Project Overview & North Star',
        'description': "Start with the README and DECISIONS to understand what goodnotes-templates is and the principles guiding it. The North-Star doc explains the intent behind self-contained pack templates.",
        'nodeIds': existing(
            'document:README.md',
            'document:DECISIONS.md',
            'document:docs/NORTH-STAR.md',
            'document:CHANGELOG.md',
        ),
    },
    {
        'order': 2,
        'title': 'Monorepo Layout & Workspace Configuration',
        'description': "Inspect the monorepo's package.json, pnpm-workspace, base TypeScript config, and Vercel/Vitest tooling to see how the workspace is wired together.",
        'nodeIds': existing(
            'config:package.json',
            'config:tsconfig.base.json',
            'config:tsconfig.json',
            'config:vercel.json',
            'config:vitest.config.ts',
            'config:vitest.visual.config.ts',
            'config:playwright.config.ts',
            'config:eslint.config.js',
        ),
    },
    {
        'order': 3,
        'title': 'Core Engine — How Templates Render',
        'description': "Dive into packages/core to see the rendering primitives, layout helpers, and the template/pack contract that every pack consumes.",
        'nodeIds': [n['id'] for n in graph['nodes'] if n.get('filePath', '').startswith('packages/core/') and n['type'] == 'file'][:12],
    },
    {
        'order': 4,
        'title': 'CLI — Operator Entry Point',
        'description': "packages/cli is the command-line surface. Walk its TypeScript sources to understand how commands wire up to the core engine.",
        'nodeIds': [n['id'] for n in graph['nodes'] if n.get('filePath', '').startswith('packages/cli/') and n['type'] == 'file'][:8],
    },
    {
        'order': 5,
        'title': 'Template Packs — The Catalog',
        'description': "packages/packs-* contains every shipping template (journals, planners, tactile series, recipe cards, etc.). Each pack is self-contained and follows the same contract.",
        'nodeIds': [n['id'] for n in graph['nodes']
                    if n.get('filePath', '').startswith('packages/packs-')
                    and os.path.basename(n.get('filePath', '')) in ('package.json', 'index.ts', 'pack.ts', 'definition.ts', 'theme.ts')][:15],
    },
    {
        'order': 6,
        'title': 'Build Scripts — Rendering Pipelines',
        'description': "scripts/ holds the orchestration that renders pages, builds stickers, generates the registry, and bundles releases. Read these to see the full build pipeline end-to-end.",
        'nodeIds': [n['id'] for n in graph['nodes']
                    if n.get('filePath', '').startswith('scripts/')
                    and (n.get('filePath', '').endswith(('.ts', '.sh')))][:14],
    },
    {
        'order': 7,
        'title': 'Gallery App — The Showcase Surface',
        'description': "apps/gallery is the Astro-based public surface that renders previews of every template and pack. Trace the entry, layout, and pack-detail pages.",
        'nodeIds': [n['id'] for n in graph['nodes']
                    if n.get('filePath', '').startswith('apps/gallery/')
                    and (os.path.basename(n.get('filePath', '')) in ('astro.config.mjs', 'package.json')
                         or n.get('filePath', '').endswith(('.astro', '.ts', '.tsx')))][:15],
    },
    {
        'order': 8,
        'title': 'Tests — Unit, E2E & Visual Regression',
        'description': "Three test surfaces: tests/unit for logic, tests/e2e via Playwright for the gallery, and tests/visual for layout regression. Vitest runs unit + visual; Playwright runs e2e.",
        'nodeIds': [n['id'] for n in graph['nodes']
                    if n.get('filePath', '').startswith('tests/')
                    and n.get('filePath', '').endswith(('.ts', '.spec.ts', '.test.ts'))][:12],
    },
    {
        'order': 9,
        'title': 'CI/CD & Audit Reports',
        'description': "GitHub Actions workflows in .github/workflows automate audit/CI/generate. The audit/ tree records six iterations of findings, gap analyses, and verification results that shaped the current state.",
        'nodeIds': existing(
            'pipeline:.github/workflows/ci.yml',
            'pipeline:.github/workflows/audit.yml',
            'pipeline:.github/workflows/generate.yml',
            'document:audit/CODEBASE_AUDIT_REPORT.md',
            'document:audit/IMPLEMENTATION_ROADMAP.md',
            'document:audit/iteration-4/CODEBASE_AUDIT_REPORT.md',
            'document:audit/iteration-6/STATUS.md',
        ),
    },
]

# Trim empty steps
tour = [s for s in tour if s['nodeIds']]
# Renumber
for i, s in enumerate(tour, 1):
    s['order'] = i

# Drop dangling refs
for s in tour:
    s['nodeIds'] = [i for i in s['nodeIds'] if i in node_ids]
tour = [s for s in tour if s['nodeIds']]

(INTER / 'tour.json').write_text(json.dumps(tour, indent=2))
print(f"Wrote {len(tour)} tour steps:", file=sys.stderr)
for s in tour:
    print(f"  Step {s['order']}: {s['title']} ({len(s['nodeIds'])} nodes)", file=sys.stderr)
