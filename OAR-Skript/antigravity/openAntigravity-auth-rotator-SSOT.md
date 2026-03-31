# openAntigravity-auth-rotator — SSOT

> ⛔ **FROZEN STATE — 2026-03-16 — NICHT VERÄNDERN**
> Einzige Wahrheitsquelle. Pfad: `/Users/jeremy/dev/openAntigravity-auth-rotator/`
> Alle kritischen Invarianten stammen aus RBUG-001…RBUG-062. Änderungen brechen die Rotation.

---

## Zweck

Vollautomatische Account-Rotation für das `opencode-antigravity-auth` Plugin.
Wenn ein Antigravity-Modell (Claude, Gemini) rate-limited oder kaputt (404) ist:

1. **Phase 1 — Model Switch:** Alle opencode-Sessions auf `antigravity-gemini-3-flash` umschalten (das einzige garantiert funktionierende Modell)
2. **Phase 2 — Full Rotation:** Wenn auch Flash rate-limited → neuen Workspace-User erstellen, OAuth durchführen, Token injizieren, alten User löschen
3. **Global:** Betrifft ALLE iTerm2-Tabs/Sessions die Antigravity nutzen — egal welches Projekt

---

## Funktionierende Modelle (Stand 2026-03-15)

| Modell | API-Name | Status | Hinweis |
|--------|----------|--------|---------|
| `antigravity-gemini-3-flash` | `gemini-3-flash` | ✅ 200 | **EINZIGES zuverlässiges Fallback** |
| `antigravity-gemini-2.5-flash` | `gemini-2.5-flash` | ✅ 200 | Funktioniert auch |
| `antigravity-claude-opus-4-6-thinking` | `claude-opus-4-6-thinking` | ⏳ 429 | Rate-limited, funktioniert wenn Quota da |
| `antigravity-claude-sonnet-4-6` | `claude-sonnet-4-6` | ⏳ 429 | Rate-limited, funktioniert wenn Quota da |
| `antigravity-gemini-2.5-pro` | `gemini-2.5-pro` | ⚠️ 503 | Capacity-Problem, existiert aber |
| `antigravity-gemini-3.1-pro` | `gemini-3.1-pro-low` | ⏳ 429 | Rate-limited, **funktioniert wenn Quota da** |

**ACHTUNG: Gemini 3.1 Pro 404 war ein Phantom-Bug bei 429er-RateLimit (andere 3.x wie 3-pro, 3.1-flash, 3.1-pro-customtools existieren auf der API nicht mehr/sind offline!)** Die Models existieren und funktionieren. Der 404 entstand weil stale `rateLimitResetTimes` den Plugin zwangen, den `gemini-cli` HeaderStyle zu nutzen → falscher Model-Name `gemini-3.1-pro-preview` statt `gemini-3.1-pro-low`. Fix: Gemini-Einträge aus `rateLimitResetTimes` löschen.

**API-Endpoint:** `daily-cloudcode-pa.sandbox.googleapis.com/v1internal:generateContent`
**Request-Format:** `{"project": "<managedProjectId>", "model": "<model>", "request": {...}}`

---

## Architektur

### Prinzipien

1. **Ein Handgriff = Eine Datei** — Max 30 Zeilen pro Mikro-Skript
2. **Screenshot + DOM-Check** nach jedem Step (kein externer API-Call)
3. **Realer OAuth für Antigravity** — SA nur für Admin SDK/Gemini API, echter Browser-Refresh-Token für `google/antigravity-*`
4. **AppleScript für iTerm2** — `write text` für TUI-Eingaben (macOS 26 blockiert TIOCSTI)
5. **Global** — Watcher betrifft ALLE iTerm2-Sessions, nicht projektgebunden

### Stack

| Was | Womit |
|-----|-------|
| Browser-Engine | nodriver (native macOS Chrome, CDP 7654, Temp-Profil `/tmp/openAntigravity_login_profile_7654`) |
| User-Management | Google Admin SDK Directory API |
| OAuth-Tokens für Antigravity | echter Browser-Flow via Google OAuth |
| Service Account | nur für Workspace-/Gemini-API-Nebenpfade |
| iTerm2-Steuerung | AppleScript `write text` |
| Session-Erkennung | `ps ax` → alle opencode-Prozesse mit TTY |
| SMS OTP | SIN-iMessages (applescript → Messages.app) |
| Watcher | LaunchAgent (immer aktiv, pollt alle 8s) |
| Passwörter | Zufällig generiert, 16 Zeichen |
| Domain | `zukunftsorientierte-energie.de` |

### macOS-Besonderheiten (macOS 26, M1)

- **TIOCSTI disabled** — `echo "text" > /dev/ttyXXX` geht NICHT (schreibt auf Display statt Input)
- **AppleScript funktioniert** — `tell aSess to write text "text"` sendet korrekt an Session-Input
- **nodriver** — Steuert nativen Chrome via CDP, kein Brotli-Bug wie bei Playwright/Camoufox auf M1
- **asyncio.sleep()** statt `tab.sleep()` (nodriver-Bug: tab.sleep blockiert 50+ Sekunden)
- **Google Gaplustos** — Frische Workspace-User zeigen zuerst `Willkommen in Ihrem neuen Konto` und brauchen `Verstanden`

### Pflicht-OAuth-Sequenz für frische Rotator-User

1. Chrome immer mit frischem Temp-Profil `/tmp/openAntigravity_login_profile_7654` auf CDP `7654`
2. OAuth-URL mit `login_hint=<rotator-email>` und `hd=zukunftsorientierte-energie.de`
3. Im Identifier-Step nur den `rotator-...`-Lokalteil tippen
4. Passwort via CDP Zeichen-für-Zeichen
5. Auf `speedbump/gaplustos` zuerst DOM-Klick auf `Verstanden`, dann CDP-Klick, dann Fallback `Tab` × 11 + `Enter`
6. Nach Verlassen von `gaplustos` keine generischen Hintergrund-Klicks mehr; das native Chrome-Popup `In Chrome anmelden?` wird explizit mit `Chrome ohne Konto verwenden` geschlossen, niemals mit `Als "Rotator" fortfahren`
7. Danach die Debug-Chrome-Session auf Port `7654` beenden, damit kein weiterer UI-Muell oder Fehlklick mehr passiert
8. Google App-Passwörter sind für diesen Flow nutzlos
9. Standard-Rotation endet nach Auth-Datei-/Account-Update; keine Terminals, keine Session-Restarts, keine Agent-Wechsel
10. OpenCode-Sessions nur nur dann separat restarten, wenn `OPENANTIGRAVITY_RESTART_OPENCODE=1` explizit fuer Debugging gesetzt ist

---

## Zwei-Phasen-Logik (Watcher)

```
Error erkannt (Log-Scan)
    │
    ├─ Claude rate-limited + Gemini API Fallback verfügbar?
    │   └─ JA → Phase 1: Mini-Fallback auf gemini-api/gemini-3.1-pro-preview
    │       → Gemini API Fallback aktivieren
    │       → Alle opencode-Sessions auf gemini-api/gemini-3.1-pro-preview
    │       → "mach weiter" an alle
    │
    └─ Weiterer Trigger / naechster Full-Rotate-Lauf?
        └─ JA → Phase 2: Full Rotation
            → Gemini API Fallback wieder AUS
            → Neuen Workspace-User → OAuth → Token inject → Alten löschen
            → Alle Sessions restart → "mach weiter"
```

**Gewünschte Fallback-Kette (aktuell):**
`google/antigravity-claude-opus-4-6-thinking` oder `google/antigravity-claude-sonnet-4-6` → `gemini-api/gemini-3.1-pro-preview` → Full Rotation → zurück zu Antigravity

### Error-Erkennung (watcher_config.py)

**Quota-Patterns:** `QUOTA_EXHAUSTED`, `rate-limited for`, `quota resets in`, `Add more accounts`, `Quota protection.*all.*account`
**Claude-only Patterns:** `rate-limited for claude`, `all.*account.*claude`
**Model-Error-Patterns:** `Requested entity was not found`, `ProviderModelNotFoundError`, `Model not found:`, `PERMISSION_DENIED`
**Soft-Quota-Pattern:** `over 90% usage` (seit RBUG-022 behoben durch `soft_quota_threshold_percent: 100`)

Alle werden aus `~/.local/share/opencode/log/*.log` gelesen (top 20 neueste Dateien).

---

## CLI-Befehle

```bash
python main.py watch      # Watcher starten (oder via LaunchAgent)
python main.py rotate     # Full rotation sofort
python main.py switch     # Model switch sofort (Phase 1)
python main.py status     # Aktuellen Account-Status zeigen
python main.py setup      # Einmaliges Setup (GCP, OAuth, etc.)
python main.py cleanup    # Alte Workspace-User löschen
```

---

## Verzeichnisstruktur

```
~/dev/openantigravity-auth-rotator/
├── main.py                              # CLI entry point
├── watcher_runner.py                    # LaunchAgent entry point
├── openAntigravity-auth-rotator-SSOT.md # ← DU BIST HIER
│
├── core/                                # Business Logic
│   ├── main_args.py                     # CLI argument parser
│   ├── main_dispatch.py                 # Command dispatcher
│   ├── main_rotate.py                   # Full rotation orchestrator
│   ├── main_model_switch.py             # Model switch orchestrator
│   ├── watcher.py                       # Watcher entry + callbacks
│   ├── watcher_loop.py                  # Poll loop + two-phase logic
│   ├── watcher_config.py                # Patterns, paths, cooldowns
│   ├── watcher_log_scan.py              # Log file scanner
│   ├── watcher_accounts_check.py        # accounts.json checker
│   ├── watcher_guardian.py              # Google auth.json guard
│   ├── accounts_*.py                    # Account CRUD (load/save/inject/backup)
│   ├── workspace_*.py                   # Google Admin SDK (create/delete/list)
│   ├── token_*.py                       # OAuth token exchange + project provisioning
│   ├── config_*.py                      # Local config management
│   ├── gcp_*.py                         # GCP project setup
│   ├── plugin_*.py                      # opencode plugin checks
│   ├── sms_*.py                         # iMessage OTP reading
│   └── utils_*.py                       # Logging, notifications, passwords
│
├── steps/                               # Mikro-Skripte (max 30 Zeilen)
│   ├── chrome/                          # Browser lifecycle
│   │   ├── chrome01_open.py             # Chrome starten (CDP 7654)
│   │   └── chrome02_close.py            # Chrome schließen
│   ├── login/                           # OAuth Login Flow
│   │   ├── login01_navigate.py          # → accounts.google.com
│   │   ├── login01b_click_other_account.py
│   │   ├── login02_fill_email.py        # Email eintippen
│   │   ├── login03_click_next.py        # Next-Button klicken
│   │   ├── login03b_solve_captcha.py    # Captcha lösen
│   │   ├── login04_fill_password.py     # Passwort eintippen
│   │   ├── login05_click_signin.py      # Signin klicken
│   │   ├── login05b_workspace_tos.py    # ToS akzeptieren
│   │   ├── login05c_dismiss_chrome_dialog.py
│   │   ├── login06_click_consent.py     # OAuth consent
│   │   └── login07_capture_code.py      # Auth code aus Callback
│   ├── token/                           # Token-Verarbeitung
│   │   ├── token01_exchange.py          # Code → Token
│   │   ├── token02_userinfo.py          # User-Info holen
│   │   ├── token02b_provision_managed_project.py
│   │   ├── token03_save_account.py      # Account speichern
│   │   └── token04_inject.py            # In accounts.json injizieren
│   ├── workspace/                       # Google Admin SDK
│   │   ├── ws01_auth.py                 # Admin SDK auth
│   │   ├── ws02_create.py               # User erstellen
│   │   ├── ws03_disable_challenge.py    # Login-Challenge deaktivieren
│   │   ├── ws04_delete.py               # User löschen
│   │   └── ws05_list.py                 # User auflisten
│   ├── model_switch/                    # Phase 1: Model Switch
│   │   ├── ms01_find_claude_sessions.py # Alle opencode-Sessions finden (GLOBAL)
│   │   ├── ms02_open_models_menu.py     # Alte PIDs killen
│   │   ├── ms03_select_gemini.py        # Restart mit -m gemini-3-flash
│   │   └── ms04_send_continue.py        # "mach weiter" an alle
│   └── opencode/                        # Phase 2: Session Restart
│       ├── oc01_restart.py              # Restart orchestrator
│       ├── oc01b_restart_opencode.py    # AppleScript restart
│       └── oc02_continue.py             # "mach weiter" via AppleScript
│
├── orchestrator/                        # Step-Runner
│   ├── runner.py                        # Generischer Step-Executor
│   ├── steps_rotate.py                  # Rotation step-Reihenfolge
│   ├── steps_model_switch.py            # Model-Switch step-Reihenfolge
│   └── steps_list.py                    # Legacy step list
│
├── shared/                              # Geteilte Utilities
│   ├── chrome_connect.py                # Chrome CDP connect
│   ├── chrome_port.py                   # CDP Port (7654)
│   ├── chrome_wait.py                   # Wait for element
│   └── screenshot.py                    # Screenshot helper
│
├── validate/                            # Step-Validierung
│   ├── nim_check.py                     # (Legacy — NVIDIA NIM nicht nutzbar)
│   ├── recorder_start.py               # Screen recording start
│   └── recorder_stop.py                # Screen recording stop
│
└── logs/                                # Runtime-Logs + Screenshots
    └── stuck_sessions.json              # ms01 output
```

---

## Konfigurationsdateien

| Datei | Inhalt | Wer schreibt |
|-------|--------|-------------|
| `~/.config/opencode/antigravity.json` | **Plugin-Config** (soft_quota, cli_first, etc.) | Manuell |
| `~/.config/opencode/antigravity-accounts.json` | Rotator-Accounts (v4, exakt 1 aktiv) | Rotator + Plugin |
| `~/.config/openAntigravity-auth-rotator/config.json` | admin_email, domain | Setup |
| `~/.config/openAntigravity-auth-rotator/oauth_client.json` | OAuth Client ID | Manuell (GCP Console) |
| `~/.config/openAntigravity-auth-rotator/token.json` | Admin Refresh Token | Setup |

> `~/.config/opencode/opencode.json` darf nie wieder einen top-level `provider.gemini-api.apiKey` bekommen. Nur `provider.gemini-api.options.apiKey` ist erlaubt.

### antigravity.json (Plugin-Config)

**Pfad:** `~/.config/opencode/antigravity.json` (user-level)
**Projekt-Level:** `<project>/.opencode/antigravity.json` (überschreibt user-level)
**WICHTIG:** Config wird EINMAL beim Plugin-Start geladen. Sessions müssen neugestartet werden für Änderungen!

```json
{
  "soft_quota_threshold_percent": 100,
  "cli_first": false,
  "quota_fallback": false,
  "max_rate_limit_wait_seconds": 10
}
```

| Key | Default | Unsere Config | Warum |
|-----|---------|---------------|-------|
| `soft_quota_threshold_percent` | 90 | **100** | 100% Quota nutzen, nicht bei 90% stoppen |
| `cli_first` | false | false | Immer Antigravity-Endpoint zuerst |
| `quota_fallback` | false | false | KEIN Fallback auf gemini-cli Endpoint |
| `max_rate_limit_wait_seconds` | 300 | 10 | Nicht 5 Minuten warten, sofort Fehler melden |
| `switch_on_first_rate_limit` | true | (default) | Sofort Account wechseln bei Rate-Limit |
| `failure_ttl_seconds` | 3600 | (default) | Failed Models 1h blockiert |
| `keep_thinking` | false | (default) | Thinking nicht erzwingen |

### accounts.json Format (v4)

```json
{
  "accounts": [{
    "email": "rotator-XXXXX@zukunftsorientierte-energie.de",
    "refreshToken": "1//...",
    "managedProjectId": "light-advantage-5rr6j",
    "rateLimitResetTimes": {
      "claude": 1774198390136,
      "gemini-antigravity:antigravity-gemini-3.1-pro": 1774197341045
    }
  }]
}
```

---

## LaunchAgent

**Plist:** `~/Library/LaunchAgents/com.openantigravity.ratelimit-watcher.plist`
**Binary:** `/Users/jeremy/.open-auth-rotator/antigravity/watcher_runner.py`
**Symlink:** `~/.local/bin/opencode-ratelimit-watcher`
**Log:** `/tmp/antigravity-watcher.log`

```bash
# Status prüfen
launchctl list | grep -i antigravity

# Restart
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.openantigravity.ratelimit-watcher.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.openantigravity.ratelimit-watcher.plist
```

---

## Model Switch Flow (Phase 1, ms01→ms04)

```
ms01: ps ax → finde ALLE opencode-Prozesse mit TTY (global, alle Projekte)
ms02: kill -9 auf alle gefundenen PIDs
ms03: AppleScript → opencode -s <session_id> -m google/antigravity-gemini-3-flash
ms04: AppleScript → "mach weiter" in jede Session
```

**Wichtig:** ms01 findet Sessions mit UND ohne `-s` Flag. Sessions ohne Session-ID werden ohne `-s` neu gestartet.

---

## Full Rotation Flow (Phase 2)

```
ws01_auth → ws02_create → ws03_disable_challenge
    → chrome01_open → login01..login07 → chrome02_close
    → token01_exchange → token02_userinfo → token02b_provision
    → token03_save → token04_inject
    → oc01b_restart → oc02_continue
    → ws04_delete (alter User)
```

---

## Bekannte Bugs & Workarounds

| Bug | Symptom | Workaround |
|-----|---------|-----------|
| RBUG-020 | Gemini 3.x Pro → 404 | **PHANTOM-BUG** — stale rateLimitResetTimes löschen! Modell funktioniert |
| RBUG-021 | `/dev/tty` writes → Display statt Input | AppleScript `write text` |
| RBUG-022 | "over 90% usage" blockiert bei 90% | `soft_quota_threshold_percent: 100` in antigravity.json |
| RBUG-023 | 404 durch falschen Endpoint (gemini-cli statt antigravity) | `quota_fallback: false` + Gemini Rate-Limits löschen |
| nodriver sleep | `tab.sleep(N)` blockiert 50+ Sekunden | `asyncio.sleep(N)` |
| NVIDIA NIM | cosmos-reason2-8b hat keinen Free Endpoint | Screenshot + DOM-Check statt Video |

---

## GCP-Projekt (aktuell)

- **Managed Project:** `light-advantage-5rr6j` (automatisch von Antigravity zugewiesen)
- **Tier:** `free-tier` (kein Preview-Zugang)
- **Domain:** `zukunftsorientierte-energie.de`
- **Admin:** `zukunftsorientierte.energie@gmail.com`
- **OAuth Client:** Desktop App, Callback `http://localhost:51121/callback`

---

## Setup (einmalig)

### 1 — CLI-Setup
```bash
python main.py setup
```
Erstellt GCP-Projekt + aktiviert APIs via `gcloud`.

### 2 — MANUELL: OAuth Client
1. `https://console.cloud.google.com/auth/clients?project=antigravity-rotator`
2. CREATE CLIENT → Desktop App → Name: AntigravityRotator
3. Download JSON → `~/.config/openAntigravity-auth-rotator/oauth_client.json`
4. OAuth Consent Screen: Internal, `info@zukunftsorientierte-energie.de`

### 3 — OAuth + Smoke Test
```bash
python main.py setup   # Browser öffnet, Allow klicken
python main.py status  # Prüfen
```

### 4 — LaunchAgent laden
```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.openantigravity.ratelimit-watcher.plist
```

---

## Wichtige Konstanten

| Key | Wert |
|-----|------|
| Domain | `zukunftsorientierte-energie.de` |
| Admin | `info@zukunftsorientierte-energie.de` |
| VERBOTEN | `jeremyschulze93@gmail.com` |
| Rotator User | `rotator-{ts}@zukunftsorientierte-energie.de` |
| CDP Port | `7654` |
| OAuth Callback Port | `51121` |
| InstalledAppFlow Port | `51122` |
| Client ID | `1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com` |
| GCP Projekt | `antigravity-rotator` |
| Lock File | `/tmp/openAntigravity-auth-rotator.lock` |
| Model Switch State | `/tmp/openAntigravity-model-switch-done` |

---

## Wichtige Plugin-Interna (read-only)

**Plugin-Pfad:** `~/.bun/install/cache/opencode-antigravity-auth@1.6.0@@@1/`
- `dist/src/plugin/config/loader.js:37` — Config lesen: `antigravity.json`
- `dist/src/plugin/config/schema.js:384` — `DEFAULT_CONFIG` mit allen Defaults
- `dist/src/plugin/config/models.js` — Modell-Definitionen
- `dist/src/plugin/transform/model-resolver.js` — Model-Name-Resolution (KRITISCH)
- `dist/src/plugin/accounts.js:95` — Rate-Limit-Key Format: `gemini-antigravity:<model>`
- `dist/src/plugin/request.js:580` — `resolveModelForHeaderStyle()` Call
- `dist/src/plugin/request-helpers.js:1328` — 404 → "preview access" Error-Enhancement
- `dist/src/plugin/fingerprint.js:48` — Randomisiert `darwin`/`win32` (BY DESIGN, kein Bug)
- `dist/src/plugin.js:997` — `loadConfig(directory)` — einmal beim Plugin-Start, nicht per Request

**Model-Resolution (ZWEI Pfade!):**

| Opencode Model-ID | Antigravity HeaderStyle → API-Name | Gemini-CLI HeaderStyle → API-Name |
|-------|------|------|
| `antigravity-gemini-3.1-pro` | `gemini-3.1-pro-low` ✅ | `gemini-3.1-pro-preview` ❌ 404! |
| `antigravity-gemini-3-flash` | `gemini-3-flash` ✅ | `gemini-3-flash-preview` ✅ |
| `antigravity-claude-opus-4-6-thinking` | `claude-opus-4-6-thinking` ✅ | N/A (Claude immer Antigravity) |

**KRITISCH:** Wenn stale `rateLimitResetTimes` den Plugin zwingen auf `gemini-cli` Fallback zu gehen, sendet er `gemini-3.1-pro-preview` statt `gemini-3.1-pro-low` → 404!

**Rate-Limit-Key Format:**
- `claude` — Alle Claude-Modelle (eine Key für alle)
- `gemini-antigravity:<model>` — Spezifisches Modell auf Antigravity-Endpoint
- `gemini-cli:<model>` — Spezifisches Modell auf Gemini-CLI-Endpoint

**Config-Lade-Reihenfolge:**
1. `DEFAULT_CONFIG` (in schema.js hardcoded)
2. `~/.config/opencode/antigravity.json` (user-level, überschreibt Defaults)
3. `<project>/.opencode/antigravity.json` (project-level, überschreibt user-level)

**Quota-Fallback-Chain im Plugin:**
1. Versuche aktuellen Account mit `antigravity` HeaderStyle
2. Wenn rate-limited UND `quota_fallback: true`: Fallback auf `gemini-cli` HeaderStyle
3. Wenn kein anderer Account frei: Fehler → Watcher erkennt → Model Switch oder Rotation

> **Unser Setting:** `quota_fallback: false` → KEIN Fallback auf gemini-cli. Dadurch kein Phantom-404 mehr.

**Endpoint-URLs:**
- Antigravity Daily: `https://daily-cloudcode-pa.sandbox.googleapis.com`
- Antigravity Prod: `https://cloudcode-pa.googleapis.com`
- Gemini CLI: `https://cloudcode-pa.googleapis.com` (gleich wie Prod)

**loadCodeAssist API:**
- Korrekt: `{"metadata": {"ideType": "ANTIGRAVITY", "platform": 2, "pluginType": "GEMINI"}}`
- Plugin sendet String "MACOS" statt Integer 2 → 400 Error → nutzt Fallback-Project-ID

---

## GitHub

`https://github.com/Delqhi/openAntigravity-auth-rotator`

---

## Bug-Log

Vollständiger Bug-Log: `~/dev/docs/openantigravity-auth-rotator/repair-docs.md` (RBUG-001 bis RBUG-062)

| ID | Kurzbeschreibung | Status |
|----|-----------------|--------|
| RBUG-056 | `browser.stop()` fehlte in login_async.py → Chrome-Orphan | ✅ FIXED |
| RBUG-057 | `managedProjectId` immer leer (loadCodeAssist→400 für neue User) | ✅ FIXED |
| RBUG-058 | Gemini Flash Fallback in watcher_loop.py | ✅ FIXED |
| RBUG-059 | Vertex AI lehnt Bilder >8000px ab → `imgfix` Tool (tools/resize_img.py) | ✅ WORKAROUND |
| RBUG-060 | OpenCode Sessions vor Auth beendet — oc01b als letzter Step in STEPS_ROTATE | ✅ FIXED |
| RBUG-061 | Chrome "In Chrome anmelden?" Dialog nicht dismissed vor browser.stop() | ✅ FIXED |
| RBUG-062 | Flash/Model-Switch Toter Code nach RBUG-058 nicht entfernt — 345 Zeilen gelöscht | ✅ FIXED |
