from pathlib import Path

from .accounts import backup_accounts
from .accounts_inject import inject_new_account
from .main_cleanup_users import _cleanup_old_rotator_users
from .main_rotate_oauth import _rotate_run_oauth
from .main_rotate_tokens import _rotate_exchange_tokens
from .token_helpers import build_stored_refresh_token, compute_token_expiry
from .token_onboard import provision_managed_project
from .utils_log import log
from .utils_notify import notify, send_telegram
from .workspace_api import create_workspace_user, delete_workspace_user


def _current_keep_email() -> str:
    credentials_path = (
        Path(__file__).resolve().parent.parent / "logs" / "credentials.json"
    )
    if not credentials_path.exists():
        return ""
    try:
        import json

        return json.loads(credentials_path.read_text()).get("email", "")
    except Exception:
        return ""


async def rotate_account() -> bool:
    log("[main] Starting rotation ...")
    notify("Antigravity Rotator", "Starting rotation ...")
    backup_accounts()

    try:
        _cleanup_old_rotator_users(keep_email=_current_keep_email())
    except Exception as e:
        log(f"[main] Pre-rotation cleanup error: {e}", "WARN")

    user = None
    try:
        user = create_workspace_user()
        email = user["email"]
        password = user["password"]
        restored = bool(user.get("restored"))

        result = await _rotate_run_oauth(email, password)
        if not result:
            if restored:
                log(
                    f"[main] OAuth failed after restore for {email} - keeping restored account",
                    "WARN",
                )
            else:
                delete_workspace_user(email)
            return False

        tokens, project_id, stored_refresh = _rotate_exchange_tokens(
            result[0], result[2]
        )
        managed_project_id = provision_managed_project(tokens["access_token"])
        if managed_project_id and not project_id:
            project_id = managed_project_id
            stored_refresh = build_stored_refresh_token(
                tokens.get("refresh_token", ""), project_id
            )

        token_email = tokens.get("email") or email
        inject_new_account(
            token_email,
            stored_refresh,
            project_id,
            tokens["access_token"],
            compute_token_expiry(tokens["expires_in"]),
            managed_project_id=managed_project_id,
        )
        _cleanup_old_rotator_users(keep_email=token_email)

        log("[main] Done!")
        notify("Antigravity Rotator", f"Rotated to {token_email}")
        restore_note = " (restored deleted account)" if restored else ""
        send_telegram(
            "\u2705 <b>Rotation OK</b>\n"
            f"\U0001f4e7 Account: <code>{token_email}</code>{restore_note}\n"
            f"\U0001f5a5 Project: <code>{project_id or managed_project_id or 'unknown'}</code>"
        )
        return True
    except Exception as e:
        log(f"[main] Rotation failed: {e}", "ERROR")
        notify("Antigravity Rotator", f"Rotation failed: {e}")
        if user and user.get("email") and not user.get("restored"):
            delete_workspace_user(user["email"])
        return False
