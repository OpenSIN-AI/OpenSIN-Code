import requests
from .token_consts import ANTIGRAVITY_USER_AGENT, CLIENT_METADATA_MACOS, LOAD_ENDPOINTS
from .utils_log import log
def _try_load_endpoints(access_token: str) -> str:
    hdrs = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json",
            "User-Agent": ANTIGRAVITY_USER_AGENT, "X-Goog-Api-Client": "google-cloud-sdk vscode_cloudshelleditor/0.1",
            "Client-Metadata": CLIENT_METADATA_MACOS}
    body = {"metadata": {"ideType": "ANTIGRAVITY", "platform": "MACOS", "pluginType": "GEMINI"}}
    for endpoint in LOAD_ENDPOINTS:
        try:
            resp = requests.post(f"{endpoint}/v1internal:loadCodeAssist", headers=hdrs, json=body, timeout=10)
            if not resp.ok: log(f"[token] loadCodeAssist {resp.status_code} at {endpoint}", "WARN"); continue
            data = resp.json()
            project = data.get("cloudaicompanionProject", "")
            pid = project.get("id", "") if isinstance(project, dict) else (project if isinstance(project, str) else "")
            if pid: log(f"[token] projectId={pid}"); return pid
        except Exception as e:
            log(f"[token] loadCodeAssist error at {endpoint}: {e}", "WARN")
    return ""
