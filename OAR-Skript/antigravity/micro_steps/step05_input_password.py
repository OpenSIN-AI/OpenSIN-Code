#!/usr/bin/env python3
"""Micro-Step 3: Klick auf Passwort-Feld und Passwort eintippen"""

import subprocess
import time

time.sleep(1)

script = """
tell application "System Events"
    set frontmost of process "Google Chrome" to true
    delay 0.3
    
    tell process "Google Chrome"
        -- 1. Klick auf Passwort-Feld (typisch: 2. Feld nach Email)
        keystroke tab key  -- Email Feld
        delay 0.05
        keystroke tab key  -- Passwort Feld
        delay 0.05
        
        -- 2. Passwort eintippen
        keystroke "ZOE.free2026"
        delay 0.2
        
        -- 3. Enter drücken (Weiter)
        keystroke return
    end tell
end tell
"""

result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Step 3: Passwort eingegeben (ZOE.free2026)")
else:
    print(f"❌ Step 3 fehlgeschlagen: {result.stderr}")
