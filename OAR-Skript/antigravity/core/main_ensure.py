from .config import config_exists
from .utils_log import log
def _ensure_setup() -> None:
    if config_exists(): return
    log("[main] No config found — running first-time setup ...")
    from core.setup import run_setup
    run_setup()
    log("[main] Setup complete — starting watcher")
