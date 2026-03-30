# MANDATE 0.22: VOLLUMFÄNGLICHES PROJEKT-WISSEN - LOKALE AGENTS.MD (V19.0 - 2026-01-28)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** ALL AI coders, ALL projects  
**STATUS:** KNOWLEDGE SOVEREIGNTY MANDATE

**🎯 PRINZIP:** Der User geht davon aus, dass du das Projekt IN- UND AUSWENDIG kennst.

**REALITÄT:** KIs vergessen alles zwischen Sessions.

**LÖSUNG:** Lokale `AGENTS.md` in jedem Projekt-Root als lebendiges Gedächtnis.

**MANDATORY WORKFLOW:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📚 PROJEKT-WISSEN LIFECYCLE                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔄 BEI JEDEM PROJEKTSTART:                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Lese /projektname/AGENTS.md (lokale Projekt-Agents.md)                 │
│  2. Extrahiere alle projektspezifischen Regeln und Konventionen            │
│  3. Adaptiere dein Verhalten entsprechend den lokalen Standards            │
│                                                                              │
│  🔄 BEI JEDER ÄNDERUNG:                                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Vergleiche aktuellen Code/Struktur mit AGENTS.md                       │
│  2. Bei Abweichung: SOFORT AGENTS.md aktualisieren                         │
│  3. Dokumentiere neue Patterns, Architektur-Entscheidungen, APIs           │
│  4. Verifiziere Konsistenz zwischen Code und Dokumentation                 │
│                                                                              │
│  🔄 BEI JEDEM SESSION-ENDE:                                                 │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Aktualisiere AGENTS.md mit neuen Erkenntnissen                         │
│  2. Dokumentiere Architektur-Änderungen                                    │
│  3. Füge Troubleshooting-Einträge hinzu                                    │
│  4. Commit: git add AGENTS.md && git commit -m "docs: Update AGENTS.md"    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**REQUIRED CONTENT IN LOCAL AGENTS.MD:**

```markdown
# [Projektname] - AGENTS.md

## Projekt-Übersicht
- Tech Stack: [React, Node.js, etc.]
- Architektur: [Monolith/Microservices]
- Datenbank: [PostgreSQL, MongoDB]

## Konventionen
- Naming: [camelCase, PascalCase]
- Folder Structure: [src/components, src/utils]
- State Management: [Redux, Zustand]

## API-Standards
- Base URL: [http://localhost:3000/api]
- Auth: [JWT, OAuth]
- Versioning: [v1, v2]

## Spezielle Regeln
- [Projektspezifische Anweisungen]
- [Besondere Vorsichtsmaßnahmen]
- [Performance-Optimierungen]

## Troubleshooting
- [Bekannte Probleme und Lösungen]

## Letzte Änderung: [YYYY-MM-DD]
- [Was wurde zuletzt geändert]
```

**INTEGRITÄTS-CHECK (VOR JEDER ANTWORT):**
- [ ] Habe ich die lokale AGENTS.md gelesen?
- [ ] Sind meine Antworten konform mit den lokalen Konventionen?
- [ ] Muss ich die AGENTS.md aktualisieren?
- [ ] Sind Architektur-Änderungen dokumentiert?

---

**Source:** ~/.config/opencode/Agents.md (Line 1515-1596)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
