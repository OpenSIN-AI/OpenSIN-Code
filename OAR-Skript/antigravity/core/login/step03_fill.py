import asyncio
import nodriver.cdp.input_ as cdp_input

from .shared import press_enter


async def _type_via_cdp(tab, text: str) -> None:
    for ch in text:
        await tab.send(
            cdp_input.dispatch_key_event("keyDown", text=ch, unmodified_text=ch)
        )
        await tab.send(
            cdp_input.dispatch_key_event("keyUp", text=ch, unmodified_text=ch)
        )
        await asyncio.sleep(0.02)


async def fill_password(tab, password: str) -> bool:
    from .login_screenshot import wait_and_screenshot

    visible_pwd = """(()=>{const el=document.querySelector('input[type="password"]');if(!el)return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'})()"""
    click_next = """(()=>{for(const b of document.querySelectorAll('button,[role="button"]')){const t=(b.innerText||b.textContent||'').trim();if(t.includes('Weiter')||t.includes('Next')||t.includes('Continue')){b.click();return t}}return null})()"""
    wrong_pw = "(document.body.innerText||'').includes('Falsches Passwort') || (document.body.innerText||'').includes('Wrong password')"

    for _ in range(16):
        try:
            if await tab.evaluate(visible_pwd):
                break
        except Exception:
            pass
        await asyncio.sleep(0.2)
    else:
        path = await wait_and_screenshot(tab, "step03_password_FAIL")
        print(f"[step03] Password field NOT FOUND. Screenshot: {path}")
        return False

    async def submit_once() -> str | None:
        focused = await tab.evaluate(
            """(()=>{const el=document.querySelector("input[type='password']");if(!el)return false;el.focus();el.click();el.value='';return true})()"""
        )
        if not focused:
            return None
        await asyncio.sleep(0.1)
        await _type_via_cdp(tab, password)
        await asyncio.sleep(0.1)
        if not await tab.evaluate(
            "(document.querySelector(\"input[type='password']\")?.value?.length||0)>0"
        ):
            await tab.evaluate(
                """(()=>{const el=document.querySelector("input[type='password']");if(!el)return false;el.focus();el.click();return true})()"""
            )
            await asyncio.sleep(0.05)
            await _type_via_cdp(tab, password)
            await asyncio.sleep(0.1)
        clicked = await tab.evaluate(click_next)
        if not clicked:
            await press_enter(tab)
        return clicked

    for attempt in range(3):
        clicked = await submit_once()
        await asyncio.sleep(0.5)
        try:
            if not await tab.evaluate(wrong_pw):
                path = await wait_and_screenshot(tab, "step03_password", wait=0.3)
                print(
                    f"[step03] password typed (len={len(password)}), clicked='{clicked}', attempt={attempt + 1}. Screenshot: {path}"
                )
                return True
        except Exception:
            path = await wait_and_screenshot(tab, "step03_password", wait=0.3)
            print(
                f"[step03] password submitted, tab moved, attempt={attempt + 1}. Screenshot: {path}"
            )
            return True
        await asyncio.sleep(0.5)

    path = await wait_and_screenshot(tab, "step03_password_FAIL", wait=0.3)
    print(f"[step03] Password retry exhausted. Screenshot: {path}")
    return False
