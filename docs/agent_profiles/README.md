# Multi-Agent Profiles System

Persistent agent personas with distinct tool access, behavior, and model configuration.
Solves the "never say things twice" problem — define once, use everywhere.

## Overview

Profiles are specialized personas (like Kilo Code's custom modes) that control:
- **System prompt** — What the agent knows about its role
- **Tool permissions** — Which tools are allowed/denied per profile
- **Model selection** — Pin specific models per profile
- **Behavior settings** — Temperature, max steps, color coding

## Quick Start

```bash
# List all available profiles
profile list

# Switch to a different profile
profile switch plan

# Show current profile
profile current

# Create a custom profile
profile create docs-writer \
  --prompt "You are a technical documentation specialist" \
  --description "Writes clear documentation" \
  --mode primary \
  --color "#14B8A6"
```

## Built-in Profiles

| Profile | Purpose | Tool Access | Color |
|---------|---------|-------------|-------|
| `code` | Full software engineer | All tools | #3B82F6 |
| `plan` | System design & planning | Read-only + plan files | #8B5CF6 |
| `debug` | Systematic troubleshooting | All tools | #EF4444 |
| `ask` | Q&A without modifications | Read-only | #10B981 |
| `orchestrator` | Task coordination | Read + ask for edits | #F59E0B |
| `reviewer` | Code review | Read + search | #6366F1 |
| `docs-writer` | Documentation | Markdown only | #14B8A6 |
| `test-engineer` | Test writing | Test files + bash | #F97316 |

## Profile Sources (Precedence)

Profiles are loaded from multiple sources, merged lowest to highest priority:

1. **Built-in** — Native profiles shipped with OpenSIN-Code
2. **Global** — `~/.opensin/profiles.json` or `~/.opensin/agents/*.md`
3. **Project** — `.opensin/profiles.json` or `.opensin/agents/*.md`
4. **Config** — `opensin.json` at project root
5. **Environment** — `OPENSIN_CONFIG_CONTENT` env var

When the same profile name exists at multiple levels, properties are merged
(not replaced), so you can override just a model or temperature.

## Creating Profiles

### Via CLI

```bash
profile create my-agent \
  --prompt "You are a Python specialist. Only edit Python files." \
  --description "Python expert" \
  --mode primary \
  --model openai/gpt-4o \
  --temperature 0.2 \
  --color "#FF5733"
```

### Via Markdown File (Kilo Code Compatible)

Create `.opensin/agents/my-agent.md`:

```markdown
---
description: Python specialist
mode: primary
model: openai/gpt-4o
temperature: 0.2
color: "#FF5733"
permission:
  edit:
    "*.py": "allow"
    "*": "deny"
  bash: deny
---

You are a Python specialist. Only edit Python files.
```

### Via JSON Config

In `opensin.json`:

```json
{
  "agent": {
    "my-agent": {
      "description": "Python specialist",
      "mode": "primary",
      "prompt": "You are a Python specialist...",
      "model": "openai/gpt-4o",
      "temperature": 0.2,
      "permission": {
        "edit": { "*.py": "allow", "*": "deny" },
        "bash": "deny"
      }
    }
  }
}
```

## Permission System

Permissions support three actions: `allow`, `deny`, `ask` (prompt user).
Glob patterns scope rules to specific files or commands.

```yaml
permission:
  edit:
    "*.md": "allow"
    "*.py": "allow"
    "*": "deny"
  bash:
    "git *": "allow"
    "npm *": "allow"
    "*": "ask"
  read: allow
  webfetch: allow
```

## Profile-Sync

When you create or delete a profile, it's automatically synced across all three directories:

```
.opensin/agents/my-agent.md    <- OpenSIN-Code CLI
.opencode/agents/my-agent.md   <- OpenCode CLI
.kilo/agents/my-agent.md       <- Kilo Code
```

Define once, available everywhere.

## API Reference

```typescript
import { createProfileManager, ProfileManager } from '@opensin/sdk';

const pm = createProfileManager('/path/to/project');
await pm.init();

// List profiles
const profiles = pm.listProfiles();

// Switch profile
pm.setActiveProfile('plan');

// Check permissions
const allowed = pm.isToolAllowed('plan', 'edit', 'src/main.py');

// Resolve full profile
const resolution = pm.resolveProfile();
console.log(resolution?.profile.prompt);
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `profile list` | Show all available profiles |
| `profile current` | Show active profile details |
| `profile switch <name>` | Switch to a profile |
| `profile show <name>` | View profile details |
| `profile create <name>` | Create new profile |
| `profile delete <name>` | Delete custom profile |
