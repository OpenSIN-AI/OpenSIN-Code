---
description: Advanced hooks API and event-driven automation for OpenSIN-Code plugins
---

# Hook Development Skill

This skill should be used when creating event-driven automation, validating operations, or enforcing policies in plugins.

## Hook Events

| Event | When | Use Case |
|-------|------|----------|
| PreToolUse | Before any tool executes | Validate/before tool use |
| PostToolUse | After any tool executes | Log/audit after tool use |
| Stop | When agent wants to stop | Completion checks, Ralph Loop |
| UserPromptSubmit | When user submits prompt | Prompt filtering/analysis |
| SessionStart | When session starts | Initialize state |
| SessionEnd | When session ends | Cleanup, summary |
| PreCompact | Before context compaction | Preserve important context |
| Notification | When notification received | Notification handling |

## Hook Output Format

```json
{
  "systemMessage": "Optional message to show",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow | deny"
  },
  "decision": "allow | block",
  "reason": "Reason for decision"
}
```

## Best Practices

1. Always exit 0 — never crash the hook
2. Use try/catch around all logic
3. Return empty object `{}` to allow operation
4. Use `systemMessage` for warnings
5. Use `permissionDecision: "deny"` for blocks
6. Keep hooks fast — avoid heavy computation
7. Use regex caching for pattern matching
