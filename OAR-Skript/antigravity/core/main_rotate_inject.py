from .accounts import inject_new_account
def _rotate_inject_and_cleanup(token_email: str, stored_refresh: str, project_id: str, access_token: str, token_expiry_ms: int, managed_project_id: str = "") -> None:
    inject_new_account(
        email=token_email,
        stored_refresh_token=stored_refresh,
        project_id=project_id,
        access_token=access_token,
        token_expiry_ms=token_expiry_ms,
        managed_project_id=managed_project_id,
    )
