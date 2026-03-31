from .accounts_emails import get_active_email
from .accounts_reconcile import reconcile_accounts_with_workspace
from .main_cleanup_users import _cleanup_old_rotator_users


def cmd_cleanup() -> None:
    removed = reconcile_accounts_with_workspace()
    keep = get_active_email()
    _cleanup_old_rotator_users(keep)
    if removed:
        print(f"Reconciled stale local accounts: {removed}")
    print(f"Cleanup finished. Active rotator account: {keep or 'none'}")
