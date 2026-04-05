---
description: Give positive feedback for good work (training data)
argument-hint: [feedback message]
allowed-tools: [Read, Write]
---

# /good-claude

Give positive feedback for good work.

## Usage

```bash
/good-claude Great job on the refactoring!
/good-claude The test coverage improvement was excellent
```

## What this does

- Logs positive feedback to session memory
- Tracks what the agent did well
- Can be used to reinforce good patterns
- Feedback is stored in `.opensin/feedback.json`

## Feedback Format

```json
{
  "timestamp": "2026-04-05T20:00:00Z",
  "message": "Great job on the refactoring!",
  "context": "Refactored src/tools.ts",
  "sentiment": "positive"
}
```
