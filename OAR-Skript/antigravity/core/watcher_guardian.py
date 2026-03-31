import json
import time
from .watcher_config import ACCOUNTS_PATH, OPENCODE_AUTH_PATH
from .watcher_guardian_token import _refresh_google_token
from .watcher_guardian_write import _write_google_auth
from .utils_log import log


def _sanitize_accounts_to_one(data: dict) -> tuple[dict, bool]:
    accounts = data.get("accounts", [])
    if not isinstance(accounts, list) or len(accounts) <= 1:
        return data, False
    now_ms = int(time.time() * 1000)

    unblocked = [
        a
        for a in accounts
        if not any(
            v > now_ms
            for v in (a.get("rateLimitResetTimes") or {}).values()
            if isinstance(v, (int, float))
        )
    ]
    active = (
        unblocked[0] if unblocked else accounts[int(data.get("activeIndex", 0) or 0)]
    )
    data["accounts"] = [active]
    data["activeIndex"] = 0
    data["activeIndexByFamily"] = {"claude": 0, "gemini": 0}
    return data, True


def guard_google_auth() -> None:
    try:
        auth = (
            json.loads(OPENCODE_AUTH_PATH.read_text())
            if OPENCODE_AUTH_PATH.exists()
            else {}
        )
    except Exception:
        auth = {}
    try:
        data = json.loads(ACCOUNTS_PATH.read_text())
        data, changed = _sanitize_accounts_to_one(data)
        if changed:
            from .accounts_save import save_accounts

            save_accounts(data)
            log("[watcher] guardian: sanitized antigravity-accounts.json to 1 account")
        stored = (data.get("accounts") or [{}])[0].get("refreshToken", "")
        if not stored:
            return
    except Exception as e:
        log(f"[watcher] guardian: could not read accounts: {e}", "WARN")
        return

    google_auth = auth.get("google", {})
    needs_refresh = False
    needs_sync_accounts = False

    if google_auth.get("type") != "oauth":
        needs_refresh = True
    elif google_auth.get("refresh") != stored:
        # RBUG: mismatch means auth.json has a NEWER token (e.g. from OCI rotation).
        # DO NOT refresh accounts[0] — that would destroy the working token with invalid_grant.
        # Instead: sync accounts[0].refreshToken TO match auth.json (auth.json is source of truth).
        auth_refresh = google_auth.get("refresh", "")
        if auth_refresh:
            log(
                "[watcher] guardian: refresh mismatch — auth.json is newer, syncing accounts to match"
            )
            needs_sync_accounts = True
        else:
            log(
                "[watcher] guardian: auth.json has no refresh token, refreshing stored account"
            )
            needs_refresh = True
    else:
        # Epic #74 - 3E-18: Verify OAuth token refresh works before expiry
        expires_ms = google_auth.get("expires", 0)
        now_ms = time.time() * 1000
        if now_ms > (expires_ms - 300000):
            log(
                "[watcher] guardian: Google OAuth token is expired or expiring soon, refreshing..."
            )
            needs_refresh = True

    if needs_sync_accounts:
        # Sync accounts[0].refreshToken to match the working auth.json refresh token
        try:
            auth_refresh = google_auth.get("refresh", "")
            account = (data.get("accounts") or [{}])[0]
            account["refreshToken"] = auth_refresh
            data["accounts"] = [account]
            data["activeIndex"] = 0
            data["activeIndexByFamily"] = {"claude": 0, "gemini": 0}
            from .accounts_save import save_accounts

            save_accounts(data)
            log("[watcher] guardian: accounts synced to auth.json refresh token")
        except Exception as e:
            log(f"[watcher] guardian: accounts sync failed: {e}", "WARN")
        return

    if not needs_refresh:
        return

    resp = _refresh_google_token(stored.split("|")[0])
    if resp:
        _write_google_auth(OPENCODE_AUTH_PATH, stored, resp)
