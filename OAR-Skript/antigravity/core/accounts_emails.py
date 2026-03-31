from .accounts_load import load_accounts


def get_all_emails() -> list:
    storage = load_accounts()
    return [a.get("email", "") for a in storage.get("accounts", [])]


def get_active_email() -> str:
    storage = load_accounts()
    accounts = storage.get("accounts", []) or []
    try:
        idx = int(storage.get("activeIndex", 0) or 0)
    except Exception:
        idx = 0
    if 0 <= idx < len(accounts):
        return accounts[idx].get("email", "") or ""
    return (accounts[0].get("email", "") or "") if accounts else ""
