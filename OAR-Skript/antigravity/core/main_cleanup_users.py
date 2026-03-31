import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.accounts_load import load_accounts
from core.accounts_save import save_accounts
from core.utils_log import log
from core.workspace_api import delete_workspace_user, list_rotator_users


def _cleanup_old_rotator_users(keep_email: str) -> None:
    keep = (keep_email or "").strip()
    deleted = []
    for user in list_rotator_users():
        email = user.get("primaryEmail", "")
        if not email or email == keep:
            continue
        try:
            delete_workspace_user(email)
            deleted.append(email)
        except Exception as e:
            log(f"[cleanup] Could not delete {email}: {e}", "WARN")
    storage = load_accounts()
    accounts = storage.get("accounts", []) or []
    if keep:
        storage["accounts"] = [a for a in accounts if a.get("email", "") == keep][:1]
    else:
        storage["accounts"] = accounts[:1]
    storage["activeIndex"] = 0
    storage["activeIndexByFamily"] = {"claude": 0, "gemini": 0}
    save_accounts(storage)
    if deleted:
        log(f"[cleanup] Deleted old rotator users: {deleted}")
    else:
        log(f"[cleanup] No old rotator users to delete (keep={keep})")
