---
description: Teleport session between repos/directories with stash/resume
argument-hint: <target-directory> [--stash] [--resume]
allowed-tools: [Read, Write, Bash]
---

# /teleport

Teleport your session to another repo/directory.

## Usage

```bash
/teleport ../other-project
/teleport ~/dev/my-project --stash
/teleport ~/dev/my-project --resume
```

## What this does

- Saves current session context (todos, notes, state)
- Stashes uncommitted changes (optional)
- Switches to target directory
- Loads target project context
- Resumes with previous context (if --resume)

## Stash Format

`.opensin/teleport-stash.json`:
```json
{
  "sourceRepo": "OpenSIN-Code",
  "timestamp": "2026-04-05T20:00:00Z",
  "todos": [...],
  "notes": "...",
  "context": "..."
}
```
