import os
from pathlib import Path
ACCOUNTS_PATH = (
    Path(os.environ["OPENCODE_CONFIG_DIR"]) / "antigravity-accounts.json"
    if os.environ.get("OPENCODE_CONFIG_DIR")
    else Path.home() / ".config" / "opencode" / "antigravity-accounts.json"
)
OPENCODE_AUTH_PATH = Path.home() / ".local" / "share" / "opencode" / "auth.json"
EMPTY_STORAGE: dict = {"version": 4, "accounts": [], "activeIndex": 0}
