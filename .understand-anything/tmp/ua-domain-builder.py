#!/usr/bin/env python3
"""Phase: domain analyzer — produce a domain-graph.json from the existing knowledge graph.

Derives 4 business domains and 5 flows from the goodnotes-templates monorepo
based on the layers and the file-level structural data already captured.
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

PROJECT_ROOT = Path(sys.argv[1]).resolve()
KG_PATH = PROJECT_ROOT / '.understand-anything' / 'knowledge-graph.json'
OUT_PATH = PROJECT_ROOT / '.understand-anything' / 'domain-graph.json'

graph = json.loads(KG_PATH.read_text())
project = graph['project']
node_paths = {n['id']: n.get('filePath') for n in graph['nodes']}
node_path_to_id = {n['filePath']: n['id'] for n in graph['nodes'] if n.get('filePath')}

# ---------- Domains, flows, and steps grounded in the actual repo ----------
domains = [
    {
        'id': 'domain:template-authoring',
        'type': 'domain',
        'name': 'Template Authoring',
        'summary': "Authors and maintains the catalog of self-contained template packs (planners, journals, trackers, tactile series). Each pack ships its own manifest, theme, README, and HTML/CSS source, following the unified pack contract enforced by packages/core.",
        'tags': ['authoring', 'pack-system', 'content'],
        'complexity': 'complex',
        'domainMeta': {
            'entities': ['Pack', 'Manifest', 'Theme', 'Template', 'Variant'],
            'businessRules': [
                'Every pack must include a valid manifest.json',
                'Each pack is self-contained: HTML, CSS, theme, and metadata co-located',
                'Pack IDs must be globally unique across the registry',
                'Tactile-series packs share a common cohesive design language',
            ],
            'crossDomainInteractions': [
                'Feeds the Rendering & Generation domain with pack source HTML/CSS',
                'Surfaces metadata to the Distribution & Showcase domain (gallery)',
            ],
        },
    },
    {
        'id': 'domain:rendering-generation',
        'type': 'domain',
        'name': 'Rendering & Generation',
        'summary': "Programmatic rendering pipeline that turns pack source HTML/CSS into deliverables: PDFs, PNG previews, sticker assets, and standalone HTML. Built on a Puppeteer/Chromium rendering engine plus per-renderer specializations (PDF post-processing, PDF splice, PNG sprite renderer, sticker renderer, prax-journal renderer).",
        'tags': ['rendering', 'pdf', 'png', 'puppeteer', 'pipeline'],
        'complexity': 'complex',
        'domainMeta': {
            'entities': ['Renderer', 'PDFDocument', 'PNGImage', 'Sticker', 'Spec', 'Variant'],
            'businessRules': [
                'All renderers consume the same Pack contract from packages/core',
                'PDF post-processing applies dimension validation + audit checks',
                'Stickers render as transparent PNGs with consistent margins',
                'Standalone HTML inlines fonts and CSS to be portable',
            ],
            'crossDomainInteractions': [
                'Consumes pack source from Template Authoring',
                'Produces output consumed by Distribution & Showcase (gallery PDFs/PNGs)',
                'Triggered by build scripts in scripts/ and the CLI in packages/cli',
            ],
        },
    },
    {
        'id': 'domain:distribution-showcase',
        'type': 'domain',
        'name': 'Distribution & Showcase',
        'summary': "Astro-based gallery web app and registry that publish the catalog to end-users. The gallery generates blurhashes, theme palettes, OG cards, MDX content, and per-pack pages, deployed to Vercel.",
        'tags': ['gallery', 'astro', 'distribution', 'vercel'],
        'complexity': 'complex',
        'domainMeta': {
            'entities': ['GalleryPage', 'PackEntry', 'Blurhash', 'OGCard', 'Specimen', 'Theme'],
            'businessRules': [
                'Pack IDs in the gallery must match those in the registry',
                'Every pack page must include a generated blurhash placeholder',
                'Vercel deploy must run validate-pack-ids before staging',
                'Theme palettes are precomputed and shipped as JSON',
            ],
            'crossDomainInteractions': [
                'Reads pack metadata from Template Authoring',
                'Reads rendered PDFs/PNGs from Rendering & Generation',
                'Surfaces audit signals from Quality & Audit on the contributor pages',
            ],
        },
    },
    {
        'id': 'domain:quality-audit',
        'type': 'domain',
        'name': 'Quality & Audit',
        'summary': "Multi-iteration audit, testing, and CI/CD enforcement. Tracks 6 audit iterations (architecture, supply-chain, privacy, performance, threat-model, UI/UX accessibility), runs unit/visual/E2E tests via Vitest + Playwright, and gates every commit through GitHub Actions.",
        'tags': ['audit', 'testing', 'ci-cd', 'quality-gate'],
        'complexity': 'complex',
        'domainMeta': {
            'entities': ['AuditIteration', 'Finding', 'Roadmap', 'TestSuite', 'Workflow', 'Verification'],
            'businessRules': [
                'Every commit triggers the CI workflow before merge',
                'Visual regression baselines must match generated output within tolerance',
                'Unsealed audit findings block release bundling',
                'Iteration verification must produce a phase-validation.md',
            ],
            'crossDomainInteractions': [
                'Audits all three other domains',
                'Consumes outputs from Rendering & Generation for visual regression',
            ],
        },
    },
]

# ---------- Flows + steps ----------
def step_for(rel_path, step_id, name, summary, tags=None, complexity='simple'):
    """Build a step node, attaching filePath/lineRange when the file exists in the graph."""
    if tags is None:
        tags = ['step']
    step = {
        'id': step_id,
        'type': 'step',
        'name': name,
        'summary': summary,
        'tags': tags,
        'complexity': complexity,
    }
    # Only include filePath when we know the file exists in the graph
    if rel_path and rel_path in node_path_to_id:
        step['filePath'] = rel_path
        step['lineRange'] = [1, 1]  # we don't have specific symbol ranges
    return step


flows = [
    {
        'id': 'flow:author-new-pack',
        'name': 'Author a New Template Pack',
        'summary': "Scaffold and develop a new self-contained template pack from CLI scaffold through to a renderable manifest+HTML+CSS bundle.",
        'tags': ['authoring', 'scaffold'],
        'complexity': 'moderate',
        'domain': 'domain:template-authoring',
        'entryPoint': 'CLI: pretext scaffold',
        'entryType': 'cli',
        'steps': [
            ('packages/cli/src/scaffold.ts', 'scaffold-pack',  'Scaffold pack skeleton',     "CLI command creates a new packages/packs-<name>/ directory with manifest, README, theme, and a starter HTML/CSS template."),
            (None,                            'edit-manifest',  'Edit manifest.json',         "Author fills in pack id, title, description, tags, theme references, and variant list."),
            (None,                            'design-html',    'Design HTML/CSS template',   "Author writes the page HTML and CSS, optionally with dark and light variants."),
            (None,                            'add-readme',     'Document pack',              "Author writes README explaining intent, usage, and design rationale."),
            ('apps/gallery/src/scripts/validate-pack-ids.ts', 'validate-id', 'Validate pack ID', "Pre-deploy validator ensures the pack ID is unique and consistent across the registry and gallery MDX."),
            ('packages/core/src/registry/registry.ts', 'register-pack', 'Register pack in core', "Pack is added to the core registry so renderers and the CLI can resolve it by id."),
        ],
    },
    {
        'id': 'flow:render-pack-to-pdf',
        'name': 'Render Pack to PDF/PNG',
        'summary': "Take a pack from packages/packs-* through Puppeteer rendering, PDF post-processing, and audit checks to produce final deliverables.",
        'tags': ['rendering', 'pdf', 'puppeteer'],
        'complexity': 'complex',
        'domain': 'domain:rendering-generation',
        'entryPoint': 'CLI: pretext render <pack>',
        'entryType': 'cli',
        'steps': [
            ('packages/cli/src/index.ts',                                  'cli-entry',          'CLI dispatch',          "CLI parses arguments and routes to the render command."),
            ('packages/core/src/registry-resolve.ts',                      'resolve-pack',       'Resolve pack from registry', "Resolve the pack identifier to a concrete pack root, manifest, and template entry."),
            ('packages/core/src/dimensions.ts',                            'compute-dimensions', 'Compute target dimensions', "Compute page dimensions from the pack's manifest (size, margins, orientation)."),
            ('packages/core/src/puppeteer-renderer.ts',                    'render-html',        'Render HTML via Puppeteer', "Spin up headless Chromium, load the pack HTML+CSS, and capture the rendered PDF and PNG outputs."),
            ('packages/core/src/pdf-postprocess.ts',                       'postprocess-pdf',    'Post-process PDF',      "Apply linearisation, metadata, and dimension fixes to the raw PDF."),
            ('packages/core/src/pdf-splice.ts',                            'splice-pdf',         'Splice PDF pages',      "Merge or split PDF pages per the pack's variant configuration."),
            ('packages/core/src/audit.ts',                                 'audit-output',       'Audit rendered output', "Run dimension and content audits on the PDF/PNG to catch regressions."),
            ('packages/core/src/standalone-builder.ts',                    'build-standalone',   'Build standalone HTML', "Produce a portable, font-and-CSS-inlined standalone HTML for the pack."),
        ],
    },
    {
        'id': 'flow:render-stickers',
        'name': 'Render Sticker Sheets',
        'summary': "Generate transparent PNG stickers for journal packs (mood dots, friend letters, wins jar, thought flips, wave 1/2 stickers) using the dedicated sticker rendering pipeline.",
        'tags': ['stickers', 'png', 'rendering'],
        'complexity': 'moderate',
        'domain': 'domain:rendering-generation',
        'entryPoint': 'scripts/build-stickers.ts',
        'entryType': 'cli',
        'steps': [
            ('scripts/build-stickers.ts',                       'enumerate-targets',  'Enumerate sticker targets', "Walk the journal packs and enumerate sticker definitions to build."),
            ('packages/core/src/sticker-renderer.ts',           'render-sticker',     'Render each sticker',       "Render each sticker as a transparent PNG via the sticker renderer."),
            ('packages/core/src/png-renderer.ts',               'optimize-png',       'Optimise PNG',              "Apply PNG optimization and metadata stripping."),
            ('scripts/rebuild-all-stickers-index.ts',           'rebuild-index',      'Rebuild sticker index',     "Update the sticker index manifest used by downstream consumers."),
        ],
    },
    {
        'id': 'flow:gallery-build-deploy',
        'name': 'Build & Deploy Gallery',
        'summary': "Build the Astro gallery site: enrich pack MDX, encode blurhashes, build OG cards, generate specimens, copy themed PDFs, validate pack IDs, then deploy to Vercel.",
        'tags': ['gallery', 'astro', 'deploy', 'vercel'],
        'complexity': 'complex',
        'domain': 'domain:distribution-showcase',
        'entryPoint': 'apps/gallery/scripts/* + Astro build',
        'entryType': 'cli',
        'steps': [
            ('apps/gallery/src/scripts/enrich-pack-mdx.ts',        'enrich-mdx',         'Enrich pack MDX',          "Augment pack MDX content with metadata fetched from manifests and registry."),
            ('apps/gallery/src/scripts/build-theme-palette.ts',    'build-palette',      'Build theme palette',      "Compute per-theme color palettes for previews."),
            ('apps/gallery/src/scripts/encode-blurhash.ts',        'encode-blurhash',    'Encode blurhash',          "Generate blurhash placeholders for every pack preview image."),
            ('apps/gallery/src/scripts/build-og-cards.ts',         'build-og',           'Build OG cards',           "Render Open-Graph share cards for every pack page."),
            ('apps/gallery/src/scripts/generate-specimens.ts',     'generate-specimens', 'Generate specimens',       "Produce specimen previews showcasing typography, themes, and components."),
            ('apps/gallery/src/scripts/copy-pack-pdfs.ts',         'copy-pdfs',          'Copy pack PDFs',           "Copy rendered PDFs from packs/* into the gallery's public assets."),
            ('apps/gallery/src/scripts/copy-pack-themed-pdfs.ts',  'copy-themed-pdfs',   'Copy themed PDFs',         "Copy variant-themed PDF deliverables into the gallery."),
            ('apps/gallery/src/scripts/validate-pack-ids.ts',      'validate-ids',       'Validate pack IDs',        "Pre-deploy gate ensuring no orphaned MDX entries or duplicate IDs."),
            ('apps/gallery/src/scripts/stage-vercel-config.ts',    'stage-vercel',       'Stage Vercel config',      "Materialise the Vercel deployment config (vercel.json) into the build output."),
            ('apps/gallery/astro.config.mjs',                      'astro-build',        'Astro build & deploy',     "Run Astro build to produce static output, then deploy to Vercel."),
        ],
    },
    {
        'id': 'flow:audit-and-test',
        'name': 'Audit, Test & CI/CD',
        'summary': "Continuous integration loop: every commit runs lint, unit tests, visual regression, and E2E tests; release branches additionally run the multi-iteration audit pipeline that verifies architecture, privacy, performance, supply chain, and accessibility.",
        'tags': ['ci-cd', 'testing', 'audit', 'github-actions'],
        'complexity': 'complex',
        'domain': 'domain:quality-audit',
        'entryPoint': '.github/workflows/ci.yml',
        'entryType': 'event',
        'steps': [
            ('.github/workflows/ci.yml',           'ci-trigger',          'CI trigger',           "GitHub Actions workflow runs on every push/PR to validate the full repo."),
            ('vitest.config.ts',                   'unit-tests',          'Run unit tests',       "Execute Vitest unit suite over packages/core, CLI, and pack helpers."),
            ('vitest.visual.config.ts',            'visual-regression',   'Visual regression',    "Run visual diff against rendered PDFs/PNGs via the visual-vitest project."),
            ('playwright.config.ts',               'e2e-gallery',         'E2E gallery tests',    "Playwright drives the gallery app to verify navigation, rendering, and search."),
            ('.github/workflows/audit.yml',        'audit-pipeline',      'Audit pipeline',       "Multi-iteration audit workflow runs architecture, privacy, performance, threat-model, and UI/UX checks."),
            ('audit/iteration-4/phase-validation.md', 'phase-validation', 'Validate audit phase', "Each iteration must produce a phase-validation document recording verification results."),
            ('scripts/audit.sh',                   'local-audit-script',  'Local audit script',   "Developers can run the same audit suite locally via scripts/audit.sh before pushing."),
            ('.github/workflows/generate.yml',     'release-generate',    'Release generation',   "On release branches, regenerate every pack's PDFs/PNGs and bundle the release."),
        ],
    },
]


# ---------- Build the graph ----------
nodes = list(domains)
edges = []

for flow in flows:
    flow_node = {
        'id': flow['id'],
        'type': 'flow',
        'name': flow['name'],
        'summary': flow['summary'],
        'tags': flow['tags'],
        'complexity': flow['complexity'],
        'domainMeta': {
            'entryPoint': flow['entryPoint'],
            'entryType': flow['entryType'],
        },
    }
    nodes.append(flow_node)
    edges.append({
        'source': flow['domain'], 'target': flow['id'],
        'type': 'contains_flow', 'direction': 'forward', 'weight': 1.0,
    })

    n_steps = len(flow['steps'])
    increment = max(0.1, round(1.0 / n_steps, 1))
    for i, (rel_path, step_slug, name, summary) in enumerate(flow['steps'], 1):
        flow_slug = flow['id'].split(':', 1)[1]
        sid = f"step:{flow_slug}:{step_slug}"
        step = {
            'id': sid,
            'type': 'step',
            'name': name,
            'summary': summary,
            'tags': [t for t in flow['tags']][:3] + ['step'],
            'complexity': 'simple',
        }
        if rel_path and rel_path in node_path_to_id:
            step['filePath'] = rel_path
            # Use lineRange [1, sizeLines] if available
            for n in graph['nodes']:
                if n.get('filePath') == rel_path:
                    step['lineRange'] = [1, 1]
                    break
        nodes.append(step)
        weight = round(min(1.0, max(0.1, i * increment)), 1)
        edges.append({
            'source': flow['id'], 'target': sid,
            'type': 'flow_step', 'direction': 'forward', 'weight': weight,
        })

# Cross-domain edges
edges.extend([
    {'source': 'domain:template-authoring',   'target': 'domain:rendering-generation', 'type': 'cross_domain', 'direction': 'forward', 'weight': 0.6, 'description': 'Authored packs feed the rendering pipeline as input.'},
    {'source': 'domain:rendering-generation', 'target': 'domain:distribution-showcase', 'type': 'cross_domain', 'direction': 'forward', 'weight': 0.6, 'description': 'Rendered PDFs and PNGs are copied into the gallery for distribution.'},
    {'source': 'domain:template-authoring',   'target': 'domain:distribution-showcase', 'type': 'cross_domain', 'direction': 'forward', 'weight': 0.5, 'description': 'Pack metadata (manifests, MDX) populates the gallery catalog.'},
    {'source': 'domain:quality-audit',        'target': 'domain:rendering-generation', 'type': 'cross_domain', 'direction': 'forward', 'weight': 0.5, 'description': 'Visual regression and audit pipelines validate rendered output.'},
    {'source': 'domain:quality-audit',        'target': 'domain:distribution-showcase', 'type': 'cross_domain', 'direction': 'forward', 'weight': 0.5, 'description': 'CI gates Vercel deploys via validate-pack-ids and audit checks.'},
])

# Final
out = {
    'version': '1.0.0',
    'project': {
        'name': project['name'],
        'languages': project['languages'],
        'frameworks': project['frameworks'],
        'description': project['description'],
        'analyzedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'gitCommitHash': project.get('gitCommitHash', ''),
    },
    'nodes': nodes,
    'edges': edges,
    'layers': [],
    'tour': [],
}

OUT_PATH.write_text(json.dumps(out, indent=2))

# Counts
domains_n = sum(1 for n in nodes if n['type'] == 'domain')
flows_n = sum(1 for n in nodes if n['type'] == 'flow')
steps_n = sum(1 for n in nodes if n['type'] == 'step')
print(f"Wrote {OUT_PATH} ({(OUT_PATH.stat().st_size / 1024):.1f} KB)", file=sys.stderr)
print(f"  {domains_n} domains, {flows_n} flows, {steps_n} steps, {len(edges)} edges", file=sys.stderr)
for d in domains:
    print(f"  {d['id']:42s} {d['name']}", file=sys.stderr)
