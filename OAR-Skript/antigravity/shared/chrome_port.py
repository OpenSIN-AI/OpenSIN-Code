# Single action: provides CDP_PORT constant and port file path
from pathlib import Path

CDP_PORT = 9224
PORT_FILE = Path(__file__).parent.parent / "logs" / "chrome_cdp_port.txt"

def write_port(port: int = CDP_PORT) -> None:
    PORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    PORT_FILE.write_text(str(port))

def read_port() -> int:
    return int(PORT_FILE.read_text().strip())
