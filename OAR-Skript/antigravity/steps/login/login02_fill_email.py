# Atomic: fill email field on Google sign-in page
import nodriver as uc, json
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from shared.chrome_connect import connect; from shared.screenshot import save
from core.login.step02_fill import fill_email
async def main():
    email = json.loads(__import__('pathlib').Path("logs/credentials.json").read_text())["email"]
    browser = await connect()
    tab = browser.tabs[0]
    ok = await fill_email(tab, email)
    await save(tab, "login02_fill_email")
    print(f"[login02] fill_email={'OK' if ok else 'FAIL'}")
if __name__ == '__main__': uc.loop().run_until_complete(main())

