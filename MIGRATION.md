# MIGRATION · goodnotes-templates → pretext-templates

> If you landed here from `github.com/praxstack/goodnotes-templates`, this
> is the right repo. The old name is retired; all existing work moved in
> place and the history is preserved. This file tells you what changed,
> what didn't, and how to update any local scripts that pinned the old
> paths.

Eng-review W13 · CEO plan rebrand (row 20). Published on the first
`@pretext-templates/*` npm publish.

---

## What changed

| | Old | New |
|---|---|---|
| **Repo name** | `goodnotes-templates` | `pretext-templates` (same git remote, rename only) |
| **Package scope** | `goodnotes-templates` (root only) | `@pretext-templates/core` + `@pretext-templates/cli` + `@pretext-templates/gallery` |
| **Pack layout** | `packs/<category>/<id>/` | `packages/packs-<id>/` (flat) |
| **Theme CSS** | `shared/themes/*.css` | `packages/core/assets/themes/*.css` |
| **CLI entry** | `src/cli/index.ts` | `packages/cli/src/index.ts` |
| **Renderer** | `src/core/puppeteer-renderer.ts` | `packages/core/src/puppeteer-renderer.ts` |
| **Domain (planned)** | — | `pretext-templates.dev` + `raw.githubusercontent.com/praxstack/pretext-templates/main/registry.json` (fallback) |

## What did NOT change

- Every existing template renders pixel-identically to v0.6.x.
- `profile.json` schema is backwards-compatible (v1 profiles parse as v2
  with `schema_version: 1` preserved).
- Output PDFs are byte-stable across the rename on the same `node`
  version.
- MIT license · zero behavioural break for users of the rendered PDFs.

---

## If you are a pack user (rendering existing packs)

No action required. Pull the latest `main`, run `npm ci && npm test`,
and your existing render pipeline keeps working. The new canonical
render command is:

```bash
npx @pretext-templates/cli render \
  packages/packs-prax-journal/versions/v5/today.html \
  -o output/today.pdf
```

The legacy `npx tsx src/cli/index.ts render packs/journals/prax-journal/…`
path will not find files at the old locations. If you scripted this, update
to the new path.

## If you are a pack author (building your own pack)

1. Move (or create fresh at) `packages/packs-<your-id>/`.
2. Add a `manifest.json` validating against the Zod schema at
   `packages/core/src/types/registry.ts` (see [CONTRIBUTING.md](./CONTRIBUTING.md)
   and the gallery's `/contribute` page for the contract).
3. Your pack ID must match the directory name exactly — enforced at
   build time by `apps/gallery/scripts/validate-pack-ids.ts`.
4. Drop a one-file MDX stub into
   `apps/gallery/src/content/packs/<your-id>.mdx` so the gallery
   renders a detail page.

## If you are a consumer of `registry.json`

- **Primary URL** (live after first npm publish): `https://pretext-templates.dev/registry.json`
- **Fallback URL**: `https://raw.githubusercontent.com/praxstack/pretext-templates/main/registry.json`

Both serve the same bytes with `Cache-Control: max-age=300` planned for
the primary. Schema is locked at `schema_version: 1` for the W1–W10
releases. A future `schema_version: 2` bump is deliberately deferred
until a semver-aware consumer ships; see eng-review W11 + DECISIONS.md.

## If you scripted against the old repo

```bash
# One-liner path rewrite for any script pointing at the old layout:
perl -i -pe 's{packs/(journals|notes|planners|trackers|worksheets|covers)/([a-z][a-z0-9-]*)}{packages/packs-$2}g' \
  path/to/your/script.{ts,sh,js}
```

This is exactly the rewrite the sprint used to migrate 10+ internal
scripts (commit `dcf13a7`); it's safe on any text file that references
the old path shape.

---

## Why rebrand?

- `goodnotes-templates` ties the project to one vendor. Users render
  to Notability, Noteshelf, CollaNote, and straight-to-print PDF too.
- `pretext-templates` is vendor-neutral and describes what the packs
  actually are: pre-text (laid-out, typeset) templates.
- The domain `pretext-templates.dev` is reserved for the gallery
  (primary), docs (`/docs`), and registry.json (root).

See `~/.gstack/projects/goodnotes-templates/ceo-plans/*` for the full
rationale trail (commits reference it but those files are gitignored
sprint artefacts).

---

## Timeline

- **W1** · monorepo migration · `1a359d7` · **zero public breakage**
  because there was no public npm publish yet.
- **W5** · pack layout flattened · `dcf13a7`.
- **W13** · this file · `pretext-templates.dev` domain + npm publish
  pending.
- **W16** · v1.0 ship.

---

## Questions

Open an issue at `https://github.com/praxstack/pretext-templates/issues`
or a discussion at
`https://github.com/praxstack/pretext-templates/discussions`.
