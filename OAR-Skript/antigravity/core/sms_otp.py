import time
from .sms_reader import _load_reader
from .sms_poll import _poll_once
from .utils_log import log
def wait_for_sms_otp(timeout: int = 120, poll_interval: float = 3.0, sender_filter=None) -> str | None:
    reader = _load_reader()
    if reader is None:
        log("[sms_otp] Cannot read iMessage — OTP must be entered manually", "WARN"); return None
    deadline = time.time() + timeout
    seen: set = set()
    log(f"[sms_otp] Waiting up to {timeout}s for Google OTP via iMessage ...")
    while time.time() < deadline:
        code = _poll_once(reader, seen, sender_filter)
        if code: return code
        time.sleep(poll_interval)
    log("[sms_otp] OTP timeout — no code received", "WARN")
    return None
