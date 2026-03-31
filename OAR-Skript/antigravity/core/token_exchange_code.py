from .token_exchange_req import _exchange_req
from .token_userinfo import fetch_email
def exchange_code_for_tokens(code: str, code_verifier: str) -> dict:
    payload = _exchange_req(code, code_verifier)
    email = fetch_email(payload["access_token"])
    return {
        "access_token": payload["access_token"],
        "refresh_token": payload.get("refresh_token", ""),
        "expires_in": payload.get("expires_in", 3600),
        "email": email,
    }
