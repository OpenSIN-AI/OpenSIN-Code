#!/usr/bin/env python3

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


REQUIRED_FILES = [
    "SKILL.md",
    "agents/openai.yaml",
    "references/stack-2026-02-26.md",
    "references/design-worldclass-standards-2026-02-27.md",
    "scripts/browser_crashtest_audit.mjs",
    "scripts/design_zeugnis_engine.mjs",
    "scripts/design_judge_schema.mjs",
    "scripts/design_judge_codex_app.mjs",
    "scripts/design_judge_qwen_nim.mjs",
    "scripts/design_fusion.mjs",
    "scripts/design_zeugnis_selftest.mjs",
]


def run(cmd: list[str], cwd: Path) -> tuple[int, str]:
    proc = subprocess.run(
        cmd,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        check=False,
    )
    return proc.returncode, proc.stdout.strip()


def validate(root: Path) -> int:
    failures: list[str] = []

    for rel in REQUIRED_FILES:
        if not (root / rel).exists():
            failures.append(f"missing required file: {rel}")

    scripts_dir = root / "scripts"
    for script in sorted(scripts_dir.glob("*.mjs")):
        code, output = run(["node", "--check", str(script)], cwd=root)
        if code != 0:
            failures.append(f"node --check failed: {script}\n{output}")

    selftest = root / "scripts" / "design_zeugnis_selftest.mjs"
    if selftest.exists():
        code, output = run(["node", str(selftest)], cwd=root)
        if code != 0:
            failures.append(f"selftest failed: {selftest}\n{output}")

    if failures:
        print("quick_validate: FAIL")
        for item in failures:
            print(f"- {item}")
        return 1

    print("quick_validate: PASS")
    return 0


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    if not root.exists():
        print(f"path does not exist: {root}", file=sys.stderr)
        return 2
    return validate(root)


if __name__ == "__main__":
    raise SystemExit(main())
