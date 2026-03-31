#!/usr/bin/env python3
"""
openAntigravity-auth-rotator — setup
One-time setup. Flow:
  1. GCP CLI: create project + enable APIs (gcloud)
  2. MANUAL (one-time): create OAuth Client in GCP Console → save oauth_client.json
  3. InstalledAppFlow (port 51122) → user clicks Allow → token.json saved
  4. Smoke test: create + delete a test Workspace user
  5. Config saved permanently → watcher can run forever

After setup: token.json + config.json persist. No re-setup needed.
"""
import datetime
import json
import os
import time
from pathlib import Path

from .config import save_config, CONFIG_DIR
from .gcp_cli import run_setup as run_gcp_cli_setup
from .utils import log, apply_nodriver_py314_patch

OAUTH_CLIENT_PATH = CONFIG_DIR / "oauth_client.json"
TOKEN_PATH        = CONFIG_DIR / "token.json"

SCOPES = [
    "https://www.googleapis.com/auth/admin.directory.user",
    "https://www.googleapis.com/auth/admin.directory.user.security",
]

ADMIN_EMAIL = "info@zukunftsorientierte-energie.de"
DOMAIN      = "zukunftsorientierte-energie.de"


# ── Phase 1: GCP CLI setup ───────────────────────────────────────────────────

def _run_gcp_console_phase() -> None:
    """CLI-only: create project + enable APIs. Manual OAuth step if needed."""
    cli_done = run_gcp_cli_setup()
    if not cli_done:
        # Guide was printed — abort until user completes manual step
        raise SystemExit(
            "\n⚠️  Complete the manual OAuth step above, then re-run: python main.py setup"
        )


# ── Phase 2: OAuth flow ───────────────────────────────────────────────────────

def _run_oauth_flow() -> None:
    """InstalledAppFlow: browser → user clicks Allow → token.json saved."""
    from google_auth_oauthlib.flow import InstalledAppFlow

    log("[setup] Running OAuth2 authorization flow...")
    print()
    print("=" * 65)
    print("🔐  EINMALIGE AUTHORISIERUNG  |  ONE-TIME AUTHORIZATION")
    print("=" * 65)
    print()
    print("  Browser-Tab öffnet sich.")
    print(f"  Logge dich ein als: {ADMIN_EMAIL}")
    print("  Klicke 'Zulassen' / 'Allow'")
    print()
    print("  Danach NIE WIEDER nötig — token.json wird dauerhaft gespeichert.")
    print("=" * 65)
    print()

    flow  = InstalledAppFlow.from_client_secrets_file(str(OAUTH_CLIENT_PATH), SCOPES)
    creds = flow.run_local_server(port=51122, open_browser=True)

    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    TOKEN_PATH.write_text(creds.to_json())
    os.chmod(TOKEN_PATH, 0o600)
    log(f"[setup] ✅ token.json saved: {TOKEN_PATH}")


# ── Phase 3: Smoke test ───────────────────────────────────────────────────────

def _smoke_test() -> bool:
    """Create + delete a test user to confirm Admin SDK works."""
    import secrets
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    creds = Credentials.from_authorized_user_info(
        json.loads(TOKEN_PATH.read_text()), SCOPES
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_PATH.write_text(creds.to_json())

    service    = build("admin", "directory_v1", credentials=creds, cache_discovery=False)
    test_email = f"smoketest-{int(time.time())}@{DOMAIN}"

    try:
        log(f"[setup] Smoke test: creating {test_email} ...")
        service.users().insert(body={
            "primaryEmail": test_email,
            "name": {"givenName": "Smoke", "familyName": "Test"},
            "password": secrets.token_urlsafe(20),
            "changePasswordAtNextLogin": False,
            "orgUnitPath": "/",
        }).execute()
        log("[setup] User created ✓ — waiting for propagation ...")
        time.sleep(8)  # Google needs a moment before delete is possible
        service.users().delete(userKey=test_email).execute()
        log("[setup] ✅ Smoke test passed!")
        return True
    except Exception as e:
        log(f"[setup] ❌ Smoke test failed: {e}", "WARN")
        try:
            service.users().delete(userKey=test_email).execute()
        except Exception:
            pass
        return False


# ── Public entry point ────────────────────────────────────────────────────────

def run_setup() -> dict:
    """Full one-time setup. After this, watcher runs forever automatically."""
    apply_nodriver_py314_patch()

    # Phase 1: GCP Console automation → oauth_client.json
    _run_gcp_console_phase()

    # Phase 2: InstalledAppFlow → token.json
    _run_oauth_flow()

    # Phase 3: Smoke test
    ok = _smoke_test()

    if not ok:
        log(
            "[setup] ⚠️  Smoke test failed.\n"
            "  Possible causes:\n"
            "  1. Admin SDK API not yet propagated — wait 60s, re-run setup\n"
            "  2. info@ is not a Super-Admin in the Workspace\n"
            "  Re-run: python main.py setup",
            "WARN",
        )

    # Phase 4: Save config
    cfg = {
        "admin_email":       ADMIN_EMAIL,
        "workspace_domain":  DOMAIN,
        "setup_completed":   True,
        "smoke_test_passed": ok,
        "setup_date":        datetime.datetime.now().isoformat(),
        "admin_refresh_token": True,  # sentinel: token.json is the source of truth
    }
    save_config(cfg)

    print()
    print("=" * 65)
    print("✅  SETUP COMPLETE!" if ok else "⚠️   SETUP SAVED (smoke test failed)")
    print(f"    Admin:  {ADMIN_EMAIL}")
    print(f"    Domain: {DOMAIN}")
    print(f"    Token:  {TOKEN_PATH}")
    print(f"    Config: {CONFIG_DIR / 'config.json'}")
    print("=" * 65)
    print()

    return cfg
