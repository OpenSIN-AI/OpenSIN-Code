from .config_path import CONFIG_DIR
from .gcp_run import _run
from .utils_log import log
PROJECT_ID_CACHE = CONFIG_DIR / "project_id.txt"
def get_or_create_project(project_id: str = "antigravity-rotator") -> str:
    if PROJECT_ID_CACHE.exists():
        cached = PROJECT_ID_CACHE.read_text().strip()
        if cached: log(f"[gcp_cli] Using cached project: {cached}"); return cached
    r = _run(["gcloud", "projects", "describe", project_id, "--format=value(projectId)"], check=False)
    if r.returncode == 0 and r.stdout.strip():
        log(f"[gcp_cli] Project already exists: {project_id}")
    else:
        r2 = _run(["gcloud", "projects", "create", project_id, "--name=AntigravityRotator"])
        if r2.returncode != 0: raise RuntimeError(f"Failed to create project: {r2.stderr}")
        log(f"[gcp_cli] Created project: {project_id}")
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    PROJECT_ID_CACHE.write_text(project_id)
    return project_id
