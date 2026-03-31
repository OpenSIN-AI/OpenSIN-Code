from .token_exchange import exchange_code_for_tokens, fetch_project_id, build_stored_refresh_token
from .utils_log import log
from .utils_notify import notify
def _rotate_exchange_tokens(code: str, verifier: str) -> tuple:
    try:
        tokens = exchange_code_for_tokens(code, verifier)
    except Exception as e:
        log(f"[main] Token exchange failed: {e}", "ERROR")
        notify("Antigravity Rotator", f"Token exchange failed: {e}")
        raise
    access_token = tokens["access_token"]
    project_id   = fetch_project_id(access_token)
    stored       = build_stored_refresh_token(tokens["refresh_token"], project_id)
    return tokens, project_id, stored
