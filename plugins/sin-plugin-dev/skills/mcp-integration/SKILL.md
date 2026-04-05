---
description: Model Context Protocol server integration for OpenSIN-Code plugins
---

# MCP Integration Skill

This skill should be used when integrating external services, APIs, databases, or tools into plugins.

## MCP Server Types

| Type | Use Case | Config |
|------|----------|--------|
| stdio | Local processes | Command + args |
| SSE | Hosted services with OAuth | URL + auth |
| HTTP | REST APIs | URL + headers |
| WebSocket | Real-time services | URL + protocols |

## Configuration

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "${env:MY_API_KEY}"
      }
    }
  }
}
```

## Best Practices

1. Use `${CLAUDE_PLUGIN_ROOT}` for portable paths
2. Use `${env:VAR_NAME}` for environment variables
3. Never hardcode credentials
4. Test MCP connection before use
5. Handle MCP server crashes gracefully
6. Use timeout for MCP tool calls
