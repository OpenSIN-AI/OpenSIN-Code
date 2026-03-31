# Atomic: list all rotator workspace users
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from core.workspace_list import list_rotator_users

def main():
    users = list_rotator_users()
    print(f"[ws05] Rotator users ({len(users)}):")
    for u in users:
        print(f"  - {u.get('primaryEmail', '?')}")

if __name__ == '__main__':
    main()
