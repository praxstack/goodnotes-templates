# Prax Journal v7 — Full Page Specification

> **What this document is.** A complete, field-by-field blueprint for v7, derived
> from an exhaustive inventory of every v6 page (`pages/`, 34 pages) and every v5
> restyled page (`pages-v5restyled/`, 7 pages) — 41 source pages in total — cross-
> referenced against the v7 plan agreed in conversation (3-notebook architecture,
> frog task method, therapy-derived themes, expanded sticker library).
>
> **Nothing here is built yet.** This is the spec you annotate *before* a single
> v7 HTML file is written. For every page it lists: the heading/label sequence in
> document order, every field the page asks for, the microcopy/comment under each,
> and — critically — **what is dropped or changed** versus the v6/v5 version it
> descends from.
>
> **Evidence basis.** Field lists are extracted verbatim from the live source HTML
> (visible-text extraction, document order preserved). Where a v7 field is *new*
> (not in any source page) it is marked **[NEW]**. Where a source field is *cut* it
> is listed under "Dropped from previous."
>
> **Design language (carried forward from v6, locked).** A4 portrait 210×297mm ·
> Fraunces italic display · Instrument Sans body · JetBrains Mono labels (lowercase
> kicker in `§ section · page` form) · warm paper palette (spine `#F6EFE2`, shelf
> `#F2F0EC`, weekly `#E8EEE6`, monthly `#F1EFED`, reference `#F0F0EF`) · ink `#1f2126`
> · quiet `#6E6658` · whisper `#B5AD9F` · sage `#4E6249` · clay `#c08866` · 6mm clay
> bind-bleed · paper grain · vertical spine label per page.
>
> **Tone rubric (every page must pass all 8).** No motivation-required · no false
> empathy · no shame · no jargon · no gamification · no wellness-app voice · no
> false promises · no lying. "Blank is a complete entry" is the recurring contract.

---

## 0. The core problem v7 fixes

The v6 build is **two journals stacked on top of each other**. `pages/` (v6) and
`pages-v5restyled/` build the same daily/weekly/monthly/quarterly surfaces *twice*,
in two different voices:

| Concept | v6 page (`pages/`) | v5-restyled page (`pages-v5restyled/`) |
|---|---|---|
| Morning daily | `01-daily-checkin` (mood chips, poetic) | `today` (frog, rule-of-3, water, meditation, structured) |
| Brain dump | `02-brain-dump` (clean open paper) | `brain-dump` (sticker zones, three-good-things) |
| Evening | `03-evening-close` (3 reflective prompts, poetic) | `reflect` (done/moved, mood/anx/energy ratings, chest-kg ×3) |
| Midday | `27-midday-reset` (re-orient prose) | `midday` (jar log ×3, pseudo-doing, thought-flip) |
| Weekly | `12-weekly` L+R spread (visual strip) | `weekly` (wins jar, named patterns, next-week frog) |
| Monthly | `13-letter-week-1..4` + `14-doorway` | `monthly` (wins, patterns, best/worst day) |
| Quarterly | `28-quarterly-witness` | `quarterly` (narrative, worked/didn't, identity shift) |
| Pomodoro | `25-pomodoro-thoughts` + `26-...-alt` (two versions of one page) |

**v7's central move:** stop counting *pages*, start counting *components*. The two
voices are merged — v5's structure (it asks for real data: the frog, the jar, chest-kg,
rule-of-3) fused with v6's voice and design system (the calm kicker labels, the warm
paper, the "blank is a complete entry" contract). Then split across **three notebooks**
so the daily commitment is only 3 pages.

---

## 1. Architecture — three notebooks

| Notebook | Contents | Daily load |
|---|---|---|
| **A · Daily** | Morning · Midday · Evening (the spine) + theme-card deck bound in | 3 pages/day |
| **B · Tools & Reference** | CBT record · self-worth · tiny task · 30-min experiment · weekly review · monthly review · quarterly witness · crisis card · quick-start · permission · scene-capture · stock-up | as-needed |
| **C · Pomodoro pad** | Thin sprint pad: capture, catch-&-decide | per focus session |

Plus a **sticker sheet** (transparent PNGs, dragged into the brain-dump zone of any page).

The 14 reusable **components** identified across all 41 source pages:

1. **Date/day meta** — `date · ___` + `day / mon tue wed thu fri sat sun` chip row (from v5 `today`/`midday`/`reflect`/`brain-dump`).
2. **Mood/energy/anxiety/focus chip rows** — 5-step word ladders (from v6 `01-daily-checkin`).
3. **Body word + chest-kg** — one-word body check + chest weight in kg (from v5 `today`/`reflect`/`midday`).
4. **The frog block** — one concrete ≤25-min task, done first (from v5 `today`; method in `07-adhd-focus-booster`).
5. **Rule-of-3 priorities** — `# / what / when / est` table, max 3 rows (from v5 `today`).
6. **First-physical-action** — the smallest startable movement (from v6 `07`).
7. **If-then plan** — "I'll do X at [time] in [place]" (sticker pack `if-then`, v5 `brain-dump`).
8. **Processing-jar log** — jar level overflow→empty, logged 3×+ (from v5 `midday`).
9. **Pseudo-doing check** — real task vs the prerequisite you drifted into (from v5 `midday`, v6 `27`).
10. **Thought-flip** — brain's claim → is it true? → kinder honest version (from v5 `midday`/`brain-dump`).
11. **Pattern spotter** — tick named patterns each time (from v5 `weekly`, v6 sticker pack `pattern-names`).
12. **Practices row** — meditation min · movement · water 1–10 (from v5 `today`; *moved to evening in v7*).
13. **Tomorrow's runway** — next frog + main focus + "set it up tonight" (**[NEW]** — synthesized from v5 `weekly` next-frog).
14. **Kind sentence** — one honest-kind line to self (from v6 `03`, `05`).

---

## 2. NOTEBOOK A — THE DAILY (3 pages, every day)

### A1 · Morning — "Today."

**Descends from:** v5 `today.html` (structure) + v6 `01-daily-checkin.html` (mood
words, voice). **Replaces both.**

**Heading / field sequence (document order):**

1. **Kicker:** `§ daily · morning` *(mono label, lowercase)*
2. **Display title:** *"Today."* *(Fraunces italic)*
3. **Subtitle line:** "Commit small. Start with the frog. Leaving parts blank is still showing up."
4. **Date / day meta:** `date · ___` + `day / mon tue wed thu fri sat sun`
5. **Body-first block** **[NEW ordering — body before brain]**
   - `body · one word` — single-word body check
   - `chest · kg (am)` — low→high slider
   - `breath` — one slow breath, tick *(rationale: "the hand moves before the thought" — start at the chest, not the brain)*
6. **Meds** **[NEW field, was implicit]** — `meds taken? Y / N` (acknowledgment only — **never** dosing; see tone rule)
7. **Mood chips** (5-step ladder): tender · foggy · steady · clear · rough
   - microcopy: "one chip is enough today. so is none."
8. **The frog block** (the task method — the heart of the page):
   - **the frog** — "one concrete thing, ≤25 min, one only. Do this first; everything else is bonus."
   - **shrink it** — "the smallest version of that frog —"
   - **first physical action** — "the very first physical movement (open laptop · click email · write 'Dear ___')"
   - **if–then** — "I'll do it at [time] in [place]"
   - **predicted difficulty 0–10** — slider *(scored against actual in the evening; Burns method)*
9. **Keeda-guard** **[NEW — single line, the anti-pattern catch]**
   - "Is this frog the *real thing* — or a prerequisite / a project?" *(catches "Ye Karke Padhunga" + productive-procrastination at planning time)*
10. **Today's priorities — rule of 3** (`# / what / when / est`, max 3 rows)
11. **Footer microcopy:** "showing up is the win."
12. **Spine label** (vertical tab): `morning`
13. **Nav:** `[crisis]`

**Dropped from previous:**
- v5 `today`: **water 1–10**, **meditation min**, **movement (gym/walk/swim/outside)** → **moved to Evening** (per your instruction: logging activity belongs at the close, not the launch).
- v5 `today`: **sleep · quality** slider → moved to Evening (closes the prior night, fits the reflection surface better).
- v5 `today`: **"first thought today (before you opened your eyes)"** → **cut** (cognitive load before coffee; the body-word covers the same ground more gently).
- v5 `today`: **"one stupidly small thing I'll do"** → **merged into "shrink it"** (same intent, no duplication).
- v5 `today`: **free-write block** → **cut from morning** (brain-dump page owns freewrite).
- v6 `01`: the **Energy / Anxiety / Focus** chip ladders → **cut from morning, moved to Evening** (rating the day before it's happened is noise; rate it at close).

---

### A2 · Midday — "Midday."

**Descends from:** v5 `midday.html` (the winner — has the jar, pseudo-doing, thought-flip) + v6 `27-midday-reset.html` (the re-orient voice). **Replaces both.**

**Heading / field sequence:**

1. **Kicker:** `§ daily · midday — a reset, not a restart`
2. **Display title:** *"Midday."*
3. **Subtitle:** "Pause. Check the jar. Weigh the chest. Notice, don't judge — leaving parts blank is still showing up."
4. **Date / day meta** (date + day chip row)
5. **Processing-jar + body log (3+ rows):** `# / time / jar level (overflow→empty) / chest · kg`
6. **Pseudo-doing check** ("prep ≠ doing")
   - `real task` — what I was supposed to do
   - `what I'm actually doing` — what hands & attention are on this minute
   - microcopy: "Am I doing the real task, or a prerequisite that feels productive? Catch it while I can still switch." (filler reference: youtube · reddit · news · phone · worry · actual study ✓)
7. **Thought-flip** (midday — only if a harsh thought is running):
   - `1 · brain's telling me`
   - `2 · is that actually true?`
   - `3 · a kinder way to see it`
8. **One small thing the next hour is for** — "smaller than you think. it doesn't have to fix the morning."
9. **Footer microcopy:** "the afternoon is allowed to be quieter than the morning — or louder, or nothing. blank is a complete entry."
10. **Spine label:** `midday`
11. **Nav:** `[crisis]`

**Dropped from previous:**
- v6 `27`: the long re-orient prose paragraph ("The morning is behind you…") → **compressed to the subtitle** (v6's version filled a third of the page with prose; v7 trades it for the jar log, which is real data).
- v6 `27`: stood alone with no jar/body log → v7 **adds** v5's jar+chest table (the better instrument).
- *Balance fix:* v6 `27` was underfilled (bottom third empty per render review) — v7 fills it with 4 jar rows + taller boxes.

---

### A3 · Evening — "Reflect." / "Today is closed."

**Descends from:** v5 `reflect.html` (structure — done/moved, ratings, chest ×3) + v6 `03-evening-close.html` (voice — "today is closed"). **Replaces both.**

**Heading / field sequence:**

1. **Kicker:** `§ daily · evening close`
2. **Display title:** *"Today is closed."*
3. **Subtitle:** "Notice. Learn. Be kind. No shame, no red X — leaving parts blank is still showing up."
4. **Date / day meta**
5. **Done / moved**
   - `done today`
   - `moved to tomorrow — no shame`
6. **Frog check** **[NEW — closes the morning's loop]**
   - `the frog was…` done / shrunk / not today
   - `actual difficulty 0–10` (vs the morning's *predicted*) — "this is how you teach your brain the task was never as big as it said" (Burns)
7. **Evening ratings** (low→high sliders, *moved here from morning*): `mood` · `anxiety` · `energy`
8. **Chest · kg** ×3: `(am)` · `(mid)` · `(eve)`
9. **Practices** (low→high / tick, *moved here from morning per your instruction*): `meditation · min` · `movement (gym/walk/swim/outside)` · `water · goal 10` (1–10) · `sleep · quality` (logs last night)
10. **Pattern spotter** — tick your named patterns: doom scroll · catastrophize · prereq trap · rejection scanner *(+ keeda, night-danger-zone, overcorrection — your 7)*
11. **One win** — "any size. 'got out of bed' qualifies."
12. **Tomorrow's runway** **[NEW]** — `tomorrow's frog` · `main focus` · `set it up tonight` (so morning-you walks into a runway, not a blank page)
13. **One thing I learned about myself today** (from v5 `reflect`)
14. **Kind sentence** — "one kind sentence to myself —" (inline, *render-fixed: must not collide with footer*)
15. **Footer microcopy:** "if you opened this page tonight, today is closed. tomorrow gets to be different."
16. **Spine label:** `evening`
17. **Nav:** `[crisis]`

**Dropped from previous:**
- v6 `03`: the three open prompts ("what felt heavy / what did I survive / what counts even if small") → **distilled into "one win" + "learned about myself"** (v6's were beautiful but overlapping; v7 keeps the two that pull most).
- v5 `reflect`: free-write block at the bottom → **cut** (brain-dump owns freewrite; this page is now dense enough).
- **Known render bug to fix:** in v6 `03`, "one kind sentence" overflowed into the footer. v7 places it inline above the footer with computed height.

---

## 3. NOTEBOOK A — THEME CARDS (bound in, mix-and-match by week)

**[NEW page-type.]** Daily motivational-yet-honest cards, derived from your actual
therapy themes (not generic affirmations). One theme picked per week; a card faces
each daily spread. **Voice = "the kit"** (same as the v6 weekly letters — honest,
no false promise, no motivation-required).

**Seven themes → seven card sets:**

1. **Shame & Worth** — Shikhar, the cousins, the fraud feeling. Cards that pry worth loose from output.
2. **The Body** — Shreya's core. The pause, the jar, the chest. Staying *with* a sensation instead of fleeing.
3. **Starting** — "the hand moves before the thought." The smallest possible beginning.
4. **Showing Up** — the Samson rule, the ziddi. Flat days still count.
5. **Pace & Uncertainty** — the field moving fast, what-to-study paralysis. Your own tempo is allowed.
6. **Self-Compassion** — the kind sentence, in Neff's voice.
7. **The Night** — the 11pm danger zone, the overcorrection spiral. Cards for the shame hour.

**Card field sequence (each card):**
1. Kicker: `§ theme · <name> · card N`
2. The line (Fraunces italic, ~1–3 sentences, "the kit" voice)
3. Optional one-line "today, just —" micro-invitation
4. — the kit *(signature)*

**Source basis:** voice + structure from v6 `13-letter-week-1..4` (the four weekly
letters) — those four become the *prototype* for the deck; the deck generalizes them
into the 7 themes.

**Dropped / changed from v6:**
- v6 `13-letter-week-1..4` were **month-position** letters (week 1 of 4 → week 4 of 4). v7 re-frames them as **theme** cards (pick by what the week needs, not by calendar position). The week-1..4 arc is preserved as **one** of the sets ("Showing Up" / month-arc) rather than the only axis.

---

## 4. NOTEBOOK B — TOOLS & REFERENCE (as-needed)

### B1 · CBT Thought Record
**From:** v6 `04-cbt-thought-record.html`. **Kept nearly verbatim** (gold standard).
**Field sequence:** Situation → Emotion (+ intensity 1–10) → Thought · verbatim →
Pattern (optional circle: catastrophizing / all-or-nothing / mind-reading /
fortune-telling / filter / should / personalization) → Evidence For → Evidence
Against → Balanced (a sentence that holds both) → Next action (one tiny step).
Footer: "if you only filled the thought, that's still data."
**Dropped:** the four completion stamps at the bottom (judgment-noted / catastrophe-caught
/ pattern-named / body-felt) → **moved to the sticker sheet** (they're stamps, not fields).

### B2 · Self-Worth Reframe
**From:** v6 `05-self-worth-reframe.html`. **Kept verbatim.**
**Fields:** actual evidence for this thought? → what would you say to a friend? →
kindest version that's still honest? → one small thing that's true even if the rest is.
Footer: "talking it down isn't winning. it's just talking." **Nothing dropped.**

### B3 · The Tiny Task (ADHD focus booster)
**From:** v6 `07-adhd-focus-booster.html`.
**Fields:** Brain dump → Top 3 (1/2/3) → The tiny task → First physical action →
Distraction notes → 10% easier.
**Dropped:** the **Brain dump** + **Top 3** blocks now overlap with Morning's frog
block and the brain-dump page → in v7 this page **trims to: tiny task → first physical
action → distraction notes → 10% easier** (the unique parts), pointing back to Morning
for the frog. Stamps (frog-eaten / pseudo-action-caught) → sticker sheet.

### B4 · The 30-Minute Experiment (Shreya's homework)
**From:** v6 `20-experiment-30-min-and-break.html`. **Kept verbatim.**
**Fields:** step 1 name it → step 2 shrink it (+ timer set for __ min) → step 3 during
(what I noticed) → step 4 after (what happened) → anything else.
Footer: "one data point. not a streak. stopped early? write where you stopped. that's
the data." **Nothing dropped.**

### B5 · Weekly Review
**From:** v5 `weekly.html` (the tighter one) — **chosen over** v6 `12-weekly` L/R spread.
**Fields:** "what I want next week to feel like" (one sentence) → week-at-a-glance
(mon–sun × mood / chest·kg / one word) → wins jar (especially tiny) → named patterns
(tick each: doom scroll · catastrophize · prereq trap · rejection scanner) → worked
(keep doing) → didn't (try different) → next week's frog (eat it early · finish by
Tuesday).
**Dropped from v6 `12`:** the **month-grid calendar strip** (JAN…DEC + 1–31) and the
**7-day mood/energy/sleep/note/stamp table** → **cut** (v5's aperture is lighter and
you said you preferred it; the heavy grid was the duplicate). If you want the visual
strip back, it's a one-flag swap.

### B6 · Monthly Review
**From:** v5 `monthly.html`. **Kept.**
**Fields:** "felt like" (1–2 sentences, before the data) → wins (from memory) →
patterns (what kept happening) → best day (#  + why) → hardest day (#  + why) →
next month (what I want it to feel like).
Footer note: "AirDrop this notebook to AI for the data version — cig total · mood mean
· chest-kg delta · pattern tally · best/worst computed."
**Dropped:** v6 `13-letter` + `14-doorway` monthly surfaces → the letters become the
**theme-card deck** (§3); the identity-doorway becomes **as-needed** (see B-doorways).

### B7 · Quarterly Witness
**From:** v5 `quarterly.html` (chosen) ≈ v6 `28-quarterly-witness.html` (near-identical).
**Fields:** narrative in three sentences (what happened, plain voice) → worked
(prove-it moments) → didn't (honest, not cruel) → changed (who I am now) → next season
(what I want it to feel like).
**Dropped:** the v6 `28` "what stayed / what fell away / what shifted" triad → **merged**
into v5's "worked / didn't / changed" (same intent, one voice).

### B8 · Identity Doorways (as-needed, was monthly)
**From:** v6 `14-monthly-identity-doorway` + `16/17/18/19-doorway-A/B/C/D`.
**Kept as a 4-card as-needed set** (not monthly-forced):
- **A · Tuesday morning** — wake-up 2 years out: what time / who's there / first hour / body feeling.
- **B · The sentence** — one sentence someone you respect says about you in 2028 / who says it / the feared sentence / the gap.
- **C · Before it got heavy** — what 18-/20-yr-old you loved / where / when you stopped / one piece that could exist again.
- **D · Fear projection** — 5 years exactly like this: where it lands in the body / sharp-dull-hot-cold / a 6-word sentence / stay or step away. **(D keeps its built-in grounding panel: feet on floor → 5-4-3 senses → close journal → if deeper, [crisis].)**
**Dropped:** `15-cover-shreya-homework` (a cover page, zero function) → **cut**; the
`14` "lighter monthly surface" framing → **cut** (doorways are now a self-contained set, not a monthly obligation).

### B9 · Crisis Card
**From:** v6 `23-crisis-card.html`. **Kept verbatim — non-negotiable.**
iCALL +91 9152987821 · Vandrevala 1860 2662 345 · AASRA +91 22 2754 6669 · NIMHANS
080 4611 0007 (intl: 988 / 116 123 / 13 11 14) + 5-4-3-2-1 grounding + "you don't have
to be sure to call." **Nothing dropped. One copy, always present, in every notebook.**

### B10 · Quick-Start (table of contents)
**From:** v6 `22-quick-start.html`. **Updated for the 3-notebook map** (was a single-book
TOC). Lists: Notebook A (daily spine + themes), Notebook B (tools/reference), Notebook
C (pomodoro). **Dropped:** the old single-book page-range map (pp 1–24).

### B11 · Permission
**From:** v6 `10-quote-permission.html`. **Kept** (Carl Rogers: "The curious paradox
is that when I accept myself just as I am, then I can change."). One copy.

### B12 · Scene Capture (now sticker-backed)
**From:** v6 `08-scene-capture.html`. **Re-scoped to a sticker type** per your note —
a photo-frame PNG sticker you drag into brain-dump, rather than a standalone page.
**Fields when used:** frame ↗ + caption. **Dropped as a forced page; lives as a sticker.**

### B13 · Stock-Up
**From:** v6 `24-stock-up.html`. **Kept** (you liked it). 9 categories × `lo / ok / notes`:
toiletries · medicines · food/hydration · cleaning · jars/storage · stationery/goodnotes
· personal care · small household · follow-ups. Footer: "just a list. no streaks."

---

## 5. NOTEBOOK C — POMODORO PAD (thin, per session)

**From:** v6 `25-pomodoro-thoughts.html` + `26-pomodoro-thoughts-alt.html` — **two
versions of one page.** v7 keeps **both as the two modes of the pad**, not duplicates:

- **C1 · Capture** (`25`): "during the sprint — the thought, park it, back to focus."
  9 numbered sprint rows + dot tracker (○○○○○). Footer: "the idea is safe here. back to the one thing."
- **C2 · Catch & Decide** (`26`): two piles mid-sprint — `during the sprint →` / `for later →`,
  9 rows each. Footer: "catch it left. decide it later, right. the sprint keeps going."

**Dropped:** nothing — the redundancy is resolved by framing them as two modes of one thin pad.

---

## 6. STICKER LIBRARY — expand 41 → 70 (long-sighted)

**From:** v6 `21a` + `21b-sticker-library.html` (41 stamps, 10 packs). v7 keeps all 41
and adds ~29 more across **new forward-looking packs** — stickers for where you're
*going*, not just where you are. They sit empty on purpose; you earn them.

**Existing 10 packs (kept):** restlessness · break-discipline · wins-jar ·
mood-constellation · cbt-thought-flip · dbt-urge-surf · pattern-names · permission ·
if-then · crisis-toolkit. *(Full 41 stamps inventoried — e.g. RESTLESSNESS-NAMED,
URGE-SURFED, PSEUDO-ACTION-CAUGHT, FROG-EATEN, RIA-THREAD-FOLLOWED, PHQ9-Q9-ACKNOWLEDGED,
BODY-CAME-BACK, the IF→THEN set, etc.)*

**New packs (the long game — ~11 packs total target):**
- **study-arc** — the habit you're forming (first-25-min, returned-after-break, finished-before-tuesday…)
- **milestones** — 3-day-thread → week-held → season-witnessed (streaks you haven't built yet)
- **anti-shame** — worth≠output · not-shikhar · fraud-caught · showed-up-anyway (aimed at the core)
- **sessions** — truth-in-session · joshi-check · shreya-homework-done (therapy markers)
- **scene-capture** — photo-frame PNG sticker type (replaces the standalone page, §B12)

**Format:** transparent PNG, color emoji, accent bar, named `pack__sticker.png` —
drag into the brain-dump zone of any page. Plus a printable contact sheet of all 70.

**Dropped:** the 4 CBT completion stamps that lived *inline* on `04` (judgment-noted /
catastrophe-caught / pattern-named / body-felt) move *into* the sticker sheet here, so
they're reusable across pages instead of stuck on one.

---

## 7. CUT ENTIRELY (and what's lost)

| v6/v5 page | Why cut | What's lost (and where it survives) |
|---|---|---|
| `00-cover` | Decorative, zero function | Nothing — cover can be a single styled title line on Quick-Start |
| `02 brain-dump` vs v5 `brain-dump` | Duplicate | **Merged** → one brain-dump page with sticker zones + three-good-things + freewrite |
| `06-behavioral-activation` | Overlaps Morning's rule-of-3 + frog | The 5 domains (care/responsibility/connection/movement/pleasure) → optional line in Evening practices |
| `09-letter-to-no-one` | High cognitive load; theme cards + monthly serve it | The "Dear ___, you don't have to read this again" surface → covered by theme-card deck |
| `11-loose-page` | Blank paper; brain-dump exists | Nothing |
| `15-cover-shreya-homework` | Cover page, zero function | The "pick one, the other can wait — Shreya, S4" line → moved as microcopy onto the doorway set |
| v6 `12-weekly` L/R grid | The heavy duplicate of v5 `weekly` | Month-strip + 7-day table (recoverable via flag if wanted) |
| v6 `13-letter-week-1..4` | Re-framed | Become the **theme-card deck** (§3) |
| All 7 `pages-v5restyled/*` | Their *content* is merged into v7 | Everything survives inside A1/A2/A3 + B5/B6/B7 — then the folder is deleted |

---

## 8. Final count

| Notebook | Pages | Frequency |
|---|---|---|
| **A · Daily** | Morning · Midday · Evening | every day (3) |
| A · Theme cards | 7 sets (one faces each spread) | one theme/week |
| **B · Tools/Reference** | CBT · self-worth · tiny-task · 30-min · weekly · monthly · quarterly · 4 doorways · crisis · quick-start · permission · stock-up | as-needed |
| **C · Pomodoro** | Capture · Catch-&-Decide | per session |
| Stickers | ~70 across ~11 packs (sheet, not pages) | drag on demand |

**Daily commitment: 3 pages.** Everything else is opt-in and never owed.

---

## 9. Open decisions for you to annotate

1. **Weekly:** keep v5 `weekly` aperture (chosen here) or restore v6's visual month-strip? *(default: v5)*
2. **Theme cards:** 7 themes as listed, or fold in the original month-arc (week 1→4) as an 8th set? *(default: 7, with month-arc folded into "Showing Up")*
3. **Meds field on Morning:** acknowledgment-only `Y/N` — confirm you want it on the page at all (some prefer it off the daily surface).
4. **Behavioral-activation 5 domains:** drop entirely (default) or keep as one optional Evening line?
5. **Scene-capture:** sticker-only (default) or keep one standalone page too?

> Annotate inline, then I build Notebook A first (render-verified, A4 PDF), since
> that's the only thing you need to start filling tomorrow morning.
