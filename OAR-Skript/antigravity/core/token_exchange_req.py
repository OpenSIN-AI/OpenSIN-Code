import requests
from .token_consts import ANTIGRAVITY_CLIENT_ID, ANTIGRAVITY_CLIENT_SECRET, ANTIGRAVITY_REDIRECT_URI, GEMINI_USER_AGENT
from .utils_log import log
def _exchange_req(code: str, code_verifier: str) -> dict:
    log("[token] Exchanging OAuth code for tokens ...")
    resp = requests.post(
        "https://oauth2.googleapis.com/token",
        headers={"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "Accept": "*/*", "User-Agent": GEMINI_USER_AGENT},
        data={"client_id": ANTIGRAVITY_CLIENT_ID, "client_secret": ANTIGRAVITY_CLIENT_SECRET,
              "code": code, "grant_type": "authorization_code",
              "redirect_uri": ANTIGRAVITY_REDIRECT_URI, "code_verifier": code_verifier},
        timeout=15,
    )
    if not resp.ok:
        raise RuntimeError(f"Token exchange failed {resp.status_code}: {resp.text}")
    payload = resp.json()
    log(f"[token] Got tokens (expires_in={payload.get('expires_in')})")
    return payload
