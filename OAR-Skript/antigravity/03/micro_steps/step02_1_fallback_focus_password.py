#!/usr/bin/env python3
"""
Rotator 3 - Step 2.1 (Fallback): Passwort-Feld fokussieren
Wird ausgeführt, wenn Step 2 (Button klicken) fehlschlägt oder Formular schon offen ist.
"""

import subprocess
import time


def step_2_1_focus_password():
    """Fokussiert das Passwort-Feld via Tab-Navigation."""

    print("Step 2.1 (Fallback): Chrome aktivieren...")
    subprocess.run(
        ["osascript", "-e", 'tell application "Google Chrome" to activate'], check=False
    )
    time.sleep(1)

    print("Passwort-Feld fokussieren (Tab x2)...")
    script = """
    tell application "System Events"
        set frontmost of process "Google Chrome" to true
        delay 0.5
        tell process "Google Chrome"
            click window 1
            delay 0.3
            keystroke tab key
            delay 0.1
            keystroke tab key
            delay 0.1
        end tell
    end tell
    """

    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)

    if result.returncode == 0:
        print("✅ Step 2.1: Passwort-Feld fokussiert")
        return True
    else:
        print(f"❌ Step 2.1 fehlgeschlagen: {result.stderr}")
        return False


if __name__ == "__main__":
    step_2_1_focus_password()
