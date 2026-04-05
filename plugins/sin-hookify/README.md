# sin-hookify Plugin

Markdown-basierte Hook-Regel-Engine für OpenSIN-Code.

## Overview

Erstelle Hooks durch einfache `.opensin/hookify.*.local.md` Files mit YAML-Frontmatter. Keine komplexen Config-Files nötig.

## Quick Start

```bash
/hookify Warn me when I use rm -rf commands
```

## Architecture

```
plugins/sin-hookify/
├── plugin.json              # Plugin Manifest
├── core/
│   ├── types.ts             # TypeScript Type Definitions
│   ├── config-loader.ts     # Rule Loader (parst .local.md Files)
│   └── rule-engine.ts       # Rule Engine (evaluiert Rules mit Regex-Cache)
├── hooks/
│   ├── pretooluse.ts        # PreToolUse Hook
│   ├── posttooluse.ts       # PostToolUse Hook
│   ├── stop.ts              # Stop Hook
│   └── userpromptsubmit.ts  # UserPromptSubmit Hook
├── commands/
│   ├── hookify.md           # Hauptcommand
│   ├── hookify-list.md      # List rules
│   ├── hookify-configure.md # Interactive config
│   └── hookify-help.md      # Help
└── examples/                # 4 Beispiel-Regeln
    ├── dangerous-rm.local.md
    ├── sensitive-files-warning.local.md
    ├── require-tests-stop.local.md
    └── console-log-warning.local.md
```

## Portiert aus
sin-claude/claude-code-main/plugins/hookify/ (Python → TypeScript)
