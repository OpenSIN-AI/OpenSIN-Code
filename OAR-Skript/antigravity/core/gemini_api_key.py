from .gcp_run import _run
from .utils_log import log


def enable_gemini_api(project_id: str) -> bool:
    r = _run(
        [
            "gcloud",
            "services",
            "enable",
            "generativelanguage.googleapis.com",
            f"--project={project_id}",
        ],
        check=False,
    )
    if r.returncode == 0:
        log("[gemini_api] Enabled generativelanguage.googleapis.com")
        return True
    log("[gemini_api] Failed to enable Gemini API", "WARN")
    return False


def list_api_keys(project_id: str) -> list:
    r = _run(
        [
            "gcloud",
            "services",
            "api-keys",
            "list",
            f"--project={project_id}",
            "--format=json",
        ],
        check=False,
    )
    if r.returncode == 0:
        import json

        try:
            return json.loads(r.stdout) or []
        except Exception:
            pass
    return []


def get_key_string(project_id: str, key_name: str) -> str | None:
    r = _run(
        [
            "gcloud",
            "services",
            "api-keys",
            "get-key-string",
            key_name,
            f"--project={project_id}",
        ],
        check=False,
    )
    if r.returncode == 0:
        return r.stdout.strip()
    return None


def create_api_key(project_id: str, key_name: str = None) -> str | None:
    import time

    if key_name is None:
        key_name = f"rotator-{int(time.time())}"

    r = _run(
        [
            "gcloud",
            "beta",
            "services",
            "api-keys",
            "create",
            f"--display-name={key_name}",
            f"--project={project_id}",
        ],
        check=False,
    )

    if r.returncode != 0:
        log(f"[gemini_api] Failed to create key: {r.stderr}", "WARN")
        return None

    time.sleep(2)

    keys = list_api_keys(project_id)
    for k in keys:
        if key_name in k.get("displayName", ""):
            key_id = k.get("name", "").split("/")[-1]
            key_str = get_key_string(project_id, key_id)
            if key_str:
                log(f"[gemini_api] Created new key: {key_id}")
                return key_str
    return None


def get_or_create_gemini_api_key(project_id: str) -> str | None:
    if not enable_gemini_api(project_id):
        return None
    return create_api_key(project_id)
