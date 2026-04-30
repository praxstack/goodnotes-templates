/**
 * generate-specimens — renders hero PNGs for each pack using the existing
 * core Puppeteer pipeline. W4 T3 scaffold: for now we only produce the
 * `prax-journal` hero from examples/prax-journal/prax_adhd_planner.html.
 *
 * Rendering is delegated to a minimal puppeteer wrapper here rather than
 * importing @pretext-templates/core to avoid coupling the gallery to the
 * full renderer surface at W4. The pack-migration weeks (W5-W6) will wire
 * this to use core's pipeline uniformly.
 */

import { mkdir, access } from 'node:fs/promises';
import { constants as fsC } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(GALLERY_ROOT, '..', '..');
const OUT_DIR = path.join(GALLERY_ROOT, 'public', 'specimens');

// Hero dimensions per DESIGN.md · 3:4 portrait (pack specimen card).
const WIDTH = 1200;
const HEIGHT = 1600;

type Target = { id: string; source: string };

const TARGETS: Target[] = [
  {
    id: 'prax-journal',
    source: path.join(REPO_ROOT, 'examples', 'prax-journal', 'prax_adhd_planner.html'),
  },
];

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, fsC.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function renderOne(target: Target): Promise<void> {
  const outPath = path.join(OUT_DIR, `${target.id}.png`);
  if (!(await exists(target.source))) {
    console.warn(`[generate-specimens] source missing, skipping: ${target.source}`);
    return;
  }

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    const sourceUrl = `file://${target.source}`;
    await page.goto(sourceUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.screenshot({ path: outPath as `${string}.png`, type: 'png', fullPage: false });
    console.log(
      `[generate-specimens] ${target.id} → ${path.relative(GALLERY_ROOT, outPath)}`,
    );
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  for (const t of TARGETS) {
    await renderOne(t);
  }
}

await main();
