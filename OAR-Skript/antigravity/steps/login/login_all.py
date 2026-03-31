# Runs all login steps in ONE process, sharing ONE browser connection.
# Eliminates ~2s nodriver connect() overhead per step (~18s total saved).
import asyncio, json, re, secrets, subprocess, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import nodriver as uc
from shared.chrome_connect import connect
from shared.screenshot import save
from core.login.step01_pkce import _pkce_pair
from core.login.step01_url import build_auth_url
from core.login.step02_fill import fill_email
from core.login.step03_fill import fill_password
from core.login.step04_otp import run as run_otp
from core.login.step05_consent import run as run_consent
from core.login.step03b_run import run as run_tos

CREDS = Path("logs/credentials.json")
ACCEPT_TEXTS = [
    "Chrome ohne Konto verwenden",
    "Verstanden",
    "I understand",
    "Weiter",
    "Continue",
    "Accept",
    "Akzeptieren",
]


async def _click_text(tab, texts: list[str], timeout: float = 3.0) -> str | None:
    """Click first visible button matching any of texts. Returns matched text or None."""
    import nodriver.cdp.input_ as cdp_input, json as _json

    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        js = f"(()=>{{const t={_json.dumps(texts)};for(const b of document.querySelectorAll('button,[role=\"button\"]')){{const tx=(b.innerText||b.textContent||'').trim();if(t.some(s=>tx.includes(s))){{const r=b.getBoundingClientRect();if(r.width>0&&r.height>0&&r.top>=0)return JSON.stringify({{x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2),text:tx}})}}}}return null}})()"
        res = await tab.evaluate(js)
        if res:
            d = json.loads(res) if isinstance(res, str) else res
            x, y = d["x"], d["y"]
            await tab.send(
                cdp_input.dispatch_mouse_event(
                    "mousePressed", x=x, y=y, button=cdp_input.MouseButton.LEFT, click_count=1
                )
            )
            await tab.send(
                cdp_input.dispatch_mouse_event(
                    "mouseReleased", x=x, y=y, button=cdp_input.MouseButton.LEFT, click_count=1
                )
            )
            return d["text"]
        await asyncio.sleep(0.15)
    return None


async def main():
    creds = json.loads(CREDS.read_text())
    state = secrets.token_urlsafe(16)
    verifier, challenge = _pkce_pair()
    Path("logs/pkce_verifier.txt").write_text(verifier)

    browser = await connect()  # ← connect ONCE for all steps

    # 01: navigate
    tab = await browser.get(build_auth_url(state, challenge))
    await save(tab, "login01")
    print("[login01] Navigated")

    # 01b: dismiss account chooser if present
    clicked = await _click_text(tab, ["Anderes Konto verwenden"], timeout=2.0)
    print(f"[login01b] {'Clicked chooser' if clicked else 'No chooser'}")

    # 02: fill email + click Next
    ok = await fill_email(tab, creds["email"])
    print(f"[login02] email={'OK' if ok else 'FAIL'}")

    # 03: wait for password page URL (up to 5s) — don't type before page is ready
    for _ in range(10):
        url = await tab.evaluate("location.href")
        if url and ("pwd" in url or "password" in url or "challenge" in url):
            break
        await asyncio.sleep(0.5)
    await save(tab, "login03_after_email")

    # 03b: CAPTCHA check (skip if absent)
    found = await tab.evaluate(
        "(()=>{const i=document.querySelector('input');return i&&i.placeholder&&i.placeholder.includes('Text')?'found':null})()"
    )
    print(f"[login03b] captcha={'found' if found == 'found' else 'none'}")

    # 04: fill password — wait for field, type via CDP
    ok = await fill_password(tab, creds["password"])
    print(f"[login04] password={'OK' if ok else 'FAIL'}")

    # 05: OTP if prompted
    ok = await run_otp(tab)
    print(f"[login05] otp={'OK' if ok else 'FAIL'}")

    # 05b: Workspace ToS speedbump — click Verstanden immediately
    await run_tos(tab)
    print("[login05b] ToS done")

    # 05c: dismiss "In Chrome anmelden?" via CDP (no osascript needed)
    clicked = await _click_text(tab, ["Chrome ohne Konto verwenden"], timeout=2.0)
    print(f"[login05c] chrome-signin-dismiss={'clicked' if clicked else 'not shown'}")

    # 06+07: consent + capture auth code
    code = await run_consent(tab)
    if not code:
        print("[login06] FAIL: no auth code")
        raise SystemExit(1)
    Path("logs/auth_code.txt").write_text(code)
    await save(tab, "login06_consent")
    print(f"[login07] Auth code: {code[:12]}...")

    # 08: dismiss "In Chrome anmelden?" that appears AFTER the OAuth localhost redirect.
    # RBUG-061: dialog appears after code capture — 05c runs too early (before consent).
    # Speed: max 2 tries, 1s osascript timeout, 0.5s CDP, 0.1s gap → max ~3s total (was ~25s)
    _AS_DISMISS = (
        'tell application "System Events" to tell process "Google Chrome" to try\n'
        'click button "Chrome ohne Konto verwenden" of window 1\nend try'
    )
    for _ in range(2):
        subprocess.run(["osascript", "-e", _AS_DISMISS], capture_output=True, timeout=1)
        clicked = await _click_text(
            tab, ["Chrome ohne Konto verwenden", "Ohne Konto fortfahren"], timeout=0.5
        )
        if clicked:
            print(f"[login08] Chrome-Sync-Dialog dismissed: {clicked}")
            break
        await asyncio.sleep(0.1)
    else:
        print("[login08] Chrome-Sync-Dialog not shown (dismissed or never appeared)")


if __name__ == "__main__":
    uc.loop().run_until_complete(main())
