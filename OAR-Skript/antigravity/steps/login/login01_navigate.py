# Atomic: navigate to Google OAuth authorization URL + persist PKCE verifier
import nodriver as uc, secrets
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from shared.chrome_connect import connect; from shared.screenshot import save
from core.login.step01_pkce import _pkce_pair; from core.login.step01_url import build_auth_url
from pathlib import Path
async def main():
    state = secrets.token_urlsafe(16)
    verifier, challenge = _pkce_pair()
    Path("logs").mkdir(exist_ok=True); Path("logs/pkce_verifier.txt").write_text(verifier)
    browser = await connect()
    tab = await browser.get(build_auth_url(state, challenge))
    await save(tab, "login01_navigate"); print(f"[login01] Navigated (state={state[:8]}...)")
if __name__ == '__main__': uc.loop().run_until_complete(main())
