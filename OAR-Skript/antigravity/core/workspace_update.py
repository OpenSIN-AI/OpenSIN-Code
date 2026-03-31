import time

from .utils_log import log
from .workspace_service import _build_service


def _update_user(user_key: str, body: dict, label: str) -> None:
    for i in range(6):
        try:
            _build_service().users().update(userKey=user_key, body=body).execute()
            log(f"[workspace] {label} for {user_key}")
            return
        except Exception as e:
            if i < 5:
                time.sleep(2)
            else:
                log(f"[workspace] Could not update {user_key}: {e}", "WARN")


def disable_login_challenge(email: str) -> None:
    _update_user(
        email,
        {"changePasswordAtNextLogin": False},
        "Login challenge disabled",
    )


def update_workspace_password(user_key: str, password: str) -> None:
    _update_user(
        user_key,
        {"password": password, "changePasswordAtNextLogin": False},
        "Password reset",
    )
