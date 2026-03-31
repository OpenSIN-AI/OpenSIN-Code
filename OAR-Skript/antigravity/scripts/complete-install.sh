#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$ROOT/logs" "$ROOT/data"
python3 -m pip install -r "$ROOT/requirements.txt"
python3 -m py_compile "$ROOT/telegram_product/api.py" "$ROOT/telegram_product/service.py" "$ROOT/telegram_product/bot.py" "$ROOT/telegram/telegram_bot.py"
echo "complete-install ok"
