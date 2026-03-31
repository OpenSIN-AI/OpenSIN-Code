STEPS_ROTATE = [
    ("steps/workspace/ws00_delete_prev.py", "Vorherigen Workspace-User gelöscht"),
    ("steps/workspace/ws01_auth.py", "Workspace API auth check"),
    ("steps/workspace/ws02_create.py", "Neuen Workspace-User erstellt"),
    (
        "steps/login/login_service_account.py",
        "Token via Service Account Impersonation erstellt",
    ),
    ("steps/token/token02_userinfo.py", "User-Info abgerufen"),
    (
        "steps/token/token02b_provision_managed_project.py",
        "Gemini managed project provisioniert",
    ),
    ("steps/token/token03_save_account.py", "Account gespeichert"),
    ("steps/token/token04_inject.py", "Auth in opencode injiziert"),
    (
        "steps/workspace/ws00_delete_prev.py",
        "Post-Cleanup: alte Workspace-User gelöscht",
    ),
    (
        "steps/workspace/ws99_verify_one_rotator.py",
        "Verify: nur 1 rotator user in Google",
    ),
]
