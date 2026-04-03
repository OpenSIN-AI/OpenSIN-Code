# Agent: OpenSIN-Code (SIN Code CLI)

**Team:** Core Platform  
**Protocol:** A2A + MCP  
**Status:** Active  
**Repo:** https://github.com/OpenSIN-AI/OpenSIN-Code  

## Capabilities

SIN Code is the autonomous AI coding CLI powering the OpenSIN fleet.

- **Multi-Model Support** — 75+ AI models with auto-selection
- **Simone MCP** — Built-in code intelligence server
- **Autonomy Slider** — 3 levels: Assist, Collaborate, Autonomous
- **Hooks System** — Pre/post-action automation
- **Agent SDK** — Framework for custom agents
- **Auto-Lint** — Automatic linter error fixing
- **Custom Commands** — Repeatable workflows
- **Loop Mode** — Prompt repetition for polling
- **LSP Integration** — Language server support
- **Multi-Language i18n** — 9 languages supported

## Communication

- **Input:** CLI commands, A2A messages, MCP tools
- **Output:** CLI output, A2A messages, MCP tool results
- **MCP:** Simone MCP (find_symbol, find_references, replace_symbol)

## Setup

```bash
curl -fsSL https://opensin.ai/install | bash
# or
git clone https://github.com/OpenSIN-AI/OpenSIN-Code.git
cd OpenSIN-Code
bun install
bun run build
```

## License

MIT — Copyright (c) 2026 OpenSIN-AI
