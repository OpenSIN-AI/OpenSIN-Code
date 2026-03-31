import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from core.main_args import _build_parser
from core.main_dispatch import dispatch
if __name__ == "__main__":
    dispatch(_build_parser().parse_args())
