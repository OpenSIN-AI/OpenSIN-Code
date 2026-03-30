---
description: "Deprecated compatibility wrapper. Routes BIOMETRICS planning requests to `/check-plan-done` in plan-only mode."
---

This command is a compatibility wrapper.

Canonical successor: `/check-plan-done`

Load the `check-plan-done` skill and follow it strictly.

Task context: `$ARGUMENTS`

Compatibility contract:

1. Force mode: `plan-only`.
2. Run the unified workflow from `check-plan-done`: check -> research -> draft plan -> critical review -> approval gate.
3. Stop after delivering the approved plan unless the user explicitly switches to execution.
4. Tell the user that `/check-plan-done` is now the canonical command.
