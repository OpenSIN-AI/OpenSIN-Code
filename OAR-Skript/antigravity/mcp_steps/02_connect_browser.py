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
    print(f"Connected! Found {len(tabs)} tab(s)")
    return browser


if __name__ == "__main__":
    result = asyncio.run(run())
    print("Success" if result else "Failed")
