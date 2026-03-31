# openAntigravity Auth Rotator — Micro-Steps Flow

## Login Flow (OAuth)

| Step | Datei | Zeilen | Zweck | Screenshot | DOM-Check | Healing |
|------|-------|--------|-------|------------|-----------|---------|
| 01 | `step01_navigate.py` | ≤15 | OAuth URL öffnen | ✅ | ✅ | ✅ |
| 02 | `step02_email.py` | ≤20 | nur `rotator-...`-Lokalteil eingeben + Next klicken | ✅ | ✅ | ✅ |
| 03 | `step03a_password.py` | ≤20 | Passwort eingeben + Next klicken | ✅ | ✅ | ✅ |
| 04 | `step03c_security.py` | ≤20 | Sicherheitsseite prüfen (falls vorhanden) | ✅ | ✅ | ✅ |
| 05 | `step03d_gaplustos.py` | ≤20 | Gaplustos `Verstanden` per DOM → CDP → `Tab x11` + `Enter` | ✅ | ✅ | ✅ |
| 06 | `step03b_workspace_tos.py` | ≤20 | Workspace ToS "Verstanden" klicken | ✅ | ✅ | ✅ |
| 07 | `step04_otp.py` | ≤20 | OTP prüfen (falls nötig) | ✅ | ✅ | ✅ |
| 08 | `step05_consent.py` | ≤20 | Consent / localhost-Callback erfassen | ✅ | ✅ | ✅ |
| 09 | `step05c_chrome_sync.py` | ≤20 | `Chrome ohne Konto verwenden` wenn Prompt erscheint | ✅ | ✅ | ✅ |

## Jeder Step besteht aus 4 Mikro-Dateien:

### Beispiel: step02_email

1. **step02_01_screenshot_before.py** (≤10 Zeilen)
   - Screenshot vor Aktion
   - DOM-Element-Prüfung (Feld existiert?)
   
2. **step02_02_dom_check.py** (≤10 Zeilen)
   - Findet Email-Feld
   - Prüft Coordinates > 0
   
3. **step02_03_action.py** (≤15 Zeilen)
   - Klickt Feld
   - Tippt Email
   - Klickt Next-Button
   
4. **step02_04_healing_check.py** (≤10 Zeilen)
   - Prüft ob Email im Feld steht
   - Prüft ob URL gewechselt hat
   - Bei Fehler: Screenshot + Log

## Flow-Orchestrator

`login_async.py` ruft jeden Step sequentiell auf:
```python
await step01.run(tab, state, challenge, email)
await step02.run(tab, email)
await step03.run(tab, password)
# ...
```

## Self-Hackable Healing

Jeder Step gibt `True/False` zurück:
- `True` → Weiter zum nächsten Step
- `False` → Screenshot speichern + Fehler loggen + Rotation abbrechen

## Dateistruktur

```
core/login/
├── step01_navigate.py (Orchestrator + 4 Mikro-Steps)
├── step02_email.py (Orchestrator + 4 Mikro-Steps)
├── step03a_password.py (Orchestrator + 4 Mikro-Steps)
├── step03c_security.py
├── step03d_gaplustos.py
├── step03b_workspace_tos.py
├── step04_otp.py
├── step05_consent.py
└── login_screenshot.py (Hilfsfunktion)
```
