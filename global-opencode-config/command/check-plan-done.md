---
description: "Check whether a plan exists, build and review one if needed, then execute task by task until the work is actually done."
---

Load the `check-plan-done` skill and follow it strictly.

Task context: `$ARGUMENTS`

Operating contract:

1. Infer the mode:
   - `plan-only` for planning, strategy, architecture, or roadmap requests
   - `plan-and-execute` for build, fix, implement, ship, or finish requests
   - `resume-approved-plan` when a current approved plan already exists and still matches the request
2. Follow the unified workflow: check -> research -> draft plan -> critical review -> approval gate -> execution loop -> done verification.
3. Keep planning bounded: 2 parallel research tasks, 1 synthesis task, 1 review task, then integrate locally.
4. Do not depend on fixed plan paths, undefined orchestrators, fictional agents, or stack-specific commands unless the project actually uses them.
5. Validate each completed task with project-appropriate checks. Do not auto-commit as part of the core loop.
6. Stop only when all done criteria pass or you are genuinely blocked and can state the open issue clearly.
7. If execution would be destructive, irreversible, security-sensitive, or billing-sensitive, ask one targeted approval question at the approval gate.
