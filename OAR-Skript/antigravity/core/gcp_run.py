import subprocess
import os
from .utils_log import log

GCLOUD_PATH = "/opt/homebrew/Caskroom/gcloud-cli/560.0.0/google-cloud-sdk/bin"


def _run(cmd: list, check: bool = True) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env["PATH"] = GCLOUD_PATH + ":" + env.get("PATH", "")
    log(f"[gcp_cli] $ {chr(32).join(cmd)}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    except FileNotFoundError:
        log(f"[gcp_cli] {cmd[0]} not installed — skipping", "WARN")
        return subprocess.CompletedProcess(
            cmd, returncode=127, stdout="", stderr="not found"
        )
    if check and result.returncode != 0:
        log(f"[gcp_cli] FAILED: {result.stderr.strip()}", "WARN")
    return result
