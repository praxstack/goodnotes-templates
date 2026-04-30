# `@pretext-templates/gallery`

Astro 6 static gallery for pretext-templates. Home / Browse / Pack-detail
routes, MDX-backed pack pages, blurhash placeholders for specimen imagery.

Landed W4 T1–T3 of the eng-review sprint
(`~/.gstack/projects/goodnotes-templates/praxlannister-main-eng-review-20260430-1935.md`).

## Layout

```
apps/gallery/
├─ astro.config.mjs         # Astro 6 config (MDX integration, static output)
├─ DESIGN.md                # design-review D-3 — tokens & A11Y rules
├─ scripts/
│  ├─ generate-specimens.ts # renders pack hero PNGs via puppeteer
│  └─ encode-blurhash.ts    # emits src/data/blurhash-manifest.json
├─ src/
│  ├─ content.config.ts     # content-layer schema for the `packs` collection
│  ├─ content/packs/*.mdx   # one MDX per pack
│  ├─ components/BlurhashImage.astro
│  ├─ data/blurhash-manifest.json   # byte-stable, build-time encoded
│  ├─ layouts/Layout.astro
│  ├─ pages/
│  │  ├─ index.astro              # /
│  │  ├─ browse.astro             # /browse
│  │  └─ packs/[id].astro         # /packs/:id
│  └─ styles/global.css
└─ public/specimens/*.png  # generated, gitignored
```

## Commands

From the repo root:

```bash
# dev server at http://localhost:4321
npm run dev -w @pretext-templates/gallery

# render specimen hero PNGs
npm run generate:specimens -w @pretext-templates/gallery

# encode blurhash manifest from those PNGs
cd apps/gallery && npx tsx scripts/encode-blurhash.ts

# full static build to apps/gallery/dist/
npm run build -w @pretext-templates/gallery
```

## W4 scope (complete)

- ✅ Astro 6.2.1 scaffold, MDX integration, strict tsconfig
- ✅ Content collection `packs` with Zod-validated frontmatter
- ✅ Three routes: home, browse, pack-detail
- ✅ Three seed MDX packs (`prax-journal` stable, `cornell-notes`/`morning-pages` stub)
- ✅ BlurhashImage component (zero client JS — CSS placeholder only)
- ✅ Build-time blurhash pipeline (`sharp` + `blurhash` npm)
- ✅ Specimen generator for one real hero (prax-journal)
- ✅ `DESIGN.md` extracted from approved wireframes-v2 (design-review D-3)

## Deferred

- **D-1** production font cut 6→3 (Fraunces + JetBrains Mono + Caveat) — polish before ship
- **D-2** remove "the stamp is real" meta-annotation + hand-drawn arrow when the full v2 layout is implemented
- `/search` (W8) · `/contribute` (W11) · `/remix` (W12) routes
- Theme-swap demo surface (W7)
- Codespaces tour surface (W3 backfill — lives in MDX docs)
- Pack-migration integration: wire remaining 6 MDX files when `packages/packs-*` lands (W5–W6)

## References

- Approved direction: [wireframes-v2](../../.gstack/projects/goodnotes-templates/designs/pretext-gallery-homepage-20260430/wireframes-v2.html)
- Design review: `~/.gstack/projects/goodnotes-templates/praxlannister-main-design-review-20260430-2058.md`
- Eng review: `~/.gstack/projects/goodnotes-templates/praxlannister-main-eng-review-20260430-1935.md`
