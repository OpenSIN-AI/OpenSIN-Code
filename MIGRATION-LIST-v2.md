# OpenSIN-AI Migrations-Liste: sin-claude → OpenSIN-Code

> **Erstellt:** 2026-04-06  
> **Aktualisiert:** 2026-04-06  
> **Quelle:** sin-claude (claude-code-main/ + claw-code-main/)  
> **Ziel:** OpenSIN-AI/OpenSIN-Code  
> **Quelle-Statistik:** 366 Dateien, 147.021 Zeilen Code  
> **Status:** Komplette Analyse abgeschlossen

---

## Zusammenfassung der Codebases

| Metrik | sin-claude (Gesamt) | claude-code-main | claw-code-main | OpenSIN-Code |
|--------|---------------------|------------------|----------------|--------------|
| **Dateien** | ~4.170 | 184 | 182 | ~2.239 |
| **Zeilen Code** | ~1.094.306 | 87.250 | 59.771 | ~180.000 |
| **Sprachen** | TypeScript, Python, Rust | TypeScript, Shell, Python, YAML, JSON | Rust, Python, TypeScript | TypeScript |
| **Plugins** | 13 + 14 | 13 | - | 22 + 1 |
| **Slash Commands** | 100+ | 12 | 27 | 65+ |
| **Agenten** | 16 | 16 | - | 9 |
| **Tools** | 50+ | - | 17 | 20+ |

---

## KRITISCHE PROBLEME IN OPENSIN-CODE (vor Migration beheben!)

### P0 - Blocker (Sofort beheben)

| # | Problem | Datei | Auswirkung |
|---|---------|-------|------------|
| 1 | **tsconfig.json schließt 40+ Module aus** | `packages/opensin-sdk/tsconfig.json` | 60% des Codes wird nicht kompiliert |
| 2 | **opensin-code-vscode/ komplett leer** | `packages/opensin-code-vscode/` | 14 Dateien, alle 0 Bytes |
| 3 | **CODE_OF_CONDUCT.md leer** | `CODE_OF_CONDUCT.md` | 0 Bytes |
| 4 | **CI-Workflow fehlerhaft** | `.github/workflows/` | Verweist auf nicht-existierende root package.json |
| 5 | **Kein dist/ Build-Artefakt** | `packages/*/dist/` | SDK wurde nie erfolgreich gebaut |

### P1 - Hohe Priorität

| # | Problem | Auswirkung |
|---|---------|------------|
| 6 | **Import-Pfade defekt** | ink.tsx importiert nicht-existierende Pfade |
| 7 | **Test-Dateien leer/minimal** | Keine Testabdeckung |
| 8 | **Plugin-Runtime leer** | `plugin-runtime/` nicht implementiert |

---

## MIGRATIONS-LISTE NACH PRIORITÄT

### PHASE 1: Plugin-System (13 Plugins → OpenSIN)

#### 1.1 Plugin-System Architektur

**Quelle:** `claude-code-main/plugins/` (13 Plugins)

| Plugin | Quelle | Ziel | Beschreibung |
|--------|--------|------|--------------|
| `code-review` | `plugins/code-review/` | `packages/plugins/sin-code-review/` | 5-parallele Agenten für PR-Review |
| `feature-dev` | `plugins/feature-dev/` | `packages/plugins/sin-feature-dev/` | 7-Phasen Feature-Entwicklung |
| `plugin-dev` | `plugins/plugin-dev/` | `packages/plugins/sin-plugin-dev/` | Plugin-Erstellungs-Workflow |
| `hookify` | `plugins/hookify/` | `packages/plugins/sin-hookify/` | Custom-Hook-Erstellung |
| `commit-commands` | `plugins/commit-commands/` | `packages/plugins/sin-commit-commands/` | Git-Workflow-Commands |
| `ralph-wiggum` | `plugins/ralph-wiggum/` | `packages/plugins/sin-loop/` | Selbst-referenzielle AI-Schleifen |
| `security-guidance` | `plugins/security-guidance/` | `packages/plugins/sin-security-guidance/` | Security-Pattern-Warnungen |
| `frontend-design` | `plugins/frontend-design/` | `packages/plugins/sin-frontend-design/` | UI/UX Design-Skill |
| `agent-sdk-dev` | `plugins/agent-sdk-dev/` | `packages/plugins/sin-agent-sdk-dev/` | Agent SDK Development Kit |
| `learning-output-style` | `plugins/learning-output-style/` | `packages/plugins/sin-learning-mode/` | Interaktives Lernen |
| `explanatory-output-style` | `plugins/explanatory-output-style/` | `packages/plugins/sin-explanatory-mode/` | Educational Insights |
| `claude-opus-4-5-migration` | `plugins/claude-opus-4-5-migration/` | - | Model-Migration (deprecated) |
| `pr-review-toolkit` | `plugins/pr-review-toolkit/` | `packages/plugins/sin-pr-review/` | Umfassendes PR-Review |

#### 1.2 Plugin-Komponenten zu Migrieren

**Slash Commands (12):**
```
.claude/commands/triage-issue.md          → sin-commands/triage-issue.md
.claude/commands/dedupe.md                → sin-commands/dedupe.md
.claude/commands/commit-push-pr.md        → sin-commands/commit-push-pr.md
plugins/commit-commands/commands/commit.md          → sin-commands/commit.md
plugins/commit-commands/commands/commit-push-pr.md  → sin-commands/commit-push-pr.md
plugins/commit-commands/commands/clean_gone.md       → sin-commands/clean-gone.md
plugins/code-review/commands/code-review.md          → sin-commands/code-review.md
plugins/pr-review-toolkit/commands/review-pr.md      → sin-commands/review-pr.md
plugins/plugin-dev/commands/create-plugin.md         → sin-commands/create-plugin.md
plugins/hookify/commands/list.md                    → sin-commands/hookify-list.md
plugins/hookify/commands/configure.md               → sin-commands/hookify-configure.md
plugins/hookify/commands/help.md                   → sin-commands/hookify-help.md
```

**Agenten (16):**
```
plugins/agent-sdk-dev/agents/agent-sdk-verifier-py.md   → sin-agents/sdk-verifier-py.md
plugins/agent-sdk-dev/agents/agent-sdk-verifier-ts.md   → sin-agents/sdk-verifier-ts.md
plugins/code-review/commands/code-review.md              → sin-agents/code-review.md
plugins/feature-dev/agents/code-reviewer.md             → sin-agents/code-reviewer.md
plugins/feature-dev/agents/code-architect.md            → sin-agents/code-architect.md
plugins/feature-dev/agents/code-explorer.md             → sin-agents/code-explorer.md
plugins/hookify/agents/conversation-analyzer.md        → sin-agents/conversation-analyzer.md
plugins/plugin-dev/agents/skill-reviewer.md            → sin-agents/skill-reviewer.md
plugins/plugin-dev/agents/agent-creator.md             → sin-agents/agent-creator.md
plugins/plugin-dev/agents/plugin-validator.md          → sin-agents/plugin-validator.md
plugins/pr-review-toolkit/agents/comment-analyzer.md    → sin-agents/comment-analyzer.md
plugins/pr-review-toolkit/agents/code-reviewer.md      → sin-agents/pr-code-reviewer.md
plugins/pr-review-toolkit/agents/code-simplifier.md     → sin-agents/code-simplifier.md
plugins/pr-review-toolkit/agents/pr-test-analyzer.md   → sin-agents/pr-test-analyzer.md
plugins/pr-review-toolkit/agents/silent-failure-hunter.md → sin-agents/silent-failure-hunter.md
plugins/pr-review-toolkit/agents/type-design-analyzer.md  → sin-agents/type-design-analyzer.md
```

**Hook Handler (4):**
```
plugins/security-guidance/hooks/security_reminder_hook.py    → sin-hooks/security-reminder.py
plugins/explanatory-output-style/hooks-handlers/session-start.sh → sin-hooks/session-start.sh
plugins/learning-output-style/hooks-handlers/session-start.sh    → sin-hooks/session-start-learn.sh
plugins/ralph-wiggum/scripts/setup-ralph-loop.sh                → sin-hooks/setup-loop.sh
```

---

### PHASE 2: GitHub Workflows & Automation

#### 2.1 GitHub Actions Workflows (11)

**Quelle:** `.github/workflows/` (claude-code-main)

| Workflow | Quelle | Beschreibung |
|----------|--------|--------------|
| `claude.yml` | `workflows/claude.yml` | Haupt CI/CD Pipeline |
| `claude-issue-triage.yml` | `workflows/claude-issue-triage.yml` | Auto-Triage neue Issues |
| `claude-dedupe-issues.yml` | `workflows/claude-dedupe-issues.yml` | Duplicate-Erkennung |
| `sweep.yml` | `workflows/sweep.yml` | Täglicher stale-issue Cleanup |
| `auto-close-duplicates.yml` | `workflows/auto-close-duplicates.yml` | Auto-Close Duplicates |
| `backfill-duplicate-comments.yml` | `workflows/backfill-duplicate-comments.yml` | Backfill alte Issues |
| `lock-closed-issues.yml` | `workflows/lock-closed-issues.yml` | Lock stale closed Issues |
| `log-issue-events.yml` | `workflows/log-issue-events.yml` | Statsig Analytics |
| `issue-lifecycle-comment.yml` | `workflows/issue-lifecycle-comment.yml` | Lifecycle Labels |
| `issue-opened-dispatch.yml` | `workflows/issue-opened-dispatch.yml` | Dispatch zu externem Repo |
| `non-write-users-check.yml` | `workflows/non-write-users-check.yml` | Security Check |
| `remove-autoclose-label.yml` | `workflows/remove-autoclose-label.yml` | Remove autoclose on activity |

**Ziel:** `OpenSIN-Code/.github/workflows/`

#### 2.2 Issue Templates (5)

**Quelle:** `.github/ISSUE_TEMPLATE/`

| Template | Quelle | Felder |
|----------|--------|--------|
| `bug_report.yml` | `bug_report.yml` | 188 Felder |
| `feature_request.yml` | `feature_request.yml` | 132 Felder |
| `documentation.yml` | `documentation.yml` | 117 Felder |
| `model_behavior.yml` | `model_behavior.yml` | 220 Felder |
| `config.yml` | `config.yml` | Blank issues disabled |

**Ziel:** `OpenSIN-Code/.github/ISSUE_TEMPLATE/`

#### 2.3 Automation Scripts (8)

**Quelle:** `scripts/`

| Script | Sprache | Zweck |
|--------|---------|-------|
| `gh.sh` | Bash | Secure GitHub CLI wrapper |
| `edit-issue-labels.sh` | Bash | Add/remove GitHub labels |
| `comment-on-duplicates.sh` | Bash | Post duplicate detection comment |
| `lifecycle-comment.ts` | TypeScript (Bun) | Post lifecycle label comments |
| `issue-lifecycle.ts` | TypeScript (Bun) | Lifecycle label definitions |
| `sweep.ts` | TypeScript (Bun) | Mark stale/close expired issues |
| `backfill-duplicate-comments.ts` | TypeScript (Bun) | Backfill old issues |
| `auto-close-duplicates.ts` | TypeScript (Bun) | Close duplicates after 3 days |

---

### PHASE 3: Claw-Code Rust Engine (~15.000 Zeilen Rust)

#### 3.1 API Layer (`claw-code-main/rust/crates/api/`)

| Datei | Zeilen | Zweck | Migration |
|-------|--------|-------|-----------|
| `lib.rs` | ~50 | Module exports | `packages/opensin-sdk/src/api/` |
| `client.rs` | ~500 | ProviderClient abstraction | **KRITISCH** - Core API Client |
| `types.rs` | ~500 | StreamEvent, MessageRequest, etc. | **KRITISCH** - Type definitions |
| `error.rs` | ~135 | ApiError enum | Fehlerbehandlung |
| `sse.rs` | ~279 | SseParser | SSE Streaming |
| `providers/mod.rs` | ~239 | Provider trait, model registry | **KRITISCH** - Multi-model support |
| `providers/claw_provider.rs` | ~1046 | Anthropic API client | OpenAI API Client → `providers/openai_provider.rs` |
| `providers/openai_compat.rs` | ~1050 | OpenAI/xAI compatible API | OpenAI-compatible calls via OCI proxy |

**Besonderheit:** OpenAI API via OCI Proxy (`http://92.5.60.87:4100/v1`) statt Anthropic API

#### 3.2 Runtime Layer (`claw-code-main/rust/crates/runtime/`)

| Datei | Zeilen | Zweck | Migration |
|-------|--------|-------|-----------|
| `lib.rs` | ~100 | Module exports | - |
| `conversation.rs` | ~600 | ConversationRuntime, tool loop | **KRITISCH** - Core engine |
| `config.rs` | ~500 | Multi-source config loading | **KRITISCH** - Config system |
| `session.rs` | ~436 | Session persistence | Session management |
| `compact.rs` | ~702 | Session compaction algorithm | **KEY INNOVATION** - Context window |
| `bash.rs` | ~283 | Bash execution with sandbox | Tool execution |
| `file_ops.rs` | ~550 | Read/write/edit/glob/grep | File operations |
| `oauth.rs` | ~589 | OAuth flow with PKCE | Token management |
| `sandbox.rs` | ~364 | Linux namespace isolation | Security sandbox |
| `hooks.rs` | ~357 | Pre/Post tool hooks | Hook pipeline |
| `prompt.rs` | ~795 | System prompt building | **KRITISCH** - Instruction files |
| `mcp.rs` | ~300 | MCP tool naming, signatures | MCP integration |
| `mcp_client.rs` | ~234 | Transport abstraction | MCP transports |
| `mcp_stdio.rs` | ~1400+ | JSON-RPC over stdio | MCP protocol |
| `permissions.rs` | ~200 | Permission mode enforcement | Permission system |
| `remote.rs` | ~401 | Upstream proxy support | CCR integration |
| `usage.rs` | ~310 | Token usage tracking | Cost estimation |

#### 3.3 Tools Layer (`claw-code-main/rust/crates/tools/`)

| Tool | Permissions | Features |
|------|-------------|----------|
| **BashTool** | `DangerFullAccess` | Timeout, background, sandbox |
| **ReadTool** | `ReadOnly` | Offset/limit, line range |
| **WriteTool** | `DangerFullAccess` | Create/update, structured patch |
| **EditTool** | `DangerFullAccess` | Single/replace-all, git diff |
| **GlobTool** | `ReadOnly` | Pattern matching, truncation |
| **GrepTool** | `ReadOnly` | Regex, context lines, multiline |
| **WebFetchTool** | `ReadOnly` | URL content retrieval |
| **WebSearchTool** | `ReadOnly` | Web search queries |
| **TodoTool** | `WorkspaceWrite` | Task tracking |
| **SkillTool** | `ReadOnly` | Dynamic skill loading |
| **AgentTool** | `WorkspaceWrite` | Sub-agent spawning |
| **ToolSearchTool** | `ReadOnly` | MCP tool discovery |
| **NotebookEditTool** | `WorkspaceWrite` | Jupyter notebook modification |
| **SleepTool** | `ReadOnly` | Delay execution |
| **BriefTool** | `ReadOnly` | Context summarization |
| **ConfigTool** | `ReadOnly` | Runtime config inspection |
| **StructuredOutputTool** | `ReadOnly` | JSON output formatting |
| **REPLTool** | `WorkspaceWrite` | Interactive shell |
| **PowerShellTool** | `DangerFullAccess` | Windows shell execution |

#### 3.4 Slash Commands Layer (`claw-code-main/rust/crates/commands/`)

| Kategorie | Commands |
|------------|----------|
| **Session** | `/new`, `/continue`, `/sessions`, `/compact`, `/clear` |
| **Navigation** | `/browse`, `/find`, `/grep`, `/read`, `/open` |
| **Tools** | `/bash`, `/web`, `/todo`, `/skills`, `/agents`, `/tools` |
| **Project** | `/review`, `/git`, `/package`, `/docs`, `/test`, `/build`, `/lint` |
| **System** | `/help`, `/status`, `/model`, `/permission`, `/config`, `/env` |
| **Template** | `/clone`, `/new`, `/list` |

#### 3.5 CLI Layer (`claw-code-main/rust/crates/claw-cli/`)

| Datei | Zeilen | Zweck |
|-------|--------|-------|
| `main.rs` | ~1500+ | CLI entry, REPL, OAuth login |
| `args.rs` | ~104 | Clap argument parsing |
| `app.rs` | ~402 | SessionApp, slash command handling |
| `render.rs` | ~797 | Terminal renderer, markdown, spinners |
| `init.rs` | ~432 | Repo initialization, auto-detection |
| `input.rs` | ~300 | Line editor with history |

#### 3.6 Server Layer (`claw-code-main/rust/crates/server/`)

| Datei | Zeilen | Zweck |
|-------|--------|-------|
| `lib.rs` | ~442 | Axum-based HTTP API, SSE streaming |

#### 3.7 LSP Layer (`claw-code-main/rust/crates/lsp/`)

| Datei | Zeilen | Zweck |
|-------|--------|-------|
| `lib.rs` | ~300 | LSP server integration |
| `types.rs` | ~186 | LSP context enrichment types |
| `manager.rs` | ~191 | Multi-server manager |
| `client.rs` | ~463 | JSON-RPC LSP client |
| `error.rs` | ~62 | LSP error types |

---

### PHASE 4: DevContainer & Docker Setup

#### 4.1 DevContainer

**Quelle:** `claude-code-main/.devcontainer/`

| Datei | Beschreibung |
|-------|--------------|
| `Dockerfile` | Node.js 20 + Claude Code + dev tools |
| `devcontainer.json` | VSCode remote container config |
| `init-firewall.sh` | IPTables firewall für Sandbox |

**Ziel:** `OpenSIN-Code/.devcontainer/`

#### 4.2 Beispiel-Konfigurationen

**Quelle:** `claude-code-main/examples/`

**Settings:**
```
examples/settings/settings-lax.json           → strict mode disabled
examples/settings/settings-strict.json        → deny web, ask for bash
examples/settings/settings-bash-sandbox.json  → bash must run in sandbox
```

**Hooks:**
```
examples/hooks/bash_command_validator_example.py  → PreToolUse hook example
```

---

### PHASE 5: Settings & Configuration Patterns

#### 5.1 Security Settings Schema

```jsonc
// Lax (plugins disabled, no bypass)
{
  "permissions": { "disableBypassPermissionsMode": "disable" },
  "strictKnownMarketplaces": []
}

// Strict (deny web, ask for bash)
{
  "permissions": {
    "disableBypassPermissionsMode": "disable",
    "ask": ["Bash"],
    "deny": ["WebSearch", "WebFetch"]
  },
  "allowManagedPermissionRulesOnly": true,
  "allowManagedHooksOnly": true
}

// Sandbox (bash must run in sandbox)
{
  "allowManagedPermissionRulesOnly": true,
  "sandbox": { "enabled": true }
}
```

#### 5.2 Hook Configuration Schema

```jsonc
{
  "description": "Hook description",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PLUGIN_ROOT}/hooks/script.py"
          }
        ]
      }
    ]
  }
}
```

#### 5.3 Agent Frontmatter Schema

```yaml
---
name: agent-identifier
description: "Use this agent when..." # Required triggers
model: sonnet|opus|haiku|inherit
color: blue|cyan|green|yellow|magenta|red
tools: ["Tool1", "Tool2"]
---
```

---

### PHASE 6: Frontend-Design Skill

#### 6.1 Skill Structure

**Quelle:** `claude-code-main/plugins/frontend-design/skills/frontend-design/SKILL.md`

| Komponente | Beschreibung |
|------------|--------------|
| `SKILL.md` | Hauptdokumentation (1500-2000 Wörter) |
| `references/` | Detaillierte Dokumentation |
| `examples/` | Arbeitscode-Beispiele |
| `scripts/` | Utilities |

**Ziel:** `OpenSIN-Code/packages/plugins/sin-frontend-design/`

---

### PHASE 7: Marketplace & Extensions

#### 7.1 VSCode Extensions

**Quelle:** `claude-code-main/.vscode/extensions.json`

```json
{
  "recommendations": ["..."]
}
```

**Ziel:** `OpenSIN-Code/.vscode/extensions.json`

#### 7.2 Plugin Marketplace Registry

**Quelle:** `claude-code-main/.claude-plugin/marketplace.json`

13 bundled plugins registry

---

## BRANDING-MAPPING (sin-claude → OpenSIN-AI)

### Datei-basiertes Branding

| Quelle (sin-claude) | Ziel (OpenSIN-AI) |
|---------------------|-------------------|
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
| `CLAW.md` | `SIN.md` |

### Command Branding

| Quelle | Ziel |
|--------|------|
| `/good-claude` | `/good-sin` |
| `/ant-trace` | `/sin-trace` |
| `mcp/claudeai.ts` | `mcp/opensinai.ts` |

### Plugin Branding

| Quelle | Ziel |
|--------|------|
| `Ralph Wiggum Plugin` | `Sin Loop Plugin` |
| `Hookify` | `SinHookify` |
| `code-review` | `sin-code-review` |
| `feature-dev` | `sin-feature-dev` |
| `plugin-dev` | `sin-plugin-dev` |

### Analytics Branding

| Quelle | Ziel |
|--------|------|
| `growthbook/statsig` | `opensin-analytics` (eigen!) |

---

## MIGRATIONS-REIHENFOLGE (Empfohlen)

### Sofort (P0 Blocker beheben)

1. **tsconfig.json bereinigen** - Alle Module müssen kompilierbar sein
2. **opensin-code-vscode/ implementieren** - 14 leere Dateien füllen
3. **CODE_OF_CONDUCT.md schreiben** - Professionelles CoC erstellen
4. **CI-Workflows reparieren** - Fehlerhafte Referenzen korrigieren

### Phase 1: Plugin-System (Hoch priorisiert)

5. **13 Plugins portieren** - Mit sin-* Branding
6. **12 Slash Commands migrieren** - Aus .claude/commands und plugins/
7. **16 Agenten definieren** - YAML Frontmatter mit color/model
8. **4 Hook Handler übernehmen** - PreToolUse, SessionStart

### Phase 2: GitHub Automation

9. **11 GitHub Actions Workflows** - Issue-Triage, Dedup, Lifecycle
10. **5 Issue Templates** - Bug-Report, Feature-Request, etc.
11. **8 Automation Scripts** - gh.sh, lifecycle-comment.ts, etc.

### Phase 3: Rust Engine (Kern-Features)

12. **API Layer portieren** - Client, Types, SSE Parser, Provider
13. **Runtime Engine** - Conversation, Session, Compact
14. **Tool Registry** - 17 Built-in Tools
15. **Slash Commands** - 27 Commands aus Rust
16. **CLI Interface** - REPL, Render, Input

### Phase 4: Security & Config

17. **Permission System** - Auto/Ask/Readonly, Sandbox
18. **Hook System** - PreToolUse, PostToolUse
19. **OAuth Flow** - PKCE, Token Management
20. **Config Merging** - Multi-Source JSON

### Phase 5: Advanced Features

21. **MCP Integration** - STDIO, OAuth, XAA
22. **LSP Integration** - Multi-Server, Diagnostics
23. **Server/Proxy** - Axum HTTP API
24. **Remote Control** - WebSocket, SSH Mode

---

## GESCHÄTZTER MIGRATIONS-AUFWAND

| Phase | Dateien | Zeilen | Aufwand (Tage) |
|-------|---------|--------|----------------|
| P0 Fixes | 15 | ~500 | 1-2 |
| Phase 1: Plugin-System | 45 | ~8.000 | 5-7 |
| Phase 2: GitHub Automation | 24 | ~3.500 | 3-4 |
| Phase 3: Rust Engine | 50 | ~15.000 | 10-15 |
| Phase 4: Security & Config | 20 | ~4.000 | 3-5 |
| Phase 5: Advanced Features | 30 | ~8.000 | 5-7 |
| **GESAMT** | **~184** | **~39.000** | **27-40** |

---

## DATEI-REFERENZEN (Quelldateien)

### claude-code-main (184 Dateien)

```
claude-code-main/
├── README.md
├── LICENSE.md
├── SECURITY.md
├── CHANGELOG.md
├── .devcontainer/
│   ├── Dockerfile
│   ├── devcontainer.json
│   └── init-firewall.sh
├── .github/
│   ├── workflows/ (11 Dateien)
│   └── ISSUE_TEMPLATE/ (5 Dateien)
├── .vscode/extensions.json
├── .claude-plugin/marketplace.json
├── .claude/commands/ (3 Dateien)
├── scripts/ (8 Dateien)
├── examples/
│   ├── settings/ (4 Dateien)
│   └── hooks/ (1 Datei)
└── plugins/ (13 Plugins)
    ├── README.md
    ├── agent-sdk-dev/
    ├── claude-opus-4-5-migration/
    ├── code-review/
    ├── commit-commands/
    ├── explanatory-output-style/
    ├── feature-dev/
    ├── frontend-design/
    ├── hookify/
    ├── learning-output-style/
    ├── plugin-dev/
    ├── pr-review-toolkit/
    ├── ralph-wiggum/
    └── security-guidance/
```

### claw-code-main (182 Dateien)

```
claw-code-main/
├── README.md
├── CLAW.md
├── PARITY.md
├── rust/ (Haupt-Implementierung)
│   ├── Cargo.toml
│   └── crates/
│       ├── api/ (7 Dateien)
│       ├── runtime/ (18 Dateien)
│       ├── tools/ (1 Datei, ~1600 Zeilen)
│       ├── plugins/ (2 Dateien)
│       ├── commands/ (1 Datei, ~1600 Zeilen)
│       ├── claw-cli/ (6 Dateien)
│       ├── lsp/ (5 Dateien)
│       ├── server/ (1 Datei)
│       └── compat-harness/ (1 Datei)
├── src/ (Python mirroring - archive)
│   ├── reference_data/ (Snapshots)
│   └── packages/ (26 Placeholder)
├── assets/
├── tests/
└── CLAW.md
```

---

## NÄCHSTE SCHRITTE

1. [ ] **P0 Blocker beheben** (tsconfig, leere Dateien)
2. [ ] **GitHub Issue erstellen** für Migrations-Tasks
3. [ ] **Branch erstellen** `feature/port-from-sin-claude`
4. [ ] **Plugin-System als erstes migrieren** (visibelster Impact)
5. [ ] **Rust Engine als Kern-Backend** (leistungsstärkster Part)

---

## WICHTIGE HINWEISE

1. **Keine Cross-Repo-Abhängigkeiten:** OpenSIN-AI und sin-claude dürfen nichts voneinander wissen. Jedes hat sein eigenes Branding.
2. **Analytics ersetzen:** GrowthBook/Statsig durch OpenSIN-eigene Lösung ersetzen.
3. **API-Endpoint anpassen:** Anthropic API → OpenAI via OCI Proxy (`http://92.5.60.87:4100/v1`)
4. **Env-Vars umbenennen:** Alle `CLAUDE_CODE_*` → `OPENSIN_*`
5. **Tests schreiben:** Für jede migrierte Komponente Tests erstellen
6. **Dokumentation:** Alle Docs müssen OpenSIN-Branding haben

---

**Erstellt von OpenSIN-AI Fleet** - powered by upgraded-opencode-stack
