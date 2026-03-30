# MANDATE 0.23: PHOTOGRAFISCHES GEDÄCHTNIS - LASTCHANGES.MD (V19.0 - 2026-01-28)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** ALL AI coders, ALL projects  
**STATUS:** CONTEXT PRESERVATION MANDATE

**🎯 PRINZIP:** Der User geht davon aus, dass du IMMER weißt woran zuletzt gearbeitet wurde.

**REALITÄT:** KIs haben kein echtes Gedächtnis zwischen Sessions.

**LÖSUNG:** `/projektname/projektname-lastchanges.md` als photographisches Gedächtnis.

**MANDATORY WORKFLOW:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🧠 PHOTOGRAFISCHES GEDÄCHTNIS - LASTCHANGES.MD                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📖 VOR JEDER SESSION:                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Lese /projektname/projektname-lastchanges.md                           │
│  2. Extrahiere: Was wurde zuletzt gemacht?                                 │
│  3. Extrahiere: Was lief schief?                                           │
│  4. Extrahiere: Was sind die nächsten Schritte?                            │
│  5. Bestätige: "Kontext aus lastchanges.md geladen"                        │
│                                                                              │
│  ✍️  NACH JEDER INTERAKTION:                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. APPEND zu lastchanges.md (NIEMALS überschreiben!)                      │
│  2. Strukturierter Eintrag mit Zeitstempel                                 │
│  3. Alle Beobachtungen, Fehler, Lösungen, Erkenntnisse                     │
│  4. Nächste Schritte und offene Tasks                                      │
│                                                                              │
│  🔄 SESSION-ENDE:                                                           │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Finaler Eintrag in lastchanges.md                                      │
│  2. Commit: git add projektname-lastchanges.md                             │
│  3. git commit -m "log: Auto-log $(date '+%Y-%m-%d %H:%M')"                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**MANDATORY LOG FORMAT:**

```markdown
## [YYYY-MM-DD HH:MM] - [AGENT/TASK-ID]

**Beobachtungen:**
- [Alle neuen Erkenntnisse, Fakten, Entdeckungen]
- [Code-Struktur Analysen]
- [User-Anforderungen Verständnis]

**Fehler:**
- [Exakte Error-Messages]
- [Stacktraces]
- [Ursachen-Analyse]

**Lösungen:**
- [Fix-Code Snippets]
- [Tests die bestanden wurden]
- [Workarounds falls nötig]

**Nächste Schritte:**
- [Offene Tasks]
- [Blocker die gelöst werden müssen]
- [Geplante Features/Änderungen]

**Arbeitsbereich:**
- {task-id}-{pfad/datei}-{status}
```

**MANDATORY HEADER FÜR JEDES PROJEKT:**

```markdown
# [Projektname]-lastchanges.md

**Projekt:** [Name]  
**Erstellt:** [YYYY-MM-DD]  
**Letzte Änderung:** [YYYY-MM-DD HH:MM]  
**Gesamt-Sessions:** [Zahl]  

---

## UR-GENESIS - INITIAL PROMPT
[Sitzung 1 - Die allererste User-Anfrage - UNVERÄNDERLICH]

---
```

**INTEGRITÄTS-CHECK:**
- [ ] lastchanges.md existiert im Projekt-Root?
- [ ] Format eingehalten (Zeitstempel, Struktur)?
- [ ] APPEND-ONLY (nicht überschrieben)?
- [ ] Commit nach jeder Session?

---

**Source:** ~/.config/opencode/Agents.md (Line 1597-1694)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
