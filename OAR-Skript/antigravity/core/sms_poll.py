from .sms_reader import OTP_PATTERN
from .utils_log import log
def _poll_once(reader, seen_timestamps: set, sender_filter) -> str | None:
    try:
        for msg in reader.get_latest_messages(limit=10):
            ts     = msg.get("date") or msg.get("timestamp") or ""
            text   = msg.get("text") or ""
            sender = msg.get("sender") or ""
            key    = f"{sender}:{ts}:{text[:20]}"
            if key in seen_timestamps: continue
            seen_timestamps.add(key)
            if sender_filter and not any(s in sender for s in sender_filter): continue
            if msg.get("is_from_me"): continue
            m = OTP_PATTERN.search(text)
            if m: log(f"[sms_otp] Found OTP from {sender}: {m.group(1)}"); return m.group(1)
    except Exception as e:
        log(f"[sms_otp] Poll error: {e}", "WARN")
    return None
