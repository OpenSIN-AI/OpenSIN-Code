import glob, os, subprocess
from pathlib import Path

def quit_chrome(profile_dir: Path | None = None) -> None:
    r = subprocess.run(["pgrep", "-f", "Google Chrome"], capture_output=True, text=True)
    for pid in r.stdout.strip().splitlines():
        try: os.kill(int(pid), 9)
        except Exception: pass
    targets = [profile_dir] if profile_dir else []
    targets.append(Path.home() / "Library" / "Application Support" / "Google" / "Chrome")
    for base in targets:
        for lock in glob.glob(str(base / "Singleton*")):
            try: os.remove(lock)
            except Exception: pass
