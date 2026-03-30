# MANDATE 0.31: ALL-MCP VERZEICHNIS - GLOBALE MCP DOKUMENTATION (V19.1 - 2026-01-28)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** ALL AI coders, ALL MCP server integrations  
**STATUS:** DOCUMENTATION STANDARDS MANDATE

**🎯 PRINZIP:** Zentrale Dokumentation aller in OpenCode integrierten MCP-Server an einem einzigen Ort.

**STANDORT:** `/Users/jeremy/dev/sin-code/OpenCode/ALL-MCP/`

**STRUKTUR PRO MCP-SERVER:**

```
/dev/sin-code/OpenCode/ALL-MCP/
├── [mcp-name]/                    # z.B. canva-mcp, tavily-mcp, etc.
│   ├── readme.md                  # Allgemeine Informationen
│   ├── guide.md                   # Nutzungsanleitung
│   └── install.md                 # Installationsanleitung
```

**DATEI-BESCHREIBUNGEN:**

| Datei | Inhalt | Pflichtfelder |
|-------|--------|---------------|
| **readme.md** | Überblick, MCP-Art, Links zu Repos/Docs | MCP-Typ, Quellen, wichtige Links |
| **guide.md** | Detaillierte Nutzungsanleitung | Beispiele, Best Practices, Use-Cases |
| **install.md** | Schritt-für-Schritt Installation | Voraussetzungen, Config-Beispiele, Troubleshooting |

**BEISPIEL (canva-mcp):**

```
/dev/sin-code/OpenCode/ALL-MCP/canva-mcp/
├── readme.md          # Was ist Canva MCP, Links zu Canva API Docs
├── guide.md           # Wie nutze ich die Canva-Tools in OpenCode
└── install.md         # Wie installiere ich Canva MCP in opencode.json
```

**MANDATORY WORKFLOW BEI NEUEM MCP:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📁 NEUER MCP-SERVER DOKUMENTATION                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Ordner erstellen:                                                        │
│     /dev/sin-code/OpenCode/ALL-MCP/[mcp-name]/                             │
│                                                                              │
│  2. readme.md anlegen mit:                                                   │
│     • MCP-Typ (local/remote/docker)                                          │
│     • Offizielle Dokumentation Links                                         │
│     • GitHub Repository URL                                                  │
│     • Kurzbeschreibung der Funktionen                                        │
│     • Version/Kompatibilität                                                 │
│                                                                              │
│  3. guide.md anlegen mit:                                                    │
│     • Verfügbare Tools/Funktionen                                            │
│     • Code-Beispiele für typische Use-Cases                                  │
│     • Parameter-Beschreibungen                                               │
│     • Best Practices 2026                                                    │
│     • Limitationen & Hinweise                                                │
│                                                                              │
│  4. install.md anlegen mit:                                                  │
│     • Voraussetzungen (Node.js Version, etc.)                                │
│     • opencode.json Config-Snippet                                           │
│     • Environment Variables (falls nötig)                                    │
│     • Schritt-für-Schritt Anleitung                                          │
│     • Häufige Installationsprobleme & Lösungen                               │
│                                                                              │
│  5. In AGENTS.md unter "Elite Guide References" verlinken                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**REGELN:**
- ✅ Jeder MCP-Server MUSS in ALL-MCP dokumentiert werden
- ✅ 3 Dateien sind PFLICHT (readme.md, guide.md, install.md)
- ✅ Updates am MCP → SOFORT Dokumentation aktualisieren
- ✅ Links zu offiziellen Docs MÜSSEN funktionieren
- ✅ Installationsanleitung MUSS getestet sein

---

**Source:** ~/.config/opencode/Agents.md (Line 2236-2317)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
