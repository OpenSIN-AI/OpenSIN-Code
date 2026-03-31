import time
from .accounts_load import load_accounts
from .accounts_save import save_accounts
from .accounts_opencode import inject_opencode_google_auth
from .utils_log import log


def inject_new_account(
    email: str,
    stored_refresh_token: str,
    project_id: str,
    access_token: str,
    token_expiry_ms: int,
    managed_project_id: str = "",
    force_replace: bool = True,
) -> None:
    storage = load_accounts()
    now = int(time.time() * 1000)
    new = {
        "email": email,
        "refreshToken": stored_refresh_token,
        "projectId": project_id,
        "managedProjectId": managed_project_id,
        "addedAt": now,
        "lastUsed": now,
        "lastSwitchReason": "antigravity-auth-rotator",
    }

    if force_replace:
        storage["accounts"] = [new]
    else:
        existing = storage.get("accounts", [])
        filtered = [
            a
            for a in existing
            if (
                (email and a.get("email") == email)
                or (managed_project_id and a.get("managedProjectId") == managed_project_id)
            )
            == False
        ]
        non_limited = [a for a in filtered if not a.get("rateLimitResetTimes")]
        keep = non_limited[:0]
        storage["accounts"] = [new] + keep
    storage["activeIndex"] = 0
    storage["activeIndexByFamily"] = {"gemini": 0, "claude": 0}
    save_accounts(storage)
    log(
        f"[accounts] Injected {email or '(email pending)'} as sole active account (managedProject={managed_project_id or 'none'})"
    )
    inject_opencode_google_auth(stored_refresh_token, access_token, token_expiry_ms)
