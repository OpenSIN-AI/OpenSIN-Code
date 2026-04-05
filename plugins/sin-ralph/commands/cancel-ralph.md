---
description: Cancel the active Ralph loop
argument-hint:
allowed-tools: [Read, Edit]
---

# /cancel-ralph

Cancel the active Ralph loop.

## Usage

```bash
/cancel-ralph
```

## What this does

Sets the `cancelled` flag in `.opensin/ralph-state.json` so the stop hook allows the session to exit.
