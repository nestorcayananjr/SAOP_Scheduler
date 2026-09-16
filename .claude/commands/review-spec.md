Identify the ticket for this branch (from the branch name, or ask me).
Fetch it: `gh issue view <number>`. Then get the diff: `git diff main...HEAD`.

For EACH acceptance criterion in the ticket, state: MET / PARTIAL / UNADDRESSED,
with file:line evidence. No other feedback in this pass — spec compliance only.
Flag anything in the diff that's outside the ticket's stated scope.