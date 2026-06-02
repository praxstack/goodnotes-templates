# Prax Journal v7 — Daily Pilot + Truth Deck — Design

**Date:** 2026-06-02
**Status:** Approved design (brainstorming complete). Next step: implementation plan.
**Author lens:** Dr Alex Morgan (clinical) + engineer.
**Supersedes for the daily/card scope:** the inventory spec at
`packages/packs-prax-journal/versions/v7/SPEC.md` (kept as the page-by-page
field reference). This doc is the *decision + content* contract.

> **Boundary.** This is a journal/planner design. It is not therapy, diagnosis,
> or medication guidance. Crisis pages are reference aids only.

---

## 1. Problem & principle

The v6 corpus is two journals stacked (v6 `pages/` + `pages-v5restyled/` build
the same surfaces twice), which invites endless *building instead of using*. The
simplification pass that followed over-cut quiet psychological supports
(gratitude, daily reminders/quotes, wins, connection).

**Governing principle:** *Depth is allowed, debt is not.* The system can be rich;
the daily identity cannot depend on completing it. Only **2 pages are owed**
(Morning, Evening). Everything else is **available**, never owed.

**Restore the function, not always the page:** a cut support comes back as the
*smallest* form that preserves its job — a tiny field, a read-only card, a
sticker, or an optional single-page PDF — not as a new daily obligation.

---

## 2. System shape

### Notebook A — Daily (4 pages, only 2 owed)
- **Morning** *(owed)*
- **Brain Dump** *(optional)*
- **Midday** *(optional)*
- **Evening** *(owed)*

### The Truth Deck (the heart of this design — see §4)
65 cards in 3 register-packs (**Truth 20 · Quote 20 · Pill 25**), delivered as
**(a)** 3 GoodNotes sticker packs (transparent PNG, drag onto the page) **and
(b)** a flip-through PDF deck (one card per page, swipe to read on numb days).

### Permanent Reminders Card (front/back, in every notebook)
- **Front (operating rules):** blank is complete · frog before tooling · body
  before brain · depth is allowed, debt is not · worth is not output
- **Back (honest core):** building it is not doing it · motivation follows action,
  not the reverse · behind is a position, not a verdict · the hand moves first,
  so move the hand · you always came back

### As-needed single-page PDFs (insert into GoodNotes when needed)
1. Letter to No One
2. Therapy Session Prep/Debrief
3. Urge / Phone-Reach Log
4. Monthly Letter ("Dear next-month me")
5. Weekly Strip (lightweight, not the heavy v6 grid)

### Dropped
- Loose page (duplicate a page in GoodNotes instead).
- Covers, duplicate v5/v6 pages, the heavy weekly month-grid (not now).

---

## 3. Daily page layouts (field order, top → bottom)

Designed to be fillable in fog: taps and short lines, no essays.
Morning ≈ 2 min, Evening ≈ 3 min.

### MORNING *(owed)* — "Today."
1. kicker `§ daily · morning` + date/day chips
2. **body** — one word · chest·kg (am) · one breath ✓
3. **sleep chip** — slept / broken / late / heavy / okay
4. **focus weather** — fog / scattered / here / sharp
5. **truth anchor** *(fixed printed line)* — e.g. "blank is complete. worth is not output."
6. **today's card:** *(empty box — drag a Truth/Quote/Pill sticker here)*
7. **the frog** — one concrete thing, ≤25 min
8. **first physical action** — the very first movement
9. **one stupidly small thing** *(kept visible)*
10. **keeda-guard** — "real thing, or a prerequisite dressed as progress?"
11. footer: "showing up is the win."

> **Dr Alex #5 ruling (delegated):** keep only the two context chips (sleep,
> focus). **Drop** "first thought before opening eyes" (invites rumination at the
> worst moment for MDD) and morning energy/anxiety ratings (rated at evening
> instead — rating a day before living it is noise).

### BRAIN DUMP *(optional)*
1. kicker + date
2. **open paper** (most of the page, empty)
3. **sticker zone**
4. footer strip: **"3 small things I don't want to erase"** *(optional, only if natural)*

### MIDDAY *(optional)* — "Midday."
1. kicker + date
2. **jar + body log** (3 rows: time · jar level overflow→empty · chest·kg)
3. **pseudo-doing check** — real task vs what I drifted into
4. **one small thing the next hour is for**
5. footer: "the afternoon doesn't owe the morning anything."

### EVENING *(owed)* — "Today is closed."
1. kicker + date
2. **done / moved to tomorrow** (no shame)
3. **frog check** — done / partial / not today · actual difficulty 0–10
4. **practices** — meditation min · movement · water · sleep quality *(moved here from morning)*
5. **pattern spotter** — tick: keeda · ye-karke-padhunga · productive-procrastination · night-zone · overcorrection · clean day
6. **evidence I showed up** *(wins, reframed off productivity)*
7. **one thing that was not all bad** *(depression-safe gratitude)*
8. **one human thread** — messaged / replied / asked / no energy
9. **tomorrow's runway** — tomorrow's frog · main focus · set it up tonight
10. **kind sentence**
11. footer: "today is closed. tomorrow gets to be different."

---

## 4. The Truth Deck — card system

### 4.1 How it works (plain)
Three stacks of one-line cards. Each morning you glance at your state, pick the
stack you can handle, and drag one sticker onto the "today's card:" box (or, on a
numb day, open the flip-deck PDF and just *read*, one swipe at a time).

- numb day → **Truth** (calm)
- flat day → **Quote** (light, borrowed words)
- restless / avoidant day → **Pill** (mirror + blunt friend)

### 4.2 The clinical rule (non-negotiable)
**Harsh-only backfires for this user.** Pure tough-love feeds the
shame → overcorrection → midnight-grand-plan → crash loop. Every confronting
cluster is paired with a worth/compassion counterweight. Cards attack the
**behaviour** and the **story**, never the **person**. "You're avoiding" is fair.
"You're lazy/pathetic/a failure" is never in the deck — it isn't true and it
doesn't work. Voice = mostly **mirror (realisation) + blunt-friend-on-your-side**,
light **dispassionate-observer**.

### 4.3 Register ↔ theme mapping
The deck content is authored by *theme cluster* (below). The packs are organized
by *register* (what you can handle today). Mapping:

| Pack (pick by state) | Theme clusters it draws from |
|---|---|
| **TRUTH** (calm) | D · Shame & Worth + G · Compassion counterweights + Reminders card |
| **QUOTE** (light) | C · Starting (borrowed-wisdom lines) + curated external quotes |
| **PILL** (mirror + blunt) | A · Keeda + B · Anti-victimisation + E · Body urges + F · Night |
| **Z (meta)** | the 3 meta-pills — surfaced at the *front* of the flip-deck |

### 4.4 Three guardrails baked into every PILL card
1. **Target the behaviour/story, never the person.**
2. **Always paired with an exit** — every pill ends in a movement ("one line,"
   "put it down," "one breath"), never a bare accusation.
3. **Never the only option** — Truth anchor is always present; Quote is one flip
   away. On a bad day the pill is skippable.

### 4.5 Anti-binge rule (the tool can't become the keeda)
*"Never read the whole deck in one sitting to get motivated — that's avoidance
too."* The flip-deck opens on meta-pill **Z1**, shows **one card per page**, and
has **no "all cards" view**. Read one, close it, do the thing.

### 4.6 Canonical content (authored; curate freely)
This is the seed content. Curate: cut any line that sounds like someone else's
voice; keep the ones that feel like the truth being dodged. Counts are targets
(Truth 20 / Quote 20 / Pill 25); expanding later is a data edit, not a redesign.

#### A · Keeda / building-instead-of-doing  → PILL
- Building the system is not using the system. You know the difference. Right now you're doing the first.
- A new tool has never once made you start. You already have six. The tool was never the problem.
- Designing the perfect plan is the most sophisticated way you avoid the scary thing. Name it: this is avoidance wearing a badge.
- "Figured out the architecture" gives the same hit as the phone. It just costs you a whole day instead of an hour.
- You don't have a tooling problem. You have a starting problem. No amount of tooling fixes a starting problem.
- If reorganising it *feels* productive, that's the tell. Productive-feeling and productive are not the same currency.
- The keeda's promise is always "after I build this, then I'll study." It has made that promise every time and never kept it.
- The journal cannot study for you. At some point you close the beautiful notebook and open the ugly real thing.

#### B · Anti-victimisation  → PILL
- The field moving fast is real. "So there's no point trying" is a story bolted on top. The first part is true; the second is the depression talking.
- Being behind is a position. Being doomed is a verdict. The facts only support the position.
- "Everyone's ahead of me" — you're comparing your inside to their outside. It was never an accurate measurement.
- Nobody is coming to rescue you from this, and nobody needs to. That's not despair — that's the door, and you hold the key.
- You shipped real work at a demanding company for three years. "I got lucky / I'm a fraud" is an interpretation, not a fact.
- Feeling incapable and being incapable are different. The capability isn't the question. The starting is.
- Waiting until you "feel less behind" to begin guarantees you stay behind. The only move that closes the gap is the one made while behind.

#### C · Starting (behavioural activation)  → QUOTE / borrowed-wisdom
- Motivation is not coming first. You move, then you feel like moving. Wait for the feeling and you wait forever.
- You do not need the whole plan before the first movement. The first movement *is* the plan.
- The frog will never feel ready. Readiness is a decision you make while unready.
- Five minutes of the real thing beats five hours of preparing to do the real thing.
- Your hand reaches for the phone before your thought does. Don't fight the thought — move the hand.
- Lower the bar until it's stupid. "Open the doc." "Read one paragraph." Stupid-small is the only thing that reliably starts you.

#### D · Shame & Worth  → TRUTH
- You are not your output. A day you produced nothing is still a day a worthwhile person lived through.
- The comparison's life is not the exam you're failing. It was never your exam — different paper, different subject, different day.
- The fraud feeling is a feeling, not evidence. Impostor syndrome targets the competent.
- Shame says "you are bad." Guilt says "you did a bad thing." At most this is guilt — and guilt you can do something with.
- The distance you keep from home is the old shame protecting itself, not you. No one there holds the scorecard you imagine.
- Your worth was not issued by a job and cannot be revoked by being between jobs.

#### E · The Body (somatic body-work)  → PILL (urge) / TRUTH (acceptance)
- The discomfort you're fleeing will not kill you. It's a sensation in the chest, not a tiger in the room. Stay three seconds longer than feels possible.
- "Bye mode" is your body bracing for danger that isn't here. Thank it, feel your feet, begin anyway.
- The urge to scroll is a wave in the body, not a command. Waves fall if you don't paddle into them.
- You can do the thing and feel the anxiety at the same time. Calm was never the entry requirement.

#### F · The Night  → PILL
- It's after 11 and the plan is getting grander. That's the spiral. Grand midnight plans are a symptom, not a solution. Put the pen down.
- Tonight's shame does not have to become tonight's elaborate new system. Tomorrow's one frog is enough.
- The 11pm version of you is the most tired one, not the most honest one. Don't let him make tomorrow's promises.
- Sleeping now is more productive than planning now. Go.

#### G · Compassion counterweights  → TRUTH
- You came back to this. After every gap, you came back. That stubbornness might be the most important thing about you.
- Speak to yourself the way you'd speak to someone you love who was this stuck. You wouldn't call them a failure — you'd help them start small.
- Resting is allowed before you've earned it. Worth is not a wage you work off.
- Showing up flat still counts. The bar is "show up," not "show up energised."
- You are not behind on being a person. There is no schedule for that one.
- The fact that this hurts means you still care. The pain is a sign the wanting is alive.

#### Z · Meta-pills (about the deck itself)  → front of flip-deck
- **Z1** — If you're reading a stack of these to "get motivated," even this is avoidance. Read one. Close the book. Do the thing.
- **Z2** — Insight is not change. Understanding the keeda perfectly and still not starting is just a smarter way of not starting.
- **Z3** — You did not need a better truth. You needed to act on the ones you already had. Go.

### 4.7 Depression-safe microcopy (fills Evening fields; pick one wording each)
- **Evening gratitude:** "one thing that was not all bad today" / "one thing I'm glad existed today" / "one thing I'd keep if I could keep one"
- **Wins / evidence:** "evidence I showed up" / "proof today happened, however small" / "one thing I did that the depression didn't want me to"
- **Brain-dump footer:** "3 small things I don't want to erase" / "3 things, only if they come easily"
- **One human thread:** ( messaged ) ( replied ) ( asked for help ) ( saw someone ) ( no energy today — and that's allowed )

---

## 5. Privacy
These PDFs sync (iCloud / AirDrop), so:
- **Behaviour-pattern names on cards: yes** (keeda, ye-karke-padhunga, etc. — the
  user's own vocabulary; motivating, not shaming).
- **People: abstracted** — "the comparison," "the old shame," "the thread." Never
  literal names of real people on a syncable file. (Reflected in §4.6, which is
  already written abstracted.)
- **No medication doses anywhere** — only "meds as prescribed" if referenced.
- **Crisis card** kept verbatim from v6; numbers re-verified before relying.

---

## 6. Design language (locked, from v6)
A4 portrait 210×297mm · Fraunces italic display · Instrument Sans body ·
JetBrains Mono lowercase kicker (`§ section · page`) · warm paper palette
(spine `#F6EFE2`, shelf `#F2F0EC`, weekly `#E8EEE6`, monthly `#F1EFED`,
reference `#F0F0EF`) · ink `#1f2126` · quiet `#6E6658` · whisper `#B5AD9F` ·
sage `#4E6249` · clay `#c08866` · 6mm clay bind-bleed · paper grain · vertical
spine label per page. Fonts via Google Fonts `<link>` (never base64 inline).

Every page must pass the 8-line tone rubric: no motivation-required · no false
empathy · no shame · no jargon · no gamification · no wellness-app voice · no
false promises · no lying. "Blank is a complete entry" recurs.

---

## 7. Build order (depth allowed, debt not)
1. **The 4 Daily pages** (Morning, Brain Dump, Midday, Evening) → render-verified
   A4 PDF. *Only thing needed to start filling tomorrow.*
2. **The 65 cards** → 3 sticker packs (PNG) + flip-deck PDF (opens on Z1, one card
   per page, no all-view).
3. **Permanent Reminders card** (front/back).
4. **The 5 as-needed PDFs.**
5. **Later (after ~1 week of real use):** weekly/monthly review, remaining v6 tools.

**Render-verify discipline:** every artifact checked with real screenshots
(A4 size, no overflow, no footer collision, legible, adequate writing space) —
no "looks good" claims. "Built" never means "claimed."

---

## 8. Render-QA gates (per page, all must pass)
- exact A4 (210×297mm)
- overflow = 0px
- footer collision = false
- body font ≥ 11px, label font ≥ 8px
- writable fields don't touch page edges (GoodNotes-safe margin)
- print-all renders pages in order

---

## 9. Out of scope (now)
Interactive web app / localStorage / JSON export · medication decision prompts ·
toxic-positive language · new pages after the Daily Pilot until ~1 week of use
(unless explicitly overridden) · heavy weekly month-grid · cover pages.
