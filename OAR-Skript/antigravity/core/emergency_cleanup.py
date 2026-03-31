import subprocess


def delete_workspace_user(email: str) -> bool:
    from core.workspace_api import delete_workspace_user as api_delete
    from core.utils_log import log

    try:
        api_delete(email)
        log(f"[emergency_cleanup] Deleted workspace user: {email}")
        return True
    except Exception as e:
        log(f"[emergency_cleanup] Failed to delete {email}: {e}", "WARN")
        return False


def delete_account_from_opencode(email: str) -> bool:
    from core.accounts_path import OPENCODE_AUTH_PATH, ACCOUNTS_PATH
    from core.utils_log import log
    import json
    import os

    try:
        accounts = (
            json.loads(ACCOUNTS_PATH.read_text())
            if ACCOUNTS_PATH.exists()
            else {"accounts": [], "activeIndex": 0}
        )
        accounts["accounts"] = [
            a for a in accounts.get("accounts", []) if a.get("email") != email
        ]
        accounts["activeIndex"] = 0
        tmp = ACCOUNTS_PATH.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(accounts, indent=2))
        os.replace(tmp, ACCOUNTS_PATH)
        log(f"[emergency_cleanup] Removed {email} from antigravity-accounts.json")

        # ZERO-DOWNTIME: Never remove the google key from auth.json.
        # Removal crashes every running opencode session instantly.
        log(
            f"[emergency_cleanup] google auth in {OPENCODE_AUTH_PATH} intentionally preserved"
        )

        return True
    except Exception as e:
        log(f"[emergency_cleanup] Failed to remove account: {e}", "WARN")
        return False


async def cleanup_on_failure(email: str) -> None:
    from core.utils_log import log

    log(f"[emergency_cleanup] Starting cleanup for {email}")

    for attempt in range(3):
        log(f"[emergency_cleanup] Attempt {attempt + 1}/3")

        ok1 = delete_account_from_opencode(email)
        ok2 = delete_workspace_user(email)

        if ok1 and ok2:
            log(f"[emergency_cleanup] SUCCESS")
            return

        import asyncio

        await asyncio.sleep(1)

    log(f"[emergency_cleanup] FAILED after 3 attempts", "ERROR")
