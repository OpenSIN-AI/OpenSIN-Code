# Changelog

All notable changes to the SIN Code VS Code Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.1.0] — 2026-04-02

Initial release of SIN Code — Agentic AI Coding Assistant for OpenSIN.

### Phase 1 — Core AI Chat & Agent Modes

#### Added
- **Agent Mode Selector** — Five specialized modes with unique system prompts:
  - 🏗️ **Architect** — System architecture planning and roadmap creation
  - 💻 **Code** — Production-ready code generation and refactoring
  - 🐛 **Debug** — Root cause analysis with evidence-based fixes
  - ❓ **Ask** — Read-only code explanation and documentation
  - ⚡ **Proactive** — Always-on background analysis on file saves
- **AI Chat Sidebar** (`SINCodeViewProvider`) — Full webview-based chat interface with:
  - Real-time streaming responses via JSON event stream parsing
  - Mode badge display in header
  - Cancel button for long-running generations (SIGTERM)
  - Integrated Swarm Coordinator and Marketplace buttons
  - Status indicator ("thinking...", "Done.", error messages)
- **OpenCode CLI Bridge** (`SinCodeBridge`) — Mandatory `opencode run` integration:
  - Spawns `opencode run <prompt> --format json` with optional `--mode=<mode>` flag
  - Streaming JSON line-by-line parsing, extracting `type: "text"` events
  - Process cancellation via SIGTERM
  - Model discovery via `opencode config list-models --format json`
  - Fallback model list when config is unavailable
  - Default model: `opencode/qwen3.6-plus-free`
- **LSP Integration** (`LspProvider`) — Semantic context enrichment:
  - Real-time diagnostic collection (errors, warnings, info)
  - Symbol extraction via `simone-mcp`
  - Cursor-aware context (word at position)
  - Automatic context injection into AI prompts
- **Memory Consolidation** (`MemoryConsolidation`) — Automatic context loading:
  - Scans for `AGENTS.md`, `SIN-MEMORY.md`, `CLAUDE.md`, `.sincode-memory.md`
  - FileSystemWatcher for automatic context refresh on changes
  - Append memory entries with timestamps
- **Swarm Coordinator** (`SwarmCoordinator`) — Parallel sub-agent dispatch:
  - Four built-in agents: Explore, Librarian, Oracle, Artistry
  - Single task dispatch with VS Code progress notification
  - Parallel swarm execution via `dispatchSwarm()` (`Promise.allSettled`)
  - Task tracking with unique IDs and status management (pending/running/completed/failed)
- **BUDDY Gamification** (`BuddySystem`) — Pet companion in status bar:
  - XP system: commits +25, swarm +20, tests +15, responses +10, context +5, analysis +5
  - Level-up notifications (each level requires `level × 100` XP)
  - Five mood states: happy, neutral, sad, excited, sleeping
  - Git commit detection via `.git/HEAD` FileSystemWatcher
  - Auto test runner for `.test.` / `.spec.` file saves
  - Mood decay back to neutral after 30 seconds
  - Status bar display: `🤖 Buddy Lv.X` with click-to-show tooltip

### Phase 2 — Enhanced Context & Proactive Mode

#### Added
- **Proactive Mode Auto-Analysis** — Background analysis triggered on every file save:
  - Automatically calls `opencode run` with semantic context when Proactive mode is active
  - Analyzes saved files for improvements, bugs, and security issues
  - Buddy XP reward (+5) on successful analysis
- **File Context Management** — Right-click "Add File to SIN Code Context" in editor context menu:
  - Command palette: `SIN Code: Add File to Context`
  - Editor context menu: right-click → `Add File to SIN Code Context`
  - Context files included in every prompt sent to the AI
- **Model Selector** — Quick-pick UI for switching between configured LLM models:
  - Auto-discovers models from `~/.config/opencode/` config
  - Status bar indicator shows current model
- **Status Bar Indicators** — Current mode and model always visible:
  - Left status bar: Mode selector (`$(symbol-misc) Code`)
  - Left status bar: Model selector (`$(symbol-constant) qwen3.6-plus`)
- **Test Auto-Runner** — Automatically runs `npm test` when test files are saved:
  - Creates terminal named "SIN Code Test Runner"
  - Runs in the test file's directory
  - Shows terminal output automatically

### Phase 3 — Inline Completions, Code Actions & Marketplace

#### Added
- **Inline Chat / Code Completions** (`InlineChatProvider`):
  - Ghost-text completions at cursor position
  - Prefix-aware code generation (from start of file to cursor)
  - Max 5 lines of completion
  - Registered as `InlineCompletionItemProvider` for all file patterns (`**`)
  - Graceful fallback on errors (returns null)
  - Keyboard shortcut: `Cmd+Shift+I` / `Ctrl+Shift+I`
- **AI Code Actions** (`SINCodeActionProvider`):
  - 🔮 **Fix Error** — QuickFix action on every diagnostic error:
    - Reads diagnostic message + selected code
    - Uses Debug mode for root cause analysis
    - Returns only fixed code, applies as workspace edit
  - 🤖 **Refactor Selection** — Refactor selected code inline:
    - Sends selected code for cleaner, more maintainable refactoring
    - Uses Code mode
    - Applies result as workspace edit
  - 📖 **Explain Code** — Opens explanation in side panel webview:
    - Uses Ask mode for plain-English explanation
    - Creates `vscode.window.createWebviewPanel` in `ViewColumn.Beside`
  - ✅ **Generate Tests** — Creates `.test.` file next to source:
    - Generates unit tests for selected code
    - Creates new file with `.test.` suffix alongside original
    - Opens the new test file automatically
- **Agent Marketplace** (`MarketplacePanel`):
  - Six pre-configured agents:
    - **SIN-Explorer** (Analysis) — Codebase analysis, ast-grep patterns
    - **SIN-Librarian** (Research) — Documentation research, GitHub examples
    - **SIN-Oracle** (Intelligence) — Architecture guidance, debugging
    - **SIN-Artistry** (Creative) — Non-conventional problem solving
    - **SIN-Frontend** (Development) — UI/UX design, React, CSS
    - **SIN-Vision-Colab** (Vision) — Screen recording + AI-vision analysis
  - Category filtering (Analysis, Research, Intelligence, Creative, Development, Vision)
  - Install/remove agents with one-click
  - Card-based grid layout with VS Code theme colors
  - Installed count badge in header
  - Version display per agent
  - Responsive grid layout adapting to panel width
  - Keyboard shortcut: `Cmd+Shift+M` / `Ctrl+Shift+M`

### Keybindings

| Key | Command |
|-----|---------|
| `Cmd+Shift+I` / `Ctrl+Shift+I` | Trigger Inline Suggestion |
| `Cmd+Shift+M` / `Ctrl+Shift+M` | Open SIN Agent Marketplace |

### Commands

| Command | Description |
|---------|-------------|
| `sincode.start` | Open SIN Code sidebar |
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
- **Extension Points**: WebviewViewProvider, InlineCompletionItemProvider, CodeActionProvider, StatusBarItem, FileSystemWatcher
