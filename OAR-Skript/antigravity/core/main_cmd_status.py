from .accounts import get_all_emails
from .accounts_reconcile import reconcile_accounts_with_workspace


def cmd_status() -> None:
    reconcile_accounts_with_workspace()
    emails = get_all_emails()
    if not emails:
        print("No accounts in antigravity-accounts.json")
        return
    print(f"Antigravity accounts ({len(emails)}):")
    for i, e in enumerate(emails):
        print(f"  [{i}] {e}")
