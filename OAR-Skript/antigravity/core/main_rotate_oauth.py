from .utils_log import log
from .utils_notify import notify
from core.login.login_async import _run_login


async def _rotate_run_oauth(email: str, password: str) -> tuple | None:
    log(f"[main] Running browser OAuth for {email} ...")
    try:
        result = await _run_login(email, password)
        if result is None:
            log("[main] Browser OAuth failed — rotation aborted", "ERROR")
            notify("Antigravity Rotator", "Browser OAuth failed")
            return None
        return result
    except Exception as e:
        error_msg = str(e).lower()
        if "chrome" in error_msg or "port" in error_msg or "7654" in error_msg:
            log(f"[main] Chrome failure: {e} — attempting cleanup", "ERROR")
            try:
                from .login.login_chrome import close_debug_chrome

                close_debug_chrome()
            except:
                pass
        log(f"[main] Browser OAuth failed: {e}", "ERROR")
        notify("Antigravity Rotator", f"OAuth error: {e}")
        return None
