#!/usr/bin/env python3
"""
Rotator 3 - Step 2: Klick auf "Neuen Nutzer hinzufügen" Button
MIT Screenshot nach JEDER minimalen Aktion.
"""

import subprocess
import time
from helper_logging import log_action, screenshot_after


def step_2_click_add_user():
    """Klickt auf 'Neuen Nutzer hinzufügen' Button."""
    print("\n" + "=" * 60)
    print("🚀 START: Step 2 - Button klicken")
    print("=" * 60)
    screenshot_after("START")

    # Aktion 1: Chrome aktivieren
    log_action("Chrome aktivieren")
    subprocess.run(
        ["osascript", "-e", 'tell application "Google Chrome" to activate'], check=False
    )
    screenshot_after("Chrome_activated")

    time.sleep(1)
    screenshot_after("Wait_1s")

    # Aktion 2: Auf Fenster klicken
    log_action("Auf Fenster klicken (Fokus)")
    script_click = """
    tell application "System Events"
        set frontmost of process "Google Chrome" to true
        delay 0.5
        tell process "Google Chrome"
            click window 1
        end tell
    end tell
    """
    subprocess.run(["osascript", "-e", script_click], capture_output=True, text=True)
    screenshot_after("Window_clicked")

    time.sleep(0.3)
    screenshot_after("Wait_0.3s")

    # Aktion 3: Tab zum Button
    log_action("Tab zum Button")
    script_tab = """
    tell application "System Events"
        tell process "Google Chrome"
            keystroke tab key
        end tell
    end tell
    """
    subprocess.run(["osascript", "-e", script_tab], capture_output=True, text=True)
    screenshot_after("Tab_pressed")

    time.sleep(0.2)
    screenshot_after("Wait_0.2s")

    # Aktion 4: Enter drücken
    log_action("Enter drücken (Button klicken)")
    script_enter = """
    tell application "System Events"
        tell process "Google Chrome"
            keystroke return
        end tell
    end tell
    """
    subprocess.run(["osascript", "-e", script_enter], capture_output=True, text=True)
    screenshot_after("Enter_pressed")

    time.sleep(1)
    screenshot_after("Wait_1s")

    log_action("Step 2 abgeschlossen")
    print("\n" + "=" * 60)
    print("🏁 ENDE: Step 2 - Button geklickt")
    print("=" * 60)
    screenshot_after("END")


if __name__ == "__main__":
    step_2_click_add_user()
