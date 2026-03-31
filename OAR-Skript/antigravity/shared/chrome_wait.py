# Single action: poll until Chrome CDP is actually responding (max 30s)
import time, urllib.request
from pathlib import Path


def wait(root: Path) -> None:
    pf = root / "logs" / "chrome_cdp_port.txt"
    # Phase 1: wait for port file (chrome01 writes this immediately after Popen)
    for _ in range(50):
        if pf.exists():
            break
        time.sleep(0.1)
    else:
        raise TimeoutError("[chrome_wait] Port file not written in 5s")
    port = int(pf.read_text().strip())
    # Phase 2: wait for Chrome CDP to respond — so login01 can connect instantly
    deadline = time.time() + 30
    while time.time() < deadline:
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=1)
            print(f"[chrome_wait] Chrome ready on CDP port {port}")
            return
        except Exception:
            time.sleep(0.2)
    raise TimeoutError(f"[chrome_wait] Chrome CDP on port {port} not ready after 30s")
