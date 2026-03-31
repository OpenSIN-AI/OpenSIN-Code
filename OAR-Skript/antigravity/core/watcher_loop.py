import os
import time
from typing import Callable
from .watcher_config import (
    LOCK_FILE,
    COOLDOWN_SECS,
    LOGS_DIR,
    LOGS_DIR_LEGACY,
    ACCOUNTS_PATH,
    _GOOGLE_AUTH_REINJECT_COOLDOWN,
)
from .watcher_log_scan import _scan_logs, preload_log_positions, _flush_log_positions
from .watcher_accounts_check import _check_accounts_blocked
from .watcher_guardian import guard_google_auth
from .watcher_rotation_state import mark_rotation_complete, read_last_rotation_time
from .utils_log import log

_STALE_LOCK_MAX_AGE_SECS = 600
_POST_ROTATION_GRACE_SECS = 10  # hard minimum gap after rotation END before next one
_HEARTBEAT_INTERVAL_SECS = 300  # log heartbeat every 5 min so we know watcher is alive


def _clear_stale_lock() -> bool:
    if not LOCK_FILE.exists():
        return False
    try:
        content = LOCK_FILE.read_text().strip()
        if content:
            pid = int(content)
            try:
                os.kill(pid, 0)
            except (OSError, ProcessLookupError):
                log(f"[watcher] Lock owner PID {pid} is dead — removing stale lock")
                LOCK_FILE.unlink(missing_ok=True)
                return True
    except (ValueError, IOError):
        pass
    try:
        age = abs(time.time() - LOCK_FILE.stat().st_mtime)
        if age > _STALE_LOCK_MAX_AGE_SECS:
            log(
                f"[watcher] Lock file is {int(age)}s old (>{_STALE_LOCK_MAX_AGE_SECS}s) — removing stale lock"
            )
            LOCK_FILE.unlink(missing_ok=True)
            return True
    except OSError:
        pass
    return False


def run_loop(state: dict, cb: Callable, poll: float = 8.0) -> None:
    log(f"[watcher] Starting, polling every {poll:.0f}s")
    dirs = [d for d in (LOGS_DIR, LOGS_DIR_LEGACY) if d.exists()]
    preload_log_positions(dirs, state.setdefault("pos", {}))
    while True:
        try:
            now = time.time()
            _clear_stale_lock()
            if now - state.get("last_heartbeat", 0) >= _HEARTBEAT_INTERVAL_SECS:
                import json as _json

                try:
                    _acc_data = (
                        _json.loads(ACCOUNTS_PATH.read_text())
                        if ACCOUNTS_PATH.exists()
                        else {}
                    )
                    _accs = _acc_data.get("accounts", [])
                    _email = _accs[0].get("email", "?") if _accs else "none"
                    _rf = (
                        _accs[0]
                        .get("cachedQuota", {})
                        .get("claude", {})
                        .get("remainingFraction", "?")
                        if _accs
                        else "?"
                    )
                except Exception:
                    _email, _rf = "?", "?"
                log(
                    f"[watcher] heartbeat — account={_email} claude_quota={_rf} dirs={len(dirs)}"
                )
                state["last_heartbeat"] = now
            if now - state.get("last_ri", 0) >= _GOOGLE_AUTH_REINJECT_COOLDOWN:
                if not LOCK_FILE.exists():
                    guard_google_auth()
                state["last_ri"] = now
            dirs = [d for d in (LOGS_DIR, LOGS_DIR_LEGACY) if d.exists()]
            if not LOCK_FILE.exists():
                hit = _scan_logs(
                    dirs, state.setdefault("pos", {})
                ) or _check_accounts_blocked(ACCOUNTS_PATH)
                time_since_last_trigger = now - state.get("last_trigger", 0)
                if hit:
                    state["last_trigger"] = now
                    shared_last_rot = read_last_rotation_time()
                    effective_last_rot = max(state.get("last_rot", 0), shared_last_rot)
                    should_rotate = (
                        effective_last_rot == 0
                        or (now - effective_last_rot >= COOLDOWN_SECS)
                        or (time_since_last_trigger >= 60 and effective_last_rot > 0)
                    )
                    time_since_last_rot = now - effective_last_rot
                    if (
                        should_rotate
                        and time_since_last_rot >= min(30, COOLDOWN_SECS)
                        and time_since_last_rot >= _POST_ROTATION_GRACE_SECS
                    ):
                        log(
                            f"[watcher] Rate-limit detected → full rotation (hit={hit}, time_since_trigger={time_since_last_trigger:.0f}s)"
                        )
                        try:
                            LOCK_FILE.write_text(str(os.getpid()))
                        except Exception as lock_err:
                            log(
                                f"[watcher] LOCK_FILE write failed: {lock_err}",
                                "WARN",
                            )
                            time.sleep(poll)
                            continue
                        try:
                            cb()
                        finally:
                            state["last_rot"] = mark_rotation_complete()
                            LOCK_FILE.unlink(missing_ok=True)
                            _flush_log_positions(dirs, state["pos"])
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception as e:
            log(f"[watcher] Loop error: {e}", "WARN")
        time.sleep(poll)
