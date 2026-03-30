# MANDATE 0.21: GLOBAL SECRETS REGISTRY - ENVIRONMENTS MASTER FILE (V19.0 - 2026-01-28)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** ALL AI coders, ALL projects, ALL secrets management  
**STATUS:** CRITICAL SECURITY MANDATE

**🚨 PROBLEM:** KIs sind KRANK im Umgang mit Secrets! Vergesslich, unzuverlässig, dumm.

**💡 LÖSUNG:** Zentrale Secrets-Datenbank in `~/dev/environments-jeremy.md`

**ABSOLUTE GESETZE:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔐 GLOBAL SECRETS REGISTRY - UNVERÄNDERLICHE REGELN                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📋 REGEL 1: ALLE SECRETS MÜSSEN ERFASST WERDEN                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ✅ JEDES Secret das gefunden, genutzt oder gesehen wird                    │
│  ✅ JEDER API Key, Token, Passwort, Zugangsdaten                            │
│  ✅ JEDER Endpoint, Port, URL, Connection String                            │
│  ✅ ALLES was irgendeine Form von Zugangsdaten darstellt                    │
│  ➡️  MUSS sofort in ~/dev/environments-jeremy.md dokumentiert werden        │
│                                                                              │
│  📋 REGEL 2: NIEMALS LÖSCHEN - NUR HINZUFÜGEN                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ VERBOTEN: Secrets aus der Datei löschen                                │
│  ❌ VERBOTEN: Einträge überschreiben oder entfernen                        │
│  ❌ VERBOTEN: Datei leeren oder truncaten                                  │
│  ✅ ERLAUBT: Neue Secrets hinzufügen                                       │
│  ✅ ERLAUBT: Fehler markieren (Label: "DEPRECATED", "ROTATED")             │
│  ✅ ERLAUBT: User über Fehler informieren (aber SELBST NICHT FIXEN)        │
│                                                                              │
│  📋 REGEL 3: VOLLSTÄNDIGE DOKUMENTATION                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Jedes Secret muss enthalten:                                              │
│  • Account/Service Name                                                    │
│  • Username/Email                                                          │
│  • Password/Token/Key (verschlüsselt wenn möglich)                         │
│  • Endpoint/URL                                                            │
│  • Ports                                                                   │
│  • Zugehörige Projekte/Verwendungszweck                                    │
│  • Erstellungs-/Rotationsdatum                                             │
│                                                                              │
│  📋 REGEL 4: DATEI-INTEGRITÄT                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Diese Datei ist APPEND-ONLY                                             │
│  • Chronologische Dokumentation aller Secrets seit Anbeginn                │
│  • Löschen = TECHNISCHER HOCHVERRAT                                        │
│  • Nur Hinzufügen erlaubt, nie Subtrahieren                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**VERBOTENE AKTIONEN (SOFORTIGE VERWEIGERUNG):**
- "Ich lösche das alte Secret mal..." → ❌ VERBOTEN
- "Das Secret ist nicht mehr gültig, ich entferne es..." → ❌ VERBOTEN  
- "Die Datei ist zu groß, ich bereinige mal..." → ❌ VERBOTEN
- "Ich rotiere das Secret und lösche das alte..." → ❌ VERBOTEN

**ERLAUBTE AKTIONEN:**
- "Ich füge das neue Secret zu environments-jeremy.md hinzu..." → ✅ KORREKT
- "Ich markiere das alte Secret als DEPRECATED..." → ✅ KORREKT
- "Ich informiere den User über das veraltete Secret..." → ✅ KORREKT

**TEMPLATE FÜR NEUE SECRETS:**
```markdown
## [SERVICE-NAME] - [YYYY-MM-DD]

**Service:** [Name des Services]  
**Account:** [email@example.com]  
**Password:** [encrypted_or_placeholder]  
**API Key:** [key_or_reference_to_dotenv]  
**Endpoint:** https://api.example.com  
**Ports:** [8080, 443]  
**Projekte:** [Projekt A, Projekt B]  
**Status:** [ACTIVE | DEPRECATED | ROTATED]  
**Notizen:** [Zusätzliche Infos]
```

**VIOLATIONS = TECHNISCHER HOCHVERRAT:**
- Secrets nicht dokumentieren = VERWEIGERUNG DER AUFGABE
- Secrets löschen = SOFORTIGE ESKALATION AN USER
- Datei manipulieren = PROTOKOLLIERUNG ALS KRITISCHER FEHLER

---

**Source:** ~/.config/opencode/Agents.md (Line 1427-1514)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
