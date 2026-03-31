#!/usr/bin/env python3
import asyncio
import nodriver as uc
from nodriver.core.config import Config


async def run():
    config = Config()
    config.host = "127.0.0.1"
    config.port = 7654
    browser = await uc.start(config=config)
    tabs = list(browser.tabs)
    tab = tabs[0]
    await asyncio.sleep(2)
    consent_btn = await tab.select("button[type=submit]")
    if consent_btn:
        print("Consent button found, clicking...")
        await consent_btn[0].click()
        await asyncio.sleep(3)
    print(f"Current URL: {tab.url[:80]}")
    return tab


if __name__ == "__main__":
    result = asyncio.run(run())
    print("Success" if result else "Failed")
