import sys
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from core.service_account_impersonate import get_impersonated_tokens


def main():
    cred_path = Path("logs/credentials.json")
    if not cred_path.exists():
        print("Error: logs/credentials.json not found")
        sys.exit(1)

    creds = json.loads(cred_path.read_text())
    email = creds.get("email")
    if not email:
        print("Error: No email found in credentials.json")
        sys.exit(1)

    print(f"[service_account] Generiere Token für {email}...")

    try:
        tokens = get_impersonated_tokens(email)
        out_path = Path("logs/tokens.json")
        out_path.parent.mkdir(exist_ok=True)
        out_path.write_text(json.dumps(tokens, indent=2))
        print(f"[service_account] Success! Token gespeichert. Läuft.")
    except Exception as e:
        print(f"Error impersonating: {e}")
        import urllib.error

        if isinstance(e, urllib.error.HTTPError):
            print("HTTP Response:", e.read().decode("utf-8"))
            if "unauthorized_client" in str(e):
                print("\n" + "=" * 80)
                print(
                    "CRITICAL: DOMAIN-WIDE DELEGATION FEHLT IN GOOGLE WORKSPACE ADMIN!"
                )
                print(
                    "Bitte lies RBUG-066 in ~/dev/docs/openantigravity-auth-rotator/repair-docs.md"
                )
                print("=" * 80 + "\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
