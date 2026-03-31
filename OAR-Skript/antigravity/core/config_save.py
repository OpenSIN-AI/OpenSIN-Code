import json, os
from .config_path import CONFIG_DIR, CONFIG_PATH
from .config_load import load_config
def save_config(data: dict) -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    tmp = CONFIG_PATH.with_suffix(".json.tmp")
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    os.chmod(tmp, 0o600)
    os.replace(tmp, CONFIG_PATH)
    os.chmod(CONFIG_PATH, 0o600)
def update_config(**kwargs) -> dict:
    d = load_config(); d.update(kwargs); save_config(d); return d
