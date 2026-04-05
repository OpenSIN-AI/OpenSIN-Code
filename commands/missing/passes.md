---
description: Execute code in multiple passes (implement → refactor → test)
argument-hint: <task> [--passes N] [--strategy STRATEGY]
allowed-tools: [Read, Write, Edit, Bash]
---

# /passes

Execute code in multiple passes.

## Usage

```bash
/passes "Add user authentication" --passes 3
/passes "Refactor the API layer" --strategy "implement,refactor,test,docs"
```

## Strategies

| Strategy | Passes |
|----------|--------|
| default | implement → refactor → test |
| thorough | implement → refactor → test → docs → review |
| quick | implement → test |
| refactor | analyze → refactor → test |

## What this does

Each pass focuses on a specific aspect:
1. **Implement** — Get it working
2. **Refactor** — Make it clean
3. **Test** — Verify correctness
4. **Docs** — Add documentation
5. **Review** — Self-review and fix issues
