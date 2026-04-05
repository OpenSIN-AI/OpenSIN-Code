---
description: Generate automatic insights about the codebase
argument-hint: [--scope DIR] [--type PATTERN|COMPLEXITY|DEPENDENCIES|ARCHITECTURE]
allowed-tools: [Read, Grep, Glob, Bash]
---

# /insights

Generate automatic insights about the codebase.

## Usage

```bash
/insights
/insights --type pattern
/insights --type complexity
/insights --type dependencies
/insights --type architecture
```

## Insight Types

| Type | What it finds |
|------|---------------|
| pattern | Repeated code patterns, conventions |
| complexity | Complex functions, deep nesting |
| dependencies | Dependency graph, circular deps |
| architecture | Layer boundaries, coupling |

## Output Format

```
🔍 Codebase Insights
====================
📊 Files analyzed: 150
📈 Average complexity: 7.2/10
🔗 Circular dependencies: 2
📋 Patterns found:
  - Repository pattern (12 files)
  - Factory pattern (5 files)
⚠️ High complexity files:
  - src/main.tsx (complexity: 45)
  - src/tools.ts (complexity: 38)
```
