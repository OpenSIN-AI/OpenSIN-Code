# Atomic: click OAuth consent/allow button and capture auth code from redirect
import nodriver as uc
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from shared.chrome_connect import connect; from shared.screenshot import save
from core.login.step05_consent import run as run_consent; from pathlib import Path
async def main():
    browser = await connect()
    tab = browser.tabs[0]
    code = await run_consent(tab)
    await save(tab, "login06_consent")
    if not code: print("[login06] FAIL: no auth code"); raise SystemExit(1)
    Path("logs").mkdir(exist_ok=True); Path("logs/auth_code.txt").write_text(code)
    print("[login06] Auth code captured and saved.")
if __name__ == '__main__': uc.loop().run_until_complete(main())
