def rotate_run(email: str, password: str):
    from core.rotation.rotate_start import rotate_start
    from core.rotation.rotate_finish import rotate_finish
    from core.emergency_cleanup import cleanup_on_failure
    from core.utils_log import log
    from core.utils_notify import notify
    from core.main_rotate_oauth import _rotate_run_oauth
    from core.main_rotate_tokens import _rotate_exchange_tokens
    from core.token_onboard import provision_managed_project
    from core.token_helpers import build_stored_refresh_token
    from core.token_exchange import compute_token_expiry
    from core.main_cleanup_users import _cleanup_old_rotator_users
    from core.workspace_api import delete_workspace_user

    try:
        em, pw = rotate_start()
        result = await _rotate_run_oauth(em, pw)
        if not result:
            delete_workspace_user(em)
            return False

        tokens, pid, stored = _rotate_exchange_tokens(result[0], result[2])
        managed_pid = provision_managed_project(tokens["access_token"])

        if managed_pid and not pid:
            pid = managed_pid
            stored = build_stored_refresh_token(tokens.get("refresh_token", ""), pid)

        e2 = tokens.get("email") or em

        rotate_finish(
            e2,
            pid,
            stored,
            tokens["access_token"],
            compute_token_expiry(tokens["expires_in"]),
            managed_pid,
        )
        return True
    except Exception as e:
        log(f"[main] Rotation failed: {e}", "ERROR")
        notify("Antigravity Rotator", "Rotation failed")
        return False
