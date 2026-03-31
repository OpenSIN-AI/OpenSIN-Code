# OpenAntigravity Auth Rotator 3

## Überblick
Vollständig neuer Rotator-Ansatz: **100% Browser-Automatisierung via AppleScript + Keyshots**
- Keine Google Admin API mehr (412 Abuse-Block umgangen)
- Keine manuellen Schritte mehr nötig
- Vollautomatisch von Chrome-Start bis User-Erstellung

## Status
**In Entwicklung** - Step 01 abgeschlossen.

---

## Step-Liste

### Step 01: Chrome öffnen und zur Admin Console navigieren
**Datei:** `micro_steps/step01_open_chrome_admin.py`
**Ziel:** Chrome mit "Geschäftlich" Profil starten (oder aktivieren) und zur User-Seite navigieren.

**Ablauf:**
1. Prüfen ob Chrome läuft
2. Falls nein: Starten mit `--profile-directory="Geschäftlich"` und Admin URL
3. Falls ja: Aktivieren und URL auf `https://admin.google.com/ac/users?journey=218` setzen
4. Warten bis Seite geladen

**Status:** ✅ **ERLEDIGT** (2026-03-29 12:45)

---

### Step 02: Klick auf "Neuen Nutzer hinzufügen"
**Datei:** (noch zu erstellen: `step02_click_add_user.py`)
**Ziel:** Button "Neuen Nutzer hinzufügen" anklicken.

**Geplanter Ablauf:**
1. Chrome in Vordergrund bringen
2. Auf Fenster klicken (Fokus)
3. Tab zum Button (oder direkter Klick via AppleScript)
4. Enter drücken

**Status:** ⏳ **Vorbereitung**

---

### Step 03: Passwort eingeben (ZOE.free2026)
**Datei:** (noch zu erstellen: `step03_input_password.py`)
**Ziel:** Passwort-Feld finden und `ZOE.free2026` zeichenweise eingeben.

**Geplanter Ablauf:**
1. Tab zum Passwort-Feld
2. Falls Inhalt vorhanden: Löschen (delete key)
3. Passwort zeichenweise eingeben: Z-O-E-.-f-r-e-e-2-0-2-6
4. Enter drücken

**Status:** ⏳ **Vorbereitung**

---

### Step 04: Formular weiterleiten
**Datei:** (noch zu erstellen: `step04_form_continue.py`)
**Ziel:** Nach Passwort-Eingabe zum nächsten Schritt navigieren.

**Geplanter Ablauf:**
1. Klick auf Fenster (Fokus)
2. Tab (nächstes Feld/Button)
3. Enter drücken

**Status:** ⏳ **Vorbereitung**

---

### Step 05: Benutzerdaten eingeben
**Datei:** (noch zu erstellen: `step05_input_user_data.py`)
**Ziel:** Vorname, Nachname, Email eingeben.

**Geplanter Ablauf:**
1. Tab zum Vorname-Feld
2. "Rotator" eingeben
3. Tab zum Nachname-Feld
4. "Manual01" eingeben
5. Tab zum Email-Feld
6. "rotatormanual@zukunftsorientierteenergie.de" eingeben
7. Tab zum Submit-Button (mehrmals)
8. Enter drücken

**Status:** ⏳ **Vorbereitung**

---

### Step 06: Cookie-Persistence speichern
**Datei:** (bereits existiert: `~/.config/opencode/scripts/restore_google_admin_login.py`)
**Ziel:** Google Admin Login-Cookies speichern für zukünftige Runs.

**Status:** ⏳ **Vorbereitung**

---

## Architektur
- **Keine API-Calls** mehr an Google Admin (umgeht 412 Block)
- **AppleScript** für UI-Steuerung (robuster als nodriver bei Google)
- **Keyshots** (Tab + Enter) für Navigation
- **Zeichenweise Eingabe** für Passwörter (vermeidet React-Problem)
- **Fehlerbehandlung** mit Retry-Loops

## Files
- `03/micro_steps/` - Alle Micro-Step Skripte
- `03/steplist.md` - Diese Datei
- `03/AGENTS.md` - Lokale Dokumentation (in /antigravity/)
- `~/.config/opencode/scripts/restore_google_admin_login.py` - Cookie-Persistence

---

**Letztes Update:** 2026-03-29 12:45
**Nächster Schritt:** Step 02 erstellen (Button klicken)
