#!/opt/homebrew/bin/python3
"""openAntigravity Rate-Limit Watcher — OCI-Primary + Mac-Fallback.

Architecture:
  1. Detects Claude/Gemini rate-limit signals in opencode logs.
  2. PRIMARY: Calls OCI E2.Micro Blackbox API (POST /api/v1/rotate-antigravity).
  3. FALLBACK: If OCI unreachable after OCI_TIMEOUT_SEC, falls back to local
     Mac rotation (asyncio rotate_account). Fallback stays active as long as
     OCI is down — re-checks OCI health on every cycle.

OCI Blackbox: http://92.5.116.158:7654
"""

import sys
import json
import time
import signal
import threading
import urllib.request
import urllib.error
from collections import deque
from pathlib import Path

_shutdown_requested = False


def _signal_handler(signum, frame):
    global _shutdown_requested
    _shutdown_requested = True
    print(f"[SIGNAL] Received signal {signum}, shutting down gracefully...")
    sys.exit(0)


signal.signal(signal.SIGTERM, _signal_handler)
signal.signal(signal.SIGINT, _signal_handler)

sys.path.insert(0, "/Users/jeremy/.open-auth-rotator/antigravity")
from core.watcher import Watcher
from core.plugin_check import assert_plugin_installed
from core.main_ensure import _ensure_setup
from core.utils_log import log

# ── OCI Blackbox Config ─────────────────────────────────────────────────────
OCI_URL = "http://92.5.116.158:7654/api/v1/rotate-antigravity"
OCI_HEALTH_URL = "http://92.5.116.158:7654/health"
OCI_RESULT_URL = "http://92.5.116.158:7654/api/v1/result"
OCI_TIMEOUT_SEC = 10  # HTTP connect/read timeout
OCI_RETRY_DELAY = 5  # seconds between OCI retries (max 2 retries)
OCI_MAX_RETRIES = 2
OCI_RESULT_POLL_INTERVAL = 8  # seconds between result polls
OCI_RESULT_POLL_MAX = 320  # max seconds to wait for OCI rotation to finish

# ── Local Fallback Config ────────────────────────────────────────────────────
_ROTATE_TIMEOUT = 300
_MAX_CONSECUTIVE_FAILS = 5
_FAIL_COOLDOWN = 120
_ADAPTIVE_WINDOW = 3600
_ADAPTIVE_MAX_ROTATIONS = 20  # raised from 10 — OCI path also counted previously
_ADAPTIVE_COOLDOWN = 60

_FAIL_STATE_PATH = (
    Path.home() / ".config" / "openAntigravity-auth-rotator" / "fail_state.json"
)
_fail_state = {"count": 0, "cooldown_until": 0}
_rotation_times: deque = deque()
_oci_last_fail_time = 0.0
_oci_healthy = None  # None = unknown, True/False after first check


def _load_fail_state() -> None:
    try:
        if _FAIL_STATE_PATH.exists():
            data = json.loads(_FAIL_STATE_PATH.read_text())
            _fail_state["count"] = int(data.get("count", 0))
            _fail_state["cooldown_until"] = float(data.get("cooldown_until", 0))
    except Exception:
        pass


def _save_fail_state() -> None:
    try:
        _FAIL_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        tmp = _FAIL_STATE_PATH.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(_fail_state, indent=2))
        tmp.replace(_FAIL_STATE_PATH)
    except Exception:
        pass


def _adaptive_cooldown_active(now: float) -> bool:
    while _rotation_times and now - _rotation_times[0] > _ADAPTIVE_WINDOW:
        _rotation_times.popleft()
    if len(_rotation_times) >= _ADAPTIVE_MAX_ROTATIONS:
        log(
            f"[rotate_callback] Adaptive cooldown: {_ADAPTIVE_MAX_ROTATIONS} rotations in {_ADAPTIVE_WINDOW}s — pausing {_ADAPTIVE_COOLDOWN}s",
            "WARN",
        )
        try:
            from core.utils_notify import notify

            notify(
                "Antigravity Rotator",
                f"Adaptive cooldown: {_ADAPTIVE_MAX_ROTATIONS}x in 1h — paused 1min",
            )
        except Exception:
            pass
        return True
    return False


def _check_oci_health() -> bool:
    try:
        req = urllib.request.Request(OCI_HEALTH_URL, method="GET")
        with urllib.request.urlopen(req, timeout=OCI_TIMEOUT_SEC) as resp:
            return resp.status == 200
    except Exception:
        return False


def _poll_oci_result(accepted_at: float) -> dict | None:
    """Poll OCI /result until a fresh rotation result appears (rotated_at > accepted_at)."""
    deadline = time.time() + OCI_RESULT_POLL_MAX
    while time.time() < deadline:
        try:
            req = urllib.request.Request(OCI_RESULT_URL, method="GET")
            with urllib.request.urlopen(req, timeout=OCI_TIMEOUT_SEC) as resp:
                body = json.loads(resp.read().decode("utf-8", errors="replace"))
            creds = body.get("credentials")
            if creds and body.get("status") == "ok":
                from datetime import datetime, timezone

                rotated_str = creds.get("rotated_at", "")
                try:
                    rotated_ts = (
                        datetime.fromisoformat(rotated_str)
                        .replace(tzinfo=timezone.utc)
                        .timestamp()
                    )
                except Exception:
                    rotated_ts = 0.0
                if rotated_ts > accepted_at - 5:
                    log(
                        f"[OCI] Got fresh credentials for {creds.get('email', '?')}",
                        "INFO",
                    )
                    return creds
        except Exception as e:
            log(f"[OCI] /result poll error: {e}", "WARN")
        time.sleep(OCI_RESULT_POLL_INTERVAL)
    log("[OCI] /result poll timeout — rotation may still be running", "WARN")
    return None


def _inject_oci_credentials(creds: dict) -> bool:
    """Write OCI-rotated credentials into Mac auth.json and accounts.json."""
    from core.accounts_path import OPENCODE_AUTH_PATH, ACCOUNTS_PATH
    from core.accounts_save import save_accounts
    from core.accounts_load import load_accounts

    refresh = creds.get("refresh_token_stored") or creds.get("refresh", "")
    access = creds.get("access", "")
    expires = creds.get("expires", 0)
    email = creds.get("email", "")
    project_id = creds.get("project_id", "")
    managed_project_id = creds.get("managed_project_id", "") or project_id

    if not refresh or not access:
        log("[OCI] inject: missing refresh or access token — skipping", "WARN")
        return False

    try:
        import os

        auth = (
            json.loads(OPENCODE_AUTH_PATH.read_text())
            if OPENCODE_AUTH_PATH.exists()
            else {}
        )
        auth["google"] = {
            "type": "oauth",
            "refresh": refresh,
            "access": access,
            "expires": int(expires),
        }
        tmp = OPENCODE_AUTH_PATH.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(auth, indent=2))
        os.chmod(tmp, 0o600)
        os.replace(tmp, OPENCODE_AUTH_PATH)
        log(f"[OCI] inject: auth.json updated for {email}", "INFO")
    except Exception as e:
        log(f"[OCI] inject: auth.json write failed: {e}", "ERROR")
        return False

    try:
        import time as _time

        now_ms = int(_time.time() * 1000)
        storage = load_accounts()
        storage["accounts"] = [
            {
                "email": email,
                "refreshToken": refresh,
                "projectId": project_id,
                "managedProjectId": managed_project_id,
                "addedAt": now_ms,
                "lastUsed": now_ms,
                "lastSwitchReason": "antigravity-auth-rotator",
                "enabled": True,
            }
        ]
        storage["activeIndex"] = 0
        storage["activeIndexByFamily"] = {"claude": 0, "gemini": 0}
        save_accounts(storage)
        log(f"[OCI] inject: accounts.json updated for {email}", "INFO")
    except Exception as e:
        log(f"[OCI] inject: accounts.json write failed: {e}", "ERROR")

    try:
        from core.opencode_restart import notify_opencode_sessions

        notify_opencode_sessions("mach weiter")
        log("[OCI] inject: notified opencode sessions", "INFO")
    except Exception as e:
        log(f"[OCI] inject: session notify failed (non-fatal): {e}", "WARN")

    return True


def _call_oci_rotate() -> float | None:
    """POST /api/v1/rotate-antigravity. Returns accepted_at timestamp on success, None otherwise."""
    global _oci_healthy
    accepted_at = None
    for attempt in range(1, OCI_MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(
                OCI_URL,
                data=b"{}",
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=OCI_TIMEOUT_SEC) as resp:
                body = resp.read().decode("utf-8", errors="replace")
                if resp.status in (200, 202):
                    log(
                        f"[OCI] Rotation accepted (attempt={attempt}). Response: {body[:200]}",
                        "INFO",
                    )
                    _oci_healthy = True
                    return time.time()
                elif resp.status == 429:
                    log("[OCI] 429 — already rotating. Will retry later.", "WARN")
                    _oci_healthy = True
                    return None
                else:
                    log(f"[OCI] Unexpected status {resp.status}: {body[:200]}", "WARN")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                log("[OCI] 429 — already rotating. Will retry later.", "WARN")
                _oci_healthy = True
                return None
            log(f"[OCI] HTTP error {e.code} (attempt={attempt}): {e}", "WARN")
        except Exception as e:
            log(f"[OCI] Connection error (attempt={attempt}): {e}", "WARN")
            if attempt < OCI_MAX_RETRIES:
                time.sleep(OCI_RETRY_DELAY)

    _oci_healthy = False
    log(
        "[OCI] All retries failed — marking OCI unhealthy, switching to Mac fallback.",
        "ERROR",
    )
    return None


def _run_local_fallback() -> bool:
    """Run the local Mac-side rotation. Returns True on success."""
    import asyncio
    from core.main_rotate import rotate_account
    from core.login.login_chrome import close_debug_chrome
    from core.watcher_config import LOCK_FILE

    log("[FALLBACK] Running local Mac rotation...", "WARN")

    async def _run_with_timeout():
        try:
            return await asyncio.wait_for(rotate_account(), timeout=_ROTATE_TIMEOUT)
        except asyncio.TimeoutError:
            log(
                f"[FALLBACK] TIMEOUT after {_ROTATE_TIMEOUT}s — killing Chrome and aborting",
                "ERROR",
            )
            try:
                close_debug_chrome()
            except Exception:
                pass
            raise

    try:
        ok = asyncio.run(_run_with_timeout())
        if not ok:
            log("[FALLBACK] Local rotation returned failure.", "ERROR")
            return False
        log("[FALLBACK] Local rotation SUCCESS.", "INFO")
        return True
    except asyncio.TimeoutError:
        log("[FALLBACK] Rotation aborted due to timeout.", "WARN")
        LOCK_FILE.unlink(missing_ok=True)
        return False
    except Exception as e:
        log(f"[FALLBACK] rotate_callback FAILED: {e}", "ERROR")
        return False


def rotate_callback():
    global _oci_healthy

    now = time.time()
    if now < _fail_state["cooldown_until"]:
        remaining = int(_fail_state["cooldown_until"] - now)
        log(
            f"[rotate_callback] Flood-protection active — {remaining}s remaining, skipping",
            "WARN",
        )
        return

    if _adaptive_cooldown_active(now):
        return

    # ── Try OCI primary ─────────────────────────────────────────────────────
    _t_start = time.time()
    success = False
    used_oci = False

    oci_up = _check_oci_health()
    if oci_up:
        log("[rotate_callback] OCI reachable — calling blackbox.", "INFO")
        accepted_at = _call_oci_rotate()
        if accepted_at is not None:
            used_oci = True
            log(
                "[rotate_callback] OCI accepted — polling for new credentials...",
                "INFO",
            )
            creds = _poll_oci_result(accepted_at)
            if creds:
                injected = _inject_oci_credentials(creds)
                success = injected
                if not injected:
                    log("[rotate_callback] OCI credentials inject failed", "ERROR")
            else:
                log(
                    "[rotate_callback] OCI result poll timed out — rotation may have failed",
                    "WARN",
                )
                success = False
        else:
            log("[rotate_callback] OCI busy/failed — will retry next cycle.", "WARN")
            return
    else:
        log("[rotate_callback] OCI unreachable — using Mac fallback.", "WARN")
        try:
            from core.utils_notify import notify

            notify(
                "Antigravity Rotator",
                "OCI Blackbox unreachable — running local fallback",
            )
        except Exception:
            pass

    # ── Fallback to local Mac if OCI down ───────────────────────────────────
    if not success and not oci_up:
        success = _run_local_fallback()

    # ── Update fail state ────────────────────────────────────────────────────
    if success:
        if not used_oci:
            _rotation_times.append(time.time())
        _fail_state["count"] = 0
        _fail_state["cooldown_until"] = 0
        log(
            f"[rotate_callback] SUCCESS ({'OCI' if used_oci else 'Mac fallback'}). Local rotations this hour: {len(_rotation_times)}",
            "INFO",
        )
        _duration_ms = int((time.time() - _t_start) * 1000)
        _source = "oci" if used_oci else "mac_fallback"
        _email = (creds or {}).get("email", "") if used_oci else ""
        try:
            from telegram_notifications import notify_antigravity_rotation

            notify_antigravity_rotation(_email)
        except Exception as _tg_err:
            log(f"[rotate_callback] Telegram notify failed: {_tg_err}", "WARN")
        try:
            from telemetry_push import rotation_success

            rotation_success(_email, _duration_ms, source=_source)
        except Exception as _tel_err:
            log(f"[rotate_callback] Telemetry push failed: {_tel_err}", "WARN")
    else:
        _duration_ms = int((time.time() - _t_start) * 1000)
        _fail_state["count"] += 1
        _err_msg = f"consecutive_fail #{_fail_state['count']}"
        if _fail_state["count"] >= _MAX_CONSECUTIVE_FAILS:
            _fail_state["cooldown_until"] = time.time() + _FAIL_COOLDOWN
            _err_msg = f"{_MAX_CONSECUTIVE_FAILS}x consecutive failures — paused {_FAIL_COOLDOWN}s"
            log(
                f"[rotate_callback] {_err_msg}",
                "ERROR",
            )
            try:
                from core.utils_notify import notify

                notify(
                    "Antigravity Rotator",
                    f"CRITICAL: {_err_msg}",
                )
            except Exception:
                pass
        try:
            from telemetry_push import rotation_failure

            _source = "oci" if used_oci else "mac_fallback"
            rotation_failure(_err_msg, _duration_ms, source=_source)
        except Exception as _tel_err:
            log(f"[rotate_callback] Telemetry push failed: {_tel_err}", "WARN")

    _save_fail_state()


def _workspace_daemon():
    while True:
        try:
            from core.workspace_cleanup import cleanup_workspace_accounts

            cleanup_workspace_accounts()
        except Exception:
            pass
        time.sleep(1800)


threading.Thread(target=_workspace_daemon, daemon=True).start()
try:
    from core.workspace_cleanup import cleanup_workspace_accounts

    cleanup_workspace_accounts()
except Exception:
    pass

if __name__ == "__main__":
    from core.accounts_path import OPENCODE_AUTH_PATH, ACCOUNTS_PATH

    # Startup health-check
    try:
        if not OPENCODE_AUTH_PATH.exists():
            log("[HEALTH] FATAL: auth.json not found!", "ERROR")
            sys.exit(1)
        auth = json.loads(OPENCODE_AUTH_PATH.read_text())
        if "google" not in auth:
            log("[HEALTH] FATAL: google key missing from auth.json!", "ERROR")
            sys.exit(1)
        if not ACCOUNTS_PATH.exists():
            log("[HEALTH] FATAL: antigravity-accounts.json not found!", "ERROR")
            sys.exit(1)
        accounts = json.loads(ACCOUNTS_PATH.read_text())
        if not accounts.get("accounts"):
            log("[HEALTH] FATAL: no accounts in antigravity-accounts.json!", "ERROR")
            sys.exit(1)
        log("[HEALTH] OK: auth.json and accounts.json valid")
    except Exception as e:
        log(f"[HEALTH] FATAL: startup check failed: {e}", "ERROR")
        sys.exit(1)

    # Startup OCI health check (non-fatal)
    log("[HEALTH] Checking OCI Blackbox reachability...", "INFO")
    if _check_oci_health():
        log(f"[HEALTH] OCI Blackbox is reachable at {OCI_HEALTH_URL} ✓", "INFO")
    else:
        log(
            f"[HEALTH] OCI Blackbox UNREACHABLE at {OCI_HEALTH_URL} — will use Mac fallback until it's up.",
            "WARN",
        )

    _load_fail_state()
    _ensure_setup()
    assert_plugin_installed()
    log("Starting Antigravity rate-limit watcher (OCI-primary + Mac-fallback)...")
    w = Watcher(rotate_callback, poll_interval=8.0)
    w.run()
