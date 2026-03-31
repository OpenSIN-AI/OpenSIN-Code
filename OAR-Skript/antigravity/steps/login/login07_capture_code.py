# Atomic: verify auth code was saved to logs/auth_code.txt
import nodriver as uc
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from shared.chrome_connect import connect; from shared.screenshot import save
from pathlib import Path
async def main():
    code_path = Path("logs/auth_code.txt")
    if not code_path.exists() or not code_path.read_text().strip():
        print("[login07] ERROR: auth_code.txt missing or empty"); raise SystemExit(1)
    browser = await connect()
    tab = browser.tabs[0]
    await save(tab, "login07_code_captured")
    print(f"[login07] Auth code verified: {code_path.read_text().strip()[:12]}...")
if __name__ == '__main__': uc.loop().run_until_complete(main())

