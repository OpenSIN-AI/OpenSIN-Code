#!/usr/bin/env python3
"""
Restores Google Admin Console login state from saved cookies.
Run this BEFORE starting any browser automation for Google Admin tasks.

This ensures you never have to manually log in again.
"""

import json
import sqlite3
from pathlib import Path

PROFILE_DIR = Path("/Users/jeremy/dev/webauto-nodriver-mcp/chrome_profile/Geschäftlich")
COOKIES_FILE = Path("/Users/jeremy/.config/opencode/google_admin_cookies.json")
COOKIES_DB = PROFILE_DIR / "Cookies"


def restore_cookies():
    if not COOKIES_FILE.exists():
        print(f"❌ No saved cookies found at {COOKIES_FILE}")
        print("   Run manual login first, then this script will save them.")
        return False

    if not PROFILE_DIR.exists():
        print(f"❌ Profile directory not found: {PROFILE_DIR}")
        return False

    try:
        with open(COOKIES_FILE) as f:
            cookies = json.load(f)

        # Connect to Chrome's cookies DB
        conn = sqlite3.connect(str(COOKIES_DB))
        cursor = conn.cursor()

        restored = 0
        for cookie in cookies:
            # Check if cookie already exists
            cursor.execute(
                "SELECT 1 FROM cookies WHERE name=? AND host_key=?",
                (cookie["name"], cookie["domain"]),
            )
            if cursor.fetchone():
                # Update existing
                cursor.execute(
                    """UPDATE cookies 
                       SET value=?, path=?, expires_utc=?, is_secure=?, is_httponly=?
                       WHERE name=? AND host_key=?""",
                    (
                        cookie["value"],
                        cookie["path"],
                        cookie["expirationDate"],
                        1 if cookie.get("secure") else 0,
                        0,
                        cookie["name"],
                        cookie["domain"],
                    ),
                )
            else:
                # Insert new
                cursor.execute(
                    """INSERT INTO cookies 
                       (name, value, host_key, path, expires_utc, is_secure, is_httponly, creation, last_access)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        cookie["name"],
                        cookie["value"],
                        cookie["domain"],
                        cookie["path"],
                        cookie["expirationDate"],
                        1 if cookie.get("secure") else 0,
                        0,
                        cookie["expirationDate"],
                        cookie["expirationDate"],
                    ),
                )
            restored += 1

        conn.commit()
        conn.close()

        print(f"✅ Restored {restored} cookies to Google Admin profile")
        print(f"   Profile: {PROFILE_DIR}")
        print(f"   Next time: Browser will auto-login to admin.google.com")
        return True

    except Exception as e:
        print(f"❌ Error restoring cookies: {e}")
        return False


if __name__ == "__main__":
    restore_cookies()
