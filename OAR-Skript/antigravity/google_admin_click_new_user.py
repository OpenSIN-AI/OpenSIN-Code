#!/usr/bin/env python3
"""
google_admin_click_new_user.py
Click "Neuen Benutzer hinzufügen" button on Google Admin Console.
Strategy: Retry-Loop mit 3 Klick-Strategien (wie step03b_click.py):
  1. DOM-JS-Click (direktes .click())
  2. CDP-Mouse-Click (echte Maus-Events)
  3. Keyboard-Fallback (Tab + Enter)
Max 10 Attempts mit 2s Pause.
"""

import asyncio
import json
import nodriver as uc
import nodriver.cdp.input_ as cdp_input


BUTTON_TEXTS = [
    "Neuen Benutzer hinzufügen",
    "Add new user",
    "Add user",
    "Benutzer hinzufügen",
    "Create user",
    "+",
]


async def _scroll_top(tab) -> None:
    try:
        await tab.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(0.3)
    except Exception:
        pass


async def _try_click_add_user(tab) -> str | None:
    """Try to click 'Add user' button using 3 strategies."""
    await _scroll_top(tab)
    await asyncio.sleep(0.5)

    # Strategy 1: DOM-JS-Click
    direct = await tab.evaluate(
        """
    (() => {
        const texts = """
        + json.dumps(BUTTON_TEXTS)
        + """;
        for (const el of document.querySelectorAll('button, [role="button"], a.btn, .goog-inline-block')) {
            const t = (el.innerText || el.textContent || el.value || '').trim();
            if (texts.some(x => t === x || t.includes(x) || (x === '+' && t === '+'))) {
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
        print(f"[google_admin] -> DOM click attempted text='{label}'")
        await asyncio.sleep(1.0)
        # Check if form opened (URL changed or form visible)
        form_opened = await tab.evaluate("""
        (() => {
            return document.querySelector('form') !== null || 
                   document.querySelector('[class*="create"]') !== null ||
                   window.location.href.includes('action=create');
        })()
        """)
        if form_opened:
            return label

    # Strategy 2: CDP-Mouse-Click (get coordinates and click)
    result = await tab.evaluate(
        """
    (() => {
        const texts = """
        + json.dumps(BUTTON_TEXTS)
        + """;
        for (const el of document.querySelectorAll('button, [role="button"], a.btn, .goog-inline-block')) {
            const t = (el.innerText || el.textContent || el.value || '').trim();
            if (texts.some(x => t === x || t.includes(x) || (x === '+' && t === '+'))) {
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0 && r.top >= 0) {
                    return JSON.stringify({
                        x: Math.round(r.left + r.width / 2),
                        y: Math.round(r.top + r.height / 2),
                        text: t
                    });
                }
            }
        }
        return null;
    })()
    """
    )

    if result:
        try:
            result = json.loads(result)
        except Exception:
            pass
        else:
            x = result.get("x", 0)
            y = result.get("y", 0)
            text = result.get("text", "")

            # Real CDP mouse events
            await tab.send(cdp_input.dispatch_mouse_event("mouseMoved", x=x, y=y))
            await asyncio.sleep(0.05)
            print(f"[google_admin] -> CDP click at ({x}, {y}) text='{text}'")
            await tab.send(
                cdp_input.dispatch_mouse_event(
                    "mousePressed",
                    x=x,
                    y=y,
                    button=cdp_input.MouseButton.LEFT,
                    click_count=1,
                )
            )
            await asyncio.sleep(0.05)
            await tab.send(
                cdp_input.dispatch_mouse_event(
                    "mouseReleased",
                    x=x,
                    y=y,
                    button=cdp_input.MouseButton.LEFT,
                    click_count=1,
                )
            )
            await asyncio.sleep(1.0)

            # Check if form opened
            form_opened = await tab.evaluate("""
            (() => {
                return document.querySelector('form') !== null || 
                       document.querySelector('[class*="create"]') !== null ||
                       window.location.href.includes('action=create');
            })()
            """)
            if form_opened:
                return text or "click"

    # Strategy 3: Keyboard-Fallback (Tab + Enter)
    print("[google_admin] -> Keyboard fallback (Tab x15 + Enter)")
    for _ in range(15):
        await tab.send(cdp_input.dispatch_key_event("keyDown", key="Tab"))
        await tab.send(cdp_input.dispatch_key_event("keyUp", key="Tab"))
        await asyncio.sleep(0.05)
    await tab.send(cdp_input.dispatch_key_event("keyDown", key="Enter"))
    await tab.send(cdp_input.dispatch_key_event("keyUp", key="Enter"))
    await asyncio.sleep(1.0)

    # Check if form opened
    form_opened = await tab.evaluate("""
    (() => {
        return document.querySelector('form') !== null || 
               document.querySelector('[class*="create"]') !== null ||
               window.location.href.includes('action=create');
    })()
    """)
    if form_opened:
        return "Tab x15 + Enter"

    return None


async def main():
    """Main loop: try to click 'Add user' button until form opens."""
    browser = await uc.start()
    try:
        tab = await browser.get("https://admin.google.com/ac/users?journey=218")
        await asyncio.sleep(2.0)

        for attempt in range(10):
            print(f"[google_admin] Attempt #{attempt + 1}/10")
            clicked = await _try_click_add_user(tab)
            if clicked:
                print(
                    f"[google_admin] ✅ Successfully clicked '{clicked}' - Form should be open now!"
                )
                # Save screenshot
                await tab.save_screenshot(f"/tmp/google_admin_step2_success.png")
                print(
                    "[google_admin] Screenshot saved: /tmp/google_admin_step2_success.png"
                )
                return True
            else:
                print(f"[google_admin] ❌ Attempt {attempt + 1} failed, retrying...")
                await asyncio.sleep(2.0)

        print("[google_admin] ERROR: All 10 attempts failed. Manual click required.")
        await tab.save_screenshot("/tmp/google_admin_step2_failed.png")
        return False
    finally:
        await browser.stop()


if __name__ == "__main__":
    asyncio.run(main())
