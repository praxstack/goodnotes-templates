#!/usr/bin/env node
// Deterministic explainer — produces a markdown deep-dive for a target node
// using the existing knowledge graph + source file content.
//
// Usage: node ua-explain.mjs <projectRoot> <nodeId> <outFile>

import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.argv[2];
const TARGET = process.argv[3];
const OUT = process.argv[4];
if (!PROJECT_ROOT || !TARGET || !OUT) {
  console.error('Usage: ua-explain.mjs <projectRoot> <nodeId> <outFile>');
  process.exit(1);
}

const graph = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, '.understand-anything', 'knowledge-graph.json'), 'utf-8'));
const target = graph.nodes.find(n => n.id === TARGET);
if (!target) {
  console.error(`Node not found: ${TARGET}`);
  process.exit(1);
}

const nodeById = new Map(graph.nodes.map(n => [n.id, n]));

// Outgoing edges
const out = graph.edges.filter(e => e.source === TARGET);
const inc = graph.edges.filter(e => e.target === TARGET);

// Layer
const layer = graph.layers.find(l => l.nodeIds.includes(TARGET));

// Read source if file-level
let src = '';
let srcLines = 0;
if (target.filePath) {
  try {
    src = fs.readFileSync(path.join(PROJECT_ROOT, target.filePath), 'utf-8');
    srcLines = src.split('\n').length;
  } catch {}
}

// Find functions/classes that this file contains
const containedIds = out.filter(e => e.type === 'contains').map(e => e.target);
const contained = containedIds.map(id => nodeById.get(id)).filter(Boolean);

// Functions/classes by line
const fns = contained.filter(n => n.type === 'function');
const classes = contained.filter(n => n.type === 'class');

// Imports / depends
const imports = out.filter(e => e.type === 'imports').map(e => nodeById.get(e.target)).filter(Boolean);
const incomingImports = inc.filter(e => e.type === 'imports').map(e => nodeById.get(e.source)).filter(Boolean);

// Build markdown
const lines = [];
lines.push(`# Explain: \`${target.name}\``);
lines.push('');
lines.push(`> ${target.summary}`);
lines.push('');
lines.push('| | |');
lines.push('|---|---|');
lines.push(`| **ID** | \`${target.id}\` |`);
lines.push(`| **Type** | \`${target.type}\` |`);
if (target.filePath) lines.push(`| **Path** | \`${target.filePath}\` (${srcLines} lines) |`);
lines.push(`| **Complexity** | \`${target.complexity || 'n/a'}\` |`);
lines.push(`| **Tags** | ${(target.tags || []).map(t => `\`${t}\``).join(', ')} |`);
if (layer) lines.push(`| **Layer** | **${layer.name}** — ${layer.description} |`);
lines.push('');

// Role in architecture
lines.push('## Role in the Architecture');
lines.push('');
if (layer) {
  lines.push(`This file lives in the **${layer.name}** layer.`);
  lines.push('');
  lines.push(`> ${layer.description}`);
  lines.push('');
}
lines.push(`The file's stated purpose: ${target.summary}`);
lines.push('');

// Internal structure
if (fns.length > 0 || classes.length > 0) {
  lines.push('## Internal Structure');
  lines.push('');
  lines.push(`This file contains **${fns.length} function${fns.length === 1 ? '' : 's'}** and **${classes.length} class${classes.length === 1 ? '' : 'es'}** that survived the significance filter (≥10 lines or exported).`);
  lines.push('');
  if (fns.length > 0) {
    lines.push('### Functions');
    lines.push('');
    lines.push('| Name | Lines | Complexity | Tags | Summary |');
    lines.push('|---|---|---|---|---|');
    for (const f of fns) {
      const lr = f.lineRange ? `${f.lineRange[0]}-${f.lineRange[1]}` : '?';
      const tags = (f.tags || []).join(', ');
      lines.push(`| \`${f.name}\` | ${lr} | ${f.complexity || ''} | ${tags} | ${f.summary} |`);
    }
    lines.push('');
  }
  if (classes.length > 0) {
    lines.push('### Classes');
    lines.push('');
    lines.push('| Name | Lines | Complexity | Tags | Summary |');
    lines.push('|---|---|---|---|---|');
    for (const c of classes) {
      const lr = c.lineRange ? `${c.lineRange[0]}-${c.lineRange[1]}` : '?';
      const tags = (c.tags || []).join(', ');
      lines.push(`| \`${c.name}\` | ${lr} | ${c.complexity || ''} | ${tags} | ${c.summary} |`);
    }
    lines.push('');
  }
}

// External connections
lines.push('## External Connections');
lines.push('');
lines.push(`### Imports (\`${imports.length}\`)`);
lines.push('');
if (imports.length === 0) {
  lines.push('_No project-internal imports detected (file may use only external packages)._');
} else {
  for (const n of imports.slice(0, 50)) lines.push(`- \`${n.id}\` — ${n.summary || ''}`);
  if (imports.length > 50) lines.push(`- _… and ${imports.length - 50} more_`);
}
lines.push('');
lines.push(`### Imported by (\`${incomingImports.length}\`)`);
lines.push('');
if (incomingImports.length === 0) {
  lines.push('_No project-internal consumers detected._');
} else {
  for (const n of incomingImports.slice(0, 50)) lines.push(`- \`${n.id}\` — ${n.summary || ''}`);
  if (incomingImports.length > 50) lines.push(`- _… and ${incomingImports.length - 50} more_`);
}
lines.push('');

// Source code excerpt
if (src) {
  const head = src.split('\n').slice(0, 80).join('\n');
  const ext = path.extname(target.filePath).slice(1) || 'text';
  lines.push('## Source Code (head, first 80 lines)');
  lines.push('');
  lines.push('```' + ext);
  lines.push(head);
  lines.push('```');
  lines.push('');
}

// Notable patterns / language notes
if (target.languageNotes) {
  lines.push('## Language Notes');
  lines.push('');
  lines.push(target.languageNotes);
  lines.push('');
}

// Closing
lines.push('## How To Modify Safely');
lines.push('');
const totalConnections = imports.length + incomingImports.length;
if (totalConnections === 0) {
  lines.push('- This file is a leaf in the import graph at the time of analysis. Changes here have no detected import-level blast radius, but the file may still be invoked at runtime via dynamic loading, the registry, or build scripts. Always run the test suite (`pnpm vitest`) before shipping.');
} else if (totalConnections < 10) {
  lines.push(`- Small blast radius (~${totalConnections} import-level connections). Run \`pnpm vitest\` and visual regression to catch regressions.`);
} else {
  lines.push(`- **Wide blast radius (${totalConnections} import-level connections)** — changes here propagate. Run the full test suite plus visual regression and consider a draft PR for review.`);
}
if (target.complexity === 'complex') {
  lines.push('- Marked **complex**. Consider breaking changes into smaller PRs.');
}
lines.push('');
lines.push('---');
lines.push(`Generated by \`/understand-explain\` from \`.understand-anything/knowledge-graph.json\` at ${graph.project.gitCommitHash || '(unknown commit)'}.`);

fs.writeFileSync(OUT, lines.join('\n'));
console.error(`Wrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
