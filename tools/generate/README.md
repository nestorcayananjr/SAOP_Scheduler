# `@saop/generate` — internals

CLI usage (`--seed`, `--messy`, `--out`) is documented in the [root README](../../README.md).
This file covers the design decisions inside the tool that aren't obvious from the code.

Rules are referenced by ID (`H#` / `S#`) from [`docs/rules.md`](../../docs/rules.md).

---

## The feasibility estimator

`builders.ts` contains a small group of functions — `gradePoolSlots`, `expectedSections`,
`teacherLoad`, `assertCatalogFitsBudget` — that only make sense read together. This is what
they're doing and why.

### Why it exists

The generator hardcodes a catalog of electives (`electiveCatalog`) and reads school size,
room counts and staff size from `config.ts`. Nothing stops those two from disagreeing: a
catalog can easily demand more teacher-time or more specialty rooms than the configured school
has. If that happens, the generator emits a school that **no solver can schedule**.

That failure is worth catching here, because it is indistinguishable downstream from a real
solver finding. Per `CLAUDE.md`, infeasibility is information, not a bug to route around — but
that only holds when the *input* was feasible to begin with. An infeasible generated school is
a generator bug wearing a solver bug's clothes.

So the estimator runs as a precondition, before any RNG is drawn, and throws with an actionable
message rather than producing unusable data.

### The unit: block-semesters

Every budget below is counted in **block-semesters** — one block, held for one semester.

| Quantity | Value | Why |
|---|---|---|
| Elective blocks per semester | 4 | `BlockPosition` (2) × `ElectiveDay` (2) |
| Semesters per year | 2 | Fall, Spring |
| Cost of a half-year section | 1 block-semester | occupies its block for one semester |
| Cost of a year-long section | 2 block-semesters | keeps the same block in both semesters |
| Teacher budget per year | 8 block-semesters | H5 caps a teacher at one section per block |

A general classroom is the exception on the supply side: H23 requires it to stay open for at
least one block position on **both** `ElectiveDay` types, so only half its blocks per semester
are bookable for electives.

### The chain

```
gradePoolSlots(grade)          how many slots a grade's reachable electives offer
        ↓
expectedSections(spec)         demand for one elective → how many sections it needs
        ↓
teacherLoad(spec)              those sections → block-semesters charged per pool member
        ↓
assertCatalogFitsBudget()      compare demand against teacher and room supply
```

**`gradePoolSlots`** counts the slots available to a grade. H19 makes PE a choose-one pick
(the UI appends one PE elective to `requiredElectiveIds`), so all PE rows contribute a single
slot between them rather than one each — that's the `PE_CHOOSE_ONE_SLOT` seed on the reduce.

**`expectedSections`** estimates demand. H1 gives every student exactly 8 elective slots a
year, spread across whatever their grade can reach, so a grade's take rate for any one elective
is roughly `ELECTIVE_SLOTS_PER_STUDENT / gradePoolSlots(grade)`. PE rows divide that share
again, since they compete for the one PE slot. Two shortcuts apply first: a spec can pin
`expectedSections` explicitly where the derivation can't see real demand (Service Learning,
whose roster is an H14 allowlist), and an elective without `allowsMultipleSections` is capped
at one section by H15.

**`teacherLoad`** converts sections into block-semesters charged to each member of the
elective's eligible-teacher pool (H10). For a pool of one this is exact. Larger pools split the
load — except where `requiredTeacherCount` forces every member on at once, which is H18's
Broadcast Media.

**`assertCatalogFitsBudget`** runs three checks. The first two are pure functions of catalog +
config, so they run before any RNG is drawn. The third happens later, during
`assignTeacherPools`, once pools are actually dealt out:

1. **Per-elective teacher load** — no single elective may charge a pool member more than the
   8 block-semester budget.
2. **Room supply by type** — summed section demand per `RoomType` must fit the configured
   rooms, halving bookable blocks for general classrooms per H23.
3. **Aggregate staffing** — the catalog may fit in principle yet still not fit onto the
   configured number of teachers. `assignTeacherPools` draws pools least-loaded-first (so no
   teacher ends up sole-eligible for more sections than H5 permits) and throws if a teacher
   would exceed budget.

### It is deliberately rough

The estimate is an approximation and errs high on purpose. It never needs to be accurate — it
only needs to be good enough to budget teachers and rooms, and erring high means it fails loudly
rather than emitting a school that's quietly too tight to schedule. Do not treat its numbers as
a prediction of the solver's actual section counts; sections are solver **output**, and these
are generator-side estimates that exist only to size the inputs.

### When it throws

The error messages name their own fix. In summary:

| Message | Meaning | Fix |
|---|---|---|
| `"X" needs ~N section(s), charging each of its P eligible teacher(s) …` | one elective alone exceeds a teacher's yearly budget | raise that spec's `teacherPoolSize`, or pin a smaller `expectedSections` |
| `<RoomType> is oversubscribed: sections need N block-semesters but R room(s) supply S` | not enough rooms of that type | raise `config.roomCount` for that type |
| `Teacher N would carry B block-semesters … after "X"` | catalog fits in principle, but not onto this many staff | raise `config.teacherCount` |

A throw here is the intended behavior, not a crash to work around. Loosening a check to make
generation succeed would just move the infeasibility downstream into the solver, where it costs
far more to diagnose.
