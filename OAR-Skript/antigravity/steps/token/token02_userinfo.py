# Atomic: fetch userinfo email from Google using access token
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from pathlib import Path
import json
from core.token_userinfo import fetch_email

def main():
    tokens = json.loads(Path("logs/tokens.json").read_text())
    email = fetch_email(tokens["access_token"])
    tokens["email"] = email
    Path("logs/tokens.json").write_text(json.dumps(tokens, indent=2))
    print(f"[token02] userinfo email: {email}")

if __name__ == '__main__':
    main()
