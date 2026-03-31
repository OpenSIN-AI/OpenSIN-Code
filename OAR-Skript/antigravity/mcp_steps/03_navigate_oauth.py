#!/usr/bin/env python3
import asyncio
import nodriver as uc
from nodriver.core.config import Config
import secrets
import hashlib
import base64

CLIENT_ID = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
REDIRECT_URI = "http://localhost:51121/oauth-callback"


def build_oauth_url():
    verifier = secrets.token_urlsafe(32)
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
        .rstrip(b"=")
        .decode()
    )
    state = secrets.token_urlsafe(16)
    scope = "openid email profile"
    url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope={scope}&state={state}&code_challenge={challenge}&code_challenge_method=S256"
    return url, verifier, state


async def run():
    url, verifier, state = build_oauth_url()
    config = Config()
    config.host = "127.0.0.1"
    config.port = 7654
    browser = await uc.start(config=config)
    tabs = list(browser.tabs)
    tab = tabs[0] if tabs else await browser.new_tab()
    await tab.get(url)
    await asyncio.sleep(2)
    print(f"Navigated to: {tab.url[:80]}")
    return tab, verifier, state


if __name__ == "__main__":
    result = asyncio.run(run())
    print("Success" if result else "Failed")
