#!/usr/bin/env python3
from __future__ import annotations

import filecmp
import json
import shutil
import sys
from pathlib import Path


HOME = Path.home()
VENDOR_DIR = HOME / ".config/opencode/vendor/opencode-antigravity-auth-1.6.5-beta.0"
TARGET_DIR = HOME / ".cache/opencode/node_modules/opencode-antigravity-auth"
KEY_FILES = [
    "package.json",
    "dist/src/plugin.js",
    "dist/src/plugin/storage.js",
    "dist/src/plugin/accounts.js",
]


def read_version(base: Path) -> str | None:
    package_json = base / "package.json"
    if not package_json.exists():
        return None
    try:
        return json.loads(package_json.read_text()).get("version")
    except Exception:
        return None


def matches_vendor() -> bool:
    if not TARGET_DIR.exists():
        return False
    if read_version(VENDOR_DIR) != read_version(TARGET_DIR):
        return False
    for rel in KEY_FILES:
        src = VENDOR_DIR / rel
        dst = TARGET_DIR / rel
        if not src.exists() or not dst.exists():
            return False
        if not filecmp.cmp(src, dst, shallow=False):
            return False
    return True


def main() -> int:
    if not VENDOR_DIR.exists():
        print(
            f"[restore_antigravity_runtime] vendor copy missing: {VENDOR_DIR}",
            file=sys.stderr,
        )
        return 0

    TARGET_DIR.parent.mkdir(parents=True, exist_ok=True)

    if matches_vendor():
        return 0

    tmp_dir = TARGET_DIR.parent / f".{TARGET_DIR.name}.tmp"
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    shutil.copytree(VENDOR_DIR, tmp_dir, symlinks=False)
    if TARGET_DIR.exists():
        shutil.rmtree(TARGET_DIR)
    tmp_dir.rename(TARGET_DIR)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
