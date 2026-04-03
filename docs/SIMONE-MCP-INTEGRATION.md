# Simone MCP — Built-In Runtime Integration

## Overview

Simone MCP is the proprietary codebase intelligence engine for SIN Code CLI. It provides deep code understanding, symbol resolution, reference finding, and code transformation capabilities. Simone is a **built-in component** of SIN Code CLI — it is not a separate open-source plugin.

## A2A Card

| Field | Value |
|-------|-------|
| **Agent Name** | A2A-SIN-Simone-MCP |
| **Type** | MCP Server / Code Intelligence |
| **License** | Proprietary (part of SIN Code CLI) |
| **HF Space** | https://delqhi-simone-mcp.hf.space |
| **Status** | Active — built into SIN Code runtime |

## Integration with SIN Code

### SDK Integration

Simone is exposed through the `@opensin/sdk` package as a first-class export:

```typescript
// packages/sdk/opensin-sdk/src/index.ts
export { Simone, type SimoneOptions } from './simone.js';
```

The `Simone` class (`packages/sdk/opensin-sdk/src/simone.ts`) provides three core methods:

| Method | Description |
|--------|-------------|
| `findSymbol(name, filePath?)` | Locate a symbol definition in the codebase |
| `findReferences(name, filePath)` | Find all references to a symbol |
| `replaceSymbol(name, filePath, newBody)` | Replace a symbol's implementation |

These methods delegate to the `sincode` CLI, which routes requests through the Simone MCP server at runtime.

### Runtime Architecture

```
+---------------------------------------------+
|              SIN Code CLI                    |
|  +---------------------------------------+   |
|  |         @opensin/sdk                   |   |
|  |  +-------------+  +----------------+  |   |
|  |  |   SIN class  |  |  Simone class  |  |   |
|  |  | (LLM chat)   |  | (code intel)   |  |   |
|  |  +------+-------+  +------+---------+  |   |
|  |         |                   |           |   |
|  |         +--------+----------+           |   |
|  |                  v                       |   |
|  |          sincode CLI                     |   |
|  +------------------+-----------------------+   |
+---------------------+---------------------------+
                      | execa('sincode', [...])
                      v
+---------------------------------------------+
|         Simone MCP Server                    |
|  (HF Space: delqhi-simone-mcp.hf.space)     |
|  - Symbol resolution                         |
|  - Reference finding                         |
|  - Code transformation                       |
+---------------------------------------------+
```

### Configuration

Simone MCP is configured via the global OpenCode configuration (`~/.config/opencode/opencode.json`) as a proprietary MCP entry. It is **not** defined in the open-source `MCPs/mcp.json` template, as it ships as part of the closed-source SIN Code CLI distribution.

## Runtime Verification Steps

To verify Simone MCP is active at runtime:

### 1. SDK Import Check

```bash
# Verify Simone is exported from the SDK
node -e "const sdk = require('@opensin/sdk'); console.log('Simone:', typeof sdk.Simone)"
# Expected: Simone: function
```

### 2. CLI Integration Check

```bash
# Verify sincode CLI can reach Simone MCP
sincode run "Find symbol: SIN in packages/sdk/opensin-sdk/src/sin.ts" --format json
# Expected: JSON response with symbol location data
```

### 3. HF Space Health Check

```bash
# Verify the Simone MCP HF Space is reachable
curl -s -o /dev/null -w "%{http_code}" https://delqhi-simone-mcp.hf.space
# Expected: 200
```

### 4. MCP Server Discovery

```bash
# List available MCP tools (Simone should appear in the tool list)
# Via webauto-nodriver-mcp or direct MCP protocol call
curl -X POST http://127.0.0.1:8765/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Source Files

| File | Purpose |
|------|---------|
| `packages/sdk/opensin-sdk/src/simone.ts` | Simone SDK class definition |
| `packages/sdk/opensin-sdk/src/index.ts` | SDK barrel export |
| `MCPs/mcp.json` | MCP server template (Simone configured at runtime, not in OSS template) |

## License Note

Simone MCP is **proprietary** and a fixed component of SIN Code CLI. It is **not** open-source and must never be included in the Apache 2.0 licensed OpenSIN repository. See `AGENTS.md` section on license separation for details.
