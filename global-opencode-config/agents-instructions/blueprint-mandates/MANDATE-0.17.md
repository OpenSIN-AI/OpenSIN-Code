# MANDATE 0.17: UNIVERSAL OPENHANDS CODING LAYER (V19.1 - 2026-01-28)

**EFFECTIVE:** 2026-01-28
**SCOPE:** ALL agents, ALL chat interfaces, ALL coding requests

**🚨 ALL coding tasks from ANY source MUST be routed through `agent-04.1-openhands-codeserver`.**

**Infrastructure:**
| Component | Address | Purpose |
|-----------|---------|---------|
| **OpenHands Server** | `172.20.0.41:3041` | Main coding service |
| **CodeServer API** | `172.20.0.141:8041` | Universal API gateway |
| **Public URL** | `https://codeserver.delqhi.com` | External access |
| **Public API** | `https://codeserver-api.delqhi.com` | External API |

**Covered Interfaces (ALL MUST USE THIS):**
- SIN-Solver Cockpit Chat: `POST /webhook/cockpit-chat`
- DelqhiChat: `POST /webhook/delqhi-chat`
- Telegram @DelqhiBot: `POST /webhook/telegram`
- OpenCode CLI: `POST /webhook/opencode-cli`
- n8n Workflows: `POST /webhook/n8n`

**Available Slash Commands (29 total):**
```
/code, /code-status, /code-cancel, /tasks
/conversations, /conversation, /conversation-new, /conversation-delete
/files, /file-read, /file-write
/git-status, /git-commit, /git-diff, /git-log
/workspaces, /workspace, /workspace-switch
/models, /model, /model-switch
/config, /agents, /agent
/sessions, /session-save, /session-restore
/logs, /metrics
```

**API Endpoints (38 total):**
- Code Generation: `POST /api/code`, `GET /api/code/:taskId`
- Conversations: `GET/POST/DELETE /api/conversations`
- Files: `GET/POST/DELETE /api/files`
- Git: `/api/git/status`, `/api/git/commit`, `/api/git/diff`, `/api/git/log`
- Workspace: `/api/workspaces`, `/api/workspace/current`
- Models: `/api/models`, `/api/model/switch`
- Sessions: `/api/sessions`, `/api/sessions/save`
- Metrics: `/api/metrics`, `/api/logs`

**MCP Integration:**
```json
{
  "openhands_codeserver": {
    "type": "remote",
    "url": "http://localhost:8041",
    "enabled": true
  }
}
```

**WHY THIS EXISTS:**
- Unified coding experience across ALL interfaces
- Single source of truth for code generation
- Consistent slash commands everywhere
- Full audit trail of all coding activities
- Integration with all 26-room services

---

**Source:** ~/.config/opencode/Agents.md (Line 1169-1232)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
