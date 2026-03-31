import json, os
from .accounts_path import OPENCODE_AUTH_PATH
from .utils_log import log
def inject_opencode_google_auth(stored_refresh: str, access_token: str, token_expiry_ms: int) -> None:
    OPENCODE_AUTH_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        auth = json.loads(OPENCODE_AUTH_PATH.read_text()) if OPENCODE_AUTH_PATH.exists() else {}
    except Exception as e:
        log(f"[accounts] Could not read opencode auth.json: {e}", "WARN"); auth = {}
    auth["google"] = {"type": "oauth", "refresh": stored_refresh, "access": access_token, "expires": token_expiry_ms}
    tmp = OPENCODE_AUTH_PATH.with_suffix(".json.tmp")
    try:
        tmp.write_text(json.dumps(auth, indent=2))
        os.chmod(tmp, 0o600)
        os.replace(tmp, OPENCODE_AUTH_PATH)
        log(f"[accounts] Injected google auth into {OPENCODE_AUTH_PATH}")
    except Exception as e:
        log(f"[accounts] Failed to update opencode auth.json: {e}", "WARN")
        tmp.unlink(missing_ok=True)
        raise
