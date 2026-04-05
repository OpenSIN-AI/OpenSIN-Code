---
description: Show help for hookify plugin
argument-hint:
allowed-tools: [Read]
---

# /hookify:help

Show detailed help for the hookify plugin.

## Event Types

| Event | Triggers on |
|-------|-------------|
| `bash` | Bash tool commands |
| `file` | Edit, Write, MultiEdit tools |
| `stop` | When agent wants to stop |
| `prompt` | User prompt submission |
| `all` | All events |

## Actions

| Action | Behavior |
|--------|----------|
| `warn` | Shows warning but allows operation |
| `block` | Prevents operation from executing |

## Operators

| Operator | Description |
|----------|-------------|
| `regex_match` | Pattern must match (regex) |
| `contains` | String must contain pattern |
| `equals` | Exact string match |
| `not_contains` | String must NOT contain pattern |
| `starts_with` | String starts with pattern |
| `ends_with` | String ends with pattern |

## File Fields

| Event | Available Fields |
|-------|-----------------|
| bash | `command` |
| file | `file_path`, `new_text`, `old_text`, `content` |
| prompt | `user_prompt` |
| stop | `reason`, `transcript` |
