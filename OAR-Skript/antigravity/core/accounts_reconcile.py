from .accounts_load import load_accounts
from .accounts_save import save_accounts
from .utils_log import log
from .workspace_api import list_rotator_users


def _email_value(value) -> str:
    if isinstance(value, dict):
        return value.get("email", "")
    return value or ""


def reconcile_accounts_with_workspace() -> list[str]:
    workspace_emails = {
        user.get("primaryEmail", "")
        for user in list_rotator_users()
        if user.get("primaryEmail")
    }
    storage = load_accounts()
    accounts = storage.get("accounts", []) or []
    kept = [a for a in accounts if _email_value(a.get("email", "")) in workspace_emails]
    removed = [
        _email_value(a.get("email", ""))
        for a in accounts
        if _email_value(a.get("email", "")) not in workspace_emails
    ]

    if not removed:
        return []

    storage["accounts"] = kept
    storage["activeIndex"] = 0
    storage["activeIndexByFamily"] = {"claude": 0, "gemini": 0}
    save_accounts(storage)
    log(f"[accounts] Reconciled dead local accounts: {removed}")

    # ZERO-DOWNTIME: NEVER remove the google key from auth.json here.
    # Even if no local accounts remain, keeping a (possibly stale) google
    # auth entry is far safer than removing it — removal crashes every
    # running opencode session instantly.  The guardian polls every 30s
    # and will refresh / re-inject when needed.
    if not kept:
        log(
            "[accounts] No local accounts remain after reconcile — google auth intentionally preserved"
        )

    return removed
