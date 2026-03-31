# Generic atomic step runner
# Chrome is launched as the FIRST thing (Popen) so it appears in <0.5s.
# Workspace steps ws00-ws03 run while Chrome loads in background.
# chrome_wait() is called just before login_all to ensure CDP is ready.
import subprocess, sys, os, time; from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from shared.chrome_wait import wait as chrome_wait

ROOT         = Path(__file__).resolve().parent.parent
PY           = sys.executable
CHROME_OPEN  = "steps/chrome/chrome01_open.py"
CHROME_WAIT  = "steps/chrome/chrome_wait_barrier"   # synthetic barrier marker
LOGIN_ALL    = "steps/login/login_all.py"

def _ts() -> str:
    return time.strftime("%H:%M:%S")

def _kill_rotation_chrome():
    """Kill ONLY Chrome processes using rotation_profile — other Chrome windows stay open."""
    import os, signal
    r = subprocess.run(["pgrep", "-f", "rotation_profile"], capture_output=True, text=True)
    pids = [p.strip() for p in r.stdout.strip().splitlines() if p.strip()]
    for pid in pids:
        try: os.kill(int(pid), signal.SIGTERM)
        except ProcessLookupError: pass
    if pids:
        print(f"[{_ts()}][runner] 🛑 Chrome cleanup: {len(pids)} process(es) killed")

def run(steps):
    chrome_proc = None
    # ── Launch Chrome IMMEDIATELY (before any workspace steps) ────────
    print(f"[{_ts()}][runner] ⚡ Chrome start NOW")
    chrome_proc = subprocess.Popen([PY, CHROME_OPEN], cwd=str(ROOT))
    try:
        for script, desc in steps:
            if script == CHROME_OPEN:
                # Already started above — just log it
                print(f"[{_ts()}][runner] ✓ {desc} (pre-launched)")
                continue
            if script == LOGIN_ALL:
                # Block here until Chrome CDP is ready
                print(f"[{_ts()}][runner] ⏳ Waiting for Chrome CDP...")
                chrome_wait(ROOT)
                print(f"[{_ts()}][runner] ✓ Chrome CDP ready")
            r = subprocess.run([PY, script], cwd=str(ROOT), capture_output=True, text=True)
            if r.returncode != 0:
                print(f"[{_ts()}][runner] FEHLER {script}:\n{r.stderr}")
                sys.exit(1)
            print(f"[{_ts()}][runner] ✓ {desc}")
    finally:
        # Kill chrome01_open.py Python wrapper
        if chrome_proc and chrome_proc.poll() is None:
            chrome_proc.terminate()
            try: chrome_proc.wait(timeout=5)
            except Exception: pass
        # Safety net: kill actual Chrome browser (rotation_profile) if chrome02 step failed
        _kill_rotation_chrome()
