# Scheduling Rules — Source of Truth

Status: DRAFT
Last updated: 2026-09-10

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

## Hard Constraints

| ID | Rule | Notes |
|----|------|-------|
| H1 | Every student is scheduled into exactly 4 elective slots per year, 2 electives a semester. | Edge case: some electives are year long |
| H2 | Grade-specific required electives must be assigned to all students in that grade | Example: Life of a Dolphin for every 6th grader. |
| H3 | A class cannot exceed its room's capacity | |
| H4 | Specialty classes (band, music, tech) can only be scheduled in their matching specialty room | |
| H5 | A teacher cannot be double-booked across two classes in the same period | |
| H6 | A room cannot be double-booked across two classes in the same period | |
| H7 | General-purpose/teacher classrooms most be available for at least one of the two elective blocks for a planning period. | |
| H8 | A student cannot be double-booked across two classes in the same period | |
| H9 | Students cannot take electives they have already taken | TODO: verify with Veronica this is a rule |
| H10 | Teachers should only teach electives they have listed as able to teach. | TODO: verify with Veronica, band teachers should prioritize band, but what about general elective teachers?|
| H11 | Students must have at least one fine arts elective and one PE elective. | |
| H12 | Spanish requirements. | TODO: clarify what these requirements are |
| H13 | Some students are required to take specific classes. Example: some students are required to take Skill Builders | |
| H14 | Specific classes have prerequisites that are not based on previous classes/grade level/etc but rather overall integrity/behavior | Q: how do we choose which students should go into electives like service.|

---

## Soft Constraints

| ID | Rule | Proposed Weight (High / Medium / Low) | Notes |
|----|------|------------------|-------|
| S1 | Maximize students receiving one of their top-5 ranked electives | High | Core fairness metric — likely worth weighting by rank (1st choice > 5th choice) |
| S2 | Combinable classes should be combined when it reduces room/teacher pressure without hurting quality | Medium | TODO: confirm which classes are combinable and under what conditions |
| S3 | Balance class sizes across sections of the same elective | Medium | |
| S4 | Minimize students receiving none of their ranked choices | High | Distinct from S1 — this is the floor, S1 is the ceiling |
| S5 | 8th graders should more likely receive their top ranked electives. | Medium | Important to still give 6th graders at least 1 of their top ranked electives, since they will inherently less blocks to work with. |

---

## Open Questions for Principal

| ID | Edge Case | Disposition | Assumed Default (if ASSUMED) |
|----|-----------|-------------|-------------------------------|
| Q1 | Separation / grouping requests (e.g., keep two students apart, or together) | ASK PRINCIPAL | — |
| Q2 | Prerequisites (must complete elective X before Y) | ASK PRINCIPAL | — |
| Q3 | Semester-long vs. year-long electives | ASK PRINCIPAL | — |
| Q4 | Late enrollment after scheduling is finalized | ASSUMED | Late enrollees are placed into any elective with open seats, ranking/preference not guaranteed |
| Q5 | Cross-school teachers (teach at multiple schools, limited availability) | ASK PRINCIPAL | — |
| Q6 | Tie-break / priority policy (e.g., who wins the last band seat) | ASSUMED | Tie broken by [seniority in grade / random / first-come] — needs confirmation |
| Q7 | How do we choose which students should get into electives liek service? | ASK PRINCIPAL | - |
| Q8 | What classes are combinable and how many classes should be combined? | ASK PRINCIPAL | - |
| Q9 | Are there any other classes that are like skill builders? In other words, are there required classes for students that fall under one or more categories? | ASK PRINCIPAL | - |
| Q10 | Can students switch electives and if so what is the time frame to switch? | ASSUMED | Students can switch within the first 2 weeks - needs confirmation |

---