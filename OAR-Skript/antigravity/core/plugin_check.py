import sys
from .plugin_paths import PLUGIN_NAME
from .plugin_in_config import _is_in_config, _is_in_cache
from .plugin_add import _add_to_config
from .plugin_prompt import _prompt_run_opencode_once, _abort_missing_config
from .utils_log import log
def check_plugin_installed(auto_fix: bool = True) -> bool:
    c, k = _is_in_config(), _is_in_cache()
    if c and k: log(f"[plugin_check] {PLUGIN_NAME} is installed and cached"); return True
    if not c:
        log(f"[plugin_check] {PLUGIN_NAME} not in opencode config", "WARN")
        _add_to_config() if auto_fix else _abort_missing_config()
    if not k: _prompt_run_opencode_once(); return False
    return True
def assert_plugin_installed() -> None:
    if not check_plugin_installed(auto_fix=True): sys.exit(1)
