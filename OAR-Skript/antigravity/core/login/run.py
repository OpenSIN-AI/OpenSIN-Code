import asyncio
import nodriver as uc
from .login_async import _run_login
from ..utils_log import log
import traceback


def oauth_login(email: str, password: str) -> tuple | None:
    try:
        log(f"[login/run] Starting OAuth login for {email}...")

        async def run():
            log(f"[login/run] Running _run_login coroutine")
            return await _run_login(email, password)

        try:
            loop = asyncio.get_running_loop()
            log(f"[login/run] Found running loop, using run_coroutine_threadsafe")
            return asyncio.run_coroutine_threadsafe(run(), loop).result(timeout=120)
        except RuntimeError:
            log(f"[login/run] No running loop, using asyncio.run")
            return asyncio.run(run())
    except Exception as e:
        log(f"[login/run] Error: {e}", "ERROR")
        log(f"[login/run] Traceback: {traceback.format_exc()}", "ERROR")
        return None
