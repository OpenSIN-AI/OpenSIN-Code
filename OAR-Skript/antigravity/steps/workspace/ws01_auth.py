# Atomic: build Google Admin Directory service (auth check)
import sys; sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent.parent))
from core.workspace_service import _build_service

def main():
    svc = _build_service()
    print(f"[ws01] Workspace API service ready: {type(svc).__name__}")

if __name__ == '__main__':
    main()
