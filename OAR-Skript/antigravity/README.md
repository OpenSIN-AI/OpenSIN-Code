# openAntigravity-auth-rotator

🚀 **Automated Ephemeral Google Workspace Accounts for Antigravity Protocol**

> **⚠️ ARCHITECTURE UPDATE (2026-03-22): THE BLACKBOX E2.MICRO PARADIGM ⚠️**
> This repository is now officially frozen and containerized as a **Blackbox Microservice**. 
> It NO LONGER runs locally on macOS (`fast_runner.py` or `main.py`). The entire browser automation stack (Workspace Admin, Cloud Console, Gemini API generation) is packaged into an isolated Docker container hosted on a free Oracle Cloud E2.Micro VM. 
> 
> **RESTRICTIONS (MANDATORY):**
> 1. No agent, human, or subagent is permitted to refactor, edit, or "improve" the browser automation scripts in this repository.
> 2. The blackbox exposes a single REST API endpoint (e.g., `POST /api/v1/rotate-antigravity`) which acts as the sole interface for generating fresh Gemini/Claude tokens via Workspace.
> 3. The token distribution, local caching, and `auth.json` injection remain local responsibilities (handled by the client-side Watcher or `swap_token.py`), but the production of tokens is strictly Blackboxed.

## Features (Frozen)
- Ephemeral Google Workspace User generation via Admin SDK.
- Headless Chrome automation for Google OAuth and Console acceptances.
- Fallback flows for Gemini HTTP Key generation via AI Studio.

---

## The Blackbox API (OCI E2.Micro)

The container on the Oracle Cloud VM exposes the rotation trigger as a simple REST endpoint. The local Mac and HF VMs only consume this endpoint when a new token is needed.

**Trigger Rotation:**
```bash
curl -X POST http://<e2-micro-ip>:7654/api/v1/rotate-antigravity
```

*(Legacy local commands like `python3 main.py rotate` are DEPRECATED and should not be used on the Mac).*

---

## Wichtige Dateien

| Pfad | Inhalt |
|------|--------|
| `~/.config/openAntigravity-auth-rotator/token.json` | Admin SDK OAuth2 Token (auto-refresh) |
| `~/.config/opencode/antigravity-accounts.json` | Antigravity Accounts v4 (vom Plugin gelesen) |
| `~/.local/share/opencode/auth.json` | opencode OAuth Auth — `google`-Key wird vom Rotator gesetzt |
| `/tmp/openAntigravity-auth-rotator.lock` | Rotation-Lock (rm -f bei hängendem Prozess) |

> **Kritisch:** `~/.local/share/opencode/auth.json` muss einen `google`-Eintrag mit `type:"oauth"` enthalten, sonst interceptiert das Antigravity-Plugin keine Requests und sie landen bei der rohen Gemini API ("model not found"). Der Rotator setzt diesen Eintrag automatisch.

> **Pflicht-Flow:** Für Antigravity-Plugin-Modelle muss ein echter OAuth-Refresh-Token aus dem Browser-Login geholt werden. Service-Account-Impersonation reicht nur für Admin-SDK-/Gemini-API-Zwecke, nicht für `google/antigravity-*`.

> **Single-Account-Regel:** Es darf genau 1 `rotator-*` User in Google Workspace und genau 1 aktiver Eintrag in `~/.config/opencode/antigravity-accounts.json` existieren. Cleanup und Reconcile erzwingen das jetzt wieder automatisch.

> **Gemini-API-Fallback:** Der Rotator schreibt nie wieder einen kaputten Top-Level-`apiKey` in `opencode.json`. Fallback arbeitet nur mit `provider.gemini-api.options.apiKey` und nur im Claude-Rate-Limit-Fall.

> **OpenCode-Session-Restarts:** Andere OpenCode/iTerm-Sessions werden nicht mehr automatisch umgeschaltet. Session-Restarts sind jetzt nur noch explizit per `OPENANTIGRAVITY_RESTART_OPENCODE=1` erlaubt.

> **LaunchAgent-Regel:** Der LaunchAgent triggert nur noch den Rotator. Er darf keine Terminals schliessen/oeffnen und keine Agenten oder Modelle umschalten.

> **Chrome-Prompts nach Callback:** Sobald `gaplustos` verlassen wurde, darf der Flow nicht mehr blind im Hintergrund klicken. Das native Chrome-Popup `In Chrome anmelden?` wird explizit mit `Chrome ohne Konto verwenden` geschlossen; `Als "Rotator" fortfahren` ist fuer den Rotator falsch. Danach wird die Debug-Chrome-Session auf Port 7654 beendet. Ein Google-App-Passwort hilft hier nicht.

## Runtime-Selbsttest

Wenn du pruefen willst, ob der lokale OpenCode-Antigravity-Runtime-Fix noch aktiv ist, reichen diese beiden Checks:

```bash
which opencode
# Erwartet: /Users/jeremy/Library/pnpm/opencode

ag-runtime-selftest

# Optional ohne Cache-Purge:
ag-runtime-selftest --keep-cache

# Same-Session-/tmux-Recovery-Test:
ag-session-selftest

# Optional mit behaltenen Artefakten zum Debuggen:
ag-session-selftest --keep-artifacts

rm -rf ~/.cache/opencode/node_modules/opencode-antigravity-auth
opencode run "Reply with OK only." --model google/antigravity-claude-opus-4-6-thinking --variant low
```

Erwartung:
- der Wrapper `~/Library/pnpm/opencode` stellt den gepatchten Runtime-Cache automatisch wieder her
- der Claude-Antigravity-Run antwortet mit `OK`
- `ag-session-selftest` prueft denselben tmux-/Same-Session-Fall gegen eine isolierte Temp-Konfiguration: baseline -> on-disk Claude-Block setzen -> gleicher Prozess bleibt funktionsfaehig -> Block loeschen -> gleicher Prozess bleibt weiter funktionsfaehig

Optionaler Direktcheck ohne kompletten Modelllauf:

```bash
python3 ~/.config/opencode/scripts/restore_antigravity_runtime.py && echo restored
```

Die kanonische gepatchte Runtime-Kopie liegt unter:

```bash
~/.config/opencode/vendor/opencode-antigravity-auth-1.6.5-beta.0/
```

## PR-539 Watcher

Fuer den Upstream-PR `NoeFabris/opencode-antigravity-auth#539` laeuft lokal ein Watcher, der neue Reviews/Kommentare erkennt und bei echtem Maintainer-Feedback automatisch einen Follow-up-Worker startet.

Was die PR-Watcher machen:
- sie pollen GitHub-PRs auf neue Reviews/Kommentare
- sie ignorieren eigenes Feedback sowie offensichtliches Bot-/Noise-Feedback
- bei relevantem Maintainer-Feedback starten sie automatisch einen lokalen `opencode run`-Follow-up im passenden Repo
- sie schreiben Log + kompakte Summary-Datei, damit du den Zustand jederzeit sehen kannst

Nützliche Befehle:

```bash
ag-status

ag-watch all status
ag-watch all start
ag-watch all stop
ag-watch plugin status
ag-watch core status

watch-pr-539-feedback status
watch-pr-539-feedback start
watch-pr-539-feedback stop
watch-pr-539-feedback once
watch-pr-539-feedback tail

watch-pr-15434-feedback status
watch-pr-15434-feedback start
watch-pr-15434-feedback stop
watch-pr-15434-feedback once
watch-pr-15434-feedback tail
```

Dateien:

```bash
~/.config/opencode/scripts/watch_pr_539_feedback.py
~/.local/bin/watch-pr-539-feedback
~/.local/bin/watch-pr-15434-feedback
~/.local/bin/ag-status
~/.local/state/pr-539-watch/watch.log
~/.local/state/pr-539-watch/state.json
~/.local/state/pr-539-watch/latest-feedback-summary.txt
~/.local/state/pr-15434-watch/watch.log
~/.local/state/pr-15434-watch/state.json
~/.local/state/pr-15434-watch/latest-feedback-summary.txt
```

Der Watcher ignoriert bewusst eigenes Feedback und Bot-/Noise-Kommentare, damit nicht bei jedem unbrauchbaren Event ein Auto-Follow-up losläuft.
`latest-feedback-summary.txt` enthaelt immer den letzten kompakten Status; im Leerlauf steht dort bewusst `No actionable feedback captured yet.`
`ag-status` zeigt beide Watcher plus die installierten Runtime-/Session-Selbsttests in einer kompakten Gesamtansicht.

---

## Trennung von opencodex-auth-rotator (⚠️ absolutes Gebot)

`opencodex-auth-rotator` (OpenAI-Rotation) und `openAntigravity-auth-rotator` (Google-Rotation) sind **völlig unabhängig** und dürfen sich **nie** gegenseitig behindern:

- `auth.json` darf **NIEMALS komplett gelöscht** werden — immer nur den eigenen Provider-Key entfernen
- `opencodex` entfernt nur den `openai`-Key via `json.pop('openai', None)`
- `openAntigravity` entfernt nur den `google`-Key via `json.pop('google', None)`
- Separate Lock-Files: `opencodex_running.lock` vs `openAntigravity-auth-rotator.lock`

**BUG-16 Guardian:** Der Watcher pollt alle 30s ob der `google`-Key noch vorhanden ist. Fehlt er (z. B. durch veraltetes `/tmp/opencodex_auth.sh`), wird der Token sofort refreshed und re-injiziert.

**BUG-17:** Watcher-Log-Verzeichnis war falsch (`~/.config/opencode/antigravity-logs/` existiert nicht). Korrekter Pfad: `~/.local/share/opencode/log/`. Außerdem: Trigger-Patterns erweitert um den echten Fehlerstring `"All 1 account(s) rate-limited for claude. Quota resets in 167h"` — 4 Patterns matchen jetzt.

---

## Chrome Profile & Admin Console

*   **JEDER CODER MUSS VOR AUTOMATISIERUNG PRÜFEN, WELCHES PROFIL GENUTZT WIRD!**
*   [Übersicht Chrome Profile & Admin Console Anleitung](../../dev/docs/chrome/README.md)

---

## Docs

- SSOT: [`openAntigravity-auth-rotator-SSOT.md`](./openAntigravity-auth-rotator-SSOT.md)
- Google Doc: [openAntigravity-Auth-Rotator](https://docs.google.com/document/d/1MDWgzQyqZGQ3dIeH_5lDgBlSqqCZ4vU-zBrTHfMtEO4/edit)
- GitHub: [Delqhi/openAntigravity-auth-rotator](https://github.com/Delqhi/openAntigravity-auth-rotator)
