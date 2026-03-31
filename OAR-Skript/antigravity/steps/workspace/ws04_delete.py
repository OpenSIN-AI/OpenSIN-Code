# Atomic: delete workspace user after token rotation is complete
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from pathlib import Path
import json
from core.workspace_delete import delete_workspace_user

def main():
    user = json.loads(Path("logs/credentials.json").read_text())
    delete_workspace_user(user["email"])
    print(f"[ws04] Workspace user deleted: {user['email']}")

if __name__ == '__main__':
    main()
