# Atomic: delete ALL old rotator-* workspace users except the current one.
# Full sweep prevents orphaned accounts from failed rotations.
import sys, json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from core.workspace_service import _build_service, _get_domain
from core.workspace_delete import delete_workspace_user
from core.accounts_emails import get_active_email


def main():
    cur = Path("logs/credentials.json")
    cur_email = json.loads(cur.read_text()).get("email", "") if cur.exists() else ""

    tokens = Path("logs/tokens.json")
    tokens_email = json.loads(tokens.read_text()).get("email", "") if tokens.exists() else ""

    keep = {e for e in (cur_email, tokens_email, get_active_email()) if e}
    if not keep:
        print("[ws00] No keep email resolved - skipping sweep")
        return
    svc = _build_service()
    domain = _get_domain()
    kept = deleted = 0
    token = None
    while True:
        kw = {"domain": domain, "maxResults": 200}
        if token:
            kw["pageToken"] = token
        res = svc.users().list(**kw).execute()
        for u in res.get("users", []):
            em = u.get("primaryEmail", "")
            if not em.startswith("rotator-"):
                continue
            if em in keep:
                kept += 1
                continue
            delete_workspace_user(em)
            deleted += 1
        token = res.get("nextPageToken")
        if not token:
            break
    Path("logs/prev_credentials.json").unlink(missing_ok=True)
    print(f"[ws00] Sweep: {deleted} deleted, {kept} kept ({','.join(sorted(keep))})")


if __name__ == "__main__":
    main()
