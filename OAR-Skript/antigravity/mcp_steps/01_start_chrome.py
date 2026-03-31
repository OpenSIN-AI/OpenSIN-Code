#!/usr/bin/env python3
import subprocess
import time
from pathlib import Path

PROFILE_DIR = Path("/tmp/openAntigravity_login_profile_7654")
CHROME_CMD = [
    "open",
    "-a",
    "Google Chrome",
    "--args",
    "--remote-debugging-port=7654",
    f"--user-data-dir={PROFILE_DIR}",
]


def run():
    try:
        result = subprocess.run(
            ["lsof", "-i", ":7654"], capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            print("Chrome already running on port 7654")
            return True
    except Exception as e:
        print(f"Check Chrome: {e}")

    print("Starting Chrome on port 7654...")
    subprocess.Popen(CHROME_CMD, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(3)
    print("Chrome started")
    return True


if __name__ == "__main__":
    run()
