import time

from .workspace_service import _build_service, _get_domain
from .utils_password import generate_password
from .utils_log import log


def _is_google_creation_block(error: Exception) -> bool:
    status = getattr(getattr(error, "resp", None), "status", None)
    message = str(error).lower()
    return status == 412 or "conditionnotmet" in message or "abuse" in message


def create_workspace_user() -> dict:
    service = _build_service()
    domain = _get_domain()
    suffix = int(time.time())
    email = f"rotator-{suffix}@{domain}"
    pw = generate_password(20)
    log(f"[workspace] Creating {email} ...")
    try:
        user = (
            service.users()
            .insert(
                body={
                    "primaryEmail": email,
                    "name": {"givenName": "Rotator", "familyName": str(suffix)},
                    "password": pw,
                    "changePasswordAtNextLogin": False,
                    "orgUnitPath": "/",
                }
            )
            .execute()
        )
    except Exception as e:
        if _is_google_creation_block(e):
            from .workspace_restore import restore_deleted_workspace_user

            log(
                f"[workspace] Google creation blocked ({e}) - falling back to deleted rotator restore",
                "WARN",
            )
            return restore_deleted_workspace_user(password=pw)
        raise
    log(f"[workspace] Created: {user.get('primaryEmail')}")
    time.sleep(10)
    return {
        "email": email,
        "password": pw,
        "user_id": user.get("id", ""),
        "restored": False,
    }
