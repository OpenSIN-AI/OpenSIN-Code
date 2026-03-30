# MANDATE 0.33: DOCKER CONTAINER AS MCP - WRAPPER PROTOCOL (V19.2 - 2026-01-29)

**EFFECTIVE:** 2026-01-29  
**SCOPE:** ALL AI coders, ALL Docker containers requiring MCP integration  
**STATUS:** CRITICAL ARCHITECTURE MANDATE

**🎯 PRINZIP:** Docker-Container sind HTTP APIs, KEINE nativen MCP Server. Um sie als MCP zu nutzen, MUSS ein stdio-Wrapper erstellt werden.

---

#### 📋 DAS PROBLEM

```
❌ FALSCH:
Docker Container (HTTP API) ──X──► opencode.json als "remote" MCP
                                    (Funktioniert NICHT!)

✅ RICHTIG:
Docker Container (HTTP API) ──► MCP Wrapper (stdio) ──► opencode.json als "local" MCP
                                (Node.js/Python)         (Funktioniert!)
```

**Warum funktioniert "remote" nicht?**
- OpenCode erwartet stdio Kommunikation (stdin/stdout)
- Docker Container sind HTTP Services
- Kein nativer HTTP-Support in OpenCode MCP

---

#### 🔧 DIE LÖSUNG: MCP WRAPPER PATTERN

**Jeder Docker-Container-MCP benötigt:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP WRAPPER ARCHITECTUR                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DOCKER CONTAINER (HTTP API)                                 │
│     └── Express/FastAPI Server                                  │
│     └── Port: 8xxx                                              │
│     └── Endpunkt: /api/...                                      │
│                                                                  │
│  2. MCP WRAPPER (stdio)                                         │
│     └── Wrapper Script (Node.js/Python)                         │
│     └── Konvertiert: stdio ↔ HTTP                               │
│     └── Located in: /mcp-wrappers/[name]-mcp-wrapper.js         │
│                                                                  │
│  3. OPENCODE CONFIG                                             │
│     └── Type: "local" (stdio)                                   │
│     └── Command: ["node", "wrapper.js"]                         │
│     └── Environment: API_URL, API_KEY                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 📝 WRAPPER IMPLEMENTATION (TEMPLATE)

**Node.js Wrapper Template:**

```javascript
#!/usr/bin/env node
// mcp-wrappers/[container-name]-mcp-wrapper.js

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:PORT';
const API_KEY = process.env.API_KEY;

const server = new Server(
  { name: 'container-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Tool: Example Action
async function exampleAction(param) {
  const response = await axios.post(`${API_URL}/api/action`, 
    { param },
    { headers: { 'Authorization': `Bearer ${API_KEY}` } }
  );
  return response.data;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'example_action',
    description: 'Does something useful',
    inputSchema: {
      type: 'object',
      properties: { param: { type: 'string' } },
      required: ['param']
    }
  }]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'example_action':
        return { toolResult: await exampleAction(args.param) };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
```

---

#### ⚙️ OPENCODE.JSON KONFIGURATION

```json
{
  "mcp": {
    "my-container-mcp": {
      "type": "local",
      "command": ["node", "/Users/jeremy/dev/SIN-Solver/mcp-wrappers/my-container-mcp-wrapper.js"],
      "enabled": true,
      "environment": {
        "API_URL": "https://my-container.delqhi.com",
        "API_KEY": "${MY_CONTAINER_API_KEY}"
      }
    }
  }
}
```

---

#### 📂 VERZEICHNIS STRUKTUR

```
SIN-Solver/
├── mcp-wrappers/                      # ALLE MCP Wrapper
│   ├── README.md                      # Dokumentation
│   ├── plane-mcp-wrapper.js           # Beispiel: Plane
│   ├── captcha-mcp-wrapper.js         # Beispiel: Captcha Worker
│   └── survey-mcp-wrapper.js          # Beispiel: Survey Worker
│
├── Docker/                            # Container Definitionen
│   ├── agents/
│   ├── rooms/
│   └── solvers/
│
└── ARCHITECTURE-MODULAR.md            # MODULAR ARCHITECTURE GUIDE
```

---

#### 🚨 WICHTIGE REGELN

| ❌ VERBOTEN | ✅ PFLICHT |
|-------------|-----------|
| Docker Container als `type: "remote"` in opencode.json | Wrapper als `type: "local"` (stdio) |
| Direkte HTTP URLs in opencode.json MCP config | Wrapper Script dazwischen |
| Hartkodierte IPs (172.20.0.x) | Service Names verwenden |
| Alles in eine docker-compose.yml | Jeder Container = eigene docker-compose.yml |

---

#### 📖 MUST-READ DOCUMENTATION

**BEFORE working on Docker containers:**

1. **CONTAINER-REGISTRY.md** (`/Users/jeremy/dev/SIN-Solver/CONTAINER-REGISTRY.md`)
   - Master list of ALL containers
   - Naming convention: `{CATEGORY}-{NUMBER}-{INTEGRATION}-{ROLE}`
   - Available port numbers
   - Public domain mappings

2. **ARCHITECTURE-MODULAR.md** (`/Users/jeremy/dev/SIN-Solver/ARCHITECTURE-MODULAR.md`)
   - Modular architecture guide
   - One container = one docker-compose.yml
   - Directory structure
   - Migration plan

3. **MCP WRAPPERS README** (`/Users/jeremy/dev/SIN-Solver/mcp-wrappers/README.md`)
   - How to create new wrappers
   - Examples and templates
   - Testing guidelines

---

#### 🔗 BEISPIELE (Bereits Implementiert)

```javascript
// plane-mcp-wrapper.js
const PLANE_API_URL = process.env.PLANE_API_URL || 'https://plane.delqhi.com';

// captcha-mcp-wrapper.js  
const CAPTCHA_API_URL = process.env.CAPTCHA_API_URL || 'https://captcha.delqhi.com';

// survey-mcp-wrapper.js
const SURVEY_API_URL = process.env.SURVEY_API_URL || 'https://survey.delqhi.com';
```

---

#### ⚡ WORKFLOW: Neuen Container als MCP Hinzufügen

```
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITTE FÜR NEUEN DOCKER-CONTAINER-MCP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 📋 CONTAINER-REGISTRY.md lesen                               │
│     └── Verfügbare Nummer/Port prüfen                           │
│                                                                  │
│  2. 🏗️ Docker Verzeichnis erstellen                             │
│     └── Docker/{category}/{name}/docker-compose.yml             │
│                                                                  │
│  3. 🔧 Container bauen & testen                                  │
│     └── HTTP API Endpunkte definieren                           │
│                                                                  │
│  4. 📝 MCP Wrapper erstellen                                     │
│     └── mcp-wrappers/{name}-mcp-wrapper.js                      │
│                                                                  │
│  5. ⚙️ opencode.json konfigurieren                               │
│     └── Type: "local", Command: Wrapper-Pfad                    │
│                                                                  │
│  6. 🌐 Cloudflare config aktualisieren                           │
│     └── {name}.delqhi.com → container:port                      │
│                                                                  │
│  7. ✅ Testen                                                    │
│     └── opencode --version (sollte keinen Fehler zeigen)        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

#### 🎯 ZUSAMMENFASSUNG

**MERKE:**
- Docker Container ≠ MCP Server
- Docker Container = HTTP API
- MCP Server = stdio Prozess
- Wrapper = Brücke zwischen beiden

**ALLE** Docker-Container in diesem Projekt MÜSSEN:
1. Modular sein (eigene docker-compose.yml)
2. Einen MCP Wrapper haben (für OpenCode Integration)
3. Eine delqhi.com URL haben (via Cloudflare)
4. In CONTAINER-REGISTRY.md dokumentiert sein

---

**Source:** ~/.config/opencode/Agents.md (Line 2745-3022)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
