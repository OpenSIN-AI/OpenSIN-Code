#!/usr/bin/env bash
# install.sh — setup openAntigravity-auth-rotator
set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$HOME/.local/bin"
LAUNCH_AGENTS="$HOME/Library/LaunchAgents"
PLIST="com.openantigravity.ratelimit-watcher.plist"

echo "→ Installing Python dependencies ..."
pip install -r "$REPO/requirements.txt" --quiet

echo "→ Applying nodriver Python 3.14 patch if needed ..."
python3 -c "
import pathlib, site
for sp in site.getsitepackages():
    p = pathlib.Path(sp) / 'nodriver/cdp/network.py'
    if p.exists():
        c = p.read_bytes()
        if b'\xb1' in c:
            p.write_bytes(c.replace(b'\xb1', b'+-'))
            print('Patched', p)
        break
"

echo "→ Creating symlink in $BIN_DIR ..."
mkdir -p "$BIN_DIR"
ln -sf "$REPO/main.py" "$BIN_DIR/openAntigravity-auth-rotator"
chmod +x "$REPO/main.py"

echo "→ Creating symlink for watcher ..."
ln -sf "$REPO/watcher_runner.py" "$BIN_DIR/openAntigravity-ratelimit-watcher"
chmod +x "$REPO/watcher_runner.py"

echo "→ Installing LaunchAgent ..."
mkdir -p "$LAUNCH_AGENTS"
cp "$REPO/$PLIST" "$LAUNCH_AGENTS/$PLIST"
echo ""
echo "⚠️  Edit $LAUNCH_AGENTS/$PLIST and fill in:"
echo "    GOOGLE_WORKSPACE_SA_PATH  — path to service account JSON"
echo "    WORKSPACE_ADMIN_EMAIL     — Workspace super-admin email"
echo ""
echo "Then load with:"
echo "    launchctl load $LAUNCH_AGENTS/$PLIST"
echo ""
echo "Done ✓"
