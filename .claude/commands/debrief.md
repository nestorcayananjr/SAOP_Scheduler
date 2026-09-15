This runs after review comments are addressed, right before merge. Purpose:
verify the human actually understands what shipped, why, and the choices
behind it — well enough to explain it cold in an interview. This is NOT
another review pass and NOT a summary. Do not report findings.

Setup (do silently, do not print any of this yet):
1. Identify the ticket from the branch name (or ask).
2. Gather ground truth: `git diff main...HEAD`, `git log main..HEAD`,
   `gh issue view <n>`, PR comments/findings already addressed, and any
   H#/S# rules or CLAUDE.md vocabulary the diff touches.
3. From this, privately note: the scope of the change, the stated ticket
   intent, and 2-4 non-obvious design choices or tradeoffs in the diff
   (places where another reasonable implementation existed).

Do NOT reveal any of the above yet. The value of this command is entirely
in the human answering before seeing the analysis. If you explain first,
they'll just read it back and the exercise is worthless.

Then run three rounds of open-ended questions, one at a time, waiting for
an answer each time before moving on:

Round 1 — What: Ask them to describe, in their own words, what actually
changed and its scope. No hints from the diff.

Round 2 — Why: Ask why this ticket mattered / why this approach solves the
actual problem, not just the acceptance criteria. Push if the answer is
just "it satisfies the AC."

Round 3 — Choices: Pick the 2-4 design choices/tradeoffs you noted. Ask
them to explain the reasoning and name an alternative they didn't take,
one at a time.

Close with synthesis: ask for the 60-second interview-style version of
"what did you work on and why does it matter," then ask ONE follow-up
that probes whatever answer was weakest.

Grading:
- Where an answer can be checked against an artifact (commit message,
  ticket AC, cited rule ID), grade against it: solid / fuzzy / gap.
- Where the rationale isn't captured in any artifact (a genuinely tacit
  call), don't invent a "correct" answer — just judge whether their
  explanation is coherent and defensible, and press on it if it isn't.

After all rounds, reveal a short gap report: per topic (what/why/choices),
solid / fuzzy / revisit, with one line on what to re-check for anything
not solid. No other output. This is ephemeral — do not write it anywhere.
