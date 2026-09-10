# solver

Python solver for the SAOP elective scheduler, using Google OR-Tools CP-SAT.

## SCHED-004 — OR-Tools environment spike

De-risks the Python environment and demonstrates CP-SAT basics with a toy
assignment problem: 5 students, 3 electives with capacities, each student
assigned exactly one elective, total preference cost minimized.

## Setup

Dependencies are pinned in `uv.lock`. To install:

```sh
uv sync
```

## Run the toy solver

From the `solver/` directory:

```sh
uv run python src/solver/toy.py
```

Expected output (feasible case):

```
Status: OPTIMAL
Total preference cost: 1
  student 0 -> elective 0 (cost 0)
  student 1 -> elective 0 (cost 0)
  student 2 -> elective 2 (cost 1)
  student 3 -> elective 1 (cost 0)
  student 4 -> elective 1 (cost 0)
```

## Infeasibility check

Set `capacity = [1, 1, 1]` in `src/solver/toy.py` (3 seats < 5 students) and
re-run. The solver *proves* no valid assignment exists and reports:

```
Status: INFEASIBLE - no valid assignment exists.
```

Restore `capacity = [2, 2, 2]` afterward.

## Model concepts (CP-SAT)

- **BoolVar** — a 0/1 decision variable. `x[(s, e)] == 1` means student `s`
  is assigned elective `e`. The 5x3 grid of BoolVars is the one-hot layout
  that makes capacities and costs expressible as simple sums.
- **Constraint** — a rule every valid solution must satisfy (hard).
  `AddExactlyOne` per student (one elective each) + column-sum `<= capacity`
  per elective.
- **Objective** — the single quantity to optimize (soft preference).
  `Minimize(sum(cost * flag))` drives students toward their top choices.
