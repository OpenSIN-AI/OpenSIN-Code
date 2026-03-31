from .config_path import CONFIG_DIR
from .gcp_project import get_or_create_project
from .gcp_apis import enable_apis, set_billing_project
from .gcp_guide import guide_manual_oauth_setup
from .utils_log import log
def run_setup(project_id: str = "antigravity-rotator") -> bool:
    project_id = get_or_create_project(project_id)
    set_billing_project(project_id)
    enable_apis(project_id)
    oauth_path = CONFIG_DIR / "oauth_client.json"
    if oauth_path.exists():
        log(f"[gcp_cli] oauth_client.json found: {oauth_path}")
        return True
    guide_manual_oauth_setup(project_id)
    return False
