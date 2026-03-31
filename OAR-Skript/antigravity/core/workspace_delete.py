from .workspace_service import _build_service
from .utils_log import log
def delete_workspace_user(email: str) -> None:
    try:
        _build_service().users().delete(userKey=email).execute()
        log(f"[workspace] Deleted {email}")
    except Exception as e:
        log(f"[workspace] Failed to delete {email}: {e}", "WARN")
