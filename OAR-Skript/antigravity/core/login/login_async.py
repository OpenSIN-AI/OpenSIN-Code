import secrets, subprocess
from .login_chrome import close_debug_chrome, connect_tab
from .step01_pkce import _pkce_pair
from . import (
    step01_navigate,
    step02_email,
    step03_password,
    step04_otp,
    step05_consent,
)
from .step03b_click import run as step03b_run

_DISMISS_SYNC = (
    'tell application "System Events" to tell process "Google Chrome" to try\n'
    'click button "Chrome ohne Konto verwenden" of window 1\nend try'
)


async def _acquire_oauth_tab():
    browser = await connect_tab()
    for attempt in range(2):
        try:
            tabs = list(getattr(browser, "tabs", []) or [])
        except Exception:
            tabs = []
        if tabs:
            return browser, tabs[0]
        try:
            return browser, await browser.get("about:blank", new_tab=True)
        except Exception as e:
            if attempt == 1 or "no browser is open" not in str(e).lower():
                raise
            print("[login_async] Browser reported no open tab; reconnecting once")
            close_debug_chrome()
            browser = await connect_tab()
    raise RuntimeError("Could not acquire OAuth tab")


async def _run_login(email: str, password: str) -> tuple | None:
    state = secrets.token_urlsafe(16)
    verifier, challenge = _pkce_pair()
    browser, tab = await _acquire_oauth_tab()
    try:
        await step01_navigate.run(tab, state, challenge, email)
        ok = await step02_email.run(tab, email)
        if not ok:
            return None
        ok = await step03_password.run(tab, password)
        if not ok:
            return None
        ok = await step03b_run(tab)
        if not ok:
            print("[login_async] Gaplustos/workspace interstitial did not clear")
            return None
        await step04_otp.run(tab)
        code = await step05_consent.run(tab)
        if not code:
            print("[login_async] No auth code returned from step05")
            return None
        print(f"[login_async] Auth code captured (len={len(code)})")
        return code, state, verifier
    finally:
        for _ in range(2):
            try:
                subprocess.run(["osascript", "-e", _DISMISS_SYNC], capture_output=True, timeout=1)
            except Exception:
                pass
        print("[login_async] Closing dedicated debug Chrome")
        close_debug_chrome()
        print("[login_async] Dedicated debug Chrome closed")
