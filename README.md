# 🚀 OpenSIN-Code (Enterprise Autonomous Edition)

<div align="center">
  <img src="https://raw.githubusercontent.com/anomalyco/opencode/main/assets/logo.png" alt="OpenSIN-Code" width="120" />
</div>

Welcome to **OpenSIN-Code**, the fully independent, SSOT-driven ecosystem repository for the OpenSIN-AI autonomous fleet.

This repository completely replaces the old fork-based architecture. It is the **Single Source of Truth (SSOT)** for all CLI configurations, plugins, skills, and wrappers.

## 📂 Repository Architecture

We maintain a strict, modular directory structure. **Every module contains its own `README.md` with best practices and quickstart guides.**

- 📁 **[`OpenCode/`](OpenCode/)**: The original `anomalyco/opencode` codebase. Automatically synced via our upstream watcher.
- 📁 **[`OC-Konfigurationen/`](OC-Konfigurationen/)**: The master `opencode.json` and system configs.
- 📁 **[`OC-Plugins/`](OC-Plugins/)**: Upstream community plugins (e.g., `oh-my-opencode`).
- 📁 **[`SIN-Plugins/`](SIN-Plugins/)**: Our custom, proprietary OpenCode plugins (e.g., OMOC Swarm).
- 📁 **[`Provider/`](Provider/)**: Custom OAuth and Model Providers (e.g., Antigravity).
- 📁 **[`MCPs/`](MCPs/)**: Model Context Protocol server registries.
- 📁 **[`Skills/`](Skills/)**: All global skills (`/create-a2a`, `/sovereign-research`, etc.).
- 📁 **[`Tools/`](Tools/)**: Standalone bash/python tools.
- 📁 **[`Watcher/`](Watcher/)**: Background daemons (`ssot-daemon.sh`, `upstream-sync.sh`).
- 📁 **[`Wrapper/`](Wrapper/)**: CLI shims and tmux orchestrators (`oc-swarm`).
- 📁 **[`OAR-Skript/`](OAR-Skript/)**: Open Auth Rotator integrations.

## 🛠️ Team Member Onboarding

1. **Clone this repository** to your local machine.
2. Navigate to `Watcher/` and execute the `ssot-daemon.sh` setup.
3. The daemon will automatically deploy this entire repository structure into your `~/.config/opencode/` directory and keep it synced every 60 seconds.
4. Read the `README.md` inside each folder before making architectural changes.

**Zero Local Drift Policy**: Any local modifications to `.opencode` folders in your projects will be immediately overwritten by the Watcher. If you need a new skill or plugin, submit a Pull Request to this repository!
