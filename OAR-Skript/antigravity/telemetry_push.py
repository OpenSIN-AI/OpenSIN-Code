#!/usr/bin/env python3
"""Push structured rotation telemetry to Supabase fleet_telemetry table.

Non-blocking, fire-and-forget — telemetry failures never block rotation.
Uses the existing fleet_telemetry table with agent_id='antigravity-rotator'.
"""

import json
import platform
import time
import urllib.request
import urllib.error

_URL = "https://supabase-api.delqhi.com"
_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjkyNzk1MDIsImV4cCI6MTkyNjk1OTUwMn0."
    "VC8PWVGs9rSHEsVjnDQ2wEVv3oVFHwOKQDSoYgw35AE"
)
_HOST = platform.node() or "unknown"
_AGENT = "antigravity-rotator"
_HEADERS = {
    "apikey": _KEY,
    "Authorization": f"Bearer {_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
}


def push_event(
    event: str,
    outcome: str,
    *,
    duration_ms: int | None = None,
    email: str = "",
    error_message: str = "",
    source: str = "oci",
    extra: dict | None = None,
) -> bool:
    details = {"source": source}
    if email:
        details["rotator_email"] = email
    if error_message:
        details["error_message"] = error_message
    if extra:
        details.update(extra)

    payload = {
        "agent_id": _AGENT,
        "event": event,
        "level": "info" if outcome == "success" else "error",
        "hostname": _HOST,
        "duration_ms": duration_ms,
        "details": details,
    }

    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"{_URL}/rest/v1/fleet_telemetry",
            data=data,
            headers=_HEADERS,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=8):
            pass
        return True
    except Exception:
        return False


def rotation_success(
    email: str, duration_ms: int, source: str = "oci", extra: dict | None = None
) -> bool:
    return push_event(
        "rotation",
        "success",
        duration_ms=duration_ms,
        email=email,
        source=source,
        extra=extra,
    )


def rotation_failure(
    error_message: str, duration_ms: int, source: str = "oci", extra: dict | None = None
) -> bool:
    return push_event(
        "rotation",
        "failure",
        duration_ms=duration_ms,
        error_message=error_message,
        source=source,
        extra=extra,
    )


def rate_limit_detected(model: str = "", reset_hours: float = 0) -> bool:
    return push_event(
        "rate_limit_detected",
        "warning",
        extra={"model": model, "reset_hours": reset_hours},
    )


if __name__ == "__main__":
    ok = push_event("selftest", "success", duration_ms=0, extra={"test": True})
    print(f"Telemetry push: {'OK' if ok else 'FAILED'}")
