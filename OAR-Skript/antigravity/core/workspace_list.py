from .workspace_service import _build_service, _get_domain
from .utils_log import log


def list_rotator_users() -> list:
    users, token = [], None
    try:
        svc = _build_service()
        while True:
            kw = {"domain": _get_domain(), "query": "givenName:Rotator", "maxResults": 200}
            if token:
                kw["pageToken"] = token
            res = svc.users().list(**kw).execute()
            users += res.get("users", [])
            token = res.get("nextPageToken")
            if not token:
                return users
    except Exception as e:
        log(f"[workspace] Could not list rotator users: {e}", "WARN")
        return []
