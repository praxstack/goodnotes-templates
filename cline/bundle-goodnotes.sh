#!/usr/bin/env bash
# bundle-goodnotes.sh — package the v9 outputs into a clean, GoodNotes-ready zip.
# Re-runnable: wipes its own staging dir each time. Reads from cline/output/.
# Run: bash cline/bundle-goodnotes.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/cline/output"
V9="$OUT/v9"
STAMP="$(date +%Y%m%d)"
PKG="Prax-Journal-v9-GoodNotes-$STAMP"
STAGE="$OUT/release/$PKG"
ZIP="$OUT/release/$PKG.zip"

rm -rf "$STAGE" "$ZIP"
mkdir -p "$STAGE"

# ── 1. Headline files (numbered so they sort first) ─────────────────────────
cp "$V9/v9-master-bundle.pdf"        "$STAGE/01 — START HERE — Everything (Master Bundle).pdf"
cp "$V9/prax-journal-v9-daily.pdf"   "$STAGE/02 — Daily Planner — 1 Month (linked).pdf"

# ── 2. Individual day spreads (Day 01 … Day 30) ─────────────────────────────
DAYS_DIR="$STAGE/Daily — one day at a time"
mkdir -p "$DAYS_DIR"
for f in "$V9"/daily/day-*.pdf; do
  n="$(basename "$f" .pdf | sed 's/day-//')"
  cp "$f" "$DAYS_DIR/Day $n.pdf"
done

# ── 3. Tools & extras (single pages, friendly names) ────────────────────────
# (case statement, not assoc arrays — works on macOS' bash 3.2)
TOOLS_DIR="$STAGE/Tools & Extras — pull what fits"
mkdir -p "$TOOLS_DIR"
nice_name() {
  case "$1" in
    "01-quick-start")          echo "What this is — quick start";;
    "03-crisis-card")          echo "If you are in crisis";;
    "04-cbt-thought-record")   echo "CBT — what did the thought say";;
    "05-self-worth-reframe")   echo "Talk it down — self-worth";;
    "06-tiny-task")            echo "The smallest first move";;
    "07-30-min-experiment")    echo "One timer, one observation";;
    "08-scene-capture")        echo "The moment, framed";;
    "09-stock-up")             echo "What needs restocking";;
    "10-doorway-A")            echo "Doorway — two years from now";;
    "11-doorway-B")            echo "Doorway — the sentence";;
    "12-doorway-C")            echo "Doorway — before it got heavy";;
    "13-doorway-D")            echo "Doorway — five years, exactly like this";;
    "14-pomodoro-capture")     echo "Pomodoro — park the thought";;
    "15-pomodoro-catch-decide")echo "Pomodoro — catch & decide";;
    "reminders-card")          echo "Remember — the operating rules";;
    "letter-to-no-one")        echo "Say it here — letter to no one";;
    "monthly-letter")          echo "Dear next month";;
    "weekly-strip")            echo "This week — weekly strip";;
    "therapy-prep-debrief")    echo "The session — prep & debrief";;
    "urge-reach-log")          echo "The wave — urge & phone-reach";;
    "permission")              echo "Permission";;
    "appendix-index")          echo "Appendix — index";;
    "daily-morning")           echo "Daily sample — Today (morning)";;
    "daily-todo")              echo "Daily sample — The list (todo)";;
    "daily-brain")             echo "Daily sample — Dump it (brain)";;
    "daily-midday")            echo "Daily sample — Midday";;
    "daily-evening")           echo "Daily sample — Today is closed (evening)";;
    *)                         echo "$1";;
  esac
}
for f in "$V9"/singles/*.pdf; do
  base="$(basename "$f" .pdf)"
  # skip the permission-day-NN samples (covered by the daily planner)
  case "$base" in permission-day-*) continue;; esac
  nice="$(nice_name "$base")"
  cp "$f" "$TOOLS_DIR/$nice.pdf"
done


# ── 4. Pomodoro tomato + reference pads (from non-v9 output) ────────────────
[ -f "$OUT/pomodoro-tomato/pomodoro-tomato.pdf" ] && cp "$OUT/pomodoro-tomato/pomodoro-tomato.pdf" "$TOOLS_DIR/Pomodoro — tomato timer pad.pdf"
[ -f "$OUT/tools/tools-reference.pdf" ]           && cp "$OUT/tools/tools-reference.pdf"           "$TOOLS_DIR/All tools — reference (15pp).pdf"

# ── 5. The Truth Deck (flip-through, 66 cards) ──────────────────────────────
[ -f "$OUT/truth-deck-flip.pdf" ] && cp "$OUT/truth-deck-flip.pdf" "$STAGE/Truth Deck — 66 cards (flip).pdf"

# ── 6. Printable sticker SHEETS ─────────────────────────────────────────────
SHEETS_DIR="$STAGE/Sticker Sheets — print & cut"
mkdir -p "$SHEETS_DIR"
cp "$V9/sticker-sheets/truth-sheet.pdf" "$SHEETS_DIR/Truth stickers.pdf"
cp "$V9/sticker-sheets/quote-sheet.pdf" "$SHEETS_DIR/Quote stickers.pdf"
cp "$V9/sticker-sheets/pill-sheet.pdf"  "$SHEETS_DIR/Pill stickers.pdf"

# ── 7. Loose stickers to import into GoodNotes (PNG = drop in, SVG = source) ─
STK_DIR="$STAGE/Stickers — import into GoodNotes"
for pack in truth quote pill; do
  mkdir -p "$STK_DIR/$pack"
  cp "$OUT/stickers/$pack/"*.png "$STK_DIR/$pack/" 2>/dev/null || true
  cp "$OUT/stickers/$pack/"*.svg "$STK_DIR/$pack/" 2>/dev/null || true
done

# ── 8. README ───────────────────────────────────────────────────────────────
cat > "$STAGE/README.txt" <<'README'
PRAX JOURNAL — v9
A warm, low-pressure A4 journal for GoodNotes (and any tablet PDF app).
Designed around one rule: only two pages are ever "owed" a day. Everything
else is optional. Blank is a complete entry.

────────────────────────────────────────────────────────────────────────
WHAT'S IN THIS FOLDER
────────────────────────────────────────────────────────────────────────
01 — START HERE — Everything (Master Bundle).pdf
      The whole kit in one file (~299 pages): the 1-month planner, sticker
      sheets, every tool, the pomodoro pads, and the 66-card truth deck.
      Import this if you just want ONE document to live in.

02 — Daily Planner — 1 Month (linked).pdf
      30 days. Each day is 6 colour-coded pages:
        • Today (amber)          — owed: the one frog + check-ins
        • The list (sage)        — optional: everything that's a "maybe"
        • Dump it (periwinkle)   — optional: brain dump, any order
        • Midday (terracotta)    — optional: a gentle reset
        • Today is closed (plum) — owed: evening close
        • Permission (rose)      — a different quote every day
      Ends with a tapping-linked appendix of all the tools.

Daily — one day at a time/
      The same 30 days split into single files (Day 01 … Day 30), in case
      you'd rather add one day at a time.

Tools & Extras — pull what fits/
      Every support page on its own: CBT thought record, self-worth reframe,
      crisis card, tiny task, 30-min experiment, the four doorways, pomodoro
      pages, weekly strip, monthly letter, reminders, therapy prep, urge log,
      letter to no one, + colour samples of each daily page type.

Truth Deck — 66 cards (flip).pdf
      A flip-through deck of truths, quotes & pills. Read ONE, then close it.

Sticker Sheets — print & cut/
      The truth/quote/pill cards laid out on A4 sheets to print and cut.

Stickers — import into GoodNotes/
      The cards as individual transparent images. Use the PNGs as GoodNotes
      stickers (drag onto any page). The SVGs are the editable vector source.

────────────────────────────────────────────────────────────────────────
HOW TO USE IN GOODNOTES
────────────────────────────────────────────────────────────────────────
THE PLANNER
  1. Open GoodNotes → New → Import.
  2. Pick "01 — START HERE" (everything) OR "02 — Daily Planner" (just the
     month). They import as a normal notebook you can write on with the pen.
  3. In the appendix index, tap a row to jump to that tool; tap the small
     "↑ index" hint on a tool page to come back. (Links work in GoodNotes;
     some other apps ignore them.)

THE STICKERS
  1. Open the "Stickers — import into GoodNotes" folder.
  2. In GoodNotes: open the Stickers/Elements panel → add a new collection →
     import the PNGs from truth/, quote/, pill/.
  3. On any "Today" page there's a dashed square (top-right of the truth box)
     and a "sticker zone" on Dump it — drag a sticker there, or anywhere.
  • Prefer paper? Print the "Sticker Sheets" folder instead and cut them out.

────────────────────────────────────────────────────────────────────────
THE ONLY RULE
────────────────────────────────────────────────────────────────────────
Two pages a day are owed: the morning "Today" and the evening "Today is
closed." Everything else — the list, the dump, midday, every tool — is a
menu, not a contract. One chip is enough. So is none.

Made for Prax. Depth is allowed; debt is not.
README

# ── 9. Zip it ───────────────────────────────────────────────────────────────
cd "$OUT/release"
zip -r -q "$PKG.zip" "$PKG"
SIZE="$(du -h "$ZIP" | awk '{print $1}')"
FILES="$(find "$STAGE" -type f | wc -l | tr -d ' ')"
echo "[bundle] $FILES files staged → $PKG"
echo "[bundle] zip ($SIZE): $ZIP"
