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

## Current state (through W6)

- ✅ Astro 6.2.1 scaffold, MDX integration, strict tsconfig (W4)
- ✅ Content collection `packs` with Zod-validated frontmatter (W4)
- ✅ Three routes: home · browse · pack-detail (W4)
- ✅ BlurhashImage component — zero client JS · CSS placeholder only (W4)
- ✅ Build-time blurhash pipeline (`sharp` + `blurhash` npm) (W4)
- ✅ Specimen generator for prax-journal hero (W4)
- ✅ `DESIGN.md` extracted from approved wireframes-v2 (design-review D-3) (W4)
- ✅ 22 pack manifests + 22 MDX files wired into the gallery (W5)
- ✅ 21 MDX bodies enriched from per-pack READMEs (W6)
- ✅ CLI `--render-scale` flag (W6, deferred from W3 T3)
- ✅ D-1 production font cut 6 → 3 (W6)
- ✅ D-5 / D-6 / D-7 a11y audit complete (W6)
- ✅ D-12 mobile specimen collapse (W6)

## Deferred

- **D-2** remove "the stamp is real" meta-annotation + hand-drawn arrow when the full v2 layout is implemented (lives in wireframes-v2.html, not yet in the Astro routes)
- `/search` (W8) · `/contribute` (W11) · `/remix` (W12) routes
- Theme-swap demo surface (W7)
- Codespaces tour surface (W3 backfill — lives in MDX docs)
- Playwright E2E test for the mobile D-12 layout — lands in W14 alongside the other 5 E2E flows
- P3 #5 from the W6 review · share MIN/MAX render-scale constants between core and CLI (trivial, batch with a future core touch)

## References

- Approved direction: [wireframes-v2](../../.gstack/projects/goodnotes-templates/designs/pretext-gallery-homepage-20260430/wireframes-v2.html)
- Design review: `~/.gstack/projects/goodnotes-templates/praxlannister-main-design-review-20260430-2058.md`
- Eng review: `~/.gstack/projects/goodnotes-templates/praxlannister-main-eng-review-20260430-1935.md`
