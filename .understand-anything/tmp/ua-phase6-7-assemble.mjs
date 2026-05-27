#!/usr/bin/env node
// Phase 6 + 7 — assemble the full KnowledgeGraph, validate inline, and save.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PROJECT_ROOT = process.argv[2];
const INTER = path.join(PROJECT_ROOT, '.understand-anything', 'intermediate');
const OUT = path.join(PROJECT_ROOT, '.understand-anything', 'knowledge-graph.json');

const scan = JSON.parse(fs.readFileSync(path.join(INTER, 'scan-result.json'), 'utf-8'));
const assembled = JSON.parse(fs.readFileSync(path.join(INTER, 'assembled-graph.json'), 'utf-8'));
const layers = JSON.parse(fs.readFileSync(path.join(INTER, 'layers.json'), 'utf-8'));
const tour = JSON.parse(fs.readFileSync(path.join(INTER, 'tour.json'), 'utf-8'));

let commitHash = '';
try { commitHash = execSync('git rev-parse HEAD', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim(); } catch {}

// Synthesize description if scan didn't have one
let desc = scan.description;
if (!desc || !desc.trim()) {
  const raw = scan.rawDescription || '';
  if (raw) desc = raw;
  else {
    desc = "Self-contained Goodnotes template monorepo: Astro gallery app, CLI, core rendering engine, and 24 template packs (journals, planners, tactile series).";
  }
}
if (scan.totalFiles > 100) {
  if (!desc.includes('over 100')) desc = desc + ' Note: this project has over 100 source files; consider scoping analysis to a subdirectory for faster results.';
}

const graph = {
  version: '1.0.0',
  project: {
    name: scan.name,
    languages: scan.languages,
    frameworks: scan.frameworks,
    description: desc,
    analyzedAt: new Date().toISOString(),
    gitCommitHash: commitHash,
  },
  nodes: assembled.nodes,
  edges: assembled.edges,
  layers,
  tour,
};

// --- Inline validation (per /understand SKILL.md) ---
const issues = [];
const warnings = [];
const nodeIds = new Set();
const seen = new Map();

graph.nodes.forEach((n, i) => {
  if (!n.id) { issues.push(`Node[${i}] missing id`); return; }
  if (!n.type) issues.push(`Node[${i}] '${n.id}' missing type`);
  if (!n.name) issues.push(`Node[${i}] '${n.id}' missing name`);
  if (!n.summary) issues.push(`Node[${i}] '${n.id}' missing summary`);
  if (!n.tags || !n.tags.length) issues.push(`Node[${i}] '${n.id}' missing tags`);
  if (seen.has(n.id)) issues.push(`Duplicate node ID '${n.id}' at indices ${seen.get(n.id)} and ${i}`);
  else seen.set(n.id, i);
  nodeIds.add(n.id);
});

graph.edges.forEach((e, i) => {
  if (!nodeIds.has(e.source)) issues.push(`Edge[${i}] source '${e.source}' not found`);
  if (!nodeIds.has(e.target)) issues.push(`Edge[${i}] target '${e.target}' not found`);
});

const fileLevelTypes = new Set(['file', 'config', 'document', 'service', 'pipeline', 'table', 'schema', 'resource', 'endpoint']);
const fileNodes = graph.nodes.filter(n => fileLevelTypes.has(n.type)).map(n => n.id);
const assignedSet = new Map();
graph.layers.forEach(layer => {
  (layer.nodeIds || []).forEach(id => {
    if (!nodeIds.has(id)) issues.push(`Layer '${layer.id}' refs missing node '${id}'`);
    if (assignedSet.has(id)) issues.push(`Node '${id}' appears in multiple layers (${assignedSet.get(id)} & ${layer.id})`);
    assignedSet.set(id, layer.id);
  });
});

fileNodes.forEach(id => {
  if (!assignedSet.has(id)) issues.push(`File node '${id}' not in any layer`);
});

graph.tour.forEach((step, i) => {
  (step.nodeIds || []).forEach(id => {
    if (!nodeIds.has(id)) issues.push(`Tour step[${i}] refs missing node '${id}'`);
  });
});

const withEdges = new Set([
  ...graph.edges.map(e => e.source),
  ...graph.edges.map(e => e.target),
]);
graph.nodes.forEach(n => {
  if (!withEdges.has(n.id)) warnings.push(`Node '${n.id}' has no edges (orphan)`);
});

const stats = {
  totalNodes: graph.nodes.length,
  totalEdges: graph.edges.length,
  totalLayers: graph.layers.length,
  tourSteps: graph.tour.length,
  nodeTypes: graph.nodes.reduce((a, n) => { a[n.type] = (a[n.type] || 0) + 1; return a; }, {}),
  edgeTypes: graph.edges.reduce((a, e) => { a[e.type] = (a[e.type] || 0) + 1; return a; }, {}),
};

console.error('--- VALIDATION ---');
console.error(`issues: ${issues.length}, warnings: ${warnings.length}`);
if (issues.length) {
  console.error('First 10 issues:');
  issues.slice(0, 10).forEach(s => console.error('  ' + s));
}
console.error('Stats:', JSON.stringify(stats, null, 2));

// Save the graph regardless of warnings (per skill spec)
fs.writeFileSync(OUT, JSON.stringify(graph, null, 2));
console.error(`\nWrote knowledge-graph.json to ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);

// Write meta.json
const meta = {
  lastAnalyzedAt: new Date().toISOString(),
  gitCommitHash: commitHash,
  version: '1.0.0',
  analyzedFiles: scan.totalFiles,
};
fs.writeFileSync(path.join(PROJECT_ROOT, '.understand-anything', 'meta.json'), JSON.stringify(meta, null, 2));
console.error('Wrote meta.json');

// Write review.json so future tools can find it
fs.writeFileSync(path.join(INTER, 'review.json'), JSON.stringify({ issues, warnings, stats }, null, 2));

if (issues.length > 0) {
  console.error(`\n⚠️  ${issues.length} issues found — graph saved with warnings.`);
  process.exit(0); // Save anyway per skill spec
}
console.error('\n✅ Validation passed.');
