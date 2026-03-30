

---

## 🚨🚨🚨 RULE -7: MANDATORY SESSION DOCUMENTATION (SESSION TRACKING) 🚨🚨🚨

**ABSOFORT: JEDE SESSION MUSS IN .session-NR-ID.md DATEI DOKUMENTIERT WERDEN!**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📋 ABSOLUTE PFLICHT: SESSION-DATEIEN FÜR JEDE AUSFÜHRUNG                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🚨 REGEL: BEI JEDER NEUEN SESSION:                                          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Erstelle Datei: /projekt/.session-01-ID.md                              │
│     Format: .session-{NUMMER}-{SESSION_ID}.md                                │
│     Beispiel: .session-01-ses_abc123xyz.md                                   │
│                                                                              │
│  2. INHALT DER SESSION-DATEI:                                                │
│     ──────────────────────────────────────────────────────────────────────  │
│     ✅ Erste 5 User-Nachrichten (KOMPLETT)                                   │
│     ✅ Erste 5 OpenCode-Nachrichten (KOMPLETT)                               │
│     ✅ 10 weitere WICHTIGE Nachrichten (KOMPLETT)                            │
│     ✅ LETZTE User-Nachricht (immer aktuell halten!)                         │
│     ✅ LETZTE OpenCode-Nachricht (immer aktuell halten!)                     │
│     ✅ Gesamtzusammenfassung nach Blueprint Rules                            │
│     ✅ Dokumentationsstandard-konform                                        │
│                                                                              │
│  3. NACH JEDER AUSFÜHRUNG:                                                   │
│     ──────────────────────────────────────────────────────────────────────  │
│     ✅ Letzte Nachrichten aktualisieren                                      │
│     ✅ Zusammenfassung erweitern                                             │
│     ✅ Sofort committen: git add .session-*.md && git commit                │
│                                                                              │
│  📋 DATEISTRUKTUR BEISPIEL:                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  /dev/SIN-Solver/                                                            │
│  ├── .session-01-ses_abc123.md          ← Session 1                          │
│  ├── .session-02-ses_def456.md          ← Session 2                          │
│  ├── .session-03-ses_ghi789.md          ← Session 3 (aktiv)                  │
│  ├── AGENTS.md                                                               │
│  └── lastchanges.md                                                          │
│                                                                              │
│  🎯 ZWECK:                                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Vollständige Nachvollziehbarkeit aller Sessions                           │
│  • Wiederherstellung bei Datenverlust                                        │
│  • Audit-Trail für alle Entscheidungen                                       │
│  • Kontinuität über mehrere Chat-Sessions hinweg                             │
│                                                                              │
│  ❌ VERBOTEN:                                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ❌ Session ohne .session-Datei starten                                      │
│  ❌ Nur erste/letzte Nachricht speichern (alle wichtigen!)                   │
│  ❌ Nicht committen nach Session-Update                                      │
│  ❌ Löschen alter .session-Dateien                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**WICHTIG:** Diese Regel stellt sicher, dass KEINE Session verloren geht und ALLE Entscheidungen nachvollziehbar sind!

---

## 📋 CHECKLISTE: VOR JEDER SESSION

- [ ] .session-NR-ID.md Datei erstellt?
- [ ] Erste 5 User-Nachrichten dokumentiert?
- [ ] Erste 5 OpenCode-Nachrichten dokumentiert?
- [ ] 10 wichtige Nachrichten ausgewählt?
- [ ] Letzte Nachrichten werden aktualisiert?
- [ ] Blueprint-konforme Zusammenfassung?
- [ ] Nach jeder Ausführung committet?

---
