import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from core.accounts_emails import get_active_email
from core.workspace_list import list_rotator_users
from core.workspace_delete import delete_workspace_user
from core.accounts_path import OPENCODE_AUTH_PATH
from core.utils_log import log
import json


def _check_auth_json() -> tuple[bool, str]:
    if not OPENCODE_AUTH_PATH.exists():
        return False, "auth.json does not exist"
    try:
        data = json.loads(OPENCODE_AUTH_PATH.read_text())
    except Exception as e:
        return False, f"auth.json unreadable: {e}"

    google = data.get("google")
    if not google:
        return False, "google provider missing in auth.json"

    refresh = google.get("refresh", "")
    access = google.get("access", "")
    expires = google.get("expires", 0)

    if not refresh:
        return False, "google.refresh is empty"

    import time

    if expires and expires < int(time.time() * 1000):
        return False, f"google.access token expired (expires={expires})"

    return True, f"google.refresh={refresh[:15]}... expires={expires}"


def main():
    ok_workspace = _check_workspace()
    ok_auth, auth_msg = _check_auth_json()

    if ok_workspace and ok_auth:
        log(f"[verify_one] ✓ Workspace: 1 rotator user, Auth: {auth_msg}")
        return 0

    errors = []
    if not ok_workspace:
        errors.append("workspace")
    if not ok_auth:
        errors.append(f"auth ({auth_msg})")

    log(f"[verify_one] ✗ Failed: {', '.join(errors)}", "ERROR")
    return 1


def _check_workspace() -> bool:
    active_email = get_active_email()
    users = list_rotator_users()
    count = len(users)

    if count == 1:
        user = users[0]
        email = user["primaryEmail"]
        if email == active_email:
            return True
        else:
            log(f"[verify_one] Workspace mismatch! Active={active_email}, Found={email}", "ERROR")
            return False
    elif count == 0:
        log("[verify_one] No rotator users found!", "ERROR")
        return False
    else:
        log(f"[verify_one] Found {count} rotator users, cleaning up...", "WARN")
        for u in users:
            email = u["primaryEmail"]
            if email != active_email:
                log(f"[verify_one] Deleting orphan: {email}")
                delete_workspace_user(email)

        remaining = list_rotator_users()
        if len(remaining) == 1 and remaining[0]["primaryEmail"] == active_email:
            log(f"[verify_one] Cleaned up, now exactly 1: {active_email}")
            return True
        else:
            log("[verify_one] Cleanup failed!", "ERROR")
            return False


if __name__ == "__main__":
    sys.exit(main())
