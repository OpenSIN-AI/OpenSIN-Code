import json
from .accounts_path import ACCOUNTS_PATH, EMPTY_STORAGE
from .utils_log import log
def load_accounts() -> dict:
    if not ACCOUNTS_PATH.exists():
        log(f"[accounts] {ACCOUNTS_PATH} not found — starting empty")
        return dict(EMPTY_STORAGE)
    try:
        data = json.load(open(ACCOUNTS_PATH))
        if not isinstance(data.get("accounts"), list):
            log("[accounts] Invalid format — resetting", "WARN")
            return dict(EMPTY_STORAGE)
        return data
    except Exception as e:
        log(f"[accounts] Load error: {e}", "WARN")
        return dict(EMPTY_STORAGE)
