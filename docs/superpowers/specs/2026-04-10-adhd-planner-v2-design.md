# ADHD Planner v2 — Design Spec

**Status:** APPROVED (layout) — ready for implementation  
**Date:** 2026-04-10  
**Approved mockup:** `.superpowers/brainstorm/79352-1775761953/content/q4-hifi-mockup.html`

## Overview

Redesign of the ADHD daily planner from 5 pages/day (overwhelming) to a **2-page daily + 1 weekly + 1 monthly** system. Designed for the ADHD + depression + anxiety triad using CBT, Barkley's Rule of 3, and behavioral activation research.

## Design Decisions (from brainstorming)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pages per day | 2 | User selected 19 sections (too many for 1 page) |
| Page split | Structured + Open | Page 1 = productivity, Page 2 = reflection |
| Task limit | 3 (Rule of 3) | Barkley research: ADHD brains do better with fewer tasks |
| Input style | Circle/check > writing | Reduces executive function load |
| Permission banner | Always visible | CBT: reduces guilt from blank fields |
| Self-compassion | In footer + weekly | Kristin Neff's work on self-compassion |

## Page 1: "Today" — Structure & Productivity

### Sections (top to bottom):
1. **Header** — Green top-border, title "Today", subtitle "Structure your day. Start with the frog. 🐸", date field
2. **Permission banner** — Green-soft card: "✦ It's okay to leave parts blank. Showing up is the win. ✦"
3. **Quick checks row** (3 items, horizontal):
   - 💊 Meds: circle yes/no
   - 😴 Sleep: hours field + quality 1-5
   - 💧 Water: 8 small circles to fill through day
4. **Mood + Anxiety row** (2 cards, horizontal):
   - Mood: blue-soft card, 5 emoji scale (😞 😕 😐 🙂 😊) with circles
   - Anxiety: amber-soft card, 1-5 numbered boxes
5. **🐸 The Frog** — Green-soft card: "#1 most important task" + 1 write line + hint "Do this FIRST. Everything else is bonus."
6. **🎯 Today's Focus** — Inline: label + write line (one word/phrase)
7. **Just Three Things** — Section header with accent dot + hint "If you only do #1, that's a win". 3 task rows: checkbox + number + write line + "when?" time field
8. **🍅 Pomodoro** — Inline: label + 6 empty circles
9. **🧹 Brain Dump** — Section title + 5 dotted write lines
10. **Footer** — Page number "1 / 2"

## Page 2: "Reflect" — Feelings & Growth

### Sections (top to bottom):
1. **Header** — Blue top-border, title "Reflect", subtitle "Notice. Learn. Be kind to yourself."
2. **⚡ Energy** — Inline: label + 5 shading bars
3. **🧠 Thought Check** — Amber-soft card (CBT simplified):
   - "My brain is telling me:" + write line
   - "Is that actually true?" + write line
   - "A kinder way to see it:" + write line
4. **🌱 Self-Care Check** — Green-soft card: 4 circle items (Ate something · Went outside · Something fun · Kind to myself)
5. **Gratitude / Win / Proud** — 3 inline rows:
   - 🙏 Grateful for: + write line
   - 🏆 Win today: + write line
   - 💪 Proud of: + write line
6. **→ Tomorrow's priority** — Accent-soft card: label + write line
7. **✍️ Free Write** — Italic hint "say anything, or leave it blank" + 8-10 dotted lines
8. **Footer** — "You showed up. That counts." + "2 / 2"

## Weekly Review (1 page, every Sunday)

1. Header — Blue top-border, "This Week", subtitle "Not a performance review. Just noticing."
2. Permission banner — "A bad week doesn't erase a good day."
3. Week Mood Map — 7 day circles (Mon-Sun) to color
4. Win counter — "Days I showed up:" 7 circles + /7
5. Two columns:
   - Left: 🌟 Wins (3 lines) + 🔄 One thing to keep doing (2 lines)
   - Right: 💡 Patterns noticed (3 lines) + 🔀 One small change (2 lines)
6. 💛 Self-compassion — "I'm being too hard on myself about:" + write line
7. → Next week intention — write line
8. Footer — "Every week you try is a week that counts."

## Monthly Review (1 page, end of month)

1. Header — Accent top-border, "This Month", subtitle "Zoom out. See how far you've come."
2. Permission banner — "You survived 100% of your worst days."
3. Quick stats — 4 cards: Days showed up /30 · Meds taken /30 · Tasks completed · Self-care days /30
4. Mood trend — 4 week blocks with 5 shading bars each
5. 🎉 Biggest Win — Large green-soft celebration card + 2 lines
6. Two columns: 🔍 Pattern noticed (3 lines) + 💊 Meds/Sleep/Therapy notes (3 lines)
7. → Next month focus — Blue-soft card + write line + "Just one thing. Not five. One."
8. Footer — "You made it through another month. That's not nothing — that's everything."

## Theming Requirements (user feedback)

- **All colors via CSS custom properties** — var(--bg), var(--accent), var(--green), etc.
- **Pastel-friendly** — ensure templates look good with soft/pastel themes
- **Dark mode support** — must work with midnight theme (dark backgrounds, light text)
- **Light mode support** — warm-neutral and other light themes
- **SVG decorative elements** where possible (icons, checkboxes, circles) for resolution independence
- All 8 existing themes must be supported

## Year Generation

- **Per day:** 2 pages (Today + Reflect)
- **Per week:** 14 daily + 1 weekly = 15 pages
- **Per month:** ~63 daily + ~4 weekly + 1 monthly = ~68 pages
- **Per year:** ~365×2 + 52 weekly + 12 monthly = ~794 pages
- Use existing `daily-year.ts` generator with new template, month-by-month rendering

## Technical Notes

- HTML templates in `src/templates/html/` 
- CSS custom properties for all colors/fonts (no hardcoded values)
- Page-break-after: always between pages
- @page { size: A4 portrait; margin: 0 } for Puppeteer multiPage mode
- Date injection via string replacement (same as current generator)
- Month tab navigation bar on every page (hyperlinked in PDF)
- Bookmarks: Year → Month → Day (same structure as v1)

## Not In Scope

- Time blocking (hourly slots) — too structured for ADHD
- Detailed meal tracking — keep it to "ate something" circle
- Exercise logging — moved to separate fitness-log template
- Detailed sleep analysis — just hours + quality 1-5
- Multiple frog tasks — only ONE frog per day (that's the point)
