# SIN Code VS Code Extension

> Agentic AI Coding Assistant für das OpenSIN Ökosystem

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-green)

## Features

### Phase 1 — Core Extension
- 🤖 **SIN Code Sidebar** — Webview Chat Interface im Editor
- 🔌 **CLI Bridge** — Direkte Kommunikation via `opencode run --format json`
- 🔀 **Mode Selector** — Architect, Code, Debug, Ask, Proactive
- 📋 **Model Dropdown** — Auto-fetches aus Provider Config
- 📁 **Context Provider** — Datei-Auswahl für Kontext
- ⚡ **Proactive Mode** — Hintergrund-Analyse beim File-Save
- 🐝 **Swarm Coordinator** — Sub-Agents dispatchen

### Phase 2 — Intelligence Layer
- 🔮 **LSP Diagnostics** — Semantic Context via simone-mcp
- 🧠 **Memory Consolidation** — AGENTS.md / SIN-MEMORY.md
- 🐛 **BUDDY Gamification** — Status Bar Pet mit XP/Mood/Leveling

### Phase 3 — Advanced Features
- ✨ **Inline Chat** — Ghost Text Code Completion
- 💡 **Code Actions** — Fix Error, Refactor, Explain, Generate Tests
- 🤖 **Agent Marketplace** — Browse/Install/Remove Agents

## Installation
\`\`\`bash
code --install-extension sincode-vscode-0.1.0.vsix
\`\`\`

## Commands
| Command | Description |
|---------|-------------|
| `sincode.start` | Sidebar öffnen |
| `sincode.selectMode` | Mode wechseln |
| `sincode.selectModel` | Modell wählen |
| `sincode.addFileToContext` | Datei zum Kontext |
| `sincode.openMarketplace` | Agent Markt öffnen |
| `sincode.inlineChat.trigger` | Inline-Vorschlag |

## Keybindings
| Shortcut | Action |
|----------|--------|
| CMD+Shift+I | Inline Completion |
| CMD+Shift+M | Agent Marketplace |

## Architecture
| Datei | Zweck |
|-------|-------|
| `extension.ts` | Main Entry, Webview, Commands |
| `cliBridge.ts` | RPC zu opencode CLI |
| `modes.ts` | Agent Modes |
| `lspProvider.ts` | LSP Diagnostics |
| `swarmCoordinator.ts` | Sub-Agent Dispatch |
| `buddyGamification.ts` | XP/Mood/Leveling |
| `memoryConsolidation.ts` | Kontext-Files |
| `inlineChat.ts` | Ghost Text Completion |
| `codeActions.ts` | Quick Fixes |
| `agentMarketplace.ts` | Agent Panel |

## License
Apache 2.0
