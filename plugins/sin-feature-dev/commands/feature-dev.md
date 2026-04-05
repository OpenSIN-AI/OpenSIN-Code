---
description: 7-Phase Feature Development workflow with specialized agents
argument-hint: [feature description]
allowed-tools: [Read, Write, Edit, Bash, Agent]
---

# /feature-dev

Launches a guided feature development workflow with 7 distinct phases.

## Usage

```bash
/feature-dev Add user authentication with OAuth
/feature-dev
```

## The 7-Phase Workflow

### Phase 1: Discovery
Clarify the feature request, identify constraints and requirements.

### Phase 2: Codebase Exploration
Launch 2-3 `code-explorer` agents in parallel to understand relevant existing code.

### Phase 3: Clarifying Questions
Identify underspecified aspects and wait for answers before proceeding.

### Phase 4: Architecture Design
Launch 2-3 `code-architect` agents with different focuses (minimal, clean, pragmatic).

### Phase 5: Implementation
Wait for explicit approval, then implement following chosen architecture.

### Phase 6: Quality Review
Launch 3 `code-reviewer` agents in parallel (simplicity, bugs, conventions).

### Phase 7: Summary
Mark todos complete, summarize what was built and next steps.
