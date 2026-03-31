import asyncio
from .shared import press_enter
from .step04_imessage import _get_otp_from_imessage


async def run(tab) -> bool:
    from .login_screenshot import wait_and_screenshot

    path = await wait_and_screenshot(tab, "step04_otp_check", wait=0.5)
    print(f"[step04] Screenshot: {path}")
    otp_present = False
    try:
        el = await tab.find(
            "input[type='tel'], input[autocomplete='one-time-code']", timeout=3
        )
        otp_present = el is not None
    except Exception:
        pass
    if not otp_present:
        print("[step04] No OTP field — skipping")
        return True
    code = await _get_otp_from_imessage(timeout=90)
    if not code:
        print("[step04] No OTP — enter manually if prompted")
        return True
    el = await tab.find(
        "input[type='tel'], input[autocomplete='one-time-code']", timeout=5
    )
    await el.send_keys(code)
    await asyncio.sleep(0.3)
    try:
        nxt = await tab.find("Next", best_match=True, timeout=5)
        await nxt.click()
    except Exception:
        await press_enter(tab)
    path = await wait_and_screenshot(tab, "step04_otp_done", wait=0.5)
    print(f"[step04] Screenshot: {path}")
    return True
