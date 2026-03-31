from .gcp_run import _run
from .utils_log import log
REQUIRED_APIS = ["admin.googleapis.com", "oauth2.googleapis.com", "cloudresourcemanager.googleapis.com"]
def enable_apis(project_id: str) -> None:
    for api in REQUIRED_APIS:
        r = _run(["gcloud", "services", "enable", api, f"--project={project_id}"])
        log(f"[gcp_cli] {chr(10003) if r.returncode == 0 else chr(8987)} {api}")
def set_billing_project(project_id: str) -> None:
    _run(["gcloud", "config", "set", "project", project_id])
