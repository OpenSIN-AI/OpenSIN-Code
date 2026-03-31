import nodriver.cdp.input_ as cdp_input

from .login_chrome import connect_tab
from .login_screenshot import screenshot_path, wait_and_screenshot


async def press_key(tab, key: str, text: str = "") -> None:
    await tab.send(cdp_input.dispatch_key_event("keyDown", key=key, text=text))
    await tab.send(cdp_input.dispatch_key_event("keyUp", key=key, text=text))


async def press_enter(tab) -> None:
    await press_key(tab, "Enter", "\n")
