# Single action: connects to existing Chrome via CDP (does NOT launch new Chrome)
import asyncio, nodriver as uc
from .chrome_port import read_port

async def connect(retries: int = 15, delay: float = 0.3) -> uc.Browser:
    port = read_port()
    for i in range(retries):
        try:
            return await uc.Browser.create(host="127.0.0.1", port=port)
        except Exception:
            if i < retries - 1:
                await asyncio.sleep(delay)
    raise RuntimeError(f"[chrome_connect] Cannot connect to Chrome on port {port} after {retries}s")

if __name__ == '__main__':
    b = uc.loop().run_until_complete(connect())
    print(f"[chrome_connect] Connected: {b.websocket_url}")
