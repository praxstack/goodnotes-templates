# CLAUDE.md — goodnotes-templates

## Project

Open-source programmatic template generation system for GoodNotes and similar digital note-taking apps. TypeScript monorepo with CLI, theming, PDF/PNG/SVG generation pipeline.

## Key files

- `RESEARCH.md` — Deep market research and technical analysis
- `PROBLEM_STATEMENT.md` — Requirements, user segments, scope
- `src/` — Generation engine source code
- `output/` — Pre-built template PDFs, sticker PNGs, previews

## Commands

- `npm run generate` — Generate all assets
- `npm run test` — Run tests
- `npm run build` — TypeScript compile

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
