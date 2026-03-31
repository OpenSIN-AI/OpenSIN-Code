import os
import signal
import shutil
import subprocess
import time
import urllib.request
from pathlib import Path

LOGIN_PROFILE = Path("/tmp/openAntigravity_login_profile_7654")
LOGIN_PID = Path("/tmp/openAntigravity_login_profile_7654.pid")
CHROME_BINARY = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def _debug_ready() -> bool:
    try:
        with urllib.request.urlopen("http://127.0.0.1:7654/json/version", timeout=1):
            return True
    except Exception:
        return False


def _stop_existing_debug_chrome() -> None:
    if LOGIN_PID.exists():
        try:
            pid = int(LOGIN_PID.read_text().strip())
            os.killpg(pid, signal.SIGTERM)
            time.sleep(1)
            try:
                os.killpg(pid, 0)
                os.killpg(pid, signal.SIGKILL)
            except OSError:
                pass
        except Exception:
            pass
        LOGIN_PID.unlink(missing_ok=True)
        time.sleep(0.3)
        return
    try:
        result = subprocess.run(
            ["/usr/sbin/lsof", "-ti", "tcp:7654"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except Exception:
        return
    pids = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    for pid in pids:
        try:
            os.killpg(int(pid), signal.SIGTERM)
        except Exception:
            subprocess.run(
                ["kill", "-TERM", pid],
                check=False,
                timeout=2,
                capture_output=True,
            )
    if pids:
        time.sleep(0.3)
    for pid in pids:
        try:
            os.killpg(int(pid), signal.SIGKILL)
        except Exception:
            subprocess.run(
                ["kill", "-KILL", pid],
                check=False,
                timeout=2,
                capture_output=True,
            )


def close_debug_chrome() -> None:
    _stop_existing_debug_chrome()


async def connect_tab():
    from core.utils import apply_nodriver_py314_patch

    apply_nodriver_py314_patch()
    import nodriver as uc

    _stop_existing_debug_chrome()
    if LOGIN_PROFILE.exists():
        shutil.rmtree(LOGIN_PROFILE, ignore_errors=True)
    LOGIN_PROFILE.mkdir(parents=True, exist_ok=True)
    proc = subprocess.Popen(
        [
            CHROME_BINARY,
            "--remote-debugging-port=7654",
            f"--user-data-dir={LOGIN_PROFILE}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-extensions",
            "--disable-default-apps",
            "--disable-background-networking",
            "--disable-sync",
            "--hide-crash-restore-bubble",
            "--disable-features=SigninInterceptBubble,ExplicitBrowserSigninUIOnDesktop",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    LOGIN_PID.write_text(str(proc.pid))
    for _ in range(40):
        if proc.poll() is not None:
            raise RuntimeError(
                f"Chrome exited early with code {proc.poll()} — port 7654 never ready"
            )
        if _debug_ready():
            break
        time.sleep(0.5)
    else:
        proc.kill()
        raise RuntimeError("Chrome did not become ready on port 7654 within 20s")
    return await uc.start(host="127.0.0.1", port=7654)
