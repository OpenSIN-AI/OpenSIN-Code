#!/usr/bin/env python3
import asyncio
import nodriver as uc
from nodriver.core.config import Config
from urllib.parse import urlparse, parse_qs


async def run():
    config = Config()
    config.host = "127.0.0.1"
    config.port = 7654
    browser = await uc.start(config=config)
    tabs = list(browser.tabs)
    tab = tabs[0]
    for i in range(15):
        await asyncio.sleep(2)
        url = tab.url
        parsed = urlparse(url)
        if "code" in parse_qs(parsed.query):
            code = parse_qs(parsed.query)["code"][0]
            print(f"OAuth code found: {code[:40]}...")
            return code
        print(f"Waiting for code... ({i + 1}/15) URL: {url[:60]}...")
    print(f"No code received after 30s. Final URL: {tab.url[:80]}")
    return None


if __name__ == "__main__":
    result = asyncio.run(run())
    print(f"Result: {result is not None}")
