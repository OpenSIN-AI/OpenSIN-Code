#!/usr/bin/env python3
"""
Antigravity Auth Rotator Watcher
Monitors for rate limits and triggers auto-rotation
"""
import time
import json
from pathlib import Path
from datetime import datetime

CONFIG_FILE = Path.home() / ".config" / "opencode" / "antigravity_config.json"
RATE_LIMIT_THRESHOLD = 3  # Trigger rotation after 3 rate limit errors
CHECK_INTERVAL = 300  # Check every 5 minutes

def check_rate_limits():
    """Check if we've hit rate limits"""
    if not CONFIG_FILE.exists():
        return False
    
    config = json.loads(CONFIG_FILE.read_text())
    rate_limit_times = config.get("rateLimitResetTimes", {})
    
    now = time.time()
    recent_limits = [
        t for t in rate_limit_times.values()
        if t > now - 3600  # Last hour
    ]
    
    return len(recent_limits) >= RATE_LIMIT_THRESHOLD

def trigger_rotation():
    """Trigger rotation via CLI"""
    import subprocess
    
    print(f"[{datetime.now().isoformat()}] Rate limit detected! Starting rotation...")
    
    try:
        result = subprocess.run(
            ["python3", "main.py", "rotate"],
            cwd=Path.home() / "dev" / "openAntigravity-auth-rotator",
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print("✅ Rotation successful!")
            return True
        else:
            print(f"❌ Rotation failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Rotation error: {e}")
        return False

def watch_loop():
    """Main watch loop"""
    print(f"👁️  Starting Antigravity Watcher (checking every {CHECK_INTERVAL}s)...")
    print("Press Ctrl+C to stop")
    
    last_rotation = None
    
    while True:
        try:
            if check_rate_limits():
                now = time.time()
                if last_rotation and (now - last_rotation) < 3600:
                    print("⏳ Rotation already performed recently, skipping...")
                else:
                    print("⚠️  Rate limits detected!")
                    if trigger_rotation():
                        last_rotation = now
            else:
                print(f"✓ OK (checked at {datetime.now().strftime('%H:%M:%S')})")
            
            time.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            print("\n👋 Watcher stopped")
            break
        except Exception as e:
            print(f"⚠️  Error: {e}")
            time.sleep(60)

if __name__ == "__main__":
    watch_loop()
