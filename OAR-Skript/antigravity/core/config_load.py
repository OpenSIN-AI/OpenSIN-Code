import json
from .config_path import CONFIG_PATH
def load_config() -> dict:
    return json.load(open(CONFIG_PATH)) if CONFIG_PATH.exists() else {}
def config_exists() -> bool:
    try:
        d = load_config()
        return bool(d.get("setup_completed") and d.get("admin_refresh_token"))
    except Exception:
        return False
def get(key: str, default=None):
    return load_config().get(key, default)
