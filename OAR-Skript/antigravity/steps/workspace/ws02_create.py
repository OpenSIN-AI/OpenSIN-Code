# Atomic: create a new Google Workspace user for rotation.
# Saves current credentials.json → prev_credentials.json before overwriting.
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from pathlib import Path
import json
from core.workspace_create import create_workspace_user

def main():
    Path("logs").mkdir(exist_ok=True)
    cur = Path("logs/credentials.json")
    if cur.exists():
        cur.rename(Path("logs/prev_credentials.json"))
    user = create_workspace_user()
    cur.write_text(json.dumps(user, indent=2))
    print(f"[ws02] Created workspace user: {user['email']}")

if __name__ == '__main__':
    main()
