# 🔌 Model Context Protocol (MCP) Servers

## Overview
This directory contains all MCP server definitions (`mcp.json`) for the OpenSIN-AI fleet.

## Registered MCPs
- **template-a2a-sin-agent**: Standard A2A agent RPC interface.
- **webauto-nodriver-mcp**: Undetectable browser automation.
- **sin-google-apps**: Workspace integration.

## Best Practices
- **Paths:** Always use absolute paths or globally resolved binaries (`npx`, `node`) in the `command` and `args` fields.
- **Environment Variables:** Define required tokens in the `env` object of the MCP definition, but NEVER commit actual secrets to this repo. Use references or secret managers.
