#!/usr/bin/env python3
"""Micro-Step 1: Chrome 'Geschäftlich' Profil starten + Admin Console öffnen"""

import subprocess
import time
import os

PROFILE = "/Users/jeremy/dev/webauto-nodriver-mcp/chrome_profile/Geschäftlich"
URL = "https://admin.google.com/ac/users?journey=218"

# Chrome mit Profil starten (wenn nicht schon läuft)
subprocess.Popen(
    [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--profile-directory=Geschäftlich",
        "--remote-debugging-port=9336",
        URL,
    ],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

time.sleep(3)
print("✅ Step 1: Chrome 'Geschäftlich' + Admin Console geöffnet")
print(f"   URL: {URL}")
