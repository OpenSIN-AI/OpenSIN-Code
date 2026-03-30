# MANDATE 0.29: ARBEITSBEREICH-TRACKING - EIGENER BEREICH (V19.0 - 2026-01-28)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** ALL AI coders, ALL projects  
**STATUS:** COLLISION AVOIDANCE MANDATE

**🎯 PRINZIP:** Jeder hat seinen EIGENEN Arbeitsbereich, um Konflikte zu vermeiden.

**MANDATORY WORKSPACE TRACKING:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎨 ARBEITSBEREICH-TRACKING - KEINE KONFLIKTE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📋 FORMAT (MUST BE UPDATED IN REAL-TIME):                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  In /projektname/projektname-lastchanges.md UND                            │
│  In /projektname/projektname-userprompts.md:                               │
│                                                                              │
│  ## AKTUELLER ARBEITSBEREICH                                                │
│                                                                              │
│  **{todo};{task-id}-{arbeitsbereich/pfad}-{status}**                       │
│                                                                              │
│  Beispiele:                                                                │
│  • {Implementiere Login};TASK-001-src/auth/login.ts-IN_PROGRESS            │
│  • {Fix Bug #123};BUG-456-src/utils/api.ts-COMPLETED                       │
│  • {Review Code};REV-789-src/components/-PENDING                           │
│                                                                              │
│  📋 REGELN:                                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. IMMER aktuell halten (bei jedem Task-Wechsel)                          │
│  2. Eindeutige Task-IDs verwenden                                          │
│  3. Klare Pfad-Angaben (welche Dateien/Ordner)                             │
│  4. Status: IN_PROGRESS / COMPLETED / PENDING / BLOCKED                    │
│  5. Bei Konflikten: User sofort informieren                                │
│                                                                              │
│  🔄 UPDATES:                                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Bei Task-Start: Neuen Bereich eintragen                                 │
│  • Bei Task-Ende: Als COMPLETED markieren                                  │
│  • Bei Blocker: Status auf BLOCKED + Grund                                 │
│  • Archivierung: Alte Bereiche unter "HISTORIE" verschieben                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**KONFLIKT-ERKENNUNG:**
Wenn zwei Agenten gleichzeitig an derselben Datei arbeiten:
1. Sofort User informieren
2. Koordination vorschlagen
3. Keine Änderungen vornehmen bis Konflikt gelöst

---

**Source:** ~/.config/opencode/Agents.md (Line 2104-2159)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
