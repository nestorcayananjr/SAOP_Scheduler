This is an adversarial correctness review. Assume this diff contains a bug
that will surface on real school data; your job is to find it.

Get the diff: `git diff main...HEAD`. For each constraint or rule-adjacent
change, read the referenced H#/S# rule in docs/rules.md VERBATIM, then hunt
for divergence between the rule as written and the code as implemented.
Construct concrete inputs that would expose each suspected divergence.

Report at most 5 findings, ranked: BLOCKING / SHOULD-FIX / NIT.
Each finding: file:line, the rule ID violated, and the failing input or trace.
No praise, no summary of what the code does well.