#!/bin/bash
# Wrapper: appends to log instead of truncating. LaunchAgent calls this.
# CRITICAL: crash-sleep guard ensures launchd ThrottleInterval is NEVER hit,
# so KeepAlive restarts this process every single time — Mac restart, Mac sleep,
# crash, anything. Es startet IMMER automatisch.
LOG=/tmp/antigravity-watcher.log
MAX_BYTES=52428800  # 50MB

# Ensure Homebrew python3 is always found in non-login launchd sessions
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export HOME="/Users/jeremy"

# Rotate if log > 50MB
if [ -f "$LOG" ] && [ "$(stat -f%z "$LOG" 2>/dev/null || echo 0)" -gt "$MAX_BYTES" ]; then
    mv "$LOG" "${LOG}.1"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] [wrapper] Starting watcher_runner.py ..." >> "$LOG"

START_TS=$(date +%s)

/opt/homebrew/bin/python3 /Users/jeremy/.open-auth-rotator/antigravity/watcher_runner.py >> "$LOG" 2>&1
EXIT_CODE=$?

END_TS=$(date +%s)
ELAPSED=$(( END_TS - START_TS ))

echo "[$(date '+%Y-%m-%d %H:%M:%S')] [wrapper] watcher_runner.py exited (code=$EXIT_CODE, ran=${ELAPSED}s)" >> "$LOG"

# If it crashed faster than 30s, sleep 15s so launchd ThrottleInterval never
# engages. No throttle = launchd ALWAYS restarts us. Guaranteed.
if [ "$ELAPSED" -lt 30 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [wrapper] Fast exit — sleeping 15s to prevent launchd throttle..." >> "$LOG"
    sleep 15
fi
