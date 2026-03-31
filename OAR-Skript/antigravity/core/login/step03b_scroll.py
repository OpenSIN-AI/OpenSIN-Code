import asyncio


async def _scroll_bottom(tab) -> None:
    try:
        await tab.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(0.2)
    except Exception:
        pass
