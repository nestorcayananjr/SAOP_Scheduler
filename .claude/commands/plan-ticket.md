Write a build-it-yourself implementation guide for a ticket, to
`ticket-planning-docs/SCHED-NNN-implementation-guide.md`.

Identify the ticket for this branch (from the branch name, or ask me). If I named
a ticket in the command args, use that instead. Fetch it: `gh issue view <number>`.

## Ground the guide before writing a word

Do all of this first — the value of the doc is that it's written against reality,
not against the ticket's prose:

1. Read `docs/rules.md` **in full**. Note its `Last updated` date and which H#/S#
   are marked SUPERSEDED — tickets are often older than the rules doc.
2. Read the shipped code this ticket **consumes** (schemas, the upstream tool's
   output, whatever it imports) — not the aspirational shapes described in an
   earlier guide or in the ticket's Technical Notes. Where the ticket names a
   field, verify that field exists with that name.
3. Read the actual **data** the ticket will run against (e.g.
   `tools/generate/solver_input.json`) and pull real counts out of it. Measured
   numbers beat adjectives everywhere in the doc.
4. Check what does **not** exist yet — missing deps, missing files, missing test
   harness, stale build artifacts. The ticket assumes these silently; the guide
   must not.
5. Read the previous guides in `ticket-planning-docs/` for format and register.
6. Compute anything that decides a design choice — variable counts for competing
   encodings, a capacity/feasibility ledger, runtime estimates. If a decision
   turns on a number, get the number.

## Ask before writing, but only real questions

Ask me only where two readings produce **materially different work** and I'm the
one who has to decide — a ticket AC that contradicts `docs/rules.md`, or a rule
whose ambiguity changes the model. Resolve everything else yourself: where
CLAUDE.md or `docs/rules.md` settles it, cite and decide; where the rule is
merely silent, pick the reading the arithmetic supports, write it as **ASSUMED**
with a `TODO: verify with Veronica`, and flag it for the PR write-up. Don't ask
me to confirm things the repo already answers.

## The doc

Open with a `> **Purpose of this doc:**` blockquote (build-it-yourself; no
finished code) plus a `> **Basis:**` blockquote naming the `rules.md` date, the
branch, and the code state it was written against — and warning me where the
ticket has drifted from those. Then these eight sections:

1. **What this ticket actually is** — what it is in one paragraph, deliverables
   reconciled from the AC, and an explicit **out of scope** list naming the
   ticket that owns each excluded piece. Call out anything the ticket touches
   outside its stated folder.
2. **The starting state** — what exists, what doesn't, what's stale, with real
   counts and paths.
3. **The core design decisions** — `### 3a`, `3b`, … The heart of the doc.
   One subsection per decision that would cost a rewrite if gotten wrong. Show
   the reasoning and the numbers, and include a reconciliation subsection
   (AC-says vs reality vs what-to-do, as a table) whenever the ticket has drifted.
   Where you depart from the ticket's Technical Notes, justify it with evidence
   and say explicitly whether it softens an acceptance criterion.
4. **Order of operations** — the build/algorithm sequence, with the checkpoints
   where I should stop and verify.
5. **Build steps** — `### Step 0`, `Step 1`, … each ending in a "Done when:"
   condition. Step 0 is always bootstrap/deps/layout.
6. **Cheat sheet** — a table mapping every rule or AC bullet to where it lives:
   in scope / deferred / superseded / by-construction. This table is the
   gap-finder; it's the section most likely to catch something the AC omitted.
7. **Resources** — real links, each with one line on what it's for *in this
   ticket*, plus which in-repo files to read and which patterns in them not to copy.
8. **Definition of done** — a checkbox list, ending in a blockquote naming the
   project rule this ticket is most likely to be tempted to violate.

## Rules

- **No finished implementation code.** Variable *shapes*, constraint *shapes*,
  file layouts, and named techniques — yes. Working functions — no. I write the
  code; the doc tells me what and why.
- Every claim about the repo must come from something you actually read or ran
  this session. Quote real counts, real file paths, real command output. Never
  describe a field or file you didn't open.
- Reference rules by ID, and never a superseded ID except to say it's superseded.
- Flag every assumption as ASSUMED at the point it's made, and list it again in
  the Definition of Done so it reaches the PR write-up.
- Name the traps: the thing that looks right and is silently wrong, the
  constraint that's expensive, the field that's empty in the test data so a rule
  has no teeth. These are the highest-value paragraphs in the doc.
- Match the length and density of the existing guides — long is fine, padding is
  not. No restating the AC back as prose.
