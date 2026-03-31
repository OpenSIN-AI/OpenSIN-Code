# Atomic: inject google auth token into ~/.local/share/opencode/auth.json
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from pathlib import Path; import json, time
from core.accounts_opencode import inject_opencode_google_auth
def main():
    tokens = json.loads(Path("logs/tokens.json").read_text())
    access = tokens["access_token"]
    expiry_ms = int(time.time() * 1000) + tokens.get("expires_in", 3600) * 1000
    inject_opencode_google_auth(tokens.get("refresh_token",""), access, expiry_ms)
    print(f"[token04] Auth injected into opencode for {tokens.get('email','?')}")
if __name__ == '__main__': main()
