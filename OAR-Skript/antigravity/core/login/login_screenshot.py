import asyncio, time
from pathlib import Path
SCREENSHOT_DIR = Path("/tmp/openAntigravity_screenshots")
def screenshot_path(step_name: str) -> str:
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    return str(SCREENSHOT_DIR / f"{int(time.time())}_{step_name}.png")
async def wait_and_screenshot(tab, step_name: str, wait: float = 0.2) -> str:
    await asyncio.sleep(wait)
    path = screenshot_path(step_name)
    await tab.save_screenshot(path)
    print(f"[screenshot] {path}")
    return path
