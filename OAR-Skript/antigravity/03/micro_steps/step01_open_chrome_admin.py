#!/usr/bin/env python3
"""
Rotator 3 - Step 1: Chrome öffnen und zur Admin Console navigieren
MIT Screenshot nach JEDER minimalen Aktion.
"""

import subprocess
import time
from helper_logging import log_action, screenshot_after


def step_1_open_chrome_admin():
    """Öffnet Chrome mit 'Geschäftlich' Profil und navigiert zur User-Seite."""
    print("\n" + "=" * 60)
    print("🚀 START: Step 1 - Chrome öffnen")
    print("=" * 60)
    screenshot_after("START")

    # Aktion 1: Prüfen ob Chrome läuft
    log_action("Prüfe ob Chrome läuft")
    result = subprocess.run(["pgrep", "-x", "Google Chrome"], capture_output=True)
    screenshot_after("Chrome_check")

    if result.returncode != 0:
        # Aktion 2: Chrome starten
        log_action("Chrome nicht gefunden. Starte...")
        subprocess.Popen(
            [
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                "--profile-directory=Geschäftlich",
                "https://admin.google.com/ac/users?journey=218",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        screenshot_after("Chrome_started")

        log_action("Warte 4 Sekunden auf Chrome-Start")
        time.sleep(4)
        screenshot_after("Chrome_waited")
    else:
        # Aktion 2: Chrome aktivieren
        log_action("Chrome läuft. Aktiviere...")
        subprocess.run(
            ["osascript", "-e", 'tell application "Google Chrome" to activate'],
            check=False,
        )
        screenshot_after("Chrome_activated")

        log_action("Navigiere zur Admin Console URL")
        subprocess.run(
            [
                "osascript",
                "-e",
                """
            tell application "Google Chrome"
                set URL of active tab of window 1 to "https://admin.google.com/ac/users?journey=218"
            end tell
        """,
            ],
            check=False,
        )
        screenshot_after("URL_navigated")

        time.sleep(2)
        screenshot_after("URL_waited")

    log_action("Step 1 abgeschlossen")
    print("\n" + "=" * 60)
    print("🏁 ENDE: Step 1 - Chrome geöffnet")
    print("=" * 60)
    screenshot_after("END")


if __name__ == "__main__":
    step_1_open_chrome_admin()
