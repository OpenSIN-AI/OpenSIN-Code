# MANDATE 0.26: PHASENPLANUNG & FEHLERVERMEIDUNG (V19.0 - 2026-01-28)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** ALL AI coders, ALL complex tasks  
**STATUS:** PROJECT MANAGEMENT MANDATE

**🎯 PRINZIP:** Plane sequentiell, antizipiere Fehler, vermeide sie proaktiv.

**MANDATORY PLANNING WORKFLOW:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 PROJEKTPLANUNG MIT FEHLERVERMEIDUNG                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🎯 SCHRITT 1: MEILENSTEINE DEFINIEREN                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Jede Aufgabe muss haben:                                                  │
│  • Klare Meilensteine (nicht mehr als 5 pro Phase)                         │
│  • Definierte Erwartungen (Was ist das gewünschte Ergebnis?)               │
│  • Akzeptanzkriterien (Wann ist es "fertig"?)                              │
│  • Zeitrahmen (Realistische Schätzung)                                     │
│                                                                              │
│  ⚠️  SCHRITT 2: FEHLER-ANTIZIPATION                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Vor dem Coding: Liste mögliche Fehler auf:                                │
│  • "Was könnte bei der Datenbank-Integration schiefgehen?"                 │
│  • "Welche CORS-Probleme erwarten wir?"                                    │
│  • "Wo könnten Race Conditions auftreten?"                                 │
│  • "Welche Dependencies könnten Konflikte haben?"                          │
│                                                                              │
│  🛡️  SCHRITT 3: FEHLERVERMEIDUNG-STRATEGIEN                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Für jeden antizipierten Fehler:                                           │
│  • Präventive Maßnahme definieren                                          │
│  • Fallback-Plan erstellen                                                 │
│  • Monitoring/Alerting einrichten                                          │
│  • Dokumentation der Lösung vorbereiten                                    │
│                                                                              │
│  📋 SCHRITT 4: PHASEN-TRACKING                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Status für jede Phase:                                                    │
│  • PLANNED → IN_PROGRESS → REVIEW → TESTING → DONE                         │
│  • Blocker dokumentieren                                                   │
│  • Risiken aktualisieren                                                   │
│  • User bei Blockern sofort informieren                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**PLANNING TEMPLATE:**

```markdown
## Projekt: [Name]

### Meilensteine
1. **[Phase 1]** - [Beschreibung]
   - Erwartung: [Was soll erreicht werden]
   - Akzeptanzkriterien: [Messbare Kriterien]
   - Zeitrahmen: [X Stunden/Tage]
   - Status: [PLANNED/IN_PROGRESS/DONE]

### Potenzielle Fehler & Vermeidung
| Fehler | Wahrscheinlichkeit | Prävention | Fallback |
|--------|-------------------|------------|----------|
| [DB Timeout] | Hoch | Connection Pooling | Retry-Logic |
| [CORS Error] | Mittel | Korrekte Headers | Proxy Config |

### Aktuelle Phase
**Phase:** [X von Y]  
**Status:** [Status]  
**Blocker:** [Keine / Liste]  
**Nächster Schritt:** [Was kommt als nächstes]
```

---

**Source:** ~/.config/opencode/Agents.md (Line 1890-1966)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
