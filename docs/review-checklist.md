# Review Checklist

Run this as the human pass — it complements the AI review commands,
it doesn't repeat them. AI hunts bugs/readability; this catches
judgment, context, and discipline.

1. Ticket intent: does the change solve what the ticket actually
   wanted, not just satisfy the acceptance criteria literally?

2. Scope: nothing here belongs to a different/later ticket.

3. Hard-constraint integrity: no H# constraint was softened or dropped
   to force an infeasible case to solve (infeasibility is information).

4. No hardcoded objective weights — all read from input config.

5. Boundaries respected: no TS↔Python imports; data shapes derived
   from zod schemas; constraint code cites rule IDs (H#/S#).

6. Ran it: tests pass AND I exercised the failure/infeasible
   not just the happy path.

7. Process: cold review done next-day; all three AI passes run in
   fresh sessions; findings addressed, not dismissed.

8. Debrief command is ran and any gaps identified by AI is addressed.