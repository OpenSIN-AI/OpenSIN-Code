from .utils_log import log


def _get_antigravity_usage_section() -> str:
    try:
        import sys
        from pathlib import Path

        tracker_dir = str(
            Path.home() / ".open-auth-rotator" / "openai" / "watcher-core"
        )
        if tracker_dir not in sys.path:
            sys.path.insert(0, tracker_dir)
        from usage_tracker import get_all_provider_usage_total, _fmt_tokens

        data = get_all_provider_usage_total()
        prov = data.get("providers", {})
        google_data = prov.get("google", {})
        if not google_data or google_data.get("input", 0) == 0:
            return ""

        return (
            f"\n\n\U0001f4ca <b>Echte Antigravity Usage (DB)</b>\n"
            f"\U0001f3c6 Google/Antigravity: {_fmt_tokens(google_data['input'])} in / {_fmt_tokens(google_data['output'])} out\n"
            f"\U0001f4b5 Wert: <b>${google_data['cost_usd']:.2f}</b>\n"
            f"\U0001f4b0 Alle Provider gesamt: <b>${data['total_cost_usd']:.2f}</b>\n"
            f"\U0001f4ac {data['total_messages']} Messages total"
        )
    except Exception:
        return ""


def rotate_finish(
    email: str, pid: str, stored: str, access_token: str, expiry: int, managed_pid: str
) -> bool:
    from .accounts import inject_new_account
    from .accounts_opencode import inject_opencode_google_auth
    from .main_cleanup_users import _cleanup_old_rotator_users

    inject_new_account(
        email, stored, pid, access_token, expiry, managed_project_id=managed_pid
    )
    _cleanup_old_rotator_users(keep_email=email)

    # ── Savings vault snapshot ──
    try:
        import sys as _sys
        from pathlib import Path as _Path

        _vault_dir = str(
            _Path(__file__).parent.parent.parent.parent.parent
            / "openai"
            / "watcher-core"
        )
        if _vault_dir not in _sys.path:
            _sys.path.insert(0, _vault_dir)
        from savings_vault import push_savings_snapshot

        push_savings_snapshot(
            "antigravity_rotation", "antigravity", email, pool_remaining=-1
        )
    except Exception:
        pass

    log("[main] Done!")
    from .utils_notify import notify, send_telegram

    notify("Antigravity Rotator", f"Rotated to {email}")

    usage_section = _get_antigravity_usage_section()
    send_telegram(
        f"\u2705 <b>Rotation OK</b>\n"
        f"\U0001f4e7 Account: <code>{email}</code>\n"
        f"\U0001f5a5 Project: <code>{pid}</code>"
        f"{usage_section}"
    )
    return True
