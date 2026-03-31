import time
from .watcher_config import LAST_ROTATION_FILE


def read_last_rotation_time() -> float:
    try:
        return float(LAST_ROTATION_FILE.read_text().strip())
    except Exception:
        return 0.0


def mark_rotation_complete() -> float:
    now = time.time()
    LAST_ROTATION_FILE.write_text(str(now))
    return now
