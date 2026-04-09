# Contributing to goodnotes-templates

Thank you for your interest in contributing! This project welcomes templates, themes, sticker designs, bug fixes, and documentation improvements.

## Quick Start

```bash
git clone https://github.com/yourusername/goodnotes-templates.git
cd goodnotes-templates
npm install
npm run start -- list                    # See available themes and template types
npm run start -- generate --pages --stickers --theme warm-neutral  # Generate a subset
npm run start -- preview                 # Browse generated assets at localhost:3000
npm test                                 # Run tests
```

## What Can You Contribute?

### 1. New Themes
Add a new color palette to `src/core/themes.ts`:
- Pick 6 colors: primary, secondary, accent, background, text, muted
- Choose 3 Google Fonts: header, body, accent
- All colors must meet WCAG AA contrast ratio (4.5:1 for text)
- Include both the theme and add a test in `tests/unit/themes.test.ts`

Or create a JSON custom theme (see `examples/custom-theme.json`).

### 2. New Simple Page Types
Add a new drawing function in `src/core/pdfkit-renderer.ts`:
1. Add the type to `SimplePageType` union
2. Write a `draw*Page()` function
3. Add a case to the switch in `renderSimplePage()`
4. Add variants to the page generation loop in `src/core/renderer.ts`

### 3. New Sticker Types
Add a new SVG generator in `src/core/svg-renderer.ts`:
1. Add dimensions to `STICKER_SIZES`
2. Add the type to `StickerType`
3. Write a `generate*()` function returning SVG markup
4. Add a case to `generateStickerSVG()`
5. Add generation config to `src/core/renderer.ts`

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

1. **Visual quality is non-negotiable** — Every template must look professional
2. **Programmatic first** — Everything is generated from code, not drawn manually
3. **Theme-aware** — All templates must work with any theme
4. **GoodNotes-compatible** — PDF 1.7, sRGB, embedded fonts, internal hyperlinks only
5. **Small files** — Simple pages <500KB, stickers <200KB each

## License

By contributing, you agree that your contributions will be licensed under:
- **MIT** for code
- **CC BY 4.0** for generated assets
