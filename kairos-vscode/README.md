# SIN Code VS Code Extension

> **Agentic AI Coding Assistant for OpenSIN** — Powered by Kilo Code & OpenCode concepts

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-green)
![VS Code](https://img.shields.io/badge/VS%20Code-%3E%3D1.85.0-blue)

---

## Overview

SIN Code is a VS Code extension that transforms your editor into an **agentic AI coding workspace**. It bridges the `opencode` CLI with a rich sidebar chat, inline completions, code actions, a swarm coordinator for multi-agent dispatch, a gamified buddy system, automatic memory consolidation, and a built-in Agent Marketplace.

Built in **3 phases**, SIN Code covers the full spectrum from basic AI chat to autonomous multi-agent orchestration.

---

## Table of Contents

- [Features](#features)
  - [Phase 1: Core AI Assistant](#phase-1-core-ai-assistant)
  - [Phase 2: Intelligence Layer](#phase-2-intelligence-layer)
  - [Phase 3: Advanced Capabilities](#phase-3-advanced-capabilities)
- [Installation](#installation)
- [Commands Reference](#commands-reference)
- [Keybindings](#keybindings)
- [Architecture](#architecture)
- [Agent Marketplace](#agent-marketplace)
- [Configuration](#configuration)
- [Development](#development)
- [License](#license)

---

## Features

### Phase 1: Core AI Assistant

#### Agent Mode Selector

Switch between 5 specialized agent modes, each with its own system prompt and behavior:

| Mode | Icon | Description |
|------|------|-------------|
| **Architect** | 🏗️ | Plan system architecture, design patterns, and project roadmaps. Does NOT write implementation code unless explicitly asked. |
| **Code** | 💻 | Write clean, production-ready code. Follows best practices and project conventions. Default mode. |
| **Debug** | 🐛 | Root cause analysis. Reads logs, traces execution, and suggests precise fixes with evidence. |
| **Ask** | ❓ | Explain code, answer questions, provide documentation. Does NOT suggest changes unless asked. |
| **Proactive** | ⚡ | Always-on background analysis. Automatically analyzes files on save and suggests improvements, bug fixes, and security issues. |

#### Sidebar Chat

Full-featured chat panel in the VS Code sidebar with:
- **Streaming responses** — tokens appear in real-time via JSON event stream parsing
- **Mode badge** — shows current active mode in the header
- **Cancel button** — stop any running generation (SIGTERM to CLI process)
- **Context file tracking** — add files to conversation context
- **Swarm dispatch button** — quick access to multi-agent tasks
- **Marketplace button** — open the Agent Marketplace
- **Status indicator** — shows "thinking...", "Done.", or error messages

#### Memory Consolidation

Automatic context loading from project memory files. SIN Code scans for and consolidates:
- `AGENTS.md` — Agent instructions and project conventions
- `SIN-MEMORY.md` — Persistent session memory
- `SIN.md` — Compatibility with OpenCode projects
- `.sincode-memory.md` — Hidden memory file

Memory files are **watched for changes** and context is automatically refreshed. New memory entries can be appended programmatically with timestamps.

#### LSP Integration

Semantic context extraction via VS Code's diagnostic API and `simone-mcp`:
- **Real-time diagnostics** — errors, warnings, and info from the current file
- **Symbol extraction** — function names, classes, variables via `simone-mcp`
- **Cursor-aware context** — word at cursor position included in prompts
- **Diagnostic summaries** — up to 5 most relevant diagnostics included in context

#### Model Selector

Choose from all models configured in your global `~/.config/opencode/` configuration. Models are auto-discovered via `opencode config list-models --format json`. Default: `opencode/qwen3.6-plus-free`.

#### OpenCode CLI Bridge

The `SinCodeBridge` class is the mandatory communication layer to the `opencode` CLI:
- Spawns `opencode run <prompt> --format json` with optional `--mode=<mode>` flag
- Parses streaming JSON line-by-line, extracting `type: "text"` events
- Supports process cancellation via SIGTERM
- Auto-discovers available models with fallback defaults
- Routes stderr to the chat UI for debugging

---

### Phase 2: Intelligence Layer

#### Swarm Coordinator

Dispatch parallel tasks to specialized oh-my-opencode agents via the `opencode` CLI:

| Agent | Icon | Purpose |
|-------|------|---------|
| **Explore** | 🔍 | Codebase patterns, file structures, ast-grep analysis |
| **Librarian** | 📚 | Documentation research, GitHub examples, best-practice lookup |
| **Oracle** | 🔮 | Architecture guidance, debugging, complex logic solving |
| **Artistry** | 🎨 | Creative problem solving, non-conventional approaches |

Features:
- **Parallel dispatch** — `dispatchSwarm()` runs multiple agents simultaneously via `Promise.allSettled`
- **Task tracking** — each task gets a unique ID with status tracking (pending/running/completed/failed)
- **Progress notifications** — VS Code progress API shows dispatch status
- **Buddy XP rewards** — successful swarm tasks earn +20 XP

#### BUDDY Gamification System

A pet companion in your status bar that reacts to your coding activity:

| Event | XP Gain | Emoji |
|-------|---------|-------|
| Commit pushed | +25 XP | 🚀 |
| Swarm task completed | +20 XP | ✅ |
| Response generated | +10 XP | 😊 |
| Tests passed | +15 XP | ✅ |
| File added to context | +5 XP | 📎 |
| Background analysis | +5 XP | 🔍 |
| Error/failure | 0 XP | 😢/💥 |

**Leveling:** Each level requires `level × 100` XP. Level-up triggers a notification with 🎉.

**Mood system:** Buddy shows emotional reactions (happy/sad/excited/neutral/sleeping) with automatic decay back to neutral after 30 seconds.

**Status bar display:** `🤖 Buddy Lv.1` — click for detailed status tooltip.

#### File Context Management

Add any open file to the conversation context via:
- Command palette: `SIN Code: Add File to Context`
- Editor context menu: right-click → `Add File to SIN Code Context`

Context files are included in every prompt sent to the AI.

#### Auto Test Runner

When test files (`.test.` or `.spec.`) are saved, SIN Code automatically:
1. Opens a terminal named "SIN Code Test Runner"
2. Runs `npm test` in the test file's directory
3. Shows the terminal output

#### Git Commit Detection

Watches `.git/HEAD` for changes and triggers Buddy XP rewards on every commit.

---

### Phase 3: Advanced Capabilities

#### Inline Chat / Completions

AI-powered inline code completions triggered by:
- **Keyboard shortcut:** `Cmd+Shift+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)
- **Automatic:** registered as `InlineCompletionItemProvider` for all file patterns (`**`)

The inline provider:
- Sends the code prefix (from start of file to cursor) to the AI
- Requests max 5 lines of completion
- Displays the suggestion as a ghost text inline completion
- Falls back gracefully on errors (returns null)

#### AI Code Actions

Context-aware code actions available via the lightbulb (💡) menu and command palette:

| Action | Kind | Trigger | Mode |
|--------|------|---------|------|
| 🔮 **SIN Code: Fix error** | QuickFix | On diagnostic errors | Debug |
| 🤖 **SIN Code: Refactor selection** | Refactor | Always available | Code |
| 📖 **SIN Code: Explain code** | Refactor | Always available | Ask |
| ✅ **SIN Code: Generate tests** | Refactor | Always available | Code |

**Fix Error:** Reads the diagnostic message + selected code, returns only the fixed code, applies it as a workspace edit.

**Refactor Selection:** Sends selected code for refactoring to be cleaner, more maintainable, and follow best practices.

**Explain Code:** Opens a side panel with a plain-English explanation of the selected code.

**Generate Tests:** Generates unit tests for the selected code and creates a new `.test.` file alongside the original.

#### Agent Marketplace

A built-in marketplace panel (`Cmd+Shift+M` / `Ctrl+Shift+M`) for discovering and installing SIN agents:

| Agent | Category | Description |
|-------|----------|-------------|
| **SIN-Explorer** | Analysis | Codebase analysis, ast-grep patterns, file structure mapping |
| **SIN-Librarian** | Research | Documentation research, GitHub examples, best-practice lookup |
| **SIN-Oracle** | Intelligence | Architecture guidance, debugging, complex logic solving |
| **SIN-Artistry** | Creative | Creative problem solving, non-conventional approaches |
| **SIN-Frontend** | Development | UI/UX design, React, CSS, responsive layouts |
| **SIN-Vision-Colab** | Vision | Screen recording + AI-vision analysis via Gemini |

Features:
- **Category filtering** — filter agents by Analysis, Research, Intelligence, Creative, Development, Vision
- **Install/Remove** — one-click install and remove with status tracking
- **Installed count badge** — shows `X / Y installed` in header
- **Version display** — each agent shows its version number
- **Responsive grid layout** — adapts to panel width
- **VS Code theme colors** — uses native CSS variables for seamless integration

---

## Installation

### From .vsix Package (Recommended)

```bash
# Download or build the .vsix file
cd kairos-vscode
npm install
npm run compile
npx vsce package --no-dependencies

# Install in VS Code
code --install-extension sincode-vscode-0.1.0.vsix
```

### Development Mode

```bash
git clone git@github.com:OpenSIN-AI/OpenSIN-Code.git
cd OpenSIN-Code/kairos-vscode
npm install

# Option 1: Open in VS Code and press F5
code .

# Option 2: Launch extension host directly
code --extensionDevelopmentPath=$PWD
```

---

## Commands Reference

| Command ID | Title | Description |
|------------|-------|-------------|
| `sincode.start` | SIN Code: Start | Open the SIN Code sidebar view |
| `sincode.selectMode` | SIN Code: Select Mode | Switch between Architect/Code/Debug/Ask/Proactive modes |
| `sincode.selectModel` | SIN Code: Select Model | Choose the underlying LLM model |
| `sincode.addFileToContext` | SIN Code: Add File to Context | Add the current file to the AI conversation context |
| `sincode.inlineChat.trigger` | SIN Code: Trigger Inline Suggestion | Trigger AI inline code completion at cursor |
| `sincode.openMarketplace` | SIN Code: Open SIN Agent Marketplace | Open the Agent Marketplace panel |
| `sincode.swarmDispatch` | SIN Code: Dispatch Agent | Dispatch a task to a specialized swarm agent |
| `sincode.buddyInfo` | SIN Code: Buddy Info | Show current BUDDY status (mood, level, XP) |
| `sincode.fixError` | SIN Code: Fix Error | Fix the diagnostic error at cursor with AI |
| `sincode.refactorSelection` | SIN Code: Refactor Selection | Refactor selected code with AI |
| `sincode.explainCode` | SIN Code: Explain Code | Explain selected code in a side panel |
| `sincode.generateTests` | SIN Code: Generate Tests | Generate unit tests for selected code |

---

## Keybindings

| Shortcut (Mac) | Shortcut (Win/Linux) | Command | Context |
|----------------|---------------------|---------|---------|
| `Cmd+Shift+I` | `Ctrl+Shift+I` | Trigger Inline Suggestion | Editor text focus |
| `Cmd+Shift+M` | `Ctrl+Shift+M` | Open Agent Marketplace | Always |

---

## Architecture

```
kairos-vscode/
├── src/
│   ├── extension.ts            # Main entry point, WebviewView provider, command registration
│   ├── cliBridge.ts            # RPC bridge to `opencode` CLI (spawn, stream JSON, cancel)
│   ├── modes.ts                # Agent mode definitions (Architect/Code/Debug/Ask/Proactive)
│   ├── lspProvider.ts          # LSP diagnostics, symbol extraction, semantic context
│   ├── swarmCoordinator.ts     # Multi-agent dispatch manager (Explore/Librarian/Oracle/Artistry)
│   ├── buddyGamification.ts    # BUDDY pet status bar (XP, levels, moods, events)
│   ├── memoryConsolidation.ts  # AGENTS.md / SIN-MEMORY.md watcher and consolidator
│   ├── inlineChat.ts           # InlineCompletionItemProvider for ghost-text completions
│   ├── codeActions.ts          # CodeActionProvider (Fix/Refactor/Explain/Generate Tests)
│   └── agentMarketplace.ts     # Agent Marketplace webview panel (install/remove agents)
├── media/
│   └── icon.png                # Activity bar icon
├── package.json                # Extension manifest (commands, keybindings, views)
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

### Data Flow

```
User Input (Chat / Inline / Code Action)
        │
        ▼
┌───────────────────────────────────────────┐
│           SINCodeViewProvider             │
│  ┌─────────────┐  ┌────────────────────┐  │
│  │ Mode System │  │ Memory Consolidator│  │
│  └──────┬──────┘  └────────┬───────────┘  │
│         │                  │              │
│  ┌──────▼──────────────────▼───────────┐  │
│  │         buildFullPrompt()           │  │
│  │  [Mode] + [Context Files] + [LSP]  │  │
│  │  + [Memory] + [User Input]          │  │
│  └──────────────────┬──────────────────┘  │
│                     │                     │
│              ┌──────▼──────┐              │
│              │ SinCodeBridge│              │
│              │  opencode run│              │
│              └──────┬──────┘              │
│                     │                     │
│              ┌──────▼──────┐              │
│              │  Streaming   │              │
│              │  Response    │              │
│              └──────┬──────┘              │
│                     │                     │
│              ┌──────▼──────┐              │
│              │   BUDDY XP   │              │
│              │   Reward     │              │
│              └─────────────┘              │
└───────────────────────────────────────────┘
```

### Extension Points

| Extension Point | Implementation |
|----------------|----------------|
| `WebviewViewProvider` | `sincode.chatView` — main sidebar chat |
| `InlineCompletionItemProvider` | All file patterns (`**`) — ghost text completions |
| `CodeActionProvider` | All file patterns (`**/*`) — QuickFix + Refactor actions |
| `StatusBarItem` (Left) | Mode selector + Model selector |
| `StatusBarItem` (Right) | BUDDY gamification status |
| `FileSystemWatcher` | `.git/HEAD` for commit detection |
| `FileSystemWatcher` | Memory files for context refresh |
| `onDidSaveTextDocument` | Proactive mode analysis + auto test runner |

---

## Agent Marketplace

The SIN Agent Marketplace is a built-in panel that lets you discover, install, and manage specialized AI agents directly from VS Code.

### How It Works

1. Open the marketplace: `Cmd+Shift+M` or command palette → `SIN Code: Open SIN Agent Marketplace`
2. Browse agents by category (Analysis, Research, Intelligence, Creative, Development, Vision)
3. Click **Install** to add an agent to your workspace
4. Installed agents integrate with the Swarm Coordinator for task dispatch

### Agent Categories

| Category | Agents | Purpose |
|----------|--------|---------|
| **Analysis** | SIN-Explorer | Codebase understanding and pattern detection |
| **Research** | SIN-Librarian | External knowledge and documentation lookup |
| **Intelligence** | SIN-Oracle | Complex reasoning and architecture guidance |
| **Creative** | SIN-Artistry | Non-conventional problem solving |
| **Development** | SIN-Frontend | UI/UX and frontend-specific assistance |
| **Vision** | SIN-Vision-Colab | Screen recording and visual analysis |

---

## Configuration

SIN Code uses the global OpenCode configuration at `~/.config/opencode/`. No extension-specific settings are required.

### Model Configuration

Available models are automatically fetched from your `opencode` config via `opencode config list-models --format json`. The default model is `opencode/qwen3.6-plus-free`.

### Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| VS Code | >= 1.85.0 | Required for WebviewView API |
| `opencode` CLI | Latest | Must be in PATH for AI calls |
| `simone-mcp` | Optional | For LSP symbol extraction |
| Node.js | >= 18.x | For development/build |

---

## Development

### Build

```bash
npm install
npm run compile    # tsc -p ./
npm run watch      # tsc -watch -p ./
npm run package    # vsce package --no-dependencies
```

### Project Structure

| File | Purpose |
|------|---------|
| `extension.ts` | Main entry, WebviewView provider, all command registrations, event listeners |
| `cliBridge.ts` | Spawns `opencode run --format json`, parses streaming JSON, handles cancellation |
| `modes.ts` | Defines 5 agent modes with system prompts |
| `lspProvider.ts` | Extracts diagnostics, symbols, and cursor context |
| `swarmCoordinator.ts` | Dispatches tasks to oh-my-opencode agents via CLI |
| `buddyGamification.ts` | Status bar pet with XP, levels, moods, and event reactions |
| `memoryConsolidation.ts` | Watches and consolidates AGENTS.md, SIN-MEMORY.md, SIN.md |
| `inlineChat.ts` | InlineCompletionItemProvider for ghost-text completions |
| `codeActions.ts` | CodeActionProvider with Fix/Refactor/Explain/Generate Tests |
| `agentMarketplace.ts` | Webview panel for browsing and installing agents |

---

## License

Copyright 2024-2026 SIN-Solver Team. All rights reserved.

This is a proprietary extension, part of the SIN Code CLI product line.
See the LICENSE file in the repository for full license terms.
