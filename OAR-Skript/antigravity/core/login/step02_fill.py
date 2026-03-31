import asyncio

from .shared import press_enter


async def fill_email(tab, email: str) -> bool:
    from .login_screenshot import wait_and_screenshot

    local = email.split("@", 1)[0]
    visible_pwd = """(()=>{const el=document.querySelector('input[type="password"]');if(!el)return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'})()"""
    click_other = """(()=>{for(const el of document.querySelectorAll('button,[role="button"],a,div')){const t=(el.innerText||el.textContent||'').trim();if(t.includes('Anderes Konto verwenden')||t.includes('Use another account')){el.click();return true}}return false})()"""

    for _ in range(16):
        try:
            url = tab.url or ""
            if url.startswith("http://localhost:51121"):
                return True
        except Exception:
            pass
        try:
            if await tab.evaluate(visible_pwd):
                path = await wait_and_screenshot(tab, "step02_email", wait=0.3)
                print(f"[step02] Screenshot: {path}")
                return True
        except Exception:
            pass
        try:
            if await tab.evaluate(click_other):
                await asyncio.sleep(0.3)
        except Exception:
            pass
        try:
            el = await tab.find("input[type='email'], input[type='text']", timeout=2)
            if el:
                try:
                    await el.clear_input()
                except Exception:
                    pass
                await el.send_keys(local)
                await asyncio.sleep(0.15)
                clicked = await tab.evaluate(
                    """(()=>{for(const b of document.querySelectorAll('button,[role="button"]')){const t=(b.innerText||b.textContent||'').trim();if(t.includes('Weiter')||t.includes('Next')||t.includes('Continue')){b.click();return t}}return null})()"""
                )
                if not clicked:
                    await press_enter(tab)
                await asyncio.sleep(0.8)
                if await tab.evaluate(visible_pwd) or "/challenge/pwd" in (
                    tab.url or ""
                ):
                    path = await wait_and_screenshot(tab, "step02_email", wait=0.3)
                    print(f"[step02] Screenshot: {path}")
                    return True
        except Exception:
            pass
        await asyncio.sleep(0.3)
    path = await wait_and_screenshot(tab, "step02_email_FAIL")
    print(f"[step02] Email step failed. Screenshot: {path}")
    return False
