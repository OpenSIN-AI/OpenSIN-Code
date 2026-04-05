---
description: Comprehensive PR review with 6 specialized agents
argument-hint: [focus areas: comments, tests, errors, types, quality, simplify]
allowed-tools: [Read, Grep, Glob, Bash, Agent]
---

# /review-pr

Comprehensive PR review using 6 specialized agents.

## Usage

```bash
/review-pr
/review-pr tests,errors
/review-pr all
```

## Available Review Agents

1. **comment-analyzer** — Comment accuracy and maintainability
2. **pr-test-analyzer** — Test coverage quality (rates gaps 1-10)
3. **silent-failure-hunter** — Error handling and silent failures
4. **type-design-analyzer** — Type design quality (4 dimensions, 1-10 each)
5. **code-reviewer** — General code review (scores 0-100)
6. **code-simplifier** — Code simplification suggestions
