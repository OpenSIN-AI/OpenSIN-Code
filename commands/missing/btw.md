---
description: Add context information without interrupting the main flow
argument-hint: <context note>
allowed-tools: [Read, Write]
---

# /btw

Add context information without interrupting the main flow.

## Usage

```bash
/btw The API returns timestamps in ISO 8601 format
/btw We use snake_case for database columns
/btw The auth middleware is in src/middleware/auth.ts
```

## What this does

- Adds context notes to session memory
- Notes are available for future reference
- Doesn't interrupt the current task
- Can be queried later with `/btw --list`

## Management

```bash
/btw --list        # List all context notes
/btw --clear       # Clear all notes
/btw --search TERM # Search notes
```
