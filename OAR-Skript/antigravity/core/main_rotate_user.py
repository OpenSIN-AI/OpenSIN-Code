from .workspace_api import create_workspace_user, disable_login_challenge
from .utils_log import log
from .utils_notify import notify
def _rotate_create_user() -> tuple:
    try:
        user = create_workspace_user()
    except Exception as e:
        log(f"[main] Failed to create workspace user: {e}", "ERROR")
        notify("Antigravity Rotator", f"Workspace user creation failed: {e}")
        raise
    disable_login_challenge(user["email"])
    return user["email"], user["password"]
