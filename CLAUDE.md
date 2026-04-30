# CLAUDE.md — working notes for this repo

_Intended audience: the AI agent paired with Prax. Kept short, updated as things change._

## Global guidelines first

**Read [`AGENTS.md`](./AGENTS.md) before writing any code.** It contains the
four Karpathy-derived principles that govern every edit in this repo:

1. **Think Before Coding** — don't assume · don't hide confusion · surface tradeoffs
2. **Simplicity First** — minimum code that solves the problem · nothing speculative
3. **Surgical Changes** — touch only what you must · every changed line must trace to the request
4. **Goal-Driven Execution** — define success criteria · loop until verified

When a principle in this file conflicts with `AGENTS.md`, `AGENTS.md` wins
(it's the global contract). Everything below is the local, project-specific
context layered on top.

## Repo shape (post-restructure)

- `packs/<category>/<name>/` — one folder per shippable template, self-contained HTML + README.
- `packs/journals/prax-journal/versions/v{N}/*.html` — every historical + current Prax Journal version.
- `shared/` — fonts (Fraunces, Instrument Sans, JetBrains Mono), `base.css`, theme swaps.
- `src/packs.ts` — the pack registry. Add every new template here.
- `src/core/puppeteer-renderer.ts` — the renderer. Network-blocked except fonts.googleapis.com.
- `src/cli/index.ts` — entry point. `npx tsx src/cli/index.ts render <html> -o <pdf>`.
- `tests/visual/` — pixel-diff regression suite (sharp, 0.5% drift budget).
- `docs/plan-*` — every planning + review doc lives here. Never delete.
- `output/` — rendered PDFs + screenshots. Gitignored.

## The five locked decisions (v5.3 scope)
Locked in `docs/plan-ceo-review-v4-five-decisions-locked.md`:

| # | Decision | Status |
|---|---|---|
| Q1 | Monthly page = **hybrid** (baked-in blank + AI-filled post-hoc) | C2 ✅ shipped at `9f13aa3` |
| Q2 | Quarterly page = **hybrid**, narrative grammar | C3 pending |
| Q3 | Practice-of-week = **defer** to post-month-1 retro | skipped in v5.3 |
| Q4 | `profile.json` = **data-only reference**, templates stay hardcoded | C4 pending · G3 critical (PII not in repo) |
| Q5 | Generator CLI = **full CLI**, documented in 4 places | C7+C8 pending |

## gstack `browse` — the one-page cheat sheet

**It is working. If it seems broken, re-read this first.** The binary at
`~/.claude/skills/gstack/browse/dist/browse` (≈61 MB Mach-O arm64) is healthy.
Verify with `browse status`. Everything below is things I got wrong and how to
get them right.

### Command map (abbreviated · full list: `browse` alone)

| Intent | Right command | Common mistake |
|---|---|---|
| Go to URL | `browse goto <url>` | ❌ `browse nav` — doesn't exist |
| Wait for load | `browse wait --load` or `wait --networkidle` | ❌ `browse wait 1200` — `wait` takes a **selector** or a flag, not ms. Use plain `sleep 1.2` from the shell if you need a time-based pause |
| Run JS | `browse js "<expr>"` — expression goes in **quotes as one arg** | ❌ `browse eval "<expr>"` — `eval` reads a **file**, so a JS literal explodes into ENAMETOOLONG. Use `js` for inline, `eval` for a file path |
| Full-page screenshot | `browse screenshot <path>` (default is full page) | ❌ `--fullpage` is not a flag; there is no `--help` flag anywhere |
| Viewport-only screenshot | `browse screenshot --viewport <path>` | |
| Set viewport | `browse viewport 794x1123` | Required for repeatable A4 geometry (794×1123 = 210×297mm @ 96dpi) |
| Element geometry | `browse js "document.querySelector('.page').getBoundingClientRect()"` | Wrap in `JSON.stringify(...)` to get a readable return |
| Inspect | `browse html [selector]`, `browse text`, `browse attrs <sel>`, `browse console` | |
| Server control | `browse status`, `browse restart`, `browse stop` | Browser stays alive between invocations — this is the point |

### The 5-command A4 verification recipe (use this for every new template)

```bash
BROWSE=~/.claude/skills/gstack/browse/dist/browse
"$BROWSE" viewport 794x1123
"$BROWSE" goto "file://$(pwd)/packs/.../foo.html"
"$BROWSE" wait --load
"$BROWSE" screenshot output/foo-verify.png
"$BROWSE" js "JSON.stringify({pageH: document.querySelector('.page').getBoundingClientRect().height, overflow: document.querySelector('.page').scrollHeight - document.querySelector('.page').clientHeight})"
```

Pass criteria: `pageH ≈ 1122.5` (A4 height in px at 96dpi rounds to 1123) and
`overflow === 0`. Anything else means the CSS is leaking past the page
boundary — re-check flex `min-height: 0` / `flex: 1` / `overflow: clip` on
`.page`.

### Known confusions (if it ever actually breaks)

1. **`--help` does nothing.** There is no help flag. Run `browse` with no args
   for the full command list, or `browse <command>` with no further args for
   per-command usage.
2. **`wait` is a selector-wait.** `browse wait 1200` fails because Playwright
   tries to parse `1200` as a CSS selector. Use `wait --load`, `wait --networkidle`,
   `wait <selector>`, or `sleep 1.2` in the shell.
3. **`eval` reads a file, not a string.** Use `js` for inline expressions.
   `eval <path-to-.js>` is the file variant.
4. **Server dies silently only if the Mach-O binary is corrupted.** If
   `browse status` hangs or errors, run `browse restart`. If that fails,
   `codesign --verify` the binary and reinstall via gstack's upgrade path.
5. **The skill dir has `drwx------` on `dist/`.** That's intentional (by the
   gstack installer) and doesn't affect invocation — your user already owns it.

### Install verification (if in doubt)

```bash
file ~/.claude/skills/gstack/browse/dist/browse    # → Mach-O 64-bit executable arm64
~/.claude/skills/gstack/browse/dist/browse status  # → Status: healthy
ls -la ~/.claude/skills/gstack/browse/             # → SKILL.md + bin/ + dist/ + src/ present
```

All three should succeed. If one fails, reinstall gstack — don't paper over it.

## Render + verify pipeline (current canonical flow)

1. Author HTML in `packs/<cat>/<name>/<file>.html` — self-contained, one
   `<style>` block, cream paper, Warm Analog Editorial tokens.
2. Register in `src/packs.ts` (`TEMPLATE_REGISTRY` array).
3. Render to PDF: `npx tsx src/cli/index.ts render <path> -o output/<name>.pdf`.
4. gstack-verify geometry via the 5-command recipe above.
5. Eye-check the screenshot in Preview (`open -a Preview output/<name>-verify.png`).
6. Run gates: `npx tsc --noEmit && npx eslint src/ && npx vitest run`.
7. Atomic commit with a `feat(<pack>): ...` header + block map + verification
   evidence in the body.

## Current HEAD and commit log (post-v5.3 · Praxis Ledger release pipeline live)
- `815ac1c` — audit wrap (Phase 0 done)
- `0090599` — Phase-1 restructure complete
- `b2db914` — C1 · Weekly blank page
- `d929307` — CEO v4 (5 decisions locked)
- `d5fa6ce` — Eng v4 + Design v4 reviews committed
- `9f13aa3` — C2 · Monthly blank page
- `630b3ed` — v5 brain-dump · watermark removed, ruler redesigned
- `43917d0` / `bedf8e5` — C7b.1 / C7b.1++ · PII substitution + 8-row Rx extension
- `fa0d355` — C7b.2 · pdf-splice (PageSpec renders → one PDF with flat bookmarks)
- `f292477` — C7b.4 · CLI wiring (`scripts/generate-journal.ts`)
- `75b71a1` / `a1a7236` — DAY_* date tokens across all 4 daily templates + 14 unit tests
- `86ac274` — hybrid skeuomorphic pack · deep-paper shell + 4 archetypes
- `a2a43a6` / `a132038` — Wave-1 (20) + Wave-2 (28) build scripts + 48 new SVGs → 60-sticker pack
- `1547280` / `ec27c9d` / `ebd5297` — `output/all-stickers/` browse gallery (real PNG copies, no symlinks)
- `1fad6cf` — `scripts/bundle-release.ts` · **The Praxis Ledger** monthly release builder
- `e96c88f` — **standalone HTML export + source-html templates in bundle (HEAD)**

## The release pipeline (canonical flow · as of e96c88f)

```bash
# 1. Render the month's bookmarked PDF
npx tsx scripts/generate-journal.ts \
  --from 2026-05-01 --to 2026-05-31 \
  --out output/journal-may-2026.pdf

# 2. Bundle into "The Praxis Ledger — <Month YYYY>/"
npx tsx scripts/bundle-release.ts \
  --pdf output/journal-may-2026.pdf \
  --month "May 2026" \
  --from 2026-05-01 --to 2026-05-31
```

The bundle script auto-invokes `scripts/build-standalone-html.ts` when
`--from/--to` are present (no `--html`). The standalone-HTML builder replays
`buildPageSequence → resolvePageSpecFiles → substituteProfile` in-process
(no Puppeteer), extracts each page's `<body>`, dedupes `<style>` blocks via
`Set<string>`, and stitches into one self-contained HTML with
`@page { size: A4 portrait }` + `break-after: page` per section. 135 pages
lands at ~1.5 MB because the 5 base64-inlined fonts dedupe to one copy
(not 135×).

Output tree:

```
output/The Praxis Ledger — <Month YYYY>/
├── README.md
├── The Praxis Ledger — <Month YYYY>.pdf      (54 MB · 135 pp · 39 bookmarks)
├── The Praxis Ledger — <Month YYYY>.html     (1.5 MB · 135 pp · 5 base64 fonts)
├── assets/
│   ├── fonts/         Fraunces · Instrument Sans · JetBrains Mono
│   ├── css/           base.css + 14 themes
│   └── source-html/   today · midday · reflect · brain-dump · weekly · monthly · quarterly · design-system
└── sticker-pack/
    ├── README.md
    ├── pngs/{all,compact-400x600,standard-600x600,expanded-800x600}/
    └── svgs/
```

Bundle lives under `output/` (gitignored, ~766 MB per month).

## Next (all deferred — core C7b.* pipeline is shipped)
- **C7b.3** — Memory-aware browser-restart loop in journal renderer (for >100-spec runs)
- **Schema v2** — DOB, weight, allergies, emergency contact, structured therapist fields (flagged in CEO plan)
- **AI curation layer** — sticker-of-the-week rotation + goal-based bundle picks
  (Framings B + C from `docs/plan-ceo-review-sticker-expansion-v1.md`)

---

_Last updated 2026-04-30 after e96c88f · standalone HTML + source templates in bundle._
