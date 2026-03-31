import json, os, time
from .utils_log import log
def _write_google_auth(auth_path, stored_refresh: str, resp: dict) -> None:
    expires_ms = int((time.time() + resp.get("expires_in", 3600)) * 1000)
    try:
        auth = json.loads(auth_path.read_text()) if auth_path.exists() else {}
    except Exception:
        auth = {}
    auth["google"] = {"type": "oauth", "refresh": stored_refresh, "access": resp["access_token"], "expires": expires_ms}
    tmp = auth_path.with_suffix(".json.tmp")
    try:
        tmp.write_text(json.dumps(auth, indent=2)); os.chmod(tmp, 0o600); os.replace(tmp, auth_path)
        log("[watcher] guardian: google auth re-injected into auth.json")
    except Exception as e:
        log(f"[watcher] guardian: write failed: {e}", "WARN")
