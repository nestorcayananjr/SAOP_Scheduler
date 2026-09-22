# Scheduling Rules — Source of Truth

Status: DRAFT
Last updated: 2026-09-22

This document is the single source of truth for elective scheduling rules.
Solver code and tests reference rules by ID (H1, H2… / S1, S2…). No schema
or code decisions here — prose only.

---

## How to read this doc

- **Hard Constraints (H#):** must never be violated by any valid schedule.
- **Soft Constraints (S#):** preferences the solver should optimize for,
  each with a proposed relative weight (higher = more important). Weights
  are a starting point, not final — expect to tune after seeing real output.
- **Open Questions (Q#):** anything not confidently known. Each is
  dispositioned as one of:
  - `KNOWN` — rule is understood and captured above
  - `ASSUMED` — no confirmed policy; a default is recorded below and used
    for v1 until corrected
  - `ASK PRINCIPAL` — needs to be raised in the principal meeting

---

## How students get their electives

Each student's slots are filled form two **disjointed** sources:

- **Required** (`requiredElectiveIds` on the student): hard, student-specific placements the solver must honor - admin assignments (Skill Builders per H13, Spanish 1 per H16) *and* the student's single PE pick (per H19; the UI appends the chosen PE elective here). Never ranked.
- **Ranked** (`rankedElectiveIds` on the preference): the general elective pool, fully ordered by the student. Drives S1/S4/S5. PE options and assigned electives are excluded.

Note: students rank their **entire** eligible elective pool (everything not already required/excluded), not a curated subset — the policy is the same across grades. The *number* ranked therefore isn't a fixed constant; it falls out of how many electives are eligible/available to that grade level (naturally smaller for 6th/7th than 8th). This is a fact about the input data, not a solver rule — nothing here enforces or checks it.

## Hard Constraints

| ID | Rule | Notes |
|----|------|-------|
| H1 | Every student is scheduled into exactly 8 elective slots per year, 4 electives a semester. | Edge case: some electives are year long |
| H2 | Grade-specific required electives must be assigned to all students in that grade | Example: Life of a Dolphin for every 6th grader. |
| H3 | A class cannot exceed its room's capacity | |
| H4 | Specialty classes (band, music, tech) can only be scheduled in their matching specialty room | |
| H5 | A teacher cannot be double-booked across two classes in the same period | |
| H6 | A room cannot be double-booked across two classes in the same period | |
| H7 | General-purpose/teacher classrooms must be available for at least one of the two elective blocks for a planning period. **SUPERSEDED** by H23 | ID retained, do not reuse, reference H23|
| H8 | A student cannot be double-booked across two classes in the same period | |
| H9 | Students cannot take electives they have already taken | TODO: verify with Veronica this is a rule |
| H10 | Teachers may only teach electives for which they are listed as eligible. Eligibility is an explicit per-elective set of teachers (`eligibleTeacherIds`), pool size >= 1 - a single-teacher elective (band, art, PE) is just a pool of one; a department-taught elective (e.g. Life of a Dolphin) is a larger pool. | TODO: verify with Veronica, band teachers should prioritize band, but what about general elective teachers?| Hard rail of *who may* teach. The soft preference of *who ideally* teaches (specialists prioritizing their specialty) is S6. Separate from H4 (specialty room) — band is constrained on both, independently. |
| H11 | Students must have at least one fine arts elective and one PE elective. **SUPERSEDED** by H19 (PE, all students) + H21 (Fine Arts, 6th graders only). | ID retained, do not reuse, reference H19/H21 instead. |
| H12 | Spanish requirements. **SUPERSEDED** by H16 (1 year of Spanish must be taken before they graduate, therefore 8th graders who haven't taken Spanish 1 must take it) | ID retained, do not reuse, reference H16|
| H13 | Some students are required to take specific classes. Example: some students are required to take Skill Builders | |
| H14 | Specific classes have prerequisites that are not based on previous classes/grade level/etc but rather overall integrity/behavior | Q: how do we choose which students should go into electives like service.| This is modeled as an optional `eligibleStudentIds` allowlist on the elective entity |
| H15 | Each elective defaults to a single section; only electives explicitly flagged (`allowsMultipleSections`) may have more.| TODO: clarify with admin which electives have multiple sections. |
| H16 | 8th graders who have not yet taken Spanish 1 (a year long elective) must be enrolled in Spanish 1. | |
| H17 | If a student is enrolled in a semester long elective in one semester, they must also be enrolled in a semester long elective in the next semester. | |
| H18 | Most classes only have 1 teacher assigned, however some classes have 2 teachers assigned (ex: Broadcast Media) | Verify if any other classes have 2 teachers assigned |
| H19 | Students must have an elective that is categorized as `Physical Education` | Note: This will be captured on the UI side, a student will choose one of the available PE classes and it will append to the requiredElectiveIds on the students entity.|
| H20 | Students cannot be enrolled in classes that they are not eligible for | |
| H21 | In addition to H19, 6th graders must also take an elective categorized as `Fine Arts` | Fine Arts electives live int he ranked pool (not a choose-one pick like PE), so the solver must hard-guarantee each 6th grader gets at least one Fine Arts elective from their ranked choices - ooverrided pure preference order.| 
| H22 | A few electives are restricted to specific semester(s); their sections may only be scheduled in the allowed semeseter | Rare. Modeled as an optional `allowedSemesters` on the elective - absent means any semester. Does not apply to year-long electives.
| H23 | Classrooms marked as `General Classroom` must be open for at least one of the block position slots on both ElectiveDay types. | |


---

## Soft Constraints

| ID | Rule | Proposed Weight (High / Medium / Low) | Notes |
|----|------|------------------|-------|
| S1 | Maximize students receiving one of their top-5 ranked electives | High | Core fairness metric — likely worth weighting by rank (1st choice > 5th choice) |
| S2 | Combinable classes should be combined when it reduces room/teacher pressure without hurting quality | Medium | TODO: confirm which classes are combinable and under what conditions NOTE: combined-section output representation TBD pending Q8 roster semantics - may require Section to reference multiple electives|
| S3 | Balance class sizes across sections of the same elective | Medium | |
| S4 | Minimize students receiving none of their ranked choices | High | Distinct from S1 — this is the floor, S1 is the ceiling |
| S5 | 8th graders should more likely receive their top ranked electives. | Medium | Important to still give 6th graders at least 1 of their top ranked electives, since they will inherently less blocks to work with. |
| S6 | Teachers should be preferentially assigned to their specialty electives when eligible for more than one. | Medium | The soft counterpart to H10. Moot for single-teacher pools (H10 already forces those). Matters for general teachers eligible across multiple electives. Weight read from input config, never hardcoded. |

---

## Open Questions for Principal

| ID | Edge Case | Disposition | Assumed Default (if ASSUMED) |
|----|-----------|-------------|-------------------------------|
| Q1 | Separation / grouping requests (e.g., keep two students apart, or together) | ASK PRINCIPAL | — |
| Q2 | Prerequisites (must complete elective X before Y) | ASK PRINCIPAL | — |
| Q3 | Semester-long vs. year-long electives | ASK PRINCIPAL | Year-long is an elective property; which semester(s) a section runs is solver output. |
| Q4 | Late enrollment after scheduling is finalized | ASSUMED | Late enrollees are placed into any elective with open seats, ranking/preference not guaranteed |
| Q5 | Cross-school teachers (teach at multiple schools, limited availability) | ASK PRINCIPAL | — |
| Q6 | Tie-break / priority policy (e.g., who wins the last band seat) | ASSUMED | Tie broken by [seniority in grade / random / first-come] — needs confirmation |
| Q7 | How do we choose which students should get into electives like service? | ASK PRINCIPAL | - |
| Q8 | What classes are combinable and how many classes should be combined? | ASK PRINCIPAL | combined-section output representation TBD pending Q8 roster semantics - may require Section to reference multiple electives |
| Q9 | Are there any other classes that are like skill builders? In other words, are there required classes for students that fall under one or more categories? | ASK PRINCIPAL | - |
| Q10 | Can students switch electives and if so what is the time frame to switch? | ASSUMED | Students can switch within the first 2 weeks - needs confirmation |
| Q11 | Are all rooms numeric or are some alphanumeric? | ASK PRINCIPAL | - |

---