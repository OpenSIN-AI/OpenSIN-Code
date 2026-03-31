from pathlib import Path
from datetime import datetime
LOG_DIR = Path.home() / ".local" / "share" / "openAntigravity-auth-rotator"
LOG_FILE = LOG_DIR / "rotator.log"
LOG_DIR.mkdir(parents=True, exist_ok=True)
def log(msg: str, level: str = "INFO") -> None:
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] [{level}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except Exception:
        pass
