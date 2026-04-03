# Changelog

All notable changes to the OpenSIN VS Code Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.1.0] — 2026-04-02

Initial release of OpenSIN — Agentic AI Coding Assistant for OpenSIN.

### Phase 1 — Core AI Chat & Agent Modes

#### Added
- **Agent Mode Selector** — Five specialized modes with unique system prompts:
  - 🏗️ **Architect** — System architecture planning and roadmap creation
  - 💻 **Code** — Production-ready code generation and refactoring
  - 🐛 **Debug** — Root cause analysis with evidence-based fixes
  - ❓ **Ask** — Read-only code explanation and documentation
  - ⚡ **Proactive** — Always-on background analysis on file saves
- **AI Chat Sidebar** — Full webview-based chat interface with:
  - Real-time streaming responses
  - Mode badge display
  - Cancel button for long-running generations
  - Integrated Swarm Coordinator and Marketplace buttons
- **OpenCode CLI Bridge** (`SinCodeBridge`) — Mandatory `opencode run` integration:
  - Streaming JSON response parsing
  - Process cancellation (SIGTERM)
  - Model discovery via `opencode config list-models`
  - Default model: `opencode/qwen3.6-plus-free`
- **LSP Integration** (`LspProvider`) — Semantic context enrichment:
  - Real-time diagnostic collection (errors, warnings, info)
  - Symbol extraction via `simone-mcp`
  - Cursor-aware context (word at position)
  - Automatic context injection into AI prompts
- **Memory Consolidation** (`MemoryConsolidation`) — Automatic context loading:
  - Scans for `AGENTS.md`, `SIN-MEMORY.md`, `CLAUDE.md`, `.sincode-memory.md`
  - File watcher for automatic context refresh on changes
  - Append memory entries with timestamps
- **Swarm Coordinator** (`SwarmCoordinator`) — Parallel sub-agent dispatch:
  - Four built-in agents: Explore, Librarian, Oracle, Artistry
  - Single task dispatch with progress notification
  - Parallel swarm execution (`dispatchSwarm`)
  - Task tracking and status management
- **BUDDY Gamification** (`BuddySystem`) — Pet companion in status bar:
  - XP system (commits: +25, tests: +15, responses: +10)
  - Level-up notifications with mood changes
  - Five mood states: happy, neutral, sad, excited, sleeping
  - Git commit detection via `.git/HEAD` watcher
  - Auto test runner for `.test.` / `.spec.` file saves
  - Mood decay back to neutral after 30s

### Phase 2 — Enhanced Context & Proactive Mode

#### Added
- **Proactive Mode Auto-Analysis** — Background analysis triggered on every file save
- **File Context Management** — Right-click "Add File to OpenSIN Context" in editor context menu
- **Model Selector** — Quick-pick UI for switching between configured LLM models
- **Status Bar Indicators** — Current mode and model always visible
- **Test Auto-Runner** — Automatically runs `npm test` when test files are saved

### Phase 3 — Inline Completions, Code Actions & Marketplace

#### Added
- **Inline Chat / Code Completions** (`InlineChatProvider`):
  - Ghost-text completions at cursor position
  - Prefix-aware code generation (max 5 lines)
  - Registered for all file patterns
- **AI Code Actions** (`SINCodeActionProvider`):
  - 🔮 **Fix Error** — QuickFix action on every diagnostic error
  - 🤖 **Refactor Selection** — Refactor selected code inline
  - 📖 **Explain Code** — Opens explanation in side panel webview
  - ✅ **Generate Tests** — Creates `.test.` file next to source
- **Agent Marketplace** (`MarketplacePanel`):
  - Six pre-configured agents: SIN-Explorer, SIN-Librarian, SIN-Oracle, SIN-Artistry, SIN-Frontend, SIN-Vision-Colab
  - Category filtering (Analysis, Research, Intelligence, Creative, Development, Vision)
  - Install/remove agents with one click
  - Card-based grid layout with VS Code theme colors
  - Installed count badge

### Keybindings

| Key | Command |
|-----|---------|
| `Cmd+Shift+I` / `Ctrl+Shift+I` | Trigger Inline Suggestion |
| `Cmd+Shift+M` / `Ctrl+Shift+M` | Open SIN Agent Marketplace |

### Commands

| Command | Description |
|---------|-------------|
| `sincode.start` | Open OpenSIN sidebar |
| `sincode.selectMode` | Switch agent mode |
| `sincode.selectModel` | Choose LLM model |
| `sincode.addFileToContext` | Add file to conversation context |
| `sincode.inlineChat.trigger` | Trigger inline completion |
| `sincode.openMarketplace` | Open Agent Marketplace |
| `sincode.swarmDispatch` | Dispatch sub-agent task |
| `sincode.buddyInfo` | Show BUDDY status |
| `sincode.fixError` | AI-fix error at cursor |
| `sincode.refactorSelection` | AI-refactor selection |
| `sincode.explainCode` | Explain selected code |
| `sincode.generateTests` | Generate tests for selection |

### Technical Details

- **VS Code Engine**: 1.85.0+
- **Language**: TypeScript
- **Build**: `tsc` compilation to `out/`
- **Package**: `vsce` (no external dependencies)
- **AI Runtime**: `opencode` CLI (mandatory)
- **Default Model**: `opencode/qwen3.6-plus-free`
