---
description: Rewind to an earlier point in the session
argument-hint: [--step N] [--timestamp TIME] [--list]
allowed-tools: [Read, Edit, Bash]
---

# /rewind

Rewind to an earlier point in the session.

## Usage

```bash
/rewind --list
/rewind --step 5
/rewind --timestamp "2026-04-05T19:00:00Z"
```

## What this does

- Lists session checkpoints
- Restores file state to checkpoint
- Restores conversation context
- Undoes changes made after checkpoint

## Checkpoint Format

Checkpoints are created automatically every 10 tool uses or manually with `/rewind --checkpoint`.
