from .token_project_req import _try_load_endpoints
from .utils_log import log
def fetch_project_id(access_token: str) -> str:
    pid = _try_load_endpoints(access_token)
    if not pid:
        log("[token] Could not resolve projectId — using empty string", "WARN")
    return pid
