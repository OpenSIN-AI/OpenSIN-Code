#!/usr/bin/env python3
"""Auto-resize new Desktop screenshots to max 7800px (Vertex AI Antigravity limit).
LaunchAgent-safe: mtime polling, no birthtime, no FSEvents."""
import sys, time
from pathlib import Path
from PIL import Image

MAX_DIM = 7800
WATCH_DIR = Path.home() / "Desktop"
EXTS = {".png", ".jpg", ".jpeg"}

preexisting: set[str] = set()   # files present at startup — never touched
pending: dict[str, float] = {}  # new files, mtime from last poll
done: set[str] = set()          # new files already processed


def log(msg: str):
    print(msg, flush=True)


def resize(path: Path, retries: int = 5):
    for attempt in range(retries):
        try:
            img = Image.open(path)
            w, h = img.size
            if max(w, h) <= MAX_DIM:
                return
            ratio = MAX_DIM / max(w, h)
            new_w, new_h = int(w * ratio), int(h * ratio)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            img.save(path)
            log(f"✅ {path.name}: {w}x{h} → {new_w}x{new_h}")
            return
        except OSError as e:
            if e.errno == 11 and attempt < retries - 1:
                time.sleep(1)
            else:
                log(f"⚠️ {path.name}: {e}")
                return
        except Exception as e:
            log(f"⚠️ {path.name}: {e}")
            return


if __name__ == "__main__":
    log(f"[screenshot-resize] Starting — {WATCH_DIR}")
    for p in WATCH_DIR.iterdir():
        if p.suffix.lower() in EXTS:
            preexisting.add(str(p))
    log(f"[screenshot-resize] {len(preexisting)} pre-existing files ignored. Polling every 2s...")
    while True:
        try:
            for p in WATCH_DIR.iterdir():
                if p.suffix.lower() not in EXTS:
                    continue
                key = str(p)
                if key in preexisting or key in done:
                    continue
                try:
                    mtime = p.stat().st_mtime
                except Exception:
                    pending.pop(key, None)
                    continue
                if pending.get(key) == mtime:
                    # mtime stable across 2 polls → file fully written
                    done.add(key)
                    pending.pop(key, None)
                    resize(p)
                else:
                    pending[key] = mtime
        except Exception as e:
            log(f"[screenshot-resize] poll error: {e}")
        time.sleep(2)
