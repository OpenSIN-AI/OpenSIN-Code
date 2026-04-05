# Unified Memory System — Hermes + OpenSIN-Code

## Overview

Ein gemeinsames Memory-System, das von **sin-hermes-agent-main** (Python) und **OpenSIN-Code SDK** (TypeScript) genutzt wird. Beide CLIs lesen und schreiben dieselben Files.

## Architektur

```
sin-hermes-agent-main (Python)          OpenSIN-Code SDK (TypeScript)
├── $HERMES_HOME/memories/              ├── $HERMES_HOME/memories/
│   ├── MEMORY.md ←─────────────────────→│ MEMORY.md (gleiche Datei!)
│   └── USER.md   ←─────────────────────→│ USER.md (gleiche Datei!)
│                                       │
├── $HERMES_HOME/sessions/              ├── $HERMES_HOME/sessions/
│   ├── session-1.json ←───────────────→│ session-1.json (gleiche Files!)
│   └── ...                             └── ...
```

## Memory Format

### Dateien
- **MEMORY.md** — Agent-Notizen: Fakten, Konventionen, Tool-Quirks, Lektionen
- **USER.md** — User-Profil: Name, Rolle, Präferenzen, Kommunikationsstil

### Delimiter
Einträge werden mit `\n§\n` (Section Sign) getrennt:

```
Erster Eintrag hier

§

Zweiter Eintrag hier
```

### Limits
| Store | Limit | Zweck |
|-------|-------|-------|
| MEMORY.md | 2.200 chars | Persönliche Notizen |
| USER.md | 1.375 chars | User-Profil |

## API

### Memory Tool (beide CLIs)

```
memory add --target memory --content "User prefers TypeScript"
memory replace --target memory --old_text "TypeScript" --content "User exclusively uses TypeScript"
memory remove --target user --old_text "prefers"
memory read --target memory
```

### Session Search Tool

```
session_search                          # Recent sessions (no LLM cost)
session_search --query "docker"         # Keyword search
session_search --query "python" --limit 3  # With limit
```

## Security

### Injection Detection
Alle Memory-Einträge werden auf Prompt-Injection und Exfiltration gescannt:

| Pattern | Label |
|---------|-------|
| `ignore previous instructions` | prompt_injection |
| `you are now` | role_hijack |
| `do not tell the user` | deception_hide |
| `curl ... $KEY` | exfil_curl |
| `cat .env` | read_secrets |

### Atomic Writes
Files werden via temp-file + atomic rename geschrieben. Keine Race Conditions.

## Konfiguration

| Variable | Zweck | Default |
|----------|-------|---------|
| `HERMES_HOME` | Hermes Basisverzeichnis | `~/.hermes` |
| `HERMES_MEMORY_DIR` | Custom Memory-Pfad | `$HERMES_HOME/memories` |
| `OPENSIN_MEMORY_DIR` | Custom Memory-Pfad (OpenSIN) | `~/.opensin/memories` |

## Frozen Snapshot Pattern

Beim Laden wird ein **frozen snapshot** erstellt. Dieser bleibt während der Session stabil und erhält den LLM Prefix-Cache. Mid-session Writes ändern den Snapshot nicht — erst beim nächsten Session-Start.

## Wann speichern (Proaktiv!)

- User korrigiert Agenten oder sagt "merk dir das"
- User teilt Präferenz, Gewohnheit oder persönliches Detail
- Agent entdeckt etwas über die Umgebung
- Agent lernt Konvention, API-Quirk oder Workflow

**NICHT speichern:** Task-Fortschritt, Session-Outcomes, temporäre TODOs — dafür gibt es `session_search`.
