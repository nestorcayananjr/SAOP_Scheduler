Identify the ticket for this branch (from the branch name, or ask me).
Fetch it: `gh issue view <number>`. Gather ground truth: `git log main..HEAD`,
`git diff main...HEAD --stat`, and anything you actually ran/tested this session.

If the branch isn't pushed yet, push it. If a PR for this branch doesn't
already exist (`gh pr list --head <branch>`), create one against `main`
titled `[SCHED-NNN] <ticket title>`, body `Closes #<n>` plus a one-line
summary drawn from the ticket's Summary section. If a PR already exists,
use it — don't create a duplicate.

Then post a write-up as a PR comment (`gh pr comment`, not the PR body) in
this exact format, modeled on the SCHED-004 and SCHED-013 write-ups:

## SCHED-NNN — <short ticket description> ✅ Done

**What was built**
- Concrete deliverables from this ticket, file-referenced where useful,
  code-quoted where it clarifies (functions/constants/line counts).

**Verified**
- What was actually run or tested, and what happened — specific commands,
  specific results (e.g. "capacity=[1,1,1] → INFEASIBLE as expected"), not
  a vague "tests pass." If the ticket included a dry run, spike, or manual
  check, describe it and its concrete outcome.

**Surprises / notes for <next ticket, from Dependencies section if known>**
- Non-obvious things learned while building this: gotchas, corrected false
  assumptions, things the next ticket should watch out for. Omit this
  section entirely if nothing surprising came up — don't pad it.

Rules:
- Ground every bullet in something that actually happened this session —
  diff output, command output, tool results you saw. Never invent
  verification that didn't happen.
- If nothing was verified beyond the code existing (no run, no test, no
  dry run), say that plainly in the Verified section instead of fabricating
  one.
- Keep it as terse as the SCHED-004/SCHED-013 write-ups — no filler, no
  restating the acceptance criteria back as prose.
