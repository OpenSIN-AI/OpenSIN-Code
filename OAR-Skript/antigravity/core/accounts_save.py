import json, os
from .accounts_path import ACCOUNTS_PATH
from .utils_log import log
def save_accounts(storage: dict) -> None:
    ACCOUNTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = ACCOUNTS_PATH.with_suffix(".json.rotator.tmp")
    try:
        with open(tmp, "w") as f:
            json.dump(storage, f, indent=2)
        os.chmod(tmp, 0o600)
        os.replace(tmp, ACCOUNTS_PATH)
        log(f"[accounts] Saved {len(storage['accounts'])} account(s)")
    except Exception as e:
        log(f"[accounts] Save error: {e}", "WARN")
        tmp.unlink(missing_ok=True)
        raise
