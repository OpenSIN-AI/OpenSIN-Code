---
description: List all active hookify rules
argument-hint:
allowed-tools: [Read, Bash]
---

# /hookify:list

List all active hookify rules.

## Usage

```
/hookify:list
```

## What this does

Reads all `.opensin/hookify.*.local.md` files and displays:
- Rule name
- Event type (bash, file, stop, prompt)
- Action (warn, block)
- Enabled/disabled status
- Pattern/conditions summary
