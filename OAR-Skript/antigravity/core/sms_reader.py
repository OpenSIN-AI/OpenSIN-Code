import re, sys
from pathlib import Path
from .utils_log import log
SIN_SOLVER_PATH = Path.home() / "dev" / "SIN-Solver"
if str(SIN_SOLVER_PATH) not in sys.path:
    sys.path.insert(0, str(SIN_SOLVER_PATH))
OTP_PATTERN    = re.compile(r"\b(\d{6})\b")
GOOGLE_SENDERS = ["22000", "+12125551212"]
def _load_reader():
    try:
        from services.workers.shared.sovereign_claw.imessage import IMessageReader
        return IMessageReader(user_number="+0000000000")
    except ImportError as e:
        log(f"[sms_otp] IMessageReader not available: {e}", "WARN"); return None
