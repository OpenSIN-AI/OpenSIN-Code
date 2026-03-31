# DEPRECATED/DISABLED - DO NOT WRITE TO opencode.json
from .utils_log import log
def enable_gemini_api_fallback(api_key: str | None = None, reason: str = "") -> bool:
    log("[gemini_config] FALLBACK DISABLED BY USER REQUEST")
    return False
def disable_gemini_api_fallback() -> bool:
    return True
def get_current_gemini_api_key() -> str | None:
    return None
