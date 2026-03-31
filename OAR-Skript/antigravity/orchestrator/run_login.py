# Orchestrator: login-only flow (chrome open → login → token → chrome close)
import sys; from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from orchestrator.runner import run
from orchestrator.steps_list import STEPS

if __name__ == '__main__': run(STEPS)
