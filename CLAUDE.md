# SAOP_scheduler

## Overview
A scheduling app being built for a middle school. Purpose is to automate and optimize the creation of 150+ students elective schedules along with the teacher/classroom pairings for each elective. This application is scoped for schedule creation, optimization, and in the future, manual override.

## Tech Stack

**Two runtimes, one JSON contract.** TypeScript owns everything before the
solver (data generation, linting) and after it (validation, reporting);
Python owns only the solving. They communicate exclusively through JSON
files validated against shared schemas — no shared code, no RPC.

- Language/runtime:
  - TypeScript / Node (all tooling: `tools/*`, `packages/*`)
  - Python 3.14 (solver only, isolated in `solver/`)
- Framework: none — this phase is CLI tools only. No web framework,
  no server. (A web app is planned for phase 2; do not introduce one here.)
- Database/ORM: none — deliberately file-based (JSON in/out). No Prisma,
  no persistence in phase 1.
- Key libraries:
  - `zod` — schema definitions in `packages/shared/schema/`, the single
    source of truth for all data shapes; exported to JSON Schema for the
    Python side
  - `ortools` (CP-SAT, `ortools.sat.python.cp_model`) — constraint solver;
    the only significant Python dependency
- Package manager:
  - npm with workspaces (`tools/*`, `packages/*`) for TypeScript
  - `uv` with pinned dependencies for Python (`solver/pyproject.toml`)

## Architecture
Target folder structure (see Tech Stack for the two-runtime JSON contract):

    SAOP_scheduler/
    ├── package.json              npm workspaces root (tools/*, packages/*)
    ├── docs/rules.md             source of truth for scheduling rules (H#/S#)
    ├── packages/shared/schema/   zod schemas (see Tech Stack)
    ├── tools/                    TypeScript CLI tools (npm workspaces)
    │   ├── generate/               synthetic/test data generation
    │   ├── lint/                   validate solver INPUTS
    │   └── validate/               validate solver OUTPUTS / reporting
    └── solver/                   Python 3 + OR-Tools CP-SAT (uv-managed)
        └── src/solver/            the only runtime that solves

**Boundaries — do not cross:**
- Data flows TS → JSON → Python → JSON → TS. Never import across the TS/Python line.
- Derive all types from the zod schemas in `packages/shared/schema/`; don't
  redefine data shapes ad hoc.
- Reference constraints by ID (H#/S#) from `docs/rules.md` in solver code and
  tests — don't silently hardcode rule logic.

## Current State
Phase 1 — CLI engine.
Done: SCHED-001 (rules doc), SCHED-004 (OR-Tools spike), SCHED-012 Phase A (scaffold)
In progress: SCHED-013 (this file + review setup)
Not yet built: schemas, generator, solver, validator — do not assume they exist.

## Commands
- `npm run generate -- --seed 42 [--messy]` — synthetic data (tools/generate) (not yet built)
- `npm run lint-input -- <input.json>` — pre-solve data checks (tools/lint) (not yet built)
- `npm run validate -- <input.json> <output.json>` — output verification + metrics (tools/validate) (not yet built)
- `uv run python src/solver/main.py <input> <output>` — solve (from solver/) (not yet built)
- `npm run demo -- --seed 42` — full pipeline (not yet built)

## Vocabulary
- **Section**: concrete instance (elective + teacher + room + block). An elective may have 0..n sections. Sections are solver OUTPUT, never input.
- **Block**: an elective period in the bell schedule.
- **Planning block**: teacher unavailable; their room may also be unavailable.
- **Combinable group**: electives that may share one section (see rules.md for roster semantics).

## Do not
- Never soften or drop a hard constraint (H#) to make an infeasible case solve —
  infeasibility is information, not a bug to route around.
- Never bypass or weaken schema validation to make a test pass.
- No real student data enters this repo, ever. Synthetic only.
- Objective weights are never hardcoded — always read from input config.

## Tickets
Work is tracked as GitHub issues in this repo, titled `[SCHED-NNN] …`.
To read a ticket (e.g. for a spec-compliance review): `gh issue view <number>`
or `gh issue list --search "SCHED-005"`.

## Review workflow
PRs should not be merged the same-day they are created. Instead, they are to be left hanging until the next day and must be reviewed using the following workflow.

Branch per ticket --> Development --> Human cold self-review --> AI does a review via the `.claude/commands/review-*.md` commands in a fresh session --> Claude leaves findings as PR comments --> Human addresses comments, if needed and does another AI review --> run `.claude/commands/debrief.md` to verify understanding before merging --> merge when findings are all addressed and the debrief passes. 

## Definition of Done
A PR is done when, per the Review Workflow above:
- No same-day merges — a PR sits until the next day before it can merge.
- A human cold self-review has been done.
- At least one AI adversarial pass (`.claude/commands/review-*.md`, run in a fresh session) has been done and its findings addressed.
- `.claude/commands/debrief.md` has been run and passes before merging.

The only exceptions are trivial chores (e.g. removing console.logs or unnecessary comments) — these may merge same-day without the full workflow.
