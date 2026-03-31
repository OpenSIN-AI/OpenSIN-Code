# Atomic: exchange auth code for tokens using PKCE verifier
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from pathlib import Path; import json
from core.token_exchange_code import exchange_code_for_tokens
def main():
    code = Path("logs/auth_code.txt").read_text().strip()
    verifier = Path("logs/pkce_verifier.txt").read_text().strip()
    tokens = exchange_code_for_tokens(code, verifier)
    Path("logs").mkdir(exist_ok=True)
    Path("logs/tokens.json").write_text(json.dumps(tokens, indent=2))
    print(f"[token01] Tokens saved for {tokens.get('email','?')}")
if __name__ == '__main__': main()
