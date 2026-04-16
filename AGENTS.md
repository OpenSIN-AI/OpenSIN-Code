# Agent: OpenSIN-Code

**Team:** OpenSIN-AI
**Protocol:** A2A (Agent-to-Agent)
**Status:** Active
**Repository:** https://github.com/OpenSIN-AI/OpenSIN-Code

## Capabilities

OpenSIN-Code is the core code agent for the OpenSIN ecosystem, providing intelligent code generation, analysis, and refactoring capabilities.

## Communication

- **Input:** A2A messages from orchestrator
- **Output:** A2A messages to other agents
- **MCP:** Standard OpenSIN MCP servers

## Security

- All operations logged to OpenSIN-Ledger
- Requires authorization token
- Guardrails enforced on all inputs/outputs

## Setup

```bash
git clone https://github.com/OpenSIN-AI/OpenSIN-Code.git
cd OpenSIN-Code
bun install
bun run build
bun run test
```

## License

MIT
