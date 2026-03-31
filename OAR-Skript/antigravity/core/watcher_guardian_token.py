import requests
from .token_consts import ANTIGRAVITY_CLIENT_ID, ANTIGRAVITY_CLIENT_SECRET
from .utils_log import log
def _refresh_google_token(refresh_token: str) -> dict | None:
    try:
        resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={"client_id": ANTIGRAVITY_CLIENT_ID, "client_secret": ANTIGRAVITY_CLIENT_SECRET,
                  "refresh_token": refresh_token, "grant_type": "refresh_token"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        ).json()
        if "error" in resp:
            log(f"[watcher] guardian: token error: {resp.get('error')}", "WARN"); return None
        return resp
    except Exception as e:
        log(f"[watcher] guardian: token refresh failed: {e}", "WARN"); return None
