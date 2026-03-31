import asyncio
import re
import subprocess

from .step05_cdp_click import _cdp_click
from .step05_find_btn import _find_button_coords

ALLOW_TEXTS = [
    "Anmelden",
    "Allow",
    "Zulassen",
    "Fortfahren",
    "Continue",
    "Weiter",
    "Accept",
    "Akzeptieren",
]

_DISMISS = 'tell app "System Events" to tell process "Google Chrome" to try\nclick button "Chrome ohne Konto verwenden" of window 1\nend try'
_DISMISS_DEEP = """tell application "System Events"
tell process "Google Chrome"
try
click (first UI element of entire contents of window 1 whose name is "Chrome ohne Konto verwenden")
return "clicked"
on error
return "missing"
end try
end tell
end tell"""
_DISMISS_KEYS = """tell application "System Events"
tell process "Google Chrome"
key code 48 using shift down
delay 0.1
key code 48 using shift down
return "shift-tab-x2-no-enter"
end tell
end tell"""


def _run_script(script: str) -> str:
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=1,
        )
    except Exception:
        return ""
    return (result.stdout or "").strip()


def _dismiss_native_chrome_prompt() -> str:
    direct = _run_script(_DISMISS)
    if direct:
        return "direct"
    deep = _run_script(_DISMISS_DEEP)
    if deep == "clicked":
        return deep
    return _run_script(_DISMISS_KEYS)


async def _press_key(tab, key: str) -> None:
    import nodriver.cdp.input_ as cdp_input

    await tab.send(cdp_input.dispatch_key_event("keyDown", key=key))
    await tab.send(cdp_input.dispatch_key_event("keyUp", key=key))


async def _try_accept_nativeapp(tab) -> str | None:
    direct = await tab.evaluate(
        """
        (() => {
            const texts = ['Anmelden','Allow','Zulassen','Fortfahren','Continue','Weiter','Accept','Akzeptieren'];
            for (const el of document.querySelectorAll('button,[role="button"],input[type="submit"],input[type="button"]')) {
                const t = (el.innerText || el.textContent || el.value || '').trim();
                if (texts.some(x => t === x || t.includes(x))) {
                    el.click();
                    return t;
                }
            }
            return null;
        })()
        """
    )
    if direct:
        return str(direct)
    coords = await _find_button_coords(tab)
    if coords:
        await _cdp_click(tab, coords["x"], coords["y"])
        return coords.get("text") or "cdp"
    await _press_key(tab, "Enter")
    await asyncio.sleep(0.2)
    await _press_key(tab, "Tab")
    await asyncio.sleep(0.1)
    await _press_key(tab, "Enter")
    return "Enter/Tab fallback"


async def run(tab) -> str | None:
    from .login_screenshot import wait_and_screenshot

    for attempt in range(30):
        path = await wait_and_screenshot(tab, f"step05_attempt{attempt}", wait=0.3)
        try:
            url = tab.url or ""
        except Exception:
            url = ""
        if url.startswith("http://localhost:51121"):
            m = re.search(r"[?&]code=([^&]+)", url)
            if m:
                await wait_and_screenshot(tab, "step05_done", wait=0.1)
                return m.group(1)
        if "signin/oauth/firstparty/nativeapp" in url:
            clicked = await _try_accept_nativeapp(tab)
            if clicked:
                print(f"[step05] Nativeapp consent via {clicked}")
            dismissed = _dismiss_native_chrome_prompt()
            if dismissed:
                print(f"[step05] Chrome prompt dismissed via {dismissed}")
            await asyncio.sleep(0.2)
            continue
        _run_script(_DISMISS)
        r = await _find_button_coords(tab)
        if r:
            await _cdp_click(tab, r["x"], r["y"])
        await asyncio.sleep(0.15)
    print("[step05] No redirect captured")
    return None
