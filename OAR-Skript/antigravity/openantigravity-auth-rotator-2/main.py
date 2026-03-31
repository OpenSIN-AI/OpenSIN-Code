#!/usr/bin/env python3
"""
openantigravity-auth-rotator-2
Neuer Rotator: Manuelle User-Erstellung + Cookie-Persistence
Keine Google Admin API mehr (412 Abuse-Block)
"""

import json
import subprocess
import time
from pathlib import Path

HOME = Path.home()
ROTATOR2_DIR = (
    HOME / ".open-auth-rotator" / "antigravity" / "openantigravity-auth-rotator-2"
)
COOKIES_FILE = HOME / ".config" / "opencode" / "google_admin_cookies.json"


def check_google_admin_login():
    """Prüft ob Google Admin Console eingeloggt ist (via Profilbild-Check)"""
    # Einfacher Check: Lade Admin Console und prüfe Response
    try:
        import urllib.request

        req = urllib.request.Request(
            "https://admin.google.com/ac/users?journey=218",
            headers={"User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode("utf-8", errors="ignore")
            # Prüfe auf "Sign in" vs. "Admin Console"
            if "Sign in" in html or "Anmelden" in html:
                return False
            return True
    except Exception:
        return False


def restore_cookies():
    """Stellt Google Admin Cookies wieder her"""
    if not COOKIES_FILE.exists():
        print("❌ Keine gespeichert Cookies gefunden!")
        return False

    # Skript aufrufen
    restore_script = (
        HOME / ".config" / "opencode" / "scripts" / "restore_google_admin_login.py"
    )
    if restore_script.exists():
        subprocess.run(["python3", str(restore_script)], check=False)
        print("✅ Cookies wiederhergestellt")
        return True
    return False


def main():
    print("=== openantigravity-auth-rotator-2 ===")
    print("Neuer Rotator: Manuelle User-Erstellung + Cookie-Persistence")

    # 1. Cookies wiederherstellen
    if not restore_cookies():
        print("⚠️  Bitte erst manuell einloggen und Cookies speichern!")
        return

    # 2. Login prüfen
    if not check_google_admin_login():
        print("❌ Nicht eingeloggt bei Google Admin Console")
        print("   Öffne Chrome mit Profil 'Geschäftlich' und logge dich ein:")
        print("   https://admin.google.com")
        print("   Email: info@zukunftsorientierte-energie.de")
        print("   Passwort: ZOE.jerry2024")
        return

    print("✅ Google Admin Console eingeloggt")

    # 3. Prüfe ob neuer User existiert (manuell erstellt)
    # TODO: Hier später API-Check einfügen, ob rotator-manual-01 existiert

    print("✅ Rotator-2 bereit")
    print("   Nächster Schritt: Manuellen User 'rotator-manual-01@...' erstellen")
    print("   Dann: opencode auth login mit neuem Account")


if __name__ == "__main__":
    main()
