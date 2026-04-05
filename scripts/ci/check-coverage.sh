#!/usr/bin/env bash
set -euo pipefail
echo "📈 Checking coverage threshold..."
COVERAGE=$(npm test -- --coverage --silent 2>&1 | grep -oP 'All files\s*\|\s*\K\d+' || echo "0")
if [ "$COVERAGE" -lt 80 ]; then
  echo "❌ Coverage $COVERAGE% is below 80% threshold"
  exit 1
fi
echo "✅ Coverage $COVERAGE% meets threshold"
