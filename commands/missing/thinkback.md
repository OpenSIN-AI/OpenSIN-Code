---
description: Reflect on past session work, lessons learned, and patterns discovered
argument-hint: [--last N] [--pattern PATTERN]
allowed-tools: [Read, Grep]
---

# /thinkback

Reflect on past session work.

## Usage

```bash
/thinkback
/thinkback --last 5
/thinkback --pattern "bug"
```

## What this does

- Analyzes session history for patterns
- Identifies recurring issues and solutions
- Summarizes lessons learned
- Suggests improvements for future sessions

## Output Format

```
🧠 Session Reflection
=====================
📊 Sessions analyzed: 15
🔍 Recurring patterns:
  - API timeout issues (3 occurrences)
  - Missing error handling (2 occurrences)
💡 Lessons learned:
  - Always add retry logic for external APIs
  - Use structured error types
📈 Improvement suggestions:
  - Add automated retry middleware
  - Create error type library
```
