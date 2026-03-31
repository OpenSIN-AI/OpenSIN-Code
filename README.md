<div align="center">
  <img src="assets/logo.png" alt="OpenSIN-Code" width="680" />
  <br/><br/>
  <strong>The autonomous AI coding stack powering the OpenSIN fleet.</strong>
  <br/>
  <em>OpenCode CLI · Antigravity Models · OMOC Swarm · A2A Agents · Skills · MCPs</em>
  <br/><br/>

  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![OpenSIN](https://img.shields.io/badge/Platform-OpenSIN-1a1a2e)](https://opensin.ai)
  [![Bugs](https://img.shields.io/badge/Bug_Library-Issues-red)](https://github.com/OpenSIN-AI/OpenSIN-Code/issues?q=label%3Abug)
  [![omoc-swarm](https://img.shields.io/badge/Plugin-omoc--swarm-brightgreen)](https://github.com/Delqhi/opencode-omoc-swarm)

</div>

---

## What is OpenSIN-Code?

**OpenSIN-Code** is the **Single Source of Truth (SSOT)** for the entire OpenSIN autonomous coding stack. It is not a fork — it is an independent, modular repository that:

- Tracks upstream [anomalyco/opencode](https://github.com/anomalyco/opencode) automatically via a watcher
- Hosts all **custom plugins, skills, MCPs, providers, tools, and wrappers** built by the OpenSIN fleet
- Distributes a **consistent, verified configuration** to every machine (Mac, OCI VM, HF VM) in the fleet
- Serves as the **Bug Library** for all known OpenCode/fleet issues

> Every machine in the fleet pulls from this repo. If it's not here, it doesn't exist.

---

## Repository Structure

Every module has its own `README.md` with quickstart guide and best practices.

```
OpenSIN-Code/
├── assets/                    # Logos, images, visual assets
├── OpenCode/                  # Upstream opencode CLI (auto-synced from anomalyco/opencode)
├── OC-Konfigurationen/        # Master opencode.json + system configs (SSOT)
├── OC-Plugins/                # Upstream/community plugins (oh-my-opencode, etc.)
├── SIN-Plugins/               # OpenSIN custom plugins (omoc-swarm, registry, state)
├── Provider/                  # Custom OAuth + Model Providers (Antigravity)
├── MCPs/                      # MCP server registry (sin-google-docs, sin-telegrambot, ...)
├── Skills/                    # Global skills (/create-a2a, /sovereign-research, ...)
├── Tools/                     # Standalone bash/python tools
├── Watcher/                   # Background daemons (ssot-daemon.sh, upstream-sync.sh)
├── Wrapper/                   # CLI shims + tmux orchestrators (oc-swarm)
└── OAR-Skript/                # Open Auth Rotator (Antigravity token rotation)
```

---

## Quick Start

### 1. Clone & Deploy

```bash
git clone https://github.com/OpenSIN-AI/OpenSIN-Code.git
cd OpenSIN-Code/Watcher
bash ssot-daemon.sh install
```

The daemon syncs this repo into `~/.config/opencode/` and keeps it live across all machines.

### 2. Verify Models

```bash
opencode run "Test" --model google/antigravity-gemini-3.1-pro
opencode run "Test" --model google/antigravity-claude-sonnet-4-6
```

Both should respond immediately. If not, check the [Bug Library](https://github.com/OpenSIN-AI/OpenSIN-Code/issues?q=label%3Abug).

---

## Supported Models

| Model | Provider | Status |
|---|---|---|
| `antigravity-gemini-3.1-pro` | google (Antigravity) | ✅ Live |
| `antigravity-gemini-3-flash` | google (Antigravity) | ✅ Live |
| `antigravity-claude-sonnet-4-6` | google (Antigravity) | ✅ Live |
| `antigravity-claude-opus-4-6-thinking` | google (Antigravity) | ✅ Live |
| `openai/gpt-5.4` | openai (OCI Proxy) | ✅ Default |
| `nvidia-nim/qwen-3.5-397b` | nvidia-nim | ✅ Live |

---

## Bug Library

All known bugs are tracked as GitHub Issues with the `bug` label.

| # | Title | Status |
|---|---|---|
| [#4](https://github.com/OpenSIN-AI/OpenSIN-Code/issues/4) | `omoc-swarm` tool names use dots → 400 Bad Request on all models | ✅ Fixed |

[View all bugs →](https://github.com/OpenSIN-AI/OpenSIN-Code/issues?q=label%3Abug)

---

## Key Rules

- **Global config only** — never edit local project `.opencode/` directly; changes go here first, then get synced
- **Tool names** must match `^[a-zA-Z0-9_-]+$` — no dots, no spaces, no special chars
- **No direct LLM calls** in agents — always use `opencode run --format json`
- **No Playwright/Selenium** — only `nodriver` + `webauto-nodriver-mcp` for browser automation

---

## Links

| Resource | URL |
|---|---|
| OpenSIN Platform | https://opensin.ai |
| A2A Dashboard | https://a2a.delqhi.com |
| Bug Tracker | https://github.com/OpenSIN-AI/OpenSIN-Code/issues |
| omoc-swarm source | https://github.com/Delqhi/opencode-omoc-swarm |
| Documentation | https://github.com/OpenSIN-AI/documentation |

---

<div align="center">
  <sub>Built with the OpenSIN autonomous fleet · Powered by Antigravity</sub>
</div>
