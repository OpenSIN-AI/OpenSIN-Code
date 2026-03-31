import requests
from .token_consts import GEMINI_USER_AGENT
from .utils_log import log
def fetch_email(access_token: str) -> str:
    try:
        resp = requests.get(
            "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
            headers={"Authorization": f"Bearer {access_token}", "User-Agent": GEMINI_USER_AGENT},
            timeout=10,
        )
        if resp.ok:
            email = resp.json().get("email", "")
            log(f"[token] Authenticated as {email}")
            return email
    except Exception as e:
        log(f"[token] Could not fetch email: {e}", "WARN")
    return ""
