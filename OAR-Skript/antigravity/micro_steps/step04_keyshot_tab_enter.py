#!/usr/bin/env python3
"""Micro-Step 2: Keyshot Tab + Enter für 'Neuen Benutzer hinzufügen'"""

import subprocess
import time

time.sleep(1)

script = """
tell application "System Events"
    tell process "Google Chrome"
        keystroke tab key
        delay 0.1
        keystroke return
    end tell
end tell
"""

result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
if result.returncode == 0:
    print("✅ Step 2: Tab + Enter ausgeführt")
else:
    print(f"❌ Fehlgeschlagen: {result.stderr}")
