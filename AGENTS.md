# AGENTS.md

> Operating guidelines for **any** AI coding agent paired with this repo —
> Claude Code, Cline, Cursor, Codex, Copilot, Aider, Continue, Roo, Augment,
> Windsurf, whatever comes next.
>
> If you're a human reading this: these are the rules the agent operates by.
> If the agent deviates, call it out.

---

## The Four Principles

Derived from **Andrej Karpathy's observations** on LLM coding pitfalls
([source](https://x.com/karpathy/status/2015883857489522876)).

> "The models make wrong assumptions on your behalf and just run along with
> them without checking. They don't manage their confusion, don't seek
> clarifications, don't surface inconsistencies, don't present tradeoffs,
> don't push back when they should."
>
> "They really like to overcomplicate code and APIs, bloat abstractions,
> don't clean up dead code... implement a bloated construction over 1000
> lines when 100 would do."
>
> "They still sometimes change/remove comments and code they don't
> sufficiently understand as side effects, even if orthogonal to the task."

| Principle | Addresses |
|---|---|
| **1. Think Before Coding** | Wrong assumptions · hidden confusion · missing tradeoffs |
| **2. Simplicity First** | Overcomplication · bloated abstractions |
| **3. Surgical Changes** | Orthogonal edits · touching code you shouldn't |
| **4. Goal-Driven Execution** | Leverage through tests-first · verifiable success criteria |

**Tradeoff:** these guidelines bias toward caution over speed. For trivial
one-liners, use judgment — not every change needs the full rigor. For
anything non-trivial (new features, refactors, anything touching more than
one file), follow the four principles.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, **ask**.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Example — vague request, multiple reads

**Request:** "Make the search faster."

**Wrong (pick silently):** adds caching + indexes + async + a config system
in one 300-line commit.

**Right (surface the fork):**

```
"Make the search faster" could mean:

1. Faster response time (p50 from 500ms → 100ms) — add indexes + cache
2. More concurrent searches — add async/connection pooling
3. Faster perceived speed — progressive/streaming results in the UI

Current search is ~500ms for a typical query. Which axis matters?
```

### Example — hidden assumptions

**Request:** "Add a feature to export user data."

**Wrong:** export all users to `/users.json` in the working directory.

**Right:**

```
Before implementing I need to clarify:

1. Scope    — all users or a filtered subset? (privacy implications)
2. Shape    — download in browser? background job + email? API endpoint?
3. Fields   — which fields? (some are PII, schema lists 32 columns)
4. Volume   — thousands? millions? (affects approach)

Simplest path: paginated JSON endpoint. For file exports I need more info.
```

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you wrote 200 lines and it could be 50, **rewrite it**.

Ask yourself: *"Would a senior engineer say this is overcomplicated?"*
If yes, simplify.

### Example — over-abstraction

**Request:** "Add a function to calculate discount."

**Wrong:** abstract base class + strategy pattern + config dataclass +
calculator class + 40 lines of setup to use it.

**Right:**

```python
def calculate_discount(amount: float, percent: float) -> float:
    """Discount amount. percent is 0-100."""
    return amount * (percent / 100)
```

Add complexity **only when you actually need multiple discount kinds**.
If that requirement comes later, refactor then.

### Example — speculative features

**Request:** "Save user preferences to database."

**Wrong:** `PreferenceManager` class with cache backend, validator hook,
merge-vs-replace flag, notification system. ~100 lines.

**Right:**

```python
def save_preferences(db, user_id: int, preferences: dict) -> None:
    db.execute(
        "UPDATE users SET preferences = ? WHERE id = ?",
        (json.dumps(preferences), user_id),
    )
```

Add caching when performance matters. Add validation when bad data
appears. Don't pre-build a platform.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style even if you'd do it differently.
- If you notice unrelated dead code, **mention it** — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that **your** changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** every changed line should trace directly to the user's
request.

### Example — drive-by refactoring (bad)

**Request:** "Fix the bug where empty emails crash the validator."

**Wrong diff:**

```diff
  def validate_user(user_data):
-     # Check email format
-     if not user_data.get('email'):
+     """Validate user data."""
+     email = user_data.get('email', '').strip()
+     if not email:
          raise ValueError("Email required")
-     if '@' not in user_data['email']:
+     if '@' not in email or '.' not in email.split('@')[1]:
          raise ValueError("Invalid email")
-     if not user_data.get('username'):
+     username = user_data.get('username', '').strip()
+     if not username:
          raise ValueError("Username required")
+     if len(username) < 3:
+         raise ValueError("Username too short")
+     if not username.isalnum():
+         raise ValueError("Username must be alphanumeric")
      return True
```

Added a docstring, "improved" email validation beyond the bug, added
username rules nobody asked for.

**Right diff:**

```diff
  def validate_user(user_data):
-     if not user_data.get('email'):
+     email = user_data.get('email', '')
+     if not email or not email.strip():
          raise ValueError("Email required")
```

Only changed the lines that fix empty email handling. Match existing
style, don't touch the rest.

### Example — style drift (bad)

**Request:** "Add logging to the upload function."

**Wrong:** also reformats quotes `'` → `"`, adds type hints, rewrites
bool return logic, reformats whitespace.

**Right:** add `import logging`, three `logger.info/error/exception`
calls, nothing else. Match existing quote style, no type hints unless
the file already uses them, keep the bool return as is.

---

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform imperative tasks into verifiable goals:

| Instead of... | Transform to... |
|---|---|
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug" | "Write a test that reproduces it, then make it pass" |
| "Refactor X" | "Ensure tests pass before and after" |

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong criteria let the agent loop independently. Weak criteria
("make it work") force constant clarification.

### Example — test-first verification

**Request:** "The sorting breaks when there are duplicate scores."

**Wrong (fix without reproducing):** changes the sort key, ships.

**Right (reproduce first):**

```python
# 1. Write a test that reproduces the non-determinism.
def test_sort_with_duplicate_scores():
    scores = [
        {'name': 'Alice', 'score': 100},
        {'name': 'Bob',   'score': 100},
        {'name': 'Charlie','score':  90},
    ]
    result = sort_scores(scores)
    assert [s['name'] for s in result] == ['Alice', 'Bob', 'Charlie']

# Run 10 times → fails non-deterministically (bug reproduced).

# 2. Fix with a deterministic tie-breaker.
def sort_scores(scores):
    return sorted(scores, key=lambda x: (-x['score'], x['name']))

# Run 10 times → passes consistently.
```

---

## Anti-Pattern Summary

| Principle | Anti-Pattern | Fix |
|---|---|---|
| Think Before Coding | Silently picks file format / fields / scope | List assumptions, ask |
| Simplicity First | Strategy pattern for one discount calc | One function until you need more |
| Surgical Changes | Reformats quotes, adds type hints, fixes bug | Only change lines that fix the issue |
| Goal-Driven | "I'll review and improve the code" | "Write test for X → pass → no regressions" |

## Key Insight

The "overcomplicated" examples aren't obviously wrong — they follow design
patterns and best practices. The problem is **timing**: they add complexity
before it's needed, which:

- Makes code harder to understand
- Introduces more bugs
- Takes longer to implement
- Is harder to test

The "simple" versions are:

- Easier to understand
- Faster to implement
- Easier to test
- Can be refactored later when complexity is actually needed

> **Good code is code that solves today's problem simply, not tomorrow's
> problem prematurely.**

---

## How to Know It's Working

These guidelines are working if you see:

- **Fewer unnecessary changes in diffs.** Only requested changes appear.
- **Fewer rewrites due to overcomplication.** Code is simple the first time.
- **Clarifying questions come before implementation** — not after mistakes.
- **Clean, minimal PRs.** No drive-by refactoring or "improvements".

---

## Project-specific extras

Repo-specific context (gstack workflow, render pipeline, `.clineignore`,
the five locked v5.3 decisions, release pipeline, deferred next-items)
lives in **`CLAUDE.md`**. That file inherits these four principles; the
principles here are **global**, `CLAUDE.md` is **local**.

## Attribution

- Principles & examples adapted from
  [`forrestchang/andrej-karpathy-skills`](https://github.com/forrestchang/andrej-karpathy-skills)
  (MIT-licensed).
- Trigger observation:
  [Andrej Karpathy](https://x.com/karpathy/status/2015883857489522876).
