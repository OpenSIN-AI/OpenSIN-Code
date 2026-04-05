---
description: Creating slash commands with frontmatter and arguments for OpenSIN-Code plugins
---

# Command Development Skill

This skill should be used when creating slash commands, defining command arguments, or organizing plugin commands.

## Command File Format

`commands/my-command.md`:

```markdown
---
description: What this command does
argument-hint: [optional arguments]
allowed-tools: [Read, Write, Edit, Bash]
---

# /my-command

Command documentation and instructions.
```

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| description | Yes | What the command does |
| argument-hint | No | Hint for arguments |
| allowed-tools | No | Tools the command can use |

## Command Organization

- Use namespacing: `plugin:command` or `plugin-command`
- Group related commands: `hookify`, `hookify:list`, `hookify:configure`
- Keep descriptions concise and action-oriented
