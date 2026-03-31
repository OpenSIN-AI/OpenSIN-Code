async def run(tab, state: str, code_challenge: str, email: str = "") -> str:
    from .step01_url import build_auth_url
    from .login_screenshot import wait_and_screenshot

    url = build_auth_url(state, code_challenge, email)
    await tab.get(url)
    path = await wait_and_screenshot(tab, "step01_navigate", wait=0.5)
    print(f"[step01] Screenshot: {path}")
    return url
