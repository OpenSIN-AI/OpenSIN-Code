#!/usr/bin/env python3
"""Step 03: Select first account from AccountChooser"""

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
    try:
        cards = await tab.select("c-wiz[jsname]")
        if cards:
            await cards.click()
            await asyncio.sleep(3)
            print(f"Selected account. URL: {tab.url[:60]}...")
            return tab
    except Exception as e:
        print(f"Click error: {e}")
    print(f"No account clicked. URL: {tab.url[:60]}...")
    return tab


if __name__ == "__main__":
    result = asyncio.run(run())
    print("Success" if result else "Failed")
