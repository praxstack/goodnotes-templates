#!/usr/bin/env node
// Wrapper to run all official @understand-anything builders.
// Usage: node run-builders.mjs <which> <projectRoot> [extra args]
//   which ∈ {onboard, explain, chat, diff}

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const which = process.argv[2];
const PROJECT_ROOT = process.argv[3];
if (!which || !PROJECT_ROOT) {
  console.error('Usage: run-builders.mjs <which> <projectRoot> [extra args]');
  process.exit(1);
}

const PLUGIN_DIST = '/Users/praxlannister/.understand-anything-plugin/dist';
const builders = await import(path.join(PLUGIN_DIST, 'index.js'));

const graphPath = path.join(PROJECT_ROOT, '.understand-anything', 'knowledge-graph.json');
if (!fs.existsSync(graphPath)) {
  console.error(`No knowledge-graph.json at ${graphPath}. Run /understand first.`);
  process.exit(1);
}
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));

if (which === 'onboard') {
  const md = builders.buildOnboardingGuide(graph);
  const docsDir = path.join(PROJECT_ROOT, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  const out = path.join(docsDir, 'ONBOARDING.md');
  fs.writeFileSync(out, md);
  console.error(`Wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB, ${md.split('\n').length} lines)`);
  process.exit(0);
}

if (which === 'explain') {
  const target = process.argv[4]; // node id
  const ctx = builders.buildExplainContext(graph, target);
  console.log(builders.formatExplainPrompt(ctx));
  process.exit(0);
}

if (which === 'chat') {
  const question = process.argv.slice(4).join(' ');
  const out = builders.buildChatPrompt(graph, question);
  // Write context.md and prompt.md
  const dir = path.join(PROJECT_ROOT, '.understand-anything');
  fs.writeFileSync(path.join(dir, 'chat-prompt.md'), out);
  console.error(`Wrote ${path.join(dir, 'chat-prompt.md')} (${out.length} bytes)`);
  process.exit(0);
}

if (which === 'diff') {
  const fromRef = process.argv[4] || 'HEAD~1';
  const toRef = process.argv[5] || 'HEAD';
  // Build diff context
  let diffOut;
  try {
    diffOut = execSync(`git diff ${fromRef} ${toRef} --name-only`, { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  } catch (e) {
    console.error('Could not get git diff:', e.message);
    process.exit(1);
  }
  const changedFiles = diffOut.split('\n').filter(Boolean);
  const ctx = builders.buildDiffContext(graph, changedFiles);
  const fmt = builders.formatDiffAnalysis(ctx);
  console.log(fmt);
  process.exit(0);
}

console.error(`Unknown builder '${which}'. Use onboard|explain|chat|diff.`);
process.exit(1);
