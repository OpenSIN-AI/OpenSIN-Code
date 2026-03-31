import json
from .plugin_paths import OPENCODE_CONFIG, PLUGIN_NAME, PLUGIN_SPEC
from .utils_log import log
def _add_to_config() -> None:
    if OPENCODE_CONFIG.exists():
        try: data = json.loads(OPENCODE_CONFIG.read_text())
        except json.JSONDecodeError: data = {}
    else:
        OPENCODE_CONFIG.parent.mkdir(parents=True, exist_ok=True)
        data = {"$schema": "https://opencode.ai/config.json"}
    plugins = data.get("plugin", [])
    if not any(PLUGIN_NAME in p for p in plugins):
        plugins.append(PLUGIN_SPEC); data["plugin"] = plugins
        OPENCODE_CONFIG.write_text(json.dumps(data, indent=2) + "\n")
        log(f"[plugin_check] Added {PLUGIN_SPEC} to {OPENCODE_CONFIG}")
    else:
        log(f"[plugin_check] {PLUGIN_SPEC} already in config (cache missing)")
