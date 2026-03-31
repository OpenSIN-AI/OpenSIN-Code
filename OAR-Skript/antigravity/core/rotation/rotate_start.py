from pathlib import Path
from .main_cleanup_users import _cleanup_old_rotator_users
from .workspace_api import delete_workspace_user
from .utils_log import log
from .utils_notify import notify


def _cleanup_user(email: str):
    try:
        delete_workspace_user(email)
    except Exception:
        pass


def _rotate_start() -> str:
    from .accounts import backup_accounts
    from .main_rotate_user import _rotate_create_user

    log("[main] Starting rotation ...")
    notify("Antigravity Rotator", "Starting rotation ...")
    backup_accounts()

    try:
        cur_creds = Path(__file__).parent.parent / "logs" / "credentials.json"
        keep_now = ""
        if cur_creds.exists():
            import json

            keep_now = json.loads(cur_creds.read_text()).get("email", "")
        _cleanup_old_rotator_users(keep_email=keep_now)
    except Exception as e:
        log(f"[main] Pre-rotation cleanup error: {e}", "WARN")

    em, pw = _rotate_create_user()
    return em, pw
