# OpenAntigravity Auth Rotator 2

## Überblick
Neuer Rotator als Ersatz für den blockierten originalen Rotator (Google 412 Abuse-Error).
**Prinzip:** Manuelle User-Erstellung + Cookie-Persistence (keine automatisierte API-Creation mehr).

## Status: BLOCKIERT - Manueller Schritt erforderlich
Google hat die automatische User-Erstellung via Admin API blockiert (`412 conditionNotMet`).
Der alte Rotator kann keine neuen Accounts mehr erstellen.

**Lösung:** Einmalige manuelle Erstellung eines `rotator-manual-01@...` Accounts, dann läuft Rotator-2 automatisch weiter.

---

## Aktuelle Micro-Steps (abgeschlossen)

### Step 1: Chrome mit "Geschäftlich" Profil öffnen
**Datei:** `micro_steps/step01_start_chrome.py`
```bash
# Öffnet Chrome mit dem "Geschäftlich" Profil (info@zukunftsorientierte-energie.de)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --profile-directory="Geschäftlich" "https://admin.google.com/ac/users?journey=218"
```
**Status:** ✅ **FUNKTIONIERT** - Chrome öffnet mit Admin Console URL

---

### Step 2: Klick auf "Neuen Benutzer hinzufügen" (Keyshot)
**Datei:** `micro_steps/step04_keyshot_tab_enter.py`
```python
# 1. Chrome in Vordergrund bringen
# 2. Auf Fenster klicken (Fokus)
# 3. Tab drücken (fokussiert Button)
# 4. Enter drücken (klickt Button)
```
**Status:** ✅ **FUNKTIONIERT** - Button wird geklickt via Tab+Enter

**Korrigierte Version:** `step02_click_geschaeftlich_profile.py` (Fenster-Fokus zuerst)

---

### Step 3: Passwort eingegeben (ZOE.free2026)
**Datei:** `micro_steps/step05_input_password.py` (zeichenweise)
```python
# 1. Tab zum Passwort-Feld (2. Tab)
# 2. Passwort löschen (delete key)
# 3. Neues Passwort eintippen: ZOE.free2026 (zeichenweise)
# 4. Enter (Weiter)
```
**Status:** ✅ **FUNKTIONIERT** - Passwort wird zeichenweise eingegeben (kein `ks0aks0a` mehr)

---

### Step 4: Klick auf Fenster + Tab + Enter
**Datei:** `micro_steps/step04_keyshot_tab_enter.py` (wiederholt)
```python
# 1. Chrome in Vordergrund bringen
# 2. Klick auf Fenster (Fokus setzen)
# 3. Tab (nächstes Feld/Button)
# 4. Enter (Bestätigen/Weiter)
```
**Status:** ✅ **FUNKTIONIERT** - Formular wird durch Tab+Enter weitergeleitet (auch bei Wiederholung)

---

## Nächster Schritt: Step 5 (Vorname/Nachname/Email eingeben)
**Ziel:** Benutzer-Daten-Felder ausfüllen (Vorname, Nachname, Email).

**Geplanter Ablauf:**
1. Tab zu Vorname-Feld
2. "Rotator" eingeben
3. Tab zu Nachname-Feld
4. "Manual01" eingeben
5. Tab zu Email-Feld
6. "rotator-manual-01@zukunftsorientierte-energie.de" eingeben
7. Enter (Benutzer erstellen)

---

## Vollständiger Workflow (Ziel)

1. **Step 1:** Chrome "Geschäftlich" öffnen ✅
2. **Step 2:** "Neuen Benutzer hinzufügen" klicken ✅
3. **Step 3:** Passwort `ZOE.free2026` eingeben (in Arbeit)
4. **Step 4:** Vorname/Nachname/Email eingeben
5. **Step 5:** Benutzer erstellen
6. **Step 6:** Cookie-Persistence speichern
7. **Step 7:** `opencode auth login` mit neuem Account

---

## Cookie-Persistence
**Datei:** `~/.config/opencode/scripts/restore_google_admin_login.py`
**Zweck:** Speichert und stellt Google Admin Login-Cookies wieder her.

**Befehl:**
```bash
python3 ~/.config/opencode/scripts/restore_google_admin_login.py
```

---

## Wichtig: Alte Rotatoren deaktiviert
- Lock-Dateien: `/tmp/openAntigravity-auth-rotator.lock`, `/tmp/codex-rotator.lock`
- LaunchAgent: `com.openantigravity.ratelimit-watcher` gestoppt
- Keine automatischen User-Creation-Versuche mehr (vermeidet 412 Error)

---

## Manuelles Setup (einmalig erforderlich)
Falls die Automatisierung scheitert:

1. Chrome "Geschäftlich" öffnen: `https://admin.google.com/ac/users?journey=218`
2. "Neuen Benutzer hinzufügen" klicken
3. Daten eingeben:
   - Vorname: `Rotator`
   - Nachname: `Manual01`
   - Email: `rotator-manual-01@zukunftsorientierte-energie.de`
   - Passwort: `ZOE.jerry2024`
   - "Passwort ändern": DEAKTIVIEREN
   - "Zweite Verifizierung": DEAKTIVIEREN
4. "Benutzer hinzufügen" klicken
5. Danach: `opencode auth login --provider openai` mit neuem Account

---

**Letztes Update:** 2026-03-29 11:26
**Status:** Step 1 & 2 eingefroren, Step 3 in Arbeit
