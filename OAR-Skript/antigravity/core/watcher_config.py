from pathlib import Path

from .accounts_path import ACCOUNTS_PATH, OPENCODE_AUTH_PATH

LOCK_FILE = Path("/tmp/openAntigravity-auth-rotator.lock")
COOLDOWN_SECS = 60
LOGS_DIR = Path.home() / ".local" / "share" / "opencode" / "log"
LOGS_DIR_LEGACY = Path.home() / ".local" / "share" / "opencode" / "logs"
LAST_ROTATION_FILE = (
    Path.home() / ".config" / "openAntigravity-auth-rotator" / "last_rotation.txt"
)
_GOOGLE_AUTH_REINJECT_COOLDOWN = 30

LAST_ROTATION_FILE.parent.mkdir(parents=True, exist_ok=True)
