"""SCHED-004 toy: 5 students, 3 electives, minimize preference cost."""

from ortools.sat.python import cp_model

# --- Toy data -------------------------------------------------------------
# 5 students (indices 0-4), 3 electives (indices 0-2).
NUM_STUDENTS = 5
NUM_ELECTIVES = 3

# Seats available per elective. Sum = 6 >= 5 students, so a solution exists.
capacity = [2, 2, 2]

# preference_cost[s][e] = "unhappiness" if student s gets elective e.
# 0 = their 1st choice, 1 = 2nd choice, 2 = 3rd choice. Lower is better.
# Note: students 0, 1, 2 all want elective 0 first, but it seats only 2 ->
# the solver is forced to make a trade-off. That is what makes it interesting.
preference_cost = [
    [0, 1, 2],  # student 0
    [0, 1, 2],  # student 1
    [0, 2, 1],  # student 2
    [2, 0, 1],  # student 3
    [1, 0, 2],  # student 4
]

# --- Model ----------------------------------------------------------------
model = cp_model.CpModel()

# Decision variables: x[(s, e)] == 1  <=>  student s is assigned elective e.
# Keyed by a (student, elective) tuple. Every combination gets its own 0/1 var.
x = {}
for s in range(NUM_STUDENTS):
    for e in range(NUM_ELECTIVES):
        x[(s, e)] = model.NewBoolVar(f"x_s{s}_e{e}")

# Constraint 1: each student is assigned to exactly one elective.
# For each student s, exactly one of x[(s, 0)], x[(s, 1)], x[(s, 2)] is 1.
for s in range(NUM_STUDENTS):
    model.AddExactlyOne(x[(s, e)] for e in range(NUM_ELECTIVES))

# Constraint 2: each elective holds at most `capacity[e]` students.
# The column sum (how many students chose elective e) must not exceed its seats.
for e in range(NUM_ELECTIVES):
    model.Add(sum(x[(s, e)] for s in range(NUM_STUDENTS)) <= capacity[e])

# Objective: minimize total preference cost across all assignments.
# Each term is cost * flag, so only the chosen (s, e) pairings contribute.
model.Minimize(
    sum(
        preference_cost[s][e] * x[(s, e)]
        for s in range(NUM_STUDENTS)
        for e in range(NUM_ELECTIVES)
    )
)

# --- Solve ----------------------------------------------------------------
solver = cp_model.CpSolver()
status = solver.Solve(model)

if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
    print(f"Status: {solver.StatusName(status)}")
    print(f"Total preference cost: {solver.ObjectiveValue():.0f}")
    for s in range(NUM_STUDENTS):
        for e in range(NUM_ELECTIVES):
            if solver.Value(x[(s, e)]) == 1:
                print(f"  student {s} -> elective {e} (cost {preference_cost[s][e]})")
else:
    print(f"Status: {solver.StatusName(status)} - no valid assignment exists.")

