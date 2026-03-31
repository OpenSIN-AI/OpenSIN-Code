import time
def build_stored_refresh_token(refresh_token: str, project_id: str) -> str:
    return f"{refresh_token}|{project_id}"
def compute_token_expiry(expires_in: int) -> int:
    return int((time.time() + expires_in) * 1000)
