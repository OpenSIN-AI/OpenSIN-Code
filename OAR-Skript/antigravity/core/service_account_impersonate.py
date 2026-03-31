import sys
import json
import os
from pathlib import Path

SERVICE_ACCOUNT_EMAIL = "ki-agent@artificial-biometrics.iam.gserviceaccount.com"
SERVICE_ACCOUNT_PATH = os.environ.get(
    "GOOGLE_APPLICATION_CREDENTIALS",
    str(
        Path.home()
        / ".config/gcloud/legacy_credentials/ki-agent@artificial-biometrics.iam.gserviceaccount.com/adc.json"
    ),
)

SCOPES = [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
]


def get_impersonated_tokens(user_email: str) -> dict:
    import urllib.request
    import urllib.parse
    import time
    from google.oauth2 import service_account

    if not Path(SERVICE_ACCOUNT_PATH).exists():
        raise FileNotFoundError(
            f"Service account credentials not found at {SERVICE_ACCOUNT_PATH}"
        )

    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_PATH, scopes=SCOPES
    )

    import google.auth.jwt

    now = int(time.time())

    payload = {
        "iss": creds.service_account_email,
        "sub": user_email,
        "aud": "https://oauth2.googleapis.com/token",
        "exp": now + 3600,
        "iat": now,
        "scope": " ".join(SCOPES),
    }

    signer = creds.signer
    jwt = google.auth.jwt.encode(signer, payload).decode("utf-8")

    data = urllib.parse.urlencode(
        {"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": jwt}
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    with urllib.request.urlopen(req) as response:
        resp_data = json.loads(response.read().decode("utf-8"))

    return {
        "access_token": resp_data["access_token"],
        "refresh_token": f"service_account_impersonation:{user_email}",
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": "955661971872-ie97v0ns6ndb19rbr9nlpkahpmfk9ugf.apps.googleusercontent.com",
        "client_secret": "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",
        "scopes": SCOPES,
        "universe_domain": "googleapis.com",
        "account": user_email,
        "expires_in": resp_data["expires_in"],
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 service_account_impersonate.py <user_email>")
        sys.exit(1)

    user_email = sys.argv[1]

    print(f"[service_account] Impersonating {user_email}...")

    tokens = get_impersonated_tokens(user_email)

    print(f"[service_account] Got access token: {tokens['access_token'][:50]}...")
    print(f"[service_account] Tokens obtained without OAuth flow!")

    output_path = Path("logs/tokens.json")
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(json.dumps(tokens, indent=2))

    print(f"[service_account] Saved tokens to {output_path}")


if __name__ == "__main__":
    main()
