import shutil, time
from .accounts_path import ACCOUNTS_PATH
from .utils_log import log
def backup_accounts():
    if not ACCOUNTS_PATH.exists():
        return None
    bak = ACCOUNTS_PATH.with_suffix(f".json.{int(time.time())}.bak")
    try:
        shutil.copy2(ACCOUNTS_PATH, bak); log(f"[accounts] Backup -> {bak}"); return bak
    except Exception as e:
        log(f"[accounts] Backup failed: {e}", "WARN"); return None
