---
description: Automatically find bugs in the current project
argument-hint: [--scope FILES] [--pattern PATTERN] [--deep]
allowed-tools: [Read, Grep, Glob, Bash]
---

# /bughunter

Automatically find bugs in the current project.

## Usage

```bash
/bughunter
/bughunter --scope src/
/bughunter --pattern "TODO|FIXME|HACK"
/bughunter --deep
```

## What this does

- Static analysis for common bug patterns
- Finds TODO/FIXME/HACK comments
- Detects potential null references
- Finds unused variables/imports
- Identifies security issues
- Checks for error handling gaps

## Bug Categories

1. **Logic Bugs** — Off-by-one, wrong operators, missing conditions
2. **Null Safety** — Unchecked null/undefined access
3. **Resource Leaks** — Unclosed files, connections, timers
4. **Security** — Hardcoded secrets, injection risks, XSS
5. **Performance** — N+1 queries, memory leaks, unnecessary re-renders
6. **Code Smells** — Long functions, deep nesting, duplicated code
