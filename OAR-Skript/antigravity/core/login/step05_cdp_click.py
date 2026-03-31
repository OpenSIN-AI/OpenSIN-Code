import asyncio
import nodriver.cdp.input_ as cdp_input
async def _cdp_click(tab, x: int, y: int) -> None:
    await tab.send(cdp_input.dispatch_mouse_event("mouseMoved", x=x, y=y))
    await asyncio.sleep(0.05)
    await tab.send(cdp_input.dispatch_mouse_event("mousePressed", x=x, y=y, button=cdp_input.MouseButton.LEFT, click_count=1))
    await asyncio.sleep(0.05)
    await tab.send(cdp_input.dispatch_mouse_event("mouseReleased", x=x, y=y, button=cdp_input.MouseButton.LEFT, click_count=1))
