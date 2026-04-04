# OpenSIN Code

The core CLI and VS Code Extension for OpenSIN — an AI-powered coding platform that combines the best of Claude Code, Cursor, and Windsurf into a single, sovereign tool.

## Architecture

```
OpenSIN-Code/
├── packages/
│   ├── opencode/          # Core CLI engine
│   └── sdk/               # @opensin/sdk — JavaScript/TypeScript SDK
├── opensin-code-vscode/   # VS Code Extension (Mode Selector, Chat, Swarm)
└── hermes-dispatch-opensin-code.json  # Cloud execution dispatch payload
```

## Components

### OpenSIN CLI (`packages/opencode`)
- AI-powered code generation via 100+ LLM providers and 1000+ models (model-agnostic architecture)
- Subagent orchestration (explore, librarian, oracle, hephaestus, metis, momus)
- Swarm coordination for parallel agent execution
- Hermes dispatch for cloud execution on HF VMs

### OpenSIN SDK (`packages/sdk`)
- `@opensin/sdk` — JavaScript/TypeScript SDK for OpenSIN API
- Model routing, Simone MCP integration
- Type-safe API client

### OpenSIN VS Code Extension (`opensin-code-vscode/`)
- Mode Selector (Architect, Code, Debug, Ask, OpenSIN-Code)
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
opensin code

# Build VS Code Extension
cd opensin-code-vscode
npm install
npm run compile
npx vsce package --no-dependencies
```

## License

SEE LICENSE IN LICENSE (Proprietary — SIN-Solver Team)

## Documentation

- [AGENTS.md](AGENTS.md) — Agent configuration and behavior
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines
- [SECURITY.md](SECURITY.md) — Security policy

> OpenSIN connects to **100+ LLM providers** and **1000+ models** — including OpenAI, Anthropic, Google, Mistral, Groq, Cerebras, TogetherAI, Ollama, local models, and 90+ more. Bring your own API key or use our free tier.
