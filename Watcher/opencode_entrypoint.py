#!/usr/bin/env python3

import json
import os
import subprocess
import sys


HOME = os.path.expanduser("~")
PATCHER = os.path.join(
    HOME, ".config", "opencode", "scripts", "restore_antigravity_runtime.py"
)
CHECKER = os.path.join(HOME, ".local", "bin", "check-should-automate")
REAL_BIN = os.path.join(HOME, ".opencode", "bin", "opencode")


def run_patcher() -> None:
    if os.path.isfile(PATCHER):
        subprocess.run(
            ["python3", PATCHER],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )


def extract_prompt(argv: list[str]) -> tuple[str | None, str | None, int | None]:
    if argv and argv[0] == "run" and len(argv) > 1:
        return "run", " ".join(argv[1:]), 1
    for idx, arg in enumerate(argv):
        if arg == "--prompt" and idx + 1 < len(argv):
            return "prompt", argv[idx + 1], idx + 1
    return None, None, None


def check_prompt(prompt: str) -> dict | None:
    if not os.path.isfile(CHECKER) or not os.access(CHECKER, os.X_OK):
        return None
    proc = subprocess.run(
        [CHECKER, "--json", prompt], capture_output=True, text=True, check=False
    )
    if proc.returncode not in (0, 2):
        return None
    try:
        payload = json.loads(proc.stdout)
    except json.JSONDecodeError:
        return None
    if not payload.get("should_automate"):
        return None
    return payload


def build_wrapped_prompt(prompt: str, payload: dict) -> str:
    top = payload.get("top_match") or {}
    template = top.get("template", "http-poller")
    reason = top.get("reason", "This task matches a reusable n8n automation pattern.")
    description = top.get("description", "Automation candidate")
    vars_hint = top.get("example_vars", "")
    lines = [
        "[AUTOMATION PRE-CHECK]",
        f"check-should-automate matched: {description}",
        f"Reason: {reason}",
        f"Recommended template: sin-n8n create {template} --activate",
    ]
    if vars_hint:
        lines.append(f"Suggested vars: {vars_hint}")
    lines.extend(
        [
            "",
            "Before doing this manually, consider building the workflow first.",
            "If manual execution is still required now, continue the task but note the exact reusable workflow you would create afterwards.",
            "",
            "Original request:",
            prompt,
        ]
    )
    return "\n".join(lines)


def prepare_args(argv: list[str]) -> tuple[list[str], dict | None]:
    mode, prompt, value_index = extract_prompt(argv)
    if not prompt:
        return argv, None
    payload = check_prompt(prompt)
    if not payload:
        return argv, None
    wrapped = build_wrapped_prompt(prompt, payload)
    if mode == "run":
        return [argv[0], wrapped], payload
    if mode == "prompt" and value_index is not None:
        updated = list(argv)
        updated[value_index] = wrapped
        return updated, payload
    return argv, None


def main() -> None:
    run_patcher()
    original = sys.argv[1:]
    final_argv, payload = prepare_args(original)
    env = os.environ.copy()
    if payload:
        top = payload.get("top_match") or {}
        env["OPENCODE_AUTOMATION_SHOULD_AUTOMATE"] = "1"
        env["OPENCODE_AUTOMATION_TEMPLATE"] = top.get("template", "")
        env["OPENCODE_AUTOMATION_REASON"] = top.get("reason", "")
        print(
            f"[opencode-wrapper] automation pre-check matched template '{top.get('template', '')}'",
            file=sys.stderr,
        )
    if env.get("OPENCODE_WRAPPER_DRY_RUN") == "1":
        print(
            json.dumps(
                {
                    "original_argv": original,
                    "final_argv": final_argv,
                    "wrapped": bool(payload),
                    "template": (payload or {}).get("top_match", {}).get("template"),
                },
                indent=2,
            )
        )
        return
    os.execve(REAL_BIN, [REAL_BIN, *final_argv], env)


if __name__ == "__main__":
    main()
