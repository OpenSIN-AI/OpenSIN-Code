import json
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path

TELEGRAM_CONFIG = Path.home() / ".config" / "opencode" / "telegram_config.json"


def notify(title: str, message: str) -> None:
    t = title.replace('"', '\\"').replace("'", "\\'")
    m = message.replace('"', '\\"').replace("'", "\\'")
    script = f'display notification "{m}" with title "{t}" sound name "Submarine"'
    try:
        subprocess.run(["osascript", "-e", script], capture_output=True, timeout=5)
    except Exception:
        pass


def send_telegram(msg: str) -> None:
    try:
        if not TELEGRAM_CONFIG.exists():
            return
        conf = json.loads(TELEGRAM_CONFIG.read_text())
        bot_token = conf.get("bot_token")
        chat_id = conf.get("chat_id")
        if not bot_token or not chat_id:
            return
        prefix = "\U0001f504 <b>[Antigravity-Rotator]</b>\n\n"
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        data = urllib.parse.urlencode(
            {"chat_id": chat_id, "text": prefix + msg, "parse_mode": "HTML"}
        ).encode()
        urllib.request.urlopen(url, data=data, timeout=10)
    except Exception:
        pass
