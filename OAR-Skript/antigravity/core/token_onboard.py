import json, time, urllib.request
from .utils_log import log

ONBOARD_ENDPOINTS = [
    "https://cloudcode-pa.googleapis.com",
    "https://daily-cloudcode-pa.sandbox.googleapis.com",
]

def provision_managed_project(access_token: str) -> str:
    """Call onboardUser to provision GCP managed project for a brand-new Workspace user."""
    body = json.dumps({"tierId": "free-tier", "metadata": {
        "ideType": "ANTIGRAVITY", "platform": 2, "pluginType": "GEMINI"
    }}).encode()
    hdrs = {"Content-Type": "application/json", "Authorization": f"Bearer {access_token}"}
    for ep in ONBOARD_ENDPOINTS:
        for attempt in range(15):
            try:
                req = urllib.request.Request(
                    f"{ep}/v1internal:onboardUser", data=body, headers=hdrs, method="POST")
                with urllib.request.urlopen(req, timeout=12) as r:
                    p = json.loads(r.read())
                m = (p.get("response") or {}).get("cloudaicompanionProject", {})
                mid = m.get("id", "") if isinstance(m, dict) else str(m or "")
                if p.get("done") and mid:
                    log(f"[token] onboardUser → managedProjectId={mid}")
                    return mid
                if not p.get("done"):
                    time.sleep(1.0); continue
            except Exception as e:
                log(f"[token] onboardUser error at {ep} attempt {attempt}: {e}", "WARN")
                time.sleep(0.5)
    log("[token] onboardUser: could not provision managedProjectId", "WARN")
    return ""
