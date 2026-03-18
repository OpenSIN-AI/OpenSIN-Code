# ~/dev/docs/ — Dokumentations-Index

> Alle Erkenntnisse, alle Konfigurationen, alle Bugs & Fixes werden hier dokumentiert.
> Kein Wissen mehr aus dem Kopf oder aus veralteten Trainingsdaten — alles steht hier.

---

## Struktur

```
~/dev/docs/
├── never-use.md                    ← VERBOTENE Tools/Libs/Patterns (IMMER ZUERST LESEN!)
├── opencode/
│   ├── config-docs.md              ← Config-Pfade, Plugins, MCP-Server, auth.json
│   ├── skills-docs.md              ← Alle installierten Skills + wie man neue hinzufügt
│   ├── plugins-docs.md             ← opencode-antigravity-auth + oh-my-opencode
│   ├── agents-docs.md              ← OMOC-Agenten, Modelle, A2A vs opencode-Agenten
│   ├── models-docs.md              ← Provider, Modelle, Rate-Limits, Wechsel
│   ├── cache-docs.md               ← Storage-Pfade, Datenbank, auth.json, Logs
│   └── repair-docs.md              ← ⚠️ ALLE BUGS & FIXES (bei Problemen HIER nachschlagen!)
├── antigravity/
│   └── antigravity-docs.md         ← openAntigravity-Auth-Rotator
└── nodriver/
    └── nodriver-docs.md            ← nodriver API, Chrome-Start, Verbotene Patterns
```

---

## Schnell-Referenz: Bei Problemen nachschlagen

| Problem | Datei |
|---------|-------|
| Chrome zeigt Flags-Banner | `opencode/repair-docs.md` → BUG-001 |
| asyncio.run() Fehler | `opencode/repair-docs.md` → BUG-002 + `nodriver/nodriver-docs.md` |
| auth.json verloren | `opencode/repair-docs.md` → BUG-003 + `opencode/cache-docs.md` |
| Watcher erkennt Rate-Limit nicht | `opencode/repair-docs.md` → BUG-004 |
| Rotator startet nicht | `opencode/repair-docs.md` → BUG-005 |
| Chrome-Profil gesperrt | `opencode/repair-docs.md` → BUG-006 |
| Was ist verboten? | `never-use.md` |
| opencode Config ändern | `opencode/config-docs.md` |
| Welche Models gibts? | `opencode/models-docs.md` |
| nodriver API nutzen | `nodriver/nodriver-docs.md` |

---

## Regel: Wenn etwas Neues gelernt wird → SOFORT hier dokumentieren!

Kein Wissen in Commits, nicht in Gedanken behalten.
Jede neue Erkenntnis kommt in die zuständige Datei.
Wenn eine Datei > 200 Zeilen wird → aufteilen.

## OpenCode Skill-Konvention

- Standalone Custom Skill-Repos gehoeren unter `~/dev/skills/<repo-name>/`.
- `~/.config/opencode/skills/` ist nur die Laufzeit-/Discovery-Flaeche fuer installierte Skills bzw. Symlinks.
- Eingebettete Projekt- oder Agent-Skills innerhalb eines Produkt-Repos sind davon ausgenommen.
