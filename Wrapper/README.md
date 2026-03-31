# 📦 Wrappers

## Overview
Custom CLI shims and wrappers that intercept `opencode` commands to inject OMOC swarm logic or redirect execution to custom Python orchestrators.

## Included Wrappers
- **`bin/opencode`**: Project-local shim.
- **`oc-swarm`**: Tmux-based multi-agent terminal orchestrator.
- **`opencode_entrypoint.py`**: Legacy FastAPI/Room-13 Python router.

## Best Practices
- Wrappers should cleanly fallback to the native `opencode` binary if the specialized environment is missing.
