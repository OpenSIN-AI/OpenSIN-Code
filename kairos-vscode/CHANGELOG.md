# Changelog

## v0.1.0 — Initial Release (2026-04-02)

### Phase 1 — Core Extension
- SIN Code Sidebar (Webview Chat Interface)
- CLI Bridge via `opencode run --format json`
- Mode Selector: Architect, Code, Debug, Ask, Proactive
- Model Dropdown (auto-fetches from provider config)
- Context Provider (file selection)
- Proactive Mode (on-save background analysis)
- Swarm Coordinator (dispatch sub-agents)

### Phase 2 — Intelligence Layer
- LSP Diagnostics & Semantic Context (via simone-mcp)
- Memory Consolidation (AGENTS.md / SIN-MEMORY.md)
- BUDDY Gamification (status bar pet with XP/mood/leveling)

### Phase 3 — Advanced Features
- Inline Chat (ghost text code completion)
- Code Actions: Fix Error, Refactor, Explain, Generate Tests
- Agent Marketplace panel (6 pre-configured agents)
- Keybindings: CMD+Shift+I (inline), CMD+Shift+M (marketplace)

### Architecture
- 10 TypeScript source files
- 8 registered commands
- 2 custom keybindings
- Webview-based chat UI
- CLI-first communication pattern
