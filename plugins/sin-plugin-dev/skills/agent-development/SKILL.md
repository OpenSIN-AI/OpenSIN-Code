---
description: Creating autonomous agents with AI-assisted generation for OpenSIN-Code plugins
---

# Agent Development Skill

This skill should be used when creating autonomous agents, defining agent behavior, or implementing AI-assisted agent generation.

## Agent File Format

`agents/my-agent.md`:

```markdown
---
name: my-agent
description: What this agent does
model: openai/gpt-5.4
color: blue
tools: [Read, Write, Edit, Bash]
---

# My Agent

System prompt and instructions.
```

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Agent identifier |
| description | Yes | Used for triggering |
| model | No | Preferred model |
| color | No | UI color |
| tools | No | Available tools |

## System Prompt Design

1. Define the agent's role clearly
2. Specify focus areas
3. Define output format
4. Set rules and constraints
5. Provide examples when helpful
