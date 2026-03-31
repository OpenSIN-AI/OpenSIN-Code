# Antigravity Rotator - Usage Guide

## Manuelles Starten (Rotation jetzt)
```bash
cd /Users/jeremy/.open-auth-rotator/antigravity
/opt/homebrew/bin/python3 main.py rotate
```

Oder mit dem Wrapper:
```bash
cd /Users/jeremy/.open-auth-rotator/antigravity
/opt/homebrew/bin/python3 rotate_now.py
```

## Automatischer Watcher (im Hintergrund)
Der Watcher läuft automatisch über LaunchAgent:
```bash
# Status prüfen
launchctl list | grep antigravity

# Manuelles Starten (falls nötig)
launchctl unload ~/Library/LaunchAgents/com.openantigravity.ratelimit-watcher.plist
launchctl load ~/Library/LaunchAgents/com.openantigravity.ratelimit-watcher.plist
```

## Befehle
- `python3 main.py rotate` - Manuelle Rotation jetzt
- `python3 main.py status` - Status anzeigen
- `python3 main.py cleanup` - Alte Accounts aufräumen
- `python3 main.py` (ohne Parameter) - Watcher starten (läuft im Hintergrund)

## Logs
- Watcher Log: `/tmp/antigravity-watcher.log`
- Screenshots: `/tmp/openAntigravity_screenshots/`

## WICHTIG
- Der Watcher erkennt Rate Limits automatisch und rotiert
- Manuelle Rotation ist verfügbar wenn sofort gewechselt werden muss
- Beide Methoden funktionieren einwandfrei
