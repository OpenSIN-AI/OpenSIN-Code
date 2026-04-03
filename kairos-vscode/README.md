# OpenSIN VS Code Extension (OpenSIN)

> Agentic AI Coding Assistant for OpenSIN — Powered by Kilo Code & Claude Code concepts

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)

## Features

### 🔀 Mode Selector
Switch between specialized agent modes inspired by Kilo Code:

| Mode | Description | Icon |
|------|-------------|------|
| **Architect** | Plan system architecture and create project roadmaps | 🏗️ |
| **Code** | Implementation, refactoring, and production-ready code | 💻 |
| **Debug** | Trace issues, read error logs, and suggest fixes | 🐛 |
| **Ask** | Query and explain existing codebases without modifying | ❓ |
| **Proactive** | Proactive always-on mode — background analysis on file saves | ⚡ |

### 🐝 Swarm Coordinator
Dispatch parallel tasks to specialized agents:
- **Explore** — Codebase patterns, file structures, ast-grep
- **Librarian** — Remote repos, official docs, GitHub examples
- **Oracle** — Architecture, debugging, complex logic
- **Artistry** — Non-conventional problems, different approaches

### 🐛 BUDDY Gamification
A pet companion in your status bar that:
- Levels up on commits (+25 XP)
- Celebrates test passes (+15 XP)
- Reacts to errors and failures with mood changes
- Shows XP, level, and last action on hover

### 🧠 Memory Consolidation
Automatic context loading from:
- `AGENTS.md`
- `SIN-MEMORY.md`
- `CLAUDE.md` (compatibility)
- `.sincode-memory.md`

### 🔌 LSP Integration
Semantic context and diagnostics via `simone-mcp`:
- Real-time diagnostic info (errors, warnings)
- Symbol extraction from current file
- Cursor-aware semantic context

## Installation

### From .vsix Package
```bash
# Build first
cd sincode-vscode
npm install
npm run compile
npx vsce package

# Install
code --install-extension sincode-vscode-0.1.0.vsix
```

### Development Mode
```bash
git clone git@github.com:OpenSIN-AI/OpenSIN-Code.git
cd OpenSIN-Code/sincode-vscode
npm install

# Open in VS Code and press F5, or:
code --extensionDevelopmentPath=$PWD
```

## Commands

| Command | Description |
|---------|-------------|
| `OpenSIN: Start` | Open the OpenSIN sidebar |
| `OpenSIN: Select Mode` | Switch between agent modes |
| `OpenSIN: Select Model` | Choose the underlying LLM |
| `OpenSIN: Dispatch Agent` | Open Swarm Coordinator panel |
| `OpenSIN: Add File to Context` | Add current file to conversation context |

## Architecture

```
kairos-vscode/
├── src/
│   ├── extension.ts          # Main entry, Webview orchestrator
│   ├── cliBridge.ts          # RPC bridge to opencode CLI
│   ├── modes.ts              # Agent mode definitions
│   ├── lspProvider.ts        # LSP diagnostics & semantic context
│   ├── swarmCoordinator.ts   # Sub-agent dispatch manager
│   ├── buddyGamification.ts  # BUDDY pet status bar
│   └── memoryConsolidation.ts # AGENTS.md/SIN-MEMORY.md watcher
├── media/
│   └── icon.svg              # Activity bar icon
├── package.json              # Extension manifest
└── tsconfig.json             # TypeScript config
```

## Requirements

- VS Code 1.85.0+
- `opencode` CLI installed and available in PATH
- (Optional) `simone-mcp` for LSP diagnostics

## Configuration

The extension uses the global OpenCode configuration at `~/.config/opencode/`. Available models are fetched automatically from your provider config.

## License

Apache 2.0
