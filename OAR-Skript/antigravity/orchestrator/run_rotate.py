# Orchestrator: full rotation (workspace create + login + token inject + user delete)
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from orchestrator.runner import run
from orchestrator.steps_rotate import STEPS_ROTATE

LOCK_FILE = Path("/tmp/openAntigravity-auth-rotator.lock")

if __name__ == '__main__':
    try:
        run(STEPS_ROTATE)
    finally:
        LOCK_FILE.unlink(missing_ok=True)

