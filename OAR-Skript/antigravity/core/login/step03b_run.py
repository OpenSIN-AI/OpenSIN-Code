import asyncio


async def run(tab) -> bool:
    from .login_screenshot import wait_and_screenshot
    from .step03b_click import _safe_lower_text, _try_click_accept

    await asyncio.sleep(0.2)  # brief settle
    prev_url = ""
    for attempt in range(15):
        try:
            url = str(tab.url or "")
        except Exception:
            url = ""
        if (
            url.startswith("http://localhost:51121")
            or "oauth-callback" in url.split("?")[0]
        ):
            break
        if url != prev_url:
            print(f"[step03b] URL: {url[:100]}")
            prev_url = url
        path = await wait_and_screenshot(tab, f"step03b_attempt{attempt}", wait=0.2)
        print(f"[step03b] Attempt #{attempt + 1}. Screenshot: {path}")
        clicked = None
        try:
            body_text = await tab.evaluate("document.body.innerText || ''")
        except Exception:
            body_text = ""
        body_text = _safe_lower_text(body_text)

        if (
            "gaplustos" in url
            or "new account" in url.lower()
            or "willkommen" in body_text
        ):
            clicked = await _try_click_accept(tab)
        if clicked:
            print(f"[step03b] Clicked '{clicked}' — waiting for page transition")
            await asyncio.sleep(0.5)
            continue
        await asyncio.sleep(0.2)  # short wait before retry
    await wait_and_screenshot(tab, "step03b_done", wait=0.2)
    return True
