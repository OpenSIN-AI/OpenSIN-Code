# Atomic: fill password field on Google sign-in page
import nodriver as uc, json
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from shared.chrome_connect import connect; from shared.screenshot import save
from core.login.step03_fill import fill_password
async def main():
    pw = json.loads(__import__('pathlib').Path("logs/credentials.json").read_text())["password"]
    browser = await connect()
    tab = browser.tabs[0]
    ok = await fill_password(tab, pw)
    await save(tab, "login04_fill_password")
    print(f"[login04] fill_password={'OK' if ok else 'FAIL'}")
if __name__ == '__main__': uc.loop().run_until_complete(main())

