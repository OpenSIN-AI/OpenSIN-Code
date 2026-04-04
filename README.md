# SIN Code CLI

[![SIN Code CLI](https://img.shields.io/badge/SIN%20Code%20CLI-latest-green)](https://my.openSIN.ai)
[![Node 18+](https://img.shields.io/badge/node-18%2B-339933)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-Proprietary-red)](https://my.openSIN.ai)

The proprietary CLI for SIN Solver — an enterprise-grade AI coding platform that combines autonomous code generation, multi-agent swarm coordination, and semantic code intelligence into a single sovereign tool.

## Architecture

```
OpenSIN-Code/
├── packages/
│   ├── opencode/          # Core CLI engine (@opensin/code)
│   └── sdk/               # @opensin/sdk — JavaScript/TypeScript SDK
├── kairos-vscode/         # VS Code Extension (Mode Selector, Chat, Swarm)
└── Docs/                  # Operations and dispatch payloads
```

## Components

### SIN Code CLI (`packages/opencode`)
- AI-powered code generation via 100+ LLM providers and 1000+ models (model-agnostic architecture)
- Subagent orchestration (explore, librarian, oracle, hephaestus, metis, momus)
- Swarm coordination for parallel agent execution
- Hermes dispatch for cloud execution on HF VMs
- sincode.json configuration with opencode.json fallback

### SIN Code SDK (`packages/sdk`)
- `@opensin/sdk` — JavaScript/TypeScript SDK for SIN Solver API
- Model routing, Simone MCP integration
- Type-safe API client

### Kairos VS Code Extension (`kairos-vscode/`)
- Mode Selector (Architect, Code, Debug, Ask, SIN-Code)
- React Webview Sidebar with Chat Interface
- RPC CLI Bridge to sin-code via opencode CLI
- LSP Provider via Simone MCP
- Swarm Coordinator (dispatch explore/librarian/oracle agents)
- BUDDY Gamification System
- Background Memory Consolidation (AGENTS.md pattern)
- Inline Code Actions (AI Fix, Refactor, Explain)
- Testing Suite (Mocha + @vscode/test-electron)

## Quick Start

```bash
# Install globally
npm install -g @opensin/code

# Run in a project
sincode

# Or use alias
sin --help

# Build VS Code Extension
cd kairos-vscode
npm install
npm run compile
npx vsce package --no-dependencies
```

## License

This software is **proprietary**. See [LICENSE](LICENSE) file for details.

Part of the **SIN Solver** platform — https://my.openSIN.ai

## Documentation

- [AGENTS.md](AGENTS.md) — Agent configuration and behavior
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines
- [SECURITY.md](SECURITY.md) — Security policy

> SIN Code connects to **100+ LLM providers** and **1000+ models** — including OpenAI, Anthropic, Google, Mistral, Groq, Cerebras, TogetherAI, Ollama, local models, and 90+ more. Bring your own API key or use our free tier.
