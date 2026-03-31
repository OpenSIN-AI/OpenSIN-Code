import time
from datetime import datetime, timezone
from typing import Iterator, TypedDict

from .utils_log import log
from .utils_password import ROTATOR_PASSWORD
from .workspace_service import _build_service, _get_domain
from .workspace_update import disable_login_challenge, update_workspace_password

RESTORE_MIN_AGE_HOURS = 170.0


class RestorableDeletedUser(TypedDict):
    email: str
    user_id: str
    deletion_time: str
    age_hours: float
    deleted_at: datetime


def _parse_google_timestamp(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M:%S.000Z").replace(
            tzinfo=timezone.utc
        )
    except ValueError:
        return None


def _iter_deleted_rotator_users() -> Iterator[dict]:
    service = _build_service()
    token = None
    while True:
        kw = {"domain": _get_domain(), "maxResults": 200, "showDeleted": "true"}
        if token:
            kw["pageToken"] = token
        response = service.users().list(**kw).execute()
        for user in response.get("users", []) or []:
            email = user.get("primaryEmail", "")
            if email.startswith("rotator-") and user.get("deletionTime"):
                yield user
        token = response.get("nextPageToken")
        if not token:
            return


def find_restorable_deleted_user(
    min_age_hours: float = RESTORE_MIN_AGE_HOURS,
) -> RestorableDeletedUser | None:
    now = datetime.now(timezone.utc)
    best: RestorableDeletedUser | None = None
    best_deleted_at: datetime | None = None
    for user in _iter_deleted_rotator_users():
        deleted_at = _parse_google_timestamp(user.get("deletionTime", ""))
        if deleted_at is None:
            continue
        age_hours = (now - deleted_at).total_seconds() / 3600
        if age_hours < min_age_hours:
            continue
        candidate: RestorableDeletedUser = {
            "email": user.get("primaryEmail", ""),
            "user_id": user.get("id", ""),
            "deletion_time": user.get("deletionTime", ""),
            "age_hours": age_hours,
            "deleted_at": deleted_at,
        }
        if best_deleted_at is None or deleted_at > best_deleted_at:
            best = candidate
            best_deleted_at = deleted_at
    if best:
        log(
            f"[workspace] Restorable deleted rotator found: {best['email']} "
            f"age={best['age_hours']:.1f}h deletedAt={best['deletion_time']}"
        )
    else:
        log(
            f"[workspace] No deleted rotator account satisfies the restore window "
            f"(minAgeHours={min_age_hours})",
            "WARN",
        )
    return best


def restore_deleted_workspace_user(
    min_age_hours: float = RESTORE_MIN_AGE_HOURS,
    password: str = ROTATOR_PASSWORD,
) -> dict[str, object]:
    candidate = find_restorable_deleted_user(min_age_hours=min_age_hours)
    if not candidate:
        raise RuntimeError(
            "Google creation blocked and no eligible deleted rotator account could be restored"
        )

    service = _build_service()
    log(
        f"[workspace] Restoring deleted rotator {candidate['email']} "
        f"(deletedAt={candidate['deletion_time']})"
    )
    service.users().undelete(
        userKey=candidate["user_id"], body={"orgUnitPath": "/"}
    ).execute()
    time.sleep(10)

    restored = service.users().get(userKey=candidate["user_id"]).execute()
    email = restored.get("primaryEmail", candidate["email"])
    update_workspace_password(email, password)
    disable_login_challenge(email)
    log(
        f"[workspace] Restored deleted rotator {email} with fixed password "
        f"(age={candidate['age_hours']:.1f}h)"
    )
    return {
        "email": email,
        "password": password,
        "user_id": candidate["user_id"],
        "restored": True,
        "deletionTime": candidate["deletion_time"],
        "ageHours": candidate["age_hours"],
    }
