import time
import json
import os
from datetime import datetime
from .workspace_list import list_rotator_users
from .workspace_api import delete_workspace_user
from .utils_log import log
from .accounts_path import ACCOUNTS_PATH
from .watcher_config import LOCK_FILE

# Never delete these specific accounts
PROTECTED_ACCOUNTS = {
    "info@zukunftsorientierte-energie.de",
    "kundenservice@zukunftsorientierte-energie.de",
    "gina.schule@zukunftsorientierte-energie.de",
}


def _get_active_email() -> str:
    try:
        if ACCOUNTS_PATH.exists():
            data = json.loads(ACCOUNTS_PATH.read_text())
            accounts = data.get("accounts", [])
            if accounts:
                return accounts[0].get("email", "")
    except Exception:
        pass
    return ""


def cleanup_workspace_accounts() -> None:
    """Daemon task to enforce max 1 rotator account in workspace and delete >24h old accounts."""
    try:
        if LOCK_FILE.exists():
            log(
                "[workspace_cleanup] Rotation lock present - skipping cleanup to avoid deleting in-flight account"
            )
            return
        active_email = _get_active_email()
        users = list_rotator_users()
        rotators = []
        now = datetime.utcnow()

        for u in users:
            em = u.get("primaryEmail", "")
            if not em or em in PROTECTED_ACCOUNTS:
                continue
            if em.startswith("rotator-"):
                # u.get("creationTime") format: 2026-03-24T06:48:30.000Z
                ctime_str = u.get("creationTime", "")
                age_hours = 0
                if ctime_str:
                    try:
                        dt = datetime.strptime(
                            ctime_str.split(".")[0].replace("Z", ""),
                            "%Y-%m-%dT%H:%M:%S",
                        )
                        age_hours = (now - dt).total_seconds() / 3600
                    except Exception:
                        pass

                rotators.append({"email": em, "age_hours": age_hours})

        # Separate >24h accounts immediately
        to_delete = [
            r["email"]
            for r in rotators
            if r["age_hours"] > 24.0 and r["email"] != active_email
        ]
        valid_rotators = [r["email"] for r in rotators if r["email"] not in to_delete]

        if len(valid_rotators) > 1:
            # Enforce max 1 rule for the remaining ones
            keep = (
                active_email if active_email in valid_rotators else valid_rotators[-1]
            )  # Newest is usually last, but active_email is safer
            for em in valid_rotators:
                if em != keep:
                    to_delete.append(em)

        if to_delete:
            to_delete = list(set(to_delete))  # dedup
            log(
                f"[workspace_cleanup] Found {len(rotators)} rotators. Deleting {len(to_delete)} (aged >24h or dupes)..."
            )
            for em in to_delete:
                try:
                    delete_workspace_user(em)
                    log(f"[workspace_cleanup] Deleted {em}")
                except Exception as e:
                    log(f"[workspace_cleanup] Failed to delete {em}: {e}", "WARN")
        else:
            log(
                f"[workspace_cleanup] Workspace is clean. 1 active rotator found: {active_email}"
            )

    except Exception as e:
        log(f"[workspace_cleanup] Error running cleanup daemon: {e}", "WARN")


if __name__ == "__main__":
    cleanup_workspace_accounts()
