---
description: Start a Ralph loop — iterative self-referential development loop
argument-hint: <prompt> [--max-iterations N] [--completion-promise TEXT]
allowed-tools: [Read, Write, Edit, Bash]
---

# /ralph-loop

Start a Ralph loop in your current session.

## Usage

```bash
/ralph-loop "Build a REST API for todos" --max-iterations 50 --completion-promise "COMPLETE"
```

## Options

- `--max-iterations <n>` — Stop after N iterations (default: 50)
- `--completion-promise <text>` — Phrase that signals completion

## How it works

1. Writes the prompt to `.opensin/ralph-state.json`
2. Works on the task iteratively
3. Stop hook blocks exit attempts
4. Stop hook feeds the SAME prompt back
5. Repeats until completion promise is detected or max iterations reached
