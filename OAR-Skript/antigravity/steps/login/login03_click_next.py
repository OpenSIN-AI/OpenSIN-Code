# Atomic: click Next after email entry (handled inside fill_email, this confirms state)
import nodriver as uc, asyncio
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from shared.chrome_connect import connect
from shared.screenshot import save

async def main():
    browser = await connect()
    tab = browser.tabs[0]
    for _ in range(8):
        await asyncio.sleep(0.2)
    path = await save(tab, "login03_after_next")
    print(f"[login03] Screenshot: {path}")

if __name__ == '__main__':
    uc.loop().run_until_complete(main())
