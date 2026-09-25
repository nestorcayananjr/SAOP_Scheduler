# SAOP_scheduler
Scheduler app for SAOPCS to solve problem of manual scheduling electives.

## Stack
TypeScript tools + Python CP-SAT solver

## Prerequisites
- Node.js with native ESM support (developed/tested on Node 24)
- npm (workspaces — no separate package manager needed for the TS side)

## Local setup
```
npm install
```
Installs every workspace under `tools/*` and `packages/*`, including the
`@saop/generate` ↔ `@saop/schema` link.

## Generating synthetic data
`tools/generate` produces a fake middle school's `solver_input.json` — the
dev dataset and test fixture corpus for everything downstream (the solver,
the linter). Run from the repo root:

```
npm run generate -- --seed 42
```

- **`--seed <n>`** (required) — same seed always produces a byte-identical
  file. Use different seeds to get different (but still internally
  consistent) fake schools.
- **`--messy`** (optional) — layers deliberately dirty data on top of a
  clean, feasible base: duplicate ranks, blank surveys, ineligible
  rankings, and an oversubscribed specialty room. Writes a second
  `*.messy.answers.json` file alongside the output, listing exactly what
  was dirtied (a duplicate-rank entry will also fail the schema's own
  validation — that's intentional, see `docs/rules.md`).
- **`--out <path>`** (optional) — defaults to `./solver_input.json`
  (relative to wherever you run the command from).

Example — three different clean fixtures, plus one messy one for testing
a linter against:
```
npm run generate -- --seed 42
npm run generate -- --seed 43 --out fixtures/seed43.json
npm run generate -- --seed 44 --messy --out fixtures/seed44.messy.json
```

## Environment variables

## Manual setup you must do yourself

## Data Model

## Docs

## Notes
This project is in active development.
