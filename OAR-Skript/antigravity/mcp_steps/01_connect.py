#!/usr/bin/env python3
"""Step 01: Connect to Chrome on port 7654 via webauto-nodriver MCP pattern"""

import asyncio
import nodriver as uc
from nodriver.core.config import Config


async def run():
    config = Config()
    config.host = "127.0.0.1"
    config.port = 7654
    browser = await uc.start(config=config)
    tabs = list(browser.tabs)
    print(f"Connected! Tabs: {len(tabs)}")
    return browser


if __name__ == "__main__":
    browser = asyncio.run(run())
    print("Success" if browser else "Failed")
