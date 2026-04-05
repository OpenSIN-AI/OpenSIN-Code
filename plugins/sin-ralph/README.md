# sin-ralph Plugin

Stop-Hook-basierter iterativer Self-Referential Loop für OpenSIN-Code.

## Quick Start

```bash
/ralph-loop "Build a REST API for todos. Requirements: CRUD, validation, tests. Output <promise>COMPLETE</promise> when done." --completion-promise "COMPLETE" --max-iterations 50
```

## Commands

- `/ralph-loop <prompt>` — Start Ralph Loop
- `/cancel-ralph` — Cancel active loop
- `/ralph-help` — Show help

## Portiert aus
sin-claude/claude-code-main/plugins/ralph-wiggum/
