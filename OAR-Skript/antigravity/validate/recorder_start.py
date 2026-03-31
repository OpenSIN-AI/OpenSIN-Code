# Single action: starts screen recording for a step using macOS screencapture
import subprocess
from pathlib import Path

REC_DIR = Path(__file__).parent.parent / "logs" / "recordings"

def start(step_name: str) -> subprocess.Popen:
    REC_DIR.mkdir(parents=True, exist_ok=True)
    path = REC_DIR / f"{step_name}.mp4"
    return subprocess.Popen(
        ["screencapture", "-v", "-x", str(path)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
