---
description: "Deprecated compatibility wrapper. Routes BIOMETRICS execution requests to `/check-plan-done` in plan-and-execute mode."
---

This command is a compatibility wrapper.

Canonical successor: `/check-plan-done`

Load the `check-plan-done` skill and follow it strictly.

Task context: `$ARGUMENTS`

Compatibility contract:

1. Force mode: `plan-and-execute`.
2. If no approved plan exists yet, create and review one first using the unified workflow.
3. Execute task by task with project-appropriate validation until all done criteria pass.
4. Do not rely on old BIOMETRICS-only files, external loops, or stack-specific assumptions unless the current project actually requires them.
5. Tell the user that `/check-plan-done` is now the canonical command.
