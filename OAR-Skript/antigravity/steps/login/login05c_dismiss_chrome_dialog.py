# Atomic: dismiss Chrome "Sign in to Chrome?" profile dialog via osascript
# Non-fatal: dialog may not appear depending on Chrome flags
import subprocess

SCRIPT = '''tell application "System Events"
    tell process "Google Chrome"
        if exists button "Chrome ohne Konto verwenden" of window 1 then
            click button "Chrome ohne Konto verwenden" of window 1
        end if
    end tell
end tell'''

r = subprocess.run(["osascript", "-e", SCRIPT], capture_output=True)
if r.returncode != 0:
    print(f"[login05c] Accessibility not granted or dialog absent — skipping ({r.stderr.strip()[:60]})")
else:
    print("[login05c] Chrome profile dialog dismissed")
