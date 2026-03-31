# Atomic: call onboardUser to provision managed GCP project for new account
import sys, json, time, urllib.request, urllib.parse
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

TOKENS_FILE = Path("logs/tokens.json")
CLIENT_ID     = "1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com"
CLIENT_SECRET = "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"
ENDPOINTS = [
    "https://cloudcode-pa.googleapis.com",
    "https://daily-cloudcode-pa.sandbox.googleapis.com",
]

def _onboard(access: str) -> str:
    body = json.dumps({"tierId": "free-tier", "metadata": {
        "ideType": "ANTIGRAVITY", "platform": 2, "pluginType": "GEMINI"
    }}).encode()
    for ep in ENDPOINTS:
        for _ in range(8):
            try:
                req = urllib.request.Request(f"{ep}/v1internal:onboardUser", data=body,
                    headers={"Content-Type": "application/json", "Authorization": f"Bearer {access}"},
                    method="POST")
                with urllib.request.urlopen(req, timeout=10) as r:
                    p = json.loads(r.read())
                m = (p.get("response") or {}).get("cloudaicompanionProject", {})
                mid = m.get("id", "") if isinstance(m, dict) else str(m)
                if p.get("done") and mid:
                    return mid
            except Exception:
                pass
            time.sleep(0.2)
    return ""

def main():
    tokens = json.loads(TOKENS_FILE.read_text())
    managed_id = _onboard(tokens["access_token"])
    if not managed_id:
        print("[token02b] WARN: onboardUser did not return managedProjectId – will use fallback")
    else:
        tokens["managed_project_id"] = managed_id
        TOKENS_FILE.write_text(json.dumps(tokens, indent=2))
    print(f"[token02b] managedProjectId: {managed_id or '(none)'}")

if __name__ == "__main__":
    main()
