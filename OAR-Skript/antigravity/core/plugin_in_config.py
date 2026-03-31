import json
from .plugin_paths import OPENCODE_CONFIG, PLUGIN_CACHE_DIR, PLUGIN_LOCAL_DIR, PLUGIN_NAME
def _is_in_config() -> bool:
    if not OPENCODE_CONFIG.exists():
        return False
    try:
        data = json.loads(OPENCODE_CONFIG.read_text())
        return any(PLUGIN_NAME in p for p in data.get("plugin", []))
    except Exception:
        return False
def _is_in_cache() -> bool:
    return PLUGIN_CACHE_DIR.exists() or PLUGIN_LOCAL_DIR.exists()
