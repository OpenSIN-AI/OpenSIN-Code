#!/opt/homebrew/bin/python3
"""
Manuelle Antigravity Rotation
Usage: python3 rotate_now.py
"""
import sys
import asyncio
sys.path.insert(0, "/Users/jeremy/.open-auth-rotator/antigravity")
from core.main_rotate import rotate_account

if __name__ == "__main__":
    print("Starting manual Antigravity rotation...")
    result = asyncio.run(rotate_account())
    if result:
        print("✅ Rotation successful!")
    else:
        print("❌ Rotation failed!")
    sys.exit(0 if result else 1)
