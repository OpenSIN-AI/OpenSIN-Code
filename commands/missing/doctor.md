---
description: Diagnose the entire system state (config, MCP, plugins, auth, etc.)
argument-hint: [--verbose]
allowed-tools: [Read, Bash]
---

# /doctor

Diagnose the entire system state.

## Usage

```bash
/doctor
/doctor --verbose
```

## What this does

Checks and reports on:
- **Config**: opencode.json validity, env vars
- **MCP**: Server connections, tool availability
- **Plugins**: Loaded plugins, hook status
- **Auth**: Token validity, provider status
- **System**: Node.js version, memory, disk space
- **Git**: Repo status, branch, uncommitted changes
- **Dependencies**: npm packages, version conflicts

## Output Format

```
🏥 OpenSIN-Code Health Check
============================
✅ Config: Valid
✅ MCP: 3 servers connected
✅ Plugins: 5 loaded
⚠️ Auth: Token expires in 2h
✅ System: Node 20.11, 8GB RAM, 50GB disk
✅ Git: main branch, clean
✅ Dependencies: All up to date
```
