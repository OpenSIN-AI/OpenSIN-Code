#!/usr/bin/env python3
"""Micro-Step: Klick auf 'Geschäftlich' Profil (Jeremy Schulze Admin)"""

import subprocess
import time

# Chrome aktivieren und warten
subprocess.run(["open", "-a", "Google Chrome"], check=False)
time.sleep(2)

script = """
tell application "System Events"
    set frontmost of process "Google Chrome" to true
    delay 0.5
    tell process "Google Chrome"
        -- Klick auf Profil-Avatar oben rechts
        try
            click button 1 of group 1 of window 1
        on error
            -- Fallback: Klick auf erste sichtbare Button-Gruppe
            click menu bar item 1 of menu bar 1
        end try
        delay 0.3
        -- Wähle "Geschäftlich"
        try
            click menu item "Geschäftlich" of menu 1
        on error
            -- Fallback: Tab + Enter
            keystroke tab key
            keystroke return
        end try
    end tell
end tell
"""

result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Klick auf 'Geschäftlich' Profil ausgeführt")
else:
    print(f"❌ Fehlgeschlagen: {result.stderr}")
