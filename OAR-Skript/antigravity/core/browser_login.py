from .login.run import oauth_login
from .utils_log import log
def run_oauth_login(email: str, password: str) -> tuple | None:
    result = oauth_login(email=email, password=password)
    if not result:
        log("[browser_login] OAuth failed — see /tmp/openAntigravity_screenshots/", "WARN")
        return None
    return result
