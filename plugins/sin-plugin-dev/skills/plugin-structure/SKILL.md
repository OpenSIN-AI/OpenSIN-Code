---
description: Plugin organization and manifest configuration for OpenSIN-Code plugins
---

# Plugin Structure Skill

This skill should be used when starting a new plugin, organizing components, or configuring the plugin manifest.

## Standard Plugin Layout

```
plugins/my-plugin/
├── plugin.json          # Manifest (required)
├── README.md            # Documentation
├── index.ts             # Entry point
├── commands/            # Slash commands (*.md)
├── agents/              # Autonomous agents (*.md)
├── skills/              # Skills (SKILL.md)
├── hooks/               # Hook scripts (*.ts)
└── lib/                 # Shared code
```

## plugin.json Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Author",
  "license": "MIT",
  "type": "plugin",
  "commands": ["commands/*.md"],
  "agents": ["agents/*.md"],
  "skills": ["skills/*/SKILL.md"],
  "hooks": { "PreToolUse": "hooks/pretooluse.ts" },
  "mcpServers": {},
  "dependencies": {},
  "config": {}
}
```

## Plugin Patterns

- **Minimal**: Just plugin.json + one command
- **Standard**: Commands + hooks + README
- **Advanced**: Commands + agents + skills + hooks + MCP
