# Single action: saves a screenshot of current tab
from pathlib import Path
import nodriver as uc

SS_DIR = Path(__file__).parent.parent / "logs" / "screenshots"

async def save(tab: uc.Tab, name: str) -> Path:
    SS_DIR.mkdir(parents=True, exist_ok=True)
    path = SS_DIR / f"{name}.png"
    await tab.save_screenshot(str(path))
    return path
