#!/usr/bin/env python3
"""Resize image to max 7800px per dimension (Vertex AI Antigravity limit: 8000px).
Usage: python3 resize_img.py <input> [output]
Waits for file to be fully written before resizing."""
import sys, time, os
from PIL import Image

MAX_DIM = 7800
src = sys.argv[1]
dst = sys.argv[2] if len(sys.argv) > 2 else src

# Wait for file to be fully written (stable size, 2 consecutive checks)
prev_size = -1
for _ in range(30):  # max 6s
    try:
        cur_size = os.path.getsize(src)
        if cur_size > 0 and cur_size == prev_size:
            break
        prev_size = cur_size
    except OSError:
        pass
    time.sleep(0.2)

try:
    img = Image.open(src)
    w, h = img.size
except Exception as e:
    print(f"⚠️ Cannot open {src}: {e}")
    sys.exit(1)

if max(w, h) <= MAX_DIM:
    print(f"✅ {w}x{h} — already within limit, no resize needed")
    sys.exit(0)

ratio = MAX_DIM / max(w, h)
new_size = (int(w * ratio), int(h * ratio))
for attempt in range(5):
    try:
        img = img.resize(new_size, Image.LANCZOS)
        img.save(dst)
        print(f"✅ Resized {w}x{h} → {new_size[0]}x{new_size[1]} → {dst}")
        sys.exit(0)
    except OSError as e:
        if e.errno == 11 and attempt < 4:  # EDEADLK (Spotlight lock)
            time.sleep(1)
        else:
            print(f"⚠️ Save failed: {e}")
            sys.exit(1)
