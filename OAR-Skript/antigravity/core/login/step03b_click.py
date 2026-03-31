#!/usr/bin/env python3
"""
core/login/step03b_workspace_tos.py
Step 3b: Click through ALL Google Workspace intermediate screens.
Strategy: scroll + JS-scan for accept buttons until none found OR OAuth redirect.
Max 6 attempts with 3s gap each. Non-fatal.
"""

import asyncio

ACCEPT_TEXTS = [
    "Verstanden",
    "I understand",
    "Weiter",
    "Continue",
    "Accept",
    "Akzeptieren",
]


def _safe_lower_text(value) -> str:
    if isinstance(value, str):
        return value.lower()
    if value is None:
        return ""
    return str(value).lower()


async def _press(tab, key: str) -> None:
    import nodriver.cdp.input_ as cdp_input

    await tab.send(cdp_input.dispatch_key_event("keyDown", key=key))
    await tab.send(cdp_input.dispatch_key_event("keyUp", key=key))


async def _scroll_bottom(tab) -> None:
    try:
        await tab.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(0.2)
    except Exception:
        pass


async def _is_gaplustos_screen(tab) -> bool:
    try:
        url = str(tab.url or "")
    except Exception:
        url = ""
    try:
        body = await tab.evaluate("document.body.innerText || ''") or ""
    except Exception:
        body = ""
    body = _safe_lower_text(body)
    return "gaplustos" in url or "willkommen in ihrem neuen konto" in body


async def _wait_for_gaplustos_exit(tab, timeout: float = 1.0) -> bool:
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        if not await _is_gaplustos_screen(tab):
            return True
        await asyncio.sleep(0.1)
    return not await _is_gaplustos_screen(tab)


async def _try_click_accept(tab) -> str | None:
    """Get button viewport coords via JS, then send real CDP mouse events."""
    await _scroll_bottom(tab)
    await asyncio.sleep(0.2)

    import json
    import nodriver.cdp.input_ as cdp_input

    direct = await tab.evaluate(
        """
        (() => {
            const texts = ['Verstanden', 'I understand', 'Weiter', 'Continue', 'Accept', 'Akzeptieren'];
            for (const el of document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')) {
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
        label = direct if isinstance(direct, str) else str(direct)
        print(f"[step03b]   -> DOM click attempted text='{label}'")
        if await _wait_for_gaplustos_exit(tab):
            return label
        print("[step03b]   -> DOM click did not leave gaplustos; escalating")

    result = await tab.evaluate("""
        (() => {
            const texts = ['Verstanden', 'I understand', 'Weiter', 'Continue', 'Accept', 'Akzeptieren'];
            for (const el of document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]')) {
                const t = (el.innerText || el.textContent || el.value || '').trim();
                if (texts.some(x => t === x || t.includes(x))) {
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0 && r.top >= 0) {
                        return JSON.stringify({
                            x: Math.round(r.left + r.width / 2),
                            y: Math.round(r.top  + r.height / 2),
                            text: t
                        });
                    }
                }
            }
            return null;
        })()
    """)

    if not result:
        for _ in range(11):
            await _press(tab, "Tab")
            await asyncio.sleep(0.08)
        await _press(tab, "Enter")
        if await _wait_for_gaplustos_exit(tab, timeout=1.2):
            return "Tab x11 + Enter"
        print("[step03b]   -> Keyboard fallback did not leave gaplustos")
        return None

    if isinstance(result, str):
        try:
            result = json.loads(result)
        except Exception:
            return None

    x = result.get("x", 0)
    y = result.get("y", 0)
    text = result.get("text", "")

    # Real CDP mouse events (move → press → release)
    await tab.send(cdp_input.dispatch_mouse_event("mouseMoved", x=x, y=y))
    await asyncio.sleep(0.05)
    print(f"[step03b]   → CDP click at ({x}, {y}) text='{text}'")
    await tab.send(
        cdp_input.dispatch_mouse_event(
            "mousePressed", x=x, y=y, button=cdp_input.MouseButton.LEFT, click_count=1
        )
    )
    await asyncio.sleep(0.05)
    await tab.send(
        cdp_input.dispatch_mouse_event(
            "mouseReleased", x=x, y=y, button=cdp_input.MouseButton.LEFT, click_count=1
        )
    )
    if await _wait_for_gaplustos_exit(tab):
        return text or "click"

    print("[step03b]   -> CDP click did not leave gaplustos; trying keyboard fallback")
    for _ in range(11):
        await _press(tab, "Tab")
        await asyncio.sleep(0.08)
    await _press(tab, "Enter")
    if await _wait_for_gaplustos_exit(tab, timeout=1.2):
        return "Tab x11 + Enter"

    print("[step03b]   -> Keyboard fallback did not leave gaplustos")
    return None


async def run(tab) -> bool:
    """Loop: scroll + click accept buttons until gone or redirect captured."""
    from .shared import wait_and_screenshot

    # Wait for navigation after password submit
    await asyncio.sleep(1.0)

    prev_url = ""
    for attempt in range(
        20
    ):  # max 20 — Google chains multiple ToS pages for new accounts
        # Stop only when we've been REDIRECTED to the callback (URL starts with localhost)
        try:
            url = tab.url or ""
            if (
                url.startswith("http://localhost:51121")
                or "oauth-callback" in url.split("?")[0]
            ):
                break
        except Exception:
            url = ""

        if url != prev_url:
            print(f"[step03b] URL: {url[:100]}")
            prev_url = url

        if not await _is_gaplustos_screen(tab):
            break

        path = await wait_and_screenshot(tab, f"step03b_attempt{attempt}", wait=0.3)
        print(f"[step03b] Attempt #{attempt + 1}. Screenshot: {path}")

        clicked = await _try_click_accept(tab)
        if clicked:
            print(f"[step03b] ✅ Clicked '{clicked}' at coords (logged above)")
            await asyncio.sleep(0.5)
            continue
        else:
            print(
                "[step03b] No working accept action yet; retrying while gaplustos is visible"
            )
            await asyncio.sleep(0.4)
            continue

    path = await wait_and_screenshot(tab, "step03b_done", wait=0.2)
    print(f"[step03b] Screenshot after intermediates: {path}")
    still_blocked = await _is_gaplustos_screen(tab)
    if still_blocked:
        print("[step03b] ERROR: gaplustos still visible after retries")
    return not still_blocked
