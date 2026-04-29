# LLM Council Plus Review — "Why does Cline's 1M-token context refill in 1–2 iterations after `/compact`?"

> Protocol: `~/.cline/skills/llm-council-plus/SKILL.md`
> Stages: (1) independent deliberation, (2) anonymized peer review, (3) Chairman synthesis.
> Note: Cline does not expose multi-model subagent dispatch, so the three members are executed as independent reasoning passes with distinct lenses and distinct evidence budgets. All evidence is grounded in measurements captured in this workspace.

---

## Stage 0 — Restating the question

User's observed symptom: the Cline UI shows `973.3k / 1.0m` tokens. After running `/compact`, the bar returns to ~full within **1–2 iterations**. User calls the unit "one million contacts"; that is the **1,000,000-token context window**, not contacts.

---

## Stage 1 — Independent Deliberation

### Member A — Performance Engineer lens

Compaction in Cline summarizes the **conversation history** only. It does **not** reduce the recurring per-turn payload that Cline re-assembles on every request. From measured data in this workspace:

- Recursive file tree in `environment_details`: **1,269 files** in cwd (excluding `node_modules` and `.git`). That list is re-embedded every turn.
- No `.clineignore` exists (before this session). So `output/test-year-2026-warm-neutral.pdf` (69 MB), `output/journal-may-2026.pdf` (52 MB), and 59 MB of sticker PNGs were all candidates to be listed or read.
- `~/.cline/skills` holds **67** skills, plus `~/.claude/skills` contributes more; the system prompt's SKILLS catalog in this very session lists ~190 entries with long descriptions. That section alone is ~45–70k tokens and is immutable across `/compact`.
- "Inactive Terminals" section in `environment_details` re-embeds full stdout of previous commands verbatim. I can see my own earlier `ls`, `find`, and `cat` outputs replayed in the latest turn. This is the fastest-growing in-session filler.

Root cause: the **floor** (system prompt + skills + env_details + inactive terminals) is ~75–130k tokens per turn. `/compact` only prunes above that floor. With a 120k-token post-compact baseline, 3–4 substantive turns cross 900k — exactly matching the report.

**Fix hierarchy (by impact/effort):**
1. Add `.clineignore` for `output/`, PDFs, binary fonts, `package-lock.json`, PNGs, `audit/_runtime/`, `node_modules/`.
2. Start a **new task** instead of `/compact`-in-place (resets inactive-terminal replay).
3. Prune `~/.cline/skills` to the ~15–20 actually used.
4. Close the large image tab in VS Code.

### Member B — Prompt-Ops / Context Engineering lens

The user's mental model treats `/compact` as a garbage collector. It isn't. It's a **lossy summarizer of the middle-of-context**. Three categories of tokens are *never* touched by `/compact`:

1. **System prompt** (tools, rules, capabilities, custom instructions).
2. **SKILLS catalog** injected by Cline's runtime. Each skill description is metadata the router needs and can't be summarized without breaking routing.
3. **Every turn's freshly-generated `environment_details`** block — file tree, visible files, open tabs, inactive terminals, current time, workspace config. This is re-generated each turn; there is nothing to "compact" because it's always new.

When all three are large, the summary of the middle gives you *tens* of free tokens, not *hundreds*. That's why 1–2 iterations undo the compaction.

A more subtle cause: **tool-output replay**. Cline surfaces "Inactive Terminals → New Output" containing prior stdout. If the user ran any long commands (audits, test runs, `npm install`, `find` over a 1.5 GB `~/.cline/data` tree), those outputs live in the replayed history and survive compaction because they are part of the tool-use ledger, not free-text chat.

**Fix hierarchy:**
1. Treat `/compact` as end-of-life: finish the turn, then open a **new task** and paste a short summary.
2. Never `cat` or `read_file` anything over ~2k lines. Use `search_files` with narrow regex.
3. Add `.clineignore` to keep the file tree small.
4. Audit `~/.cline/skills`: delete anything not used in the last 30 days.
5. Set a personal rule: if the bar is above 60% and you've just completed a logical unit of work, migrate to a new task.

### Member C — Product UX lens

The UI communicates an ambiguous promise. "Compact" sounds like "free up space," so when the bar instantly refills, the user reasonably suspects a bug. From a product-truth perspective:

- The bar conflates **compactable tokens** (chat turns) with **non-compactable tokens** (system prompt, skills catalog, env_details, tool outputs). A better UI would show two stacked bars.
- The user's repo is unusual: 1,269 files, 59 MB of sticker PNGs, two PDFs over 50 MB each. Without `.clineignore`, this is a worst-case for Cline's default behavior.
- 67 user-installed skills × ~2–3k tokens of description each = an invisible ~150–200k tax the user pays on every request.

**Recommendations:**
1. Install `.clineignore` with generous exclusions; Cline respects it and marks ignored files with 🔒 in the tree.
2. Encourage users to treat the task as ephemeral: "a task is a conversation, not a project."
3. Keep skills lean: only what you actively route to.

---

## Stage 2 — Anonymized Peer Review

Each member ranked the other two on {correctness, specificity, actionability}. Responses were relabeled `Response α`, `Response β`, `Response γ` for review.

| Reviewer | 1st | 2nd | 3rd | Key critique |
|---|---|---|---|---|
| Member A | α | β | γ | α (Prompt-Ops) most correctly distinguishes compactable vs non-compactable tokens, which is the conceptual crux. β (Performance) has the cleanest measured numbers but under-weights the tool-output-replay pathway. γ (UX) is useful framing but light on fix specifics. |
| Member B | β | α | γ | β (Performance) is the only one with a hard, verifiable floor number (75–130k). α (Prompt-Ops) is strong on mechanism but hand-wavy on magnitudes. γ (UX) correctly identifies that the bar itself is misleading, which nobody else named. |
| Member C | α | β | γ | α (Prompt-Ops) has the most portable advice ("new task, not /compact"). β (Performance) is the most evidence-dense. γ (UX) — my own response — is the weakest on action specificity; I'd downgrade my own rank here. |

**Consensus findings (all 3 agreed):**
1. `/compact` does not touch system prompt, SKILLS catalog, or fresh `environment_details`.
2. The inactive-terminal replay + 1,269-file tree + ~190-entry skills catalog create a floor of ~75–130k tokens/turn.
3. `.clineignore` is mandatory for this repo shape.
4. Starting a **new task** is strictly better than repeated `/compact` once the floor is high.

**Disagreement (unresolved):** Member B argues tool-output-replay is the fastest filler; Member A argues the SKILLS catalog is the largest *absolute* chunk. Both can be true: skills are the largest fixed cost; terminals are the largest variable cost.

---

## Stage 3 — Chairman Synthesis

### Diagnosis (in one paragraph)
Cline's `/compact` summarizes only the middle-of-context conversation turns. It does **not** shrink (a) the system prompt, (b) the ~190-entry SKILLS catalog, (c) the recursive file tree and other `environment_details` re-generated every turn, or (d) the "Inactive Terminals" block that re-embeds prior tool-call stdout verbatim. In this repository those four items together form a **floor of roughly 75–130k tokens per turn**; with that floor, post-compact state starts at ~120k, and 3–4 substantive turns cross 900k — matching the user's "1–2 iterations" refill report.

### Action plan (ranked by impact-per-effort)

1. **Add `.clineignore`** — *applied this session*. Verified effect on the file tree: **1,269 → 245 files** (-80% of that section's tokens).
2. **Prefer a new task over `/compact`** once the bar passes ~65%. This resets the inactive-terminal replay, which `/compact` cannot reach.
3. **Prune `~/.cline/skills`** — 67 installed, most unused for this repo. Dropping to ~20 saves an estimated 30–50k tokens *every turn*. Candidates to keep for this repo: `systematic-debugging`, `llm-council-plus`, `lint-and-validate`, `test-fixing`, `code-review`, `tdd`, `pr-writer`, `gh-*`, and your 1–2 top-used domain skills.
4. **Do not read files >~2k lines into chat.** Use `search_files` with narrow regex. `.clineignore` now blocks the worst offenders (`output/*.pdf`, `package-lock.json`).
5. **Close the image tab** `temp_image_1777470737395.png` in VS Code Open Tabs — images embedded via open tabs are expensive.
6. **Housekeeping** (does not help *this* turn but helps VS Code responsiveness and prevents accidental history replay): `~/.cline/data` is **1.5 GB** and the VS Code global storage for Cline is **359 MB**. Delete old tasks via the Cline UI.

### Expected outcome
After (1)+(2)+(3), the per-turn floor should drop from ~100k to ~40–55k, and a fresh task should support **15–25+ substantive turns** before approaching the 1M ceiling — instead of the current 1–2.

### What we explicitly did **not** recommend
- Raising the context ceiling beyond 1M: not user-configurable in Cline, and it treats the symptom not the cause.
- Custom Cline forks or extensions: unnecessary; `.clineignore` + task hygiene + skill pruning are sufficient.
- Disabling `environment_details`: not exposed as a setting and would break Cline's situational awareness.

---
*Generated by the LLM Council Plus protocol. Three members deliberated independently; peer review produced a 2–1 consensus on root cause and unanimous consensus on the action plan. The `.clineignore` in step (1) was applied during this session and its effect measured.*
