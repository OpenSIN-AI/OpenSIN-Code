from .config_path import CONFIG_DIR
def guide_manual_oauth_setup(project_id: str) -> None:
    url = f"https://console.cloud.google.com/auth/clients?project={project_id}"
    print(); print("=" * 65)
    print("  ONE-TIME MANUAL STEP: Create OAuth Client (Desktop App)")
    print("=" * 65); print()
    print(f"  1. Open: {url}"); print()
    print("  2. Click 'CREATE CLIENT'")
    print("     Application type: Desktop App")
    print("     Name: AntigravityRotator"); print()
    print(f"  3. Download the JSON -> save as:")
    print(f"     {CONFIG_DIR / 'oauth_client.json'}"); print()
    print("  4. Configure OAuth Consent Screen (Internal, App: AntigravityRotator)")
    print("  After these steps, run:  python main.py setup")
    print("=" * 65); print()
