# Example solver-input files — how `solver-input.valid.json` is wired

This note explains *why* the hand-authored valid example looks the way it does,
so it can be read cold later. It satisfies the SCHED-002 acceptance criterion:
a hand-written ~5-student file that validates against `SolverInput`.

Validate it with:

```bash
npm run check:examples
```

This parses `solver-input.valid.json` (must pass) and `solver-input.invalid.json`
(must fail, printing a clear error), exiting non-zero if either expectation is
violated. The valid example is confirmed to `SolverInput.parse()` without error.

---

## Guiding principle: consistent ids, and exercise every feature

Two goals drove the data:

1. **Referential integrity by hand.** Zod validates *shape*, not references — so
   the example is only meaningful if ids line up. Ids are blocked per entity so
   they're easy to trace:

   | Entity   | id range |
   |----------|----------|
   | teachers | 1–3      |
   | rooms    | 1–4      |
   | blocks   | 1–8      |
   | electives| 1–9      |
   | students | 1–5      |

   Because references are consistent (no `studentId`/`electiveId` points at a
   missing entity), this file doubles as a fixture for the future `tools/lint`
   referential-integrity checks, not just schema validation.

2. **Coverage over realism.** The dataset is small but deliberately touches every
   non-trivial feature in the model, so the example is a real test rather than a
   toy. See the coverage map below.

---

## Feature / rule coverage map

| Feature (rule) | Where in the file |
|----------------|-------------------|
| Full block grid — 2 semesters × 2 day-patterns × 2 orderings (H1) | `blocks` 1–8 |
| Numeric `ordering` enum (1/2) crossing the JSON boundary | every block's `ordering` |
| String enums (Semester, RoomType, ElectiveType, ElectiveDay, Grade) | throughout |
| Specialty rooms are singletons — one PE room, one Art room (H4/H6) | `rooms` 3 (PE), 4 (Art) |
| Teacher eligibility as a set, pool ≥ 1 (H10) | every elective's `eligibleTeacherIds`; elective 4 & 7 show pools > 1 |
| Elective type taxonomy (H11/H19/H21) | PE, Fine Arts, General across electives |
| **Year-long** elective (H16) | elective 5 "Spanish 1" — `isYearLong: true` |
| **Semester-locked** elective (H22) | elective 6 "Yearbook" — `allowedSemesters: ["Spring"]` |
| year-long ⊕ allowedSemesters refine holds | 5 and 6 are different electives, never both |
| **Gated** elective allowlist (H14) | elective 4 "Broadcast Media" — `eligibleStudentIds: [3, 4]` |
| **Combinable** group (S2) | `combinableGroups` [1] — electives 7 + 8 |
| **Locked assignment**, student→elective, optional block | `lockedAssignments` — student 3 into elective 4, block 3 |
| Weights keyed by S# (never hardcoded) | `config.weights` S1–S6 |
| Solver run params as input, not code | `config.timeLimitSeconds`, `randomSeed` |
| Empty-collection defaults | (both collections are populated here; the *invalid* file / other fixtures can omit them to exercise `.default([])`) |

---

## The two-bucket model, made concrete

The most important thing this file demonstrates is how a student ends up in an
elective — the **required vs. ranked** split we settled on:

- **`requiredElectiveIds`** = hard, student-specific placements (admin-assigned
  *and* the student's single PE pick). Never ranked.
- **`preferences[].rankedElectiveIds`** = the general pool, fully ordered. Soft
  (S1/S4/S5). Excludes PE picks and assigned electives.

Worked examples:

- **Student 1 (Emma, 6th):** `requiredElectiveIds: [1]` — her PE pick
  (Physical Education) lands here per **H19** (the UI appends the chosen PE
  elective). Her ranking `[7, 3, 8]` is the general pool; it includes Catholic
  Art (Fine Arts) so the solver can satisfy **H21** (6th graders need a Fine Arts
  elective) from her ranked choices.
- **Student 3 (Olivia, 8th):** `requiredElectiveIds: [5, 1]` = Spanish 1
  (year-long, assigned per **H16**) + her PE pick. She's cleared for the gated
  Broadcast Media (in its `eligibleStudentIds`), so it appears first in her
  ranking.
- **Student 4 (Noah, 8th):** has `takenElectiveIds: [3]` (Catholic Art), so
  Catholic Art is **absent from his ranking** — demonstrating **H9** (can't take
  what you've already taken).
- **Student 5 (Ava, 7th):** `requiredElectiveIds: [1, 9]` = PE pick + Skill
  Builders (student-specific assignment per **H13**). Not cleared for Broadcast
  Media, so it's excluded from her ranking.

### Why some electives are missing from a student's ranking
A ranked list is *only* the electives a student can actually choose. It excludes:
- **PE options** (electives 1, 2) — chosen, not ranked (they go to `requiredElectiveIds`).
- **Assigned** electives — Spanish 1 (5), Skill Builders (9).
- **Grade-ineligible** electives — e.g. a 6th grader can't rank Broadcast Media
  (7th/8th only) or Yearbook.
- **Already-taken** electives (H9).
- **Gated** electives the student isn't cleared for (H14).

The buckets are disjoint (nothing required is also ranked). Enforcing that
partition, and the "ranks exactly the eligible set" rule, is a `tools/lint`
job — not something Zod checks on a single object.

---

## What this file intentionally does NOT contain

- **No `sections`.** Sections are solver *output*; the input envelope is input
  only. Teacher/room/block/semester assignments do not appear here — the solver
  produces them.
- **No derived fields.** A section's semester/days come from its block; an
  elective carries no semester. Nothing here duplicates a derivable value.

## What the schema does NOT catch (so don't over-trust a green parse)

`SolverInput.parse()` passing means **shapes** are valid. It does **not** verify:

- **Referential integrity** (does `rankedElectiveIds: [4]` point at a real
  elective?) — that's `tools/lint`.
- **`.refine()` predicates on the Python side** — the exported JSON Schema
  cannot carry custom predicates (dedup checks, the year-long/allowedSemesters
  rule). They hold on the TS side here, but Python won't re-enforce them.
- **Hard constraints** like H1 (8 slots), H3 (capacity), double-booking — those
  are checked against *output* by `tools/validate`, not against this input.
