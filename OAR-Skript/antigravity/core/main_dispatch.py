import os
import sys
import asyncio
import time
from .plugin_check import assert_plugin_installed
from .main_ensure import _ensure_setup
from .main_cmd_status import cmd_status
from .main_cmd_cleanup import cmd_cleanup
from .utils_log import log
from .main_rotate import rotate_account
from .watcher_rotation_state import mark_rotation_complete
from .watcher_config import LOCK_FILE

# Maximum age of a lock file before it's considered stale (seconds)
_LOCK_MAX_AGE_SECS = 10 * 60  # 10 minutes — no rotation takes longer


def _is_lock_stale() -> bool:
    """Check if the lock file is stale (owner dead or too old)."""
    if not LOCK_FILE.exists():
        return False
    # Check PID stored in lock
    try:
        content = LOCK_FILE.read_text().strip()
        if content:
            pid = int(content)
            try:
                os.kill(pid, 0)  # signal 0 = check if process exists
                # Process exists — but check age anyway
            except (OSError, ProcessLookupError):
                # Process is DEAD → stale lock
                log(f"[main] Lock owner PID {pid} is dead — removing stale lock")
                return True
    except (ValueError, IOError):
        pass  # No PID or unreadable — fall through to age check
    # Check age of lock file
    try:
        age = abs(time.time() - LOCK_FILE.stat().st_mtime)
        if age > _LOCK_MAX_AGE_SECS:
            log(
                f"[main] Lock file is {int(age)}s old (>{_LOCK_MAX_AGE_SECS}s) — removing stale lock"
            )
            return True
    except OSError:
        pass
    return False


def _acquire_lock() -> None:
    """Write our PID into the lock file."""
    LOCK_FILE.write_text(str(os.getpid()))


def dispatch(args) -> None:
    cmd = args.command
    if cmd == "status":
        assert_plugin_installed()
        cmd_status()
        return
    if cmd == "cleanup":
        assert_plugin_installed()
        cmd_cleanup()
        return
    if cmd == "setup":
        assert_plugin_installed()
        from core.setup import run_setup

        run_setup()
        return
    assert_plugin_installed()
    if cmd == "rotate":
        if LOCK_FILE.exists():
            if _is_lock_stale():
                LOCK_FILE.unlink(missing_ok=True)
                log("[main] Stale lock removed — proceeding with rotation")
            else:
                log("[main] Lock file exists — rotation in progress")
                sys.exit(1)
        _ensure_setup()
        _acquire_lock()
        try:
            ok = asyncio.run(rotate_account())
        finally:
            mark_rotation_complete()
            LOCK_FILE.unlink(missing_ok=True)
        sys.exit(0 if ok else 1)
    _ensure_setup()
    log("[main] Watcher starting ...")
    from .watcher import Watcher

    Watcher(rotation_callback=lambda: asyncio.run(rotate_account())).run()
