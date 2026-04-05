#!/usr/bin/env bash
set -euo pipefail
echo "🧪 Running test suite..."
npm test -- --coverage --ci
echo "✅ Tests passed"
