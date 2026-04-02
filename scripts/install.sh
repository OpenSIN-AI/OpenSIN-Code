#!/usr/bin/env bash
set -euo pipefail

# SIN Code Installer
# Usage: curl -fsSL https://opensin.ai/install | bash

SINCODE_VERSION="${SINCODE_VERSION:-latest}"
INSTALL_DIR="${OPENCODE_INSTALL_DIR:-${XDG_BIN_DIR:-$HOME/bin}}"

echo "🟢 Installing SIN Code $SINCODE_VERSION..."

if ! command -v node &>/dev/null; then
  echo "❌ Node.js is required but not installed."
  echo "   Install from https://nodejs.org/"
  exit 1
fi

mkdir -p "$INSTALL_DIR"

if [ "$SINCODE_VERSION" = "latest" ]; then
  npm install -g @opensin/code
else
  npm install -g @opensin/code@"$SINCODE_VERSION"
fi

if command -v sincode &>/dev/null; then
  echo ""
  echo "✅ SIN Code installed successfully!"
  echo ""
  sincode --version
  echo ""
  echo "🟢 SIN Code CLI — Part of the SIN Solver Platform"
  echo "📖 Docs: https://opensin.ai/docs/cli"
  echo "🔑 Premium: https://my.openSIN.ai"
else
  echo "❌ Installation failed. Check that $INSTALL_DIR is in your PATH."
  exit 1
fi
