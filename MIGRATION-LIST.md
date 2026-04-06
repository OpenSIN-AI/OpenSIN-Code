# OpenSIN-AI Migrations-Liste: sin-claude → OpenSIN-Code

> **Erstellt:** 2026-04-06
> **Quelle:** sin-claude (claude-code-main/ + claw-code-main/)
> **Ziel:** OpenSIN-AI/OpenSIN-Code (packages/opensin-sdk/)
> **Status:** Detaillierte Analyse beider Codebasen abgeschlossen

---

## Zusammenfassung der Codebases

| Metrik | sin-claude | OpenSIN-Code |
|---|---|---|
| Dateien (Source) | ~4.170 | ~1.000 |
| Zeilen Code | ~504.000+ | ~180.000 (geschätzt) |
| Sprachen | TypeScript, Python, Rust | TypeScript |
| Implementierte Features | Vollständig | ~60% (viele Module leer/excluded) |
| Tests | Teilweise | Minimal |
| Dokumentation | Exzellent (2.747 Zeilen Changelog) | Gut (BUGS.md, RUNBOOKS.md) |

---

## KRITISCHE PROBLEME IN OPENSIN-CODE (vor Migration beheben)

### P0 - Blocker
1. **tsconfig.json schließt 40+ Module aus** → Die Mehrheit des Codes wird nicht kompiliert/type-checked
2. **opensin-code-vscode/ komplett leer** → 14 Dateien, alle 0 Bytes
3. **CODE_OF_CONDUCT.md leer** → 0 Bytes
4. **CI-Workflow fehlerhaft** → Verweist auf root package.json das nicht existiert
5. **OAR-Skript/antigravity leer** → Nur Tool-Config, kein Code

### P1 - Hohe Priorität
6. **Import-Pfade defekt** → ink.tsx importiert nicht-existierende Pfade
7. **Kein dist/ Build-Artefakt** → SDK wurde nie erfolgreich gebaut
8. **Test-Dateien alle leer** → Keine Testabdeckung

---

## MIGRATIONS-LISTE NACH PRIORITÄT

### PHASE 1: Core Engine & Agent Loop

#### 1.1 QueryEngine (sin-claude: src/QueryEngine.ts, 1.295 Zeilen)
- **Status in OpenSIN-Code:** Nicht vorhanden (kein Äquivalent)
- **Migration:** Vollständig portieren → `packages/opensin-sdk/query_engine/`
- **Branding:** `QueryEngine` → `SinQueryEngine`, alle Claude-Refs → OpenSIN
- **Was es tut:** Kern-Lebenszyklus-Manager für API-Calls, Tool-Execution, Compaction, SDK-Messaging
- **Dateien zu migrieren:**
  - `sin-claude/claude-code-main/src/QueryEngine.ts`
  - `sin-claude/claude-code-main/src/query.ts` (1.729 Zeilen - Agent Loop)

#### 1.2 Main Entry Point (sin-claude: src/main.tsx, 4.683 Zeilen)
- **Status in OpenSIN-Code:** `standalone_cli/` existiert aber deutlich simpler
- **Migration:** CLI-Parsing, Feature-Flags, Migrations, Session-Management übernehmen
- **Dateien:**
  - `sin-claude/claude-code-main/src/main.tsx`
  - Feature-Flag-System (`bun:bundle` feature flags) → OpenSIN-äquivalent erstellen
  - MDM-Prefetch, Keychain-Prefetch, Early-Input-Capture

#### 1.3 Tool System (sin-claude: src/tools/ - 43 Dateien, 50+ Tools)
- **Status in OpenSIN-Code:** `tools_v2/` existiert mit ~20 Tools
- **FEHLENDE TOOLS in OpenSIN-Code:**
  - `GrepTool` → Content-Suche mit Regex
  - `GlobTool` → File-Pattern-Matching
  - `WebBrowserTool` → Browser-Automation
  - `CtxInspectTool` → Context-Inspection
  - `SnipTool` → History-Snipping
  - `WorkflowTool` → Workflow-Script-Ausführung
  - `PushNotificationTool` → Push-Benachrichtigungen
  - `SubscribePRTool` → GitHub PR Webhooks
  - `SendUserFileTool` → Dateien an Nutzer senden
  - `TerminalCaptureTool` → Terminal-Panel-Capture
  - `OverflowTestTool` → Testing-Utility
  - `TungstenTool` → Internes Tool
  - `SuggestBackgroundPRTool` → Background-PR-Vorschläge
  - `VerifyPlanExecutionTool` → Plan-Verifikation
  - `ListPeersTool` → UDS-Inbox-Peers
  - `PowerShellTool` → PowerShell-Ausführung
  - `McpAuthTool` → MCP-Authentifizierung
  - `ToolSearchTool` → Tool-Suche

### PHASE 2: Command System

#### 2.1 Slash Commands (sin-claude: src/commands/ - 101 Dateien, 100+ Commands)
- **Status in OpenSIN-Code:** `commands_v2/` existiert mit ~50 Commands
- **FEHLENDE COMMANDS in OpenSIN-Code:**
  - `/teleport` → Git-basierter Session-Transfer
  - `/security-review` → Sicherheitsüberprüfung
  - `/bughunter` → Bug-Hunting-Modus
  - `/thinkback` → Session-Rückblick
  - `/sandbox-toggle` → Sandbox-Steuerung
  - `/passes` → Multi-Pass-Ausführung
  - `/advisor` → Advisor-Modus
  - `/privacy-settings` → Privatsphäre-Einstellungen
  - `/rate-limit-options` → Rate-Limit-Optionen
  - `/extra-usage` → Erweiterte Nutzung
  - `/upgrade` → Upgrade-Flow
  - `/onboarding` → Onboarding
  - `/install-github-app` → GitHub-App-Installation
  - `/install-slack-app` → Slack-App-Installation
  - `/btw` → "By The Way" Feature
  - `/feedback` → Feedback-System
  - `/good-claude` → → `/good-sin` (Branding!)
  - `/issue` → Issue-Erstellung
  - `/add-dir` → Verzeichnis hinzufügen
  - `/heapdump` → Memory-Debugging
  - `/mock-limits` → Rate-Limit-Mocking
  - `/perf-issue` → Performance-Diagnose
  - `/ant-trace` → → `/sin-trace` (Branding!)
  - `/stickers` → Emoji-Sticker
  - `/tag` → Session-Tagging
  - `/env` → Environment-Management
  - `/proactive` → Proaktiver Modus
  - `/brief` → Brief-Generierung
  - `/assistant` → Assistant-Modus
  - `/bridge` → Bridge-Modus
  - `/voice` → Voice-Modus
  - `/workflows` → Workflow-Verwaltung
  - `/torch` → Torch-Feature
  - `/peers` → Peer-Verwaltung
  - `/fork` → Subagent-Forking
  - `/buddy` → Buddy-System
  - `/ultraplan` → Ultra-Plan-Modus
  - `/subscribe-pr` → PR-Abonnement
  - `/agents-platform` → Agenten-Plattform
  - `/rewind` → Session-Zurückspulen
  - `/statusline` → Statuszeilen-Konfiguration
  - `/context` → Context-Visualisierung

### PHASE 3: Plugin System

#### 3.1 Plugin-Architektur (sin-claude: src/plugins/ + plugins/ - 14 offizielle Plugins)
- **Status in OpenSIN-Code:** `plugin_state/` existiert aber minimal
- **Migration:** Vollständiges Plugin-System portieren
- **Dateien:**
  - `sin-claude/claude-code-main/src/plugins/builtinPlugins.ts`
  - `sin-claude/claude-code-main/plugins/` (14 Plugins)
  - Plugin-Marketplace-Integration
  - Plugin-Installation/Enable/Disable/Uninstall
  - Plugin-Provided Commands, Agents, Skills, Hooks, MCP-Server
- **Zu migrierende Plugins (umbenannt für OpenSIN-Branding):**
  - `code-review` → `sin-code-review` (5 parallele Agenten für PR-Review)
  - `feature-dev` → `sin-feature-dev` (7-Phasen Feature-Entwicklung)
  - `plugin-dev` → `sin-plugin-dev` (Plugin-Erstellungsworkflow)
  - `hookify` → `sin-hookify` (Custom-Hook-Erstellung)
  - `commit-commands` → `sin-commit-commands`
  - `ralph-wiggum` → `sin-loop` (Selbst-referenzielle AI-Schleifen)
  - `security-guidance` → `sin-security-guidance`
  - `frontend-design` → `sin-frontend-design`
  - `agent-sdk-dev` → `sin-agent-sdk-dev`
  - `learning-output-style` → `sin-learning-mode`
  - `explanatory-output-style` → `sin-explanatory-mode`

### PHASE 4: MCP (Model Context Protocol)

#### 4.1 MCP-Integration (sin-claude: src/services/mcp/ - 25+ Dateien)
- **Status in OpenSIN-Code:** `tools_v2/` hat MCP-Tools aber kein vollständiges MCP-System
- **Migration:** Vollständiges MCP-System portieren
- **Dateien zu migrieren:**
  - `sin-claude/claude-code-main/src/services/mcp/MCPConnectionManager.tsx`
  - `sin-claude/claude-code-main/src/services/mcp/client.ts`
  - `sin-claude/claude-code-main/src/services/mcp/config.ts`
  - `sin-claude/claude-code-main/src/services/mcp/auth.ts`
  - `sin-claude/claude-code-main/src/services/mcp/normalization.ts`
  - `sin-claude/claude-code-main/src/services/mcp/officialRegistry.ts`
  - `sin-claude/claude-code-main/src/services/mcp/elicitationHandler.ts`
  - `sin-claude/claude-code-main/src/services/mcp/channelPermissions.ts`
  - `sin-claude/claude-code-main/src/services/mcp/headersHelper.ts`
  - `sin-claude/claude-code-main/src/services/mcp/envExpansion.ts`
  - `sin-claude/claude-code-main/src/services/mcp/InProcessTransport.ts`
  - `sin-claude/claude-code-main/src/services/mcp/SdkControlTransport.ts`
  - `sin-claude/claude-code-main/src/services/mcp/oauthPort.ts`
  - `sin-claude/claude-code-main/src/services/mcp/xaa.ts` + `xaaIdpLogin.ts`
  - `sin-claude/claude-code-main/src/services/mcp/vscodeSdkMcp.ts`
  - `sin-claude/claude-code-main/src/services/mcp/channelNotification.ts`
  - `sin-claude/claude-code-main/src/services/mcp/channelAllowlist.ts`
  - `sin-claude/claude-code-main/src/services/mcp/claudeai.ts` → `opensinai.ts`
  - `sin-claude/claude-code-main/src/services/mcp/mcpStringUtils.ts`
  - `sin-claude/claude-code-main/src/services/mcp/utils.ts`
  - `sin-claude/claude-code-main/src/services/mcp/types.ts`

### PHASE 5: Multi-Agent / Swarm Features

#### 5.1 Agent Swarms & Coordinator (sin-claude: src/coordinator/ + Team-Tools)
- **Status in OpenSIN-Code:** `coordinator/` existiert (5 Dateien), `agents/` existiert (9 Agenten)
- **FEHLEND:**
  - `TeamCreateTool` mit erweiterten Optionen
  - `TeamDeleteTool`
  - Coordinator-Modus mit Work-Distribution
  - Subagent `@`-Mention Typeahead
  - In-Process-Teammate-Kommunikation via UDS
  - Team Memory (shared memory across agents)
  - Fork Subagent
  - Buddy System (erweitert)
- **Dateien zu migrieren:**
  - `sin-claude/claude-code-main/src/coordinator/`
  - `sin-claude/claude-code-main/src/state/teammateViewHelpers.ts`
  - `sin-claude/claude-code-main/src/services/SessionMemory/` (3 Dateien)
  - `sin-claude/claude-code-main/src/services/teamMemorySync/` (5 Dateien)

### PHASE 6: Remote & Distributed Features

#### 6.1 Remote Control & Bridge (sin-claude: src/remote/ + src/bridge/)
- **Status in OpenSIN-Code:** `bridge_system/` existiert (5 Dateien)
- **FEHLEND:**
  - WebSocket-basierter Remote-Zugriff (Mobile/Web)
  - SSH Remote Mode (`claude ssh <host>` → `sin ssh <host>`)
  - Teleport (Git-basierter Session-Transfer)
  - Direct Connect (cc:// → sin:// URL-Protokoll)
  - Deep Links (sin-cli://open?q=)
  - Upstream Proxy
- **Dateien zu migrieren:**
  - `sin-claude/claude-code-main/src/remote/SessionsWebSocket.ts`
  - `sin-claude/claude-code-main/src/remote/RemoteSessionManager.ts`
  - `sin-claude/claude-code-main/src/remote/remotePermissionBridge.ts`
  - `sin-claude/claude-code-main/src/remote/sdkMessageAdapter.ts`
  - `sin-claude/claude-code-main/src/bridge/`

#### 6.2 Server (sin-claude: src/server/)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Direct-Connect-Session-Server portieren
- **Dateien:**
  - `sin-claude/claude-code-main/src/server/` (3 Dateien)

### PHASE 7: Security & Permissions

#### 7.1 Permission System (sin-claude: src/utils/permissions* + hooks)
- **Status in OpenSIN-Code:** Basis-Permissions existieren
- **FEHLEND:**
  - PreToolUse Hooks (Tool-Calls abfangen/modifizieren/verweigern)
  - PostToolUse Hooks
  - Auto-Mode ML Classifier
  - Bypass Permission System
  - Dangerous Permission Stripping
  - File Permission Rules mit Symlink-Auflösung
  - PowerShell Hardening
  - Linux Seccomp Sandbox
  - Protected Directory Enforcement
  - Git Hook Safety
- **Dateien zu migrieren:**
  - `sin-claude/claude-code-main/src/Tool.ts` (Permission-Interfaces)
  - Alle `permissions*` Dateien in `src/utils/`
  - Hook-System Dateien

#### 7.2 OAuth & Auth (sin-claude: src/services/oauth/ + src/services/api/)
- **Status in OpenSIN-Code:** `client.ts` hat Basis-Auth
- **FEHLEND:**
  - OAuth mit PKCE
  - AWS Bedrock Authentication
  - GCP Vertex AI Authentication
  - Claude.ai → OpenSIN.ai Subscriber Detection
  - mTLS Support
  - Portable Auth Files
  - Session Ingress Authentication
- **Dateien zu migrieren:**
  - `sin-claude/claude-code-main/src/services/oauth/`
  - `sin-claude/claude-code-main/src/services/api/client.ts`
  - `sin-claude/claude-code-main/src/services/api/bootstrap.ts`
  - `sin-claude/claude-code-main/src/services/api/errors.ts`
  - `sin-claude/claude-code-main/src/services/api/withRetry.ts`
  - `sin-claude/claude-code-main/src/services/api/usage.ts`
  - `sin-claude/claude-code-main/src/services/api/referral.ts`
  - `sin-claude/claude-code-main/src/services/api/logging.ts`
  - `sin-claude/claude-code-main/src/services/api/filesApi.ts`
  - `sin-claude/claude-code-main/src/services/api/sessionIngress.ts`

### PHASE 8: UI/UX Components

#### 8.1 Ink Terminal UI (sin-claude: src/components/ - 144 Komponenten, src/hooks/ - 85 Hooks)
- **Status in OpenSIN-Code:** `components_v2/` (150+), `hooks_v2/` (60+), `ink_v2/` (60+)
- **ANMERKUNG:** OpenSIN-Code hat hier bereits gute Abdeckung, aber es fehlen:
  - Vim Mode (vollständig) → `vim_mode/` existiert aber unvollständig
  - Themes (Theme Picker) → `color_picker/` existiert (nur Types)
  - Model Picker (interaktiv)
  - Structured Diffs (Syntax-highlighted)
  - Image Support (Paste, Resize, Validate, Display)
  - PDF Support (Parsing, Display)
  - Stickers
  - Progress Indicators (Tool-Execution, Agent-Status)
  - Typeahead (Command/Skill-Vorschläge)
  - Virtual Scrolling (effizientes Rendering großer Histories)
  - Fullscreen Mode (Alt-Screen Rendering)
  - Feedback Surveys
  - Onboarding Flows
- **Dateien zu migrieren:**
  - `sin-claude/claude-code-main/src/components/` (144 Komponenten prüfen und übernehmen)
  - `sin-claude/claude-code-main/src/hooks/` (85 Hooks prüfen und übernehmen)
  - `sin-claude/claude-code-main/src/vim/` (5 Dateien)
  - `sin-claude/claude-code-main/src/keybindings/`

#### 8.2 Voice Features (sin-claude: src/voice/ + src/services/voice*)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Vollständiges Voice-System portieren
- **Dateien:**
  - `sin-claude/claude-code-main/src/voice/`
  - `sin-claude/claude-code-main/src/services/voice.ts`
  - `sin-claude/claude-code-main/src/services/voiceStreamSTT.ts`
  - `sin-claude/claude-code-main/src/services/voiceKeyterms.ts`

### PHASE 9: Memory System

#### 9.1 Memory Directory (sin-claude: src/memdir/ - 8 Dateien)
- **Status in OpenSIN-Code:** Nicht vorhanden (kein Äquivalent)
- **Migration:** Vollständiges Memory-System portieren
- **Dateien:**
  - `sin-claude/claude-code-main/src/memdir/` (8 Dateien)
  - Memory Age Tracking
  - Memory Scan
  - Nested Memory
  - Auto Memory Path Override

### PHASE 10: Session Management

#### 10.1 Session Features (sin-claude: src/history.ts + Session-Management)
- **Status in OpenSIN-Code:** `session_naming/` existiert (nur Types)
- **FEHLEND:**
  - Session Persistence (JSONL Transcripts)
  - Session Resume (`--resume` Flag)
  - Cross-Project Session-Resume
  - Session Teleport
  - Concurrent Session Tracking
  - Session Title Caching/Generation
  - Session Environment Variables
  - Session File Access Hooks
  - Session Activity Tracking
  - History Snip
  - Rewind
- **Dateien zu migrieren:**
  - `sin-claude/claude-code-main/src/history.ts`
  - `sin-claude/claude-code-main/src/transcript.py` (aus claw-code-main)
  - Session-Management-Utilities

### PHASE 11: Performance & Optimization

#### 11.1 Startup & Performance (sin-claude: Diverse Performance-Module)
- **Status in OpenSIN-Code:** `turbo/` existiert (1 Datei)
- **FEHLEND:**
  - Startup Profiling (Checkpoint-basiert)
  - MDM Prefetch (paralleles macOS MDM Settings Reading)
  - Keychain Prefetch (paralleles OAuth + API Key Reading)
  - Early Input Capture
  - File Read Caching (LRU Cache)
  - File State Cache
  - Completion Cache
  - Tool Schema Cache
  - Prompt Cache Optimization
  - Event Loop Stall Detection
  - FPS Tracking
  - Headless Profiler
  - ANSI Stripping Optimization
  - SSE Transport (Linear-time large frame handling)
  - Transcript Write Optimization

### PHASE 12: Analytics & Telemetry

#### 12.1 Analytics (sin-claude: src/services/analytics/ - 8 Dateien)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Analytics-System portieren (OpenSIN-eigenes, kein GrowthBook/Statsig)
- **Dateien:**
  - `sin-claude/claude-code-main/src/services/analytics/` (8 Dateien)
  - **WICHTIG:** GrowthBook/Statsig durch OpenSIN-eigene Lösung ersetzen!
  - Event Logging mit strukturierter Metadaten
  - Plugin Telemetry
  - Skill Loading Telemetry
  - Startup Telemetry

### PHASE 13: Migration System

#### 13.1 Data Migrations (sin-claude: src/migrations/ - 11 Dateien)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Versioniertes Migration-System erstellen
- **Dateien:**
  - `sin-claude/claude-code-main/src/migrations/` (11 Dateien)
  - Model String Migrations
  - Settings Migrations
  - Changelog Migrations
  - Migration Version Tracking

### PHASE 14: Git Integration

#### 14.1 Git Features (sin-claude: src/utils/git*)
- **Status in OpenSIN-Code:** `branch_command/` existiert (4 Dateien)
- **FEHLEND:**
  - Git Root Detection
  - Branch Tracking (erweitert)
  - Worktree Management (Create, Exit, Count)
  - Git Diff Computation
  - Commit Attribution Tracking
  - GitHub PR Status Checking
  - GitHub Repo Path Mapping
  - Git Hook Safety
- **Dateien zu migrieren:**
  - Alle `git*` Dateien in `src/utils/`
  - `sin-claude/claude-code-main/src/utils/worktree*`

### PHASE 15: Advanced Features

#### 15.1 Workflow Scripts (sin-claude: Workflow-System)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Workflow-Script-System portieren
- **Bundled Workflows + Custom Workflows**

#### 15.2 Cron Scheduling (sin-claude: ScheduleCronTool)
- **Status in OpenSIN-Code:** `tools_v2/` hat ScheduleCron aber unvollständig
- **Migration:** Vollständige Cron-Implementierung mit Jitter + Remote Trigger

#### 15.3 Plan Mode (sin-claude: EnterPlanModeTool + UltraPlan)
- **Status in OpenSIN-Code:** `plan_act/` existiert (3 Dateien)
- **FEHLEND:** UltraPlan-Modus

#### 15.4 Context Visualization & Management
- **Status in OpenSIN-Code:** `context_mgmt/` existiert (5 Dateien)
- **FEHLEND:**
  - Context Collapse
  - Reactive Compaction
  - Micro-Compaction
  - Preserved Segment Handling
  - Context-Visualisierung

#### 15.5 File History & Commit Attribution
- **Status in OpenSIN-Code:** `file_changes_panel/` existiert (5 Dateien)
- **FEHLEND:** Snapshot-basierte File-Change-Tracking

#### 15.6 LSP Integration (sin-claude: src/services/lsp/ - 7 Dateien)
- **Status in OpenSIN-Code:** `lsp/` existiert (2 Dateien)
- **FEHLEND:**
  - LSPServerManager
  - LSPServerInstance
  - LSPClient
  - LSPDiagnosticRegistry
  - Passive Feedback
  - LSP Config (erweitert)

#### 15.7 Notebook Editing (sin-claude: NotebookEditTool)
- **Status in OpenSIN-Code:** `tools_v2/` hat NotebookEdit aber unvollständig
- **Migration:** Vollständige Jupyter-Notebook-Unterstützung

#### 15.8 Image & PDF Processing
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Image (Resize, Validate, Store, Paste) + PDF (Parsing, Display)

#### 15.9 Tips System (sin-claude: src/services/tips/)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Tip-Registry, Tip-History, Tip-Scheduler

#### 15.10 Prompt Suggestion (sin-claude: src/services/PromptSuggestion/)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** AI-gestützte Prompt-Vorschläge

#### 15.11 Magic Docs (sin-claude: src/services/MagicDocs/)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Dokumentations-Generierung

#### 15.12 Auto Dream (sin-claude: src/services/autoDream/)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Experimentelles Auto-Dream-Feature

#### 15.13 Settings Sync (sin-claude: src/services/settingsSync/)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Settings-Synchronisierung über Geräte

#### 15.14 Policy Limits & Remote Managed Settings
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Enterprise-Policy-Limits + Remote-Managed-Settings

#### 15.15 Notifier System (sin-claude: src/services/notifier.ts)
- **Status in OpenSIN-Code:** `terminal_notifications/` existiert
- **Migration:** Erweitertes Notifier-System

#### 15.16 Diagnostic Tracking (sin-claude: src/services/diagnosticTracking.ts)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Diagnose-Tracking

#### 15.17 Rate Limit Mocking (sin-claude: src/services/rateLimitMocking.ts)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Rate-Limit-Testing-Utilities

#### 15.18 VCR Mode (sin-claude: src/services/vcr.ts)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Request/Response-Recording-und-Replay

#### 15.19 Prevent Sleep (sin-claude: src/services/preventSleep.ts)
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Migration:** Sleep-Prevention für lange Tasks

### PHASE 16: IDE Integration

#### 16.1 VS Code Extension (sin-claude: IDE-Integration)
- **Status in OpenSIN-Code:** `kairos-vscode/` (2 Dateien implemented), `opensin-code-vscode/` (ALLES LEER)
- **Migration:**
  - `opensin-code-vscode/` vollständig implementieren
  - IDE Auto-Connect-Dialogs
  - IDE Onboarding
  - IDE Selection Tracking
  - IDE Logging
  - IDE At-Mention-Support
  - Desktop Handoff
  - Desktop Upsell
  - JetBrains IDE Support

### PHASE 17: Rust Port (claw-code-main/rust/)

#### 17.1 Rust-Implementierung als Alternative
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Option:** Claw-Code Rust-Port als Basis für OpenSIN-Rust-CLI verwenden
- **Crates:**
  - `api/` → Anthropic API Client, OAuth, SSE Streaming
  - `claw-cli/` → Main CLI Binary (5.090 Zeilen)
  - `commands/` → Slash-Command-Registry
  - `compat-harness/` → Compatibility Layer
  - `lsp/` → LSP Client
  - `plugins/` → Plugin-Modell
  - `runtime/` → Session-State, Compaction, MCP, Prompt-Construction
  - `server/` → HTTP/SSE Server (axum)
  - `tools/` → Tool-Manifest (4.469 Zeilen)

### PHASE 18: Python Port (claw-code-main/src/)

#### 18.1 Python-Porting-Workspace
- **Status in OpenSIN-Code:** Nicht vorhanden
- **Option:** Python-CLI als leichtgewichtige Alternative
- **Wichtige Dateien:**
  - `main.py` (213 Zeilen, 20+ Subcommands)
  - `query_engine.py`
  - `port_manifest.py`
  - `parity_audit.py`
  - `runtime.py` + `remote_runtime.py`
  - `reference_data/` (JSON-Snapshots aller Subsysteme)

---

## BRANDING-REGELN (sin-claude → OpenSIN-AI)

| sin-claude | OpenSIN-AI |
|---|---|
| `claude` | `sin` |
| `Claude` | `Sin` |
| `CLAUDE` | `SIN` |
| `claude-code` | `opensin-code` |
| `Claude Code` | `OpenSIN Code` |
| `Anthropic` | `OpenSIN-AI` |
| `cc://` | `sin://` |
| `claude-cli://` | `sin-cli://` |
| `CLAUDE_CODE_*` (Env-Vars) | `OPENSIN_*` |
| `claude-code-main` | `opensin-code-main` |
| `claw-code` | `sin-code` |
| `Claw` | `SinClaw` |
| `/good-claude` | `/good-sin` |
| `/ant-trace` | `/sin-trace` |
| `mcp/claudeai.ts` | `mcp/opensinai.ts` |
| `growthbook/statsig` | `opensin-analytics` (eigen!) |
| `Ralph Wiggum Plugin` | `Sin Loop Plugin` |
| `Hookify` | `SinHookify` |

---

## MIGRATIONS-REIHENFOLGE (Empfohlen)

1. **P0-Probleme beheben** (tsconfig, leere Dateien, CI)
2. **Phase 1** - Core Engine (QueryEngine, Agent Loop, Main Entry)
3. **Phase 2** - Command System (fehlende Commands)
4. **Phase 3** - Plugin System
5. **Phase 4** - MCP Integration
6. **Phase 5** - Multi-Agent / Swarm
7. **Phase 7** - Security & Permissions (kritisch!)
8. **Phase 6** - Remote & Distributed
9. **Phase 10** - Session Management
10. **Phase 8** - UI/UX Components
11. **Phase 9** - Memory System
12. **Phase 14** - Git Integration
13. **Phase 11** - Performance
14. **Phase 12** - Analytics (OpenSIN-eigen!)
15. **Phase 13** - Migration System
16. **Phase 15** - Advanced Features
17. **Phase 16** - IDE Integration
18. **Phase 17/18** - Rust/Python Ports (optional)

---

## GESCHÄTZTER MIGRATIONS-AUFWAND

| Phase | Dateien | Zeilen | Aufwand |
|---|---|---|---|
| P0 Fixes | 15 | ~500 | 1-2 Tage |
| Phase 1: Core Engine | 5 | ~8.000 | 3-5 Tage |
| Phase 2: Commands | 40 | ~5.000 | 2-3 Tage |
| Phase 3: Plugins | 30 | ~4.000 | 3-4 Tage |
| Phase 4: MCP | 20 | ~3.500 | 2-3 Tage |
| Phase 5: Multi-Agent | 10 | ~2.000 | 2-3 Tage |
| Phase 7: Security | 25 | ~4.500 | 3-5 Tage |
| Phase 6: Remote | 8 | ~1.500 | 1-2 Tage |
| Phase 10: Session | 5 | ~1.000 | 1-2 Tage |
| Phase 8: UI/UX | 100 | ~15.000 | 5-7 Tage |
| Phase 9: Memory | 8 | ~1.200 | 1-2 Tage |
| Phase 14: Git | 10 | ~2.000 | 1-2 Tage |
| Phase 11: Performance | 15 | ~3.000 | 2-3 Tage |
| Phase 12: Analytics | 8 | ~1.500 | 1-2 Tage |
| Phase 13: Migrations | 11 | ~1.500 | 1-2 Tage |
| Phase 15: Advanced | 30 | ~5.000 | 3-5 Tage |
| Phase 16: IDE | 14 | ~2.000 | 2-3 Tage |
| **GESAMT** | **~354** | **~61.200** | **33-53 Tage** |

---

## WICHTIGE HINWEISE

1. **Keine Cross-Repo-Abhängigkeiten:** OpenSIN-AI und sin-claude dürfen nichts voneinander wissen. Jedes hat sein eigenes Branding.
2. **Analytics ersetzen:** GrowthBook/Statsig durch OpenSIN-eigene Lösung ersetzen.
3. **Env-Vars umbenennen:** Alle `CLAUDE_CODE_*` → `OPENSIN_*`.
4. **API-Endpunkte anpassen:** Alle Anthropic-API-Refs durch OpenSIN-API ersetzen.
5. **Dokumentation aktualisieren:** Alle Docs müssen OpenSIN-Branding haben.
6. **Tests schreiben:** Für jede migrierte Komponente Tests erstellen.
7. **tsconfig bereinigen:** Alle Module müssen kompilierbar sein.
