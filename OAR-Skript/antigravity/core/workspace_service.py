import json
from .config_path import CONFIG_DIR
from .config_load import load_config
TOKEN_PATH = CONFIG_DIR / "token.json"
SCOPES = ["https://www.googleapis.com/auth/admin.directory.user",
          "https://www.googleapis.com/auth/admin.directory.user.security"]
def _build_service():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    if not TOKEN_PATH.exists():
        raise RuntimeError(f"token.json not found at {TOKEN_PATH}\nRun: python main.py setup")
    creds = Credentials.from_authorized_user_info(json.loads(TOKEN_PATH.read_text()), SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request()); TOKEN_PATH.write_text(creds.to_json())
    return build("admin", "directory_v1", credentials=creds, cache_discovery=False)
def _get_domain() -> str:
    return load_config().get("workspace_domain", "zukunftsorientierte-energie.de")
