# Atomic: save new account to antigravity-accounts.json (v4 format)
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from pathlib import Path; import json, time
from core.accounts_inject import inject_new_account
def main():
    tokens = json.loads(Path("logs/tokens.json").read_text())
    email = tokens["email"]
    access = tokens["access_token"]
    expiry_ms = int(time.time() * 1000) + tokens.get("expires_in", 3600) * 1000
    raw_rt = tokens.get("refresh_token", "")
    managed = tokens.get("managed_project_id", "")
    inject_new_account(email, raw_rt, "", access, expiry_ms, managed)
    print(f"[token03] Account saved: {email} (managedProject={managed or 'none'})")
if __name__ == '__main__': main()
