# goodnotes-templates fixes (P0/P1), branch fix/audit-2026-10
No P0 findings. Nothing pushed, no PRs, history untouched. Final state: build OK, lint 0 errors (2 pre-existing warnings), `npm test` 29 files / 411 tests pass, gallery check 0 errors, render-all-packs 27 ok, gallery build OK, `npm ci --dry-run` OK, `npm audit --audit-level=high` clean.

| ID | Status | Commit | Test evidence | Remains / owner decisions |
|---|---|---|---|---|
| GNT-001 | fixed | 6c17476 | tests/unit/lockfile-sync.test.ts: fails on old lock (npm ci --dry-run EUSAGE), passes on new | Removed pnpm-lock.yaml and pnpm-workspace.yaml (owner: confirm pnpm is not used). SETUP.md "use npm install" workaround is now obsolete. |
| GNT-003 | fixed | a2a8f50 | lockfile-sync.test.ts version floors (3 fail before, pass after); audit high=0; build, lint, tests, gallery check/build, render-all all pass | astro 6.3.1->7.3.7, @astrojs/mdx 5.0.4->8.0.3, sharp 0.34.5->0.35.5, puppeteer ^23->25.12.0 (major bumps; PDF render verified on 27 packs, but visual diff of PDFs not performed). Dependabot #22-24 can be closed or rebased. |
| GNT-002 | fixed | 48fc7aa | tests/unit/workflows.test.ts: 4 fail before, 4 pass after | generate.yml now runs scripts/render-all-packs.ts, uploads dist/packs/, path filters fixed, release body text updated. Not run on GitHub; stickers/manifest steps removed because those outputs do not exist in the current CLI. README Quick start still has the stale src/cli path (not in scope). |
| GNT-025 | fixed (partial of suggested fix) | fd4f224 | tests/unit/bundle-release.test.ts: 2 CLI tests fail before, 12 pass after | Added --month validation, containment check under output/, PDF existence check before rmSync (scripts/bundle-paths.ts). Not done: building in a temp dir then swapping. |
| GNT-019 | addressed in the working tree | 1845361 | tests/unit/example-pdf-pii.test.ts | Privacy item; details kept privately by the owner. |
