# Atomic: accept Workspace welcome/ToS page for new accounts (scroll + click)
import nodriver as uc
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).resolve().parent.parent.parent))
from shared.chrome_connect import connect; from shared.screenshot import save
from core.login.step03b_run import run as run_tos

async def main():
    browser = await connect()
    tab = browser.tabs[0]
    await run_tos(tab)
    await save(tab, "login05b_workspace_tos")
    print("[login05b] Workspace ToS accepted")

if __name__ == '__main__':
    uc.loop().run_until_complete(main())
