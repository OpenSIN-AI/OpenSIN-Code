# MCP Patterns Reference

> Quick reference for SIN MCP server patterns. Used by `/create-a2a-mcp` skill.

## Pattern A: McpServer.registerTool() — PRODUCTION (PREFERRED)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({ name: 'sin-myagent', version: '0.1.0' });

// Simple tool (no params)
server.registerTool('sin_myagent_help',
  { description: 'Describe available actions.' },
  async () => ({
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  })
);

// Tool with params
server.registerTool('sin_myagent_do_thing',
  { description: 'Do a thing.', inputSchema: { input: z.string(), confirm: z.boolean().optional() } },
  async (args) => {
    const result = await executeAction({ action: 'myagent.do_thing', ...args }, agentConfig);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Used by:** sin-google-apps, sin-server, sin-passwordmanager, sin-authenticator

## Pattern B: TOOLS Array + setRequestHandler — TEMPLATE

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const TOOLS = [
  { name: 'sin_myagent_help', description: '...', inputSchema: {...}, handler: async () => ... },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS.map(...) }));
server.setRequestHandler(CallToolRequestSchema, async (req) => { ... });
```

**Used by:** Template agents, sin-research (early versions)

## mcp-config.json Patterns

### Minimal (dist-relative)
```json
{
  "mcpServers": {
    "sin-myagent": {
      "command": "node",
      "args": ["dist/src/cli.js", "serve-mcp"]
    }
  }
}
```

### With environment variables
```json
{
  "mcpServers": {
    "sin-myagent": {
      "command": "node",
      "args": ["dist/src/cli.js", "serve-mcp"],
      "env": {
        "SIN_MYAGENT_HOST": "127.0.0.1",
        "SIN_MYAGENT_PORT": "45872"
      }
    }
  }
}
```

### Bin wrapper style
```json
{
  "mcpServers": {
    "sin-myagent": {
      "command": "bin/sin-myagent",
      "args": ["serve-mcp"]
    }
  }
}
```

## opencode.json Registration

### With absolute node path
```json
"sin-myagent": {
  "type": "local",
  "command": ["node", "/abs/path/to/agent/dist/src/cli.js", "serve-mcp"],
  "enabled": true
}
```

### With bin wrapper
```json
"sin-myagent": {
  "type": "local",
  "command": ["/Users/jeremy/dev/SIN-Solver/bin/sin-myagent", "serve-mcp"],
  "enabled": true
}
```

### With environment
```json
"sin-myagent": {
  "type": "local",
  "command": ["node", "/abs/path/dist/src/cli.js", "serve-mcp"],
  "environment": { "SIN_MYAGENT_HOST": "127.0.0.1" },
  "enabled": true
}
```

## CLI Contract (src/cli.ts)

Every agent CLI MUST support:
```
serve-a2a    — Start A2A HTTP server
serve-mcp    — Start MCP stdio server
print-card   — Print agent card JSON
run-action   — Execute a single action
```

## Transport Selection

| Transport | Use Case | Notes |
|-----------|----------|-------|
| stdio | Local agents via opencode | Default. Always use. |
| streamable-http | Remote/cloud agents | POST + SSE notifications |
| SSE | Legacy only | DEPRECATED — never use for new agents |

## Existing SIN MCPs (as of 2026-03-24)

| Slug | Agent | Registration |
|------|-------|-------------|
| sin-google-apps | A2A-SIN-Google-Apps | bin wrapper |
| sin-server | A2A-SIN-Server | bin wrapper |
| sin-cloudflare | A2A-SIN-Cloudflare | bin wrapper |
| sin-passwordmanager | A2A-SIN-Passwordmanager | node dist path |
| sin-research | A2A-SIN-Research | bin wrapper |
| sin-team-worker | A2A-SIN-Team-Worker | bin wrapper |
| sin-tiktok | A2A-SIN-TikTok | bin wrapper |
| sin-tiktok-shop | A2A-SIN-TikTok-Shop | bin wrapper |
| sin-terminal | A2A-SIN-Terminal | bin wrapper |
| sin-authenticator | A2A-SIN-Authenticator | bin wrapper |
| sin-github-issues | A2A-SIN-GitHub-Issues | bin wrapper |
| sin-oraclecloud-mcp | A2A-SIN-OracleCloud | bin wrapper |
