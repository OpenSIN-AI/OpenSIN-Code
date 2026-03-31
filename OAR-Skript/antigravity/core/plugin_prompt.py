import sys
from .plugin_paths import PLUGIN_NAME, PLUGIN_SPEC, OPENCODE_CONFIG
from .utils_log import log
from .utils_notify import notify
def _prompt_run_opencode_once() -> None:
    notify("openAntigravity-auth-rotator", f"{PLUGIN_NAME} added to opencode.json. Run opencode once, then re-run.")
    log("=" * 60, "WARN")
    log(f"[plugin_check] {PLUGIN_NAME} added to opencode.json.", "WARN")
    log("[plugin_check] Run 'opencode' once to download the plugin, then re-run.", "WARN")
    log("=" * 60, "WARN")
def _abort_missing_config() -> None:
    log(f"[plugin_check] {PLUGIN_SPEC} not in opencode.json — auto_fix disabled", "ERROR")
    log(f"[plugin_check] Manually add to {OPENCODE_CONFIG}", "ERROR")
    sys.exit(1)
