# Contributing to goodnotes-templates

Thank you for your interest in contributing! This project welcomes templates, themes, sticker designs, bug fixes, and documentation improvements.

## Quick Start

```bash
git clone https://github.com/praxstack/goodnotes-templates.git
cd goodnotes-templates
npm install
npm run build                            # TypeScript check (must pass)
npm run start -- list                    # See available templates and paper sizes
npm run start -- render packs/journals/prax-journal/versions/v5/today.html  # Render one
npm run start -- preview                 # Browse output/ at http://127.0.0.1:3000
npm test                                 # Run unit tests
```

## What Can You Contribute?

Templates are **self-contained** — each HTML file owns its colors, fonts, and
layout (see `docs/HLD-self-contained-templates.md`). Adding a template is a
one-file change, not a multi-module change.

### 1. New HTML template
Pick a category (`journals`, `planners`, `trackers`, `notes`, `worksheets`) and
create `packs/<category>/<my-template>/<my-template>.html`:
- Inline all styles. No external fetches; we self-host fonts (see `shared/fonts/`).
- Use CSS variables for colors so users can re-theme via `.dark.css` siblings.
- Satisfy WCAG AA contrast (4.5:1 text, 3:1 large text) on every background.
- Add a `README.md` in the same directory describing the template's purpose.
- Register the template in `src/packs.ts` (the pack registry).
- Add a sample render to verify: `npm run start -- render packs/<category>/<my-template>/<my-template>.html`.

Optional: drop a `<my-template>.dark.css` sibling for the dark variant. It
gets injected with `--color-mode dark`.

For multi-version packs (e.g. Prax Journal), each version lives under its own
subdir: `packs/journals/<name>/versions/v<N>/<role>.html`.

### 2. New color theme
Add `shared/themes/<my-theme>.css` (and `<my-theme>-dark.css` for the
dark variant). Themes are pure CSS variable overrides; no code changes needed.
Use with `--color-mode <my-theme>`.

### 3. New sticker type
Add an SVG generator in `src/core/svg-renderer.ts`:
1. Add dimensions to `STICKER_SIZES`.
2. Add the type key to the `StickerType` union.
3. Write a `generate*()` function returning SVG markup (XML-escape any
   interpolated text — use the `escXml` helper).
4. Add a case to the `switch` in `generateStickerSVG()`.

### 4. Bug Fixes
- Run `npm test` before and after your fix
- Include a test that reproduces the bug

### 5. Documentation
- README improvements
- Template usage guides
- GoodNotes import instructions
- Translations of docs

## Code Style

- TypeScript strict mode
- All public functions need JSDoc comments
- Use descriptive variable names (not `x`, `y` outside coordinate contexts)
- Error messages must tell the user what to fix

## Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
```

Every new feature needs at least one test. Every bug fix needs a regression test.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add habit tracker template`
- `fix: correct dot-grid spacing calculation`
- `docs: add GoodNotes import guide`
- `test: add theme validation tests`

## Pull Request Process

1. Fork the repo and create a branch: `git checkout -b feat/my-template`
2. Make your changes and add tests
3. Run `npm test` and verify all pass
4. Generate assets to verify: `npm run start -- generate --theme warm-neutral --pages`
5. Submit PR with description of what you added and a screenshot if visual

## Design Principles

1. **Visual quality is non-negotiable** — Every template must look professional.
2. **Self-contained HTML** — One file per template; it owns its CSS (see HLD).
3. **Theme via override, not injection** — Templates define CSS variables; themes override them.
4. **GoodNotes-compatible** — PDF 1.7, sRGB, embedded fonts, internal hyperlinks only.
5. **Small files** — single-page PDFs <500 KB; stickers <200 KB each.
6. **Offline-capable** — No runtime network calls from the renderer.

## License

By contributing, you agree that your contributions will be licensed under:
- **MIT** for code
- **CC BY 4.0** for generated assets
