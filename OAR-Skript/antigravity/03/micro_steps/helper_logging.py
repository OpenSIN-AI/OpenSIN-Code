#!/usr/bin/env python3
"""
Rotator 3 - Helper: Logging und Screenshots nach JEDER minimalen Aktion
"""

import subprocess
import time
from datetime import datetime
from pathlib import Path

SCREENSHOT_DIR = Path("/tmp/rotator3_screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True)

_screenshot_counter = 0


def log_action(action_desc: str):
    """Loggt eine einzelne Aktion mit Zeitstempel."""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] 👉 {action_desc}")


def screenshot_after(action_desc: str) -> str:
    """Macht SOFORT nach einer Aktion einen Screenshot."""
    global _screenshot_counter
    _screenshot_counter += 1
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"screenshot_{_screenshot_counter:03d}_{action_desc.replace(' ', '_')[:20]}_{timestamp}.png"
    filepath = SCREENSHOT_DIR / filename

    result = subprocess.run(
        ["/usr/sbin/screencapture", str(filepath)], capture_output=True
    )

    if result.returncode == 0:
        print(f"📸 {filepath.name}")
        return str(filepath)
    else:
        print(f"❌ Screenshot fehlgeschlagen")
        return ""


def action_sequence(step_name: str, actions: list):
    """
    Führt eine Sequenz von Aktionen aus, macht nach JEDER einen Screenshot.
    actions = [("Beschreibung", function_to_call, *args), ...]
    """
    print("\n" + "=" * 60)
    print(f"🚀 START: {step_name}")
    print("=" * 60)
    screenshot_after("START")

    for desc, func, *args in actions:
        log_action(desc)
        func(*args)
        screenshot_after(desc)
        time.sleep(0.2)  # Kurze Pause zwischen Aktionen

    print("\n" + "=" * 60)
    print(f"🏁 ENDE: {step_name}")
    print("=" * 60)
    screenshot_after("END")
