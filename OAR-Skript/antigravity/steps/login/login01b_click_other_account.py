# Atomic: click "Anderes Konto verwenden" on Google account chooser page
import nodriver as uc
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent.parent.parent))
from shared.chrome_connect import connect; from shared.screenshot import save

async def main():
    browser = await connect()
    tab = browser.tabs[0]
    btn = await tab.find("Anderes Konto verwenden", best_match=True, timeout=5)
    if btn:
        await btn.click()
        print("[login01b] Clicked 'Anderes Konto verwenden'")
    else:
        print("[login01b] No chooser found — email input already visible")
    await save(tab, "login01b_other_account")

if __name__ == '__main__':
    uc.loop().run_until_complete(main())
