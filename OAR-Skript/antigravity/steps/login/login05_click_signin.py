# Atomic: handle OTP if prompted (reads from iMessage via core helper)
import nodriver as uc
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from shared.chrome_connect import connect; from shared.screenshot import save
from core.login.step04_otp import run as run_otp
async def main():
    browser = await connect()
    tab = browser.tabs[0]
    ok = await run_otp(tab)
    await save(tab, "login05_otp")
    print(f"[login05] otp={'OK' if ok else 'FAIL'}")
if __name__ == '__main__': uc.loop().run_until_complete(main())

